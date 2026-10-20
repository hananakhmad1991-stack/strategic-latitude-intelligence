#!/usr/bin/env python3
"""Compare station rainfall public annual summaries with original downloaded BMKG SACA observations."""
from pathlib import Path
import json
published=json.loads(Path("data/sli-bmkg-cengkareng-historical-rainfall.json").read_text())
evidence=json.loads(Path("artifacts/sli-bmkg-saca-cengkareng-rain-review.json").read_text())
assert published["schema"]=="sli-bmkg-saca-historical-station-rainfall-v1"
assert evidence["station_id"]==published["station"]["id"]==46
assert evidence["station_filename"]==published["original_station_file"]
assert evidence["last_numeric_observed_date"]==published["last_actual_quality_valid_observation_date"]
assert evidence["date_end"]==published["archive_nominal_last_date"]
assert evidence["quality_suspect_numeric_values_rejected"]>=7
assert len(published["annual_observations"])==15
assert all(x["year"]==2000+i for i,x in enumerate(published["annual_observations"]))
assert published["station"]["latitude_dms"] in evidence["official_station_metadata_line"]
for year in published["annual_observations"]:
    dates=[r for r in evidence["observations"] if r["date"].startswith(str(year["year"]))]
    valid=[r for r in dates if r["quality_flag"]=="0" and r["rain_mm"] is not None]
    assert len(dates)==year["calendar_days"]
    assert len(valid)==year["valid_observation_days"]
    assert len(dates)-len(valid)==year["missing_or_suspect_days"]
    assert round(sum(r["rain_mm"] for r in valid),1)==year["source_observed_rainfall_mm"]
    assert year["complete_year"]==(len(dates)==len(valid))
    assert len(valid)>350
print("BMKG_STATION_PUBLISHED_Q0_HISTORY_OK years=15 complete="+str(sum(x["complete_year"] for x in published["annual_observations"])))
