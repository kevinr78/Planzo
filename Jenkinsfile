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
        
     stage('Docker Build & Package') {
            steps {
                echo "=== Building Image (NPM Install & Vite Build happen here) ==="
                // Pass your API keys as Build Args so the Dockerfile can use them
                withCredentials([
                    string(credentialsId: 'VITE_GOOGLE_MAPS_API_KEY', variable: 'MAPS_KEY'),
                    string(credentialsId: 'VITE_STRIPE_PUBLISHABLE_KEY', variable: 'STRIPE_KEY')
                ]) {
                    sh """
                        docker build \
                        --build-arg VITE_GOOGLE_MAPS_API_KEY=${MAPS_KEY} \
                        --build-arg VITE_STRIPE_PUBLISHABLE_KEY=${STRIPE_KEY} \
                        -t ${DOCKER_IMAGE} .
                    """
                }
            }
        }
    stage('Remote Deploy') {
        steps {
            script {
                def targetServer = (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master') ? DEV_SERVER : QA_SERVER
                def envName = (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master') ? "PRODUCTION (Dev)" : "QA/STAGING"
                withCredentials([
                    string(credentialsId: 'POSTGRES_USER', variable: 'DB_USER'),
                    string(credentialsId: 'POSTGRES_PASSWORD', variable: 'DB_PASS'),
                    string(credentialsId: 'POSTGRES_DB', variable: 'DB_NAME')
                ]) {
                    // 1. Transfer Image & Compose file
                    sh "docker save ${DOCKER_IMAGE} | ssh -o StrictHostKeyChecking=no ${targetServer} 'docker load'"
                    sh "scp -o StrictHostKeyChecking=no docker-compose.yml ${targetServer}:~/docker-compose.yml"
                    
                    // 2. Deploy with Health Check
                    sh """
                        ssh -o StrictHostKeyChecking=no ${targetServer} "
                            export POSTGRES_USER=${DB_USER}
                            export POSTGRES_PASSWORD=${DB_PASS}
                            export POSTGRES_DB=${DB_NAME}

                            docker compose up -d db
                            
                            echo 'Waiting for PostGIS health...'
                            until [ \\\$(docker inspect -f '{{.State.Health.Status}}' planzo-db) == 'healthy' ]; do 
                                sleep 2
                            done

                            docker compose up -d app
                            docker image prune -f
                        "
                    """
                }
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