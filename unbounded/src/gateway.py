#!/usr/bin/env python3
"""
UNBOUNDED GATEWAY — Unified CLI for the Termite Project & UNBOUNDED Vision
From the soil to the screen — and beyond.
"""

import os
import sys
import csv
import platform
import webbrowser
from pathlib import Path
from collections import defaultdict

_THIS_DIR = Path(__file__).resolve().parent.parent
TERMITE_BASE = _THIS_DIR.parent / "termite-projects"
UNBOUNDED_BASE = _THIS_DIR
BIOFUEL_DATA = TERMITE_BASE / "biofuel-research" / "data"
NOTEBOOK_PATH = TERMITE_BASE / "biofuel-research" / "research" / "experiments" / "LAB-NOTEBOOK.md"
MASTER_SUMMARY = TERMITE_BASE / "MASTER-PROJECT-SUMMARY.md"
MANIFESTO = UNBOUNDED_BASE / "docs" / "MANIFESTO.md"
CALLS_DIR = UNBOUNDED_BASE / "calls"
PRESENTATIONS_DIR = TERMITE_BASE / "presentations"
CROSS_VERIFY = TERMITE_BASE / "CROSS-VERIFICATION.md"
PORTAL_HTML = UNBOUNDED_BASE / "site" / "portal.html"

try:
    import colorama
    from colorama import Fore, Style
    colorama.init(autoreset=True)
    HAVE_COLOR = True
except ImportError:
    HAVE_COLOR = False
    Fore = type("Fore", (), {c: "" for c in "RED GREEN YELLOW BLUE MAGENTA CYAN WHITE RESET LIGHTRED_EX LIGHTGREEN_EX LIGHTYELLOW_EX LIGHTBLUE_EX LIGHTMAGENTA_EX LIGHTCYAN_EX".split()})()
    Style = type("Style", (), {"BRIGHT": "", "DIM": "", "NORMAL": "", "RESET_ALL": ""})()


def clear_screen():
    os.system("cls" if platform.system() == "Windows" else "clear")


def cprint(text, color="", style=""):
    print(f"{color}{style}{text}{Style.RESET_ALL}") if HAVE_COLOR else print(text)


def read_file(path, max_lines=0):
    try:
        p = Path(path)
        if not p.exists():
            return None
        text = p.read_text(encoding="utf-8")
        if max_lines:
            lines = text.split("\n")
            if len(lines) > max_lines:
                return "\n".join(lines[:max_lines]) + f"\n... [truncated, {len(lines)} total lines]"
        return text
    except Exception as e:
        return f"[Error reading file: {e}]"


def show_splash():
    W = 46
    cprint(f"\n  ╔{'═' * (W - 2)}╗", Fore.CYAN)
    cprint(f"  ║{' ' * (W - 2)}║", Fore.CYAN)
    cprint(f"  ║{'  ✦  U N B O U N D E D   G A T E W A Y  ✦'.center(W - 2)}║", Fore.YELLOW, Style.BRIGHT)
    cprint(f"  ║{' ' * (W - 2)}║", Fore.CYAN)
    cprint(f"  ║{'From the soil to the screen — and beyond'.center(W - 2)}║", Fore.GREEN)
    cprint(f"  ║{' ' * (W - 2)}║", Fore.CYAN)
    cprint(f"  ╚{'═' * (W - 2)}╝", Fore.CYAN)
    print()
    cprint(f"  {'Termite Project + UNBOUNDED Vision + Experimental Data'.center(W)}", Fore.WHITE, Style.DIM)
    print()


def boxed(title, content, width=56):
    lines = content.split("\n")
    print(f"╔{'═' * (width - 2)}╗")
    print(f"║ {title.center(width - 4)} ║")
    print(f"╠{'═' * (width - 2)}╣")
    for line in lines:
        wrapped = []
        while len(line) > width - 4:
            wrapped.append(line[:width - 4])
            line = line[width - 4:]
        wrapped.append(line)
        for w in wrapped:
            print(f"║ {w.ljust(width - 4)} ║")
    print(f"╚{'═' * (width - 2)}╝")


def show_bottom_nav():
    print(f"\n  {'[b] Back to menu':<25} {'[q] Quit'}")


