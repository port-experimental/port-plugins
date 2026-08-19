import type { TabKey } from "../types";

type Props = {
  tab: TabKey;
  size?: number;
};

export function TabTypeIcon({ tab, size = 24 }: Props) {
  if (tab === "pages") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 -960 960 960" width={size} fill="#3CB3F6" aria-hidden>
        <path d="M120-120v-240h320v240H120Zm400 0v-400h320v400H520ZM120-440v-400h320v400H120Zm400-160v-240h320v240H520Z" />
      </svg>
    );
  }

  if (tab === "entities") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 -960 960 960" width={size} fill="#868DFF" aria-hidden>
        <path d="M100-180v-121.54h121.54V-180H100Zm216.92 0v-121.54H860V-180H316.92ZM100-419.23v-121.54h121.54v121.54H100Zm216.92 0v-121.54H860v121.54H316.92ZM100-658.46V-780h121.54v121.54H100Zm216.92 0V-780H860v121.54H316.92Z" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 -960 960 960" width={size} fill="#F6C23C" aria-hidden>
      <path d="m320-80 40-280H160l360-520h80l-40 320h240L400-80h-80Z" />
    </svg>
  );
}
