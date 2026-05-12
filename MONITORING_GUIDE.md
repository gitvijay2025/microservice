# Monitoring Guide: Prometheus & Grafana

This guide explains how to implement a professional observability stack to monitor your Miro microservices.

---

## 1. Installation (The Helm Way)
The industry standard for installing Prometheus and Grafana is the **`kube-prometheus-stack`**.

### Local (Minikube) Setup
```bash
# 1. Add the Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# 2. Create a namespace
kubectl create namespace monitoring

# 3. Install the stack
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring
```

---

## 2. Accessing the Dashboards

### Grafana (Visualization)
```bash
kubectl port-forward svc/prometheus-grafana -n monitoring 3000:80
```
- **URL**: `http://localhost:3000`
- **User**: `admin`
- **Pass**: `prom-operator` (default)

### Prometheus (Data)
```bash
kubectl port-forward svc/prometheus-kube-prometheus-prometheus -n monitoring 9090
```

---

## 3. How to Monitor Your Microservices
Prometheus doesn't know about your services automatically. We use **ServiceMonitors** to tell it what to watch.

### Step 1: Add Labels to your Services
Prometheus looks for services with specific labels. Your current services in `k8s_new` are already labeled with `app: <name>`.

### Step 2: Create a ServiceMonitor
Apply the `infra/k8s_new/service-monitor.yaml` file (I have created this for you).

```bash
kubectl apply -f infra/k8s_new/service-monitor.yaml
```

---

## 4. Key Metrics to Watch
Once Grafana is open, look for these "Golden Signals":
1.  **Latency**: How long do your `/api` requests take?
2.  **Traffic**: How many requests per second (RPS) is each service handling?
3.  **Errors**: What is the percentage of `500` errors?
4.  **Saturation**: How close are your Pods to their CPU/Memory limits?

---

## 5. Summary of the Workflow
1.  **Prometheus** scrapes metrics from your Node.js apps (via the `/health` endpoint).
2.  **Grafana** pulls that data and displays it on a dashboard.
3.  **Alertmanager** (included in the stack) notifies you if a service goes down.
