// Authenticates generation requests and serves validated sample content in fake mode.
import { createClient } from "../../../lib/supabase/server";
import { validateMultipleChoiceContent } from "../../../lib/checks";
import {
  generateRequestSchema,
  multipleChoiceContentSchema,
  type GenerateRequest,
  type MultipleChoiceContent,
} from "../../../lib/schemas";
import { getRefinedSampleQuiz, sampleQuiz } from "../../../lib/sample-data";

async function generateWithProvider(_request: GenerateRequest): Promise<MultipleChoiceContent | null> {
  void _request;
  return null;
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

  const generatedContent = await generateWithProvider(requestResult.data);
  if (!generatedContent) {
    return Response.json({ error: "AI not set up yet." }, { status: 501 });
  }

  const result = multipleChoiceContentSchema.safeParse(generatedContent);
  if (!result.success) {
    return Response.json({ error: "Generated content failed validation." }, { status: 502 });
  }

  const checkedContent = validateMultipleChoiceContent(result.data);
  if (!checkedContent.success) {
    return Response.json(
      { error: "Generated content failed quality checks.", problems: checkedContent.problems },
      { status: 502 },
    );
  }

  return Response.json(checkedContent.data);
}