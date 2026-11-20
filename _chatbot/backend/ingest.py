"""Build the chatbot's knowledge bundle from the documents in ../database.

Usage:
    python ingest.py [--src ../database] [--out knowledge/knowledge.json]

Supported inputs:
  .pdf  -> text via pypdf; PDFs with almost no text (scanned / image-only) are
           rasterized with `pdftoppm` (poppler-utils) and stored as images.
  .odt  -> text from content.xml (headings, paragraphs, list items)
  .docx/.txt/.md -> text
  .png/.jpg/.jpeg/.gif/.webp -> stored as images (Claude reads them visually)

The output is a single JSON file that the backend loads at startup. It contains
the full text of every document, so keep it out of git (see ../.gitignore).
"""

from __future__ import annotations

import argparse
import base64
import json
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

import logging

from pypdf import PdfReader

logging.getLogger("pypdf").setLevel(logging.ERROR)  # silence harmless xref warnings

HERE = Path(__file__).resolve().parent
MIN_PDF_WORDS = 50  # below this a PDF is treated as image-only
IMAGE_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
}


def title_for(path: Path) -> str:
    return path.stem.replace("_", " ").strip()


def pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    pages = [(p.extract_text() or "").strip() for p in reader.pages]
    return "\n\n".join(p for p in pages if p)


def pdf_to_jpegs(path: Path, size: int = 1500) -> list[bytes]:
    """Rasterize each page of a PDF to JPEG bytes using pdftoppm."""
    with tempfile.TemporaryDirectory() as tmp:
        prefix = Path(tmp) / "page"
        subprocess.run(
            ["pdftoppm", "-jpeg", "-jpegopt", "quality=85", "-scale-to", str(size),
             str(path), str(prefix)],
            check=True,
        )
        return [p.read_bytes() for p in sorted(Path(tmp).glob("page*.jpg"))]


TEXT_NS = "urn:oasis:names:tc:opendocument:xmlns:text:1.0"
T = "{%s}" % TEXT_NS


def _odt_inline(el) -> str:
    """Text of one paragraph/heading, honouring ODF spacing elements."""
    parts = [el.text or ""]
    for child in el:
        if child.tag == T + "s":
            parts.append(" " * int(child.get(T + "c", "1")))
        elif child.tag == T + "tab":
            parts.append("\t")
        elif child.tag == T + "line-break":
            parts.append("\n")
        elif child.tag == T + "note":
            pass  # skip footnote bodies inline
        else:
            parts.append(_odt_inline(child))
        parts.append(child.tail or "")
    return "".join(parts)


def odt_text(path: Path) -> str:
    """Extract text from an .odt (a zip with content.xml) in reading order."""
    import xml.etree.ElementTree as ET

    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("content.xml"))
    out: list[str] = []

    def walk(node, in_list=False):
        for child in node:
            if child.tag in (T + "p", T + "h"):
                txt = _odt_inline(child).strip()
                if txt:
                    if child.tag == T + "h":
                        txt = "## " + txt
                    elif in_list:
                        txt = "- " + txt
                    out.append(txt)
            else:
                walk(child, in_list or child.tag == T + "list-item")

    walk(root)
    return "\n".join(out)


def docx_text(path: Path) -> str:
    import re

    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf8")
    xml = re.sub(r"</w:p>", "\n", xml)
    return re.sub(r"<[^>]+>", "", xml).strip()


def build(src: Path) -> dict:
    text_docs: list[dict] = []
    images: list[dict] = []

    for path in sorted(src.iterdir()):
        if not path.is_file() or path.name.startswith("."):
            continue
        ext = path.suffix.lower()
        title = title_for(path)
        try:
            if ext == ".pdf":
                text = pdf_text(path)
                if len(text.split()) >= MIN_PDF_WORDS:
                    text_docs.append({"title": title, "file": path.name, "text": text})
                else:
                    for i, jpg in enumerate(pdf_to_jpegs(path), 1):
                        images.append({
                            "title": title if i == 1 else f"{title} (page {i})",
                            "file": path.name,
                            "media_type": "image/jpeg",
                            "data": base64.standard_b64encode(jpg).decode(),
                        })
            elif ext == ".odt":
                text_docs.append({"title": title, "file": path.name, "text": odt_text(path)})
            elif ext == ".docx":
                text_docs.append({"title": title, "file": path.name, "text": docx_text(path)})
            elif ext in (".txt", ".md"):
                text_docs.append({"title": title, "file": path.name, "text": path.read_text()})
            elif ext in IMAGE_TYPES:
                images.append({
                    "title": title,
                    "file": path.name,
                    "media_type": IMAGE_TYPES[ext],
                    "data": base64.standard_b64encode(path.read_bytes()).decode(),
                })
            else:
                print(f"  skip (unsupported type): {path.name}")
                continue
        except Exception as e:  # keep going; report the failure
            print(f"  ERROR reading {path.name}: {e}", file=sys.stderr)
            continue

    return {"text_docs": text_docs, "images": images}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", type=Path, default=HERE.parent / "database")
    ap.add_argument("--out", type=Path, default=HERE / "knowledge" / "knowledge.json")
    args = ap.parse_args()

    if not args.src.is_dir():
        sys.exit(f"Source folder not found: {args.src}")

    bundle = build(args.src)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(bundle, ensure_ascii=False))

    print(f"Text documents ({len(bundle['text_docs'])}):")
    for d in bundle["text_docs"]:
        print(f"  {len(d['text'].split()):5d} words  {d['file']}")
    print(f"Image documents ({len(bundle['images'])}):")
    for d in bundle["images"]:
        print(f"  {len(d['data']) * 3 // 4 // 1024:5d} KB     {d['file']}  [{d['title']}]")
    print(f"Wrote {args.out} ({args.out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