def get_choice(prompt="\n  > "):
    while True:
        val = input(prompt).strip().lower()
        if val in ("b", "q") or val.isdigit() and 0 <= int(val) <= 9:
            return val
        print("  Invalid input. Enter a number, 'b' to go back, or 'q' to quit.")


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


def csv_summary(rows, numeric_cols):
    if not rows:
        return "No data."
    out = f"  Rows: {len(rows)}, Columns: {len(rows[0].keys())}\n"
    out += f"  Fields: {', '.join(rows[0].keys())}\n"
    for col in numeric_cols:
        vals = []
        for r in rows:
            try:
                vals.append(float(r[col]))
            except (ValueError, KeyError):
                pass
        if vals:
            out += f"\n  [{col}]  min={min(vals):.4f}  max={max(vals):.4f}  "
            out += f"mean={sum(vals)/len(vals):.4f}  n={len(vals)}"
    return out


def display_subsection(title, content, width=56):
    print(f"\n╔{'═' * (width - 2)}╗")
    print(f"║ {('▸ ' + title).center(width - 4)} ║")
    print(f"╚{'═' * (width - 2)}╝")
    print(content)


# ---- Menu Actions -----------------------------------------------------------

def action_termite_summary():
    text = read_file(MASTER_SUMMARY)
    if text is None:
        cprint("  [ERROR] MASTER-PROJECT-SUMMARY.md not found.", Fore.RED)
        return
    cprint("\n  🔬  TERMITE PROJECT — FULL SUMMARY", Fore.YELLOW, Style.BRIGHT)
    sections = text.split("## ")
    exec_sec = sections[1] if len(sections) > 1 else text[:600]
    display_subsection("EXECUTIVE SUMMARY", exec_sec[:800])

    summary_lines = [
        "  ┌──────────────────────────────────────────────────────────────┐",
        "  │  KEY METRICS                                                 │",
        "  ├──────────────────────────────────────────────────────────────┤",
        "  │  Biofuel Research:                                           │",
        "  │    7 bacterial strains isolated (TF-001 to TF-007)           │",
        "  │    C-5 enzyme cocktail: 89.4% cellulose conversion rate      │",
        "  │    Co-culture TF-001+TF-006: 10.8 g/L ethanol               │",
        "  │    5L bioreactor fed-batch: 12.5 g/L ethanol                │",
        "  │    Breakeven: ₱23.23/L at 300,000 L/yr                      │",
        "  │                                                              │",
        "  │  Natural Pest Control:                                       │",
        "  │    4 formulations tested (88-100% efficacy)                  │",
        "  │    Essential oil blend: 100% mortality at 250 µL/L           │",
        "  │    Market: US$1B+ annually in Southeast Asia                 │",
        "  │                                                              │",
        "  │  Termite Farming:                                            │",
        "  │    3 M. gilvus colonies established, 86% growth rate         │",
        "  │    Protein content: 40-60% by dry weight                     │",
        "  │    Thailand model: 3,700 tons/yr, ~3.4 USD/kg                │",
        "  │                                                              │",
        "  │  Financials:                                                 │",
        "  │    Budget: ₱29.2M total (₱10M spent, ₱19.2M needed)         │",
        "  │    Revenue (Yr 2-5): ₱319M (₱260M biofuel, ₱37M pest,       │",
        "  │    ₱22M farming)                                             │",
        "  └──────────────────────────────────────────────────────────────┘",
    ]
    cprint("\n".join(summary_lines), Fore.CYAN)

    for sec in sections:
        h = sec.split("\n")[0].strip()
        if h.startswith("Phase") or h.startswith("Budget") or h.startswith("Revenue Projections"):
            lines = sec.split("\n")[:18]
            cprint(f"\n  ▸ {h}", Fore.YELLOW, Style.BRIGHT)
            for l in lines[1:19]:
                if l.strip():
                    print(f"    {l.strip()[:80]}")


