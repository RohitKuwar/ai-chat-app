export const logEvent = ({
  type,
  message,
  data = null,
}) => {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
    })
  );
};

export const formatDuration = (ms) => {

  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }

  return `${ms.toFixed(2)}ms`;
};