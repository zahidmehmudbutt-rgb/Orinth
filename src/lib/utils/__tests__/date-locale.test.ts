import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock i18next before importing the module under test
vi.mock("i18next", () => ({
  default: {
    language: "en",
  },
}));

import i18n from "i18next";
import { getDateLocale } from "../date-locale";

describe("getDateLocale", () => {
  beforeEach(() => {
    // Reset to default
    (i18n as { language: string }).language = "en";
  });

  it('returns "en-US" when i18n language is "en"', () => {
    (i18n as { language: string }).language = "en";
    expect(getDateLocale()).toBe("en-US");
  });

  it('returns "ur-PK" when i18n language is "ur"', () => {
    (i18n as { language: string }).language = "ur";
    expect(getDateLocale()).toBe("ur-PK");
  });

  it('returns "en-US" for any non-"ur" language', () => {
    (i18n as { language: string }).language = "fr";
    expect(getDateLocale()).toBe("en-US");
  });

  it('returns "en-US" when language is undefined', () => {
    (i18n as { language: string | undefined }).language = undefined;
    expect(getDateLocale()).toBe("en-US");
  });
});
