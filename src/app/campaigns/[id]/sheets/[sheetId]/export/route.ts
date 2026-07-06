import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; sheetId: string }> },
) {
  const { sheetId } = await params;
  const supabase = await createClient();

  const { data: sheet } = await supabase
    .from("sheets")
    .select("id, name, type, campaigns(game)")
    .eq("id", sheetId)
    .maybeSingle();

  if (!sheet || sheet.type !== "character") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: values } = await supabase
    .from("sheet_field_values")
    .select("value, visible_on_card, game_fields(key)")
    .eq("sheet_id", sheetId);

  const fields = (values ?? [])
    .filter((v) => v.game_fields?.key)
    .map((v) => ({
      key: v.game_fields!.key,
      value: v.value,
      visibleOnCard: v.visible_on_card,
    }));

  const payload = {
    name: sheet.name,
    game: sheet.campaigns?.game ?? null,
    fields,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${sheet.name.replace(/[^a-z0-9-_]+/gi, "_")}.json"`,
    },
  });
}
