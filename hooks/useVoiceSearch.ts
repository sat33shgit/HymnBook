"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type VoiceSearchState = "idle" | "listening" | "error";

interface UseVoiceSearchOptions {
  onResult: (candidates: string[]) => void;
  lang?: string;
}

function collectTranscriptCandidates(results: SpeechRecognitionResultList) {
  const transcriptsByAlternative = new Map<number, string>();

  for (let resultIndex = 0; resultIndex < results.length; resultIndex += 1) {
    const result = results[resultIndex];

    for (let alternativeIndex = 0; alternativeIndex < result.length; alternativeIndex += 1) {
      const transcript = result[alternativeIndex]?.transcript?.trim();
      if (!transcript) {
        continue;
      }

      const previous = transcriptsByAlternative.get(alternativeIndex);
      transcriptsByAlternative.set(
        alternativeIndex,
        previous ? `${previous} ${transcript}` : transcript
      );
    }
  }

  return Array.from(transcriptsByAlternative.values()).filter(
    (candidate, index, all) => candidate && all.indexOf(candidate) === index
  );
}

export function useVoiceSearch({ onResult, lang = "en-IN" }: UseVoiceSearchOptions) {
  const [state, setState] = useState<VoiceSearchState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const bufferedCandidatesRef = useRef<string[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const flushBufferedCandidates = useCallback(() => {
    if (bufferedCandidatesRef.current.length > 0) {
      onResult(bufferedCandidatesRef.current);
      bufferedCandidatesRef.current = [];
    }
  }, [onResult]);

  const stop = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = undefined;
    }

    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (!isSupported) {
      setErrorMessage("Voice search is not supported in this browser.");
      setState("error");
      setTimeout(() => setState("idle"), 3000);
      return;
    }

    // If already listening, stop
    if (recognitionRef.current) {
      stop();
      return;
    }

    setErrorMessage("");
    bufferedCandidatesRef.current = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechAPI = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const recognition: SpeechRecognition = new SpeechAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => setState("listening");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const candidates = collectTranscriptCandidates(event.results);

      if (candidates.length > 0) {
        bufferedCandidatesRef.current = candidates;
      }
    };

    recognition.onspeechend = () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }

      stopTimerRef.current = setTimeout(() => {
        recognition.stop();
      }, 250);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") return;
      bufferedCandidatesRef.current = [];
      const msg =
        event.error === "not-allowed"
          ? "Microphone access denied."
          : event.error === "no-speech"
          ? "No speech detected."
          : "Voice search failed.";
      setErrorMessage(msg);
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    };

    recognition.onend = () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = undefined;
      }

      recognitionRef.current = null;
      flushBufferedCandidates();
      setState((prev) => (prev !== "error" ? "idle" : prev));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [flushBufferedCandidates, isSupported, lang, stop]);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }

      recognitionRef.current?.abort();
    };
  }, []);

  return { state, isSupported, errorMessage, start, stop };
}
