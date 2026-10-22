import pathlib, sqlite3, unittest
root=pathlib.Path(__file__).resolve().parents[1]
script=(root/'migrations'/'0001_requests.sql').read_text(encoding='utf8')
class PrivateResearchSchemaTest(unittest.TestCase):
 def setUp(self):
  self.db=sqlite3.connect(':memory:')
  self.db.executescript(script)
  self.db.executescript((root/'migrations'/'0002_consent_based_experts.sql').read_text(encoding='utf8'))
 def tearDown(self):
  self.db.close()
 def test_tables_indexes_and_bound_owner_metadata(self):
  names={x[0] for x in self.db.execute("SELECT name FROM sqlite_master")}
  for item in ['research_requests','research_request_history','idx_research_requests_status_time','idx_research_history_request','consented_experts','request_expert_shortlist','idx_expert_sector']:
   self.assertIn(item,names)
  self.assertEqual(self.db.execute('PRAGMA foreign_keys').fetchone()[0],1)
 def test_reject_invalid_sectors_status_and_cascade(self):
  valid=('ref-one','expert_sourcing','energy','Check regulatory and industry risks','Experienced expert',None,None,'call','flexible','not_provided','new',1,'owner_manual','2026-10-22','2026-10-22')
  stmt='INSERT INTO research_requests VALUES ('+','.join(['?']*15)+')'
  self.db.execute(stmt,valid)
  self.db.execute('INSERT INTO research_request_history(request_id,to_status,owner_hash,changed_at) VALUES(?,?,?,?)',('ref-one','new','a'*64,'2026-10-22'))
  with self.assertRaises(sqlite3.IntegrityError):
   self.db.execute(stmt,('bad','expert_sourcing','impossible',*valid[3:]))
  with self.assertRaises(sqlite3.IntegrityError):
   self.db.execute('UPDATE research_requests SET status=? WHERE id=?',('invented','ref-one'))
  self.db.execute('DELETE FROM research_requests WHERE id=?',('ref-one',))
  self.assertEqual(self.db.execute('SELECT count(*) FROM research_request_history').fetchone()[0],0)
 def test_consent_based_registry_and_shortlist_privacy(self):
  request=('r-one','expert_sourcing','energy','Map fuel security and project risks','Qualified sector specialist',None,None,'call','flexible','not_provided','new',1,'owner_manual','2026-10-22','2026-10-22')
  self.db.execute('INSERT INTO research_requests VALUES ('+','.join(['?']*15)+')',request)
  expert=('e-one','Example Opt-in Expert','energy','Energy market regulation','Sector expert experience verified','expert@example.org',None,'internal_matching','2026-01-01','Signed agreement on file','2026-10-22')
  self.db.execute('INSERT INTO consented_experts VALUES ('+','.join(['?']*11)+')',expert)
  with self.assertRaises(sqlite3.IntegrityError):
   self.db.execute('INSERT INTO consented_experts VALUES ('+','.join(['?']*11)+')',('e-two',*expert[1:7],'unapproved',*expert[8:]))
  self.db.execute('INSERT INTO request_expert_shortlist VALUES (?,?,?,?,?,?)',('short-one','r-one','e-one','Subject expertise','a'*64,'2026-10-22'))
  with self.assertRaises(sqlite3.IntegrityError):
   self.db.execute('INSERT INTO request_expert_shortlist VALUES (?,?,?,?,?,?)',('short-two','wrong-request','e-one','Subject expertise','a'*64,'2026-10-22'))
  self.db.execute('DELETE FROM consented_experts WHERE id=?',('e-one',))
  self.assertEqual(self.db.execute('SELECT count(*) FROM request_expert_shortlist').fetchone()[0],0)

if __name__=='__main__':unittest.main()
