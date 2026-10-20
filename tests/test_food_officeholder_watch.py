#!/usr/bin/env python3
"""Synthetic fixtures; verify a former head mentioned historically is not treated as current."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
from watch_food_officeholders import evaluate_profile

assert evaluate_profile(
    "<html><main><h1>Andi Amran Sulaiman</h1><p>Yang kini menjabat sebagai Kepala Badan Pangan Nasional</p>"
    "<p>Menggantikan Arief Prasetyo Adi pada 2025.</p></main></html>",
    "Andi Amran Sulaiman")["status"]=="expected_name_near_current_role"
assert evaluate_profile(
    "<html><h1>Arief Prasetyo Adi</h1><p>Yang kini menjabat sebagai Kepala Badan Pangan Nasional</p>"
    "<p>Arief digantikan oleh Andi Amran Sulaiman.</p></html>",
    "Andi Amran Sulaiman")["requires_human_verification"] is True
assert evaluate_profile(
    "<html><h1>Andi Amran Sulaiman</h1><p>Former head; archived 2025 article.</p></html>",
    "Andi Amran Sulaiman")["requires_human_verification"] is True
assert evaluate_profile(
    "<html><script>Andi Amran Sulaiman kini menjabat sebagai Kepala Badan Pangan Nasional</script>"
    "<p>Official biography not loaded</p></html>",
    "Andi Amran Sulaiman")["requires_human_verification"] is True
assert evaluate_profile(
    "<h1>New Head</h1><p>New Head kini menjabat sebagai Kepala Badan Pangan Nasional.</p>",
    "New Head")["requires_human_verification"] is False
print("PASS: leader source monitor distinguishes current profile wording from historical mentions and hidden script.")
