import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

type TruncatedTextProps = {
  text: string;
  /** Tooltip content; defaults to `text`. */
  tooltip?: string;
  className?: string;
};

function measureTruncation(el: HTMLElement): boolean {
  return el.scrollWidth > el.clientWidth + 1;
}

export function TruncatedText({
  text,
  tooltip,
  className = "",
}: TruncatedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tipStyle, setTipStyle] = useState<CSSProperties>({});

  const tipText = tooltip ?? text;

  const updateTruncation = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setIsTruncated(measureTruncation(el));
  }, []);

  useLayoutEffect(() => {
    updateTruncation();
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(updateTruncation);
    observer.observe(el);
    const parent = el.parentElement;
    if (parent) observer.observe(parent);

    return () => observer.disconnect();
  }, [text, updateTruncation]);

  const positionTooltip = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const maxWidth = Math.min(320, window.innerWidth - 16);
    const left = Math.max(
      8,
      Math.min(rect.left, window.innerWidth - maxWidth - 8)
    );
    const aboveTop = rect.top - 8;
    const placeBelow = aboveTop < 48;

    setTipStyle({
      position: "fixed",
      left,
      top: placeBelow ? rect.bottom + 8 : aboveTop,
      transform: placeBelow ? undefined : "translateY(-100%)",
      maxWidth,
    });
  }, []);

  const openTooltip = useCallback(() => {
    if (!isTruncated) return;
    positionTooltip();
    setShowTooltip(true);
  }, [isTruncated, positionTooltip]);

  const closeTooltip = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const classes = ["truncated-text", className].filter(Boolean).join(" ");

  return (
    <>
      <span
        ref={ref}
        className={classes}
        onMouseEnter={openTooltip}
        onMouseLeave={closeTooltip}
        onFocus={openTooltip}
        onBlur={closeTooltip}
        tabIndex={isTruncated ? 0 : undefined}
      >
        {text}
      </span>
      {showTooltip &&
        isTruncated &&
        createPortal(
          <div
            className="truncated-text__tooltip"
            role="tooltip"
            style={tipStyle}
          >
            {tipText}
          </div>,
          document.body
        )}
    </>
  );
}
