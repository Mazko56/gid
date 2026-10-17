import { randomUUID } from "node:crypto";

export function makeId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}
