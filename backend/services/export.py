"""
services/export.py

Exports vocabulary as CSV.
Columns: word, language_code, definition, part_of_speech, phonetics, tag, notes, date_saved
"""
import csv
import io

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from models.vocabulary import Vocabulary


async def export_vocabulary_csv(
    db: AsyncSession,
    language_code: str | None = None,
) -> str:
    """
    Returns CSV string of vocabulary entries.
    If language_code is provided, filters to that language only.
    If None, exports all languages.
    """
    stmt = (
        select(Vocabulary)
        .options(selectinload(Vocabulary.tag))
        .order_by(Vocabulary.language_code, Vocabulary.word)
    )
    if language_code is not None:
        stmt = stmt.where(Vocabulary.language_code == language_code)

    result = await db.execute(stmt)
    rows = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["word", "language_code", "definition", "part_of_speech", "phonetics", "tag", "notes", "date_saved"]
    )
    for row in rows:
        writer.writerow([
            row.word,
            row.language_code,
            row.definition or "",
            row.part_of_speech or "",
            row.phonetics or "",
            row.tag.name if row.tag else "",
            row.notes or "",
            row.created_at.strftime("%Y-%m-%d") if row.created_at else "",
        ])

    return output.getvalue()
