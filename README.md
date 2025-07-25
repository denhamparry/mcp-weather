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

## Docker

### Build the Docker image

```bash
docker build -t mcp-weather .
```

### Run with Docker Compose (recommended)

```bash
# Set your API key and run
OPENWEATHER_API_KEY="your_api_key_here" docker-compose run --rm mcp-weather
```

### Run with Docker directly

```bash
docker run -it --rm -e OPENWEATHER_API_KEY="your_api_key_here" mcp-weather
```

The container runs the MCP server which communicates via stdio. Make sure to run
it in interactive mode (`-it`) to enable proper communication.

### Using Task (task runner)

If you have [Task](https://taskfile.dev/) installed, you can use these commands:

```bash
# Build the Docker image
task build

# Push to Docker registry (requires REGISTRY_USER env var)
REGISTRY_USER=your-dockerhub-username task push

# Run the container (requires OPENWEATHER_API_KEY env var)
OPENWEATHER_API_KEY="your_api_key_here" task run

# Run with docker-compose
OPENWEATHER_API_KEY="your_api_key_here" task run-compose

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
