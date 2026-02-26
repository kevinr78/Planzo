pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        APP_NAME     = 'planzo-web'
        DEV_SERVER   = "ubuntu@172.31.6.31"
        // REMOVED the DB and Map keys from here to prevent the early crash
    }

    stages {
        stage('Checkout') {
            steps {
                checkout([$class: 'GitSCM', 
                    branches: [[name: '*/test_jenkins']], 
                    userRemoteConfigs: [[
                        url: 'https://github.com/kevinr78/Planzo.git',
                        credentialsId: 'github-token' 
                    ]]
                ])
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci --prefer-offline'
            }
        }

        stage('Build Frontend') {
            steps {
                // Use withCredentials here so the build only fails if keys are missing during the build stage
                withCredentials([
                    string(credentialsId: 'VITE_GOOGLE_MAPS_API_KEY', variable: 'MAPS_KEY'),
                    string(credentialsId: 'VITE_STRIPE_PUBLISHABLE_KEY', variable: 'STRIPE_KEY')
                ]) {
                    sh "VITE_GOOGLE_MAPS_API_KEY=${MAPS_KEY} VITE_STRIPE_PUBLISHABLE_KEY=${STRIPE_KEY} npm run build"
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${APP_NAME}:latest ."
            }
        }

        stage('Remote Deploy Stage') {
            steps {
                // The withCredentials block MUST wrap the script/sh commands
                withCredentials([
                    string(credentialsId: 'POSTGRES_USER', variable: 'DB_USER'),
                    string(credentialsId: 'POSTGRES_PASSWORD', variable: 'DB_PASS')
                ]) {
                    script {
                        sh "scp -o StrictHostKeyChecking=no docker-compose.yml ${DEV_SERVER}:~/docker-compose.yml"
                        sh """
                            ssh -o StrictHostKeyChecking=no ${DEV_SERVER} "
                                export POSTGRES_USER=${DB_USER}
                                export POSTGRES_PASSWORD=${DB_PASS}
                                cd ~
                                docker-compose up -d db
                                echo 'Waiting for PostGIS...'
                                until [ \\\$(docker inspect -f '{{.State.Health.Status}}' planzo-db) == 'healthy' ]; do 
                                    sleep 2
                                done
                                docker-compose up -d app
                            "
                        """
                    }
                }
            }
        }
    }

    post {
        success { echo "✅ Deployment Complete" }
    }
}