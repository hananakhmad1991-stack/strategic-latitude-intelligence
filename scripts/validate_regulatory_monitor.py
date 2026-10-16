#!/usr/bin/env python3
"""Regulatory candidate snapshot validation: forbid fictional confirmed legal changes."""
import json
from datetime import datetime
from pathlib import Path

root=Path(__file__).resolve().parents[1]
j=json.loads((root/'data/regulatory-monitor.json').read_text(encoding='utf-8'))
config=json.loads((root/'data/regulatory-monitor-sources.json').read_text(encoding='utf-8'))
graph=json.loads((root/'data/sli-policy-regulatory-graph-2026.json').read_text(encoding='utf-8'))
assert j['schema_version']=='1.0'
assert j['monitoring_status'] in ('awaiting_first_run','sources_available','all_listing_sources_unavailable')
assert len(j['sources'])==len(config['listing_sources'])
assert len({x['id'] for x in j['sources']})==len(j['sources'])
assert all(x['health'] in ('ok','error','pending') for x in j['sources'])
assert j['legal_status_update_policy']
node_ids={x['id'] for x in graph['nodes']}
assert set(j['watched_law_records']).issubset(node_ids)
assert len({x['id'] for x in j['events']})==len(j['events'])
assert len(j['events'])<=config['item_retention']
for e in j['events']:
 assert e.get('url','').startswith('https://')
 assert e['classification'] in ('unverified_primary_document_candidate','unverified_document_update')
 assert e['legal_status_update']=='NOT_AUTOMATICALLY_VERIFIED'
 assert e['event_kind'] in ('new_candidate','baseline_observation')
 assert e.get('review_state')=='pending_source_text_and_legal_review'
 assert e['source_id'] in {x['id'] for x in j['sources']} or e['source_id'].startswith('law_detail_')
for x in j['watched_law_records'].values():
 assert x['health'] in ('ok','error')
 assert x.get('latest_candidate_review') in ('no_new_change_detected','source_unavailable','source_page_metadata_changed_review_required')
if j['checked_at_utc']:
 datetime.fromisoformat(j['checked_at_utc'].replace('Z','+00:00'))
print('REGULATORY_MONITOR_VALID',len(j['sources']),'sources',len(j['events']),'candidates/observations')
