import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { MasterCandidate } from "@/components/adventures/adventure-form";

export async function getMasterCandidates(
  supabase: SupabaseClient<Database>,
  campaignId: string,
): Promise<MasterCandidate[]> {
  const { data: masterSheets } = await supabase
    .from("sheets")
    .select("owner_id")
    .eq("campaign_id", campaignId)
    .eq("type", "master");

  const ownerIds = Array.from(new Set((masterSheets ?? []).map((s) => s.owner_id)));
  if (ownerIds.length === 0) {
    return [];
  }

  const { data: members } = await supabase.rpc("get_campaign_members", {
    p_campaign_id: campaignId,
  });
  const nameByUserId = new Map((members ?? []).map((m) => [m.user_id, m.display_name]));

  return ownerIds.map((userId) => ({
    userId,
    displayName: nameByUserId.get(userId) ?? userId,
  }));
}
