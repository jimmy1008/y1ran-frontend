// src/lib/journalApi.js
export async function listJournalEntries(supabase, { limit = 50 } = {}) {
  return supabase
    .from("journal_entries")
    .select("id,symbol,side,created_at,note,tags,entry_price,exit_price,pnl")
    .order("created_at", { ascending: false })
    .limit(limit);
}
