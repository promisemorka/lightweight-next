pipeline {
    agent any

    environment {
        NAME = "light-weight-next"
        VERSION = "${env.BUILD_ID}"
        IMAGE_REPO = "softoloye"
        GITHUB_TOKEN = credentials('GitHub-Token')
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
                dir("lightweight-next") {
                    sh "docker build -t ${IMAGE_REPO}/${NAME}:${VERSION} ."
                }
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
                            sh "git checkout update-argocd-config"
                            sh "git pull origin update-argocd-config"
                        }
                    } else {
                        echo "Repo does not exist - Cloning the repo"
                        sh "git clone -b update-argocd-config https://github.com/promisemorka/lightweight-next.git"
                    }
                }
            }
        }

        stage("Update Manifest") {
            steps {
                dir("lightweight-next/JenkinsDeployment") {
                    sh "sed -i 's#image: .*#image: ${IMAGE_REPO}/${NAME}:${VERSION}#' deployment.yaml"
                    sh "cat deployment.yaml"
                }
            }
        }

        stage("Commit and Push") {
            steps {
                dir("lightweight-next") {
                    sh "git config --global user.email 'jenkins@ci.com'"
                    sh "git remote set-url origin https://$GITHUB_TOKEN@github.com/promisemorka/lightweight-next.git"
                    sh "git checkout update-argocd-config"
                    sh "git add JenkinsDeployment/deployment.yaml"
                    sh 'git commit -m "updated image version for Build - $VERSION"'
                    sh "git push origin update-argocd-config"
                }
            }
        }

        // stage("Raise PR") {
        //     steps {
        //         sh "bash pr.sh"
        //     }

        // }
        stage("Raise PR") {
            steps {
                withEnv(["GH_TOKEN=${GITHUB_TOKEN}"]) {
                    sh '''
                        gh pr create \
                        --base main \
                        --head update-argocd-config \
                        --title "Update image" \
                        --body "Updated image version"
                    '''
                }
            }
        }
    }
}