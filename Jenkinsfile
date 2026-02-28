pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
  }

  environment {
    APP_NAME     = 'planzo-web'
    // Updated to your verified Private IP
    DEV_SERVER   = "ubuntu@172.31.15.225"
    DOCKER_IMAGE = "${APP_NAME}:latest"
  }

  stages {
    stage('Checkout') {
      steps {
        // Using 'scm' automatically uses the branch that triggered the webhook
        checkout scm
      }
    }

    stage('Install & Build') {
      steps {
        withCredentials([
          string(credentialsId: 'VITE_GOOGLE_MAPS_API_KEY', variable: 'MAPS_KEY'),
          string(credentialsId: 'VITE_STRIPE_PUBLISHABLE_KEY', variable: 'STRIPE_KEY')
        ]) {
          sh 'NODE_OPTIONS="--max-old-space-size=512" npm install --prefer-offline --no-audit --no-fund'
          // Injecting variables into the Vite build
          sh "VITE_GOOGLE_MAPS_API_KEY=${MAPS_KEY} VITE_STRIPE_PUBLISHABLE_KEY=${STRIPE_KEY} npm run build"
        }
      }
    }

    stage('Docker Build!') {
      steps {
        echo "=== Building Docker image ==="
        sh 'docker build --cpu-quota=50000 --memory="1g" -t ${DOCKER_IMAGE} .'
      }
    }

    stage('Remote Deploy') {
      steps {
        withCredentials([
          string(credentialsId: 'POSTGRES_USER', variable: 'DB_USER'),
          string(credentialsId: 'POSTGRES_PASSWORD', variable: 'DB_PASS'),
          string(credentialsId: 'POSTGRES_DB', variable: 'DB_NAME')
        ]) {
          script {
            // 1. Transfer docker-compose to the Dev Server
            sh "scp -o StrictHostKeyChecking=no docker-compose.yml ${DEV_SERVER}:~/docker-compose.yml"
            
            // 2. Execute deployment on remote host
            sh """
              ssh -o StrictHostKeyChecking=no ${DEV_SERVER} "
                export POSTGRES_USER=${DB_USER}
                export POSTGRES_PASSWORD=${DB_PASS}
                export POSTGRES_DB=${DB_NAME}
                
                # Pull/Restart containers
                docker-compose up -d db
                
                echo 'Waiting for database health...'
                # Wait for PostGIS to be ready before starting the app
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
    success {
      echo "✅ Planzo deployed successfully to ${DEV_SERVER}"
    }
    always {
      // Only clean if node was actually assigned to avoid FilePath error
      script { if (env.NODE_NAME) { cleanWs() } }
    }
  }
}