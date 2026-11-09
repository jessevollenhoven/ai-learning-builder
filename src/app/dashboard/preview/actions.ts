"use server";

// Saves validated activities without supplying owner_id.
import { revalidatePath } from "next/cache";
import { buildActivityInsert, buildActivityShareUpdate, buildActivityUpdate } from "../../../lib/activity-utils";
import { validateActivityContent } from "../../../lib/activity-types";
import { createClient } from "../../../lib/supabase/server";

export async function saveActivity(input: unknown) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    return { error: "Please sign in again before saving." };
  }

  const validation = validateActivityContent(input);
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

// Changes only the share flag after verifying the signed-in user.
export async function setActivityShared(id: string, shared: boolean) {
  if (typeof id !== "string" || !id.trim() || typeof shared !== "boolean") {
    return { error: "Invalid sharing request." };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    return { error: "Please sign in again before changing sharing." };
  }

  const { data, error } = await supabase
    .from("activities")
    .update(buildActivityShareUpdate(shared))
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { error: "We couldn't update sharing for this activity." };
  }

  revalidatePath("/dashboard/preview");
  revalidatePath("/a/[id]", "page");
  return { success: true };
}

// Saves edits to an existing activity. The database policy only lets the owner update it.
export async function updateActivity(id: string, input: unknown) {
  if (typeof id !== "string" || !id.trim()) {
    return { error: "Invalid activity." };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    return { error: "Please sign in again before saving." };
  }

  const validation = validateActivityContent(input);
  if (!validation.success) {
    return { error: validation.problems.join(" ") };
  }

  // Matching on type means an edit can never turn one kind of activity into another.
  const { data, error } = await supabase
    .from("activities")
    .update(buildActivityUpdate(validation.data))
    .eq("id", id)
    .eq("type", validation.data.type)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { error: "We couldn't save your changes. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/preview");
  revalidatePath("/a/[id]", "page");
  return { success: true };
}