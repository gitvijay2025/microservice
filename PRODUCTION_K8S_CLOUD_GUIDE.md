# Production Cloud Deployment Guide: AWS (EKS) & GCP (GKE)

This document provides a high-level walkthrough for deploying your microservices architecture to managed Kubernetes services in the cloud.

---

## 1. AWS (Elastic Kubernetes Service - EKS)

### A. Prerequisites
Install the AWS CLI and `eksctl` (the official CLI for EKS).
```bash
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
```

### B. Create Cluster
```bash
eksctl create cluster \
  --name miro-prod \
  --region ap-south-1 \
  --nodegroup-name standard-nodes \
  --node-type t3.medium \
  --nodes 3 \
  --managed
```

### C. AWS Specifics
1.  **EBS CSI Driver**: Required for your `mongodb` PVC to work.
    ```bash
    eksctl create iamserviceaccount --name ebs-csi-controller-sa --namespace kube-system --cluster miro-prod --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy --approve --role-only
    eksctl create addon --name aws-ebs-csi-driver --cluster miro-prod --service-account-role-arn arn:aws:iam::<AWS_ACCOUNT_ID>:role/eksctl-miro-prod-addon-aws-ebs-csi-driver-role --force
    ```
2.  **Load Balancer Controller**: Required for your Ingress to create an AWS Application Load Balancer (ALB).

---

## 2. GCP (Google Kubernetes Engine - GKE)

### A. Prerequisites
Install the Google Cloud SDK and the GKE auth plugin.
```bash
sudo apt-get install google-cloud-sdk-gke-gcloud-auth-plugin
```

### B. Create Cluster
```bash
gcloud container clusters create miro-prod \
  --region asia-south1 \
  --num-nodes 3 \
  --machine-type e2-medium \
  --enable-autoscaling --min-nodes 3 --max-nodes 10
```

### C. GCP Specifics
1.  **GCE Ingress**: GKE comes with a built-in Ingress controller that creates a Google Cloud Load Balancer.
2.  **Persistent Disks**: GKE automatically handles PVCs using the `standard-rwo` storage class.

---

## 3. Production Best Practices (Both Clouds)

### 1. IAM Roles for Service Accounts (IRSA)
Instead of using broad node permissions, give each microservice its own IAM role with minimal permissions (e.g., `product-service` only gets access to its S3 bucket).

### 2. Managed Databases
For true production, consider using managed databases instead of running MongoDB inside K8s:
*   **AWS**: Amazon DocumentDB (Mongo compatible).
*   **GCP**: MongoDB Atlas (Managed service on GCP).

### 3. ExternalDNS
Install `ExternalDNS` to automatically sync your Kubernetes Ingress hosts (like `api.miro-app.com`) with AWS Route53 or Google Cloud DNS.

### 4. Secrets Management
Use **External Secrets Operator** to sync your Kubernetes Secrets directly from:
*   **AWS Secrets Manager**
*   **GCP Secret Manager**

---

## 4. Deploying via Argo CD
Once the cloud cluster is ready:
1.  Install Argo CD on the cloud cluster.
2.  Apply your `infra/k8s_new/argocd-app.yaml`.
3.  **Result**: Your cloud cluster will now automatically pull the latest code from GitHub just like your local Minikube did!
