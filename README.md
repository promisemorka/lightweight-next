# Light Weight

**Light Weight** is a full-stack fitness tracking application that allows users to plan workouts, log exercises, and track strength progress over time.

The project was originally built as a Springboard bootcamp capstone and has since been rebuilt with a modern **Next.js** architecture and expanded to include authentication, PostgreSQL, Docker, Jenkins CI, GitOps, Argo CD, and Kubernetes.

## Features

Users can:

* Create workout plans by day of the week
* Search and filter an exercise library
* Log exercise weight, sets, reps, and units
* Edit and delete workouts and exercise logs
* Track personal records
* View weight-progress charts over time
* Manage their profile

Admin users can also manage exercises and user accounts.

## Tech Stack

### Application

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS
* shadcn/ui
* React Hook Form
* Zod

### Backend & Database

* Next.js Server Actions
* PostgreSQL
* Neon
* Drizzle ORM
* Auth.js v5
* bcrypt

### DevOps

* Docker
* Docker Hub
* Jenkins
* GitHub
* Argo CD
* Kubernetes
* Minikube
* RHEL Linux

## Architecture

Light Weight is a unified Next.js application.

There is no separate REST API. Server Components handle server-side data access, while Server Actions handle application mutations.

```text
Browser
   |
   v
Next.js
   |
   +-- Server Components
   +-- Server Actions
   +-- Auth.js
   +-- Authorization Guards
   |
   v
Drizzle ORM
   |
   v
PostgreSQL / Neon
```

## Authentication & Authorization

Authentication is implemented with **Auth.js v5** using credentials and JWT sessions.

Passwords are hashed with bcrypt, and server-side authorization guards ensure users can only access and modify resources they own.

Administrative actions require an admin account.

## CI/CD & GitOps

The project includes a complete CI/CD and GitOps deployment workflow:

```text
Developer
    |
    v
Jenkins
    |
    +-- Build Docker image
    |
    +-- Push image to Docker Hub
    |
    +-- Update Kubernetes manifest
    |
    v
update-argocd-config
    |
    v
Pull Request
    |
    v
main
    |
    v
Argo CD
    |
    v
Kubernetes
    |
    v
Running Application
```

Jenkins handles the Continuous Integration workflow by building and publishing versioned Docker images and proposing deployment changes through a GitHub Pull Request.

Argo CD watches the `main` branch and synchronizes the approved Kubernetes configuration with the cluster.

For a detailed breakdown of the pipeline, see:

[GitOps CI/CD Pipeline](gitops-cicd-pipeline.md)

## Docker

The application is packaged as a Docker image based on Node.js 20 Alpine.

Images are published to Docker Hub using Jenkins build numbers:

```text
softoloye/light-weight-next:<BUILD_ID>
```

Example:

```text
softoloye/light-weight-next:10
```

## Kubernetes

The Kubernetes manifests are located in:

```text
lightweight-next/JenkinsDeployment/
```

They define:

* A Kubernetes `Deployment`
* A `NodePort` Service
* The Docker image version deployed by Argo CD

The current development cluster runs locally using **Minikube with the Docker driver on RHEL Linux**.

## Repository Structure

```text
.
├── README.md
├── gitops-cicd-pipeline.md
├── Jenkinsfile
├── context/
│
└── lightweight-next/
    ├── Dockerfile
    ├── JenkinsDeployment/
    │   ├── deployment.yaml
    │   └── service.yaml
    ├── drizzle/
    ├── public/
    ├── src/
    ├── package.json
    └── package-lock.json
```

## Running Locally

Clone the repository:

```bash
git clone https://github.com/promisemorka/lightweight-next.git
cd lightweight-next/lightweight-next
```

Install dependencies:

```bash
npm install
```

Create the local environment file:

```bash
cp .env.local.example .env.local
```

Configure the required environment variables:

```text
DATABASE_URL
AUTH_SECRET
```

Run the database migrations:

```bash
npm run db:migrate
```

Seed the exercise library:

```bash
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Project Status

The core application currently includes:

* Authentication and authorization
* Workout management
* Exercise search and filtering
* Exercise logging
* Personal records
* Weight-progress charts
* Profile management
* Admin functionality
* Docker containerization
* Jenkins CI
* GitOps deployment with Argo CD
* Kubernetes deployment

Planned improvements include expanding automated testing, improving the Docker image with a multi-stage build, and adding Kubernetes health probes and resource limits.

## Background

Light Weight originally used a separate Express backend and Create React App frontend.

The application was rebuilt as a unified Next.js application to modernize the architecture, improve maintainability, and address authorization and data-model issues found in the original implementation.

The current version also serves as a practical environment for applying software engineering, Linux, CI/CD, containerization, Kubernetes, and GitOps concepts in a real project.
