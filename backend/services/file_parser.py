"""
services/file_parser.py

Parses uploaded files into plain text.

Supported formats:
  .txt / .md  → decode as UTF-8
  .pdf        → pdfplumber
  .docx       → python-docx
  .epub       → ebooklib + BeautifulSoup
"""
import io
from pathlib import Path


async def parse_file(filename: str, content: bytes) -> str:
    """
    Accept filename + raw bytes; return extracted plain text.

    Raises ValueError  for unsupported file formats.
    Raises RuntimeError if parsing fails unexpectedly.
    """
    ext = Path(filename).suffix.lower()

    if ext in (".txt", ".md"):
        return _parse_text(content)
    elif ext == ".pdf":
        return _parse_pdf(content)
    elif ext == ".docx":
        return _parse_docx(content)
    elif ext == ".epub":
        return _parse_epub(content)
    else:
        raise ValueError(f"Unsupported file format: '{ext}'. Supported: .txt .md .pdf .docx .epub")


# ---------------------------------------------------------------------------
# Internal parsers
# ---------------------------------------------------------------------------

def _parse_text(content: bytes) -> str:
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        # Fallback: Latin-1 never fails (every byte is valid)
        return content.decode("latin-1")


def _parse_pdf(content: bytes) -> str:
    try:
        import pdfplumber  # type: ignore
    except ImportError as exc:
        raise RuntimeError("pdfplumber is not installed") from exc

    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        return "\n".join(pages).strip()
    except Exception as exc:
        raise RuntimeError(f"PDF parsing failed: {exc}") from exc


def _parse_docx(content: bytes) -> str:
    try:
        from docx import Document  # type: ignore
    except ImportError as exc:
        raise RuntimeError("python-docx is not installed") from exc

    try:
        doc = Document(io.BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs).strip()
    except Exception as exc:
        raise RuntimeError(f"DOCX parsing failed: {exc}") from exc


def _parse_epub(content: bytes) -> str:
    try:
        import ebooklib  # type: ignore
        from ebooklib import epub
        from bs4 import BeautifulSoup  # type: ignore
    except ImportError as exc:
        raise RuntimeError("ebooklib and/or beautifulsoup4 is not installed") from exc

    try:
        book = epub.read_epub(io.BytesIO(content))
        texts: list[str] = []
        for item in book.get_items():
            if item.get_type() == ebooklib.ITEM_DOCUMENT:
                soup = BeautifulSoup(item.get_content(), "html.parser")
                text = soup.get_text(separator="\n")
                if text.strip():
                    texts.append(text.strip())
        return "\n\n".join(texts).strip()
    except Exception as exc:
        raise RuntimeError(f"EPUB parsing failed: {exc}") from exc
