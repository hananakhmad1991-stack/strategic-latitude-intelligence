#!/usr/bin/env python3
"""Compare a proposed snapshot with the approved baseline; generate review-only before/after ledger."""
import argparse,datetime,json,pathlib,sys
p=argparse.ArgumentParser()
p.add_argument('--candidate',required=True)
p.add_argument('--output',default='artifacts/ai_candidate_changes.json')
a=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
baseline=json.loads((root/'data/ai-intelligence.json').read_text())
candidate=json.loads(pathlib.Path(a.candidate).read_text())
before={x['id']:x for x in baseline['projects']};after={x['id']:x for x in candidate['projects']}
fields=('status','mw','mw_kind','investment_usd_bn','investment_kind')
changes=[]
for key,project in after.items():
 old=before.get(key)
 if old is None:
  changes.append({'project_id':key,'type':'new_project','before':None,'after':project,'review':'requires_source_confirmation'})
  continue
 for field in fields:
  if old.get(field)!=project.get(field):
   changes.append({'project_id':key,'date_detected_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
                   'field':field,'before':old.get(field),'after':project.get(field),
                   'new_source':project.get('source'),'source_as_of':project.get('date'),
                   'review':'pending_manual_verification','auto_publish':False})
for key in before.keys()-after.keys():
 changes.append({'project_id':key,'type':'removed_from_candidate','before':before[key],'after':None,'review':'requires_source_confirmation'})
out=root/a.output;out.parent.mkdir(exist_ok=True,parents=True)
out.write_text(json.dumps({'baseline_updated_at':baseline['updated_at'],'candidate_updated_at':candidate.get('updated_at'),
                            'change_count':len(changes),'changes':changes},indent=2)+'\n')
print('Detected',len(changes),'review-only changes; NO dataset or published milestones were updated')
