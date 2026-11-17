import "server-only";
import { fileStore } from "./file";
import { createSupabaseStore } from "./supabase";
import type { Store } from "./types";

let store: Store | null = null;

export function isUsingSupabase(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

export function getStore(): Store {
  if (store) return store;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  store = url && key ? createSupabaseStore(url, key) : fileStore;
  return store;
}
