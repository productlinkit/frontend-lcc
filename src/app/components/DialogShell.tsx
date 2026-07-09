import type { ReactNode } from "react";
import { useModalA11y } from "../useModalA11y";

/**
 * Accessible overlay + dialog wrapper. Preserves the caller's exact overlay and
 * dialog class names (so visual layout is unchanged) while adding:
 *   • role="dialog" + aria-modal + labelling
 *   • Escape / focus-trap / scroll-lock / focus-restore (via useModalA11y)
 *   • a subtle entrance animation (respects prefers-reduced-motion)
 */
export function DialogShell({
  onClose,
  overlayClassName,
  dialogClassName,
  labelledBy,
  label,
  children,
}: {
  onClose: () => void;
  overlayClassName: string;
  dialogClassName: string;
  labelledBy?: string;
  label?: string;
  children: ReactNode;
}) {
  const ref = useModalA11y<HTMLDivElement>(onClose);
  return (
    <div className={`${overlayClassName} lcc-overlay-in`} onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={label}
        tabIndex={-1}
        className={`${dialogClassName} lcc-dialog-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
