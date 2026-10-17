import json
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Float, JSON
from sqlalchemy.dialects.postgresql import JSONB
from db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="Farmer")
    created_at = Column(DateTime, default=datetime.utcnow)
    _profile_attributes = Column("profile_attributes", Text, nullable=True)

    @property
    def profile_attributes(self):
        if not self._profile_attributes:
            return {}
        try:
            return json.loads(self._profile_attributes)
        except Exception:
            return {}

    @profile_attributes.setter
    def profile_attributes(self, value):
        if value is None:
            self._profile_attributes = json.dumps({})
        elif isinstance(value, str):
            self._profile_attributes = value
        else:
            self._profile_attributes = json.dumps(value)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "profileAttributes": self.profile_attributes
        }

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(String, primary_key=True, index=True)
    scheme_id = Column(String, nullable=True)
    rating = Column(String, nullable=False)
    comment = Column(Text, nullable=True)
    feedback_text = Column(Text, nullable=True)
    user_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "scheme_id": self.scheme_id,
            "rating": self.rating,
            "comment": self.comment or self.feedback_text,
            "feedback_text": self.feedback_text or self.comment,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Scheme(Base):
    __tablename__ = "schemes"

    id                      = Column(String, primary_key=True)
    name                    = Column(Text, nullable=False)
    short_name              = Column(Text, nullable=False)
    level                   = Column(String, default="Central")
    government              = Column(Text, default="Government of India")
    government_mr           = Column(Text, nullable=True)

    rules                   = Column(JSON().with_variant(JSONB(), "postgresql"), nullable=False, default=list)
    category_target         = Column(JSON().with_variant(JSONB(), "postgresql"), nullable=False, default=list)

    benefit_amount          = Column(Float, nullable=False, default=0.0)
    benefit_type            = Column(Text, default="Direct Cash Transfer")
    benefit_display         = Column(Text, default="")
    benefit_display_mr      = Column(Text, nullable=True)

    closing_date            = Column(Text, nullable=True)   # 'YYYY-MM-DD' or None

    required_documents      = Column(JSON().with_variant(JSONB(), "postgresql"), nullable=False, default=list)
    mutually_exclusive_with = Column(JSON().with_variant(JSONB(), "postgresql"), nullable=False, default=list)

    description             = Column(Text, default="")
    description_mr          = Column(Text, nullable=True)
    application_steps       = Column(JSON().with_variant(JSONB(), "postgresql"), nullable=False, default=list)
    application_steps_mr    = Column(JSON().with_variant(JSONB(), "postgresql"), nullable=False, default=list)

    official_url            = Column(Text, default="https://myscheme.gov.in")

    created_at              = Column(DateTime, default=datetime.utcnow)
    updated_at              = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "shortName": self.short_name,     # API key compatibility
            "level": self.level,
            "government": self.government,
            "government_mr": self.government_mr,
            "rules": self.rules or [],
            "category_target": self.category_target or [],
            "benefit_amount": self.benefit_amount,
            "benefit_type": self.benefit_type,
            "benefit_display": self.benefit_display,
            "benefit_display_mr": self.benefit_display_mr,
            "closing_date": self.closing_date,
            "required_documents": self.required_documents or [],
            "mutually_exclusive_with": self.mutually_exclusive_with or [],
            "description": self.description,
            "description_mr": self.description_mr,
            "application_steps": self.application_steps or [],
            "application_steps_mr": self.application_steps_mr or [],
            "official_url": self.official_url,
        }
