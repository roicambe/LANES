from datetime import datetime, date
from sqlalchemy import String, Integer, DateTime, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Profile(Base):
    """
    Profile model for storing personal and contact details of users.
    """
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    middle_initial: Mapped[str | None] = mapped_column(String(10), nullable=True)
    suffix: Mapped[str | None] = mapped_column(String(20), nullable=True)
    contact_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    birthdate: Mapped[date | None] = mapped_column(Date, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profile")
    address: Mapped["Address"] = relationship("Address", back_populates="profile", uselist=False, cascade="all, delete-orphan")
