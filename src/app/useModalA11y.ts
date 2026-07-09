import { useEffect, useRef } from "react";

/**
 * Accessibility behaviour for modal dialogs — behaviour only, no layout impact.
 *
 *  • Escape closes the dialog
 *  • Tab is trapped inside the dialog (WCAG 2.4.3 focus order / 2.1.2 no keyboard trap out)
 *  • Focus moves into the dialog on open and returns to the trigger on close
 *  • Background page scroll is locked while open
 *
 * Returns a ref to spread onto the dialog container element.
 */
export function useModalA11y<T extends HTMLElement = HTMLDivElement>(
  onClose: () => void
) {
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const node = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      node
        ? Array.from(
            node.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => el.offsetParent !== null || el === document.activeElement)
        : [];

    // Move focus into the dialog.
    const first = focusables()[0];
    (first ?? node)?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener("keydown", handleKey, true);

    // Lock background scroll.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey, true);
      document.body.style.overflow = prevOverflow;
      // Return focus to whatever opened the dialog.
      previouslyFocused?.focus?.();
    };
  }, []);

  return ref;
}
