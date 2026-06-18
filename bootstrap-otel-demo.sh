#!/usr/bin/env bash
# bootstrap-otel-demo.sh — single-shot setup/recovery for a SEPARATE Kind
# cluster running the OpenTelemetry Demo microservices app. Kept isolated
# from cka-study (the study-app cluster) so it's safe to break/recreate
# during CKA Troubleshooting practice without risking study-app's uptime.
#
# 3-node (control-plane + 2 workers), matching cka-study's topology, so
# multi-node CKA exercises (drain/cordon/scheduling) are meaningful here.
set -euo pipefail

CLUSTER_NAME="otel-demo"
REPO_DIR="$HOME/ultimate-devops-project-demo"

echo "==> Checking otel-demo cluster health..."
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
      - containerPort: 30080
        hostPort: 8080
        protocol: TCP
  - role: worker
  - role: worker
EOF
  kind export kubeconfig --name "$CLUSTER_NAME"
  echo "==> Waiting for nodes to be Ready..."
  kubectl wait --for=condition=Ready nodes --all --timeout=120s
fi

echo "==> Ensuring nodes survive VM reboot (restart policy)..."
for node in "${CLUSTER_NAME}-control-plane" "${CLUSTER_NAME}-worker" "${CLUSTER_NAME}-worker2"; do
  docker update --restart unless-stopped "$node" >/dev/null 2>&1 || true
done

cd "$REPO_DIR"

echo "==> Applying opentelemetry-demo manifests..."
kubectl apply -f kubernetes/complete-deploy.yaml

echo "==> Waiting for frontendproxy rollout (pulls ~15 public images, may take a few minutes on first run)..."
kubectl rollout status deployment opentelemetry-demo-frontendproxy --timeout=300s || true

kubectl get pods -l app.kubernetes.io/part-of=opentelemetry-demo
echo "==> Done. opentelemetry-demo reachable at http://localhost:8080 (Kind NodePort 30080 -> host port 8080)."
