pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time:8, unit: 'MINUTES')
    }

    environment {
        APP_NAME     = 'planzo-web'
        DEV_SERVER   = "ubuntu@172.31.15.225"
        DOCKER_IMAGE = "${APP_NAME}:latest"
    }

    stages {
        stage('Checkout') {
          
            steps {
                checkout scm
            }
        }
        stage('Install & Build') {
            steps {
                withCredentials([
                    string(credentialsId: 'VITE_GOOGLE_MAPS_API_KEY', variable: 'MAPS_KEY'),
                    string(credentialsId: 'VITE_STRIPE_PUBLISHABLE_KEY', variable: 'STRIPE_KEY')
                ]) {
                    sh 'npm install --prefer-offline --no-audit --no-fund'
                    sh "VITE_GOOGLE_MAPS_API_KEY=${MAPS_KEY} VITE_STRIPE_PUBLISHABLE_KEY=${STRIPE_KEY} npm run build"
                }
            }
        }

        stage('Docker Build') {
            steps {
                echo "=== Building Frontend Image ==="
                sh "docker build -t ${DOCKER_IMAGE} ."
            }
        }

        stage('Remote Deploy') {
          steps {
            script {
              // 1. Save the image on Jenkins and pipe it to the Dev Server over SSH.
              echo "=== Transferring Image to Dev Server ==="
              sh "docker save ${DOCKER_IMAGE} | ssh -o StrictHostKeyChecking=no ${DEV_SERVER} 'docker load'"

              // 2. Transfer docker-compose.yml
              sh "scp -o StrictHostKeyChecking=no docker-compose.yml ${DEV_SERVER}:~/docker-compose.yml"
              
              // 3. Deploy without pulling
              sh """
                  ssh -o StrictHostKeyChecking=no ${DEV_SERVER} "
                      # --no-build tells compose to use the image we just 'loaded'
                      docker compose up -d --force-recreate app
                      docker image prune -f
                  "
                """
            }
          }
        }
    }
    post {
        success {
            withCredentials([string(credentialsId: 'PLANZO_SLACK_WEBHOOK', variable: 'SLACK_URL')]) {
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"✅ *Planzo Build #${env.BUILD_NUMBER} Success!* \nDeployed to: http://172.31.15.225"}' \
                    ${SLACK_URL}
                """
            }
        }
        failure {
            withCredentials([string(credentialsId: 'PLANZO_SLACK_WEBHOOK', variable: 'SLACK_URL')]) {
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"❌ *Planzo Build #${env.BUILD_NUMBER} FAILED.* \nCheck logs: ${env.BUILD_URL}"}' \
                    ${SLACK_URL}
                """
            }
        }
        always {
            script { if (env.NODE_NAME) { cleanWs() } }
        }
    }
}