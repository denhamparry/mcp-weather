# mcp-weather

An MCP server to answer weather conditions for UK locations using OpenWeatherMap
API.

## Setup

1. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Set the environment variable:

   ```bash
   export OPENWEATHER_API_KEY="your_api_key_here"
   ```

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

## Build

```bash
npm run build
```

## HTTP Server

To run the MCP server as an HTTP service for local testing:

```bash
# Build and start the HTTP server
npm run build && node build/http.js
```

The server will start on port 3000. You can then test it using the MCP
Inspector:

1. Install MCP Inspector globally:

   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

2. Open MCP Inspector and connect to your HTTP server:

   ```bash
   mcp-inspector
   ```

3. In the inspector interface:

   - Select "HTTP" as the transport type
   - Enter `http://localhost:3000/mcp` as the URL
   - Click "Connect"

4. You can now test the `get_forecast` and `get_alerts` tools with UK
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

### Run with Docker Compose (recommended)

```bash
# Set your API key and run stdio version
OPENWEATHER_API_KEY="your_api_key_here" docker-compose run --rm mcp-weather
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
# Build both Docker images (requires REGISTRY_USER env var)
REGISTRY_USER=your-dockerhub-username task build

# Run stdio version (requires OPENWEATHER_API_KEY env var)
OPENWEATHER_API_KEY="your_api_key_here" task run-stdio

# Run HTTP version (requires OPENWEATHER_API_KEY env var)
OPENWEATHER_API_KEY="your_api_key_here" task run-http

# Clean up Docker images
task clean
```

## Test

To test Cardiff weather functionality:

```bash
# Set your API key first
export OPENWEATHER_API_KEY="your_api_key_here"

# Run the Cardiff weather test
npm test
```

## Note

This server uses the OpenWeatherMap API which provides weather data for
worldwide locations including the UK. The forecast shows temperature in Celsius
and wind speeds in meters per second.
