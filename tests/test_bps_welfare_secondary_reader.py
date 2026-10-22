"""Synthetic-only quality controls for PDF extraction reconciliation."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("secondary",ROOT/"scripts/audit_bps_welfare_secondary_reader.py")
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class ReconciliationTests(unittest.TestCase):
    def test_identical_rows(self):
        self.assertEqual(m.classify(["99,78","0,18","82,08¹","100,00"],["99,78","0,18","82,08¹","100,00"]),("exact_full_row",0))

    def test_footnote_stripping_is_not_numeric_mismatch(self):
        self.assertEqual(m.classify(["82,08¹","0,18","NA"],["82,08","0,18","–"]),("numeric_agree_non_numeric_difference",0))

    def test_secondary_reader_omission_is_not_numeric_substitution(self):
        self.assertEqual(m.classify(["99,78","0,18","82,08¹","100,00"],["99,78","0,18","100,00"]),("secondary_omits_numeric_tokens",1))

    def test_repeated_numeric_values_are_not_false_positive(self):
        self.assertEqual(m.classify(["1,00","1,00","2,00","2,00"],["1,00","2,00"]),("secondary_omits_numeric_tokens",2))

    def test_extra_secondary_source_values_remain_separate(self):
        self.assertEqual(m.classify(["1,00","3,00"],["1,00","2,00","3,00"]),("secondary_extra_numeric_tokens",1))

    def test_actual_numeric_value_substitution_is_not_auto_reconciled(self):
        self.assertEqual(m.classify(["1,00","3,00"],["1,00","4,00"]),("non_subsequence_numeric_conflict",0))

    def test_full_run_opt_in_is_explicit_and_default_is_31_panel_sample(self):
        import inspect
        self.assertEqual(inspect.signature(m.run).parameters["all_panels"].default,False)

    def test_negative_CI_and_approximate_zero_are_preserved(self):
        self.assertEqual(m.classify(["~0","-0,01","0,30"],["~0","-0,01","0,30"]),("exact_full_row",0))
        self.assertEqual(m.classify(["~0","-0,01"],["-0,01"]),("secondary_omits_numeric_tokens",1))

if __name__=="__main__":
    unittest.main()
