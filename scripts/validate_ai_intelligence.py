#!/usr/bin/env python3
"""Audits sourced AI investment data without updating research claims automatically."""
import datetime as dt
import json
import pathlib
import urllib.request
from urllib.parse import urlparse
ROOT=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'data/ai-intelligence.json').read_text())
assert data['schema_version']=='1.0.0'
ids=[p['id'] for p in data['projects']]
assert len(ids)==len(set(ids)), 'duplicate project IDs'
assert len(data['projects'])>=1
results=[]
for p in data['projects']:
    assert p['source'].startswith('https://')
    assert p['status'] in {'under_construction','planning_power','planning_financing','operational_cloud','announced'}
    assert (p['lat'] is None)==(p['lon'] is None),'partial coordinates'
    if p['lat'] is not None:
        assert -12<=p['lat']<=7 and 94<=p['lon']<=142,'coordinates outside Indonesia'
        assert 'verified' not in p['precision'].lower() or p['source']
    url=p['source']
    status='unchecked'
    detail=''
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'SLI-Research-SourceAudit/1.0'})
        with urllib.request.urlopen(req,timeout=9) as response:
            status='accessible' if response.status<400 else 'http_error'
            detail=str(response.status)
    except Exception as exc:
        status='needs_manual_review'
        detail=str(exc)[:150]
    results.append({'project_id':p['id'],'source':url,'source_availability':status,'detail':detail,
                    'status_change': 'NOT_ASSESSED','research_status_unchanged': True})
report={'checked_at_utc':dt.datetime.now(dt.timezone.utc).isoformat(),
        'dataset_updated_at':data['updated_at'],'project_count':len(ids),
        'warning':'URL accessibility is not evidence of a new milestone. Site/project statuses are not auto-changed.',
        'checks':results}
out=ROOT/'artifacts/ai_source_audit.json'
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'project_count':len(ids),'accessible':sum(r['source_availability']=='accessible' for r in results),
                  'manual_review':sum(r['source_availability']=='needs_manual_review' for r in results)},indent=2))
