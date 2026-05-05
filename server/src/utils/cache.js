const embeddingCache = new Map();

export const getCachedEmbedding = async (query, createEmbedding) => {
  if (embeddingCache.has(query)) {
    return embeddingCache.get(query);
  }

  const embedding = await createEmbedding(query);
  embeddingCache.set(query, embedding);

  return embedding;
};