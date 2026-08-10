import { useState } from "react";
import { GlassIcon } from "./GlassIcon";
import { CATEGORIES, type ServiceItem } from "./ServicePage";
import { useServiceConfig, formatFee } from "../serviceConfig";
import { useT, useLang } from "../i18n";

/** Fallback accent when neither the service nor its category names a colour. */
const DEFAULT_ACCENT = "#344EAD";

/** Shared service tile — used on the home menu and the Service page list. */
export function ServiceCard({
  service,
  onClick,
}: {
  service: ServiceItem;
  onClick: () => void;
}) {
  const t = useT("home");
  const { lang } = useLang();
  const [hover, setHover] = useState(false);

  // The catalogue gives each service its own colour; older callers pass only a
  // category, so fall back to the category tint and then to the brand blue.
  const accent =
    service.color ??
    CATEGORIES.find((c) => c.id === service.category)?.color ??
    DEFAULT_ACCENT;

  const Icon = service.icon;
  // Fees come from /services, cached in serviceConfig; until it lands this is
  // the seeded value, so the row never renders blank.
  const { config: cfg, loading: feeLoading } = useServiceConfig(service.id);
  const isFree = cfg.fee === 0 && cfg.feeMax == null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="cursor-pointer rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 border flex flex-col"
      style={{
        backgroundColor: hover ? "#344EAD" : "white",
        borderColor: hover ? "#2A3F99" : "#F3F4F6",
      }}
    >
      <div className="mb-4">
        <GlassIcon icon={Icon} color={accent} size={56} />
      </div>
      <p
        className="text-lg font-semibold leading-snug transition-colors duration-200"
        style={{ color: hover ? "white" : "#1F2937" }}
      >
        {lang === "lo" ? service.nameLo : service.name}
      </p>
      <p
        className="text-[15px] mt-1 leading-snug transition-colors duration-200"
        style={{ color: hover ? "rgba(255,255,255,0.72)" : "#6B7280" }}
      >
        {lang === "lo" ? service.descLo : service.desc}
      </p>

      <div
        className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between mt-4 pt-3 border-t transition-colors duration-200"
        style={{ borderColor: hover ? "rgba(255,255,255,0.22)" : "#F3F4F6" }}
      >
        <span
          className="text-sm font-semibold whitespace-nowrap"
          style={{
            color: hover ? "white" : isFree ? "#15803D" : "#344EAD",
            opacity: feeLoading ? 0.55 : 1,
          }}
        >
          {formatFee(cfg, lang)}
        </span>
        <span
          className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors duration-200"
          style={
            hover
              ? { backgroundColor: "white", color: "#344EAD" }
              : { backgroundColor: "#344EAD", color: "white" }
          }
        >
          {t("applyNow")}
        </span>
      </div>
    </div>
  );
}
