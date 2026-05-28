import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://conversa-app-blush.vercel.app";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${appUrl}/speakeasies`);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("repeat_requests")
    .update({ accepted: true })
    .eq("token", token)
    .select("speakeasy_id")
    .single();

  if (error || !data) {
    return NextResponse.redirect(`${appUrl}/speakeasies`);
  }

  return NextResponse.redirect(`${appUrl}/speakeasies/${data.speakeasy_id}?repito=1`);
}
