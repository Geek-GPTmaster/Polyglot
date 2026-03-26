from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    language_code: Mapped[str] = mapped_column(
        String, ForeignKey("languages.code", onupdate="CASCADE"), nullable=False, default="en"
    )
    word_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    source_format: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    last_read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scroll_position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    language: Mapped["Language"] = relationship(back_populates="articles")
    vocabulary: Mapped[list["Vocabulary"]] = relationship(back_populates="source_article")
    saves: Mapped[list["Save"]] = relationship(back_populates="article", cascade="all, delete-orphan")
