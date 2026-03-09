pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 8, unit: 'MINUTES')
    }

    environment {
        APP_NAME     = 'planzo-web'
        DOCKER_IMAGE = "${APP_NAME}:latest"
        // Base Servers
        DEV_SERVER   = "ubuntu@172.31.15.225"
        QA_SERVER    = "ubuntu@172.31.3.1"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install & Builds') {
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
                sh "docker build -t ${DOCKER_IMAGE} ."
            }
        }

        stage('Remote Deploy') {
            steps {
                script {
                    // Determine Target Server based on Branch
                    def targetServer = (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master') ? DEV_SERVER : QA_SERVER
                    def envName = (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master') ? "PRODUCTION (Dev)" : "QA/STAGING"
                    
                    echo "=== Deploying to ${envName} at ${targetServer} ==="

                    // 1. Transfer Image
                    sh "docker save ${DOCKER_IMAGE} | ssh -o StrictHostKeyChecking=no ${targetServer} 'docker load'"

                    // 2. Transfer docker-compose.yml
                    sh "scp -o StrictHostKeyChecking=no docker-compose.yml ${targetServer}:~/docker-compose.yml"
                    
                    // 3. Remote Execution
                    sh """
                        ssh -o StrictHostKeyChecking=no ${targetServer} "
                            docker compose up -d --force-recreate app
                            docker image prune -f
                        "
                    """
                    
                    // Save for Slack notification
                    env.DEPLOY_TARGET_IP = targetServer.split('@')[1]
                    env.ENV_LABEL = envName
                }
            }
        }
    }

    post {
        success {
            withCredentials([string(credentialsId: 'PLANZO_SLACK_WEBHOOK', variable: 'SLACK_URL')]) {
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"✅ *Build #${env.BUILD_NUMBER} Success* \n*Env:* ${env.ENV_LABEL} \n*URL:* http://${env.DEPLOY_TARGET_IP}"}' \
                    ${SLACK_URL}
                """
            }
        }
        failure {
            withCredentials([string(credentialsId: 'PLANZO_SLACK_WEBHOOK', variable: 'SLACK_URL')]) {
                sh """
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"❌ *Build #${env.BUILD_NUMBER} FAILED* \n*Branch:* ${env.BRANCH_NAME} \n*Logs:* ${env.BUILD_URL}"}' \
                    ${SLACK_URL}
                """
            }
        }
        always {
            script { 
                cleanWs()
                sh "docker rmi ${DOCKER_IMAGE} || true"
                sh "docker image prune -f"
            }
        }
    }
}