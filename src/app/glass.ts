import type { CSSProperties } from "react";

// #RRGGBB → rgba() string
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Lighten (percent > 0, toward white) or darken (percent < 0, toward black).
export function shade(hex: string, percent: number): string {
  const h = hex.replace("#", "");
  let r = parseInt(h.slice(0, 2), 16);
  let g = parseInt(h.slice(2, 4), 16);
  let b = parseInt(h.slice(4, 6), 16);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return `rgb(${r}, ${g}, ${b})`;
}

// Faux-glass tinted icon tile (glassmorphism). Pair with `backdrop-blur-md`.
// `color` tints the frosted surface; the white inset gives the glass sheen.
export function glassTile(color: string): CSSProperties {
  return {
    backgroundColor: hexToRgba(color, 0.16),
    border: `1px solid ${hexToRgba(color, 0.32)}`,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
  };
}

// White glass variant for use over dark/colored surfaces (e.g. hovered cards).
export const glassTileLight: CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.22)",
  border: "1px solid rgba(255,255,255,0.5)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
};
