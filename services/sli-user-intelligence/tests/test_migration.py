"""Validate portable Cloudflare D1 (SQLite) schema and per-user uniqueness."""
import json
import subprocess
import sqlite3
from pathlib import Path
from tempfile import TemporaryDirectory

SQL = (Path(__file__).resolve().parents[1] / "migrations/0001_init.sql").read_text()
with TemporaryDirectory() as tmp:
    con = sqlite3.connect(str(Path(tmp) / "test.db"))
    con.executescript(SQL)
    migration2=(Path(__file__).resolve().parents[1] / 'migrations/0002_catalyst_source_events.sql').read_text()
    con.executescript(migration2)
    con.execute("INSERT INTO user_profiles(user_id,preferences_json,created_at,updated_at) VALUES(?,?,?,?)",
                ("u1", '{"tickers":["ANTM"]}', "2026-10-20", "2026-10-20"))
    con.execute("INSERT INTO user_profiles(user_id,preferences_json,created_at,updated_at) VALUES(?,?,?,?)",
                ("u2", '{"tickers":["PGEO"]}', "2026-10-20", "2026-10-20"))
    values = ("id-1", "u1", "e1", "A sourced news report", "news", "direct", "https://publisher.example/report", "2026-10-20", "2026-10-20")
    con.execute("""INSERT INTO notification_inbox
      (id,user_id,event_id,title,event_kind,relevance,source_url,detected_at,created_at)
      VALUES (?,?,?,?,?,?,?,?,?)""", values)
    try:
        con.execute("""INSERT INTO notification_inbox
          (id,user_id,event_id,title,event_kind,relevance,source_url,detected_at,created_at)
          VALUES (?,?,?,?,?,?,?,?,?)""", ("id-2",) + values[1:])
        raise AssertionError("Duplicate event should be rejected within same user's inbox")
    except sqlite3.IntegrityError:
        pass
    count = con.execute("SELECT COUNT(*) FROM notification_inbox WHERE user_id='u2'").fetchone()[0]
    assert count == 0
    con.execute("DELETE FROM user_profiles WHERE user_id='u1'")
    assert con.execute("SELECT COUNT(*) FROM notification_inbox").fetchone()[0] == 0
    # Execute the real generated SQL against SQLite using the tracked public ledger.
    root=Path(__file__).resolve().parents[3]
    ledger=root/"data/sli-catalyst-history.json"
    outfile=Path(tmp)/"source-import.sql"
    subprocess.run(["node",str(Path(__file__).resolve().parents[1] /
      "scripts/build-d1-catalyst-import.mjs"),str(ledger),str(outfile)],
      check=True,cwd=root)
    generated=outfile.read_text()
    con.executescript(generated)
    expected=len(json.loads(ledger.read_text())["events"])
    assert con.execute("SELECT COUNT(*) FROM source_events").fetchone()[0] == expected
    checkpoint=json.loads(con.execute(
      "SELECT value FROM service_state WHERE key='catalyst_source_sync'").fetchone()[0])
    assert checkpoint["event_count"] == expected
    con.executescript(generated)
    assert con.execute("SELECT COUNT(*) FROM source_events").fetchone()[0] == expected
    print("SLI D1 migration QA passed: user isolation, public Catalyst SQL import, idempotence")

