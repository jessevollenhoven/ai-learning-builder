"use server";

// Saves validated activities without supplying owner_id.
import { revalidatePath } from "next/cache";
import { buildActivityInsert } from "../../../lib/activity-utils";
import { validateMultipleChoiceContent } from "../../../lib/checks";
import { createClient } from "../../../lib/supabase/server";

export async function saveActivity(input: unknown) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    return { error: "Please sign in again before saving." };
  }

  const validation = validateMultipleChoiceContent(input);
  if (!validation.success) {
    return { error: validation.problems.join(" ") };
  }

  const { error: insertError } = await supabase
    .from("activities")
    .insert(buildActivityInsert(validation.data));

  if (insertError) {
    return { error: "We couldn't save this activity. Please try again." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}