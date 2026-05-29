import { NextResponse } from "next/server";
import { foreignRoundSchema } from "@/lib/foreignRoundSchema";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = foreignRoundSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const payload = parsed.data;
    const submittedAt = new Date().toISOString();

    const { error } = await supabase.from("foreign_round_submissions").insert({
      player_id: payload.playerId,
      full_name: payload.fullName,
      email: payload.email || null,
      date_played: payload.datePlayed,
      country: payload.country,
      course_name: payload.courseName,
      course_rating: payload.courseRating,
      slope_rating: payload.slopeRating,
      par: payload.par,
      gross_score: payload.grossScore,
      submitted_at: submittedAt,
      source: "public_form",
    });

    if (error) {
      return NextResponse.json(
        { error: "Database insert failed", detail: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: "Request failed", detail: msg }, { status: 500 });
  }
}

