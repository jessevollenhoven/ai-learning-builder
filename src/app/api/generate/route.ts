// Authenticates generation requests and serves validated sample content in fake mode.
import { createClient } from "../../../lib/supabase/server";
import { validateMultipleChoiceContent } from "../../../lib/checks";
import { generateWithGemini, GeminiProviderError } from "../../../lib/gemini";
import {
  generateRequestSchema,
} from "../../../lib/schemas";
import { getRefinedSampleQuiz, sampleQuiz } from "../../../lib/sample-data";

function validateGeneratedText(text: string) {
  try {
    return validateMultipleChoiceContent(JSON.parse(text));
  } catch {
    return { success: false as const, problems: ["The response was not valid JSON."] };
  }
}

function providerErrorResponse(error: unknown) {
  if (!(error instanceof GeminiProviderError)) {
    return Response.json({ error: "Quiz generation is temporarily unavailable. Please try again." }, { status: 503 });
  }

  switch (error.kind) {
    case "not_configured":
      return Response.json({ error: "AI generation is not configured yet." }, { status: 503 });
    case "rate_limit":
      return Response.json({ error: "The quiz generator is busy. Please wait a moment and try again." }, { status: 429 });
    case "timeout":
      return Response.json({ error: "Quiz generation took too long. Please try again." }, { status: 504 });
    case "blocked":
      return Response.json({ error: "The quiz generator couldn't complete this request. Try different wording." }, { status: 502 });
    case "empty":
      return Response.json({ error: "The quiz generator returned no content. Please try again." }, { status: 502 });
    case "unavailable":
      return Response.json({ error: "Quiz generation is temporarily unavailable. Please try again." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const requestResult = generateRequestSchema.safeParse(requestBody);
  if (!requestResult.success) {
    return Response.json(
      {
        error: "Invalid request body.",
        problems: requestResult.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  if ("mode" in requestResult.data) {
    const currentContent = validateMultipleChoiceContent(requestResult.data.content);
    if (!currentContent.success) {
      return Response.json(
        { error: "The current activity content is invalid.", problems: currentContent.problems },
        { status: 400 },
      );
    }
  }

  if (process.env.FAKE_MODE === "true") {
    const candidate = "mode" in requestResult.data ? getRefinedSampleQuiz() : sampleQuiz;
    const sampleResult = validateMultipleChoiceContent(candidate);
    if (!sampleResult.success) {
      return Response.json(
        { error: "Sample content failed validation.", problems: sampleResult.problems },
        { status: 500 },
      );
    }

    return Response.json(sampleResult.data);
  }

  try {
    const firstCandidate = validateGeneratedText(await generateWithGemini(requestResult.data));
    if (firstCandidate.success) return Response.json(firstCandidate.data);

    const repairedCandidate = validateGeneratedText(
      await generateWithGemini(requestResult.data, firstCandidate.problems),
    );
    if (!repairedCandidate.success) {
      return Response.json(
        {
          error: "We couldn't create a valid quiz. Your current activity is unchanged. Please try again.",
          problems: repairedCandidate.problems,
        },
        { status: 502 },
      );
    }

    return Response.json(repairedCandidate.data);
  } catch (error) {
    return providerErrorResponse(error);
  }
}