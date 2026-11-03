// Authenticates generation requests and serves validated sample content in fake mode.
import { createClient } from "../../../lib/supabase/server";
import { checkMultipleChoiceContent } from "../../../lib/checks";
import { generateRequestSchema, multipleChoiceContentSchema, type MultipleChoiceContent } from "../../../lib/schemas";
import { sampleQuiz } from "../../../lib/sample-data";

async function generateWithProvider(_teacherText: string): Promise<MultipleChoiceContent | null> {
  void _teacherText;
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

  if (process.env.FAKE_MODE === "true") {
    const sampleResult = multipleChoiceContentSchema.safeParse(sampleQuiz);
    if (!sampleResult.success) {
      return Response.json({ error: "Sample content failed schema validation." }, { status: 500 });
    }

    const problems = checkMultipleChoiceContent(sampleResult.data);
    if (problems.length > 0) {
      return Response.json({ error: "Sample content failed quality checks.", problems }, { status: 500 });
    }

    return Response.json(sampleResult.data);
  }

  const generatedContent = await generateWithProvider(requestResult.data.teacherText);
  if (!generatedContent) {
    return Response.json({ error: "AI not set up yet." }, { status: 501 });
  }

  return Response.json(generatedContent);
}