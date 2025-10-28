pipeline {
    agent any

    tools {
        // This uses the 'Node' tool you configured in Jenkins
        nodejs 'Node' 
    }

    stages {
        stage('Checkout Code') {
            steps {
                // Pulls the code from your Gitea repo
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                // Runs 'npm install'
                sh 'npm i'
            }
        }

        stage('Build Application') {
            steps {
                // Creates the 'dist' (or 'build') folder
                sh 'npm run build'
            }
        }

        stage('Deploy to Server') {
            steps {
                // This block uses the SSH credentials you added to Jenkins
                // !! Make sure this ID matches your credential in Jenkins !!
                sshagent(credentials: ['vmi-ssh-key']) {
                    
                    // 1. (Optional) Remove old files from the server
                    sh 'ssh -o StrictHostKeyChecking=no adi@vmi2728695 "rm -rf /var/www/etribe/*"'
                    
                    // 2. Securely copy the new build files to the server
                    //    This copies EVERYTHING inside the 'dist' folder.
                    //    If your build folder is 'build', change 'dist/*' to 'build/*'.
                    sh 'scp -o StrictHostKeyChecking=no -r dist/* adi@vmi2728695:/var/www/etribe/'
                }
            }
        }
    }
}