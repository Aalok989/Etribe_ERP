pipeline {
    agent any

    tools {
        nodejs 'NodeJS-18' 
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm i'
            }
        }

        stage('Run Dev Server (Warning: Will hang!)') {
            steps {
                // This command will start and run forever.
                // Your Jenkins job will never finish.
                sh 'npm run dev'
            }
        }
    }
}