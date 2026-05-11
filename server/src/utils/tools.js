import axios from "axios";
import { retry } from "./retry.js";

export const calculator = ({ a, b, operation }) => {
  switch (operation) {
    case "add":
      return a + b;

    case "subtract":
      return a - b;

    case "multiply":
      return a * b;

    case "divide":
      return b !== 0 ? a / b : "Cannot divide by zero";

    default:
      return "Invalid operation";
  }
};

export const getWeather = async ({ city }) => {
  if (!city) {
    return "City name is required.";
  }

  try {
    const response = await retry(() =>
      axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            q: city,
            appid: process.env.WEATHER_API_KEY,
            units: "metric",
          },
          timeout: 5000,
        }
      )
    );

    const data = response.data;

    console.log("WEATHER RESPONSE:", data);

    return `
      City: ${data.name}
      Temperature: ${data.main.temp}°C
      Condition: ${data.weather[0].description}
      Humidity: ${data.main.humidity}%
      `;
    } catch (error) {
      console.error("WEATHER API ERROR:", error);

      return "Unable to fetch weather data right now.";
    }
  };

export const searchWeb = ({ query }) => {
  return `Top search result for "${query}"`;
};

export const toolMap = {
  calculator,
  getWeather,
  searchWeb,
};