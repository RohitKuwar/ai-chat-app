export const formatMessagesForOpenAI = (messages) => {
  return messages.map((msg) => {
    if (msg.role === "user" && msg.imageUrl) {
      return {
        role: "user",
        content: [
          {
            type: "text",
            text: msg.content,
          },
          {
            type: "image_url",

            image_url: {
              url: msg.imageUrl,
            },
          },
        ],
      };
    }

    return {
      role: msg.role,
      content: msg.content,
    };
  });
};
