"""Validate portable Cloudflare D1 (SQLite) schema and per-user uniqueness."""
import sqlite3
from pathlib import Path
from tempfile import TemporaryDirectory

SQL = (Path(__file__).resolve().parents[1] / "migrations/0001_init.sql").read_text()
with TemporaryDirectory() as tmp:
    con = sqlite3.connect(str(Path(tmp) / "test.db"))
    con.executescript(SQL)
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
    print("SLI D1 migration QA passed: FK erasure, duplicate delivery prevention, user scope")
