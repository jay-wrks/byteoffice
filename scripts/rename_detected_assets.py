#!/usr/bin/env python3
"""Give the detected element PNGs descriptive filenames."""

import json
from pathlib import Path


NAMES = {
    1: [
        "robot-with-clipboard", "potted-office-plant", "loose-leaves", "black-binder-clip",
        "silver-paperclip-small", "coffee-cup-robot-logo", "brown-gear", "colored-pushpins",
        "silver-paperclip-large", "lined-note-paper", "yellow-sticky-note", "wooden-ruler",
        "beige-tape-strip", "crumpled-paper", "white-tape-strip", "brown-tape-strip",
        "yellow-pencil", "paper-stack", "dark-wood-sign", "plain-paper-card",
        "pinned-paper-card", "notebook-edge", "dark-wood-sign-wide", "light-wood-sign",
        "folder-paper", "hanging-tag", "compass", "cardboard-square", "scrap-note",
        "parchment-strip", "folded-paper-corner", "map-doodle", "leaf-corner",
        "coffee-stain-ring", "metal-screw", "metal-nut", "doodle-arrow", "doodle-smile",
        "doodle-star", "doodle-crown", "doodle-lightbulb", "dotted-curved-arrow",
    ],
    2: [
        "robot-with-clipboard", "robot-front", "robot-back", "coffee-cup-robot-logo",
        "hanging-potted-plant", "robot-side", "trailing-ivy-plant", "large-potted-plant",
        "coffee-stain-ring", "crumpled-paper", "stacked-books", "brown-gear", "gold-paperclip",
        "wooden-arrow-sign", "dark-wood-sign", "light-wood-sign", "crumpled-paper-small",
        "black-binder-clip", "yellow-pushpin", "green-pushpin", "blue-pushpin", "red-pushpin",
        "letter-b-tile", "folder-paper", "yellow-sticky-note", "pinned-paper-note",
        "graph-paper-note", "lined-note-paper", "blank-paper-note", "black-office-pen",
        "plain-paper-sheet", "yellow-pencil", "compass", "doodle-arrow", "doodle-question",
        "beige-tape-wide", "leaf-branch", "beige-tape-short", "brown-tape-small",
        "white-tape-small", "beige-tape-medium", "translucent-tape", "beige-tape-long",
        "lantern", "wooden-signpost", "treasure-map", "microchip", "scroll-paper",
        "loose-leaf", "small-gear", "rolled-parchment", "confidential-folder",
        "paper-envelope-with-clip", "dark-metal-plate", "folder-stack", "mushroom-red",
        "mushroom-brown", "yellow-flower", "grass-tuft-small", "mossy-rock-small",
        "grass-tuft-rock", "evergreen-tree", "mossy-rock-large", "tree-stump", "small-rock",
        "wooden-fence", "screwdriver", "wooden-handle", "open-ended-wrench", "grass-tuft-wide",
        "mossy-rock-with-grass", "grass-clump",
    ],
    3: [
        "large-potted-plant", "pinned-lined-note", "coffee-cup-robot-logo", "letter-b-wooden-tile",
        "plain-wooden-sign", "brown-gear", "torn-paper-card", "yellow-sticky-note",
        "black-binder-clip", "silver-paperclip", "red-pushpin", "green-pushpin", "yellow-pushpin",
        "beige-tape-strip", "translucent-tape-strip", "blue-binder-clip", "mossy-rock-with-leaves",
        "loose-green-leaf", "loose-green-leaf-small", "robot-with-clipboard", "treasure-map",
        "compass", "wooden-arrow-sign", "shipping-crate", "beige-tape-medium", "brown-button",
        "silver-button", "dark-button", "torn-paper-strip", "variegated-leaf-plant", "wooden-signpost",
        "folded-brown-paper", "coffee-stain-ring", "yellow-pencil", "coffee-stain-drops",
        "grass-tuft", "mossy-rock-with-grass", "grass-and-rock-clump", "book-icon-tile",
        "bar-chart-icon-tile", "shield-and-settings-icon-tiles", "user-icon-tile",
    ],
}


def main() -> None:
    root = Path("assets/detected")
    for pack, names in NAMES.items():
        pack_dir = root / f"pack{pack}"
        element_dir = pack_dir / "elements"
        manifest_path = pack_dir / "manifest.json"
        manifest = json.loads(manifest_path.read_text())
        regions = manifest["regions"]
        if len(regions) != len(names):
            raise RuntimeError(f"pack{pack}: expected {len(names)} regions, manifest has {len(regions)}")
        for region, name in zip(regions, names):
            old = element_dir / f"element-{region['id']:03d}.png"
            new_name = f"{name}.png"
            new = element_dir / new_name
            if old.exists():
                old.rename(new)
            elif not new.exists():
                raise FileNotFoundError(old)
            region["filename"] = new_name
        manifest["naming"] = "descriptive names assigned by visual asset type"
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
        print(f"pack{pack}: renamed {len(names)} files")


if __name__ == "__main__":
    main()
