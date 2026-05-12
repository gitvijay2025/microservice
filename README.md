# 🏗️ Node.js Express Microservice Architecture

A production-grade, scalable microservice architecture built with **Node.js**, **Express**, **MongoDB**, and **Docker**.

---

## Architecture Overview

```
                    ┌─────────────────┐
                    │   API Gateway   │ :3000
                    │  (rate limit,   │
                    │   proxy, cors)  │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
  │ User Service  │  │Product Service│  │ Order Service  │
  │    :3001      │  │    :3002      │  │    :3003       │
  └───────┬───────┘  └───────┬───────┘  └───────┬────────┘
          │                  │                  │
          ▼                  ▼                  ▼
  ┌─────────────────────────────────────────────────────┐
  │                    MongoDB :27017                   │
  └─────────────────────────────────────────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| **API Gateway** | 3000 | Request routing, rate limiting, auth proxy |
| **User Service** | 3001 | Registration, login (JWT), user CRUD |
| **Product Service** | 3002 | Product catalog with search & filtering |
| **Order Service** | 3003 | Order management with product validation |

## Integrated Utilities (`src/utils`)

Each service contains its own copy of essential utilities for maximum independence:

| Utility | Description |
|---------|-------------|
| **Logger** | Winston structured JSON logging with trace IDs |
| **Error Handler** | Centralized error middleware (Mongoose, JWT, custom) |
| **Validator** | Joi-based request validation middleware |
| **Circuit Breaker** | Resilience pattern for inter-service calls |
| **Rate Limiter** | Token-bucket rate limiting with headers |
| **Event Bus** | In-process pub/sub with async error isolation |
| **Auth Middleware** | JWT verification + role-based authorization |
| **HTTP Client** | Axios wrapper with retry + circuit breaker |
| **Health Check** | `/health` and `/ready` endpoints |
| **Config Loader** | Joi-validated environment config |
| **Request Context** | Trace ID propagation via AsyncLocalStorage |
| **Graceful Shutdown** | SIGTERM/SIGINT handling with cleanup |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Docker)

### 1. Install Dependencies
You must install dependencies for each service individually:
```bash
cd services/gateway && npm install
cd ../user-service && npm install
cd ../product-service && npm install
cd ../order-service && npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env as needed
```

### 3. Run All Services (Docker Recommended)
The easiest way to run the entire stack:
```bash
docker-compose up --build
```

### 4. Run Individually (Development)
Open separate terminals for each service:
```bash
# In terminal 1
cd services/gateway && npm run dev

# In terminal 2
cd services/user-service && npm run dev

# ... and so on
```

### 4. Run with Docker
```bash
npm run docker:up      # Start all services + MongoDB + Redis
npm run docker:down    # Stop everything
```

---

## API Reference

### Auth Endpoints (via Gateway :3000)

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"secret123","role":"admin"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"secret123"}'
```

### User Endpoints (Protected)

```bash
# Get my profile
curl http://localhost:3000/api/users/me -H "Authorization: Bearer <token>"

# List all users (admin only)
curl http://localhost:3000/api/users -H "Authorization: Bearer <token>"
```

### Product Endpoints

```bash
# List products (public)
curl http://localhost:3000/api/products

# Create product (admin only)
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Laptop","price":999.99,"category":"Electronics","sku":"LAP001","stock":50}'
```

### Order Endpoints (All Protected)

```bash
# Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "items":[{"productId":"<id>","quantity":2}],
    "shippingAddress":{"street":"123 Main St","city":"Mumbai","state":"MH","zipCode":"400001","country":"IN"}
  }'
```

---

## Project Structure

```
micro-service/
├── docker-compose.yml
├── package.json                # Root automation scripts
├── .env / .env.example
└── services/
    ├── gateway/                # API Gateway (:3000)
    │   └── src/
    │       ├── utils/          # Integrated utilities
    │       ├── routes/
    │       └── index.js
    ├── user-service/           # Auth + Users (:3001)
    │   └── src/
    │       ├── utils/          # Integrated utilities
    │       ├── models/
    │       ├── services/
    │       └── index.js
    ├── product-service/        # Products (:3002)
    └── order-service/          # Orders (:3003)
```

Each service follows: `routes/ → controllers/ → services/ → models/`

---

## 🏗️ Infrastructure & DevOps

### Kubernetes Deployment (`infra/k8s`)
The project includes production-ready Kubernetes manifests:
*   **Base Config:** `base-config.yaml` (ConfigMaps & Secrets)
*   **Database:** `mongodb.yaml` (Deployment, Service, PVC)
*   **Services:** Individual manifests for Gateway, User, Product, and Order services.

**To deploy to a cluster:**
```bash
# 1. Apply config and database
kubectl apply -f infra/k8s/base-config.yaml
kubectl apply -f infra/k8s/mongodb.yaml

# 2. Apply services
kubectl apply -f infra/k8s/gateway.yaml
kubectl apply -f infra/k8s/user-service.yaml
kubectl apply -f infra/k8s/product-service.yaml
kubectl apply -f infra/k8s/order-service.yaml
```

### CI/CD Pipeline (`.github/workflows`)
A GitHub Actions workflow is provided in `.github/workflows/ci-cd.yml`:
*   **Trigger:** Runs on every push to `main` or pull request.
*   **Test Job:** Runs `npm install` and `npm test` for every service in parallel using a matrix.
*   **Build Job:** Builds Docker images for all services if tests pass.

---

## Design Decisions

1. **Service Isolation** — Each service is fully independent with its own utilities.
2. **AsyncLocalStorage** — Trace IDs propagate across async boundaries without parameter drilling.
3. **Circuit Breaker** — Prevents cascading failures when downstream services are unhealthy.
4. **Layered Architecture** — Clean separation: routes → controllers → services → models.
5. **Graceful Shutdown** — Drains in-flight requests before process exit.
6. **Event Bus** — Decoupled inter-module communication.




In your current setup, you are using a Service of type: LoadBalancer for your gateway. While this works, an Ingress is often a better choice for production environments.

When to use Ingress vs. LoadBalancer

In your current setup, you are using a Service of type: LoadBalancer for your gateway. While this works, an Ingress is often a better choice for production environments.

When to use Ingress vs. LoadBalancer

Feature	Service 

Cost	

LoadBalancer: Expensive: Cloud providers charge you for every LoadBalancer you create.	
Ingress: Economical: One LoadBalancer can route traffic to dozens of services.

Routing	

LoadBalancer: Simple port-based routing only.	
Ingress: Advanced: Supports Path-based (/api) and Host-based (shop.com) routing.

SSL/TLS	

LoadBalancer: Must be handled individually or via cloud-specific annotations.	
Ingress : Centralized: SSL certificates are managed in one place (Ingress Controller).


Layer	

LoadBalancer:  Operates at Layer 4 (TCP).	
Ingress: Operates at Layer 7 (HTTP/HTTPS).
