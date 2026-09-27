"""Encrypt/restore owner voice assets. The encryption key never belongs in Git."""
import argparse
import io
import json
import os
from pathlib import Path, PurePosixPath
import stat
import sys
import zipfile

from cryptography.fernet import Fernet, InvalidToken
from common import data_dir, private_write

MAGIC = b"YOUTUBE-MOTION-PRIVATE-V1\n"
MAX_BYTES = 512 * 1024 * 1024


def inside_git(path):
    path = Path(path).resolve()
    return any((p / ".git").exists() for p in [path, *path.parents])


def pack(source, output, key_file):
    source, output, key_file = map(lambda p: Path(p).resolve(), (source, output, key_file))
    if not source.is_dir() or output.exists() or key_file.exists():
        raise ValueError("Source must exist; bundle and key must be new files.")
    if inside_git(key_file):
        raise ValueError("Store the key outside every Git checkout.")
    items = sorted(p for p in source.rglob("*") if p.is_file())
    if not items or sum(p.stat().st_size for p in items) > MAX_BYTES:
        raise ValueError("Empty or oversized private bundle.")
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in items:
            if path.is_symlink() or not path.resolve().is_relative_to(source):
                raise ValueError("Symlink or out-of-root input rejected.")
            if path.name.startswith(".env") or path.suffix.lower() in {".key", ".pem", ".p12", ".pfx"}:
                raise ValueError("Do not bundle credentials or encryption keys.")
            archive.write(path, path.relative_to(source).as_posix())
    key = Fernet.generate_key()
    token = MAGIC + Fernet(key).encrypt(buffer.getvalue())
    private_write(key_file, key)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("xb") as handle:
        handle.write(token)
    return len(items)


def restore(bundle, key_file, destination):
    destination = Path(destination).resolve()
    if inside_git(destination):
        raise ValueError("Restore private assets outside Git; the default location is recommended.")
    raw = Path(bundle).read_bytes()
    if not raw.startswith(MAGIC) or len(raw) > MAX_BYTES * 2:
        raise ValueError("Invalid or oversized bundle.")
    key = Path(key_file).read_bytes().strip()
    try:
        plain = Fernet(key).decrypt(raw[len(MAGIC):])
    except (InvalidToken, ValueError):
        raise ValueError("Wrong key or damaged bundle; nothing restored.") from None
    plans = []
    with zipfile.ZipFile(io.BytesIO(plain)) as archive:
        if sum(i.file_size for i in archive.infolist()) > MAX_BYTES:
            raise ValueError("Oversized archive.")
        seen = set()
        for item in archive.infolist():
            name = PurePosixPath(item.filename)
            if item.is_dir():
                continue
            if (name.is_absolute() or ".." in name.parts or "\\" in item.filename
                    or ":" in item.filename or stat.S_ISLNK(item.external_attr >> 16)):
                raise ValueError("Unsafe archive path.")
            target = (destination / Path(*name.parts)).resolve()
            if not target.is_relative_to(destination) or target.exists() or target in seen:
                raise ValueError("Unsafe or existing destination; choose a new private directory.")
            seen.add(target)
            plans.append((target, archive.read(item)))
    for target, data in plans:
        private_write(target, data)
    return len(plans)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="action", required=True)
    enc = sub.add_parser("pack")
    enc.add_argument("--source", type=Path, required=True)
    enc.add_argument("--output", type=Path, required=True)
    enc.add_argument("--key-file", type=Path, required=True)
    dec = sub.add_parser("restore")
    dec.add_argument("--bundle", type=Path, required=True)
    dec.add_argument("--key-file", type=Path, required=True)
    dec.add_argument("--destination", type=Path, default=data_dir() / "private")
    args = parser.parse_args()
    try:
        count = (pack(args.source, args.output, args.key_file) if args.action == "pack"
                 else restore(args.bundle, args.key_file, args.destination))
        print(json.dumps({"action": args.action, "files": count, "ok": True}))
    except (ValueError, OSError, zipfile.BadZipFile) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
