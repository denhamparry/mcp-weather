# MCP Weather Server - Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the MCP Weather
server.

## Prerequisites

- Kubernetes cluster (local or remote)
- kubectl configured to access your cluster
- Docker for building the image
- OpenWeatherMap API key

## Building the Docker Image

1. First, build the TypeScript code:

```bash
cd ..
npm run build
```

1. Build the Docker image:

```bash
docker build -f kubernetes/Dockerfile -t mcp-weather:latest .
```

## Deployment Steps

### 1. Create namespace

```bash
kubectl create namespace mcp-weather
```

### 2. Update the secret with your API key

Edit `kubernetes/secret.yaml` and replace `YOUR_OPENWEATHER_API_KEY_HERE` with
your actual OpenWeatherMap API key.

### 3. Deploy using kubectl

```bash
kubectl apply -k kubernetes/
```

Or deploy individual resources:

```bash
kubectl apply -f kubernetes/secret.yaml -n mcp-weather
kubectl apply -f kubernetes/deployment.yaml -n mcp-weather
kubectl apply -f kubernetes/service.yaml -n mcp-weather
```

### 4. Verify deployment

```bash
kubectl get all -n mcp-weather
kubectl logs -n mcp-weather deployment/mcp-weather
```

## Connecting Locally

### Option 1: Port Forward (Recommended)

```bash
kubectl port-forward -n mcp-weather service/mcp-weather 3000:3000
```

Then configure your MCP client to connect to `localhost:3000`.

### Option 2: NodePort Service

Modify the service type in `service.yaml` from `ClusterIP` to `NodePort`:

```yaml
spec:
  type: NodePort
  ports:
    - port: 3000
      targetPort: 3000
      nodePort: 30300 # Choose a port between 30000-32767
```

Then connect to `<node-ip>:30300`.

### Option 3: LoadBalancer (Cloud environments)

Change the service type to `LoadBalancer` if running in a cloud environment that
supports it.

## MCP Client Configuration

Configure your MCP client to connect to the exposed service. Example
configuration:

```json
{
  "mcpServers": {
    "weather": {
      "command": "nc",
      "args": ["localhost", "3000"],
      "env": {}
    }
  }
}
```

## Scaling

The MCP server is stateless and can be scaled horizontally:

```bash
kubectl scale deployment/mcp-weather -n mcp-weather --replicas=3
```

## Cleanup

To remove all resources:

```bash
kubectl delete namespace mcp-weather
```

## Troubleshooting

1. Check pod logs:

```bash
kubectl logs -n mcp-weather -l app=mcp-weather
```

1. Describe pod for events:

```bash
kubectl describe pod -n mcp-weather -l app=mcp-weather
```

1. Verify secret is mounted:

```bash
kubectl exec -n mcp-weather deployment/mcp-weather -- env | grep OPENWEATHER
```

## Security Notes

- The secret containing the API key should be properly secured
- Consider using Kubernetes secrets management solutions like Sealed Secrets or
  External Secrets Operator
- The container runs as non-root user (UID 1001)
- Read-only root filesystem is enforced for security
