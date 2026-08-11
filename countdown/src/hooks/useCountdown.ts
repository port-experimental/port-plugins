import { useEffect, useState } from "react";
import type { CountdownParts } from "../types";

function computeParts(target: Date, now: Date): CountdownParts {
  const totalMs = target.getTime() - now.getTime();

  if (totalMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      totalMs: 0,
    };
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    totalMs,
  };
}

export function useCountdown(target: Date | null): CountdownParts | null {
  const [parts, setParts] = useState<CountdownParts | null>(() =>
    target ? computeParts(target, new Date()) : null
  );

  useEffect(() => {
    if (!target) {
      setParts(null);
      return;
    }

    const tick = () => {
      setParts(computeParts(target, new Date()));
    };

    tick();
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, [target?.getTime()]);

  return parts;
}