def action_analyze_data():
    csv_files = sorted(BIOFUEL_DATA.glob("*.csv"))
    if not csv_files:
        cprint("  [ERROR] No CSV files found in data directory.", Fore.RED)
        return

    cprint("\n  📊  ANALYZING EXPERIMENTAL DATA", Fore.YELLOW, Style.BRIGHT)
    cprint(f"  Scanning: {BIOFUEL_DATA}", Fore.WHITE, Style.DIM)

    for cf in csv_files:
        fname = cf.name
        cprint(f"\n  {'═' * 56}", Fore.CYAN)
        cprint(f"  📄  {fname}", Fore.YELLOW, Style.BRIGHT)
        cprint(f"  {'─' * 56}", Fore.CYAN)

        rows = parse_csv(cf)
        if rows is None:
            cprint(f"  [ERROR] File not found: {fname}", Fore.RED)
            continue
        if isinstance(rows, str):
            cprint(f"  [ERROR] {rows}", Fore.RED)
            continue
        if not rows:
            cprint("  (empty)", Fore.RED)
            continue

        numeric_cols = list(rows[0].keys())
        summary = csv_summary(rows, numeric_cols)
        print(summary)

        if fname == "cellulase_assay_data.csv":
            best = max(rows, key=lambda r: float(r.get("Specific_Activity_U_mg", 0)))
            strains = set(r.get("Isolate", "?") for r in rows)
            cprint(f"\n  >>> TOP STRAIN: {best['Isolate']} — "
                   f"{float(best['Specific_Activity_U_mg']):.1f} U/mg "
                   f"(Glucose: {best['Glucose_mM']} mM, Abs: {best['Absorbance_540nm']})",
                   Fore.GREEN, Style.BRIGHT)
            cprint(f"      Strains tested: {', '.join(sorted(strains))}", Fore.WHITE, Style.DIM)
            rankings = sorted(
                [(r["Isolate"], float(r["Specific_Activity_U_mg"])) for r in rows],
                key=lambda x: -x[1]
            )
            seen = {}
            unique_rankings = []
            for iso, act in rankings:
                if iso not in seen:
                    seen[iso] = True
                    unique_rankings.append((iso, act))
            cprint(f"      All strains: {' | '.join(f'{iso}: {a:.1f}' for iso, a in unique_rankings)}",
                   Fore.WHITE, Style.DIM)

        elif fname == "fermentation_results.csv":
            max_eth = max(rows, key=lambda r: float(r.get("Ethanol_g_L", 0)))
            by_strain = defaultdict(list)
            for r in rows:
                by_strain[r["Strain"]].append(r)
            cprint(f"\n  >>> MAX ETHANOL: {max_eth['Ethanol_g_L']} g/L "
                   f"by strain {max_eth['Strain']} at t={max_eth['Time_h']}h "
                   f"(pH {max_eth['pH']}, biomass {max_eth['Biomass_g_L']} g/L)",
                   Fore.GREEN, Style.BRIGHT)
            cprint(f"      Final ethanol per strain:", Fore.WHITE, Style.DIM)
            for s, recs in sorted(by_strain.items()):
                final = max(recs, key=lambda x: float(x["Time_h"]))
                eth = float(final.get("Ethanol_g_L", 0))
                cprint(f"        {s:<15} {eth:>5.1f} g/L at t={final['Time_h']}h", Fore.WHITE)

        elif fname == "agricultural_waste_test.csv":
            by_key = defaultdict(list)
            for r in rows:
                key = (r.get("Substrate", "?"), r.get("Pretreatment", "?"))
                by_key[key].append(r)
            best_comb = None
            best_mean = -1
            for key, group in by_key.items():
                gluc = [float(g.get("Glucose_g_L", 0)) for g in group]
                m = sum(gluc) / len(gluc)
                if m > best_mean:
                    best_mean = m
                    best_comb = (key, m, len(group))
            if best_comb:
                cprint(f"\n  >>> BEST COMBINATION: {best_comb[0][0]} + "
                       f"{best_comb[0][1]} pretreatment — "
                       f"{best_comb[1]:.1f} g/L glucose (mean, n={best_comb[2]})",
                       Fore.GREEN, Style.BRIGHT)
            cprint(f"      All substrate results:", Fore.WHITE, Style.DIM)
            for key in sorted(by_key):
                group = by_key[key]
                gluc = [float(g.get("Glucose_g_L", 0)) for g in group]
                m = sum(gluc) / len(gluc)
                cprint(f"        {key[0]:<20} {key[1]:<10} {m:>5.1f} g/L avg", Fore.WHITE)

        elif fname == "glucose_calibration.csv":
            xv, yv = [], []
            for r in rows:
                try:
                    xv.append(float(r.get("Glucose_mM", 0)))
                    yv.append(float(r.get("Absorbance_540nm", 0)))
                except ValueError:
                    pass
            if len(xv) >= 2:
                slope, intercept, r2 = linear_regression(xv, yv)
                cprint(f"\n  >>> LINEAR REGRESSION: y = {slope:.6f}x + {intercept:.6f}",
                       Fore.GREEN, Style.BRIGHT)
                cprint(f"      R² = {r2:.6f}   (n = {len(xv)})", Fore.GREEN)
                cprint(f"      Equation: Abs_540 = {slope:.4f} × [Glucose] + {intercept:.4f}",
                       Fore.WHITE, Style.DIM)
            else:
                cprint("  (insufficient data points for regression)", Fore.YELLOW)

    cprint(f"\n  {'═' * 56}", Fore.CYAN)
    cprint("  ✅ Analysis complete. All 4 CSV files processed.", Fore.GREEN, Style.BRIGHT)


