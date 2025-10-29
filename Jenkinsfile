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
                sshagent(credentials: ['vmi-ssh-key']) {
                    
                    // 1. Remove old build files (but keep .htaccess)
                    //    !! This will FAIL unless you have set up NOPASSWD sudo on the server !!
                    sh 'ssh -o StrictHostKeyChecking=no adi@vmi2728695 "sudo rm -rf /var/www/etribe/index.html /var/www/etribe/assets"'
                    
                    // 2. Securely copy the new build files to the server
                    //    If your build folder is 'build', change 'dist/*' to 'build/*'.
                    sh 'scp -o StrictHostKeyChecking=no -r dist/* adi@vmi2728695:/var/www/etribe/'
                }
            }
        }
    }
}