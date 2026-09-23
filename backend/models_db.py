import json
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
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
