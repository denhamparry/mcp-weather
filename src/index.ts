import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const OPENWEATHER_API_BASE = "https://api.openweathermap.org/data/2.5";
const USER_AGENT = "weather-app/1.0";
const API_KEY = process.env.OPENWEATHER_API_KEY;

// Create server instance
const server = new McpServer({
  name: "weather",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Helper function for making OpenWeatherMap API requests
async function makeOpenWeatherRequest<T>(url: string): Promise<T | null> {
  if (!API_KEY) {
    console.error(
      "OpenWeatherMap API key not found. Please set OPENWEATHER_API_KEY environment variable."
    );
    return null;
  }

  const headers = {
    "User-Agent": USER_AGENT,
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making OpenWeatherMap request:", error);
    return null;
  }
}

interface WeatherAlert {
  id: string;
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

// Format alert data
function formatAlert(alert: WeatherAlert): string {
  const startDate = new Date(alert.start * 1000).toLocaleString();
  const endDate = new Date(alert.end * 1000).toLocaleString();
  return [
    `Event: ${alert.event}`,
    `Sender: ${alert.sender_name}`,
    `Start: ${startDate}`,
    `End: ${endDate}`,
    `Description: ${alert.description}`,
    `Tags: ${alert.tags.join(", ")}`,
    "---",
  ].join("\n");
}

interface WeatherMain {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
}

interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

interface Wind {
  speed: number;
  deg: number;
  gust?: number;
}

interface ForecastItem {
  dt: number;
  main: WeatherMain;
  weather: WeatherCondition[];
  wind: Wind;
  dt_txt: string;
}

interface AlertsResponse {
  alerts?: WeatherAlert[];
}

interface ForecastResponse {
  list: ForecastItem[];
  city: {
    name: string;
    country: string;
  };
}

// Register weather tools
server.tool(
  "get_alerts",
  "Get weather alerts for a UK location",
  {
    latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
    longitude: z
      .number()
      .min(-180)
      .max(180)
      .describe("Longitude of the location"),
  },
  async ({ latitude, longitude }) => {
    const alertsUrl = `${OPENWEATHER_API_BASE}/onecall?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&exclude=minutely,hourly,daily,current`;
    const alertsData = await makeOpenWeatherRequest<AlertsResponse>(alertsUrl);

    if (!alertsData) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve alerts data",
          },
        ],
      };
    }

    const alerts = alertsData.alerts || [];
    if (alerts.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No active alerts for location ${latitude}, ${longitude}`,
          },
        ],
      };
    }

    const formattedAlerts = alerts.map(formatAlert);
    const alertsText = `Active alerts for ${latitude}, ${longitude}:\n\n${formattedAlerts.join(
      "\n"
    )}`;

    return {
      content: [
        {
          type: "text",
          text: alertsText,
        },
      ],
    };
  }
);

server.tool(
  "get_forecast",
  "Get weather forecast for a location",
  {
    latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
    longitude: z
      .number()
      .min(-180)
      .max(180)
      .describe("Longitude of the location"),
  },
  async ({ latitude, longitude }) => {
    // Get 5-day weather forecast
    const forecastUrl = `${OPENWEATHER_API_BASE}/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;
    const forecastData = await makeOpenWeatherRequest<ForecastResponse>(
      forecastUrl
    );

    if (!forecastData) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve forecast data for coordinates: ${latitude}, ${longitude}`,
          },
        ],
      };
    }

    const forecasts = forecastData.list || [];
    if (forecasts.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No forecast data available",
          },
        ],
      };
    }

    // Format forecast periods (show next 8 periods to cover about 24 hours)
    const formattedForecast = forecasts
      .slice(0, 8)
      .map((forecast: ForecastItem) => {
        const date = new Date(forecast.dt * 1000);
        const windDirection = forecast.wind.deg ? `${forecast.wind.deg}°` : "";
        const windSpeed = forecast.wind.speed
          ? `${forecast.wind.speed} m/s`
          : "Unknown";
        const gustInfo = forecast.wind.gust
          ? ` (gusts: ${forecast.wind.gust} m/s)`
          : "";

        return [
          `${date.toLocaleString()}:`,
          `Temperature: ${Math.round(
            forecast.main.temp
          )}°C (feels like ${Math.round(forecast.main.feels_like)}°C)`,
          `Conditions: ${forecast.weather[0]?.description || "Unknown"}`,
          `Wind: ${windSpeed} ${windDirection}${gustInfo}`,
          `Humidity: ${forecast.main.humidity}%`,
          `Pressure: ${forecast.main.pressure} hPa`,
          "---",
        ].join("\n");
      });

    const locationName = forecastData.city
      ? `${forecastData.city.name}, ${forecastData.city.country}`
      : `${latitude}, ${longitude}`;
    const forecastText = `5-day forecast for ${locationName}:\n\n${formattedForecast.join(
      "\n"
    )}`;

    return {
      content: [
        {
          type: "text",
          text: forecastText,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
