# Patient Service Kubernetes Setup

## Build Docker image (local cluster)

```bash
cd backend/patient-service
docker build -t patient-service:latest .
```

## Apply Kubernetes manifests

```bash
kubectl apply -f k8s/deployments/patient-secret.yaml
kubectl apply -f k8s/deployments/patient-service.yaml
```

## Verify

```bash
kubectl get pods -l app=patient-service
kubectl get svc patient-service
kubectl logs deploy/patient-service
```

## Notes

- Replace `JWT_SECRET` value in `secret.yaml` before deploying.
- Replace `JWT_SECRET` value in `k8s/deployments/patient-secret.yaml` before deploying.
- `MONGO_URI` points to in-cluster MongoDB service `mongodb:27017`.
- Health endpoint used by probes: `/health`.
