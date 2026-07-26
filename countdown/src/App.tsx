import { useMemo } from "react";
import "./App.css";
import { CountdownDisplay } from "./components/CountdownDisplay";
import { FormatHint } from "./components/FormatHint";
import { useCountdown } from "./hooks/useCountdown";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { configFromParams } from "./utils/config";
import {
  DATE_TIME_PARAM_EXAMPLE,
  DATE_TIME_PARAM_LABEL,
  formatTargetShort,
  parseTargetDateTime,
} from "./utils/parseDateTime";

export function App() {
  const { params, portToken, portApiBaseUrl } = usePostMessageData();
  const config = configFromParams(params);

  const targetDate = useMemo(
    () => (config ? parseTargetDateTime(config.targetDateTime) : null),
    [config]
  );

  const countdown = useCountdown(targetDate);

  if (!portApiBaseUrl || !portToken) {
    return (
      <div className="shell shell--message">
        <p className="muted">
          Waiting for Port context… If this stays blank, check the browser console
          for errors.
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="shell shell--message">
        <div className="setup-panel">
          <p className="setup-panel__title">Configure target datetime</p>
          <p className="setup-panel__text">
            Set the <strong>{DATE_TIME_PARAM_LABEL}</strong> parameter when
            adding this widget in Port.
          </p>
          <FormatHint />
        </div>
      </div>
    );
  }

  if (!targetDate) {
    return (
      <div className="shell shell--message">
        <div className="setup-panel">
          <p className="setup-panel__title">Invalid datetime</p>
          <p className="setup-panel__text">
            <strong>{DATE_TIME_PARAM_LABEL}</strong> could not be parsed. Use a
            value like <code>{DATE_TIME_PARAM_EXAMPLE}</code>.
          </p>
          <FormatHint received={config.targetDateTime} />
        </div>
      </div>
    );
  }

  const targetLabel = formatTargetShort(targetDate);
  const isExpired = countdown?.isExpired ?? false;

  return (
    <div className="shell">
      <main className="main">
        <section className="countdown-card" aria-labelledby="countdown-heading">
          <header className="countdown-header">
            {config.title ? (
              <h2 id="countdown-heading" className="countdown-title">
                {config.title}
              </h2>
            ) : (
              <h2 id="countdown-heading" className="visually-hidden">
                Countdown
              </h2>
            )}
            <p className="countdown-target">
              <time dateTime={targetDate.toISOString()}>{targetLabel}</time>
            </p>
          </header>

          {isExpired ? (
            <div className="countdown-expired" role="status">
              <CountdownDisplay
                parts={{
                  days: 0,
                  hours: 0,
                  minutes: 0,
                  seconds: 0,
                  isExpired: true,
                  totalMs: 0,
                }}
              />
              <p className="countdown-expired__label">Time&apos;s up</p>
            </div>
          ) : countdown ? (
            <CountdownDisplay parts={countdown} />
          ) : (
            <p className="muted" role="status">
              Loading…
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
