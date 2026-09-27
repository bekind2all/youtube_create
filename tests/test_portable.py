"""Local tests; no paid API calls, publishing, or private owner data needed."""
import base64
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import wave
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "skills/youtube-motion/scripts"))
from cryptography.fernet import Fernet
import private_bundle
import google_tts


class PrivateBundleTests(unittest.TestCase):
    def test_roundtrip_including_unicode(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "source"
            source.mkdir()
            (source / "참고.wav").write_bytes(b"original audio bytes")
            private_bundle.pack(source, root / "bundle.ymenc", root / "owner.key")
            self.assertNotIn(b"original audio bytes", (root / "bundle.ymenc").read_bytes())
            private_bundle.restore(root / "bundle.ymenc", root / "owner.key", root / "restored")
            self.assertEqual((root / "restored/참고.wav").read_bytes(), b"original audio bytes")

    def test_wrong_key_and_tampering_write_nothing(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "source"
            source.mkdir()
            (source / "file.txt").write_text("private")
            private_bundle.pack(source, root / "bundle.ymenc", root / "owner.key")
            (root / "wrong.key").write_bytes(Fernet.generate_key())
            with self.assertRaises(ValueError):
                private_bundle.restore(root / "bundle.ymenc", root / "wrong.key", root / "restored")
            self.assertFalse((root / "restored").exists())
            data = bytearray((root / "bundle.ymenc").read_bytes())
            data[-10] ^= 1
            (root / "bundle.ymenc").write_bytes(data)
            with self.assertRaises(ValueError):
                private_bundle.restore(root / "bundle.ymenc", root / "owner.key", root / "restored")
            self.assertFalse((root / "restored").exists())

    def test_archive_escape_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, "w") as archive:
                archive.writestr("../escape.txt", "do not extract")
            key = Fernet.generate_key()
            (root / "key").write_bytes(key)
            (root / "bundle").write_bytes(private_bundle.MAGIC + Fernet(key).encrypt(buffer.getvalue()))
            with self.assertRaises(ValueError):
                private_bundle.restore(root / "bundle", root / "key", root / "restored")
            self.assertFalse((root / "escape.txt").exists())

    def test_restore_inside_checkout_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / ".git").mkdir()
            with self.assertRaises(ValueError):
                private_bundle.restore(root / "missing", root / "missing-key", root / "private")


class VoicePrivacyTests(unittest.TestCase):
    def test_generated_metadata_does_not_expose_voice_identifier(self):
        wav = io.BytesIO()
        with wave.open(wav, "wb") as handle:
            handle.setnchannels(1)
            handle.setsampwidth(2)
            handle.setframerate(24000)
            handle.writeframes(b"\0\0" * 2400)
        payload = {"candidates": [{"content": {"parts": [{"inlineData": {
            "mimeType": "audio/wav", "data": base64.b64encode(wav.getvalue()).decode()
        }}]}}]}
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "voice.wav"
            with patch.object(google_tts, "find_key", return_value=("test-key", "test", "test")):
                with patch.object(google_tts.request, "urlopen", return_value=io.BytesIO(json.dumps(payload).encode())):
                    result = google_tts.synthesize("검증", "private-test-speaker-id", "gemini-3.8-flash-tts", "test", output)
            self.assertEqual(result["duration_seconds"], 0.1)
            self.assertNotIn("private-test-speaker-id", output.with_suffix(".json").read_text(encoding="utf-8"))
            self.assertNotIn("test-key", output.with_suffix(".json").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
