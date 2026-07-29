from typing import List, Dict, Any, Tuple
from models import SchemeConflict

def detect_scheme_conflicts(eligible_schemes: List[Dict[str, Any]]) -> Tuple[List[SchemeConflict], List[str]]:
    """
    Identifies mutually exclusive scheme pairs (e.g. multiple post-matric tuition scholarships).
    Recommends the higher-yielding scheme and returns conflict alerts.
    """
    conflicts: List[SchemeConflict] = []
    secondary_ids: List[str] = []

    scheme_map = {s["id"]: s for s in eligible_schemes}
    processed_pairs = set()

    for s1 in eligible_schemes:
        id1 = s1["id"]
        excl_list = s1.get("mutually_exclusive_with", [])

        for id2 in excl_list:
            if id2 in scheme_map:
                pair_key = tuple(sorted([id1, id2]))
                if pair_key in processed_pairs:
                    continue
                processed_pairs.add(pair_key)

                s2 = scheme_map[id2]
                b1 = s1.get("benefit_amount", 0.0)
                b2 = s2.get("benefit_amount", 0.0)

                if b1 >= b2:
                    primary, secondary = s1, s2
                else:
                    primary, secondary = s2, s1

                diff = abs(b1 - b2)
                secondary_ids.append(secondary["id"])

                conflict_item = SchemeConflict(
                    primary_scheme_id=primary["id"],
                    secondary_scheme_id=secondary["id"],
                    primary_scheme_name=primary["shortName"],
                    secondary_scheme_name=secondary["shortName"],
                    financial_difference=diff,
                    reason_en=f"Mutually Exclusive: '{primary['shortName']}' yields ₹{diff:,.0f} higher benefits than '{secondary['shortName']}'. Only 1 scheme can be claimed per year.",
                    reason_mr=f"परस्पर अनन्य: '{primary['shortName']}' मुळे '{secondary['shortName']}' पेक्षा ₹{diff:,.0f} जास्त फायदा मिळतो. एका वर्षात फक्त १ योजनांचा लाभ घेता येतो."
                )
                conflicts.append(conflict_item)

    return conflicts, secondary_ids
