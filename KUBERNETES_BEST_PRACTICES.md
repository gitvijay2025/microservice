# Kubernetes Best Practices Guide

This document outlines the implementation of Kubernetes best practices for microservices within this repository, focusing on reliability, availability, and seamless deployments.

## 1. Advanced Health Probes
Probes allow Kubernetes to monitor the health of your containers and take action if something goes wrong.

### Probe Types
*   **Liveness Probe**: Determines if the container is running. If it fails, K8s kills the container and starts a new one.
*   **Readiness Probe**: Determines if the container is ready to accept traffic. If it fails, K8s removes the Pod from Service endpoints.
*   **Startup Probe**: Disables liveness and readiness checks until the app has started. Critical for apps with long boot times.

### Implementation Example
Update your deployment manifests (e.g., `user-service.yaml`) to include all three:

```yaml
spec:
  containers:
    - name: user-service
      # ... image and ports ...
      startupProbe:
        httpGet:
          path: /health
          port: 3001
        failureThreshold: 30
        periodSeconds: 10 # Gives the app 5 mins (30 * 10s) to start
      
      livenessProbe:
        httpGet:
          path: /health
          port: 3001
        initialDelaySeconds: 5
        periodSeconds: 15
      
      readinessProbe:
        httpGet:
          path: /ready  # Use the specialized readiness endpoint
          port: 3001
        initialDelaySeconds: 5
        periodSeconds: 10
```

---

## 2. Externalized Configurations
Decoupling configuration from code ensures that you can move images across environments (Dev, QA, Prod) without rebuilding.

### Best Practices
*   **ConfigMaps**: Use for non-sensitive data (URLs, feature flags).
*   **Secrets**: Use for sensitive data (API keys, DB passwords).
*   **Environment Variables**: Inject these into your container using `envFrom` for bulk loading or `valueFrom` for specific keys.

### Implementation Example
```yaml
envFrom:
  - configMapRef:
      name: micro-config
  - secretRef:
      name: micro-secrets
```

---

## 3. Graceful Shutdowns
When a Pod is terminated (e.g., during a rolling update), K8s sends a `SIGTERM` signal. Your application must catch this signal to stop accepting new requests and finish processing active ones.

### Infrastructure Requirement
Add `terminationGracePeriodSeconds` and a `preStop` hook. The `preStop` hook is crucial because it ensures the Service (Load Balancer) has enough time to remove the Pod from its list before the app starts shutting down.

```yaml
spec:
  terminationGracePeriodSeconds: 60
  containers:
    - name: user-service
      lifecycle:
        preStop:
          exec:
            command: ["/bin/sleep", "15"] # Wait for K8s to update iptables/endpoints
```

### Application Requirement (Node.js)
The services in this repo use `gracefulShutdown.js` in `utils` to handle `SIGTERM`:

```javascript
process.on('SIGTERM', () => shutdown('SIGTERM'));
```

---

## 4. Rolling Update Strategy
To ensure zero-downtime deployments, configure the deployment strategy.

### Strategy Parameters
*   **maxSurge**: How many extra Pods can be created during the update (e.g., `1` or `25%`).
*   **maxUnavailable**: How many Pods can be unavailable during the update (e.g., `0` for strict zero-downtime).

### Implementation Example
```yaml
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1       # Create one new pod before killing an old one
      maxUnavailable: 0 # Ensure we always have at least 'replicas' count running
```

---

