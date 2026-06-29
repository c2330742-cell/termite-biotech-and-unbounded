#!/usr/bin/env python3
"""
Termite Biotech — Comprehensive Data Analysis Pipeline
Analyzes experimental CSV data, generates visualizations, 
and produces statistical summaries for all 3 sub-projects.

Usage:
    python termite-analysis.py                          # default path
    python termite-analysis.py --data-dir ./examples/termite
    python termite-analysis.py --data-dir /path/to/csvs
"""

import argparse
import csv
import json
import math
import sys
from pathlib import Path
from collections import defaultdict

CSV_FILES = [
    "cellulase_assay_data.csv",
    "fermentation_results.csv",
    "agricultural_waste_test.csv",
    "glucose_calibration.csv",
]

def parse_args():
    parser = argparse.ArgumentParser(description="Termite Biotech data analysis")
    parser.add_argument("--data-dir", default="termite-projects/biofuel-research/data",
                        help="Directory containing the CSV data files")
    return parser.parse_args()


def linear_regression(x_vals, y_vals):
    n = len(x_vals)
    sx = sum(x_vals)
    sy = sum(y_vals)
    sxx = sum(x * x for x in x_vals)
    sxy = sum(x * y for x, y in zip(x_vals, y_vals))
    syy = sum(y * y for y in y_vals)
    denom = n * sxx - sx * sx
    if denom == 0:
        return 0.0, 0.0, 0.0
    slope = (n * sxy - sx * sy) / denom
    intercept = (sy - slope * sx) / n
    ss_res = sum((y - (slope * x + intercept)) ** 2 for x, y in zip(x_vals, y_vals))
    ss_tot = syy - sy * sy / n
    r2 = 1 - ss_res / ss_tot if ss_tot != 0 else 0.0
    return slope, intercept, r2


def parse_csv(filepath):
    try:
        with open(filepath, newline="", encoding="utf-8") as f:
            return list(csv.DictReader(f))
    except FileNotFoundError:
        return None
    except Exception as e:
        return str(e)


def analyze_cellulase(rows):
    if not rows:
        return {"error": "No data"}
    
    isolates = defaultdict(list)
    for r in rows:
        iso = r.get("Isolate", "?")
        try:
            isolates[iso].append({
                "activity": float(r.get("Specific_Activity_U_mg", 0)),
                "glucose": float(r.get("Glucose_mM", 0)),
                "absorbance": float(r.get("Absorbance_540nm", 0)),
            })
        except (ValueError, KeyError):
            continue

    summary = {}
    for iso, vals in isolates.items():
        activities = [v["activity"] for v in vals]
        summary[iso] = {
            "mean_activity": round(sum(activities) / len(activities), 2),
            "max_activity": round(max(activities), 2),
            "min_activity": round(min(activities), 2),
            "n": len(activities),
            "glucose_range": [round(min(v["glucose"] for v in vals), 2),
                              round(max(v["glucose"] for v in vals), 2)],
        }

    ranked = sorted(summary.items(), key=lambda x: -x[1]["mean_activity"])
    
    return {
        "total_rows": len(rows),
        "isolates_tested": len(isolates),
        "top_strain": ranked[0][0] if ranked else None,
        "top_activity": ranked[0][1]["mean_activity"] if ranked else 0,
        "rankings": ranked,
        "summary": summary,
    }


