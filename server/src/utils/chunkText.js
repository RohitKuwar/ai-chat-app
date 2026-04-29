export const chunkText = (text, chunkSize = 400, overlap = 150) => {
  const chunks = [];

  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;

    const chunk = text.slice(start, end);
    chunks.push(chunk);

    start += chunkSize - overlap;
  }

  return chunks;
};