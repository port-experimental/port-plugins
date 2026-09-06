import { formatPropertyValue } from "../utils/formatPropertyValue";

const ENUM_COLOR_CLASS: Record<string, string> = {
  blue: "pill--blue",
  bronze: "pill--bronze",
  gold: "pill--gold",
  gray: "pill--gray",
  green: "pill--green",
  lime: "pill--lime",
  orange: "pill--orange",
  pink: "pill--pink",
  purple: "pill--purple",
  red: "pill--red",
  silver: "pill--silver",
  turquoise: "pill--turquoise",
  yellow: "pill--gold",
};

export function PropertyValuePill({
  value,
  enumColors,
}: {
  value: unknown;
  enumColors?: Record<string, string>;
}) {
  const display = formatPropertyValue(value);
  const colorKey = typeof value === "string" ? enumColors?.[value] : undefined;
  const colorClass = colorKey ? ENUM_COLOR_CLASS[colorKey] : undefined;

  if (!colorClass) {
    return <span>{display}</span>;
  }
  return <span className={`pill ${colorClass}`}>{display}</span>;
}
