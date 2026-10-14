#!/usr/bin/env python3
"""Daily evidence-led Indonesia energy assessment, not an LLM fact verifier.

Reads the latest locally published, officially sourced SLI datasets and attributed domestic/geopolitical headline
feeds. Produces seven substantive, source-cited findings with conditional
transmission analysis. Does not invent incidents, risk scores or fresh statistics.
"""
import datetime as dt
import json
import re
import hashlib
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
WIB = ZoneInfo("Asia/Jakarta")
UTC = dt.timezone.utc

def read(filename, required=False):
    path = DATA / filename
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        if required:
            raise RuntimeError("Required dataset missing or corrupt: " + filename) from exc
        return {}

def when(value):
    try:
        return dt.datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)
    except (ValueError, AttributeError, TypeError):
        return None

def evidence(label, url, kind="official", published=None):
    return {"label": label, "url": url, "kind": kind, "published_at_utc": published}

def fresh_feed(feed, now, max_hours=18):
    timestamp = when(feed.get("checked_at_utc"))
    age = (now - timestamp).total_seconds() / 3600 if timestamp else None
    return bool(age is not None and 0 <= age <= max_hours), round(age, 1) if age is not None else None

def words(s):
    return set(re.findall(r"[a-z]{4,}", s.lower())) - {"news", "indonesia", "energy", "today", "video", "says"}

def lead_list(feed, key, timekey, now, max_hours=72):
    out = []
    for obj in feed.get(key, []):
        published = when(obj.get(timekey))
        if published is None or not (0 <= (now - published).total_seconds() <= max_hours * 3600):
            continue
        title = " ".join(str(obj.get("title", "")).split())[:220]
        url = str(obj.get("url", ""))
        if not title or not url.startswith("https://"):
            continue
        item = {"title": title, "publisher": str(obj.get("publisher", "News source"))[:95],
                "url": url, "published_at_utc": published.isoformat(),
                "category": str(obj.get("category", obj.get("topic", ""))),
                "topic_id": str(obj.get("topic_id", "")),
                "kind": "attributed news headline, not independently verified"}
        out.append(item)
    out.sort(key=lambda x: x["published_at_utc"], reverse=True)
    return out

def select(items, category=None, terms=(), limit=1):
    found = []
    for item in items:
        if category and item.get("topic_id") not in category and item.get("category") not in category:
            continue
        title = item["title"].casefold()
        if terms and not any(term in title for term in terms):
            continue
        if any(len(words(item["title"]) & words(old["title"])) /
               max(1, len(words(item["title"]) | words(old["title"]))) >= .48 for old in found):
            continue
        found.append(item)
        if len(found) >= limit:
            break
    return found

def latest(series):
    observations = series["values"]
    year = max(observations, key=lambda x: int(x))
    return year, float(observations[year])

def fmt(number, places=2):
    return f"{number:,.{places}f}".rstrip("0").rstrip(".")

def report_item(id_, heading, finding, implication, verify, baseline, developments=None):
    reports = developments or []
    channels = {
        "oil-gas": "Assess regional stocks, last-mile fuel delivery and physical gas flows before attributing a supply problem to domestic crude production.",
        "geopolitics": "Confirm actual tanker passages, freight/war-risk rates and oil or LNG loading volumes before treating shipping headlines as a physical supply loss.",
        "coal": "Check whether the reported development changes Indonesian export volumes, DMO allocations or effective coal reference prices; foreign policy news does not directly establish a domestic outage.",
        "power": "Verify outage location, utility-confirmed cause, restoration time and affected industrial load, rather than extrapolating one regional event nationally.",
        "transition": "Determine whether the development is an investment proposal, construction milestone, grid energization or commissioned generation, since those represent different levels of delivery.",
        "carbon": "Verify observed fire area, duration, smoke dispersion and infrastructure proximity before inferring either an emissions increase or energy-system loss.",
        "policy": "Confirm a numbered legal instrument and its effective date; media commentary on future policies is not itself binding regulation."
    }
    if reports:
        item = reports[0]
        stamp = when(item["published_at_utc"])
        local_date = stamp.astimezone(WIB).strftime("%d %b %Y %H:%M WIB") if stamp else "date unavailable"
        change = "Newly identified" if item.get("new_since_previous") else "Previously monitored"
        daily_signal = (f"{change} attributed headline ({item['publisher']}, {local_date}): "
                        f"{item['title']}. Analytical test: {channels[id_]} "
                        "The headline is not independently verified evidence of operational impact.")
    else:
        daily_signal = ("No qualified recent headline was selected for this theme in the available "
                        "feed. This is a monitoring-coverage statement, not evidence that no event occurred. "
                        + channels[id_])
    return {"id": id_, "heading": heading, "finding": finding,
            "daily_signal": daily_signal, "implication": implication,
            "verification_priority": verify, "baseline_sources": baseline,
            "recent_news_leads": reports}

