export const getInitials = (name = "") => {
  const words = name.trim().split(" ").filter(Boolean);

  if (words.length === 0) return "U";

  if (words.length === 1) {
    return words[0][0].toUpperCase();
  }

  return (
    words[0][0].toUpperCase() +
    words[words.length - 1][0].toUpperCase()
  );
};