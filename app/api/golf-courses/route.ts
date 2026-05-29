import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const country = new URL(req.url).searchParams.get("country")?.trim();

  if (!country || country.length < 2) {
    return NextResponse.json({ courses: [] });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("golf_courses")
      .select("name")
      .eq("country", country)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message, courses: [] }, { status: 500 });
    }

    const courses = (data ?? []).map((row) => row.name as string);
    return NextResponse.json({ courses });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg, courses: [] }, { status: 500 });
  }
}
