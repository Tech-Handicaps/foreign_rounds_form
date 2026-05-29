"use client";

import { useMemo, useState } from "react";

type FieldKey =
  | "playerId"
  | "fullName"
  | "email"
  | "datePlayed"
  | "country"
  | "courseName"
  | "courseRating"
  | "slopeRating"
  | "par"
  | "grossScore";

type FormState = Record<FieldKey, string>;

const initialState: FormState = {
  playerId: "",
  fullName: "",
  email: "",
  datePlayed: "",
  country: "",
  courseName: "",
  courseRating: "",
  slopeRating: "",
  par: "",
  grossScore: "",
};

function todayISO() {
  return new Date().toISOString().split("T")[0] ?? "";
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function Page() {
  const [values, setValues] = useState<FormState>(initialState);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<
    | { kind: "success" }
    | { kind: "error"; message: string }
    | null
  >(null);

  const errors = useMemo(() => {
    const e: Partial<Record<FieldKey, string>> = {};

    if (values.playerId.trim().length === 0) e.playerId = "Please enter your HNA Player ID.";
    if (values.fullName.trim().length < 2) e.fullName = "Please enter your full name.";
    if (values.email.trim() !== "" && !isEmail(values.email.trim()))
      e.email = "Please enter a valid email address.";
    if (values.datePlayed.trim() === "") e.datePlayed = "Please select the date you played.";
    if (values.country.trim().length < 2) e.country = "Please enter the country where you played.";
    if (values.courseName.trim().length < 2) e.courseName = "Please enter the course name.";

    const cr = Number(values.courseRating);
    if (!Number.isFinite(cr) || cr < 50 || cr > 90) e.courseRating = "Enter a rating between 50 and 90.";

    const sr = Number(values.slopeRating);
    if (!Number.isInteger(sr) || sr < 55 || sr > 155) e.slopeRating = "Slope must be between 55 and 155.";

    const par = Number(values.par);
    if (!Number.isInteger(par) || par < 60 || par > 80) e.par = "Par must be between 60 and 80.";

    const gs = Number(values.grossScore);
    if (!Number.isInteger(gs) || gs < 40 || gs > 200) e.grossScore = "Please enter your gross score (40–200).";

    return e;
  }, [values]);

  const diff = useMemo(() => {
    const cr = Number(values.courseRating);
    const sr = Number(values.slopeRating);
    const gs = Number(values.grossScore);
    if (!Number.isFinite(cr) || !Number.isFinite(sr) || !Number.isFinite(gs) || sr <= 0) return null;
    if (!Number.isInteger(sr) || !Number.isInteger(gs)) return null;
    return (((gs - cr) * 113) / sr).toFixed(1);
  }, [values.courseRating, values.slopeRating, values.grossScore]);

  function setField<K extends FieldKey>(key: K, value: string) {
    setValues((s) => ({ ...s, [key]: value }));
  }

  function markTouched(key: FieldKey) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const allKeys = Object.keys(initialState) as FieldKey[];
    setTouched(Object.fromEntries(allKeys.map((k) => [k, true])));

    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/foreign-round", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...values,
          courseRating: values.courseRating,
          slopeRating: values.slopeRating,
          par: values.par,
          grossScore: values.grossScore,
        }),
      });

      const data = (await res.json()) as unknown;
      if (!res.ok) {
        const message =
          typeof data === "object" && data && "detail" in data
            ? String((data as any).detail)
            : "Please check your connection and try again.";
        throw new Error(message);
      }

      setFeedback({ kind: "success" });
      setValues(initialState);
      setTouched({});
    } catch (err) {
      setFeedback({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Please check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const maxDate = todayISO();

  return (
    <>
      <header>
        <img
          className="logoMark"
          src="https://static.za.prod.dotgolf.co.za/clubs/1019/uploads/uploads/3%20hna%20png.png"
          alt="Handicaps Network Africa"
        />
        <div>
          <h1>Foreign Round Entry</h1>
          <p>Handicaps Network Africa</p>
        </div>
      </header>

      <div className="container">
        <div className="infoBanner">
          <strong>Played abroad?</strong> Use this form to submit a round played at a course outside South
          Africa. HNA will review your submission and apply the score to your handicap record. All fields
          are required. Find course details on the club&apos;s scorecard or website.
        </div>

        {feedback?.kind === "success" ? (
          <div className={`feedback ${"feedbackSuccess"}`}>
            <strong>Round submitted successfully!</strong>
            Your foreign round has been received. HNA will review and apply it to your handicap record
            within 24 hours. You may close this page.
          </div>
        ) : null}

        {feedback?.kind === "error" ? (
          <div className={`feedback ${"feedbackError"}`}>
            <strong>Submission failed.</strong>
            <span>
              {feedback.message || (
                <>
                  Please check your connection and try again. If the problem persists, email us at{" "}
                  <a href="mailto:support@handicaps.co.za">support@handicaps.co.za</a>.
                </>
              )}
            </span>
          </div>
        ) : null}

        <form onSubmit={onSubmit} noValidate>
          <div className="card">
            <div className="cardTitle">Your Details</div>

            <div className="field">
              <label htmlFor="playerId">
                HNA Player ID <span className="required">*</span>
                <span className="hint">Your unique ID shown on the HNA website or app</span>
              </label>
              <input
                type="text"
                id="playerId"
                name="playerId"
                placeholder="e.g. 12345678"
                autoComplete="off"
                value={values.playerId}
                onChange={(e) => setField("playerId", e.target.value)}
                onBlur={() => markTouched("playerId")}
                className={touched.playerId && errors.playerId ? "invalid" : undefined}
              />
              {touched.playerId && errors.playerId ? (
                <div className="fieldError">{errors.playerId}</div>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="fullName">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="e.g. John Smith"
                autoComplete="name"
                value={values.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
                onBlur={() => markTouched("fullName")}
                className={touched.fullName && errors.fullName ? "invalid" : undefined}
              />
              {touched.fullName && errors.fullName ? (
                <div className="fieldError">{errors.fullName}</div>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="email">
                Email Address
                <span className="hint">Optional — we&apos;ll send you a confirmation if provided</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={values.email}
                onChange={(e) => setField("email", e.target.value)}
                onBlur={() => markTouched("email")}
                className={touched.email && errors.email ? "invalid" : undefined}
              />
              {touched.email && errors.email ? <div className="fieldError">{errors.email}</div> : null}
            </div>
          </div>

          <div className="card">
            <div className="cardTitle">Round Details</div>

            <div className="field">
              <label htmlFor="datePlayed">
                Date Played <span className="required">*</span>
              </label>
              <input
                type="date"
                id="datePlayed"
                name="datePlayed"
                max={maxDate}
                value={values.datePlayed}
                onChange={(e) => setField("datePlayed", e.target.value)}
                onBlur={() => markTouched("datePlayed")}
                className={touched.datePlayed && errors.datePlayed ? "invalid" : undefined}
              />
              {touched.datePlayed && errors.datePlayed ? (
                <div className="fieldError">{errors.datePlayed}</div>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="country">
                Country <span className="required">*</span>
              </label>
              <input
                type="text"
                id="country"
                name="country"
                placeholder="e.g. United Kingdom"
                autoComplete="country-name"
                value={values.country}
                onChange={(e) => setField("country", e.target.value)}
                onBlur={() => markTouched("country")}
                className={touched.country && errors.country ? "invalid" : undefined}
              />
              {touched.country && errors.country ? <div className="fieldError">{errors.country}</div> : null}
            </div>

            <div className="field">
              <label htmlFor="courseName">
                Course Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="courseName"
                name="courseName"
                placeholder="e.g. Royal Birkdale Golf Club"
                value={values.courseName}
                onChange={(e) => setField("courseName", e.target.value)}
                onBlur={() => markTouched("courseName")}
                className={touched.courseName && errors.courseName ? "invalid" : undefined}
              />
              {touched.courseName && errors.courseName ? (
                <div className="fieldError">{errors.courseName}</div>
              ) : null}
            </div>
          </div>

          <div className="card">
            <div className="cardTitle">Course Information</div>

            <div className="grid2">
              <div className="field">
                <label htmlFor="courseRating">
                  Course Rating <span className="required">*</span>
                  <span className="hint">From the scorecard (e.g. 72.4)</span>
                </label>
                <input
                  type="number"
                  id="courseRating"
                  name="courseRating"
                  placeholder="72.4"
                  min={50}
                  max={90}
                  step={0.1}
                  value={values.courseRating}
                  onChange={(e) => setField("courseRating", e.target.value)}
                  onBlur={() => markTouched("courseRating")}
                  className={touched.courseRating && errors.courseRating ? "invalid" : undefined}
                />
                {touched.courseRating && errors.courseRating ? (
                  <div className="fieldError">{errors.courseRating}</div>
                ) : null}
              </div>

              <div className="field">
                <label htmlFor="slopeRating">
                  Slope Rating <span className="required">*</span>
                  <span className="hint">From the scorecard (55–155)</span>
                </label>
                <input
                  type="number"
                  id="slopeRating"
                  name="slopeRating"
                  placeholder="113"
                  min={55}
                  max={155}
                  step={1}
                  value={values.slopeRating}
                  onChange={(e) => setField("slopeRating", e.target.value)}
                  onBlur={() => markTouched("slopeRating")}
                  className={touched.slopeRating && errors.slopeRating ? "invalid" : undefined}
                />
                {touched.slopeRating && errors.slopeRating ? (
                  <div className="fieldError">{errors.slopeRating}</div>
                ) : null}
              </div>

              <div className="field">
                <label htmlFor="par">
                  Par <span className="required">*</span>
                  <span className="hint">Course par (usually 70–73)</span>
                </label>
                <input
                  type="number"
                  id="par"
                  name="par"
                  placeholder="72"
                  min={60}
                  max={80}
                  step={1}
                  value={values.par}
                  onChange={(e) => setField("par", e.target.value)}
                  onBlur={() => markTouched("par")}
                  className={touched.par && errors.par ? "invalid" : undefined}
                />
                {touched.par && errors.par ? <div className="fieldError">{errors.par}</div> : null}
              </div>

              <div className="field">
                <label htmlFor="grossScore">
                  Gross Score <span className="required">*</span>
                  <span className="hint">Your total strokes for the round</span>
                </label>
                <input
                  type="number"
                  id="grossScore"
                  name="grossScore"
                  placeholder="82"
                  min={40}
                  max={200}
                  step={1}
                  value={values.grossScore}
                  onChange={(e) => setField("grossScore", e.target.value)}
                  onBlur={() => markTouched("grossScore")}
                  className={touched.grossScore && errors.grossScore ? "invalid" : undefined}
                />
                {touched.grossScore && errors.grossScore ? (
                  <div className="fieldError">{errors.grossScore}</div>
                ) : null}
              </div>
            </div>

            {diff ? (
              <div className="diffPreview" aria-live="polite">
                <div>
                  <div className="diffLabel">Estimated Score Differential</div>
                  <div className="diffValue">{diff}</div>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Calculated as (Gross − Course Rating) × 113 ÷ Slope.
                  <br />
                  HNA will confirm the final value after review.
                </div>
              </div>
            ) : null}
          </div>

          <button type="submit" className="submitBtn" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Foreign Round"}
          </button>
        </form>

        <footer>
          <p>
            Handicaps Network Africa —{" "}
            <a href="https://www.handicaps.co.za" target="_blank" rel="noreferrer">
              handicaps.co.za
            </a>
          </p>
          <p style={{ marginTop: 4 }}>
            Problems? Email <a href="mailto:support@handicaps.co.za">support@handicaps.co.za</a>
          </p>
        </footer>
      </div>
    </>
  );
}

