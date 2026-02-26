# Kubernetes (GKE Autopilot) Setup for OpenClaw Instances

This guide covers the one-time infrastructure setup to run OpenClaw agent instances on GKE Autopilot while keeping the main Kredo app on the existing GCP VM.

## Prerequisites

- `gcloud` CLI installed and authenticated
- Existing GCP project with billing enabled
- Existing GCP VM running the Kredo app

## 1. Create GKE Autopilot Cluster

Create the cluster in the **same VPC and region** as your existing VM so that pod IPs are directly routable.

```bash
# Set your project
export PROJECT_ID=peppy-freedom-488113-i1
export REGION=europe-west1
export CLUSTER_NAME=openclaw-cluster

gcloud container clusters create-auto $CLUSTER_NAME \
  --project=$PROJECT_ID \
  --region=$REGION \
  --network=default \
  --subnetwork=default
```

After creation, get credentials for kubectl:

```bash
gcloud container clusters get-credentials $CLUSTER_NAME \
  --region=$REGION \
  --project=$PROJECT_ID
```

### Create the namespace

```bash
kubectl create namespace openclaw
```

## 2. Create Artifact Registry Repository

```bash
export REPOSITORY=openclaw

gcloud artifacts repositories create $REPOSITORY \
  --repository-format=docker \
  --location=$REGION \
  --project=$PROJECT_ID \
  --description="OpenClaw Docker images"
```

### Build and push the initial image

```bash
# Authenticate Docker to Artifact Registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# Build and push
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/openclaw"

docker build -f Dockerfile.openclaw -t ${IMAGE_TAG}:latest .
docker push ${IMAGE_TAG}:latest
```

## 3. Create Filestore NFS Instance

```bash
export FILESTORE_NAME=openclaw-nfs
export FILESTORE_ZONE=${REGION}-b
export SHARE_NAME=openclaw_data

gcloud filestore instances create $FILESTORE_NAME \
  --project=$PROJECT_ID \
  --zone=$FILESTORE_ZONE \
  --tier=BASIC_HDD \
  --file-share=name=$SHARE_NAME,capacity=1TB \
  --network=name=default
```

Get the Filestore IP:

```bash
gcloud filestore instances describe $FILESTORE_NAME \
  --project=$PROJECT_ID \
  --zone=$FILESTORE_ZONE \
  --format="get(networks[0].ipAddresses[0])"
```

### Mount NFS on the Kredo VM

SSH into your VM and mount the Filestore share:

```bash
# Install NFS client
sudo apt-get install -y nfs-common

# Create mount point
sudo mkdir -p /mnt/openclaw-instances

# Mount (replace FILESTORE_IP with actual IP)
echo "FILESTORE_IP:/openclaw_data /mnt/openclaw-instances nfs defaults 0 0" | sudo tee -a /etc/fstab
sudo mount -a

# Verify
df -h /mnt/openclaw-instances
```

### Create K8s PersistentVolume and PVC for Filestore

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolume
metadata:
  name: openclaw-nfs-pv
spec:
  capacity:
    storage: 1Ti
  accessModes:
    - ReadWriteMany
  nfs:
    server: FILESTORE_IP
    path: /openclaw_data
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: openclaw-nfs-pvc
  namespace: openclaw
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: ""
  volumeName: openclaw-nfs-pv
  resources:
    requests:
      storage: 1Ti
EOF
```

**Important:** After creating the PVC, update the volume spec in `kubernetes.ts` to use the PVC instead of hostPath. Replace the `volumes` section in `buildDeploymentSpec()`:

```typescript
volumes: [
  {
    name: "instance-config",
    persistentVolumeClaim: { claimName: "openclaw-nfs-pvc" },
  },
  {
    name: "instance-workspace",
    persistentVolumeClaim: { claimName: "openclaw-nfs-pvc" },
  },
],
```

## 4. Configure VM for K8s API Access

The Kredo server on the VM needs to talk to the GKE API. Install kubectl and get cluster credentials:

```bash
# Install kubectl on the VM
sudo apt-get install -y kubectl

# Get cluster credentials (creates ~/.kube/config)
gcloud container clusters get-credentials $CLUSTER_NAME \
  --region=$REGION \
  --project=$PROJECT_ID

# Verify access
kubectl get namespaces
```

The `@kubernetes/client-node` library in the Kredo server will automatically use `~/.kube/config`.

## 5. VPC Firewall Rule

GKE Autopilot with VPC-native networking makes pod IPs routable within the VPC. Verify your VM can reach pods:

```bash
# Check the pod CIDR (secondary range)
gcloud container clusters describe $CLUSTER_NAME \
  --region=$REGION \
  --format="get(clusterIpv4Cidr)"

# If needed, create a firewall rule allowing traffic from VM to pod CIDR
gcloud compute firewall-rules create allow-vm-to-pods \
  --project=$PROJECT_ID \
  --network=default \
  --allow=tcp:18789 \
  --source-tags=your-vm-network-tag \
  --destination-ranges=POD_CIDR
```

## 6. Environment Variables

Add these to your Kredo server environment (`.env` or systemd service):

```bash
# K8s namespace for OpenClaw pods
K8S_NAMESPACE=openclaw

# OpenClaw image (full Artifact Registry path)
OPENCLAW_IMAGE=europe-west1-docker.pkg.dev/peppy-freedom-488113-i1/openclaw/openclaw:latest

# Instance data path (NFS mount point on the VM)
OPENCLAW_INSTANCES_PATH=/mnt/openclaw-instances

# Set to "true" if running Kredo inside K8s (not on the VM)
K8S_IN_CLUSTER=false
```

## 7. GitHub Actions Secrets

For the `build-openclaw.yml` workflow, ensure these secrets are set:

- `GCP_WORKLOAD_IDENTITY_PROVIDER` — `projects/973005732105/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- `GCP_SA_EMAIL` — `openclaw-ci@peppy-freedom-488113-i1.iam.gserviceaccount.com`
- `GCP_PROJECT_ID` — `peppy-freedom-488113-i1`
- `GCP_INSTANCE_NAME` — `openclaw-host`
- `GCP_ZONE` — `europe-west1-b`
- `SSH_PRIVATE_KEY` — Your SSH private key for the VM

The service account needs these roles:
- `roles/artifactregistry.writer` — Push images
- `roles/compute.osLogin` — SSH access to the VM
- `roles/compute.instanceAdmin.v1` — Compute instance access
- `roles/container.developer` — (Optional) If you want CI to also deploy to GKE

## Verification

1. **Check cluster:** `kubectl get nodes` (Autopilot provisions nodes on demand)
2. **Check NFS:** Verify `/mnt/openclaw-instances` is mounted on the VM
3. **Create a test instance** via the Kredo UI and verify:
   - `kubectl get deployments -n openclaw` shows the deployment
   - `kubectl get pods -n openclaw` shows a running pod
   - The gateway bridge connects (check Kredo server logs)
4. **Test connectivity:** From the VM, `curl http://POD_IP:18789/health`

## Rollback

If issues arise, the original `docker.ts` is still in the codebase. To rollback:

1. In `routers.ts`: change `import * as k8s from "./kubernetes"` back to `import * as docker from "./docker"`
2. In `gatewayBridge.ts`: revert the import and restore port-based connection logic
3. In `chat.ts`: revert to port-based URL construction
4. Redeploy the Kredo server