def action_lab_notebook():
    text = read_file(NOTEBOOK_PATH)
    if text is None:
        cprint("  [ERROR] LAB-NOTEBOOK.md not found.", Fore.RED)
        return

    entries = []
    for line in text.split("\n"):
        if line.startswith("| ") and "Entry" in line and "|" in line[3:]:
            parts = [p.strip() for p in line.split("|") if p.strip()]
            if len(parts) >= 2 and parts[0].isdigit():
                num = int(parts[0])
                title = parts[1] if len(parts) > 1 else "?"
                date_range = parts[2] if len(parts) > 2 else "?"
                entries.append((num, title, date_range))

    if not entries:
        cprint("  No experiment entries found in notebook.", Fore.YELLOW)
        return

    cprint("\n  📓  LAB NOTEBOOK — EXPERIMENT REGISTRY", Fore.YELLOW, Style.BRIGHT)
    cprint(f"  {'─' * 50}", Fore.CYAN)
    for num, title, dr in entries:
        cprint(f"    [{num:>2}]  {title:<50}  {dr}", Fore.WHITE)
    cprint(f"  {'─' * 50}", Fore.CYAN)

    show_bottom_nav()
    inp = input("\n  Enter experiment number to view: ").strip()
    if inp in ("b", "q"):
        return
    try:
        sel = int(inp)
    except ValueError:
        return

    match = [e for e in entries if e[0] == sel]
    if not match:
        cprint(f"  No entry #{sel}.", Fore.RED)
        return

    num, title, dr = match[0]
    header = f"Entry {num}: {title} ({dr})"
    cprint(f"\n  ╔{'═' * 54}╗", Fore.MAGENTA)
    cprint(f"  ║  {header.ljust(52)}║", Fore.MAGENTA)
    cprint(f"  ╚{'═' * 54}╝", Fore.MAGENTA)

    lines = text.split("\n")
    in_entry = False
    next_entry_num = num + 1
    entry_lines = []
    for line in lines:
        stripped = line.strip()
        if f"## Entry {num}:" in line or f"## Entry {num} " in line:
            in_entry = True
            continue
        if in_entry:
            if stripped.startswith("## Entry") and any(
                f"## Entry {n}" in line for n in range(next_entry_num, 20)
            ):
                break
            if stripped.startswith("---") and len(stripped) >= 3:
                continue
            entry_lines.append(line)

    content = "\n".join(entry_lines).strip()
    short = "\n".join(content.split("\n")[:60])
    print(f"\n{short}")
    if len(content.split("\n")) > 60:
        print("\n... [entry continues; full text in LAB-NOTEBOOK.md]")


