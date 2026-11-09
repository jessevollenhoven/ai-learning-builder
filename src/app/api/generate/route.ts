// Authenticates generation requests, then generates (or serves sample) validated content for any enabled type.
import { createClient } from "../../../lib/supabase/server";
import { getActivityType, validateActivityContent } from "../../../lib/activity-types";
import { generateWithGemini, GeminiProviderError } from "../../../lib/gemini";
import { generateRequestSchema } from "../../../lib/schemas";

// Allow up to 60 seconds, because the AI may retry before it answers.
export const maxDuration = 60;

// Parses the AI's text and checks it is valid content of the type that was asked for.
function validateGeneratedText(text: string, expectedType: string) {
  try {
    const result = validateActivityContent(JSON.parse(text));
    if (result.success && result.data.type !== expectedType) {
      return { success: false as const, problems: [`The activity must be of type ${expectedType}.`] };
    }
    return result;
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

  // Only types that are built and enabled in the registry can be generated.
  const activityType = requestResult.data.activityType;
  const definition = getActivityType(activityType);
  if (!definition?.enabled) {
    return Response.json({ error: "This activity type isn't available yet." }, { status: 400 });
  }

  if ("mode" in requestResult.data) {
    const currentContent = validateActivityContent(requestResult.data.content);
    if (!currentContent.success) {
      return Response.json(
        { error: "The current activity content is invalid.", problems: currentContent.problems },
        { status: 400 },
      );
    }
  }

  if (process.env.FAKE_MODE === "true") {
    const sample = definition.sample;
    if (!sample) {
      return Response.json({ error: "No sample content for this type." }, { status: 500 });
    }
    const candidate = "mode" in requestResult.data ? { ...sample, title: `${sample.title} (refined)` } : sample;
    const sampleResult = validateActivityContent(candidate);
    if (!sampleResult.success) {
      return Response.json(
        { error: "Sample content failed validation.", problems: sampleResult.problems },
        { status: 500 },
      );
    }

    return Response.json(sampleResult.data);
  }

  try {
    const firstCandidate = validateGeneratedText(await generateWithGemini(requestResult.data), activityType);
    if (firstCandidate.success) return Response.json(firstCandidate.data);

    const repairedCandidate = validateGeneratedText(
      await generateWithGemini(requestResult.data, firstCandidate.problems),
      activityType,
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