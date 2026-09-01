# Light Weight --- Jenkins, Docker, Argo CD, and Kubernetes GitOps Pipeline

## 1. Overview

This document describes the CI/CD and GitOps pipeline built for the
**Light Weight** fitness application.

The application itself is a Next.js application located in
`lightweight-next/`. The deployment workflow uses:

-   **Jenkins** for Continuous Integration (CI)
-   **Docker** for containerization
-   **Docker Hub** as the container registry
-   **GitHub** for source control and Pull Requests
-   **Argo CD** for GitOps-based Continuous Delivery (CD)
-   **Kubernetes / Minikube** as the deployment environment
-   **RHEL 10** as the Linux environment hosting the lab

The final workflow is:

``` text
Developer / Source Code
        |
        v
     Jenkins
        |
        | Build Docker image
        v
     Docker
        |
        | Push versioned image
        v
   Docker Hub
        |
        | Update deployment.yaml
        v
update-argocd-config branch
        |
        | Pull Request
        v
      main
        |
        | Argo CD watches main
        v
     Argo CD
        |
        | Synchronize desired state
        v
   Kubernetes
        |
        v
   Running Pod
```

The completed pipeline was verified by successfully deploying:

``` text
softoloye/light-weight-next:10
```

to Kubernetes, where the new Pod reached:

``` text
READY   STATUS
1/1     Running
```

------------------------------------------------------------------------

## 2. Application Context

Light Weight is a personal fitness-tracking application. The current
implementation is a unified **Next.js 16** application using TypeScript,
PostgreSQL/Neon, Drizzle ORM, Auth.js, React, and Tailwind CSS.

The application runs on port `3000` inside its container.

The relevant repository structure is:

``` text
lightweight-next/
├── README.md
├── gitops-cicd-pipeline.md
├── context/
├── Jenkinsfile
└── lightweight-next/
    ├── Dockerfile
    ├── JenkinsDeployment/
    ├── drizzle/
    ├── public/
    ├── src/
    └── package.json
```

GitHub repository:

``` text
promisemorka/lightweight-next
```

The deployment manifests live in:

``` text
lightweight-next/JenkinsDeployment/
```

------------------------------------------------------------------------

## 3. Environment

The lab runs inside a RHEL 10 virtual machine.

Main components installed in the VM:

``` text
RHEL 10
├── Docker
├── Jenkins
├── kubectl
├── Minikube
├── Argo CD CLI
└── GitHub CLI (gh)
```

Minikube uses the **Docker driver**, meaning Kubernetes itself runs
using Docker containers inside the RHEL VM.

The environment is resource constrained because the host Mac has 8 GB of
physical RAM. The VM has roughly 4 GB available, so Jenkins, Docker,
Minikube, Kubernetes, and Argo CD should be run thoughtfully.

------------------------------------------------------------------------

## 4. Dockerizing the Application

The application is containerized with the Dockerfile located at:

``` text
lightweight-next/Dockerfile
```

Current Dockerfile:

``` dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### What this does

1.  Uses Node.js 20 Alpine as the base image.
2.  Creates `/app` as the working directory.
3.  Copies package metadata.
4.  Installs dependencies using `npm ci`.
5.  Copies the application source code.
6.  Creates a production Next.js build.
7.  Exposes port `3000`.
8.  Starts the application with `npm start`.

Jenkins builds images using the format:

``` text
softoloye/light-weight-next:<JENKINS_BUILD_ID>
```

For example:

``` text
softoloye/light-weight-next:10
```

Using the Jenkins build ID creates a unique image tag for each
deployment rather than continually overwriting one generic tag.

------------------------------------------------------------------------

## 5. Jenkins Setup

Jenkins runs as a Linux system service:

``` bash
sudo systemctl start jenkins
sudo systemctl stop jenkins
systemctl status jenkins
```

Jenkins needs permission to communicate with Docker.

The Jenkins user was added to the Docker group:

``` bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

Verification:

``` bash
id jenkins
```

Expected result includes the `docker` group:

``` text
groups=jenkins,docker
```