def analyze_fermentation(rows):
    if not rows:
        return {"error": "No data"}
    
    strains = defaultdict(list)
    for r in rows:
        s = r.get("Strain", "?")
        try:
            strains[s].append({
                "time": float(r.get("Time_h", 0)),
                "ethanol": float(r.get("Ethanol_g_L", 0)),
                "biomass": float(r.get("Biomass_g_L", 0)),
                "ph": float(r.get("pH", 7)),
            })
        except (ValueError, KeyError):
            continue

    results = {}
    for strain, readings in strains.items():
        ethanol_vals = [v["ethanol"] for v in readings]
        biomass_vals = [v["biomass"] for v in readings]
        max_eth = max(readings, key=lambda x: x["ethanol"])
        
        # Calculate productivity (g/L/h)
        if max_eth["time"] > 0:
            productivity = max_eth["ethanol"] / max_eth["time"]
        else:
            productivity = 0
            
        results[strain] = {
            "max_ethanol": round(max_eth["ethanol"], 2),
            "max_ethanol_time": max_eth["time"],
            "max_biomass": round(max(biomass_vals), 2),
            "productivity_g_L_h": round(productivity, 3),
            "ph_range": [round(min(v["ph"] for v in readings), 1),
                         round(max(v["ph"] for v in readings), 1)],
            "ethanol_trajectory": [
                {"time": v["time"], "ethanol": round(v["ethanol"], 2)}
                for v in sorted(readings, key=lambda x: x["time"])
            ],
        }

    best = max(results.values(), key=lambda x: x["max_ethanol"])
    
    return {
        "total_rows": len(rows),
        "strains_tested": len(strains),
        "overall_max_ethanol": best["max_ethanol"],
        "overall_max_productivity": best["productivity_g_L_h"],
        "results": results,
    }


def analyze_waste_test(rows):
    if not rows:
        return {"error": "No data"}
    
    substrates = defaultdict(list)
    for r in rows:
        key = (r.get("Substrate", "?"), r.get("Pretreatment", "?"))
        try:
            substrates[key].append(float(r.get("Glucose_g_L", 0)))
        except (ValueError, KeyError):
            continue

    analysis = {}
    for (substrate, pretreatment), glucose_vals in substrates.items():
        mean_g = sum(glucose_vals) / len(glucose_vals) if glucose_vals else 0
        analysis[f"{substrate} + {pretreatment}"] = {
            "substrate": substrate,
            "pretreatment": pretreatment,
            "mean_glucose_g_L": round(mean_g, 2),
            "max_glucose": round(max(glucose_vals), 2),
            "n": len(glucose_vals),
        }

    ranked = sorted(analysis.values(), key=lambda x: -x["mean_glucose_g_L"])
    
    return {
        "total_rows": len(rows),
        "combinations_tested": len(substrates),
        "best_combination": ranked[0] if ranked else None,
        "rankings": ranked,
    }


def analyze_calibration(rows):
    if not rows:
        return {"error": "No data"}
    
    xv, yv = [], []
    for r in rows:
        try:
            xv.append(float(r.get("Glucose_mM", 0)))
            yv.append(float(r.get("Absorbance_540nm", 0)))
        except (ValueError, KeyError):
            pass

    if len(xv) < 2:
        return {"error": "Insufficient data points"}
    
    slope, intercept, r2 = linear_regression(xv, yv)
    
    # Calculate detection limit (3.3 * sigma / slope)
    residuals = [y - (slope * x + intercept) for x, y in zip(xv, yv)]
    sigma = math.sqrt(sum(r * r for r in residuals) / (len(residuals) - 2)) if len(residuals) > 2 else 0
    detection_limit = (3.3 * sigma / abs(slope)) if slope != 0 else float('inf')
    
    return {
        "n": len(xv),
        "slope": round(slope, 4),
        "intercept": round(intercept, 4),
        "r_squared": round(r2, 4),
        "equation": f"Abs_540 = {slope:.4f} × [Glucose] + {intercept:.4f}",
        "detection_limit_mM": round(detection_limit, 3),
        "linear_range_mM": [round(min(xv), 2), round(max(xv), 2)],
        "data_points": [{"glucose_mM": x, "absorbance": round(y, 4)} for x, y in zip(xv, yv)],
    }


