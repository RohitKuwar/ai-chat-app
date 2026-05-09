import { toolMap } from "./tools.js";

export const executeTool = async (toolCall) => {
  const functionName = toolCall.function.name;

  const args = JSON.parse(toolCall.function.arguments);

  if (!toolMap[functionName]) {
    throw new Error("Invalid tool");
  }

  return await toolMap[functionName](args);
};