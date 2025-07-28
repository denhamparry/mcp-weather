import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { makeOpenWeatherRequest, formatAlert, formatForecastItems, } from "./weather-utils.js";
const OPENWEATHER_API_BASE = "https://api.openweathermap.org/data/2.5";
const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";
// Create server instance
const server = new McpServer({
    name: "weather",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Register weather tools
server.tool("get_alerts", "Get weather alerts for a UK location", {
    latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
    longitude: z
        .number()
        .min(-180)
        .max(180)
        .describe("Longitude of the location"),
}, async ({ latitude, longitude }) => {
    const alertsUrl = `${OPENWEATHER_API_BASE}/onecall?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&exclude=minutely,hourly,daily,current`;
    const alertsData = await makeOpenWeatherRequest(alertsUrl);
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
    const alertsText = `Active alerts for ${latitude}, ${longitude}:\n\n${formattedAlerts.join("\n")}`;
    return {
        content: [
            {
                type: "text",
                text: alertsText,
            },
        ],
    };
});
server.tool("get_forecast", "Get weather forecast for a location", {
    latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
    longitude: z
        .number()
        .min(-180)
        .max(180)
        .describe("Longitude of the location"),
}, async ({ latitude, longitude }) => {
    // Get 5-day weather forecast
    const forecastUrl = `${OPENWEATHER_API_BASE}/forecast?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
    const forecastData = await makeOpenWeatherRequest(forecastUrl);
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
    const forecastText = `5-day forecast for ${locationName}:\n\n${formattedForecast.join("\n")}`;
    return {
        content: [
            {
                type: "text",
                text: forecastText,
            },
        ],
    };
});
// Parse JSON body helper
function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : undefined);
            }
            catch (error) {
                reject(error);
            }
        });
        req.on("error", reject);
    });
}
// Create HTTP server
const httpServer = createServer(async (req, res) => {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-Id");
    res.setHeader("Access-Control-Expose-Headers", "X-Session-Id");
    // Handle preflight requests
    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }
    // Health check endpoint for Kubernetes probes
    if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }));
        return;
    }
    try {
        // Create a new transport for each request
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            enableJsonResponse: true, // Enable JSON responses for better compatibility
        });
        // Parse request body for POST requests
        let parsedBody;
        if (req.method === "POST") {
            try {
                parsedBody = await parseJsonBody(req);
            }
            catch (error) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid JSON body" }));
                return;
            }
        }
        // Connect the server to the transport
        await server.connect(transport);
        // Handle the request
        await transport.handleRequest(req, res, parsedBody);
    }
    catch (error) {
        console.error("Error handling request:", error);
        if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error" }));
        }
    }
});
// Start the server
httpServer.listen(PORT, HOST, () => {
    console.log(`MCP Weather HTTP Server listening on ${HOST}:${PORT}`);
    console.log("Ready to accept HTTP MCP connections");
});
// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    httpServer.close(() => {
        process.exit(0);
    });
});
process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully");
    httpServer.close(() => {
        process.exit(0);
    });
});
