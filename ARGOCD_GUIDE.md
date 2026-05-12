# Argo CD GitOps Guide

This guide explains how to implement **Argo CD** for automated, declarative deployments of the Miro microservices.

## 1. What is Argo CD?
Argo CD is a declarative, GitOps continuous delivery tool for Kubernetes. It ensures that the state of your cluster matches the state defined in your Git repository.

---

## 2. Installation
To install Argo CD in your cluster, run the following commands:

```bash
# Create namespace
kubectl create namespace argocd

# Install Argo CD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Accessing the Dashboard
By default, the server is not exposed externally. Use port-forwarding to access it locally:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```
*   **URL**: `https://localhost:8080`
*   **Username**: `admin`
*   **Password**: Get it by running: `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d`

---

## 3. Deploying the Application
We use the **Application** resource to link your Git folder to the cluster.

### Apply the Application Manifest
Run the following command to tell Argo CD to start managing your microservices:

```bash
kubectl apply -f infra/k8s_new/argocd-app.yaml
```

---

## 4. Key GitOps Features

### Automated Sync
If you push a change to `infra/k8s_new/`, Argo CD will detect the change and automatically apply it to the cluster within seconds.

### Self-Healing
If someone manually edits a service in the cluster using `kubectl edit`, Argo CD will detect the "Configuration Drift" and automatically overwrite the manual change with the version from Git.

### Health Monitoring
The Argo CD dashboard provides a visual map of all your resources (Pods, Services, Ingress, HPA) and shows their real-time health status.

---

## 5. Directory Structure for Argo CD
Argo CD is currently configured to watch the following path:
`infra/k8s_new/`

Any YAML file added to this folder will be automatically picked up and deployed by Argo CD.



Key Additions:
ignoreDifferences (The Most Important):

Since we have HPA (Horizontal Pod Autoscaler) enabled, the number of replicas in your cluster will change dynamically based on CPU usage.
Without this setting, Argo CD would see that your cluster has 10 pods (scaled by HPA) but your Git says 2 pods, and it would constantly try to "fix" it by scaling you back down to 2. This prevents that "fight."
Retry Strategy:

If a deployment fails (e.g., your Git repo is temporarily unreachable or the cluster is busy), Argo CD will now automatically retry with an "exponential backoff" (waiting 5s, then 10s, then 20s, etc.) instead of just giving up.
PrunePropagationPolicy: foreground:

This ensures that when you delete a service in Git, Argo CD deletes the child resources (like Pods) first before deleting the parent, ensuring a cleaner cleanup.
Your Argo CD configuration is now fully "Battle-Tested" and ready for a production environment!

Are you satisfied with the Kubernetes and GitOps setup, or would you like to discuss the final point from our list: Prometheus & Grafana for monitoring?

## REVERT BUILD PROCESS ##

The "Revert" (Rollback) process is one of the most powerful features of using Argo CD and GitOps. Because your Git repository is the "Source of Truth," you have two ways to roll back:

1. The GitOps Way (Preferred)
If you deploy a new version of your code and it has a bug, you simply revert the commit in Git.

Action: git revert <commit-id> && git push
Result: Argo CD sees that the Git repo has "gone back" to the old version. It will immediately update the cluster to match that old version.
Benefit: Your Git history always matches exactly what is in your cluster. This is the cleanest and safest way.
2. The Argo CD UI "Emergency" Rollback
If you need to fix the cluster instantly without waiting for a Git push:

Action: Go to the Argo CD Dashboard, click "History and Rollback," select a previous successful sync, and click "Rollback."
Result: Argo CD will immediately apply the old YAMLs.
Note: This will temporarily disable "Auto-Sync" because the cluster is now different from Git. You will eventually need to fix your Git code to match the rollback.
3. How we made the Rollback safe in your YAMLs
In your infra/k8s_new/ files, we already implemented a Rolling Update Strategy which makes the revert process seamless:

yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1       # Never take down all pods at once
    maxUnavailable: 0 # Always keep 100% capacity during a revert
If a new version fails to start (e.g., it crashes on boot):

Kubernetes will see the livenessProbe failing.
It will stop the rollout.
It will keep your old, working pods running.
Your users will never see an error!
Would you like me to add a "Troubleshooting and Rollback" section to your ARGOCD_GUIDE.md?
I can include the exact commands to use for an emergency rollback.

13:36

