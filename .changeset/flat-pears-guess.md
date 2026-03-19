---
"allmd": patch
---

Fix video/audio transcription failing for recordings over 23 minutes when diarization is enabled. The gpt-4o-transcribe-diarize model has a 1400-second duration limit that was not being enforced — audio is now automatically chunked into 20-minute segments. Chunks are transcribed in parallel (3 concurrent) for ~3x faster processing.