This allows Jenkins pipeline stages to execute commands such as:

``` bash
docker build
docker push
```

without Docker socket permission errors.

------------------------------------------------------------------------

## 6. Jenkins Credentials

The pipeline uses credentials stored in Jenkins rather than placing
secrets directly in source control.

### Docker Hub credential

Credential ID:

``` text
docker-hub
```

Configuration:

``` text
Kind: Username with password
Username: softoloye
Password: Docker Hub Personal Access Token
```

The token requires **Read & Write** permission because Jenkins needs to
push images.

### GitHub credential

A GitHub Personal Access Token is stored as:

``` text
GitHub-Token
```

It is used for operations such as:

-   pushing the updated Kubernetes manifest
-   creating Pull Requests

The GitHub token needs appropriate repository content and Pull Request
permissions.

### Jenkins SCM credential

The Jenkins job also uses a source-control credential such as:

``` text
github-scm
```

for checking out the repository.

Secrets should never be committed directly into the `Jenkinsfile`.

------------------------------------------------------------------------

## 7. Jenkins Pipeline

The root `Jenkinsfile` implements the CI workflow.

The major stages are:

``` text
Unit Tests
    |
Build Image
    |
Push Image
    |
Clone/Pull Repo
    |
Update Manifest
    |
Commit and Push
    |
Raise PR
```

### Stage 1 --- Unit Tests

The current stage is a placeholder:

``` groovy
stage('Unit Tests') {
    steps {
        echo "Implement unit tests if applicable"
        echo "This stage is a sample placeholder"
    }
}
```

A future improvement is to run the real Vitest test suite here.

### Stage 2 --- Build Image

Jenkins enters the Next.js application directory and builds the Docker
image:

``` groovy
dir("lightweight-next") {
    sh "docker build -t ${IMAGE_REPO}/${NAME}:${VERSION} ."
}
```

With:

``` text
IMAGE_REPO = softoloye
NAME       = light-weight-next
VERSION    = Jenkins BUILD_ID
```

Build 10 therefore produced:

``` text
softoloye/light-weight-next:10
```

### Stage 3 --- Push Image

Jenkins authenticates to Docker Hub using the stored `docker-hub`
credential and pushes the image:

``` groovy
withDockerRegistry([credentialsId: "docker-hub", url: ""]) {
    sh "docker push ${IMAGE_REPO}/${NAME}:${VERSION}"
}
```

This separates the build system from the Kubernetes cluster. Kubernetes
does not receive the image directly from Jenkins; it later pulls the
image from Docker Hub.

### Stage 4 --- Clone/Pull Repository

Jenkins works with the GitOps branch:

``` text
update-argocd-config
```

The important branch checkout logic is:

``` groovy
sh "git checkout update-argocd-config"
sh "git pull origin update-argocd-config"
```

This was necessary because a plain `git pull` can fail when Jenkins is
operating from a detached `HEAD`.

### Stage 5 --- Update Kubernetes Manifest

Jenkins modifies:

``` text
lightweight-next/JenkinsDeployment/deployment.yaml
```

using:

``` groovy
sh "sed -i 's#image: .*#image: ${IMAGE_REPO}/${NAME}:${VERSION}#' deployment.yaml"
```

For Build 10, the result became:

``` yaml
image: softoloye/light-weight-next:10
```

This is a critical GitOps concept: **Jenkins does not directly tell
Kubernetes to deploy the new version.**

Instead, Jenkins changes the desired deployment state stored in Git.

### Stage 6 --- Commit and Push

Jenkins commits the changed manifest:

``` text
updated image version for Build - 10
```

and pushes it to:

``` text
update-argocd-config
```

The automation branch is deliberately separate from `main`.

### Stage 7 --- Raise Pull Request

GitHub CLI is used to create a PR:

``` bash
gh pr create \
  --base main \
  --head update-argocd-config \
  --title "Update image" \
  --body "Updated image version"
```

This creates the controlled transition:

``` text
update-argocd-config
        |
        | Pull Request
        v
       main
```

