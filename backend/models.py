from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class UserProfile(BaseModel):
    annual_income: Optional[float] = Field(0.0, description="Annual family income in INR")
    category: Optional[str] = Field("General", description="General, OBC, SC, ST, EWS")
    state: Optional[str] = Field("All", description="User domicile state (e.g. Maharashtra, Pan-India / All)")
    age: Optional[int] = Field(25, description="Age in years")
    land_acres: Optional[float] = Field(0.0, description="Land holding size in acres")
    occupation: Optional[str] = Field("Farmer", description="Farmer, Small Farmer, Marginal Farmer, etc.")
    owned_documents: Optional[List[str]] = Field(default_factory=list, description="List of documents user currently possesses")

class RuleCondition(BaseModel):
    field: str
    operator: str  # "<=", ">=", "==", "!=", "IN", "NOT_IN", "CONTAINS", "BETWEEN"
    value: Any

class SchemeModel(BaseModel):
    id: str
    name: str
    shortName: str
    department: Optional[str] = Field("Government of India", description="Ministry or Nodal Department")
    quota_type: Optional[str] = Field("Central Sector Scheme (100% Central)", description="Central vs State Funding Quota")
    rules: List[RuleCondition] = []
    category_target: List[str] = ["General", "OBC", "SC", "ST", "EWS"]
    benefit_amount: float = 0.0
    benefit_type: str = "Direct Cash Transfer"
    benefit_display: str = ""
    benefit_display_mr: Optional[str] = None
    deadline_days: int = 30
    deadline_date: Optional[str] = None
    official_url: str = "https://myscheme.gov.in"
    required_documents: List[str] = []
    documents_required: Optional[List[str]] = None
    mutually_exclusive_with: List[str] = []
    description: str = ""
    description_mr: Optional[str] = None
    application_steps: List[str] = []
    application_steps_mr: List[str] = []

class DocumentOverlapInsight(BaseModel):
    document_name: str
    canonical_group: str
    unlocked_schemes_count: int
    scheme_names: List[str]
    is_owned: bool
    efficiency_tag: str

class SchemeConflict(BaseModel):
    primary_scheme_id: str
    secondary_scheme_id: str
    primary_scheme_name: str
    secondary_scheme_name: str
    financial_difference: float
    reason_en: str
    reason_mr: str

class RankedScheme(BaseModel):
    scheme: Dict[str, Any]
    composite_score: float
    priority_tier: str  # "High Priority", "Medium Priority", "Low Priority"
    benefit_score: float
    urgency_score: float
    readiness_score: float
    missing_documents: List[str]
    owned_documents_count: int
    total_documents_count: int
    is_mutually_exclusive_secondary: bool = False
    conflict_warning: Optional[str] = None

class EvaluationResponse(BaseModel):
    total_eligible_schemes: int
    total_potential_benefit: float
    formatted_potential_benefit: str
    document_readiness_pct: float
    ranked_schemes: List[RankedScheme]
    ineligible_schemes: List[Dict[str, Any]]
    document_insights: List[DocumentOverlapInsight]
    high_leverage_callouts: List[str]
    conflicts_detected: List[SchemeConflict]
    action_checklist: List[Dict[str, Any]]

class FeedbackRequest(BaseModel):
    scheme_id: Optional[str] = None
    rating: str = Field(..., description="'up' or 'down'")
    comment: Optional[str] = ""

class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Email address or Phone number")
    password: str = Field(..., description="Account password")
    method: Optional[str] = Field("phone", description="'phone' or 'email'")

class SignupRequest(BaseModel):
    name: str = Field(..., description="Full Name")
    identifier: str = Field(..., description="Email address or Phone number")
    password: str = Field(..., description="Account password")
    method: Optional[str] = Field("phone", description="'phone' or 'email'")
    role: Optional[str] = Field("Farmer", description="'Farmer'")
    profileAttributes: Optional[Dict[str, Any]] = None

class AuthResponse(BaseModel):
    status: str = "success"
    token: str
    user: Dict[str, Any]
