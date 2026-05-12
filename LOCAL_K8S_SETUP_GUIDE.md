# Local Ubuntu: Kubernetes & Argo CD Setup Guide

This guide provides a step-by-step walkthrough to set up a professional Kubernetes development environment with Argo CD on your local Ubuntu system.

---

## Phase 1: Install Core Tools

### 1. Install Docker
```bash
sudo apt update
sudo apt install -y docker.io
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# NOTE: Log out and log back in for group changes to take effect!
```

### 2. Install kubectl
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

### 3. Install Minikube
```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

---

## Phase 2: Start & Configure Your Cluster

### 1. Start Minikube
We use Calico as the network plugin to support **Network Policies**.
```bash
minikube start --cpus 4 --memory 8192 --network-plugin=cni --cni=calico
```

### 2. Enable Required Add-ons
```bash
# For HPA Scaling
minikube addons enable metrics-server

# For Routing & Ingress
minikube addons enable ingress
```

### 3. Open the Tunnel (IMPORTANT)
Open a **new terminal** and run this command. Keep it running! It enables LoadBalancer support on your local machine.
```bash
minikube tunnel
```

---

## Phase 3: Setup Argo CD

### 1. Install Argo CD
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### 2. Access the Dashboard
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```
- **URL**: `https://localhost:8080`
- **User**: `admin`
- **Pass**: `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d`

---

## Phase 4: Configure Local DNS
To access your app via `api.miro-app.local`, you need to point that domain to your Minikube IP.

1.  Get your Minikube IP: `minikube ip`
2.  Edit your hosts file: `sudo nano /etc/hosts`
3.  Add this line (replace `<IP>` with your minikube IP):
    ```
    <IP> api.miro-app.local
    ```

---

## Phase 5: Your Development Workflow

1.  **Push to GitHub**: Push your latest code (including `infra/k8s_new/`) to your GitHub repository.
2.  **Argo CD Connect**: In the Argo CD UI, add your Repository and apply the `infra/k8s_new/argocd-app.yaml` manifest.
3.  **Code & Commit**:
    *   Change your service code or K8s YAML.
    *   `git commit -m "Update user service"`
    *   `git push`
4.  **Auto-Sync**: Watch the Argo CD dashboard automatically pull your changes and update your local Ubuntu cluster!

---

## Useful Debugging Commands
*   **Check Pods**: `kubectl get pods -A`
*   **Check HPA**: `kubectl get hpa`
*   **Check Logs**: `kubectl logs <pod-name>`
*   **Minikube Dashboard**: `minikube dashboard`
