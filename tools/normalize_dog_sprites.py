"""Build a baseline-aligned production atlas from the generated dog poses."""

from pathlib import Path
from statistics import median
from collections import deque

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "dog-sprites.png"
OUTPUT = ROOT / "assets" / "dog-sprites-normalized.png"

COLS = 6
ROWS = 2
FRAME_WIDTH = 256
FRAME_HEIGHT = 192
BASELINE = 174
STANDING_HEIGHT = 124
X_EDGES = (0, 318, 606, 903, 1171, 1380, 1672)


def alpha_bounds(frame: Image.Image) -> tuple[int, int, int, int]:
    bounds = frame.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError("Sprite cell is empty")
    return bounds


def keep_largest_component(frame: Image.Image) -> Image.Image:
    """Remove neighboring-cell fragments and detached emphasis marks."""
    alpha = frame.getchannel("A")
    width, height = frame.size
    pixels = alpha.load()
    visited = bytearray(width * height)
    largest: list[tuple[int, int]] = []

    for y in range(height):
        for x in range(width):
            offset = y * width + x
            if visited[offset] or pixels[x, y] < 16:
                continue
            visited[offset] = 1
            queue = deque([(x, y)])
            component: list[tuple[int, int]] = []
            while queue:
                current_x, current_y = queue.popleft()
                component.append((current_x, current_y))
                for next_x, next_y in (
                    (current_x - 1, current_y), (current_x + 1, current_y),
                    (current_x, current_y - 1), (current_x, current_y + 1),
                ):
                    if not (0 <= next_x < width and 0 <= next_y < height):
                        continue
                    next_offset = next_y * width + next_x
                    if visited[next_offset] or pixels[next_x, next_y] < 16:
                        continue
                    visited[next_offset] = 1
                    queue.append((next_x, next_y))
            if len(component) > len(largest):
                largest = component

    clean_alpha = Image.new("L", frame.size, 0)
    clean_pixels = clean_alpha.load()
    for x, y in largest:
        clean_pixels[x, y] = pixels[x, y]
    cleaned = frame.copy()
    cleaned.putalpha(clean_alpha)
    return cleaned


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    atlas = Image.new("RGBA", (FRAME_WIDTH * COLS, FRAME_HEIGHT * ROWS), (0, 0, 0, 0))

    for row in range(ROWS):
        cells: list[Image.Image] = []
        bounds: list[tuple[int, int, int, int]] = []

        for column in range(COLS):
            left = X_EDGES[column]
            right = X_EDGES[column + 1]
            top = round(row * source.height / ROWS)
            bottom = round((row + 1) * source.height / ROWS)
            cell = keep_largest_component(source.crop((left, top, right, bottom)))
            cells.append(cell)
            bounds.append(alpha_bounds(cell))

        walk_heights = [bounds[index][3] - bounds[index][1] for index in (0, 1, 2)]
        common_scale = STANDING_HEIGHT / median(walk_heights)

        for column, (cell, box) in enumerate(zip(cells, bounds)):
            sprite = cell.crop(box)
            width, height = sprite.size

            if column in (0, 1, 2):
                target_height = STANDING_HEIGHT
            else:
                target_height = max(78, round(height * common_scale))

            target_width = round(width * target_height / height)
            if target_width > FRAME_WIDTH - 16:
                ratio = (FRAME_WIDTH - 16) / target_width
                target_width = FRAME_WIDTH - 16
                target_height = round(target_height * ratio)

            sprite = sprite.resize((target_width, target_height), Image.Resampling.NEAREST)
            x = (FRAME_WIDTH - target_width) // 2
            y = BASELINE - target_height
            atlas.alpha_composite(sprite, (column * FRAME_WIDTH + x, row * FRAME_HEIGHT + y))

    atlas.save(OUTPUT, optimize=True)
    print(f"Wrote {OUTPUT.relative_to(ROOT)} at {atlas.size[0]}x{atlas.size[1]}")


if __name__ == "__main__":
    main()
