type MedalRank = 1 | 2 | 3;

const MEDAL_CLASS: Record<MedalRank, string> = {
  1: "medal-icon--gold",
  2: "medal-icon--silver",
  3: "medal-icon--bronze",
};

/** Rosette-with-ribbon medal icon with the rank number inside, colored via `currentColor` from its wrapper class. */
export function MedalIcon({ rank }: { rank: MedalRank }) {
  return (
    <svg
      className={`medal-icon ${MEDAL_CLASS[rank]}`}
      viewBox="0 0 24 26"
      width="34"
      height="37"
      aria-hidden="true"
    >
      <polygon
        className="medal-icon__ribbon"
        points="7,13 10,13 9,24 5,21"
        fill="currentColor"
      />
      <polygon
        className="medal-icon__ribbon"
        points="14,13 17,13 19,21 15,24"
        fill="currentColor"
      />
      <circle cx="12" cy="9" r="7.5" fill="currentColor" />
      <circle cx="12" cy="9" r="5.4" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.9" />
      <text
        x="12"
        y="9"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize="7"
        fontWeight="700"
      >
        {rank}
      </text>
    </svg>
  );
}
