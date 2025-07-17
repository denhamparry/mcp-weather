#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const OPENWEATHER_API_BASE = "https://api.openweathermap.org/data/2.5";
const USER_AGENT = "weather-app/1.0";
const API_KEY = process.env.OPENWEATHER_API_KEY;

// Cardiff coordinates
const CARDIFF_LAT = 51.4816;
const CARDIFF_LON = -3.1791;

// Helper function for making OpenWeatherMap API requests
async function makeOpenWeatherRequest(url) {
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
    return await response.json();
  } catch (error) {
    console.error("Error making OpenWeatherMap request:", error);
    return null;
  }
}

async function testCardiffWeather() {
  console.log("Testing Cardiff weather forecast...");
  console.log(`Coordinates: ${CARDIFF_LAT}, ${CARDIFF_LON}`);
  console.log("=".repeat(50));

  // Test forecast
  const forecastUrl = `${OPENWEATHER_API_BASE}/forecast?lat=${CARDIFF_LAT}&lon=${CARDIFF_LON}&appid=${API_KEY}&units=metric`;
  const forecastData = await makeOpenWeatherRequest(forecastUrl);

  if (!forecastData) {
    console.error("❌ Failed to retrieve forecast data for Cardiff");
    return;
  }

  const forecasts = forecastData.list || [];
  if (forecasts.length === 0) {
    console.error("❌ No forecast data available for Cardiff");
    return;
  }

  console.log("✅ Successfully retrieved forecast data for Cardiff");
  console.log(
    `📍 Location: ${forecastData.city?.name}, ${forecastData.city?.country}`
  );
  console.log(`📊 Number of forecast periods: ${forecasts.length}`);
  console.log("");

  // Show first 3 forecast periods
  const formattedForecast = forecasts.slice(0, 3).map((forecast) => {
    const date = new Date(forecast.dt * 1000);
    const windDirection = forecast.wind.deg ? `${forecast.wind.deg}°` : "";
    const windSpeed = forecast.wind.speed
      ? `${forecast.wind.speed} m/s`
      : "Unknown";
    const gustInfo = forecast.wind.gust
      ? ` (gusts: ${forecast.wind.gust} m/s)`
      : "";

    return [
      `🕐 ${date.toLocaleString()}:`,
      `🌡️  Temperature: ${Math.round(
        forecast.main.temp
      )}°C (feels like ${Math.round(forecast.main.feels_like)}°C)`,
      `🌤️  Conditions: ${forecast.weather[0]?.description || "Unknown"}`,
      `💨 Wind: ${windSpeed} ${windDirection}${gustInfo}`,
      `💧 Humidity: ${forecast.main.humidity}%`,
      `🔽 Pressure: ${forecast.main.pressure} hPa`,
      "─".repeat(40),
    ].join("\n");
  });

  console.log("📋 First 3 forecast periods:");
  console.log(formattedForecast.join("\n"));

  // Test alerts
  console.log("\n🚨 Testing weather alerts for Cardiff...");
  const alertsUrl = `${OPENWEATHER_API_BASE}/onecall?lat=${CARDIFF_LAT}&lon=${CARDIFF_LON}&appid=${API_KEY}&exclude=minutely,hourly,daily,current`;
  const alertsData = await makeOpenWeatherRequest(alertsUrl);

  if (!alertsData) {
    console.error("❌ Failed to retrieve alerts data for Cardiff");
    return;
  }

  const alerts = alertsData.alerts || [];
  if (alerts.length === 0) {
    console.log("✅ No active alerts for Cardiff (this is good!)");
  } else {
    console.log(`⚠️  Found ${alerts.length} active alert(s) for Cardiff`);
    alerts.forEach((alert, index) => {
      console.log(`Alert ${index + 1}: ${alert.event} - ${alert.description}`);
    });
  }

  console.log("\n🎉 Cardiff weather test completed successfully!");
}

// Run the test
testCardiffWeather().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
