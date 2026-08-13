/// <reference types="vite/client" />

// Static asset imports (handled by Vite / the figma-asset-resolver plugin)
declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.csv" {
  const content: string;
  export default content;
}

declare module "*.pdf" {
  const src: string;
  export default src;
}

// Figma Make asset alias, e.g. import x from "figma:asset/abc.png"
declare module "figma:asset/*" {
  const src: string;
  export default src;
}

// Environment variables the app reads. VITE_API_URL points at the Go backend;
// it defaults to http://localhost:8080/api/v1 when unset.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /**
   * The Google OAuth client id, which must match GOOGLE_CLIENT_ID on the
   * server — the server checks that every ID token was addressed to it. A
   * client id is public by design; the client *secret* is not, and this flow
   * has no use for one. Leave this unset and the Google button explains that
   * sign-in is unavailable rather than failing on click.
   */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
