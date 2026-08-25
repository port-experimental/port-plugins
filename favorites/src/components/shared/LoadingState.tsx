type Props = {
  message?: string;
};

const CENTER = 25;
const RADIUS = 20;
const STROKE = 3;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_LENGTH = CIRCUMFERENCE * 0.75;
const GAP_LENGTH = CIRCUMFERENCE - ARC_LENGTH;
const DOT_LENGTH = 2.6;
const DOT_GAP = (GAP_LENGTH - DOT_LENGTH * 5) / 5;
const DOT_DASHARRAY = [
  DOT_LENGTH,
  DOT_GAP,
  DOT_LENGTH,
  DOT_GAP,
  DOT_LENGTH,
  DOT_GAP,
  DOT_LENGTH,
  DOT_GAP,
  DOT_LENGTH,
  ARC_LENGTH,
].join(" ");

export function PortSpinner({ size = 40 }: { size?: number }) {
  return (
    <svg
      className="port-loader"
      viewBox="0 0 50 50"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
        <circle
          className="port-loader__arc"
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${ARC_LENGTH} ${GAP_LENGTH}`}
        />
        <circle
          className="port-loader__dots"
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="butt"
          strokeDasharray={DOT_DASHARRAY}
        />
      </g>
    </svg>
  );
}

export function LoadingState({ message = "Loading your favorites…" }: Props) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <PortSpinner />
      <p className="loading-state__message">{message}</p>
    </div>
  );
}

export function LoadingDots() {
  return (
    <span className="loading-dots" aria-label="Loading">
      <span />
      <span />
      <span />
    </span>
  );
}
