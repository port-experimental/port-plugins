import type { User } from "../types";

export function isPortAdmin(user: User | undefined): boolean {
  return (
    user?.roles?.some((role) => role.name === "Admin") ?? false
  );
}
