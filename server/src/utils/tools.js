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

export const getWeather = ({ city }) => {
  return `The weather in ${city} is 32°C with clear sky`;
};

export const searchWeb = ({ query }) => {
  return `Top search result for "${query}"`;
};