import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type MutableRefObject,
  type ReactElement,
  type Ref,
} from "react";
import { createPortal } from "react-dom";

type TooltipChildProps = {
  onMouseEnter?: (e: MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: MouseEvent<HTMLElement>) => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
  ref?: Ref<HTMLElement>;
};

type Props = {
  label: string;
  children: ReactElement<TooltipChildProps>;
};

export function ActionTooltip({ label, children }: Props) {
  const anchorRef = useRef<HTMLElement | null>(null);
  const [coords, setCoords] = useState<{ right: number; top: number } | null>(null);

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      right: window.innerWidth - rect.right,
      top: rect.top,
    });
  }, []);

  const hide = useCallback(() => setCoords(null), []);

  useEffect(() => {
    if (!coords) return;
    const onScroll = () => hide();
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [coords, hide]);

  if (!isValidElement<TooltipChildProps>(children)) return children;

  const child = cloneElement<TooltipChildProps>(children, {
    ref: (node: HTMLElement | null) => {
      anchorRef.current = node;
      const { ref } = children.props;
      if (typeof ref === "function") ref(node);
      else if (ref && typeof ref === "object") {
        (ref as MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    onMouseEnter: (e: MouseEvent<HTMLElement>) => {
      updatePosition();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: MouseEvent<HTMLElement>) => {
      hide();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: FocusEvent<HTMLElement>) => {
      updatePosition();
      children.props.onFocus?.(e);
    },
    onBlur: (e: FocusEvent<HTMLElement>) => {
      hide();
      children.props.onBlur?.(e);
    },
  });

  return (
    <>
      {child}
      {coords
        ? createPortal(
            <div
              className="fav-action-tooltip"
              style={{ right: coords.right, top: coords.top }}
              role="tooltip"
            >
              {label}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