Build 10 successfully created PR #2, which was reviewed through GitHub
and merged into `main`.

------------------------------------------------------------------------

## 8. Why Use a Pull Request?

Jenkins could technically push directly to `main`, but the PR workflow
provides an important control point.

It allows the deployment change to be reviewed before becoming the
desired production state.

The model is:

``` text
Jenkins automation
       |
       v
update-argocd-config
       |
       v
Pull Request
       |
       v
protected main
       |
       v
Argo CD
```

For a production repository, `main` should normally be protected against
accidental deletion, force pushes, and uncontrolled direct changes.

------------------------------------------------------------------------

## 9. Kubernetes Manifests

The Kubernetes configuration is stored in:

``` text
lightweight-next/JenkinsDeployment/
```

### Deployment

The deployment creates one replica of the application.

Relevant configuration:

``` yaml
apiVersion: apps/v1
kind: Deployment

metadata:
  name: light-weight-v2
  labels:
    app: light-weight-v2

spec:
  replicas: 1

  selector:
    matchLabels:
      app: light-weight-v2

  template:
    metadata:
      labels:
        app: light-weight-v2

    spec:
      containers:
        - name: light-weight-v2
          image: softoloye/light-weight-next:10
          env:
            - name: AUTH_TRUST_HOST
              value: "true"
          ports:
            - containerPort: 3000
```

The Kubernetes object is currently named `light-weight-v2`, while the
Docker repository is `light-weight-next`. This naming difference is
acceptable because the Kubernetes selectors and labels are internally
consistent.

### Service

The application is exposed through a Kubernetes `NodePort` Service.

Because Next.js listens on port `3000`, the service should route traffic
to:

``` yaml
port: 80
targetPort: 3000
```

If the Pod is healthy but the application cannot be reached through the
Service, `targetPort` is one of the first settings to verify.

------------------------------------------------------------------------

## 10. Minikube

Minikube provides the local Kubernetes cluster.

Start:

``` bash
minikube start
```

Check status:

``` bash
minikube status
```

Expected running state:

``` text
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
```

Stop:

``` bash
minikube stop
```

`minikube stop` preserves the cluster.

Do **not** use:

``` bash
minikube delete
```

unless the intention is to remove the cluster and its state.

------------------------------------------------------------------------

## 11. Argo CD

Argo CD is installed inside the Minikube Kubernetes cluster in the
`argocd` namespace.

Its role is **Continuous Delivery**.

Jenkins handles:

``` text
Build → Push → Update Git
```

Argo CD handles:

``` text
Watch Git → Detect desired-state change → Synchronize Kubernetes
```

This separation is central to the GitOps architecture.

### Argo CD Application

The application was configured with:

``` text
Application Name: lightweight-next
Project: default

Repository:
https://github.com/promisemorka/lightweight-next.git

Revision:
main

Path:
lightweight-next/JenkinsDeployment

Destination Cluster:
https://kubernetes.default.svc

Namespace:
default

Sync Policy:
Automatic

Prune:
Enabled

Self Heal:
Enabled
```

### Why Argo CD Watches `main`

Argo CD does **not** watch `update-argocd-config`.

That branch contains a proposed deployment change.

Only after the Pull Request is merged does the change become part of:

``` text
main
```

which represents the approved desired state.

Argo CD then detects the new commit and synchronizes Kubernetes.

------------------------------------------------------------------------

## 12. Accessing the Argo CD UI

The Argo CD server runs inside Kubernetes.

A local port-forward can expose it:

``` bash
kubectl port-forward svc/argocd-server -n argocd 8081:443
```

Then open:

``` text
https://localhost:8081
```

The initial admin password can be retrieved with:

``` bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d; echo
```

The port-forward process must remain running while using the UI.

Press `Ctrl+C` to stop it.

------------------------------------------------------------------------

## 13. Successful End-to-End Deployment

The completed Build 10 demonstrated the entire workflow.

### Jenkins

Jenkins built:

``` text
softoloye/light-weight-next:10
```

### Docker Hub

