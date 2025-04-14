pipeline {
    agent any

    environment {
        SONAR_SCANNER_HOME = tool 'SonarQube Scanner'
    }

    stages {
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') { // Use the name configured in Jenkins
                    bat "\"%SONAR_SCANNER_HOME%\\bin\\sonar-scanner\" -Dsonar.projectKey=sonar-project -Dsonar.sources=src -Dsonar.host.url=http://localhost:9000 -Dsonar.token=sqp_9474f5b506495a1a4ef12ad16d6a17522e59ff1c"

                }
            }
        }
    }
}
 
