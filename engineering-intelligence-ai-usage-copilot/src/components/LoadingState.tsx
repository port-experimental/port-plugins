type Props = { label?: string };

export function LoadingState({ label = "Loading…" }: Props) {
  return (
    <div className="state">
      <div className="spinner" />
      <span className="muted">{label}</span>
    </div>
  );
}
