import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  title: string;
  description?: string;
};

export type FavoriteItemTextHandle = {
  showTooltip: () => void;
  hideTooltip: () => void;
};

function isLineTruncated(el: HTMLElement | null): boolean {
  if (!el) return false;
  return el.scrollWidth > el.clientWidth;
}

export const FavoriteItemText = forwardRef<FavoriteItemTextHandle, Props>(
  function FavoriteItemText({ title, description }, ref) {
    const wrapRef = useRef<HTMLSpanElement>(null);
    const titleRef = useRef<HTMLSpanElement>(null);
    const descriptionRef = useRef<HTMLSpanElement>(null);
    const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
    const [tooltipVisible, setTooltipVisible] = useState(false);

    const isTruncated = useCallback(() => {
      if (isLineTruncated(titleRef.current)) return true;
      if (description && isLineTruncated(descriptionRef.current)) return true;
      return false;
    }, [description]);

    const hideTooltip = useCallback(() => {
      setCoords(null);
      setTooltipVisible(false);
    }, []);

    const showTooltip = useCallback(() => {
      const wrap = wrapRef.current;
      if (!isTruncated() || !wrap) {
        hideTooltip();
        return;
      }
      const rect = wrap.getBoundingClientRect();
      setCoords({ left: rect.left, top: rect.top });
      setTooltipVisible(true);
    }, [hideTooltip, isTruncated]);

    useImperativeHandle(ref, () => ({ showTooltip, hideTooltip }), [
      hideTooltip,
      showTooltip,
    ]);

    useLayoutEffect(() => {
      const nodes = [wrapRef.current, titleRef.current, descriptionRef.current].filter(
        Boolean
      ) as HTMLElement[];
      if (nodes.length === 0) return;

      const observer = new ResizeObserver(() => {
        if (coords && !isTruncated()) hideTooltip();
      });
      nodes.forEach((node) => observer.observe(node));
      return () => observer.disconnect();
    }, [coords, hideTooltip, isTruncated]);

    useEffect(() => {
      if (!coords) return;
      const onScroll = () => hideTooltip();
      window.addEventListener("scroll", onScroll, true);
      return () => window.removeEventListener("scroll", onScroll, true);
    }, [coords, hideTooltip]);

    return (
      <>
        <span
          ref={wrapRef}
          className="fav-item-text"
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          <span ref={titleRef} className="fav-item-title">
            {title}
          </span>
          {description ? (
            <span ref={descriptionRef} className="fav-item-description">
              {description}
            </span>
          ) : null}
        </span>
        {coords && tooltipVisible
          ? createPortal(
              <div
                className="fav-text-tooltip"
                style={{ left: coords.left, top: coords.top }}
                role="tooltip"
              >
                <div className="fav-text-tooltip-body">
                  <span className="fav-text-tooltip-line fav-text-tooltip-line--title">
                    {title}
                  </span>
                  {description ? (
                    <span className="fav-text-tooltip-line fav-text-tooltip-line--description">
                      {description}
                    </span>
                  ) : null}
                </div>
                <span className="fav-text-tooltip-arrow" aria-hidden />
              </div>,
              document.body
            )
          : null}
      </>
    );
  }
);
