import type { ReactNode } from "react";

export function EmptyState({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="state state--empty">
      <p className="state__title">{title}</p>
      {hint && <p className="muted">{hint}</p>}
      {children}
    </div>
  );
}
