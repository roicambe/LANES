from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Address(Base):
    """
    Address model mapped to a user's profile.
    """
    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id"), unique=True, index=True)
    house_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    street: Mapped[str | None] = mapped_column(String(255), nullable=True)
    barangay: Mapped[str] = mapped_column(String(100))
    city_municipality: Mapped[str] = mapped_column(String(100))
    province: Mapped[str] = mapped_column(String(100))
    postal_code: Mapped[str] = mapped_column(String(20))
    country: Mapped[str] = mapped_column(String(100), default="Philippines")

    # Relationships
    profile: Mapped["Profile"] = relationship("Profile", back_populates="address")
