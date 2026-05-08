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
