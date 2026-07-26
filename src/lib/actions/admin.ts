"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { UserRole } from "@/db/schema";

export type FieldOptions = {
  countries: string[];
  proposal_count_ranges: string[];
};

const DEFAULT_FIELD_OPTIONS: FieldOptions = {
  countries: ["USA", "USA, Worldwide", "UK", "Canada", "Australia"],
  proposal_count_ranges: ["0 to 5", "5 to 10", "10 to 20", "20 to 50", "50+"],
};

export async function getFieldOptions(): Promise<FieldOptions> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "field_options")
    .maybeSingle();

  if (!data?.value) return DEFAULT_FIELD_OPTIONS;

  const value = data.value as Partial<FieldOptions>;
  return {
    countries: value.countries ?? DEFAULT_FIELD_OPTIONS.countries,
    proposal_count_ranges:
      value.proposal_count_ranges ?? DEFAULT_FIELD_OPTIONS.proposal_count_ranges,
  };
}

export async function updateFieldOptions(options: FieldOptions) {
  const { error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { error } = await supabase.from("app_settings").upsert({
    key: "field_options",
    value: options,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function createSource(name: string, color: string) {
  const { error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { error } = await supabase.from("sources").insert({ name, color });

  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/bids/new");
  return { success: true };
}

export async function updateSource(
  id: string,
  updates: { name?: string; color?: string }
) {
  const { error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { error } = await supabase.from("sources").update(updates).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/bids/new");
  return { success: true };
}

export async function deleteSource(id: string) {
  const { error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { error } = await supabase.from("sources").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/bids/new");
  return { success: true };
}
