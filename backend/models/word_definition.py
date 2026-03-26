from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class WordDefinition(Base):
    __tablename__ = "word_definitions"
    __table_args__ = (UniqueConstraint("word", "language_code", name="uq_worddef_word_lang"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    word: Mapped[str] = mapped_column(String, nullable=False)
    language_code: Mapped[str] = mapped_column(
        String, ForeignKey("languages.code", onupdate="CASCADE"), nullable=False, default="en"
    )
    phonetics: Mapped[str | None] = mapped_column(String, nullable=True)
    part_of_speech: Mapped[str | None] = mapped_column(String, nullable=True)
    definition: Mapped[str | None] = mapped_column(Text, nullable=True)
    example: Mapped[str | None] = mapped_column(Text, nullable=True)
    synonyms: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array string
    raw_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    cached_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    language: Mapped["Language"] = relationship(back_populates="word_definitions")
