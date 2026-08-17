import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const db = drizzle(process.env.DATABASE_URL, { schema });

const UNIQUE_VIOLATION = "23505";

export const isUniqueViolation = (error: unknown) => {
  let current = error;

  while (current instanceof Error) {
    if ((current as { code?: string }).code === UNIQUE_VIOLATION) {
      return true;
    }

    current = current.cause;
  }

  return false;
};
