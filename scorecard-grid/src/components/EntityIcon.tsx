import * as si from "simple-icons";

interface Props {
  portIcon: string | null;
  id?: string | null;
  /** When set, tried first before portIcon and id for the simple-icons lookup. */
  iconValue?: string | null;
  size: number;
  tint?: string;
}

type SimpleIcon = { path: string };

/**
 * Converts an arbitrary name to a simple-icons export key.
 * "Github" → "siGithub", "GithubCopilot" → "siGithubcopilot", "GCP" → "siGcp"
 */
function lookupSimpleIcon(name: string | null | undefined): SimpleIcon | null {
  if (!name) return null;
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const key = `si${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
  return (si as Record<string, SimpleIcon | undefined>)[key] ?? null;
}

export function EntityIcon({ portIcon, id, iconValue, size, tint }: Props) {
  const icon = lookupSimpleIcon(iconValue) ?? lookupSimpleIcon(portIcon);
  const fill = tint ?? "rgba(255,255,255,0.75)";
  const label = (id ?? portIcon ?? "??").slice(0, 2).toUpperCase();

  if (!icon) {
    return (
      <div
        className="entity-icon__initials"
        style={{
          width: size,
          height: size,
          fontSize: Math.round(size * 0.38),
          color: tint ?? "var(--text-faint, #64748B)",
        }}
      >
        {label}
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path d={icon.path} />
    </svg>
  );
}
