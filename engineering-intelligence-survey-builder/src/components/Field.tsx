import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  inline?: boolean;
  /** Show a red required marker next to the label. */
  required?: boolean;
};

export function Field({ label, hint, htmlFor, children, inline, required }: FieldProps) {
  return (
    <label className={`fld${inline ? " fld--inline" : ""}`} htmlFor={htmlFor}>
      <span className="fld__label">
        {label}
        {required && <span className="fld__required" aria-hidden="true"> *</span>}
      </span>
      {children}
      {hint && <span className="fld__hint">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="textarea" {...props} />;
}

export function Select({
  value,
  onChange,
  options,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange">) {
  return (
    <select
      className="select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`toggle${checked ? " toggle--on" : ""}`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
      <span className="toggle__label">{label}</span>
    </button>
  );
}
