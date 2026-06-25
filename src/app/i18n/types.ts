export type Lang = "en" | "lo";

/*
 * A namespace dictionary: an English table plus a Lao table that MUST have the
 * exact same keys. Define dictionaries via `ns({ en, lo })` so TypeScript fails
 * the build if a Lao key is missing or misspelled.
 */
export type NsDict<T extends Record<string, string>> = {
  en: T;
  lo: Record<keyof T, string>;
};

export function ns<T extends Record<string, string>>(d: NsDict<T>): NsDict<T> {
  return d;
}
