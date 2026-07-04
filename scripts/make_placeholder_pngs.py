"""One-off helper to generate solid-color placeholder PNGs for demo purposes.
Not needed once you drop your real RIVALS skin PNGs into images/."""
import struct
import zlib
import os

ROOT = os.path.join(os.path.dirname(__file__), "..", "images")

def write_png(path, width, height, rgb):
    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    row = bytes([0]) + bytes(rgb) * width
    raw = row * height
    idat = zlib.compress(raw, 9)

    with open(path, "wb") as f:
        f.write(sig)
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", idat))
        f.write(chunk(b"IEND", b""))


samples = [
    ("Knife/Chroma/Dragon_Scale.png", (200, 30, 30)),
    ("Knife/Chroma/Galaxy_Blade.png", (60, 30, 180)),
    ("Knife/Default/Standard_Knife.png", (120, 120, 120)),
    ("Gun/Default/Standard_Pistol.png", (80, 80, 80)),
]

for rel_path, color in samples:
    full_path = os.path.join(ROOT, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    write_png(full_path, 64, 64, color)
    print(f"wrote {full_path}")
