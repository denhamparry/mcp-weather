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
