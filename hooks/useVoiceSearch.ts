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

/**
 * useVoiceSearch hook supports browser SpeechRecognition API and a native WebView fallback.
 *
 * Native integration (Android/iOS):
 * - Android (addJavascriptInterface): expose methods such as `startVoiceRecognition()` and `stopVoiceRecognition()` on a global `Android` object. When recognition results are available, native code should call:
 *     window.__hymnbookOnVoiceResult(result)   // result: string or string[]
 *     window.__hymnbookOnVoiceStart()
 *     window.__hymnbookOnVoiceEnd()
 *     window.__hymnbookOnVoiceError(message)
 * - iOS (WKWebView): configure a message handler `voice` and post messages from native to JS, or evaluate JavaScript to call the same global callbacks.
 * - Alternatively native can post messages to the page using `window.postMessage({ type: 'hymnbook.voice.result', payload: ... }, '*')`.
 *
 * The hook will use the browser API when available, otherwise it will attempt to use the native bridge.
 */

export function useVoiceSearch({ onResult, lang = "en-IN" }: UseVoiceSearchOptions) {
  const [state, setState] = useState<VoiceSearchState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const bufferedCandidatesRef = useRef<string[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isSpeechAPI =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const hasNativeBridge =
    typeof window !== "undefined" &&
    (!!(window as any).Android || !!(window as any).webkit?.messageHandlers);

  const isSupported = isSpeechAPI || hasNativeBridge;

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

    // If SpeechRecognition API is being used, stop it.
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    // Otherwise, attempt to tell the native host to stop (if present).
    try {
      const w = window as any;
      if (w.Android) {
        if (typeof w.Android.stopVoiceRecognition === "function") {
          w.Android.stopVoiceRecognition();
        } else if (typeof w.Android.stopVoiceSearch === "function") {
          w.Android.stopVoiceSearch();
        }
      } else if (w.webkit?.messageHandlers?.voice) {
        w.webkit.messageHandlers.voice.postMessage({ command: "stop" });
      } else {
        // Generic postMessage fallback
        window.postMessage({ type: "hymnbook.voice", command: "stop" }, "*");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const start = useCallback(() => {
    if (!isSupported) {
      setErrorMessage("Voice search is not supported in this environment.");
      setState("error");
      setTimeout(() => setState("idle"), 3000);
      return;
    }

    // If already listening with SpeechRecognition, stop instead
    if (recognitionRef.current) {
      stop();
      return;
    }

    setErrorMessage("");
    bufferedCandidatesRef.current = [];

    // If browser Speech API is available, use it.
    if (isSpeechAPI) {
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
      return;
    }

    // Otherwise, use a native WebView bridge if available.
    try {
      const w = window as any;
      // Tell the native host to start voice capture/recognition.
      if (w.Android) {
        if (typeof w.Android.startVoiceRecognition === "function") {
          w.Android.startVoiceRecognition();
        } else if (typeof w.Android.startVoiceSearch === "function") {
          w.Android.startVoiceSearch();
        } else if (typeof w.Android.startSpeechRecognition === "function") {
          w.Android.startSpeechRecognition();
        } else if (typeof w.Android.start === "function") {
          w.Android.start();
        } else {
          // best-effort: call startVoiceRecognition if present
          try {
            w.Android.startVoiceRecognition?.();
          } catch (e) {}
        }
      } else if (w.webkit?.messageHandlers?.voice) {
        w.webkit.messageHandlers.voice.postMessage({ command: "start", lang });
      } else {
        window.postMessage({ type: "hymnbook.voice", command: "start", lang }, "*");
      }

      // Set listening state; native host should call back via global callbacks below.
      setState("listening");
    } catch (e) {
      setErrorMessage("Voice search failed to start.");
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }, [flushBufferedCandidates, isSupported, lang, stop]);

  useEffect(() => {
    // Install global callbacks so native hosts can call back into the page with results.
    if (typeof window !== "undefined") {
      const w = window as any;

      // Handler for native -> page results. Accepts string or array of strings.
      w.__hymnbookOnVoiceResult = (payload: any) => {
        try {
          let candidates: string[] = [];
          if (Array.isArray(payload)) {
            candidates = payload.map((p) => String(p)).filter(Boolean);
          } else if (typeof payload === "string") {
            candidates = [payload];
          } else if (payload && payload.transcripts) {
            candidates = Array.isArray(payload.transcripts) ? payload.transcripts : [String(payload.transcripts)];
          }

          if (candidates.length > 0) {
            bufferedCandidatesRef.current = candidates;
            flushBufferedCandidates();
          }
        } catch (e) {
          // ignore
        }
      };

      w.__hymnbookOnVoiceError = (msg: string) => {
        setErrorMessage(msg || "Voice search failed.");
        setState("error");
        setTimeout(() => setState("idle"), 3000);
      };

      w.__hymnbookOnVoiceStart = () => setState("listening");
      w.__hymnbookOnVoiceEnd = () => {
        flushBufferedCandidates();
        setState((prev) => (prev !== "error" ? "idle" : prev));
      };

      const messageHandler = (event: MessageEvent) => {
        const data = event?.data;
        if (!data) return;
        if (data?.type === "hymnbook.voice.result") {
          w.__hymnbookOnVoiceResult(data.payload);
        } else if (data?.type === "hymnbook.voice.error") {
          w.__hymnbookOnVoiceError(data.message || "Voice search failed.");
        } else if (data?.type === "hymnbook.voice.start") {
          w.__hymnbookOnVoiceStart();
        } else if (data?.type === "hymnbook.voice.end") {
          w.__hymnbookOnVoiceEnd();
        }
      };

      window.addEventListener("message", messageHandler);

      return () => {
        if (stopTimerRef.current) {
          clearTimeout(stopTimerRef.current);
        }

        recognitionRef.current?.abort();

        try {
          delete w.__hymnbookOnVoiceResult;
          delete w.__hymnbookOnVoiceError;
          delete w.__hymnbookOnVoiceStart;
          delete w.__hymnbookOnVoiceEnd;
        } catch (e) {
          // ignore
        }

        window.removeEventListener("message", messageHandler);
      };
    }

    return () => {};
  }, []);

  return { state, isSupported, errorMessage, start, stop };
}
