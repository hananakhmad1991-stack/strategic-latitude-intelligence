#!/usr/bin/env python3
"""Verify real SLI Chromium PDF exports and Word-to-PDF layout using LibreOffice.
Only synthetic, source-bounded local QA fixtures; not live answer certification.
"""
from __future__ import annotations
import json,re,subprocess,xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

root=Path("artifacts/sli-owner-rendered-reports")
cases=("pasal99","pasal1","long")
def run(*args):
    return subprocess.run(args,text=True,check=True,capture_output=True).stdout
def pdf_check(file,kind):
    assert file.is_file() and file.stat().st_size>1500, f"missing PDF: {file}"
    info=run("pdfinfo",str(file))
    pages=int(re.search(r"^Pages:\s*(\d+)",info,re.M).group(1))
    dim=re.search(r"^Page size:\s*([\d.]+) x ([\d.]+) pts",info,re.M)
    assert dim,f"PDF has unknown page geometry: {file}"
    w,h=map(float,dim.groups())
    assert abs(w-595.28)<2 and abs(h-841.89)<2, f"Expected A4, got {w}x{h}: {file}"
    text=run("pdftotext","-layout",str(file),"-")
    assert "DRAF BERBANTUAN AI" in text, f"Missing draft warning: {file}"
    assert "Sumber dan Referensi" in text, f"Missing bibliography: {file}"
    if kind=="pasal99":
        assert "Pasal 99" in text and "7/2021" in text, f"Missing article: {file}"
        assert "struktur" in text.lower() and "pasal utama" in text.lower()
    elif kind=="pasal1":
        assert "Pasal 1" in text and "16/2016" in text and "Paris" in text
    else:
        assert pages>=3,f"Long PDF failed multipage test: {file} pages={pages}"
        flat=" ".join(text.split())
        assert "BATAS AKHIR LAPORAN TERLIHAT 20261022" in flat, f"Report truncated before final sentence: {file}"
        assert "Row-25" in text, "Long table was truncated"
    print("PASS",file.name,"pages",pages,"A4",f"{w:.0f}x{h:.0f}pt")
    return {"name":file.name,"pages":pages,"size_pts":[w,h]}
def docx_check(file,kind):
    assert file.is_file() and file.stat().st_size>3000
    with ZipFile(file) as z:
        assert z.testzip() is None, f"ZIP CRC mismatch: {file}"
        names=set(z.namelist())
        expected={"[Content_Types].xml","_rels/.rels","word/document.xml","word/styles.xml",
                  "word/header1.xml","word/footer1.xml","word/_rels/document.xml.rels"}
        assert expected.issubset(names), f"Missing Word OOXML parts: {file}"
        for name in expected:
            ET.fromstring(z.read(name))
        xml=z.read("word/document.xml").decode("utf8")
        assert "DRAF BERBANTUAN AI" in xml
        assert "Sumber dan Referensi" in xml
        if kind=="long":assert "BATAS AKHIR LAPORAN TERLIHAT 20261022" in xml
        if kind=="pasal99":assert "pasal utama" in xml
    print("PASS",file.name,"OOXML XML + CRC + warnings")
    return True
pdf_results=[]
for kind in cases:
    pdf_results.append(pdf_check(root/(kind+".pdf"),kind))
    docx_check(root/(kind+".docx"),kind)

# Real DOCX import and page layout through office renderer. Do not silently skip.
word_pdfs=root/"word-rendered-pdf"
word_pdfs.mkdir(exist_ok=True)
for kind in cases:
    src=root/(kind+".docx")
    out=run("libreoffice","-env:UserInstallation=file:///tmp/sli-report-owner-lo-qa",
      "--headless","--convert-to","pdf","--outdir",str(word_pdfs),str(src))
    assert (word_pdfs/(kind+".pdf")).exists(), f"LibreOffice did not render {src}: {out}"
    pdf_results.append(pdf_check(word_pdfs/(kind+".pdf"),kind))

# Screenshots of first + last page of browser PDF, and first page of Word-rendered PDF.
png_dir=root/"rendered-pages"
png_dir.mkdir(exist_ok=True)
for kind in cases:
    for folder,prefix in ((root,"chrome"),(word_pdfs,"word")):
        pdf=folder/(kind+".pdf")
        pages=int(re.search(r"^Pages:\s*(\d+)",run("pdfinfo",str(pdf)),re.M).group(1))
        selected={1,pages} if prefix=="chrome" else {1}
        for n in sorted(selected):
            dest=png_dir/f"{kind}-{prefix}-page{n}"
            run("pdftoppm","-f",str(n),"-l",str(n),"-singlefile","-scale-to","1200","-png",str(pdf),str(dest))
            assert Path(str(dest)+".png").exists()
(root/"rendered-validation.json").write_text(json.dumps({
  "schema":"sli-owner-rendered-validation-v1",
  "tests":"Chrome A4 PDF + LibreOffice Word layout + ZIP CRC/XML + text-presence + final-page sentinel",
  "result":"PASS","results":pdf_results,
  "limitations":["Synthetic legal/presentation fixtures, not a user's live model response",
    "Visual PNG artifacts require human layout review", "Current consolidated legal validity not certified"]
},ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("ALL RENDERED EXPORT STRUCTURAL AND CONTENT CHECKS PASS")