The image was successfully pushed to Docker Hub.

### Git

Jenkins updated:

``` yaml
image: softoloye/light-weight-next:10
```

and committed the change to:

``` text
update-argocd-config
```

### GitHub

Jenkins created Pull Request #2:

``` text
update-argocd-config → main
```

The PR was manually merged.

### Argo CD

Because Argo CD watches:

``` text
main
```

it detected the merged manifest change and initiated a new Kubernetes
deployment.

### Kubernetes

The new Pod showed:

``` text
Image: softoloye/light-weight-next:10
```

During deployment:

``` text
ContainerCreating
```

eventually became:

``` text
READY   STATUS    RESTARTS
1/1     Running   0
```

This confirmed that the GitOps pipeline worked end to end.

------------------------------------------------------------------------

## 14. How a New Deployment Works

After the initial setup, the expected workflow for future changes is:

### Step 1 --- Change application code

A developer modifies the application and pushes the change.

### Step 2 --- Jenkins starts

Jenkins checks out the repository and runs the pipeline.

### Step 3 --- Build a new image

For example:

``` text
softoloye/light-weight-next:11
```

### Step 4 --- Push to Docker Hub

The new immutable/versioned image becomes available to Kubernetes.

### Step 5 --- Update `deployment.yaml`

Jenkins changes:

``` yaml
image: softoloye/light-weight-next:10
```

to:

``` yaml
image: softoloye/light-weight-next:11
```

### Step 6 --- Push GitOps branch

The change is committed to:

``` text
update-argocd-config
```

### Step 7 --- Create Pull Request

Jenkins opens:

``` text
update-argocd-config → main
```

### Step 8 --- Merge

After the PR is accepted, `main` contains the new desired image tag.

### Step 9 --- Argo CD detects the change

Argo CD compares:

``` text
Git desired state
        vs.
Kubernetes live state
```

When they differ, the application becomes out of sync.

### Step 10 --- Automatic synchronization

Argo CD updates the Deployment.

Kubernetes creates a new Pod and pulls the new Docker image.

------------------------------------------------------------------------

## 15. Verification Commands

### Check Pods

``` bash
kubectl get pods
```

Healthy:

``` text
READY   STATUS
1/1     Running
```

### Watch a rollout

``` bash
kubectl get pods -w
```

Press `Ctrl+C` when finished.

### Check Deployments

``` bash
kubectl get deployments
```

### Check Services

``` bash
kubectl get services
```

### Check the deployed image

``` bash
kubectl get deployment light-weight-v2 \
  -o=jsonpath='{.spec.template.spec.containers[0].image}'; echo
```

Expected example:

``` text
softoloye/light-weight-next:10
```

### Inspect a Pod

``` bash
kubectl describe pod <pod-name>
```

The **Events** section at the bottom is especially useful when
troubleshooting.

------------------------------------------------------------------------

## 16. Troubleshooting Encountered During the Build

### 16.1 Jenkins Could Not Access Docker

Symptom:

``` text
permission denied
/var/run/docker.sock
```

Cause:

The `jenkins` Linux user did not have permission to communicate with the
Docker daemon.

Fix:

``` bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

Verify:

``` bash
id jenkins
```

------------------------------------------------------------------------

### 16.2 Jenkins Git Pull / Detached HEAD

Symptom:

A normal `git pull` failed during the pipeline.

Cause:

Jenkins SCM checkouts can leave the repository in a detached `HEAD`
state.

Fix:

Explicitly switch to the automation branch:

``` bash
git checkout update-argocd-config
git pull origin update-argocd-config
```

------------------------------------------------------------------------

### 16.3 Kubernetes `ImagePullBackOff`

An earlier Pod attempted to pull:

``` text
softoloye/light-weight-v2:42
```

and failed.

`kubectl describe pod` showed an image pull error.

The new pipeline correctly built and pushed:

``` text
softoloye/light-weight-next:10
```

After the manifest was merged, Argo CD deployed the correct image.

Important lesson:

``` text
Image exists locally in Docker
          !=
