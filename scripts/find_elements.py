#!/usr/bin/env python3
"""Find separate elements in an RGBA asset sheet.

The detector is intentionally conservative: it uses the source alpha channel
when one is available, finds connected foreground regions, and keeps the
original irregular silhouette. It never turns an element into a square image;
the square is only the minimum PNG canvas needed to contain that silhouette.

Examples:
    python scripts/find_elements.py assets/objects/pack1.png
    python scripts/find_elements.py assets/objects/pack*.png --extract
"""

from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw


def make_mask(image: Image.Image, threshold: int) -> tuple[Image.Image, str]:
    """Return a binary foreground mask and the method used to make it."""
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    if alpha.getextrema()[0] < 255:
        return alpha.point(lambda value: 255 if value > threshold else 0), "alpha"

    # Fallback for genuinely opaque sheets: treat pixels that differ from the
    # top-left background colour as foreground. This is only a basic fallback;
    # alpha-backed sheets (like the supplied packs) use the more reliable path.
    rgb = rgba.convert("RGB")
    background = rgb.getpixel((0, 0))
    distance = rgb.load()
    mask = Image.new("L", rgb.size, 0)
    output = mask.load()
    for y in range(rgb.height):
        for x in range(rgb.width):
            r, g, b = distance[x, y]
            br, bg, bb = background
            if abs(r - br) + abs(g - bg) + abs(b - bb) > threshold:
                output[x, y] = 255
    return mask, "corner-colour-fallback"


def components(mask: Image.Image, min_area: int) -> tuple[list[dict], list[int]]:
    """Find 8-connected foreground regions without external dependencies."""
    width, height = mask.size
    pixels = mask.load()
    seen = bytearray(width * height)
    labels = [0] * (width * height)
    found: list[dict] = []
    next_label = 0

    for y in range(height):
        for x in range(width):
            index = y * width + x
            if seen[index] or not pixels[x, y]:
                continue
            seen[index] = 1
            next_label += 1
            component_label = next_label
            queue = deque([(x, y)])
            area = 0
            left = right = x
            top = bottom = y
            while queue:
                px, py = queue.popleft()
                labels[py * width + px] = component_label
                area += 1
                left, right = min(left, px), max(right, px)
                top, bottom = min(top, py), max(bottom, py)
                for ny in range(max(0, py - 1), min(height, py + 2)):
                    for nx in range(max(0, px - 1), min(width, px + 2)):
                        ni = ny * width + nx
                        if not seen[ni] and pixels[nx, ny]:
                            seen[ni] = 1
                            labels[ni] = component_label
                            queue.append((nx, ny))
            if area >= min_area:
                found.append({
                    "label": component_label,
                    "area": area,
                    "bbox": [left, top, right + 1, bottom + 1],
                })

    found.sort(key=lambda item: (item["bbox"][1], item["bbox"][0]))
    for number, item in enumerate(found, 1):
        item["id"] = number
    return found, labels


def padded_bbox(bbox: list[int], padding: int, size: tuple[int, int]) -> tuple[int, int, int, int]:
    left, top, right, bottom = bbox
    width, height = size
    return (
        max(0, left - padding),
        max(0, top - padding),
        min(width, right + padding),
        min(height, bottom + padding),
    )


def preview(image: Image.Image, regions: Iterable[dict], output: Path, padding: int) -> None:
    canvas = image.convert("RGBA").copy()
    draw = ImageDraw.Draw(canvas)
    for region in regions:
        left, top, right, bottom = padded_bbox(region["bbox"], padding, canvas.size)
        draw.rectangle((left, top, right - 1, bottom - 1), outline=(255, 40, 40, 255), width=3)
        draw.text((left + 4, top + 4), str(region["id"]), fill=(255, 40, 40, 255))
    canvas.save(output)


def extract(
    image: Image.Image,
    regions: Iterable[dict],
    labels: list[int],
    output_dir: Path,
    padding: int,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    rgba = image.convert("RGBA")
    width, _ = rgba.size
    for region in regions:
        box = padded_bbox(region["bbox"], padding, rgba.size)
        left, top, right, bottom = box
        result = Image.new("RGBA", (right - left, bottom - top), (0, 0, 0, 0))
        source = rgba.load()
        target = result.load()
        component_label = region["label"]
        for y in range(top, bottom):
            for x in range(left, right):
                if labels[y * width + x] == component_label:
                    target[x - left, y - top] = source[x, y]
        result.save(output_dir / f"element-{region['id']:03d}.png")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("inputs", nargs="+", type=Path, help="PNG asset sheets")
    parser.add_argument("--output", type=Path, default=Path("assets/detected"))
    parser.add_argument("--threshold", type=int, default=16, help="alpha/colour threshold (default: 16)")
    parser.add_argument("--min-area", type=int, default=800, help="ignore regions smaller than this (default: 800)")
    parser.add_argument("--padding", type=int, default=8, help="pixels around each tight crop (default: 8)")
    parser.add_argument("--extract", action="store_true", help="also write cropped PNGs; otherwise detect only")
    args = parser.parse_args()

    for source in args.inputs:
        image = Image.open(source)
        mask, method = make_mask(image, args.threshold)
        regions, labels = components(mask, args.min_area)
        target = args.output / source.stem
        target.mkdir(parents=True, exist_ok=True)
        (target / "manifest.json").write_text(json.dumps({
            "source": str(source),
            "method": method,
            "threshold": args.threshold,
            "min_area": args.min_area,
            "padding": args.padding,
            "regions": regions,
        }, indent=2) + "\n")
        preview(image, regions, target / "detection-preview.png", args.padding)
        if args.extract:
            extract(image, regions, labels, target / "elements", args.padding)
        print(f"{source}: found {len(regions)} regions using {method}; output: {target}")


if __name__ == "__main__":
    main()
