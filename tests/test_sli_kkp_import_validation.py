"""No fictional bulk KKP rows; test strict CSV header, formatting and scope gating."""
import io,pathlib,sys,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from import_kkp_hatchery_export import normalize,number,resolve,examine
class TestKKPImportReview(unittest.TestCase):
 def test_indonesian_source_numbers(self):
  self.assertEqual(number("13.980.000"),13980000)
  self.assertEqual(number("1.398"),1398)
  self.assertEqual(number("0,25"),0.25)
  with self.assertRaises(ValueError):number("1,234,567")
  with self.assertRaises(ValueError):number("")
 def test_headers_and_requires_1387_actual_rows(self):
  headers=["Tahun","Provinsi","Kab / Kota","Kelompok Ikan","Volume (Ribu Ekor)","Nilai (Rp. Juta)","Harga Rata-Rata Tertimbang (Rp/ribu ekor)"]
  col=resolve(headers);self.assertEqual(len(col),7)
  csv=",".join('"'+x+'"' for x in headers)+"\n"
  csv+='2024,JAWA TIMUR,KEDIRI,LELE,13.980.000,1.398,100\n'
  with self.assertRaisesRegex(ValueError,"Expected exactly 1387"):
   examine(io.StringIO(csv))
 def test_reject_missing_dimensional_headers(self):
  with self.assertRaises(ValueError):resolve(["Tahun","Provinsi","Kelompok Ikan"])
if __name__=="__main__":unittest.main()
