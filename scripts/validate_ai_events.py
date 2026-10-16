#!/usr/bin/env python3
"""Validate historical changes against unified baseline; no invented before/after events."""
import json,pathlib,datetime
root=pathlib.Path(__file__).resolve().parents[1]
base=json.loads((root/'data/ai-intelligence.json').read_text())
events=json.loads((root/'data/ai-investment-events.json').read_text())
risk=json.loads((root/'data/ai-risk-evidence.json').read_text())
projects={x['id']:x for x in base['projects']}
assert len(projects)==len(base['projects'])
permitted={'status','mw','investment_usd_bn'}
for e in events['events']:
 assert e['project_id'] in projects
 datetime.date.fromisoformat(e['date'])
 assert e['source'].startswith('https://')
 if 'change' in e:
  c=e['change']
  assert c['field'] in permitted
  assert 'before' in c and 'after' in c and c['before']!=c['after']
  assert e.get('review')=='verified_source_change'
for key,w in risk['weights'].items():assert 0<w<=100
assert sum(risk['weights'].values())==100
for a in risk['assessments']:
 assert a['id'] in projects
 assert set(a['evidence'])==set(risk['weights'])
 assert all(v in ('unverified','documented','explicit_concern') for v in a['evidence'].values())
print('PASS: project/event/risk schema, references, before-after guards, weights')
