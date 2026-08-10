/*
 * Lightweight form validation surface shared by all multi-step forms.
 *
 * Pattern: the Continue / Submit button is ALWAYS enabled. When the user taps it
 * on an incomplete step, the form flips `showErrors` to true (via the provider)
 * and does NOT advance. Every required-but-empty field then renders an inline
 * message and a red outline by reading `useShowErrors()`.
 *
 * The same surface carries SERVER-side errors. `POST /applications/{id}/submit`
 * answers 422 with one entry per missing mandatory field, keyed by its form
 * path ("applicant.citizen_name"). The page hands that map to the provider as
 * `serverErrors`; a field that knows its own path renders the server's sentence
 * instead of the generic "this field is required", so every offending field is
 * highlighted at once rather than one per round trip.
 */
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { AlertCircle } from "lucide-react";
import { useT } from "../i18n";

const ShowErrorsContext = createContext(false);

/** Server field errors keyed by form path, plus the way to retire one. */
interface ServerErrorsValue {
  errors: Record<string, string>;
  clear: (path?: string) => void;
}

const NO_SERVER_ERRORS: Record<string, string> = {};
const noop = () => {};

const ServerErrorsContext = createContext<ServerErrorsValue>({
  errors: NO_SERVER_ERRORS,
  clear: noop,
});

export function ValidationProvider({
  showErrors,
  serverErrors,
  onClearServerError,
  children,
}: {
  showErrors: boolean;
  /** Field errors from the API, keyed by "section.field". */
  serverErrors?: Record<string, string>;
  /** Called when the user edits a field that carried a server error. */
  onClearServerError?: (path?: string) => void;
  children: ReactNode;
}) {
  const value = useMemo<ServerErrorsValue>(
    () => ({ errors: serverErrors ?? NO_SERVER_ERRORS, clear: onClearServerError ?? noop }),
    [serverErrors, onClearServerError],
  );
  return (
    <ShowErrorsContext.Provider value={showErrors}>
      <ServerErrorsContext.Provider value={value}>
        {children}
      </ServerErrorsContext.Provider>
    </ShowErrorsContext.Provider>
  );
}

/** True once the user has tried to advance past an incomplete step. */
export function useShowErrors() {
  return useContext(ShowErrorsContext);
}

/** Every server-side field error currently on the form. */
export function useServerErrors(): Record<string, string> {
  return useContext(ServerErrorsContext).errors;
}

/** The server's message for one field path, if it sent one. */
export function useServerError(path?: string): string | undefined {
  const { errors } = useContext(ServerErrorsContext);
  return path ? errors[path] : undefined;
}

/** Retire a server error once the user answers the field it pointed at. */
export function useClearServerError(): (path?: string) => void {
  return useContext(ServerErrorsContext).clear;
}

/** A value counts as "empty" for required-field validation. */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

/**
 * The error state of a single field: the server's complaint if there is one,
 * otherwise the local "you left this blank" check once errors are revealed.
 */
export function useFieldError(options: {
  /** Form path the API uses for this field, e.g. "applicant.citizen_name". */
  path?: string;
  required?: boolean;
  value?: unknown;
  /** A disabled control (a district with no province yet) never complains. */
  disabled?: boolean;
}): { hasError: boolean; message?: string } {
  const showErrors = useShowErrors();
  const serverMessage = useServerError(options.path);
  if (serverMessage) return { hasError: true, message: serverMessage };
  const local =
    showErrors && Boolean(options.required) && !options.disabled && isEmpty(options.value);
  return { hasError: local };
}

/** Border / ring classes to splice into a field when it is in an error state. */
export function fieldErrorRing(hasError: boolean): string {
  return hasError
    ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
    : "border-gray-200 focus:border-[#344EAD] focus:ring-2 focus:ring-[#344EAD]/20";
}

/** Inline "this field is required" message; renders only when `show` is true.
 *  Carries `data-field-error` so scrollToFirstError() can locate it. */
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
    <p data-field-error className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {message ?? t("fieldRequired")}
    </p>
  );
}

/**
 * After a form reveals its errors, jump to the first invalid field: scroll it to
 * the centre of the viewport and move keyboard focus onto its control. Every
 * inline error renders a `[data-field-error]` marker (see FieldError), so this
 * finds the first one in document order — which is the first invalid field.
 *
 * Call it right after `setShowErrors(true)`; the rAF waits for React to commit
 * the newly-rendered error nodes before querying the DOM.
 */
export function scrollToFirstError() {
  requestAnimationFrame(() => {
    const marker = document.querySelector<HTMLElement>("[data-field-error]");
    if (!marker) return;
    // The marker <p> sits inside the field wrapper alongside its label + control.
    const field = marker.parentElement ?? marker;
    field.scrollIntoView({ behavior: "smooth", block: "center" });
    // Focus the first VISIBLE control (skips e.g. a hidden file input).
    const control = Array.from(
      field.querySelectorAll<HTMLElement>("input, select, textarea, button, [tabindex]")
    ).find((el) => el.offsetParent !== null && !el.hasAttribute("disabled"));
    control?.focus({ preventScroll: true });
  });
}

/**
 * The step a submission's first complaint belongs to.
 *
 * The API answers with every missing field at once and they rarely live on the
 * step the user is standing on, so the form jumps to the earliest one before
 * scrolling to it. `steps` maps a field path to the step that renders it.
 */
export function stepOfFirstError(
  paths: string[],
  steps: Record<string, number>,
): number | undefined {
  let earliest: number | undefined;
  for (const path of paths) {
    const step = steps[path];
    if (step === undefined) continue;
    if (earliest === undefined || step < earliest) earliest = step;
  }
  return earliest;
}