Image is available to Kubernetes
```

For this architecture, the image must exist in Docker Hub so the
Minikube node can pull it.

------------------------------------------------------------------------

### 16.4 `ContainerCreating` Took Several Minutes

The new Pod remained in:

``` text
ContainerCreating
```

while Kubernetes pulled the image.

The environment has limited RAM and the Docker image is relatively
large, so this can take time.

The useful command is:

``` bash
kubectl get pods -w
```

The Pod eventually reached:

``` text
1/1 Running
```

------------------------------------------------------------------------

### 16.5 Kubernetes TLS Handshake Timeout

A command temporarily returned:

``` text
Unable to connect to the server:
net/http: TLS handshake timeout
```

The cluster was under resource pressure while the new container was
being created.

Retrying Kubernetes commands worked afterward.

This is another reason to monitor RAM carefully in the current VM.

------------------------------------------------------------------------

## 17. Resource Constraints

The host Mac has:

``` text
RAM: 8 GB
CPU: 1.4 GHz Quad-Core Intel Core i5
```

The RHEL VM receives its RAM from the Mac's physical memory.

Running all of these simultaneously is demanding:

``` text
macOS
  |
  +-- RHEL VM
       |
       +-- Jenkins
       +-- Docker
       +-- Minikube
       +-- Kubernetes
       +-- Argo CD
       +-- Next.js build
```

Minikube previously warned that allocating approximately 3 GB left
little memory for the rest of the RHEL system.

Jenkins also reached roughly 700 MB of memory and used swap.

The primary constraint observed during this lab was therefore **RAM**,
not CPU.

For the current 8 GB Mac, a VM around 4 GB RAM is reasonable. Increasing
VM RAM too aggressively would simply starve macOS.

For a future development machine intended to run this stack regularly:

``` text
16 GB RAM  = practical minimum
24–32 GB   = much more comfortable
```

An external SSD can help with disk capacity but does not solve a RAM
shortage.

------------------------------------------------------------------------

## 18. Starting the Lab

Because Minikube uses Docker, start Docker first:

``` bash
sudo systemctl start docker
```

Then:

``` bash
minikube start
```

Then Jenkins:

``` bash
sudo systemctl start jenkins
```

Verify:

``` bash
systemctl status docker
minikube status
systemctl status jenkins
```

When the Argo CD UI is needed:

``` bash
kubectl port-forward svc/argocd-server -n argocd 8081:443
```

------------------------------------------------------------------------

## 19. Stopping the Lab

Stop any active `kubectl` watch or port-forward with:

``` text
Ctrl+C
```

Stop Jenkins:

``` bash
sudo systemctl stop jenkins
```

Stop Minikube:

``` bash
minikube stop
```

Optionally stop Docker:

``` bash
sudo systemctl stop docker
```

If `docker.socket` keeps Docker available or causes it to restart:

``` bash
sudo systemctl stop docker.socket
```

------------------------------------------------------------------------

## 20. Verifying Everything Is Stopped

### Jenkins

``` bash
systemctl status jenkins
```

Expected:

``` text
Active: inactive (dead)
```

### Minikube

``` bash
minikube status
```

Expected:

``` text
host: Stopped
kubelet: Stopped
apiserver: Stopped
kubeconfig: Stopped
```

### Docker

``` bash
systemctl status docker
```

If intentionally stopped:

``` text
Active: inactive (dead)
```

### Argo CD Port Forward

``` bash
ps aux | grep "kubectl port-forward"
```

If the only result is the `grep` command itself, there is no active
port-forward.

------------------------------------------------------------------------

## 21. CI vs CD Responsibilities

A useful way to understand this project is to separate CI from CD.

### Jenkins --- CI

Jenkins is responsible for producing and proposing a deployable version:

``` text
Test
  ↓
Build
  ↓
Create Docker image
  ↓
Push Docker image
  ↓
Update manifest
  ↓
Create PR
```

### Argo CD --- CD

Argo CD is responsible for making the Kubernetes cluster match the
approved Git state:

``` text
Watch main
   ↓
