pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

environment {
    APP_NAME      = 'planzo-web'
    DEV_SERVER    = "ubuntu@172.31.6.31"
    
    // Map the Secret Text IDs to local variables
    MAPS_KEY      = credentials('VITE_GOOGLE_MAPS_API_KEY')
    STRIPE_KEY    = credentials('VITE_STRIPE_PUBLISHABLE_KEY')
    DB_USER       = credentials('POSTGRES_USER')
    DB_PASS       = credentials('POSTGRES_PASSWORD')
    
    // Mapping the Username/Password for GitHub
    GIT_CREDS     = credentials('github-token')
}

    stages {
        stage('Checkout') {
            steps {
                // Using the GIT_CREDS to authenticate the checkout
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
                echo '=== Installing npm dependencies ==='
                sh 'npm ci --prefer-offline'
            }
        }

        stage('Build Frontend') {
            steps {
                // Using the variables defined in the environment block
                sh "VITE_GOOGLE_MAPS_API_KEY=${MAPS_KEY} VITE_STRIPE_PUBLISHABLE_KEY=${STRIPE_KEY} npm run build"
                echo "Build complete. Artifact: dist/"

            }
        }

        stage('Docker Build') {
            steps {
              echo "=== Building Docker image ==="

                sh "docker build -t ${APP_NAME}:latest ."
            }
        }
stage('Remote Deploy Stage') {
    steps {
        script {
            // 1. Transfer docker-compose to Dev Server
            sh "scp -o StrictHostKeyChecking=no docker-compose.yml ${DEV_SERVER}:~/docker-compose.yml"
            
            // 2. Execute Deployment using bracketed variables
            sh """
                ssh -o StrictHostKeyChecking=no ${DEV_SERVER} "
                    export POSTGRES_USER=${DB_USER}
                    export POSTGRES_PASSWORD=${DB_PASS}
                    
                    cd ~
                    docker-compose up -d db
                    
                    echo 'Waiting for PostGIS...'
                    # Use triple backslash for the remote shell variable
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

    post {
        success {
            echo "✅ Deployment Complete"
        }
        always {
            // Secure cleanup: only runs if a workspace actually exists
            script {
                if (env.NODE_NAME) {
                    cleanWs()
                }
            }
        }
    }
}