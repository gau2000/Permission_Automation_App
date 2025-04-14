pipeline {
    agent any

    environment {
        SONAR_SCANNER_HOME = tool 'SonarScanner'
    }

    stages {
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') { // Use the name configured in Jenkins
                    bat "\"%SONAR_SCANNER_HOME%\\bin\\sonar-scanner\" -Dsonar.projectKey=Test-Project -Dsonar.sources=src -Dsonar.host.url=http://localhost:9000 -Dsonar.token=sqb_ad57e791c0f28aee9f736af41a5ce7c204d12e71"

                }
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build'
            }
        }
    }
}
 
