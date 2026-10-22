"""Private BPS source-text closure audit regression tests using synthetic data only."""
import importlib.util
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("bps_closure",ROOT/"scripts/audit_bps_welfare_demography_closure.py")
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

def synthetic_rows():
    rows=[]
    for tab,width in m.WIDTHS.items():
        for i in range(39):
            group=[20.0]*(width-1)
            group[-1]=100.0-20.0*(width-2)
            group.append(100.0)
            rows.append({"table_id":tab,"province":f"Test Province {i}","raw_columns":group,
                         "pdf_page":57})
    return rows

class PercentClosureQA(unittest.TestCase):
    def test_19_selected_tables_with_39_unique_geographies(self):
        results=m.audit(synthetic_rows())
        self.assertEqual(len(results),19)
        self.assertEqual(sum(x["groups"] for x in results.values()),741)
        self.assertTrue(all(x["closure_outliers"]==0 for x in results.values()))
        self.assertTrue(all(x["complete_groups"]==39 for x in results.values()))

    def test_missing_is_not_imputed_as_zero_or_calculated_residual(self):
        rows=synthetic_rows()
        row=next(r for r in rows if r["table_id"]=="2.13")
        row["raw_columns"]=[98.0,2.0,None,100.0]
        result=m.audit(rows)["2.13"]
        self.assertEqual(result["incomplete_categories"],1)
        self.assertEqual(result["complete_groups"],38)
        self.assertEqual(result["closure_outliers"],0)

    def test_missing_total_is_not_approximated(self):
        rows=synthetic_rows()
        row=next(r for r in rows if r["table_id"]=="2.1")
        row["raw_columns"][-1]=None
        r=m.audit(rows)["2.1"]
        self.assertEqual(r["missing_total"],1)
        self.assertEqual(r["complete_groups"],38)

    def test_actual_inconsistency_is_detected(self):
        rows=synthetic_rows()
        row=next(r for r in rows if r["table_id"]=="2.1")
        row["raw_columns"][0]=1.0
        self.assertEqual(m.audit(rows)["2.1"]["closure_outliers"],1)

    def test_wrong_region_count_rejected(self):
        rows=synthetic_rows()
        rows.pop()
        with self.assertRaisesRegex(ValueError,"39 unique regions"):
            m.audit(rows)

    def test_non_exhaustive_table_not_a_closure_target(self):
        self.assertNotIn("2.17",m.WIDTHS)

if __name__=="__main__":
    unittest.main()
