/*
 * Lightweight form validation surface shared by all multi-step forms.
 *
 * Pattern: the Continue / Submit button is ALWAYS enabled. When the user taps it
 * on an incomplete step, the form flips `showErrors` to true (via the provider)
 * and does NOT advance. Every required-but-empty field then renders an inline
 * message and a red outline by reading `useShowErrors()`.
 */
import { createContext, useContext, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { useT } from "../i18n";

const ShowErrorsContext = createContext(false);

export function ValidationProvider({
  showErrors,
  children,
}: {
  showErrors: boolean;
  children: ReactNode;
}) {
  return (
    <ShowErrorsContext.Provider value={showErrors}>
      {children}
    </ShowErrorsContext.Provider>
  );
}

/** True once the user has tried to advance past an incomplete step. */
export function useShowErrors() {
  return useContext(ShowErrorsContext);
}

/** A value counts as "empty" for required-field validation. */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

/** Border / ring classes to splice into a field when it is in an error state. */
export function fieldErrorRing(hasError: boolean): string {
  return hasError
    ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
    : "border-gray-200 focus:border-[#344EAD] focus:ring-2 focus:ring-[#344EAD]/20";
}

/** Inline "this field is required" message; renders only when `show` is true. */
export function FieldError({
  show,
  message,
}: {
  show: boolean;
  message?: string;
}) {
  const t = useT("common");
  if (!show) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {message ?? t("fieldRequired")}
    </p>
  );
}
