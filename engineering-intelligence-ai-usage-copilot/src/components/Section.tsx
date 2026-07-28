import type { ReactNode } from "react";

type Props = {
  title: string;
  hint?: string;
  right?: ReactNode;
  children: ReactNode;
};

export function Section({ title, hint, right, children }: Props) {
  return (
    <section className="section">
      <div className="section__header">
        <div className="section__title-group">
          <h3 className="section__title">{title}</h3>
          {hint && <span className="section__hint muted">{hint}</span>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
