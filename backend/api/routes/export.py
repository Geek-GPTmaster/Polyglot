from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from services.export import export_vocabulary_csv

router = APIRouter(prefix="/api/export", tags=["export"])


# ---------------------------------------------------------------------------
# GET /api/export/vocabulary
# ---------------------------------------------------------------------------

@router.get("/vocabulary")
async def export_vocabulary(
    language: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> Response:
    csv_content = await export_vocabulary_csv(db, language_code=language)

    filename = f"polyglot_vocabulary_{language}.csv" if language else "polyglot_vocabulary_all.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
