from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Language(Base):
    __tablename__ = "languages"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    native_name: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    articles: Mapped[list["Article"]] = relationship(back_populates="language")
    vocabulary: Mapped[list["Vocabulary"]] = relationship(back_populates="language")
    word_definitions: Mapped[list["WordDefinition"]] = relationship(back_populates="language")
