pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 15, unit: 'MINUTES') // Reduced timeout for simpler build
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
                    // 1. Transfer docker-compose to the Dev Server
                    sh "scp -o StrictHostKeyChecking=no docker-compose.yml ${DEV_SERVER}:~/docker-compose.yml"
                    
                    // 2. Simple restart of the app container
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEV_SERVER} "
                            # Pulling isn't needed if you build locally, 
                            # but we ensure the container restarts with the new image
                            docker-compose up -d --force-recreate app
                            docker image prune -f
                        "
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Frontend deployed to http://172.31.15.225"
        }
        always {
            script { if (env.NODE_NAME) { cleanWs() } }
        }
    }
}