Detect manifest change
   ↓
Sync Kubernetes
   ↓
Kubernetes pulls image
   ↓
New Pod runs
```

This means Jenkins does **not** need to execute:

``` bash
kubectl apply
```

That responsibility belongs to Argo CD.

------------------------------------------------------------------------

## 22. Why This Is GitOps

The key GitOps principle demonstrated by this project is:

> **Git is the source of truth for the desired state of the Kubernetes
> application.**

The deployment is not considered approved merely because Jenkins built
an image.

The desired version is determined by what `deployment.yaml` says on
`main`.

For example:

``` yaml
image: softoloye/light-weight-next:10
```

Argo CD continuously compares this desired state with the actual
Kubernetes cluster.

Therefore:

``` text
Docker Hub = stores deployable artifacts
GitHub     = stores desired deployment state
Argo CD    = reconciles desired and actual state
Kubernetes = runs the application
```

------------------------------------------------------------------------

## 23. Future Improvements

The current pipeline works, but several improvements would make it more
production-like.

### Run real tests

Replace the placeholder Jenkins test stage with actual commands such as:

``` bash
npm run typecheck
npm run lint
npm run test
```

and later Playwright E2E tests.

### Fix/verify Service target port

The Next.js container listens on `3000`.

Ensure `service.yaml` uses:

``` yaml
targetPort: 3000
```

### Optimize the Docker image

The current Dockerfile is single-stage.

A multi-stage Docker build could reduce the final image size and improve
pull/startup times.

### Improve secret handling

Avoid exposing GitHub tokens through Groovy string interpolation or
embedding tokens directly in Git remote URLs. Use Jenkins credential
bindings designed to keep secrets masked.

### Handle builds with no manifest change

A future pipeline should gracefully handle:

``` text
nothing to commit
```

instead of allowing `git commit` to fail.

### Handle an already-open PR

`gh pr create` should account for a PR that already exists from:

``` text
update-argocd-config → main
```

### Add health probes

Add Kubernetes:

``` yaml
readinessProbe:
livenessProbe:
```

so Kubernetes can determine whether the Next.js application is actually
ready to receive traffic.

### Add resource requests and limits

Because the lab is memory constrained, define Kubernetes CPU and memory
requests/limits rather than leaving the Pod as `BestEffort`.

### Branch protection

Protect `main` so deployment changes must pass through the PR workflow
and cannot be accidentally force-pushed or deleted.

------------------------------------------------------------------------

## 24. Final Architecture

``` text
                   CI
                   |
                   v
            +-------------+
            |   Jenkins   |
            +-------------+
              |         |
          build image   |
              |         |
              v         |
         +----------+   |
         |  Docker  |   |
         +----------+   |
              |         |
           push          |
              v         |
       +------------+    |
       | Docker Hub |    |
       +------------+    |
                       update
                       manifest
                          |
                          v
              +----------------------+
              | update-argocd-config |
              +----------------------+
                          |
                         PR
                          |
                          v
                     +---------+
                     |  main   |
                     +---------+
                          |
                          | watched by
                          v
                    +-----------+
                    |  Argo CD  |
                    +-----------+
                          |
                         sync
                          |
                          v
                   +------------+
                   | Kubernetes |
                   +------------+
                          |
                    pull image
                          |
                          v
                    +-----------+
                    | Next.js   |
                    |    Pod    |
                    +-----------+
                          |
                          v
                     1/1 Running
```

------------------------------------------------------------------------

## 25. Result

The project successfully demonstrates a working CI/CD and GitOps
deployment workflow using real industry tooling:

**Jenkins → Docker → Docker Hub → GitHub Pull Request → Argo CD →
Kubernetes**

The most important architectural lesson is the separation of
responsibilities:

-   Jenkins **builds and proposes** a deployment.
-   Git records the **approved desired state**.
-   Argo CD **reconciles** that desired state.
-   Kubernetes **runs** the application.

The successful deployment of `softoloye/light-weight-next:10` and the
resulting `1/1 Running` Pod verified the workflow end to end.
