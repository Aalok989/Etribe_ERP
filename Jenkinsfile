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
                // This is the correct command. 
                // It creates the 'dist' (or 'build') folder.
                sh 'npm run build'
            }
        }

        stage('Deploy to Server') {
            steps {
                // This block uses the SSH credentials you added to Jenkins
                // !! IMPORTANT: Change 'vmi-ssh-key' to the ID you created in Jenkins !!
                sshagent(credentials: ['vmi-ssh-key']) {
                    
                    // 1. (Optional) Remove old files from the server
                    sh 'ssh -o StrictHostKeyChecking=no adi@vmi2728695 "rm -rf /var/www/etribe/*"'
                    
                    // 2. Securely copy the new build files to the server
                    // !! CHECK YOUR BUILD FOLDER NAME !! 
                    // Vite usually creates 'dist'. If yours is 'build', change 'dist/*' to 'build/*'.
                    sh 'scp -o StrictHostKeyChecking=no -r dist/* adi@vmi2728695:/var/www/etribe/'
                }
            }
        }
    }
}