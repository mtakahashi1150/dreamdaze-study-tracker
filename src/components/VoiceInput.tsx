"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  onResult: (text: string) => void;
  disabled?: boolean;
};

type SpeechResultEvent = {
  results: {
    length: number;
    [index: number]: { [index: number]: { transcript: string } };
  };
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceInput({ label, onResult, disabled }: Props) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    setSupported(getSpeechRecognition() !== null);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setError("この端末では音声入力が使えません。下の欄に直接入力してください。");
      setSupported(false);
      return;
    }

    setError(null);
    setTranscript("");
    transcriptRef.current = "";
    const rec = new SR();
    rec.lang = "ja-JP";
    rec.continuous = false;
    rec.interimResults = true;
    recognitionRef.current = rec;

    rec.onresult = (event: SpeechResultEvent) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      transcriptRef.current = text;
      setTranscript(text);
    };

    rec.onerror = (event) => {
      setError(`音声エラー: ${event.error}`);
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      const finalText = transcriptRef.current.trim();
      if (finalText) onResult(finalText);
    };

    rec.start();
    setListening(true);
  }, [onResult]);

  const confirmManual = () => {
    if (transcript.trim()) onResult(transcript.trim());
  };

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</p>

      <button
        type="button"
        disabled={disabled}
        onClick={listening ? stop : start}
        className={`w-full rounded-xl py-4 text-lg font-semibold text-white transition ${
          listening
            ? "bg-rose-500 animate-pulse"
            : "bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
        }`}
      >
        {listening ? "■ 話し終わったらタップ" : "🎤 音声で話す"}
      </button>

      {!supported && (
        <p className="text-xs text-amber-600">
          iOS Safari では「ホーム画面に追加」した PWA から使うと安定しやすいです。
        </p>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="音声の結果がここに入ります。手入力もOK"
        rows={3}
        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-600 dark:bg-zinc-800"
      />

      <button
        type="button"
        onClick={confirmManual}
        disabled={!transcript.trim()}
        className="w-full rounded-xl border border-zinc-300 py-2 text-sm font-medium disabled:opacity-40 dark:border-zinc-600"
      >
        この内容で確定
      </button>
    </div>
  );
}