def action_unbounded_vision():
    text = read_file(MANIFESTO)
    if text is None:
        cprint("  [ERROR] MANIFESTO.md not found.", Fore.RED)
        return
    cprint("\n  📡  UNBOUNDED — THE VISION", Fore.YELLOW, Style.BRIGHT)

    lines = text.split("\n")
    idx_cats = next((i for i, ln in enumerate(lines) if ln.strip().startswith("### 4.")), len(lines))
    idx_trans = next((i for i, ln in enumerate(lines) if ln.strip().startswith("### 5.")), len(lines))
    idx_tech = next((i for i, ln in enumerate(lines) if ln.strip().startswith("### 7.")), len(lines))

    preamble = "\n".join(lines[:idx_cats]).strip()
    display_subsection("THE MANIFESTO — CORE PASSAGES", preamble[:1200] + ("\n..." if len(preamble) > 1200 else ""))

    aeon_lines = [ln for ln in lines[idx_cats:idx_trans] if ln.strip()]
    aeon_short = "\n".join(aeon_lines[:35])
    display_subsection("AEON — THE CONCEPT", aeon_short[:1000])

    cat_lines = [ln for ln in lines[idx_trans:idx_tech] if ln.strip()]
    cat_display = "\n".join(cat_lines[:45])
    display_subsection("THE 11 CONTENT CATEGORIES", cat_display[:1200])

    cprint("\n    Category listing:", Fore.YELLOW)
    cat_names = [
        ("4.1", "The Unwelcome — suppressed knowledge brought to light"),
        ("4.2", "Build Everything — learn by doing with a master"),
        ("4.3", "The Living Debate — AI-moderated Socratic dialogue"),
        ("4.4", "Memory Palace — walk through the history of an idea"),
        ("4.5", "The Oracle — ask any question, receive a journey"),
        ("4.6", "Fringe — the edge of human knowledge, live"),
        ("4.7", "The Mirror — you are the content"),
        ("4.8", "World Forge — create a civilization"),
        ("4.9", "Harmonics — knowledge through pattern and rhythm"),
        ("4.10", "The Crossroads — where domains collide"),
        ("4.11", "Time Capsule — send knowledge across your timeline"),
    ]
    for cid, cdesc in cat_names:
        cprint(f"      [{cid}] {cdesc}", Fore.WHITE)

    rev_text = "\n".join([ln for ln in lines[idx_tech:] if ln.strip()][:20])
    display_subsection("REVENUE MODEL — SUSTAINABLE, NOT EXTRACTIVE", rev_text[:800])


def action_calls_to_action():
    if not CALLS_DIR.exists():
        cprint("  [ERROR] Calls directory not found.", Fore.RED)
        return
    files = sorted(CALLS_DIR.glob("*.md"))
    if not files:
        cprint("  No call files found.", Fore.YELLOW)
        return

    cprint("\n  📯  CALLS TO ACTION", Fore.YELLOW, Style.BRIGHT)
    for i, f in enumerate(files, 1):
        name = f.stem.replace("-", " ").title()
        cprint(f"    [{i}] {name}", Fore.WHITE)
    show_bottom_nav()
    inp = input("\n  Pick a call to read: ").strip()
    if inp in ("b", "q"):
        return
    try:
        idx = int(inp) - 1
        if 0 <= idx < len(files):
            text = read_file(files[idx])
            if text:
                display_subsection(files[idx].stem.replace("-", " ").upper(),
                                   "\n".join(text.split("\n")[:40]))
        else:
            cprint("  Invalid selection.", Fore.RED)
    except ValueError:
        pass


def action_investor_materials():
    if not PRESENTATIONS_DIR.exists():
        cprint("  [ERROR] Presentations directory not found.", Fore.RED)
        return
    files = sorted(PRESENTATIONS_DIR.glob("*.md"))
    if not files:
        cprint("  No presentation files found.", Fore.YELLOW)
        return

    cprint("\n  🎤  INVESTOR MATERIALS", Fore.YELLOW, Style.BRIGHT)
    for i, f in enumerate(files, 1):
        name = f.stem.replace("-", " ").title()
        cprint(f"    [{i}] {name}", Fore.WHITE)
    show_bottom_nav()
    inp = input("\n  Pick a document to read: ").strip()
    if inp in ("b", "q"):
        return
    try:
        idx = int(inp) - 1
        if 0 <= idx < len(files):
            text = read_file(files[idx])
            if text:
                display_subsection(files[idx].stem.replace("-", " ").upper(),
                                   "\n".join(text.split("\n")[:50]))
        else:
            cprint("  Invalid selection.", Fore.RED)
    except ValueError:
        pass


