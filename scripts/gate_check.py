#!/usr/bin/env python3
"""Deterministic gate check for bottle review rounds.
Usage: gate_check.py round-N [round-M]
Reads reference/bottle-reviews/round-N/scores.json, computes median per dimension
across 5 reviewers and the overall median/min. Gate: median >= 8.5 AND min >= 7.
With two rounds: both must pass (the two-consecutive-rounds rule).
Exit 0 = gate passed, 1 = not passed, 2 = malformed.
"""
import json
import statistics
import sys
from pathlib import Path

def load(round_name: str) -> dict:
    p = Path(__file__).parent.parent / "reference" / "bottle-reviews" / round_name / "scores.json"
    if not p.exists():
        print(f"MISSING {p}")
        sys.exit(2)
    return json.loads(p.read_text())

def check(round_name: str) -> tuple[bool, dict]:
    data = load(round_name)
    dims = ("geometry", "materials", "water", "lighting", "interaction")
    per_dim = {d: [] for d in dims}
    for reviewer, scores in data.items():
        for d in dims:
            v = scores.get(d)
            if not isinstance(v, (int, float)) or not 0 <= v <= 10:
                print(f"BAD SCORE {reviewer}.{d}={v}")
                sys.exit(2)
            per_dim[d].append(float(v))
    medians = {d: statistics.median(v) for d, v in per_dim.items()}
    overall_median = statistics.median(medians.values())
    overall_min = min(medians.values())
    passed = overall_median >= 8.5 and overall_min >= 7
    return passed, {
        "round": round_name,
        "dimension_medians": {k: round(v, 2) for k, v in medians.items()},
        "overall_median": round(overall_median, 2),
        "overall_min": round(overall_min, 2),
        "passed": passed,
    }

def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    results = [check(a) for a in sys.argv[1:]]
    for _, summary in results:
        print(json.dumps(summary, indent=2))
    ok = all(p for p, _ in results)
    print("GATE:", "PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
