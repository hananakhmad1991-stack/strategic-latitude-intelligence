"""Synthetic fixture exercises authorized official XLSX conversion without private data."""
import csv,pathlib,subprocess,sys,tempfile,unittest
try:
 from openpyxl import Workbook
except ModuleNotFoundError:
 Workbook=None
ROOT=pathlib.Path(__file__).resolve().parents[1]
SCRIPT=ROOT/"scripts/convert_kkp_hatchery_xlsx_to_csv.py"
HEADER=["Tahun","Provinsi","Kab/Kota","Kelompok Ikan","Volume (Ribu Ekor)","Nilai (Rp. Juta)","Harga Rata-Rata Tertimbang (Rp/ribu ekor)"]
@unittest.skipIf(Workbook is None,"openpyxl only installed in dedicated official source-gate job")
class TestKKPSourceXLSXConversion(unittest.TestCase):
 def generate(self,path,n):
  wb=Workbook()
  sh=wb.active
  sh.append(["KKP source export — synthetic test fixture, NOT public original data"])
  sh.append(HEADER)
  for i in range(n):sh.append([2024,"Jawa Timur",f"Synthetic District {i}","Lele",13980000+i,1398.25,100])
  wb.save(path)
 def test_valid_exact_1387_rows(self):
  with tempfile.TemporaryDirectory() as d:
   base=pathlib.Path(d);source=base/"KKP-source.xlsx";out=base/"normal.csv"
   self.generate(source,1387)
   p=subprocess.run([sys.executable,str(SCRIPT),str(source),str(out)],capture_output=True,text=True)
   self.assertEqual(p.returncode,0,p.stderr)
   with out.open(encoding="utf8",newline="") as f:rows=list(csv.DictReader(f))
   self.assertEqual(len(rows),1387)
   self.assertEqual(rows[0]["Volume (Ribu Ekor)"],"13980000")
   self.assertEqual(rows[0]["Nilai (Rp. Juta)"],"1398,25")
 def test_non_1387_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   base=pathlib.Path(d);source=base/"bad.xlsx";out=base/"normal.csv"
   self.generate(source,1386)
   p=subprocess.run([sys.executable,str(SCRIPT),str(source),str(out)],capture_output=True,text=True)
   self.assertNotEqual(p.returncode,0)
   self.assertIn("1387",p.stderr)
   self.assertFalse(out.exists())
if __name__=="__main__":unittest.main()
