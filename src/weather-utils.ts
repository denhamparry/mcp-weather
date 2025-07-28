export interface WeatherAlert {
  id: string;
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

export interface WeatherMain {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
}

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface Wind {
  speed: number;
  deg: number;
  gust?: number;
}

export interface ForecastItem {
  dt: number;
  main: WeatherMain;
  weather: WeatherCondition[];
  wind: Wind;
  dt_txt: string;
}

export interface AlertsResponse {
  alerts?: WeatherAlert[];
}

export interface ForecastResponse {
  list: ForecastItem[];
  city: {
    name: string;
    country: string;
  };
}

const USER_AGENT = "weather-app/1.0";

// Helper function for making OpenWeatherMap API requests
export async function makeOpenWeatherRequest<T>(url: string, apiKey?: string): Promise<T | null> {
  const API_KEY = apiKey || process.env.OPENWEATHER_API_KEY;
  
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

// Format alert data
export function formatAlert(alert: WeatherAlert): string {
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

// Format forecast item
export function formatForecastItem(forecast: ForecastItem): string {
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
}

// Format multiple forecast items
export function formatForecastItems(forecasts: ForecastItem[], count: number = 8): string[] {
  return forecasts
    .slice(0, count)
    .map(formatForecastItem);
}