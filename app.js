(function () {
  const SUPABASE_URL = "https://wtjyecbiczpqgnnyhrdr.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_dU4_qHkwTydzdkXfsAFNAg_Wq7BMGEb";

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase CDN is not loaded.");
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function saveEntry(amount, description) {
    const { data, error } = await supabase
      .from("money_entries")
      .insert([{ amount, description }]);

    if (error) {
      console.error(error);
    }

    return data;
  }

  async function loadEntries() {
    const { data, error } = await supabase
      .from("money_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    return data;
  }

  window.AppSupabase = {
    supabase,
    saveEntry,
    loadEntries,
  };
})();
