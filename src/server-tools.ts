import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  makeOpenWeatherRequest,
  formatAlert,
  formatForecastItems,
  AlertsResponse,
  ForecastResponse,
} from "./weather-utils.js";

const OPENWEATHER_API_BASE = "https://api.openweathermap.org/data/2.5";

export function createWeatherServer(): McpServer {
  const server = new McpServer({
    name: "weather",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  registerWeatherTools(server);

  return server;
}

export function registerWeatherTools(server: McpServer): void {
  // Register get_alerts tool
  server.tool(
    "get_alerts",
    "Get weather alerts for a UK location",
    {
      latitude: z
        .number()
        .min(-90)
        .max(90)
        .describe("Latitude of the location"),
      longitude: z
        .number()
        .min(-180)
        .max(180)
        .describe("Longitude of the location"),
    },
    async ({ latitude, longitude }) => {
      const alertsUrl = `${OPENWEATHER_API_BASE}/onecall?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&exclude=minutely,hourly,daily,current`;
      const alertsData = await makeOpenWeatherRequest<AlertsResponse>(
        alertsUrl
      );

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

  // Register get_forecast tool
  server.tool(
    "get_forecast",
    "Get weather forecast for a location",
    {
      latitude: z
        .number()
        .min(-90)
        .max(90)
        .describe("Latitude of the location"),
      longitude: z
        .number()
        .min(-180)
        .max(180)
        .describe("Longitude of the location"),
    },
    async ({ latitude, longitude }) => {
      // Get 5-day weather forecast
      const forecastUrl = `${OPENWEATHER_API_BASE}/forecast?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
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
      const formattedForecast = formatForecastItems(forecasts, 8);

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
}
