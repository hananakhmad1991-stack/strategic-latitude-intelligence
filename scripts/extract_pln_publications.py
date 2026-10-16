#!/usr/bin/env python3
"""PLN large-PDF fetch and verifiable page/table candidate extraction.
Produces GitHub artifact only, not unsupervised changes to public SLI metrics.
"""
import argparse,datetime as dt,hashlib,json,os,pathlib,re,time
import requests
import fitz
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts'/'pln_publication_extract'
OUT.mkdir(parents=True,exist_ok=True)
DOCS={
 'ruptl_2025_2034':[
 'https://www.pln.co.id/webapi/media/file/webkorp/asset/b967d-ruptl-pln-2025-2034-pub-.pdf'
 ],
 'pln_statistics_2025':[
 'https://www.pln.co.id/webapi/media/file/webkorp/asset/Statistik-2025-2907.pdf',
 'https://web.pln.co.id/statics/uploads/2026/03/Statistik-2025-16.3-c.pdf'
 ],
 'pln_statistics_2024':[
 'https://www.pln.co.id/webapi/media/file/webkorp/asset/Statistik2024.pdf'
 ]}
PATTERNS={
'jawa_barat':r'jawa\s+barat|west\s+java|bekasi|karawang|cikarang',
'jawa_tengah':r'jawa\s+tengah|central\s+java|batang|semarang',
'kepulauan_riau':r'kepulauan\s+riau|batam|bintan|tanjungpinang',
'gardu_induk':r'gardu\s+induk|substation|\bMVA\b',
'transmisi':r'transmisi|transmission|\bkms\b',
'beban_puncak':r'beban\s+puncak|peak\s+load',
'pembangkit':r'pembangkit|generation|\bPLT[ASUDGMB]\b',
'keandalan':r'SAIDI|SAIFI|gangguan|reliability'
}
def download(name, urls):
 path=OUT/(name+'.pdf');errors=[]
 for url in urls:
  for attempt in range(2):
   try:
    if path.exists():path.unlink()
    with requests.get(url,headers={'User-Agent':'Mozilla/5.0 SLI public statistics research','Accept':'application/pdf,*/*'},stream=True,timeout=(20,110),allow_redirects=True) as response:
     response.raise_for_status()
     h=hashlib.sha256(); size=0
     with path.open('wb') as fp:
      for chunk in response.iter_content(chunk_size=1<<20):
       if chunk:
        size+=len(chunk)
        if size>180_000_000:raise ValueError('PDF exceeds 180MB safety limit')
        fp.write(chunk);h.update(chunk)
    with path.open('rb') as fp:
     if fp.read(5)!=b'%PDF-':raise ValueError('response did not contain PDF header')
    return {'state':'downloaded','url':url,'bytes':size,'sha256':h.hexdigest(),'path':str(path)}
   except Exception as exc:
    errors.append({'url':url,'attempt':attempt+1,'error':str(exc)[:220]})
    if path.exists():path.unlink()
    time.sleep(3)
 return {'state':'download_failed','attempts':errors}
def extract(name,info):
 doc=fitz.open(info['path']);matches=[];all_pages=doc.page_count
 for i,page in enumerate(doc):
  txt=page.get_text(sort=True)
  plain=re.sub(r'\s+',' ',txt)
  categories=[label for label,pattern in PATTERNS.items() if re.search(pattern,plain,re.I)]
  if not categories:continue
  # Human-reviewed evidence snippets with page location; no automatic table claims.
  for label in categories:
   pattern=re.compile(PATTERNS[label],re.I)
   occurrences=list(pattern.finditer(plain))
   snippets=[plain[max(0,m.start()-180):min(len(plain),m.end()+350)] for m in occurrences[:3]]
   matches.append({'pdf_page':i+1,'category':label,'snippets':snippets,'page_has_extracted_text':len(txt)>30,
     'table_candidate':bool(re.search(r'\d[\d., ]+\s*(?:MW|MVA|kms|kV)',plain,re.I)),
     'status':'REQUIRES_HUMAN_VERIFICATION'})
 (OUT/(name+'_index.json')).write_text(json.dumps({'document':name,'pages':all_pages,'source':info['url'],'sha256':info['sha256'],'hits':matches},ensure_ascii=False,indent=2))
 info['pages']=all_pages; info['hit_count']=len(matches)
 doc.close()
def main():
 p=argparse.ArgumentParser();p.add_argument('--docs',nargs='*',choices=DOCS.keys(),default=list(DOCS));a=p.parse_args()
 audit={'generated_utc':dt.datetime.now(dt.timezone.utc).isoformat(),'policy':'PDF indexing only. No unverified MW or MVA are published in SLI. All page hits require manual validation.','documents':{}}
 for name in a.docs:
  print('Retrieving',name,flush=True)
  info=download(name,DOCS[name]);audit['documents'][name]=info
  if info['state']=='downloaded':
   try:extract(name,info)
   except Exception as e:info['extraction_error']=str(e)[:350]
   finally:pathlib.Path(info['path']).unlink(missing_ok=True)
  print(name,info['state'],info.get('pages'),flush=True)
 (OUT/'audit_manifest.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
 print(json.dumps({k:{'state':v['state'],'pages':v.get('pages'),'hit_count':v.get('hit_count')} for k,v in audit['documents'].items()},indent=2))
if __name__=='__main__':main()
