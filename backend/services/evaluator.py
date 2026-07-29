from typing import List, Dict, Any, Tuple
from models import UserProfile

def safe_float(val: Any, default: float = 0.0) -> float:
    """Safely converts input value to float without throwing ValueError/TypeError."""
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

def evaluate_rule_condition(profile_dict: Dict[str, Any], rule: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Evaluates a single dynamic rule predicate against user profile data dict safely.
    Missing user profile traits default to non-disqualifying checks.
    """
    try:
        field = rule.get("field")
        if not field:
            return True, ""

        operator = str(rule.get("operator", "==")).upper()
        target_val = rule.get("value")

        user_val = profile_dict.get(field)
        
        # Null safeguard: If attribute is missing or None in profile dict, default to non-disqualifying check
        if user_val is None:
            return True, ""

        satisfied = True
        reason = ""

        if operator == "<=":
            u_num = safe_float(user_val)
            t_num = safe_float(target_val)
            if u_num > t_num:
                satisfied = False
                reason = f"Value of '{field}' ({user_val}) exceeds limit of {target_val}."
        elif operator == ">=":
            u_num = safe_float(user_val)
            t_num = safe_float(target_val)
            if u_num < t_num:
                satisfied = False
                reason = f"Value of '{field}' ({user_val}) below minimum required threshold of {target_val}."
        elif operator == "==":
            u_str = str(user_val).strip().lower()
            t_str = str(target_val).strip().lower()
            if field == "domain" and (u_str == "both" or t_str == "both"):
                satisfied = True
            elif u_str != t_str:
                satisfied = False
                reason = f"Value of '{field}' ('{user_val}') does not match required value '{target_val}'."
        elif operator == "!=":
            u_str = str(user_val).strip().lower()
            t_str = str(target_val).strip().lower()
            if u_str == t_str:
                satisfied = False
                reason = f"Value of '{field}' cannot be '{target_val}'."
        elif operator == "IN":
            if isinstance(target_val, list):
                target_str_list = [str(x).strip().lower() for x in target_val]
                user_val_str = str(user_val).strip().lower()
                
                # Domain 'both' or matching domain list
                if field == "domain" and (user_val_str == "both" or "both" in target_str_list):
                    satisfied = True
                elif user_val_str not in target_str_list and "all" not in target_str_list and "pan-india / all" not in target_str_list:
                    satisfied = False
                    reason = f"Value of '{field}' ('{user_val}') not in allowed list ({', '.join(map(str, target_val))})."
            elif isinstance(user_val, list):
                user_str_list = [str(x).strip().lower() for x in user_val]
                target_str = str(target_val).strip().lower()
                if target_str not in user_str_list:
                    satisfied = False
                    reason = f"Target value '{target_val}' not found in user '{field}'."
        elif operator == "NOT_IN":
            if isinstance(target_val, list):
                target_str_list = [str(x).strip().lower() for x in target_val]
                if str(user_val).strip().lower() in target_str_list:
                    satisfied = False
                    reason = f"Value of '{field}' ('{user_val}') is restricted."
        elif operator == "CONTAINS":
            if str(target_val).strip().lower() not in str(user_val).strip().lower():
                satisfied = False
                reason = f"Field '{field}' must contain '{target_val}'."
        elif operator == "BETWEEN":
            if isinstance(target_val, list) and len(target_val) == 2:
                min_v, max_v = safe_float(target_val[0]), safe_float(target_val[1])
                val_f = safe_float(user_val)
                if not (min_v <= val_f <= max_v):
                    satisfied = False
                    reason = f"Field '{field}' ({user_val}) outside allowed range ({min_v} to {max_v})."

        return satisfied, reason
    except Exception as e:
        # Fallback to non-disqualifying check on unexpected error
        return True, ""

def evaluate_scheme_eligibility(profile: UserProfile, scheme: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Evaluates a scheme against user profile dynamically with full null safeguards.
    """
    if profile is None:
        return False, ["User profile payload is empty."]

    profile_dict = profile.model_dump() if hasattr(profile, 'model_dump') else profile.dict()
    reasons = []

    # 1. Evaluate Dynamic Rules Array from JSON
    rules = scheme.get("rules", [])
    for rule in rules:
        satisfied, reason = evaluate_rule_condition(profile_dict, rule)
        if not satisfied:
            reasons.append(reason)

    is_eligible = (len(reasons) == 0)
    return is_eligible, reasons
