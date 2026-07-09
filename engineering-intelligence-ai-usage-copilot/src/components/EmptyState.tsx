type Props = { title: string; hint?: string };

export function EmptyState({ title, hint }: Props) {
  return (
    <div className="state state--empty">
      <div className="state__title">{title}</div>
      {hint && <div className="muted">{hint}</div>}
    </div>
  );
}
