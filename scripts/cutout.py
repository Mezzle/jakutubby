"""Cut the sun costume out of the background of a photo.

Keeps yellow pixels plus anything they fully enclose (the face), makes
everything else transparent and crops to the sun.

Usage: python3 scripts/cutout.py <photo.png>
"""
import sys
from collections import deque
from PIL import Image, ImageFilter

if len(sys.argv) != 2:
    sys.exit("Usage: python3 scripts/cutout.py <photo.png>")

SOURCE = sys.argv[1]
TARGET = "assets/jakub-sun.png"
MIN_HEIGHT = 380


def is_yellow(r, g, b):
    return r > 140 and g > 90 and b < 140 and r - b > 70


image = Image.open(SOURCE).convert("RGBA")
width, height = image.size
pixels = image.load()

# Flood-fill the background from the edges through non-yellow pixels.
background = [[False] * width for _ in range(height)]
queue = deque()
for x in range(width):
    queue.extend([(x, 0), (x, height - 1)])
for y in range(height):
    queue.extend([(0, y), (width - 1, y)])

while queue:
    x, y = queue.popleft()
    if not (0 <= x < width and 0 <= y < height) or background[y][x]:
        continue
    if is_yellow(*pixels[x, y][:3]):
        continue
    background[y][x] = True
    queue.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])



def largest_blob(keep):
    """Return the biggest connected group of kept pixels, dropping stray
    yellowish bits elsewhere in the picture (grass, for instance)."""
    seen = [[False] * width for _ in range(height)]
    best = []
    for start_y in range(height):
        for start_x in range(width):
            if seen[start_y][start_x] or not keep[start_y][start_x]:
                continue
            blob = []
            stack = [(start_x, start_y)]
            seen[start_y][start_x] = True
            while stack:
                x, y = stack.pop()
                blob.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < width and 0 <= ny < height and keep[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            if len(blob) > len(best):
                best = blob
    return best


keep = [[not background[y][x] for x in range(width)] for y in range(height)]
mask = Image.new("L", (width, height))
mask_pixels = mask.load()
for x, y in largest_blob(keep):
    mask_pixels[x, y] = 255
# Drop specks, then soften the edge.
mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))

image.putalpha(mask)
image = image.crop(mask.getbbox())
if image.height < MIN_HEIGHT:
    scale = MIN_HEIGHT / image.height
    image = image.resize((round(image.width * scale), MIN_HEIGHT), Image.LANCZOS)
image.save(TARGET)
print("wrote", TARGET, image.size)
