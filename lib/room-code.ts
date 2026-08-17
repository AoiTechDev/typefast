const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export const generateRoomCode = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));

  return Array.from(bytes)
    .map((byte) => ALPHABET[byte % ALPHABET.length])
    .join("");
};

export const normalizeRoomCode = (code: string) => code.trim().toUpperCase();

export const isValidRoomCode = (code: string) =>
  code.length === CODE_LENGTH && [...code].every((char) => ALPHABET.includes(char));
