type VoiceAudioSession = { type: string };

/** Optional platform hint. Audio still works when Audio Session API is absent. */
export function acquireVoiceAudioSession(type: "play-and-record" | "playback") {
  let session: VoiceAudioSession | undefined;
  let previous = "auto";
  try {
    session = (navigator as Navigator & { audioSession?: VoiceAudioSession })
      .audioSession;
    if (!session) return () => {};
    previous = session.type;
    session.type = type;
  } catch {
    return () => {};
  }
  return () => {
    try {
      // Do not overwrite a newer owner's audio session.
      if (session?.type === type) session.type = previous;
    } catch {
      /* The hint is optional; native recording/playback remains available. */
    }
  };
}
