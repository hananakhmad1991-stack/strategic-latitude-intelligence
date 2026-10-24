import unittest,sqlite3,pathlib,datetime
ROOT=pathlib.Path(__file__).resolve().parents[2]
def iso(days):
 return (datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=days)).isoformat(timespec='milliseconds').replace('+00:00','Z')
class MigrationTest(unittest.TestCase):
 def setUp(self):
  self.db=sqlite3.connect(':memory:')
  self.db.executescript((ROOT/'membership-api/migrations/0001_initial.sql').read_text())
  self.uid='83196df3-3f25-48df-b58c-1d1dd7b3f908'
  self.db.execute('INSERT INTO subscriptions(user_id,plan,status,access_until) VALUES(?,?,?,?)',(self.uid,'pro','active',iso(30)))
  self.db.executescript((ROOT/'membership-api/migrations/0002_sessions_billing.sql').read_text())
 def tearDown(self): self.db.close()
 def insert_session(self,key):
  now=iso(0)
  self.db.execute('INSERT INTO member_sessions(session_hash,user_id,created_at,last_seen_at,expires_at) VALUES(?,?,?,?,?)',(key,self.uid,now,now,iso(10)))
 def test_data_survives_and_new_plan_is_supported(self):
  self.assertEqual(self.db.execute('SELECT plan FROM subscriptions WHERE user_id=?',(self.uid,)).fetchone()[0],'pro')
  self.db.execute('UPDATE subscriptions SET plan=? WHERE user_id=?',('intelligence_pro',self.uid))
  self.assertEqual(self.db.execute('SELECT plan FROM subscriptions WHERE user_id=?',(self.uid,)).fetchone()[0],'intelligence_pro')
 def test_single_session_then_three_session_enforcement(self):
  self.insert_session('a'*64)
  with self.assertRaisesRegex(sqlite3.IntegrityError,'session_limit_reached'): self.insert_session('b'*64)
  self.db.execute('UPDATE subscriptions SET plan=? WHERE user_id=?',('intelligence_pro',self.uid))
  self.insert_session('b'*64);self.insert_session('c'*64)
  with self.assertRaisesRegex(sqlite3.IntegrityError,'session_limit_reached'): self.insert_session('d'*64)
 def test_expired_session_does_not_consume_limit(self):
  self.insert_session('a'*64)
  self.db.execute('UPDATE member_sessions SET expires_at=?',(iso(-1),))
  self.insert_session('b'*64)
 def test_canceled_plan_is_open_limit(self):
  self.db.execute("UPDATE subscriptions SET plan='intelligence_pro',status='canceled' WHERE user_id=?",(self.uid,))
  self.insert_session('a'*64)
  with self.assertRaisesRegex(sqlite3.IntegrityError,'session_limit_reached'): self.insert_session('b'*64)
 def test_event_idempotency_schema(self):
  self.db.execute("INSERT INTO billing_event_audit(provider,event_id,event_type,event_at) VALUES(?,?,?,?)",('test','evt_abcdefg','subscription.activated',iso(0)))
  with self.assertRaises(sqlite3.IntegrityError):
   self.db.execute("INSERT INTO billing_event_audit(provider,event_id,event_type,event_at) VALUES(?,?,?,?)",('test','evt_abcdefg','subscription.activated',iso(0)))
if __name__=='__main__':unittest.main()
