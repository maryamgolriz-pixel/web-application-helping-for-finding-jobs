import { useId } from "react";
import { LOGO_PATHS as P } from "./logo-paths";

// The icon is two people (blue and teal) who meet in the middle to form an "M".
// The colour split, and the line the two halves animate towards, is at x = 139.32.
const CENTER_X = 139.32;

const VIEWBOX = {
  full: "76 76 456 114",
  icon: "76 76 126 114",
};

/**
 * The Matchora logo as an animated SVG.
 * - On first render the two halves slide in and meet, the heads drop in, the
 *   circuit dots pop, the wordmark is revealed and a light sweeps across.
 * - After that the heads bob and the dots pulse gently.
 * - On hover the halves move closer together, the logo lifts and the light sweeps again.
 * - `loop` keeps the halves meeting and parting, for loading states.
 * All motion is turned off for people who ask for reduced motion (see globals.css).
 */
export default function MatchoraLogo({
  variant = "full",
  loop = false,
  className = "",
}: {
  variant?: "full" | "icon";
  loop?: boolean;
  className?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref = (name: string) => `url(#${id}-${name})`;
  const withWord = variant === "full";

  return (
    <svg
      viewBox={VIEWBOX[variant]}
      role="img"
      aria-label="Matchora"
      className={`matchora-logo ${loop ? "mx-loop" : ""} ${className}`}
    >
      <defs>
        <linearGradient id={`${id}-l`} gradientUnits="userSpaceOnUse" x1="96.48" x2={CENTER_X} y1="0" y2="0">
          <stop offset="0" stopColor="#2159f4" />
          <stop offset="1" stopColor="#2f8cff" />
        </linearGradient>
        <linearGradient id={`${id}-r`} gradientUnits="userSpaceOnUse" x1={CENTER_X} x2="182.15" y1="0" y2="0">
          <stop offset="0" stopColor="#16ccd0" />
          <stop offset="1" stopColor="#0db1c3" />
        </linearGradient>
        <linearGradient id={`${id}-ls`} gradientUnits="userSpaceOnUse" x1="80.76" x2="98.83" y1="0" y2="0">
          <stop offset="0" stopColor="#1c46f0" />
          <stop offset="1" stopColor="#225cf5" />
        </linearGradient>
        <linearGradient id={`${id}-rs`} gradientUnits="userSpaceOnUse" x1="179.8" x2="197.88" y1="0" y2="0">
          <stop offset="0" stopColor="#0eb2c4" />
          <stop offset="1" stopColor="#0aa7bf" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-cl`}>
          <rect x="70" y="70" width={CENTER_X - 70} height="130" />
        </clipPath>
        <clipPath id={`${id}-cr`}>
          <rect x={CENTER_X} y="70" width="70" height="130" />
        </clipPath>
        {/* Every shape of the logo, so the light sweep only shows on the logo itself. */}
        <clipPath id={`${id}-all`}>
          {Object.entries(P).map(([name, d]) => (withWord || name !== "word" ? <path key={name} d={d} /> : null))}
        </clipPath>
      </defs>

      <g className="mx-icon">
        <g className="mx-half mx-half-left">
          <g className="mx-shift mx-shift-left">
            <path d={P.body} fill={ref("l")} clipPath={ref("cl")} />
            <path d={P.centerLine} fill={ref("l")} clipPath={ref("cl")} />
            <path d={P.joint} fill={ref("l")} clipPath={ref("cl")} />
            <path d={P.armLeft} fill={ref("ls")} />
            <path className="mx-node mx-node-1" d={P.nodeLeftTop} fill={ref("ls")} />
            <path className="mx-node mx-node-2" d={P.nodeLeftBottom} fill={ref("ls")} />
            <path className="mx-head mx-head-left" d={P.headLeft} fill={ref("l")} />
          </g>
        </g>
        <g className="mx-half mx-half-right">
          <g className="mx-shift mx-shift-right">
            <path d={P.body} fill={ref("r")} clipPath={ref("cr")} />
            <path d={P.centerLine} fill={ref("r")} clipPath={ref("cr")} />
            <path d={P.joint} fill={ref("r")} clipPath={ref("cr")} />
            <path d={P.armRight} fill={ref("rs")} />
            <path className="mx-node mx-node-3" d={P.nodeRightTop} fill={ref("rs")} />
            <path className="mx-node mx-node-4" d={P.nodeRightBottom} fill={ref("rs")} />
            <path className="mx-head mx-head-right" d={P.headRight} fill={ref("r")} />
          </g>
        </g>
      </g>

      {withWord && <path className="mx-word" d={P.word} fill="#0d1b3e" />}

      <g clipPath={ref("all")}>
        <rect className="mx-shine" x="20" y="70" width="46" height="130" fill={ref("shine")} />
      </g>
    </svg>
  );
}
