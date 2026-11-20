#!/usr/bin/env bash
# Re-encode the 11 showcase sample videos to ASCII slug filenames.
# The source mp4 files are not in git. Posters in lounge/showcase/posters are.
#
# Usage:
#   scripts/prepare-samples.sh SOURCE_DIR DEST_DIR [--posters]
#
# SOURCE_DIR contains the original folders, for example:
#   SOURCE_DIR/01_숏드라마_캐릭터/바트방_블롭교체_26s.mp4
#   SOURCE_DIR/thumbs/바트방_블롭교체_26s.jpg
# DEST_DIR is /opt/aibl-showcase/media/samples on the VPS.
# --posters also refreshes lounge/showcase/posters/*.webp from SOURCE_DIR/thumbs.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 SOURCE_DIR DEST_DIR [--posters]" >&2
  exit 1
fi

SOURCE_DIR=$(cd "$1" && pwd)
DEST_DIR=$2
WRITE_POSTERS=0
if [[ "${3:-}" == "--posters" ]]; then
  WRITE_POSTERS=1
fi

ROOT=$(cd "$(dirname "$0")/.." && pwd)
CATALOG="$ROOT/lounge/showcase/samples.json"
POSTER_DIR="$ROOT/lounge/showcase/posters"
mkdir -p "$DEST_DIR" "$POSTER_DIR"

python3 - "$CATALOG" "$SOURCE_DIR" "$DEST_DIR" "$POSTER_DIR" "$WRITE_POSTERS" <<'PY'
import json, pathlib, subprocess, sys
catalog, source_dir, dest_dir, poster_dir, write_posters = sys.argv[1:]
source_dir = pathlib.Path(source_dir)
dest_dir = pathlib.Path(dest_dir)
poster_dir = pathlib.Path(poster_dir)
items = json.loads(pathlib.Path(catalog).read_text(encoding="utf-8"))["items"]
missing = []
for item in items:
    src = source_dir / item["source"]
    if not src.is_file():
        missing.append(str(src))
if missing:
    print("missing source videos:", file=sys.stderr)
    print("\n".join(missing), file=sys.stderr)
    sys.exit(1)

for item in items:
    src = source_dir / item["source"]
    dest = dest_dir / item["file"]
    print(f"encode {src.name} -> {dest.name}", flush=True)
    subprocess.check_call([
        "ffmpeg", "-y", "-i", str(src),
        "-map", "0:v:0", "-map", "0:a:0?",
        "-vf", "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p",
        "-c:v", "libx264", "-profile:v", "high", "-level", "4.0", "-pix_fmt", "yuv420p",
        "-crf", "26", "-maxrate", "2.5M", "-bufsize", "5M",
        "-c:a", "aac", "-b:a", "96k", "-ac", "2",
        "-movflags", "+faststart",
        str(dest),
    ])
    if write_posters == "1":
        thumb = source_dir / item["posterSource"]
        poster = poster_dir / pathlib.Path(item["poster"]).name
        if not thumb.is_file():
            print(f"missing poster source: {thumb}", file=sys.stderr)
            sys.exit(1)
        subprocess.check_call([
            "ffmpeg", "-y", "-i", str(thumb),
            "-c:v", "libwebp", "-quality", "80",
            str(poster),
        ])
print(f"wrote {len(items)} videos to {dest_dir}")
PY
