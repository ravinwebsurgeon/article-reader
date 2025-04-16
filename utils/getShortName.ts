export const getShortenedName = (name, wordLimit = 2) => {
  if (!name) return ""; // Handle undefined or empty names
  const words = name.split(" ");
  return words.length > wordLimit ? words.slice(0, wordLimit).join(" ") : name;
};

export const getShortenedNameWithEclipse = (name, wordLimit = 2) => {
  if (!name) return ""; // Handle undefined or empty names
  const words = name.split(" ");
  return words.length > wordLimit ? words.slice(0, wordLimit).join(" ") + "..." : name;
};

export const getShortenedFilename = (filename, maxLength = 15) => {
  if (!filename) return "";
  
  const extIndex = filename.lastIndexOf(".");
  const namePart = extIndex !== -1 ? filename.slice(0, extIndex) : filename;
  const extension = extIndex !== -1 ? filename.slice(extIndex) : "";

  return namePart.length > maxLength
    ? namePart.slice(0, maxLength) + "..." + extension
    : filename;
};
