// Tests generation, repair, and provider failures without external calls.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { getRefinedSampleQuiz, sampleQuiz } from "../../../lib/sample-data";

const mocks = vi.hoisted(() => {
  class MockGeminiProviderError extends Error {
    constructor(readonly kind: string) {
      super(kind);
    }
  }

  return {
    generateWithGemini: vi.fn(),
    getClaims: vi.fn(),
    GeminiProviderError: MockGeminiProviderError,
  };
});

vi.mock("../../../lib/gemini", () => ({
  generateWithGemini: mocks.generateWithGemini,
  GeminiProviderError: mocks.GeminiProviderError,
}));

vi.mock("../../../lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims: mocks.getClaims } }),
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDuplicateQuiz() {
  const invalid = structuredClone(sampleQuiz);
  invalid.questions[3].options[2] = invalid.questions[3].options[1];
  return invalid;
}

describe("POST /api/generate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("FAKE_MODE", "false");
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "teacher-id" } }, error: null });
    mocks.generateWithGemini.mockResolvedValue(JSON.stringify(sampleQuiz));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns validated generated content", async () => {
    const response = await POST(makeRequest({
      activityType: "multiple_choice",
      teacherText: "Create a quiz about the water cycle.",
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(sampleQuiz);
    expect(mocks.generateWithGemini).toHaveBeenCalledTimes(1);
  });

  it("sends current content and instruction for a complete refinement", async () => {
    mocks.generateWithGemini.mockResolvedValueOnce(JSON.stringify(getRefinedSampleQuiz()));
    const requestBody = {
      mode: "refine",
      activityType: "multiple_choice",
      content: sampleQuiz,
      instruction: "Make question 3 harder.",
    };

    const response = await POST(makeRequest(requestBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(getRefinedSampleQuiz());
    expect(mocks.generateWithGemini).toHaveBeenCalledWith(requestBody);
  });

  it("retries one invalid candidate with the validation problems", async () => {
    mocks.generateWithGemini
      .mockResolvedValueOnce(JSON.stringify(makeDuplicateQuiz()))
      .mockResolvedValueOnce(JSON.stringify(sampleQuiz));

    const response = await POST(makeRequest({
      activityType: "multiple_choice",
      teacherText: "Create a quiz about the water cycle.",
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(sampleQuiz);
    expect(mocks.generateWithGemini).toHaveBeenCalledTimes(2);
    expect(mocks.generateWithGemini.mock.calls[1][1]).toContain("Question 4 has two identical options");
  });

  it("returns a friendly error after the repaired candidate still fails", async () => {
    mocks.generateWithGemini.mockResolvedValue(JSON.stringify(makeDuplicateQuiz()));

    const response = await POST(makeRequest({
      mode: "refine",
      activityType: "multiple_choice",
      content: sampleQuiz,
      instruction: "Make question 4 harder.",
    }));
    const result = await response.json();

    expect(response.status).toBe(502);
    expect(result.error).toContain("Your current activity is unchanged");
    expect(mocks.generateWithGemini).toHaveBeenCalledTimes(2);
  });

  it("keeps fake mode on the sample path without calling Gemini", async () => {
    vi.stubEnv("FAKE_MODE", "true");

    const response = await POST(makeRequest({
      activityType: "multiple_choice",
      teacherText: "Create a quiz about the water cycle.",
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(sampleQuiz);
    expect(mocks.generateWithGemini).not.toHaveBeenCalled();
  });

  it.each([
    ["not_configured", 503, "not configured"],
    ["rate_limit", 429, "busy"],
    ["timeout", 504, "too long"],
    ["blocked", 502, "couldn't complete"],
    ["empty", 502, "returned no content"],
  ])("maps %s to a friendly response without upstream details", async (kind, status, message) => {
    const error = new mocks.GeminiProviderError(kind);
    error.message = "upstream failed; secret=test-key";
    mocks.generateWithGemini.mockRejectedValue(error);

    const response = await POST(makeRequest({
      activityType: "multiple_choice",
      teacherText: "Create a quiz about the water cycle.",
    }));
    const body = await response.text();

    expect(response.status).toBe(status);
    expect(body.toLowerCase()).toContain(message);
    expect(body).not.toContain("test-key");
    expect(body).not.toContain("upstream failed");
  });
});