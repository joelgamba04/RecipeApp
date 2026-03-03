// src/db/bootstrap.ts
import { initDb } from "./db";

let bootPromise: Promise<void> | null = null;

export function bootstrapDb() {
  if (!bootPromise) bootPromise = initDb();
  return bootPromise;
}
