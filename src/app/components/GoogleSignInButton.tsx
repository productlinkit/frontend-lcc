/*
 * "Continue with Google".
 *
 * The button itself is drawn by Google Identity Services rather than by us.
 * That is not a styling preference: the ID token is only handed to a caller
 * Google trusts, and the rendered button is the supported way to ask for one
 * from a single-page app. It also keeps the mark and wording compliant with
 * Google's branding rules, which a hand-rolled button would not be.
 *
 * Everything this component produces is a credential to hand upwards. It never
 * decides anything about the session — the server verifies the token against
 * Google's published keys, and a token this component obtained is worth exactly
 * as much as one an attacker forged until that check passes.
 */

import { useEffect, useRef, useState } from "react";

/* ── The slice of the GIS global this file uses ─────────────────────────── */

interface GoogleCredentialResponse {
  /** The ID token, as a signed JWT. Absent when the user dismissed the flow. */
  credential?: string;
}

interface GoogleButtonOptions {
  type: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "small" | "medium" | "large";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
}

interface GoogleIdApi {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    ux_mode?: "popup" | "redirect";
  }): void;
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
  cancel(): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdApi } };
  }
}

/* ── Script loading ─────────────────────────────────────────────────────── */

const GIS_SRC = "https://accounts.google.com/gsi/client";

/**
 * The in-flight or settled load, shared by every button on the page. The script
 * is loaded on demand rather than from index.html so pages that never show a
 * sign-in form make no request to Google at all.
 */
let gisLoader: Promise<GoogleIdApi> | undefined;

function loadGoogleIdentity(): Promise<GoogleIdApi> {
  if (gisLoader) return gisLoader;

  gisLoader = new Promise<GoogleIdApi>((resolve, reject) => {
    const settle = () => {
      const api = window.google?.accounts?.id;
      if (api) resolve(api);
      else reject(new Error("Google Identity Services loaded without accounts.id"));
    };

    if (window.google?.accounts?.id) {
      settle();
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", settle, { once: true });
    script.addEventListener(
      "error",
      () => {
        // Clear the cache so a later mount can retry. A citizen behind a
        // network that blocks Google must still be able to use the rest of the
        // sign-in form, so this failure is never fatal.
        gisLoader = undefined;
        script.remove();
        reject(new Error("could not load Google Identity Services"));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });

  return gisLoader;
}

/* ── Component ──────────────────────────────────────────────────────────── */

/** GIS renders at its default width outside this range, which would leave the
 *  button visibly out of line with the ones stacked above it. */
const MIN_BUTTON_WIDTH = 200;
const MAX_BUTTON_WIDTH = 400;

export interface GoogleSignInButtonProps {
  /** Receives the ID token. Send it to the API; do not trust it here. */
  onCredential: (idToken: string) => void | Promise<void>;
  /** Greys the button out while another sign-in is already running. */
  disabled?: boolean;
  /** BCP-47 tag for the button's own wording. */
  locale?: string;
  /** Wording for the placeholder shown before or instead of Google's button. */
  label: string;
  /** Wording for the placeholder when Google sign-in cannot be offered. */
  unavailableLabel: string;
}

export function GoogleSignInButton({
  onCredential,
  disabled = false,
  locale,
  label,
  unavailableLabel,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [width, setWidth] = useState(0);

  // GIS captures the callback at initialize() time, so it would otherwise hold
  // whichever closure existed on the first render forever.
  const handlerRef = useRef(onCredential);
  handlerRef.current = onCredential;

  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim();

  // Track the width the button should be drawn at. Google draws into an iframe
  // that does not reflow, so a resize has to re-render it.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const measured = Math.round(entries[0]?.contentRect.width ?? 0);
      if (measured <= 0) return;
      setWidth(Math.min(MAX_BUTTON_WIDTH, Math.max(MIN_BUTTON_WIDTH, measured)));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!clientId) {
      // Nothing to initialise with. Say so rather than rendering a button that
      // fails on click.
      setStatus("unavailable");
      return;
    }
    if (width === 0) return;

    let cancelled = false;

    loadGoogleIdentity()
      .then((api) => {
        const node = containerRef.current;
        if (cancelled || !node) return;

        api.initialize({
          client_id: clientId,
          callback: (response) => {
            const credential = response.credential?.trim();
            // A dismissed prompt calls back with nothing. That is not an error
            // and must not be reported as one.
            if (credential) void handlerRef.current(credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: "popup",
        });

        // Drop any button from a previous width before drawing the new one.
        node.replaceChildren();
        api.renderButton(node, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width,
          locale,
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, locale, width]);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className={[
          "w-full flex justify-center",
          status === "ready" ? "" : "h-0 overflow-hidden",
          disabled ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      />

      {status !== "ready" && (
        <button
          type="button"
          disabled
          aria-busy={status === "loading"}
          title={status === "unavailable" ? unavailableLabel : undefined}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm opacity-60 cursor-not-allowed"
        >
          <GoogleIcon />
          {status === "unavailable" ? unavailableLabel : label}
        </button>
      )}
    </div>
  );
}

/** The Google mark, for the placeholder only — Google draws its own. */
export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