def main():
    args = parse_args()
    data_dir = Path(args.data_dir)
    print("=" * 60)
    print("  TERMITE BIOTECH — COMPREHENSIVE DATA ANALYSIS")
    print(f"  Data dir: {data_dir.resolve()}")
    print("=" * 60)

    results = {}
    all_ok = True

    for csv_file in CSV_FILES:
        path = data_dir / csv_file
        print(f"\n{'-' * 60}")
        print(f"  === {csv_file} ===")
        print(f"{'-' * 60}")

        rows = parse_csv(path)
        if rows is None:
            print(f"  ❌  FILE NOT FOUND: {path}")
            all_ok = False
            continue
        if isinstance(rows, str):
            print(f"  ❌  ERROR: {rows}")
            all_ok = False
            continue
        if not rows:
            print(f"  ⚠️   Empty file")
            continue

        print(f"  Rows: {len(rows)}, Columns: {len(rows[0].keys())}")
        print(f"  Fields: {', '.join(rows[0].keys())}")

        if csv_file == "cellulase_assay_data.csv":
            analysis = analyze_cellulase(rows)
            results["cellulase"] = analysis
            if "error" not in analysis:
                print(f"\n  📊  CELLULASE ASSAY SUMMARY")
                print(f"  Isolates tested: {analysis['isolates_tested']}")
                print(f"  Top strain: {analysis['top_strain']} "
                      f"({analysis['top_activity']} U/mg)")
                print(f"\n  Rankings:")
                for i, (iso, data) in enumerate(analysis["rankings"], 1):
                    print(f"    {i}. {iso:<10} mean={data['mean_activity']:<6.1f} U/mg  "
                          f"max={data['max_activity']:<6.1f} U/mg  n={data['n']}")

        elif csv_file == "fermentation_results.csv":
            analysis = analyze_fermentation(rows)
            results["fermentation"] = analysis
            if "error" not in analysis:
                print(f"\n  📊  FERMENTATION SUMMARY")
                print(f"  Strains tested: {analysis['strains_tested']}")
                print(f"  Overall max ethanol: {analysis['overall_max_ethanol']} g/L")
                print(f"  Overall max productivity: {analysis['overall_max_productivity']} g/L/h")
                print(f"\n  Per-strain results:")
                for s, d in analysis["results"].items():
                    print(f"    {s:<15} max EtOH: {d['max_ethanol']:<5.1f} g/L  "
                          f"productivity: {d['productivity_g_L_h']:<.3f} g/L/h  "
                          f"biomass: {d['max_biomass']:<.1f} g/L")

        elif csv_file == "agricultural_waste_test.csv":
            analysis = analyze_waste_test(rows)
            results["waste_test"] = analysis
            if "error" not in analysis:
                print(f"\n  📊  AGRICULTURAL WASTE TEST SUMMARY")
                print(f"  Combinations tested: {analysis['combinations_tested']}")
                bc = analysis["best_combination"]
                if bc:
                    print(f"  Best: {bc['substrate']} + {bc['pretreatment']} "
                          f"— {bc['mean_glucose_g_L']} g/L glucose")
                print(f"\n  Rankings:")
                for i, r in enumerate(analysis["rankings"][:5], 1):
                    print(f"    {i}. {r['substrate']:<20} {r['pretreatment']:<12} "
                          f"{r['mean_glucose_g_L']:>5.1f} g/L  (n={r['n']})")

        elif csv_file == "glucose_calibration.csv":
            analysis = analyze_calibration(rows)
            results["calibration"] = analysis
            if "error" not in analysis:
                print(f"\n  📊  GLUCOSE CALIBRATION SUMMARY")
                print(f"  Equation: {analysis['equation']}")
                print(f"  R² = {analysis['r_squared']}")
                print(f"  Detection limit: {analysis['detection_limit_mM']} mM")
                print(f"  Linear range: {analysis['linear_range_mM'][0]} - "
                      f"{analysis['linear_range_mM'][1]} mM")
                print(f"  n = {analysis['n']}")

    # Save analysis results to JSON
    output_path = data_dir / "analysis_results.json"
    try:
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)
        print(f"\n{'─' * 60}")
        print(f"  💾  Analysis saved to: {output_path}")
    except Exception as e:
        print(f"\n  ⚠️   Could not save analysis: {e}")

    print(f"\n{'=' * 60}")
    if all_ok:
        print("  ✅  Analysis complete. All 4 CSV files processed.")
    else:
        print("  ⚠️   Analysis complete with some errors.")
    print(f"{'=' * 60}\n")

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
