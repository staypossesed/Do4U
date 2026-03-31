"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceRecordingResult {
  transcript: string;
  audioBlob: Blob | null;
  isRecording: boolean;
  isSupported: boolean;
  interimTranscript: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
  duration: number;
}

export function useVoiceRecording(): VoiceRecordingResult {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const hasSpeech = typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    setIsSupported(hasSpeech);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    setInterimTranscript("");
    setIsRecording(false);
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) return;

    setTranscript("");
    setInterimTranscript("");
    setAudioBlob(null);
    setDuration(0);
    chunksRef.current = [];

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ru-RU";
    recognition.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // Rebuild FULL transcript from all results — never append to prev state.
      // event.results is cumulative: contains ALL results since recognition.start().
      let finalParts = "";
      let interim = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalParts += result[0].transcript.trim() + " ";
        } else {
          interim += result[0].transcript;
        }
      }

      // Replace (not append) — this prevents duplication
      const cleaned = finalParts.trim();
      if (cleaned) {
        setTranscript(cleaned);
      }
      setInterimTranscript(interim);

      // Reset silence timer on each result
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        // If no new speech for 4 seconds while recording, restart recognition
        // to prevent the "stuck repeating" bug in some browsers
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch { /* ignore */ }
        }
      }, 4000);
    };

    // Auto-restart on end (browser may stop recognition after silence)
    recognition.onend = () => {
      // Only restart if we're still supposed to be recording
      if (recognitionRef.current) {
        try {
          recognition.start();
        } catch {
          // Already started or stopped — ignore
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "aborted" || event.error === "no-speech") {
        return; // These are expected during restart cycles
      }
      stop();
    };

    recognitionRef.current = recognition;
    recognition.start();

    // MediaRecorder for raw audio blob
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
    } catch (err) {
      console.error("MediaRecorder not available:", err);
    }

    timerRef.current = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);

    setIsRecording(true);
  }, [isSupported, stop]);

  const reset = useCallback(() => {
    stop();
    setTranscript("");
    setAudioBlob(null);
    setDuration(0);
  }, [stop]);

  useEffect(() => {
    if (isRecording && duration >= 30) stop();
  }, [isRecording, duration, stop]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  return {
    transcript,
    audioBlob,
    isRecording,
    isSupported,
    interimTranscript,
    start,
    stop,
    reset,
    duration,
  };
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}
