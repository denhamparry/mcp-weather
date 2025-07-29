# mcp-weather

An MCP server to answer weather conditions for UK locations using OpenWeatherMap
API.

## Setup

1. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Set the environment variable:

   ```bash
   export OPENWEATHER_API_KEY="your_api_key_here"
   ```

> You can also set the environment variable in the `.envrc` file and use
> [direnv](https://direnv.net/) to load it automatically.

## Usage

This server provides two tools:

### get_forecast

Get weather forecast for a location using latitude and longitude coordinates.

**Parameters:**

- `latitude`: Latitude of the location (-90 to 90)
- `longitude`: Longitude of the location (-180 to 180)

**Example UK coordinates:**

- London: 51.5074, -0.1278
- Manchester: 53.4808, -2.2426
- Edinburgh: 55.9533, -3.1883
- Cardiff: 51.4816, -3.1791

### get_alerts

Get weather alerts for a location using latitude and longitude coordinates.

**Parameters:**

- `latitude`: Latitude of the location (-90 to 90)
- `longitude`: Longitude of the location (-180 to 180)

> This project uses [Task](https://taskfile.dev/) to build and run the project.
> You can install it with `brew install task`.

## Build

```bash
npm install && npm run build
```

## Run

### Stdio

To run the MCP server as a standard MCP server:

```bash
node build/index.js
```

### HTTP Server

To run the MCP server as an HTTP service for local testing:

```bash
# Build and start the HTTP server
npm run build && node build/http.js
```

The server will start on port 3000. You can then test it using the MCP
Inspector:

1. Run MCP Inspector locally:

   ```bash
   npx @modelcontextprotocol/inspector
   ```

2. In the inspector interface:

   - Select "HTTP" as the transport type
   - Enter `http://localhost:3000/mcp` as the URL
   - Click "Connect"

3. You can now test the `get_forecast` and `get_alerts` tools with UK
   coordinates directly in the inspector interface.

## Docker

The project provides two Docker configurations:

- `Docker/Dockerfile.stdio`: For standard MCP server with stdio communication
- `Docker/Dockerfile.http`: For HTTP-based MCP server

### Build Docker images

```bash
# Build stdio version
docker build -f Docker/Dockerfile.stdio -t mcp-weather:stdio .

# Build HTTP version
docker build -f Docker/Dockerfile.http -t mcp-weather:http .
```

### Run with Docker directly

```bash
# Run stdio version (standard MCP server)
docker run -it --rm -e OPENWEATHER_API_KEY="your_api_key_here" mcp-weather:stdio

# Run HTTP version (web server on port 3000)
docker run -p 3000:3000 --rm -e OPENWEATHER_API_KEY="your_api_key_here" mcp-weather:http
```

The stdio container runs the MCP server which communicates via stdio. Make sure
to run it in interactive mode (`-it`) to enable proper communication.

The HTTP container runs a web server on port 3000 for testing with MCP
Inspector.

### Using Task (task runner)

If you have [Task](https://taskfile.dev/) installed, you can use these commands:

```bash
# Build and push both Docker images to registry (requires REGISTRY_USER env var)
# Note: This pushes to docker.io/REGISTRY_USER/mcp-weather:latest-stdio and :latest-http
REGISTRY_USER=your-dockerhub-username task build

# Run stdio version locally (requires OPENWEATHER_API_KEY env var)
OPENWEATHER_API_KEY="your_api_key_here" task run-stdio

# Run HTTP version locally (requires OPENWEATHER_API_KEY env var)
OPENWEATHER_API_KEY="your_api_key_here" task run-http

# Clean up Docker images
task clean
```

## Kubernetes

The project includes Kubernetes manifests for deploying the MCP server in a
Kubernetes cluster. The deployment uses the HTTP variant for easier
connectivity.

### Kubernetes Resources

The `kubernetes/` directory contains:

- `pod.yaml`: Pod definition for the MCP weather server
- `service.yaml`: ClusterIP service to expose the pod internally
- `secret.yaml`: Example secret for the OpenWeatherMap API key

### Deploy to Kubernetes

#### Using Task (recommended)

```bash
# Deploy the MCP server with your API key
OPENWEATHER_API_KEY="your_api_key_here" task kubernetes-apply

# Port forward to access the service locally
task kubernetes-port-forward

# Clean up the deployment
task kubernetes-delete
```

#### Using kubectl directly

```bash
# Create the secret with your API key
kubectl create secret generic openweather-api-key \
  --from-literal=OPENWEATHER_API_KEY="your_api_key_here"

# Apply the Kubernetes manifests
kubectl apply -f kubernetes/

# Port forward to access the service (runs on localhost:3000)
kubectl port-forward svc/mcp-weather 3000:3000

# Delete the deployment when done
kubectl delete -f kubernetes/
```

### Accessing the Service

Once deployed, you can:

1. **Port forward** to test locally:

   ```bash
   kubectl port-forward svc/mcp-weather 3000:3000
   ```

   Then access the MCP server at `http://localhost:3000/mcp`

2. **Test with MCP Inspector**:

   ```bash
   npx @modelcontextprotocol/inspector
   ```

   Connect to `http://localhost:3000/mcp` while port forwarding is active

### Kubernetes Configuration Notes

- The pod uses the `denhamparry/mcp-weather:latest-http` image
- API key is stored as a Kubernetes secret for security
- Service exposes port 3000 internally within the cluster
- Pod has `imagePullPolicy: Always` to ensure latest image is used

## Test

To test weather functionality:

```bash
# Set your API key first
export OPENWEATHER_API_KEY="your_api_key_here"

# Run the Cardiff weather test
npm test
```

## Examples

The `examples/` directory contains configuration examples for:

- Claude Code integration (`examples/claude code/`)
- Claude Desktop integration (`examples/claude desktop/`)

## Note

This server uses the OpenWeatherMap API which provides weather data for
worldwide locations including the UK. The forecast shows temperature in Celsius
and wind speeds in meters per second.