def action_cross_project():
    cprint("\n  🔗  CROSS-PROJECT CONNECTIONS", Fore.YELLOW, Style.BRIGHT)
    summary_text = read_file(MASTER_SUMMARY)
    if summary_text:
        sec6 = summary_text.split("## 6.")[-1] if "## 6." in summary_text else ""
        if sec6:
            display_subsection("SHARED INFRASTRUCTURE & DEPENDENCIES", sec6[:1000])
        else:
            cprint("  (Integrated infrastructure section not found in master summary)", Fore.YELLOW)

    revenue_flow = (
        "\n    Enzyme Production (Biofuel)\n"
        "        ├── Cellulase kits → Research/Industry sales (₱260M)\n"
        "        └── Fermentation residue → Animal feed supplement (Farming)\n"
        "    Pest Control Products (₱37M)\n"
        "        ├── NaturalPest Guard Pro → Agricultural market\n"
        "        └── UrbanSafe → Urban pest management\n"
        "    Termite Farming (₱22M)\n"
        "        ├── Protein meal → Animal feed\n"
        "        └── Live specimens → Research supply\n"
    )
    display_subsection("INTEGRATED REVENUE FLOW", revenue_flow)

    shared = (
        "  Shared Resources:\n"
        "    • Lab: Single molecular biology / enzyme assay lab for all 3 projects\n"
        "    • Field: Southern Luzon, Philippines location for collection + farming research\n"
        "    • Data: Common CSV + Python analysis pipeline across all experiments\n"
        "    • Regulatory: One FDA pathway for pest control establishes precedent\n"
    )
    cprint(shared, Fore.CYAN)

    cross_text = read_file(CROSS_VERIFY)
    if cross_text:
        if "## 6. Project Experimental Results" in cross_text:
            table_section = cross_text.split("## 6. Project Experimental Results")[-1]
            table_section = table_section.split("## 7.")[0] if "## 7." in table_section else table_section
            display_subsection("EXPERIMENT vs LITERATURE COMPARISON", table_section.strip()[:1200])
        else:
            full_verify = "\n".join(cross_text.split("\n")[:35])
            display_subsection("CROSS-VERIFICATION OVERVIEW", full_verify)

    cprint("\n  Cross-Dependency Matrix:", Fore.YELLOW, Style.BRIGHT)
    deps = (
        "    Biofuel (isolation) → Pest Control: Gut bacterial isolates for bioactives\n"
        "    Biofuel (enzyme)    → Farming:     Fungal cellulase for feed pretreatment\n"
        "    Farming (colonies)  → Biofuel:     Continuous supply of termite specimens\n"
        "    Farming (substrate) → Biofuel:     Agricultural waste for hydrolysis tests\n"
        "    Pest Control (form.)→ Farming:     IPM-compatible termiticides for farm\n"
    )
    cprint(deps, Fore.WHITE)


def action_open_portal():
    cprint("\n  🌱  PORTAL", Fore.YELLOW, Style.BRIGHT)
    portal_path_str = str(PORTAL_HTML.resolve())
    cprint(f"  Portal file: {portal_path_str}", Fore.GREEN)
    if PORTAL_HTML.exists():
        portal_uri = PORTAL_HTML.resolve().as_uri()
        cprint(f"  Portal URI: {portal_uri}", Fore.GREEN)
        cprint("  Attempting to open in browser...", Fore.CYAN)
        try:
            webbrowser.open(portal_uri)
            cprint("  ✅ Browser launched.", Fore.GREEN)
        except Exception as e:
            cprint(f"  ⚠ Could not launch browser: {e}", Fore.YELLOW)
    else:
        cprint(f"  Portal file not found at:\n    {portal_path_str}", Fore.RED)


