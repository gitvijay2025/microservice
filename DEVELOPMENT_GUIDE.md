# 📘 Microservices Development & Deployment Guide

Welcome! This guide provides step-by-step instructions on how to develop, test, and deploy your new microservice architecture.

---

## 🚀 Phase 1: Local Development (Manual)

Use this phase when you are writing code and want to see changes immediately.

1.  **Install Dependencies:**
    Since we have isolated services, you must install dependencies for each one:
    ```bash
    cd services/gateway && npm install
    cd ../user-service && npm install
    cd ../product-service && npm install
    cd ../order-service && npm install
    ```

2.  **Run a Service:**
    Open a terminal for a service and start it:
    ```bash
    npm run dev
    ```
    *Note: You will need a local MongoDB running at `localhost:27017`.*

---

## 🐳 Phase 2: Running with Docker (Recommended)

This is the easiest way to run the **entire system** (Services + Database) with a single command.

1.  **Create Environment File:**
    ```bash
    cp .env.example .env
    ```

2.  **Start Everything:**
    ```bash
    docker-compose up --build
    ```
    *This will start the Gateway (3000), User (3001), Product (3002), Order (3003), and MongoDB.*

3.  **Stop Everything:**
    Press `Ctrl+C` or run `docker-compose down`.

---

## 🧪 Phase 3: Testing the System

Once the services are running, you can test the end-to-end flow using `curl` or Postman.

1.  **Check Gateway Health:**
    ```bash
    curl http://localhost:3000/health
    ```

2.  **Register a User:**
    ```bash
    curl -X POST http://localhost:3000/api/auth/register \
      -H "Content-Type: application/json" \
      -d '{"name":"Vijay","email":"vijay@test.com","password":"secret123"}'
    ```

---

## 🤖 Phase 4: CI/CD Pipeline (Automation)

Your project is configured with **GitHub Actions** and set up to push to **AWS ECR**.

1.  **AWS Setup:**
    *   Create 4 ECR repositories: `micro-gateway`, `micro-user-service`, `micro-product-service`, `micro-order-service`.
    *   Add these **GitHub Secrets** to your repository:
        *   `AWS_ACCESS_KEY_ID`
        *   `AWS_SECRET_ACCESS_KEY`
        *   `AWS_REGION` (e.g., `us-east-1`)

2.  **How it works (Smart Build):**
    *   The pipeline only builds the service you actually modified.
    *   It automatically logs into AWS ECR, builds the Docker image, and pushes it with two tags: the `git commit sha` and `latest`.

2.  **Where to see it:**
    Go to your GitHub Repository → **Actions** tab.

---

## ☸️ Phase 5: Deploying to Kubernetes

Use this when you are ready to move to a cloud provider (AWS, Google Cloud, Azure).

1.  **Apply Base Configuration:**
    This sets up your environment variables and database:
    ```bash
    kubectl apply -f infra/k8s/base-config.yaml
    kubectl apply -f infra/k8s/mongodb.yaml
    ```

2.  **Deploy the Services:**
    Wait a moment for MongoDB to start, then deploy your services:
    ```bash
    kubectl apply -f infra/k8s/gateway.yaml
    kubectl apply -f infra/k8s/user-service.yaml
    kubectl apply -f infra/k8s/product-service.yaml
    kubectl apply -f infra/k8s/order-service.yaml
    ```

3.  **Check Status:**
    ```bash
    kubectl get pods
    kubectl get services
    ```

---

## 💡 Key Tips for Beginners
*   **Logs:** If a service isn't working, check the logs. In Docker: `docker logs micro-user-service`.
*   **Trace IDs:** Every log entry has a unique ID (e.g., `[a1b2c3d4]`). You can search this ID across all services to see the full path of a single request.
*   **Database:** Each service has its own database inside MongoDB (e.g., `micro_users`, `micro_products`) to ensure data isolation.



I have converted your pipeline to a Manual Build system.

🛠️ How to use it now:
Go to your project on GitHub.
Click on the "Actions" tab at the top.
On the left sidebar, click on "Manual Microservice Build".
You will see a button that says "Run workflow".
Click it, and a dropdown will appear. Choose the service you want to build (e.g., order-service) and click "Run workflow".
This gives you total control over exactly which service gets updated and when. I have also updated the Automation section in your



=============

You get the AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from the AWS IAM (Identity and Access Management) console.

Here is the step-by-step process to get these values and add them to GitHub:

1. Create a User in AWS
Log in to your AWS Management Console.
Search for IAM and go to the IAM Dashboard.
In the left sidebar, click Users → Create user.
Give it a name (e.g., github-actions-bot). Click Next.
Choose Attach policies directly.
Search for and check the box for: AmazonEC2ContainerRegistryPowerUser (This allows the bot to push images to ECR).
Click Next → Create user.


2. Generate the Keys
Click on the user you just created (github-actions-bot).
Go to the Security credentials tab.
Scroll down to Access keys and click Create access key.
Select Command Line Interface (CLI), check the confirmation box, and click Next.
Click Create access key.
⚠️ IMPORTANT: You will now see your Access Key ID and Secret Access Key. Copy them now, as you won't be able to see the Secret Key again.


3. Add to GitHub
Go to your project repository on GitHub.
Click Settings (top tab) → Secrets and variables (left sidebar) → Actions.
Click New repository secret.
Name: AWS_ACCESS_KEY_ID | Value: (Paste your key)
Click Add secret.
Click New repository secret again.
Name: AWS_SECRET_ACCESS_KEY | Value: (Paste your secret key)
Click Add secret.
Now, when you run your GitHub Actions pipeline, it will securely use these keys to log into your AWS account!



=================================================

Yes, exactly. You need to create 4 separate repositories in AWS ECR—one for each of your services—so the pipeline knows where to push the images.

How to create them in AWS:
Step 1: In the AWS Console, search for Elastic Container Registry (ECR).
Step 2: Click Repositories on the left sidebar.
Step 3: Click Create repository.
Step 4: Set the Repository name to: micro-gateway.
    Keep other settings as default.
Step 5: Click Create repository.
Step 6: Repeat this 3 more times for:
    micro-user-service
    micro-product-service
    micro-order-service

The names must match exactly what is in your .github/workflows/ci-cd.yml file:

ECR_REPOSITORY: micro-${{ github.event.inputs.service }}
