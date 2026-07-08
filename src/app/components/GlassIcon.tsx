import type { ElementType } from "react";
import { hexToRgba, shade } from "../glass";

/**
 * Glassmorphism-style icon (à la Icons8): a colorful squircle of layered glass —
 * gradient base, blurred floating bubbles, a frosted translucent panel, a white
 * glyph, and a diagonal gloss highlight. No backdrop-filter (kept performant).
 */
export function GlassIcon({
  icon: Icon,
  color,
  size = 44,
}: {
  icon: ElementType;
  color: string;
  size?: number;
}) {
  const glyph = Math.round(size * 0.46);
  return (
    <div
      className="relative overflow-hidden flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: "28%",
        background: `linear-gradient(145deg, ${shade(color, 30)} 0%, ${color} 55%, ${shade(color, -16)} 100%)`,
        boxShadow: `0 6px 14px ${hexToRgba(color, 0.4)}, inset 0 1px 1px rgba(255,255,255,0.45)`,
      }}
    >
      {/* floating blurred glass bubbles */}
      <span
        className="absolute rounded-full"
        style={{
          width: size * 0.55,
          height: size * 0.55,
          top: -size * 0.16,
          right: -size * 0.12,
          background: "rgba(255,255,255,0.42)",
          filter: `blur(${size * 0.06}px)`,
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          bottom: size * 0.05,
          left: size * 0.08,
          background: "rgba(255,255,255,0.3)",
          filter: `blur(${size * 0.045}px)`,
        }}
      />

      {/* frosted translucent panel */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          inset: size * 0.1,
          borderRadius: "24%",
          background: "rgba(255,255,255,0.16)",
          border: "1px solid rgba(255,255,255,0.5)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6)",
        }}
      >
        <Icon
          strokeWidth={2}
          style={{
            width: glyph,
            height: glyph,
            color: "#fff",
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.18))",
          }}
        />
      </div>

      {/* diagonal gloss highlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 42%)" }}
      />
    </div>
  );
}