def action_help_about():
    cprint("\n  ❓  HELP / ABOUT", Fore.YELLOW, Style.BRIGHT)
    border = "  ┌────────────────────────────────────────────────────────────┐"
    border_end = "  └────────────────────────────────────────────────────────────┘"
    about = (
        f"  {border}\n"
        f"  │  UNBOUNDED GATEWAY  v1.0                                     │\n"
        f"  │  A unified CLI for the Termite Project and UNBOUNDED vision  │\n"
        f"  {border_end}\n"
        "\n"
        "  This gateway ties together two worlds — grounded experimental\n"
        "  science and an audacious vision for the future of media.\n"
        "\n"
        "  🐛  THE TERMITE PROJECT\n"
        "  Three interconnected research initiatives rooted in the\n"
        "  Philippines:\n"
        "    • Biofuel Research — termite gut bacteria that convert\n"
        "      agricultural waste into ethanol (10.8 g/L achieved)\n"
        "    • Natural Pest Control — essential oil blends and\n"
        "      biological formulations with up to 100% efficacy\n"
        "    • Termite Farming — captive colony rearing for protein\n"
        "      meal, chitin, and research supply\n"
        "\n"
        "  📡  UNBOUNDED (AEON)\n"
        "  A New Media Manifesto that declares the death of scripted,\n"
        "  passive entertainment and the birth of living, participatory,\n"
        "  knowledge-based media. AEON (Always Evolving, Open, Networked)\n"
        "  is the proposed platform: procedurally-generated sessions\n"
        "  that teach, engage, and transform — no two visits the same.\n"
        "\n"
        "  ✦  THE STORY\n"
        "  This began under the soil of Southern Luzon, Philippines, where termite\n"
        "  mounds hid a biological engine 250 million years in the making.\n"
        "  From those mounds came 7 bacterial strains, a patented enzyme\n"
        "  cocktail, and a co-culture producing ethanol at 95% of\n"
        "  theoretical yield.\n"
        "\n"
        "  But the same curiosity that drives a scientist to ask \"what\n"
        "  can this insect teach us?\" drives a creator to ask \"what can\n"
        "  media become?\" The termite project proved that nature's\n"
        "  solutions outperform our engineered ones. UNBOUNDED asks the\n"
        "  same question about media: what if the old scripts are just\n"
        "  cages we haven't questioned yet?\n"
        "\n"
        "  ✦  THE PHILOSOPHY\n"
        "  Information and entertainment are not separate. They never\n"
        "  were. The old media split them because it was profitable —\n"
        "  entertainment keeps you watching; information can set you\n"
        "  free. UNBOUNDED reunites them. Deep knowledge becomes the\n"
        "  most gripping show. Creation becomes as natural as\n"
        "  consumption. The line between viewer and broadcaster\n"
        "  dissolves.\n"
        "\n"
        "  ✦  THE CALL\n"
        "  Build. Code. Write. Design. Compose. Question. Create.\n"
        "  The old guard is dying. The script is dead. Living knowledge\n"
        "  is waiting to be born.\n"
        "\n"
        "  Come build the new age.\n"
        "\n"
        "  Keys:  [b] Back to menu  [q] Quit from anywhere  [0] Exit"
    )
    print(f"\n{about}")


def show_menu():
    cprint(f"\n    {'─' * 48}", Fore.CYAN)
    cprint("    MAIN MENU", Fore.YELLOW, Style.BRIGHT)
    cprint(f"    {'─' * 48}", Fore.CYAN)
    items = [
        ("1", "🔬  Termite Project — Full Summary"),
        ("2", "📊  Analyze Experimental Data (CSV)"),
        ("3", "📓  Read Lab Notebook"),
        ("4", "📡  UNBOUNDED — The Vision"),
        ("5", "📯  Calls to Action"),
        ("6", "🎤  Investor Materials"),
        ("7", "🔗  Cross-Project Connections"),
        ("8", "🌱  Portal — Open Interactive Website"),
        ("9", "❓  Help / About"),
        ("0", "✦   Exit"),
    ]
    for key, desc in items:
        cprint(f"    {key:<3} {desc}", Fore.WHITE)
    cprint(f"    {'─' * 48}", Fore.CYAN)


def main():
    clear_screen()
    show_splash()
    input("  Press Enter to continue...")
    clear_screen()

    while True:
        clear_screen()
        show_splash()
        show_menu()
        choice = input("  Select an option: ").strip().lower()

        if choice == "0" or choice == "q":
            cprint("\n  ✦  Until the soil calls again. Farewell.\n", Fore.GREEN, Style.BRIGHT)
            sys.exit(0)
        elif choice == "1":
            action_termite_summary()
        elif choice == "2":
            action_analyze_data()
        elif choice == "3":
            action_lab_notebook()
        elif choice == "4":
            action_unbounded_vision()
        elif choice == "5":
            action_calls_to_action()
        elif choice == "6":
            action_investor_materials()
        elif choice == "7":
            action_cross_project()
        elif choice == "8":
            action_open_portal()
        elif choice == "9":
            action_help_about()
        else:
            cprint("  Invalid selection.", Fore.RED)

        if choice not in ("0", "q"):
            input("\n  Press Enter to return to menu...")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        cprint("\n\n  ✦  Interrupted. Farewell.\n", Fore.GREEN)
        sys.exit(0)
