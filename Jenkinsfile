pipeline {
    agent any

    environment {
        NAME = "light-weight-v2"
        VERSION = "${env.BUILD_ID}-${env.GIT_COMMIT}"
        IMAGE_REPO = "softoloye"
        ARGO_TOKEN = credentials('argocd-token')
        GITHUB_TOKEN = credentials('github-token')
    }

    stages {
        stage('Unit Tests') {
            steps {
                echo "Implement unit tests if applicable"
                echo "This stage is a sample placeholder"
            }
        }

        stage('Build Image') {
            steps {
                sh "docker build -t ${NAME} ."
                sh "docker tag ${NAME}:latest ${IMAGE_REPO}/${NAME}:${VERSION}"
            }
        }

        stage('Push Image') {
            steps {
                withDockerRegistry([credentialsId: "docker-hub", url: ""]) {
                    sh "docker push ${IMAGE_REPO}/${NAME}:${VERSION}"
                }
            }
        }

        stage("Clone/Pull Repo") {
            steps {
                script {
                    if (fileExists('lightweight-next')) {
                        echo "Cloned repo already exists - Pulling latest changes"

                        dir("lightweight-next") {
                            sh "git pull"
                        }
                    } else {
                        echo "Repo does not exists - Cloning the repo"
                        sh "git clone -b feature-lightweight https://172.16.144.130:3000/fffffffff"
                    }
                }
            }
        }

        stage("Update Manifest") {
            steps {
                dir("gitops-argocd/lightweight-v2")
            }
        }


    }
}