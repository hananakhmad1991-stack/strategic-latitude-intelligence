#!/usr/bin/env python3
"""Independent cross-language econometric benchmark for the SLI BPS provincial panel.

Run in CI with statsmodels (not imported by the browser estimator). This is an
implementation cross-check of numerical inference, NOT an external verification
of BPS source publication nor causal identification.
"""
import json
import math
import subprocess
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.formula.api as smf
from scipy.stats import t as student_t

ROOT = Path(__file__).resolve().parent.parent
RAW = json.loads((ROOT / "data/sli-bps-regional-intelligence.json").read_text(encoding="utf-8"))
EXCLUDED = {
    "Papua", "Papua Barat", "Papua Barat Daya",
    "Papua Pegunungan", "Papua Selatan", "Papua Tengah",
}
YEAR = [2021, 2022, 2023, 2024, 2025]
assert RAW["grdp_years"] == YEAR, "Source series vintage changed: manual review required"
rows = []
for p in RAW["provinces"]:
    if p["name"] in EXCLUDED:
        continue
    assert all(len(p[k]) == 5 for k in ("grdp_current", "grdp_constant", "pmtb_current", "household_current"))
    for i in range(1, 5):
        assert all(p[k][i] is not None and p[k][i - 1] is not None for k in ("grdp_current", "grdp_constant", "pmtb_current", "household_current"))
        rows.append({
            "province": p["name"],
            "year": YEAR[i],
            "real_grdp_growth_pct": round(100 * (p["grdp_constant"][i] / p["grdp_constant"][i - 1] - 1), 6),
            "pmtb_share_lag1_pct": round(100 * p["pmtb_current"][i - 1] / p["grdp_current"][i - 1], 6),
            "household_share_lag1_pct": round(100 * p["household_current"][i - 1] / p["grdp_current"][i - 1], 6),
        })

df = pd.DataFrame.from_records(rows)
assert len(df) == 128 and df["province"].nunique() == 32 and df["year"].nunique() == 4
assert not df.duplicated(["province", "year"]).any()

node_expression = """
import fs from 'node:fs';
import {buildBpsOfficialPanel} from './js/sli-bps-official-panel.mjs';
import {panelFixedEffects} from './js/sli-econometrics.mjs';
const d=JSON.parse(fs.readFileSync('./data/sli-bps-regional-intelligence.json','utf8'));
const p=buildBpsOfficialPanel(d,{balanced:true});
const fit=(cols)=>panelFixedEffects(p.rows,cols,'real_grdp_growth_pct','province','year',true);
console.log(JSON.stringify({single:fit(['pmtb_share_lag1_pct']),multi:fit(['pmtb_share_lag1_pct','household_share_lag1_pct'])}));
"""
proc = subprocess.run(
    ["node", "--input-type=module", "-e", node_expression],
    cwd=ROOT, capture_output=True, text=True, check=True,
)
browser = json.loads(proc.stdout)

def benchmark(key, xvars):
    formula = "real_grdp_growth_pct ~ " + " + ".join(xvars) + " + C(province) + C(year)"
    fit = smf.ols(formula, data=df).fit(
        cov_type="cluster",
        cov_kwds={"groups": df["province"], "use_correction": True, "df_correction": True},
    )
    js = browser[key]
    assert js["rows_used"] == fit.nobs == 128
    assert js["unit_count"] == 32 and js["time_count"] == 4
    assert js["degrees_freedom"] == int(fit.df_resid), (
        f"FE df mismatch SLI {js['degrees_freedom']} != independent {fit.df_resid}"
    )
    for name in xvars:
        est = float(fit.params[name])
        se = float(fit.bse[name])
        obs = next(x for x in js["coefficients"] if x["name"] == name)
        if abs(obs["estimate"] - est) > 5e-5:
            raise AssertionError(f"{name} beta SLI {obs['estimate']} vs statsmodels {est}")
        if abs(obs["std_error_hc1"] - se) > 5e-5:
            raise AssertionError(f"{name} cluster SE SLI {obs['std_error_hc1']} vs statsmodels {se}")
        df_cluster = 32 - 1
        critical = float(student_t.ppf(0.975, df_cluster))
        lo, hi = est - critical * se, est + critical * se
        if abs(obs["ci95_low"] - lo) > 5e-5 or abs(obs["ci95_high"] - hi) > 5e-5:
            raise AssertionError(f"{name} 95% CI mismatch SLI vs statsmodels with t_31")
        print(json.dumps({
            "specification": key, "variable": name,
            "sli_beta": obs["estimate"], "statsmodels_beta": round(est, 6),
            "sli_cluster_se": obs["std_error_hc1"], "statsmodels_cluster_se": round(se, 6),
            "cluster_df": df_cluster, "n": len(df),
            "caveat": "Observational FE, not causal, administrative boundaries audited, 2025 preliminary."
        }, ensure_ascii=False))

benchmark("single", ["pmtb_share_lag1_pct"])
benchmark("multi", ["pmtb_share_lag1_pct", "household_share_lag1_pct"])
print("SLI official BPS panel: independent statsmodels crosscheck PASSED for single and multivariate FE.")
