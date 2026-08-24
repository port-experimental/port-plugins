type Props = {
  title?: string;
  identifier: string;
  className?: string;
};

export function BlueprintLabel({ title, identifier, className }: Props) {
  return (
    <span
      className={["blueprint-label", className].filter(Boolean).join(" ")}
    >
      {title ?? identifier}
    </span>
  );
}