## 5. Combined Best-Practice Manifest
Here is a reference for a fully optimized Deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: example-service
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: example-service
  template:
    metadata:
      labels:
        app: example-service
    spec:
      terminationGracePeriodSeconds: 60
      containers:
        - name: example-service
          image: my-image:latest
          ports:
            - containerPort: 3000
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sleep", "15"]
          startupProbe:
            httpGet:
              path: /health
              port: 3000
            failureThreshold: 30
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            periodSeconds: 20
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            periodSeconds: 10
          envFrom:
            - configMapRef:
                name: micro-config
            - secretRef:
                name: micro-secrets
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
```


========================================================

 To take your microservices architecture to a production-grade level, here are several advanced Kubernetes features you should consider implementing:

## 1. Scalability: Horizontal Pod Autoscaler (HPA)
Instead of manually setting replicas: 3, you can let Kubernetes scale your services automatically based on demand.

# How it works: If CPU or Memory usage exceeds a threshold (e.g., 70%), K8s automatically spins up more Pods.
Benefit: Handles sudden traffic spikes and saves costs during low-traffic periods.


# 2. Security: Network Policies
By default, every Pod in Kubernetes can talk to every other Pod. This is a security risk.

# How it works: You define rules that only allow specific traffic. 
For example:
mongodb should only accept traffic from your microservices.
user-service should not be able to talk to order-service directly if not needed.
Benefit: Implements the "Principle of Least Privilege" at the network level.

# 3. Reliability: Pod Anti-Affinity
If you have 3 replicas of a service, Kubernetes might accidentally put all of them on the same physical server (Node). If that Node fails, your whole service goes down.

How it works: You add a rule that tells Kubernetes "Do not put two replicas of the same service on the same Node."
Benefit: True High Availability (HA) across physical hardware.



# 4. Storage: Persistent Volumes (PV & PVC)
Currently, your MongoDB uses emptyDir, which means data is lost if the pod restarts.

How it works: You request a "Persistent Volume" from the cloud provider (like AWS EBS or Google Persistent Disk).
Benefit: Your database data survives restarts, upgrades, and node failures.

# 5. Management: Helm Charts
As your project grows, managing 10+ YAML files becomes difficult.

How it works: Helm is a "Package Manager" for Kubernetes. You create a single template, and use a values.yaml file to manage configurations for Dev, Staging, and Prod.
Benefit: Standardizes deployments and makes rollbacks extremely easy.

# 6. Security: Pod Security Standards (Admission Controllers)
How it works: Prevents containers from running as root or accessing the host filesystem.
Benefit: Protects the underlying cluster if one of your applications is compromised.

# 7. Observability: Prometheus & Grafana
How it works: Scrapes metrics from your /health endpoints and visualizes them in dashboards.
Benefit: You get real-time alerts if a service becomes slow or starts failing.



## 1. Scalability: Horizontal Pod Autoscaler (HPA)

I have explored and implemented Horizontal Pod Autoscaling (HPA) for your project.

1. New HPA Configuration
I created a new file infra/k8s_new/hpa.yaml  that automatically manages the scaling for all your services.

Scaling Rules Implemented:

# Microservices (User, Product, Order):
  * Min Replicas: 2
  * Max Replicas: 10
  * Trigger: Scales up if CPU usage > 60% or Memory usage > 80%.

# Gateway:
  * Min Replicas: 3
  * Max Replicas: 15 (Gateway typically needs more capacity as the entry point).
  * Trigger: Scales up if CPU usage > 50%.

2. How to Test Scaling
To see the HPA in action, you can simulate a high traffic load on your services:
# * kubectl get hpa -w

* Generate Load (Run this in a separate terminal):

# kubectl run -i --tty load-generator --rm --image=busybox:1.28 --restart=Never -- /bin/sh -c "while sleep 0.01; do wget -q -O- http://user-service:3001/health; done"

3. Important Prerequisite
For this to work, you must ensure the Metrics Server is enabled in your cluster.

Minikube: minikube addons enable metrics-server
Cloud (EKS/GKE): Usually enabled by default, but check kubectl get pods -n kube-system for a metrics-server pod.
Your KUBERNETES_BEST_PRACTICES.md document has also been updated with these details for your reference.

Would you like to move on to the next topic, such as "Network Policies" for security or "Persistent Volumes" for the database?

=================
This is an excellent question and one of the most common points of confusion when using HPA.

The Short Answer:
Once you apply the HPA, the HPA takes full control and overrides the replicas defined in your Deployment YAML.

How the "Order" works in practice:
Phase 1 (Initial Apply): When you run kubectl apply -f order-service.yaml, Kubernetes looks at replicas: 3 and starts 3 Pods.

Phase 2 (HPA Activation): When you run kubectl apply -f hpa.yaml, the HPA controller starts monitoring the order-service. It immediately checks the CPU usage.

Phase 3 (The Override): If your order-service is currently idle (0% CPU), the HPA will see that you have 3 pods running, but your minReplicas is 2. It will immediately terminate 1 pod to bring the count down to 2.

Why this happens:
The HPA controller's job is to constantly update the scale sub-resource of the Deployment. It "wins" because it runs a loop every 15 seconds to enforce its rules, whereas the Deployment's replicas field is only looked at when you manually apply the YAML.

Best Practice for your project:
To avoid confusion and "flapping" (where a service starts with 3 pods and immediately kills one), you should do one of the following:

Option A: Set Deployment replicas to match HPA minReplicas In order-service.yaml, change replicas: 3 to replicas: 2. This way, the starting state and the HPA's minimum state are the same.

Option B: Remove the replicas field entirely (Recommended for Prod) If you remove replicas: 3 from your Deployment manifest, Kubernetes will default to 1 pod initially, and then the HPA will immediately scale it up to your minReplicas (2 or 3). This is the cleanest way to manage scaling in production because it makes it clear that HPA is the source of truth.

Would you like me to update your microservice manifests to match the HPA minReplicas?


#### Mongo Security ###

I have created the 

infra/k8s_new/network-policy.yaml
 file, which implements a robust security layer for your cluster.

What these policies do:
Isolation: If an attacker compromises your gateway, they can no longer directly access the mongodb database because the mongodb-policy explicitly blocks all traffic except from the microservices.
Strict Routing: Microservices will now reject any traffic that doesn't originate from the gateway.
Encapsulation: The database is now "hidden" behind the application layer, reducing the attack surface.
How to test the Security:
You can verify these policies are working by trying to access the database from an unauthorized Pod:

Run a temporary "attacker" Pod:
bash
kubectl run attacker --image=busybox --restart=Never -it -- /bin/sh
Try to ping the database from inside the attacker Pod:
bash
# This should FAIL/TIMEOUT if the policy is working
nc -zv mongodb 27017
Try the same command from a microservice Pod:
bash
# This should SUCCEED
kubectl exec -it <user-service-pod-name> -- nc -zv mongodb 27017

### Mongo Security ##



### POD Security ###

I have now implemented Point #6: Pod Security Standards across all your microservices and the database in the infra/k8s_new/ directory.

Security Enhancements Added:
Non-Root Execution: Added runAsNonRoot: true to all Pods. This ensures that even if an attacker breaks into a container, they are not the "root" user of the system.
Privilege Escalation Blocked: Added allowPrivilegeEscalation: false to prevent processes from gaining more privileges than their parent process.
Capability Dropping: Added capabilities: { drop: ["ALL"] } to remove all unnecessary Linux kernel capabilities, drastically reducing the attack surface.
User Isolation:
Microservices are configured to run as User 1000.
MongoDB is configured to run as User 999 (the standard MongoDB user) with fsGroup: 999 to ensure it has correct permissions on the Persistent Volume.
Where to find these changes:

infra/k8s_new/user-service.yaml

infra/k8s_new/product-service.yaml

### POD Security ##



The value 1000 is the standard convention for a non-root user in the Linux world.

Here is why we used it across your services:

1. It is a Safe Default
In most Docker images (especially Node.js), the first non-root user created is assigned the UID 1000. By setting runAsUser: 1000, we are explicitly telling Kubernetes to run the process as this limited user rather than the super-user (root, which is UID 0).

2. Consistency
Using the same UID across all your microservices (gateway, user, order, product) makes it easier to manage security. If these services ever needed to share a persistent volume, they would all have the same file-level permissions because they share the same User ID.

3. The MongoDB Exception (UID 999)
You might have noticed I used 999 for MongoDB instead of 1000.

Why? The official MongoDB Docker image is pre-configured to run as a user named mongodb with the ID 999.
If we forced MongoDB to run as 1000, it wouldn't have permission to access its own internal data folders that were created for user 999.
Summary
UID 0: Root (Dangerous! Avoid in production).
UID 1000: Standard App User (Safe, used for your services).
UID 999: Specialized Database User (Required for the Mongo image).
This setup follows the Principle of Least Privilege, ensuring that even if someone "breaks out" of your application, they are trapped as a low-level user with no power to harm the underlying server.