// Utilities to read/write app-wide configuration stored in public.app_configs
// RLS requires authenticated role (users must be logged in)

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppConfigRow = Database["public"]["Tables"]["app_configs"]["Row"];

export interface AppConfigResult<T = any> {
  data: T;
  version: string;
  updatedAt: string;
}

// Read a config by key. Returns null if not found.
export async function getAppConfig<T = any>(key: string): Promise<AppConfigResult<T> | null> {
  const { data, error } = await supabase
    .from("app_configs")
    .select("data, version, updated_at")
    .eq("key", key)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    data: (data as AppConfigRow).data as T,
    version: (data as AppConfigRow).version,
    updatedAt: (data as AppConfigRow).updated_at,
  };
}

// Upsert a config by key. Requires authenticated user due to RLS.
export async function upsertAppConfig<T = any>(key: string, value: T, version = "v1"): Promise<void> {
  const { error } = await supabase.from("app_configs").upsert({ key, data: value as any, version });
  if (error) throw error;
}
