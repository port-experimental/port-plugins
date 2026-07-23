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
};

function DigitGroup({ value, label }: DigitGroupProps) {
  const padded = String(Math.min(99, Math.max(0, value))).padStart(2, "0");
  const [tens, ones] = padded.split("");

  return (
    <div className="digit-group" aria-label={`${value} ${label}`}>
      <div className="digit-pair">
        <DigitSlot digit={tens} />
        <DigitSlot digit={ones} />
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
