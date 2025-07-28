import { test, describe, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  formatAlert,
  formatForecastItem,
  formatForecastItems,
  makeOpenWeatherRequest
} from '../build/weather-utils.js';

describe('Weather Utils', () => {
  describe('formatAlert', () => {
    test('should format alert with all fields', () => {
      const alert = {
        id: 'alert-123',
        sender_name: 'National Weather Service',
        event: 'Severe Thunderstorm Warning',
        start: 1640995200, // 2022-01-01 00:00:00 UTC
        end: 1641081600,   // 2022-01-02 00:00:00 UTC
        description: 'Severe thunderstorms expected with heavy rain and strong winds.',
        tags: ['Thunderstorm', 'Heavy Rain', 'Strong Winds']
      };

      const result = formatAlert(alert);
      
      assert(result.includes('Event: Severe Thunderstorm Warning'));
      assert(result.includes('Sender: National Weather Service'));
      assert(result.includes('Description: Severe thunderstorms expected with heavy rain and strong winds.'));
      assert(result.includes('Tags: Thunderstorm, Heavy Rain, Strong Winds'));
      assert(result.includes('---'));
    });

    test('should handle empty tags array', () => {
      const alert = {
        id: 'alert-456',
        sender_name: 'Weather Service',
        event: 'Fog Advisory',
        start: 1640995200,
        end: 1641081600,
        description: 'Dense fog expected.',
        tags: []
      };

      const result = formatAlert(alert);
      
      assert(result.includes('Tags: '));
      assert(result.includes('Event: Fog Advisory'));
    });

    test('should format dates correctly', () => {
      const alert = {
        id: 'alert-789',
        sender_name: 'Test Service',
        event: 'Test Event',
        start: 1640995200, // Known timestamp
        end: 1641081600,
        description: 'Test description',
        tags: ['test']
      };

      const result = formatAlert(alert);
      
      // Check that dates are formatted (exact format may vary by locale)
      assert(result.includes('Start:'));
      assert(result.includes('End:'));
    });
  });

  describe('formatForecastItem', () => {
    test('should format forecast item with all fields', () => {
      const forecast = {
        dt: 1640995200, // 2022-01-01 00:00:00 UTC
        main: {
          temp: 15.5,
          feels_like: 14.2,
          temp_min: 12.0,
          temp_max: 18.0,
          pressure: 1013,
          humidity: 75
        },
        weather: [{
          id: 500,
          main: 'Rain',
          description: 'light rain',
          icon: '10d'
        }],
        wind: {
          speed: 3.5,
          deg: 240,
          gust: 5.2
        },
        dt_txt: '2022-01-01 00:00:00'
      };

      const result = formatForecastItem(forecast);
      
      assert(result.includes('Temperature: 16°C (feels like 14°C)'));
      assert(result.includes('Conditions: light rain'));
      assert(result.includes('Wind: 3.5 m/s 240° (gusts: 5.2 m/s)'));
      assert(result.includes('Humidity: 75%'));
      assert(result.includes('Pressure: 1013 hPa'));
      assert(result.includes('---'));
    });

    test('should handle missing wind gust', () => {
      const forecast = {
        dt: 1640995200,
        main: {
          temp: 20.0,
          feels_like: 19.5,
          temp_min: 18.0,
          temp_max: 22.0,
          pressure: 1015,
          humidity: 60
        },
        weather: [{
          id: 800,
          main: 'Clear',
          description: 'clear sky',
          icon: '01d'
        }],
        wind: {
          speed: 2.1,
          deg: 180
        },
        dt_txt: '2022-01-01 12:00:00'
      };

      const result = formatForecastItem(forecast);
      
      assert(result.includes('Wind: 2.1 m/s 180°'));
      assert(!result.includes('gusts'));
    });

    test('should handle missing wind direction', () => {
      const forecast = {
        dt: 1640995200,
        main: {
          temp: 10.0,
          feels_like: 8.5,
          temp_min: 8.0,
          temp_max: 12.0,
          pressure: 1020,
          humidity: 80
        },
        weather: [{
          id: 801,
          main: 'Clouds',
          description: 'few clouds',
          icon: '02d'
        }],
        wind: {
          speed: 1.5
        },
        dt_txt: '2022-01-01 06:00:00'
      };

      const result = formatForecastItem(forecast);
      
      assert(result.includes('Wind: 1.5 m/s'));
      // Check that wind direction degree is not included (but temperature degrees are still there)
      const windLine = result.split('\n').find(line => line.includes('Wind:'));
      assert(!windLine.includes('°'));
    });

    test('should handle missing weather description', () => {
      const forecast = {
        dt: 1640995200,
        main: {
          temp: 5.0,
          feels_like: 3.0,
          temp_min: 2.0,
          temp_max: 8.0,
          pressure: 1025,
          humidity: 85
        },
        weather: [],
        wind: {
          speed: 0.5,
          deg: 90
        },
        dt_txt: '2022-01-01 18:00:00'
      };

      const result = formatForecastItem(forecast);
      
      assert(result.includes('Conditions: Unknown'));
    });

    test('should round temperatures correctly', () => {
      const forecast = {
        dt: 1640995200,
        main: {
          temp: 15.7,
          feels_like: 14.3,
          temp_min: 12.0,
          temp_max: 18.0,
          pressure: 1013,
          humidity: 75
        },
        weather: [{
          id: 500,
          main: 'Rain',
          description: 'light rain',
          icon: '10d'
        }],
        wind: {
          speed: 3.5,
          deg: 240
        },
        dt_txt: '2022-01-01 00:00:00'
      };

      const result = formatForecastItem(forecast);
      
      assert(result.includes('Temperature: 16°C (feels like 14°C)'));
    });
  });

  describe('formatForecastItems', () => {
    const mockForecasts = [
      {
        dt: 1640995200,
        main: { temp: 15.0, feels_like: 14.0, temp_min: 12.0, temp_max: 18.0, pressure: 1013, humidity: 75 },
        weather: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
        wind: { speed: 3.5, deg: 240 },
        dt_txt: '2022-01-01 00:00:00'
      },
      {
        dt: 1641006000,
        main: { temp: 16.0, feels_like: 15.0, temp_min: 13.0, temp_max: 19.0, pressure: 1014, humidity: 70 },
        weather: [{ id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }],
        wind: { speed: 2.8, deg: 220 },
        dt_txt: '2022-01-01 03:00:00'
      },
      {
        dt: 1641016800,
        main: { temp: 17.0, feels_like: 16.0, temp_min: 14.0, temp_max: 20.0, pressure: 1015, humidity: 65 },
        weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
        wind: { speed: 2.1, deg: 200 },
        dt_txt: '2022-01-01 06:00:00'
      }
    ];

    test('should format multiple forecast items with default count', () => {
      const result = formatForecastItems(mockForecasts);
      
      assert.strictEqual(result.length, 3);
      assert(result[0].includes('Temperature: 15°C'));
      assert(result[1].includes('Temperature: 16°C'));
      assert(result[2].includes('Temperature: 17°C'));
    });

    test('should limit forecast items to specified count', () => {
      const result = formatForecastItems(mockForecasts, 2);
      
      assert.strictEqual(result.length, 2);
      assert(result[0].includes('Temperature: 15°C'));
      assert(result[1].includes('Temperature: 16°C'));
    });

    test('should handle empty forecast array', () => {
      const result = formatForecastItems([]);
      
      assert.strictEqual(result.length, 0);
    });

    test('should handle count larger than array length', () => {
      const result = formatForecastItems(mockForecasts, 10);
      
      assert.strictEqual(result.length, 3);
    });
  });

  describe('makeOpenWeatherRequest', () => {
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

    test('should make successful API request', async () => {
      const mockResponse = { weather: 'sunny' };
      global.fetch = mock.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await makeOpenWeatherRequest('http://test.com', 'test-api-key');
      
      assert.deepStrictEqual(result, mockResponse);
      assert.strictEqual(global.fetch.mock.calls.length, 1);
      assert.strictEqual(global.fetch.mock.calls[0].arguments[0], 'http://test.com');
      assert.deepStrictEqual(global.fetch.mock.calls[0].arguments[1].headers, {
        'User-Agent': 'weather-app/1.0'
      });
    });

    test('should use environment variable when no API key provided', async () => {
      process.env.OPENWEATHER_API_KEY = 'env-api-key';
      const mockResponse = { weather: 'cloudy' };
      global.fetch = mock.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await makeOpenWeatherRequest('http://test.com');
      
      assert.deepStrictEqual(result, mockResponse);
    });

    test('should return null when no API key available', async () => {
      delete process.env.OPENWEATHER_API_KEY;
      
      const result = await makeOpenWeatherRequest('http://test.com');
      
      assert.strictEqual(result, null);
    });

    test('should handle HTTP error responses', async () => {
      global.fetch = mock.fn(() => Promise.resolve({
        ok: false,
        status: 404
      }));

      const result = await makeOpenWeatherRequest('http://test.com', 'test-api-key');
      
      assert.strictEqual(result, null);
    });

    test('should handle network errors', async () => {
      global.fetch = mock.fn(() => Promise.reject(new Error('Network error')));

      const result = await makeOpenWeatherRequest('http://test.com', 'test-api-key');
      
      assert.strictEqual(result, null);
    });

    test('should handle JSON parsing errors', async () => {
      global.fetch = mock.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      }));

      const result = await makeOpenWeatherRequest('http://test.com', 'test-api-key');
      
      assert.strictEqual(result, null);
    });
  });
});