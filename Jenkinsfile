pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 10, unit: 'MINUTES')
    }

    environment {
        DEV_SERVER = "ubuntu@172.31.6.31"
    }

    stages {
        stage('Test 1: Credentials Validation') {
            steps {
                echo "=== Checking Credential Availability ==="
                // withCredentials will fail the stage immediately if the ID is missing
                withCredentials([
                    string(credentialsId: 'VITE_GOOGLE_MAPS_API_KEY', variable: 'MAPS_KEY'),
                    string(credentialsId: 'VITE_STRIPE_PUBLISHABLE_KEY', variable: 'STRIPE_KEY'),
                    string(credentialsId: 'POSTGRES_USER', variable: 'DB_USER'),
                    string(credentialsId: 'POSTGRES_PASSWORD', variable: 'DB_PASS'),
                    usernamePassword(credentialsId: 'github_token', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PAT')
                ]) {
                    script {
                        // We check length/presence so we don't leak the actual secrets in logs
                        if (MAPS_KEY) echo "✅ VITE_GOOGLE_MAPS_API_KEY is loaded (Length: ${MAPS_KEY.length()})"
                        if (STRIPE_KEY) echo "✅ VITE_STRIPE_PUBLISHABLE_KEY is loaded"
                        if (DB_USER) echo "✅ POSTGRES_USER is loaded: ${DB_USER}"
                        if (DB_PASS) echo "✅ POSTGRES_PASSWORD is loaded"
                        if (GIT_USER) echo "✅ github_token is loaded for user: ${GIT_USER}"
                    }
                }
            }
        }

        stage('Test 2: Build Tool Presence') {
            steps {
                echo "=== Checking Software on Jenkins EC2 ==="
                sh 'node -v || echo "❌ Node.js not found"'
                sh 'npm -v || echo "❌ npm not found"'
                sh 'docker --version || echo "❌ Docker not found"'
            }
        }

        stage('Test 3: Dev Server Connectivity') {
            steps {
                echo "=== Testing SSH Connection to ${DEV_SERVER} ==="
                // Runs a simple uptime command on the remote server
                sh """
                    ssh -o StrictHostKeyChecking=no ${DEV_SERVER} "
                        echo 'Successfully connected to Dev EC2!'
                        echo 'Server Uptime:' && uptime
                        echo 'Checking Docker on Dev Server:' && docker --version
                    "
                """
            }
        }
    }

    post {
        success {
            echo "✅ All Administrative checks passed!"
        }
        failure {
            echo "❌ One or more checks failed. Review the console output above."
        }
    }
}