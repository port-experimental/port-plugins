import type { CountdownParts } from "../types";

function DigitSlot({ digit }: { digit: string }) {
  return (
    <div className="digit-slot" aria-hidden>
      <span className="digit-slot__value">{digit}</span>
    </div>
  );
}

function Colon() {
  return (
    <div className="countdown-colon" aria-hidden>
      <span />
      <span />
    </div>
  );
}

type DigitGroupProps = {
  value: number;
  label: string;
  /** Minimum digit slots (default 2). Days may grow beyond this. */
  minDigits?: number;
};

function DigitGroup({ value, label, minDigits = 2 }: DigitGroupProps) {
  const safe = Math.max(0, Math.floor(value));
  const digits = String(safe).padStart(minDigits, "0").split("");

  return (
    <div className="digit-group" aria-label={`${safe} ${label}`}>
      <div className="digit-pair">
        {digits.map((digit, index) => (
          <DigitSlot key={`${index}-${digit}`} digit={digit} />
        ))}
      </div>
      <span className="digit-group__label">{label}</span>
    </div>
  );
}

type CountdownDisplayProps = {
  parts: CountdownParts;
};

export function CountdownDisplay({ parts }: CountdownDisplayProps) {
  return (
    <div className="countdown-display" role="timer" aria-live="polite">
      <div className="countdown-display__row">
        <DigitGroup value={parts.days} label="Days" />
        <Colon />
        <DigitGroup value={parts.hours} label="Hours" />
        <Colon />
        <DigitGroup value={parts.minutes} label="Minutes" />
        <Colon />
        <DigitGroup value={parts.seconds} label="Seconds" />
      </div>
    </div>
  );
}
