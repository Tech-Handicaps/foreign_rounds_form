"""Generate batched INSERT SQL for US golf courses from OpenGolfAPI CSV."""
import gzip
import csv
import os
from pathlib import Path

CSV = os.environ.get("OPENGOLF_CSV", os.path.join(os.environ.get("TEMP", "/tmp"), "opengolf-us.csv.gz"))
OUT = Path(__file__).resolve().parent.parent / "supabase" / "batches"
COUNTRY = "United States"
BATCH = 400


def esc(s: str) -> str:
    return s.replace("'", "''")


def main():
    names = set()
    with gzip.open(CSV, "rt", encoding="utf-8", errors="replace") as f:
        for row in csv.DictReader(f):
            n = (row.get("name") or "").strip()
            if n:
                names.add(n)

    names = sorted(names)
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("us-*.sql"):
        old.unlink()

    files = []
    for i in range(0, len(names), BATCH):
        chunk = names[i : i + BATCH]
        values = ",\n".join(f"  ('{COUNTRY}', '{esc(n)}')" for n in chunk)
        sql = (
            "insert into public.golf_courses (country, name) values\n"
            f"{values}\n"
            "on conflict (country, name) do nothing;"
        )
        path = OUT / f"us-{i // BATCH:04d}.sql"
        path.write_text(sql, encoding="utf-8")
        files.append(path)

    print(f"Unique courses: {len(names)}")
    print(f"Batches: {len(files)}")
    print(f"Output: {OUT}")


if __name__ == "__main__":
    main()
