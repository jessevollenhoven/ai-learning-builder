// Ensures Gemini failure logs contain metadata but never secrets or request text.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateWithGemini, GEMINI_MODEL, GeminiProviderError } from "./gemini";

vi.mock("server-only", () => ({}));

const apiKey = "test-gemini-api-key";
const teacherText = "private classroom notes about the water cycle";
const request = { activityType: "multiple_choice", teacherText } as const;

describe("generateWithGemini failure logging", () => {
  const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", apiKey);
    errorLog.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("logs the Google 429 fields and model while redacting the key and request text", async () => {
    const message = `Quota exceeded for request ${teacherText}; key ${apiKey}`;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: {
        status: "RESOURCE_EXHAUSTED",
        message,
        debug: "must not be logged",
      },
    }), { status: 429 })));

    await expect(generateWithGemini(request)).rejects.toMatchObject({ kind: "rate_limit" });

    // 3 attempts on the main model plus 3 on the fallback model.
expect(errorLog).toHaveBeenCalledTimes(6);
    expect(errorLog).toHaveBeenCalledWith("Gemini request failed", {
      category: "rate_limit",
      httpStatus: 429,
      googleStatus: "RESOURCE_EXHAUSTED",
      googleMessage: `Quota exceeded for request [redacted]; key [redacted]`,
      model: GEMINI_MODEL,
    });
    const logged = JSON.stringify(errorLog.mock.calls);
    expect(logged).not.toContain(apiKey);
    expect(logged).not.toContain(teacherText);
    expect(logged).not.toContain("must not be logged");
  });

  it("logs timeout category and model without a Google response", async () => {
    const timeout = Object.assign(new Error("request aborted"), { name: "TimeoutError" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeout));

    await expect(generateWithGemini(request)).rejects.toBeInstanceOf(GeminiProviderError);

    expect(errorLog).toHaveBeenCalledWith("Gemini request failed", {
      category: "timeout",
      httpStatus: null,
      googleStatus: null,
      googleMessage: null,
      model: GEMINI_MODEL,
    });
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain(teacherText);
  });

  it("logs the short diagnostic message for an incomplete interaction", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "incomplete",
      errors: [{ code: "MAX_TOKENS", message: "Response ended early." }],
    }), { status: 200 })));

    await expect(generateWithGemini(request)).rejects.toMatchObject({ kind: "blocked" });

    expect(errorLog).toHaveBeenCalledWith("Gemini request failed", expect.objectContaining({
      category: "blocked",
      httpStatus: 200,
      googleStatus: "incomplete",
      googleMessage: "Response ended early.",
      model: GEMINI_MODEL,
    }));
  });
});