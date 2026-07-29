import re
from datetime import datetime
from typing import Any, Dict, List
import ftfy

def clean_text_field(text_val: Any) -> str:
    """
    Cleans broken Unicode formatting, mojibake, and extra whitespace using ftfy.
    """
    if text_val is None:
        return ""
    if not isinstance(text_val, str):
        text_val = str(text_val)
    
    # Fix broken encoding with ftfy
    fixed = ftfy.fix_text(text_val)
    # Strip unnecessary trailing/leading whitespace
    return fixed.strip()

def parse_deadline_days(val: Any) -> int:
    """
    Safely parses scheme deadline into integer days remaining.
    Handles integers, floats, ISO date strings (e.g. '2026-08-30'), 'Expired', or None.
    """
    if val is None:
        return 30  # Default fallback window

    if isinstance(val, (int, float)):
        return max(1, int(val))

    if isinstance(val, str):
        val_str = val.strip()
        
        # If it's a numeric string
        if val_str.isdigit():
            return max(1, int(val_str))
            
        if val_str.lower() in ["expired", "closed"]:
            return 1

        # Attempt to parse ISO date string (YYYY-MM-DD)
        date_match = re.search(r'\d{4}-\d{2}-\d{2}', val_str)
        if date_match:
            try:
                target_date = datetime.strptime(date_match.group(0), "%Y-%m-%d")
                delta = (target_date - datetime.now()).days
                return max(1, delta)
            except Exception:
                return 15

    return 30

def sanitize_scheme_object(scheme: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitizes all scheme text fields, cleans Unicode, parses deadline,
    and guarantees presence of essential fallback fields to prevent 500 errors.
    """
    cleaned = dict(scheme)

    cleaned["id"] = str(cleaned.get("id", "UNKNOWN"))
    cleaned["name"] = clean_text_field(cleaned.get("name", "Untitled Scheme"))
    cleaned["shortName"] = clean_text_field(cleaned.get("shortName", cleaned["name"]))
    cleaned["domain"] = clean_text_field(cleaned.get("domain", "all")).lower()
    
    cleaned["description"] = clean_text_field(cleaned.get("description", ""))
    cleaned["description_mr"] = clean_text_field(cleaned.get("description_mr", cleaned["description"]))
    
    cleaned["benefit_display"] = clean_text_field(cleaned.get("benefit_display", "Financial Benefit"))
    cleaned["benefit_display_mr"] = clean_text_field(cleaned.get("benefit_display_mr", cleaned["benefit_display"]))
    
    # Financial Benefit Amount (default 0.0 if missing/null)
    raw_benefit = cleaned.get("benefit_amount")
    try:
        cleaned["benefit_amount"] = float(raw_benefit) if raw_benefit is not None else 0.0
    except (ValueError, TypeError):
        cleaned["benefit_amount"] = 0.0

    # Deadline Parsing
    cleaned["deadline_days"] = parse_deadline_days(cleaned.get("deadline_days"))

    # Required Documents Array
    raw_docs = cleaned.get("required_documents")
    if isinstance(raw_docs, list):
        cleaned["required_documents"] = [clean_text_field(d) for d in raw_docs if d]
    else:
        cleaned["required_documents"] = ["Aadhaar Card"]

    # Mutually Exclusive With Array
    raw_excl = cleaned.get("mutually_exclusive_with")
    cleaned["mutually_exclusive_with"] = list(raw_excl) if isinstance(raw_excl, list) else []

    # Rules Array
    raw_rules = cleaned.get("rules")
    cleaned["rules"] = list(raw_rules) if isinstance(raw_rules, list) else []

    # Application Steps
    raw_steps = cleaned.get("application_steps")
    if isinstance(raw_steps, list):
        cleaned["application_steps"] = [clean_text_field(s) for s in raw_steps if s]
    else:
        cleaned["application_steps"] = ["Submit application on official portal."]

    raw_steps_mr = cleaned.get("application_steps_mr")
    if isinstance(raw_steps_mr, list):
        cleaned["application_steps_mr"] = [clean_text_field(s) for s in raw_steps_mr if s]
    else:
        cleaned["application_steps_mr"] = cleaned["application_steps"]

    cleaned["official_url"] = str(cleaned.get("official_url", "https://myscheme.gov.in"))

    return cleaned
