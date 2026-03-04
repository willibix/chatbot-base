"""Transcription service using OpenAI Whisper."""

import asyncio
import logging
import tempfile
from pathlib import Path

import whisper

from app.core.config import settings


logger = logging.getLogger(__name__)

# Module-level cache for the Whisper model (lazy-loaded on first use)
_model: whisper.Whisper | None = None


def _get_model() -> whisper.Whisper:
    """Get or load the Whisper model (cached after first call)."""
    global _model
    if _model is None:
        logger.info("Loading Whisper model: %s", settings.WHISPER_MODEL)
        _model = whisper.load_model(settings.WHISPER_MODEL)
        logger.info("Whisper model loaded successfully")
    return _model


def _transcribe_sync(audio_bytes: bytes) -> str:
    """Synchronous transcription using Whisper. Runs in a thread pool."""
    model = _get_model()

    # Write audio bytes to a temporary file (Whisper requires a file path)
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        result = model.transcribe(tmp_path)
        raw = result.get("text", "")
        text = raw if isinstance(raw, str) else ""
        return text.strip()
    finally:
        # Always clean up the temp file
        Path(tmp_path).unlink(missing_ok=True)


async def transcribe(audio_bytes: bytes) -> str:
    """Transcribe audio bytes to text using Whisper.

    Runs the CPU/GPU-intensive transcription in a thread pool
    to avoid blocking the FastAPI event loop.
    """
    if not audio_bytes:
        msg = "No audio data provided"
        raise ValueError(msg)

    return await asyncio.to_thread(_transcribe_sync, audio_bytes)
