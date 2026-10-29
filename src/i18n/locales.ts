import type * as Indonesian from "./dictionaries/id";
export type Locale = "id" | "en";
export const defaultLocale: Locale = "id";
type Localized<T> = T extends string ? string : { [K in keyof T]: Localized<T[K]> };
export type Dictionary = Localized<typeof Indonesian>;