def main():
    now = dt.datetime.now(UTC)
    today = now.astimezone(WIB).date().isoformat()
    fundamentals = read("energy-fundamentals.json", True)
    transition = read("energy-transition.json", True)
    domestic = read("domestic-energy.json")
    geo = read("geopolitical-energy.json")
    previous = read("daily-energy-assessment.json")
    domestic_ok, domestic_age = fresh_feed(domestic, now)
    geo_ok, geo_age = fresh_feed(geo, now)
    domestic_items = lead_list(domestic, "reports", "published_at_utc", now) if domestic_ok else []
    geo_items = lead_list(geo, "events", "indexed_at_utc", now) if geo_ok else []
    prior_links = {x.get("url") for point in previous.get("points", [])
                   for x in point.get("recent_news_leads", [])}
    s = fundamentals["series"]
    tr = transition
    oi_year, oi_value = latest(s["oil_production"])
    gas_year, gas_val = latest(s["gas_production"])
    coal_year, coal_prod = latest(s["coal_production"])
    dmo_year, coal_dmo = latest(s["coal_dmo"])
    ebt_year, ebt = latest(s["nre_share"])
    emissions = max(tr["emissions"]["series"], key=lambda v: int(v["year"]))
    oil_res = fundamentals["reserves"]["oil_proved"]
    gas_res = fundamentals["reserves"]["gas_proved"]
    src = fundamentals["sources"]
    t_src = tr["sources"]
    official = lambda label, url: evidence(label, url)

    fuel = select(domestic_items, {"fuel","Fuel and LPG availability"},
                  ("bbm","lpg","pertamina","bensin","solar"), limit=2)
    chokepoints = select(geo_items, {"Hormuz and Gulf energy","Red Sea and Bab el-Mandeb"},
                       ("hormuz","tanker","red sea","ship","iran","houthi","mandeb"), limit=2)
    coalnews = select(geo_items, {"Global coal and energy policy"}, ("coal","batubara"), limit=1)
    coaldomestic = select(domestic_items, {"policy","Energy regulations and permits"},
                          ("batubara","dmo","hba","coal"), limit=1)
    power = select(domestic_items, {"power","Electricity outages"},
                   ("pln","blackout","listrik","padam","gangguan"), limit=2)
    projects = select(domestic_items, {"projects","Energy project commissioning"},
                      ("beroperasi","diresmikan","resmikan","commission","konstruksi",
                       "plts","pltp","plta","operasi komersial","rampung"), limit=1)
    fires = select(domestic_items, {"forest_fire","Forest fires and haze"},
                   ("karhutla","kebakaran","gambut","hutan"), limit=2)
    rules = select(domestic_items, {"policy","Energy regulations and permits"},
                   ("peraturan","kepmen","permen","regulasi","ditetapkan",
                    "diterbitkan","berlaku","izin","perpres"), limit=2)
    gasnews = select(geo_items, {"Asian LNG and gas"}, ("gas","lng"), limit=1)

    def annotated(items):
        return [dict(x, new_since_previous=(x["url"] not in prior_links)) for x in items]

    points = [
       report_item("oil-gas", "01 · Oil & Gas Supply Resilience",
           f"Indonesia's reported oil-field output averaged {fmt(oi_value, 0)} thousand barrels/day in {oi_year}, while gross gas production was {fmt(gas_val,0)} MMSCFD in {gas_year}. Proved reserves reported for {oil_res['year']} were {fmt(oil_res['value'],3)} billion barrels of oil and {fmt(gas_res['value'])} TSCF of gas. These are different stock and flow measures.",
           "Sustained supply resilience depends on replacement discoveries, operational delivery and refinery import needs. Regional fuel-availability headlines may point to distribution issues rather than changes in national production; LNG headlines do not prove Indonesian gas outages.",
           "Monitor SKK Migas and ESDM revisions to actual output, domestic gas allocation, proved reserves and Pertamina/BPH Migas supply status.",
           [official("Ditjen Migas 2025", src["migas2025"])],
           annotated(fuel[:1] + gasnews[:1])),
       report_item("geopolitics", "02 · External Price & Maritime Exposure",
           "International oil, LNG and shipping shocks remain transmission risks for Indonesia's imported petroleum and energy-intensive industry. This is an exposure assessment, not a claim that any news headline confirms a reduction in global supply.",
           "A verified production outage or material shipping rerouting could affect crude and product prices, freight, insurance, the rupiah and the Indonesian Crude Price (ICP). A reported attack alone does not prove that Hormuz or Bab el-Mandeb has closed.",
           "Check vessel traffic, insured voyages, refinery throughput, dated price observations and official statements before classifying an event as a supply disruption.",
           [official("BPS foreign trade import data", "https://www.bps.go.id/"),
            official("ESDM official energy balance", src["heesi"])],
           annotated(chokepoints)),
       report_item("coal", "03 · Coal Production, DMO & Exports",
           f"The Ditjen Minerba {coal_year} dataset reports coal production of {fmt(coal_prod)} million tonnes, with {fmt(coal_dmo)} million tonnes of DMO use in {dmo_year} (provisional). Other ESDM releases use different reporting vintages, so the figures should not be mechanically reconciled into a national supply balance.",
           "The strategic tension is maintaining reliable domestic coal supply while assessing changes in export demand, regulated reference prices, and longer-run coal transition pressure.",
           "Reconcile Minerba, HEESI, PLN deliveries and customs exports for identical reporting periods; confirm effective dates of any new coal rule.",
           [official("Ditjen Minerba 2025", src["minerba2025"]), official("HEESI energy statistics",src["heesi"])],
           annotated((coaldomestic+coalnews)[:2])),
       report_item("power", "04 · Grid Reliability & Industrial Demand",
           "Electricity security must be evaluated through grid availability and restoration times, not installed capacity alone. Smelters, industrial estates and data centres are particularly dependent on reliable regional supply.",
           "Reported local blackouts can disrupt industry and data-centre operations. Their economic scale cannot be inferred without operator-confirmed duration, affected substations, customers and industrial load.",
           "Verify each outage with the regional PLN operator; track interruption duration, cause, recovery, transmission constraints and the commissioning of firm supply.",
           [official("PLN Annual Report 2024", "https://web.pln.co.id/statics/uploads/2025/06/AR-PLN-2024-final.pdf")],
           annotated(power)),
       report_item("transition", "05 · Energy Transition & Project Delivery",
           f"Indonesia's reported EBT share was {fmt(ebt)}% in {ebt_year} versus the revised KEN {ebt_year} reference range of {fmt(tr['ken']['target_ebt_2025_low'])}–{fmt(tr['ken']['target_ebt_2025_high'])}%. The 2025–2034 RUPTL plans {fmt(tr['ruplt']['renewables_gw'])} GW of renewable additions and {fmt(tr['ruplt']['storage_gw'])} GW of storage, but these are planned, not commissioned.",
           "The transition implementation gap remains an important strategic variable: grid connection, dispatch, financing and provincial RUED progress determine whether planned additions translate into generation and lower emissions.",
           "Check COD, installed and dispatched capacity, regional RUED actuals and project operating data; do not treat announcements or personnel appointments as project completion.",
           [official("Ditjen EBTKE 2025",t_src["ebt2025"]),official("RUPTL 2025–2034",t_src["ruptl"])],
           annotated(projects)),
       report_item("carbon", "06 · Carbon Outcomes & Environmental Risk",
           f"The BPS/KLHK inventory shown here ends in {emissions['year']}; energy-sector emissions were {fmt(emissions['energy_mtco2e'])} MtCO₂e and national emissions {fmt(emissions['national_mtco2e'])} MtCO₂e. These are emitted greenhouse gases, not reported avoided-emission achievements.",
           "Peatland and forest-fire conditions can affect land-use emissions, haze and infrastructure access; local fire reports do not on their own confirm damage to electricity or fuel assets. National net-zero progress should use updated inventories rather than assuming daily changes.",
           "Review BNPB/BPBD and KLHK fire measurements, proximity to critical infrastructure, restoration work, and the next verified GHG inventory.",
           [official("BPS greenhouse gas inventory",t_src["bps"])],
           annotated(fires)),
       report_item("policy", "07 · Policy Execution & Evidence Discipline",
           f"PP 40/2025 updates Indonesia's national energy policy. The national long-term net-zero pathway is 2060 or sooner; provincial RUED attainment remains province-specific rather than a verified single nationwide compliance score.",
           "New regulations, local supply decisions and commissioning milestones may change incentives and execution. A headline that discusses a policy or minister is not evidence that a legally binding rule was enacted.",
           "Require a numbered official instrument, signature and effective date from JDIH ESDM or peraturan.go.id; verify implementation milestones before revising project or regulatory assessments.",
           [official("PP 40/2025",t_src["ken"]),official("DEN performance / RUED",t_src["den"])],
           annotated(rules))
    ]
    all_news = [item for point in points for item in point["recent_news_leads"]]
    current_count = sum(1 for lead in all_news if lead["new_since_previous"])
    prev_base = previous.get("baseline_fingerprint")
    baseline_inputs = {
       "fundamentals": fundamentals.get("updated"), "oil": oi_value, "gas": gas_val,
       "oil_res": oil_res["value"], "gas_res": gas_res["value"],
       "coal": coal_prod, "dmo": coal_dmo, "renewables": ebt,
       "ghg": emissions["energy_mtco2e"], "ken":tr["ken"]["regulation"],
       "ruptl":tr["ruplt"]["planned_new_capacity_gw"]
    }
    fingerprint = hashlib.sha256(json.dumps(baseline_inputs,sort_keys=True).encode()).hexdigest()
    changed_baseline = bool(prev_base and prev_base != fingerprint)
    news_note = (f"{current_count} newly identified attributed headline leads across the seven findings."
                 if current_count else "No new qualifying headline leads relative to the previous assessment.")
    if not domestic_ok and not geo_ok:
        news_note = "Both news snapshots are delayed or unavailable; the assessment retains the dated official baseline without claiming current incident coverage."
    elif not domestic_ok or not geo_ok:
        news_note += " At least one monitoring feed is delayed or unavailable."
    payload={
       "assessment_date_wib": today, "generated_at_utc": now.isoformat(), "headline":"Indonesia Energy Security — Daily Overall Assessment",
       "status":"Automated evidence-led interpretation; news leads unverified, no LLM article-body verification",
       "method":"Deterministic editorial transmission framework sourced from dated official baselines and qualified, attributed public headline leads.",
       "baseline_fingerprint": fingerprint,
       "baseline_changed_since_previous": changed_baseline,
       "news_new_since_previous": current_count,
       "news_note": news_note,
       "news_freshness":{
          "domestic":{"source_checked_at_utc":domestic.get("checked_at_utc"),"age_hours_at_generation":domestic_age,"usable":domestic_ok},
          "geopolitical":{"source_checked_at_utc":geo.get("checked_at_utc"),"age_hours_at_generation":geo_age,"usable":geo_ok}
       },
       "points":points,
       "limitations":"The dated report is rebuilt daily, but underlying annual fundamentals only change when the original datasets are updated. News links represent attributed headlines, not independent incident confirmation. No probability forecast, investment advice or made-up daily data.",
       "watch_next":"Oil and gas delivery; fuel stocks; verified Hormuz/Red Sea voyages; coal and DMO reconciliation; outage restoration; commissioned renewable capacity; provincial RUED reporting and carbon inventories."
    }
    out=DATA/"daily-energy-assessment.json"
    out.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps({"assessment_day_wib":today,"points":len(points),
                      "news_leads_in_assessment":len(all_news),"new_leads":current_count,
                      "domestic_feed_current":domestic_ok,"geopolitical_feed_current":geo_ok,
                      "baseline_changed":changed_baseline,
                      "output":str(out)},indent=2))

if __name__=="__main__":
    main()
