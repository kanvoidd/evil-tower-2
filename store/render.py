"""Рендер SVG-материалов каталога в PNG. Нужен pymupdf: pip install pymupdf"""
import pymupdf

for name in ("icon-512", "cover-800x470"):
    doc = pymupdf.open(f"store/{name}.svg")
    pix = doc[0].get_pixmap(alpha=False)
    pix.save(f"store/{name}.png")
    print(name, pix.width, pix.height)
