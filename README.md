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

## HTTP Server with OAuth Authentication

The HTTP server now includes Auth0 OAuth authentication for secure access to the MCP endpoints.

### Quick Setup

1. **Configure Auth0** (see [AUTH0_SETUP.md](AUTH0_SETUP.md) for detailed instructions):
   - Create an Auth0 application
   - Set callback URL to `http://localhost:3000/callback`
   - Copy your domain, client ID, and client secret

2. **Set environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Auth0 credentials and OpenWeatherMap API key
   ```

3. **Build and start the server**:
   ```bash
   npm run build && node build/http.js
   ```

The server will start on port 3000 with OAuth protection enabled.

### Authentication Flow

1. Visit `http://localhost:3000` to see server status
2. Go to `http://localhost:3000/login` to authenticate with Auth0
3. After successful login, access your profile at `http://localhost:3000/profile`
4. The `/mcp` endpoint is now accessible for authenticated requests

### Testing with MCP Inspector

You can test the authenticated MCP endpoint using the MCP Inspector:

1. **Authenticate first**: Visit `http://localhost:3000/login` in your browser and complete the Auth0 login

2. **Install MCP Inspector**:
   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

3. **Start MCP Inspector**:
   ```bash
   mcp-inspector
   ```

4. **Connect to the authenticated endpoint**:
   - Select "HTTP" as the transport type
   - Enter `http://localhost:3000/mcp` as the URL
   - Click "Connect"

5. You can now test the `get_forecast` and `get_alerts` tools with UK coordinates directly in the inspector interface.

**Note**: The MCP Inspector will use your browser's session cookies for authentication, so make sure you're logged in first.

### Available Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/` | GET | No | Server info and authentication status |
| `/login` | GET | No | Login page or initiate Auth0 login |
| `/callback` | GET | No | Auth0 callback handler |
| `/logout` | GET | No | Logout and redirect to Auth0 logout |
| `/profile` | GET | Yes | User profile information |
| `/mcp` | POST | Yes | MCP protocol endpoint |
| `/health` | GET | No | Health check |

## Docker

The project provides two Docker configurations:

- `Dockerfile.stdio`: For standard MCP server with stdio communication
- `Dockerfile.http`: For HTTP-based MCP server

### Build Docker images

```bash
# Build stdio version
docker build -f Dockerfile.stdio -t mcp-weather:stdio .

# Build HTTP version
docker build -f Dockerfile.http -t mcp-weather:http .
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
