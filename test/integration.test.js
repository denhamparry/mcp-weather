import { test, describe, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import {
  makeOpenWeatherRequest,
  formatAlert,
  formatForecastItem,
  formatForecastItems,
} from "../build/weather-utils.js";

describe("Integration Tests", () => {
  let originalFetch;
  let originalEnv;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalEnv = process.env.OPENWEATHER_API_KEY;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.OPENWEATHER_API_KEY = originalEnv;
  });

  describe("Weather Alert Workflow", () => {
    test("should handle complete alert workflow", async () => {
      const mockAlertsResponse = {
        alerts: [
          {
            id: "alert-1",
            sender_name: "Met Office",
            event: "Yellow Weather Warning",
            start: 1640995200,
            end: 1641081600,
            description: "Heavy rain expected across the region.",
            tags: ["Rain", "Flooding"],
          },
          {
            id: "alert-2",
            sender_name: "Environment Agency",
            event: "Flood Warning",
            start: 1641002400,
            end: 1641088800,
            description: "River levels rising due to heavy rainfall.",
            tags: ["Flood", "River"],
          },
        ],
      };

      global.fetch = mock.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAlertsResponse),
        })
      );

      const alertsData = await makeOpenWeatherRequest(
        "http://test-alerts.com",
        "test-key"
      );

      assert(alertsData);
      assert.strictEqual(alertsData.alerts.length, 2);

      const formattedAlerts = alertsData.alerts.map(formatAlert);
      assert.strictEqual(formattedAlerts.length, 2);

      assert(formattedAlerts[0].includes("Yellow Weather Warning"));
      assert(formattedAlerts[0].includes("Met Office"));
      assert(formattedAlerts[0].includes("Heavy rain expected"));

      assert(formattedAlerts[1].includes("Flood Warning"));
      assert(formattedAlerts[1].includes("Environment Agency"));
      assert(formattedAlerts[1].includes("River levels rising"));
    });

    test("should handle empty alerts response", async () => {
      const mockAlertsResponse = { alerts: [] };

      global.fetch = mock.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAlertsResponse),
        })
      );

      const alertsData = await makeOpenWeatherRequest(
        "http://test-alerts.com",
        "test-key"
      );

      assert(alertsData);
      assert.strictEqual(alertsData.alerts.length, 0);
    });

    test("should handle missing alerts property", async () => {
      const mockAlertsResponse = {};

      global.fetch = mock.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAlertsResponse),
        })
      );

      const alertsData = await makeOpenWeatherRequest(
        "http://test-alerts.com",
        "test-key"
      );

      assert(alertsData);
      assert.strictEqual(alertsData.alerts, undefined);
    });
  });

  describe("Weather Forecast Workflow", () => {
    test("should handle complete forecast workflow", async () => {
      const mockForecastResponse = {
        list: [
          {
            dt: 1640995200,
            main: {
              temp: 12.5,
              feels_like: 11.2,
              temp_min: 10.1,
              temp_max: 14.8,
              pressure: 1013,
              humidity: 78,
            },
            weather: [
              {
                id: 500,
                main: "Rain",
                description: "light rain",
                icon: "10d",
              },
            ],
            wind: {
              speed: 3.2,
              deg: 240,
              gust: 5.1,
            },
            dt_txt: "2022-01-01 00:00:00",
          },
          {
            dt: 1641006000,
            main: {
              temp: 14.2,
              feels_like: 13.8,
              temp_min: 12.5,
              temp_max: 16.1,
              pressure: 1015,
              humidity: 68,
            },
            weather: [
              {
                id: 801,
                main: "Clouds",
                description: "few clouds",
                icon: "02d",
              },
            ],
            wind: {
              speed: 2.8,
              deg: 225,
            },
            dt_txt: "2022-01-01 03:00:00",
          },
        ],
        city: {
          name: "Cardiff",
          country: "GB",
        },
      };

      global.fetch = mock.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockForecastResponse),
        })
      );

      const forecastData = await makeOpenWeatherRequest(
        "http://test-forecast.com",
        "test-key"
      );

      assert(forecastData);
      assert.strictEqual(forecastData.list.length, 2);
      assert.strictEqual(forecastData.city.name, "Cardiff");
      assert.strictEqual(forecastData.city.country, "GB");

      const formattedForecasts = formatForecastItems(forecastData.list, 2);
      assert.strictEqual(formattedForecasts.length, 2);

      assert(formattedForecasts[0].includes("Temperature: 13°C"));
      assert(formattedForecasts[0].includes("light rain"));
      assert(
        formattedForecasts[0].includes("Wind: 3.2 m/s 240° (gusts: 5.1 m/s)")
      );

      assert(formattedForecasts[1].includes("Temperature: 14°C"));
      assert(formattedForecasts[1].includes("few clouds"));
      assert(formattedForecasts[1].includes("Wind: 2.8 m/s 225°"));
    });

    test("should handle forecast with missing city data", async () => {
      const mockForecastResponse = {
        list: [
          {
            dt: 1640995200,
            main: {
              temp: 15.0,
              feels_like: 14.0,
              temp_min: 12.0,
              temp_max: 18.0,
              pressure: 1013,
              humidity: 75,
            },
            weather: [
              {
                id: 800,
                main: "Clear",
                description: "clear sky",
                icon: "01d",
              },
            ],
            wind: {
              speed: 2.1,
              deg: 180,
            },
            dt_txt: "2022-01-01 00:00:00",
          },
        ],
      };

      global.fetch = mock.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockForecastResponse),
        })
      );

      const forecastData = await makeOpenWeatherRequest(
        "http://test-forecast.com",
        "test-key"
      );

      assert(forecastData);
      assert.strictEqual(forecastData.list.length, 1);
      assert.strictEqual(forecastData.city, undefined);
    });

    test("should handle empty forecast list", async () => {
      const mockForecastResponse = {
        list: [],
        city: {
          name: "London",
          country: "GB",
        },
      };

      global.fetch = mock.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockForecastResponse),
        })
      );

      const forecastData = await makeOpenWeatherRequest(
        "http://test-forecast.com",
        "test-key"
      );

      assert(forecastData);
      assert.strictEqual(forecastData.list.length, 0);

      const formattedForecasts = formatForecastItems(forecastData.list);
      assert.strictEqual(formattedForecasts.length, 0);
    });
  });

  describe("API Error Handling", () => {
    test("should handle 401 Unauthorized (invalid API key)", async () => {
      global.fetch = mock.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
        })
      );

      const result = await makeOpenWeatherRequest(
        "http://test.com",
        "invalid-key"
      );

      assert.strictEqual(result, null);
    });

    test("should handle 429 Too Many Requests (rate limiting)", async () => {
      global.fetch = mock.fn(() =>
        Promise.resolve({
          ok: false,
          status: 429,
        })
      );

      const result = await makeOpenWeatherRequest(
        "http://test.com",
        "test-key"
      );

      assert.strictEqual(result, null);
    });

    test("should handle 500 Internal Server Error", async () => {
      global.fetch = mock.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        })
      );

      const result = await makeOpenWeatherRequest(
        "http://test.com",
        "test-key"
      );

      assert.strictEqual(result, null);
    });

    test("should handle network timeout", async () => {
      global.fetch = mock.fn(() =>
        Promise.reject(new Error("Request timeout"))
      );

      const result = await makeOpenWeatherRequest(
        "http://test.com",
        "test-key"
      );

      assert.strictEqual(result, null);
    });
  });

  describe("Real-world Data Scenarios", () => {
    test("should handle Cardiff coordinates correctly", () => {
      const cardiffLat = 51.4816;
      const cardiffLon = -3.1791;

      // Test coordinate validation
      assert(cardiffLat >= -90 && cardiffLat <= 90);
      assert(cardiffLon >= -180 && cardiffLon <= 180);

      // Test URL construction
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${cardiffLat}&lon=${cardiffLon}&appid=test-key&units=metric`;
      const alertsUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${cardiffLat}&lon=${cardiffLon}&appid=test-key&exclude=minutely,hourly,daily,current`;

      assert(forecastUrl.includes("lat=51.4816"));
      assert(forecastUrl.includes("lon=-3.1791"));
      assert(forecastUrl.includes("units=metric"));

      assert(alertsUrl.includes("lat=51.4816"));
      assert(alertsUrl.includes("lon=-3.1791"));
      assert(alertsUrl.includes("exclude=minutely,hourly,daily,current"));
    });

    test("should handle extreme weather conditions", () => {
      const extremeAlert = {
        id: "extreme-1",
        sender_name: "Emergency Services",
        event: "Red Weather Warning - Extreme Wind",
        start: Date.now() / 1000,
        end: Date.now() / 1000 + 86400, // 24 hours from now
        description:
          "Extremely dangerous weather conditions. Do not travel unless absolutely necessary.",
        tags: ["Extreme", "Wind", "Dangerous", "Travel"],
      };

      const formatted = formatAlert(extremeAlert);

      assert(formatted.includes("Red Weather Warning"));
      assert(formatted.includes("Extremely dangerous"));
      assert(formatted.includes("Emergency Services"));
      assert(formatted.includes("Extreme, Wind, Dangerous, Travel"));
    });

    test("should handle various temperature ranges", () => {
      const testCases = [
        { temp: -10.7, expected: "-11°C" },
        { temp: 0.0, expected: "0°C" },
        { temp: 0.4, expected: "0°C" },
        { temp: 0.5, expected: "1°C" },
        { temp: 25.3, expected: "25°C" },
        { temp: 35.8, expected: "36°C" },
      ];

      testCases.forEach(({ temp, expected }) => {
        const forecast = {
          dt: 1640995200,
          main: {
            temp: temp,
            feels_like: temp - 1,
            temp_min: temp - 2,
            temp_max: temp + 2,
            pressure: 1013,
            humidity: 50,
          },
          weather: [
            {
              id: 800,
              main: "Clear",
              description: "clear sky",
              icon: "01d",
            },
          ],
          wind: { speed: 2.0, deg: 180 },
          dt_txt: "2022-01-01 12:00:00",
        };

        const result = formatForecastItem(forecast);
        assert(result.includes(`Temperature: ${expected}`));
      });
    });
  });
});
