#!/usr/bin/env bash
# bootstrap-cluster.sh — single-shot setup/recovery script.
# Run this any time: fresh VM, after a reboot, after a crash, or just to
# make sure everything is in the desired state. Safe to re-run anytime.
#
# Real Anthropic API key is read from $SECRET_FILE (default
# ~/.study-app-secret, never committed to git). If absent, a placeholder
# secret is used and the AI features will return fetch errors until you
# create that file with your real key:
#   echo 'sk-ant-...' > ~/.study-app-secret
#   chmod 600 ~/.study-app-secret
set -euo pipefail

CLUSTER_NAME="cka-study"
REPO_DIR="$HOME/ultimate-devops-project-demo"
SECRET_FILE="${SECRET_FILE:-$HOME/.study-app-secret}"

echo "==> Checking cluster health..."
CLUSTER_RECREATED=false
if kind export kubeconfig --name "$CLUSTER_NAME" >/dev/null 2>&1 && \
   kubectl get nodes >/dev/null 2>&1; then
  echo "==> Cluster is healthy. Nodes:"
  kubectl get nodes
else
  echo "==> Cluster is broken or missing. Recreating..."
  kind delete cluster --name "$CLUSTER_NAME" >/dev/null 2>&1 || true
  cat <<EOF | kind create cluster --name "$CLUSTER_NAME" --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30001
        hostPort: 3001
        protocol: TCP
      - containerPort: 30080
        hostPort: 8080
        protocol: TCP
  - role: worker
  - role: worker
EOF
  kind export kubeconfig --name "$CLUSTER_NAME"
  echo "==> Waiting for nodes to be Ready..."
  kubectl wait --for=condition=Ready nodes --all --timeout=120s
  CLUSTER_RECREATED=true
fi

echo "==> Ensuring cluster nodes survive VM reboot (restart policy)..."
for node in "${CLUSTER_NAME}-control-plane" "${CLUSTER_NAME}-worker" "${CLUSTER_NAME}-worker2"; do
  docker update --restart unless-stopped "$node" >/dev/null 2>&1 || true
done

echo "==> Ensuring study-app-secrets is up to date..."
if [ -f "$SECRET_FILE" ]; then
  API_KEY="$(tr -d '[:space:]' < "$SECRET_FILE")"
  echo "==> Using real API key from $SECRET_FILE"
else
  API_KEY="REPLACE_WITH_REAL_KEY"
  echo "WARNING: $SECRET_FILE not found. Using placeholder key (AI calls will fail)."
  echo "  To fix: echo 'sk-ant-...' > $SECRET_FILE && chmod 600 $SECRET_FILE"
fi
SECRET_CHANGED=false
if ! kubectl get secret study-app-secrets >/dev/null 2>&1; then
  SECRET_CHANGED=true
elif [ "$(kubectl get secret study-app-secrets -o jsonpath='{.data.anthropic-api-key}' | base64 -d)" != "$API_KEY" ]; then
  SECRET_CHANGED=true
fi
if [ "$SECRET_CHANGED" = true ]; then
  kubectl create secret generic study-app-secrets \
    --from-literal=anthropic-api-key="$API_KEY" \
    --dry-run=client -o yaml | kubectl apply -f -
fi

cd "$REPO_DIR"

echo "==> Building and loading study-app image..."
docker build -t study-app:latest ./src/study-app/
kind load docker-image study-app:latest --name "$CLUSTER_NAME"

echo "==> Applying study-app manifests..."
kubectl apply -f kubernetes/study-app/deploy.yaml
kubectl apply -f kubernetes/study-app/svc.yaml

if [ "$SECRET_CHANGED" = true ] && kubectl get deployment study-app >/dev/null 2>&1; then
  echo "==> Secret changed; restarting deployment to pick up new key..."
  kubectl rollout restart deployment study-app
fi

echo "==> Waiting for rollout..."
kubectl rollout status deployment study-app --timeout=120s

kubectl get pods -l app.kubernetes.io/name=study-app
echo "==> study-app reachable at http://localhost:3001"

echo "==> Applying opentelemetry-demo manifests..."
kubectl apply -f kubernetes/complete-deploy.yaml

echo "==> Waiting for opentelemetry-demo pods (this pulls ~15 public images, may take a few minutes)..."
kubectl rollout status deployment opentelemetry-demo-frontendproxy --timeout=300s || true

kubectl get pods -l app.kubernetes.io/part-of=opentelemetry-demo
echo "==> Done. opentelemetry-demo reachable at http://localhost:8080 (Kind NodePort 30080 -> host port 8080)."
