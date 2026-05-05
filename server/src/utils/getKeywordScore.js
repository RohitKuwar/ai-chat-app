export const getKeywordScore = (text, keywords) => {
  let score = 0;

  for (const word of keywords) {
    if (text.toLowerCase().includes(word)) {
      score += 0.1;
    }
  }

  return score;
};