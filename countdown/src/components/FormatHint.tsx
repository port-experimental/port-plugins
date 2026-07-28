import { DATE_TIME_EXAMPLES, DATE_TIME_FORMAT_HINT } from "../utils/parseDateTime";

type FormatHintProps = {
  received?: string;
};

export function FormatHint({ received }: FormatHintProps) {
  return (
    <div className="format-hint">
      <p className="format-hint__lead">{DATE_TIME_FORMAT_HINT}</p>
      <ul className="format-hint__list">
        {DATE_TIME_EXAMPLES.map((example) => (
          <li key={example.value}>
            <code>{example.value}</code>
            <span className="format-hint__note">{example.note}</span>
          </li>
        ))}
      </ul>
      {received ? (
        <p className="format-hint__received">
          Received: <code>{received}</code>
        </p>
      ) : null}
    </div>
  );
}
