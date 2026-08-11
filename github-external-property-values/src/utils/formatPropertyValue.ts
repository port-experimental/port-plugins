export function formatPropertyValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (Array.isArray(value)) return value.map(String).join(", ") || "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
