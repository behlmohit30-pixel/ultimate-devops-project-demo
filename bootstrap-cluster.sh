#!/usr/bin/env bash
# bootstrap-cluster.sh — checks Kind cluster health, recreates if broken,
# then redeploys study-app. Run this any time after a VM restart/sleep.
set -euo pipefail

CLUSTER_NAME="cka-study"
REPO_DIR="$HOME/ultimate-devops-project-demo"

echo "==> Checking cluster health..."
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
  - role: worker
  - role: worker
EOF
  kind export kubeconfig --name "$CLUSTER_NAME"
  echo "==> Waiting for nodes to be Ready..."
  kubectl wait --for=condition=Ready nodes --all --timeout=120s
fi

echo "==> Checking study-app deployment..."
cd "$REPO_DIR"
if ! kubectl get deployment study-app >/dev/null 2>&1; then
  echo "==> study-app not deployed. Building and deploying..."
  docker build -t study-app:latest ./src/study-app/
  kind load docker-image study-app:latest --name "$CLUSTER_NAME"

  if ! kubectl get secret study-app-secrets >/dev/null 2>&1; then
    echo "WARNING: study-app-secrets not found. Create it with:"
    echo "  kubectl create secret generic study-app-secrets --from-literal=anthropic-api-key=YOUR_KEY"
  fi

  kubectl apply -f kubernetes/study-app/deploy.yaml
  kubectl apply -f kubernetes/study-app/svc.yaml
else
  echo "==> study-app already deployed."
fi

kubectl get pods -l app.kubernetes.io/name=study-app
echo "==> Done. App reachable at http://localhost:3001 (Kind NodePort 30001 -> host port 3001, no port-forward needed)."
