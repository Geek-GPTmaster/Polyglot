"""initial

Revision ID: 0c17b0bf59c9
Revises:
Create Date: 2026-03-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0c17b0bf59c9"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # languages — must be created first; all other tables FK to it
    op.create_table(
        "languages",
        sa.Column("code", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("native_name", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="false"),
    )

    # tags
    op.create_table(
        "tags",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # articles
    op.create_table(
        "articles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "language_code",
            sa.String(),
            sa.ForeignKey("languages.code", onupdate="CASCADE"),
            nullable=False,
            server_default="en",
        ),
        sa.Column("word_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("source_format", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column("last_read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scroll_position", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("idx_articles_language", "articles", ["language_code"])

    # vocabulary
    op.create_table(
        "vocabulary",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("word", sa.String(), nullable=False),
        sa.Column(
            "language_code",
            sa.String(),
            sa.ForeignKey("languages.code", onupdate="CASCADE"),
            nullable=False,
            server_default="en",
        ),
        sa.Column("definition", sa.Text(), nullable=True),
        sa.Column("phonetics", sa.String(), nullable=True),
        sa.Column("part_of_speech", sa.String(), nullable=True),
        sa.Column("example", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "tag_id",
            sa.Integer(),
            sa.ForeignKey("tags.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("ease_factor", sa.Float(), nullable=False, server_default="2.5"),
        sa.Column("interval_days", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("repetitions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "next_review_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "source_article_id",
            sa.Integer(),
            sa.ForeignKey("articles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("word", "language_code", name="uq_vocabulary_word_lang"),
    )
    op.create_index("idx_vocabulary_next_review", "vocabulary", ["next_review_at"])
    op.create_index("idx_vocabulary_tag", "vocabulary", ["tag_id"])
    op.create_index("idx_vocabulary_language", "vocabulary", ["language_code"])

    # word_definitions
    op.create_table(
        "word_definitions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("word", sa.String(), nullable=False),
        sa.Column(
            "language_code",
            sa.String(),
            sa.ForeignKey("languages.code", onupdate="CASCADE"),
            nullable=False,
            server_default="en",
        ),
        sa.Column("phonetics", sa.String(), nullable=True),
        sa.Column("part_of_speech", sa.String(), nullable=True),
        sa.Column("definition", sa.Text(), nullable=True),
        sa.Column("example", sa.Text(), nullable=True),
        sa.Column("synonyms", sa.Text(), nullable=True),
        sa.Column("raw_response", sa.Text(), nullable=True),
        sa.Column(
            "cached_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("word", "language_code", name="uq_worddef_word_lang"),
    )
    op.create_index(
        "idx_word_definitions_word_lang", "word_definitions", ["word", "language_code"]
    )

    # saves
    op.create_table(
        "saves",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "article_id",
            sa.Integer(),
            sa.ForeignKey("articles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("saved_text", sa.Text(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("char_start", sa.Integer(), nullable=True),
        sa.Column("char_end", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )
    op.create_index("idx_saves_article", "saves", ["article_id"])

    # review_logs
    op.create_table(
        "review_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "vocabulary_id",
            sa.Integer(),
            sa.ForeignKey("vocabulary.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("result", sa.String(), nullable=False),
        sa.Column(
            "reviewed_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )
    op.create_index("idx_review_logs_date", "review_logs", ["reviewed_at"])

    # app_settings
    op.create_table(
        "app_settings",
        sa.Column("key", sa.String(), primary_key=True),
        sa.Column("value", sa.String(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("app_settings")
    op.drop_index("idx_review_logs_date", table_name="review_logs")
    op.drop_table("review_logs")
    op.drop_index("idx_saves_article", table_name="saves")
    op.drop_table("saves")
    op.drop_index("idx_word_definitions_word_lang", table_name="word_definitions")
    op.drop_table("word_definitions")
    op.drop_index("idx_vocabulary_language", table_name="vocabulary")
    op.drop_index("idx_vocabulary_tag", table_name="vocabulary")
    op.drop_index("idx_vocabulary_next_review", table_name="vocabulary")
    op.drop_table("vocabulary")
    op.drop_index("idx_articles_language", table_name="articles")
    op.drop_table("articles")
    op.drop_table("tags")
    op.drop_table("languages")
