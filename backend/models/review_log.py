from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class ReviewLog(Base):
    __tablename__ = "review_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vocabulary_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("vocabulary.id", ondelete="CASCADE"), nullable=False
    )
    result: Mapped[str] = mapped_column(String, nullable=False)  # 'known' | 'unknown'
    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    vocabulary: Mapped["Vocabulary"] = relationship(back_populates="review_logs")
