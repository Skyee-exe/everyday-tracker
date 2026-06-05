"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type StreamingStatus =
  | "idle"
  | "requesting"
  | "connecting"
  | "recording"
  | "stopping"
  | "error";

interface UseAssemblyAIStreamingOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
}

interface AssemblyAITurnMessage {
  type?: string;
  transcript?: string;
  turn_order?: number;
  end_of_turn?: boolean;
  turn_is_formatted?: boolean;
  error?: string;
  message?: string;
}

export function useAssemblyAIStreaming({
  onTranscript,
}: UseAssemblyAIStreamingOptions) {
  const [status, setStatus] = useState<StreamingStatus>("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const silenceGainRef = useRef<GainNode | null>(null);
  const finalizedTurnsRef = useRef<Set<number>>(new Set());
  const finalizedTranscriptFallbackRef = useRef("");
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const cleanup = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }

    workletNodeRef.current?.port.close();
    workletNodeRef.current?.disconnect();
    silenceGainRef.current?.disconnect();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioContextRef.current?.close().catch(() => undefined);

    workletNodeRef.current = null;
    silenceGainRef.current = null;
    mediaStreamRef.current = null;
    audioContextRef.current = null;
    finalizedTurnsRef.current.clear();
    finalizedTranscriptFallbackRef.current = "";
  }, []);

  const stop = useCallback(() => {
    setStatus((current) => (current === "idle" ? current : "stopping"));

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "Terminate" }));
      ws.close(1000, "User stopped recording");
    } else {
      ws?.close();
    }

    wsRef.current = null;
    cleanup();
    setLiveTranscript("");
    setStatus("idle");
  }, [cleanup]);

  const start = useCallback(async () => {
    if (status !== "idle" && status !== "error") return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone access is not supported in this browser.");
      setStatus("error");
      return;
    }

    setError(null);
    setLiveTranscript("");
    finalizedTurnsRef.current.clear();
    finalizedTranscriptFallbackRef.current = "";

    try {
      setStatus("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      setStatus("connecting");
      const tokenResponse = await fetch("/api/assemblyai/token");
      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.token) {
        throw new Error(tokenData.error || "Could not start transcription.");
      }

      const AudioContextConstructor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioContextConstructor) {
        throw new Error("Audio recording is not supported in this browser.");
      }

      const audioContext = new AudioContextConstructor({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      await audioContext.audioWorklet.addModule("/assemblyai-pcm-worklet.js");

      const params = new URLSearchParams({
        token: tokenData.token,
        speech_model: "universal-streaming-english",
        sample_rate: String(Math.round(audioContext.sampleRate)),
        encoding: "pcm_s16le",
        format_turns: "true",
        min_turn_silence: "160",
        max_turn_silence: "560",
        inactivity_timeout: "60",
      });

      const ws = new WebSocket(
        `wss://streaming.assemblyai.com/v3/ws?${params.toString()}`
      );
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        const source = audioContext.createMediaStreamSource(stream);
        const workletNode = new AudioWorkletNode(
          audioContext,
          "assemblyai-pcm-worklet"
        );
        const silenceGain = audioContext.createGain();

        silenceGain.gain.value = 0;
        source.connect(workletNode);
        workletNode.connect(silenceGain);
        silenceGain.connect(audioContext.destination);

        workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        workletNodeRef.current = workletNode;
        silenceGainRef.current = silenceGain;
        sessionTimeoutRef.current = setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "Terminate" }));
            ws.close(1000, "Maximum recording session reached");
          }
        }, 60_000);
        setStatus("recording");
      };

      ws.onmessage = (event) => {
        if (typeof event.data !== "string") return;

        const message = JSON.parse(event.data) as AssemblyAITurnMessage;
        if (message.type === "Termination") {
          return;
        }

        if (message.error || message.message) {
          setError(message.error || message.message || "Transcription failed.");
          setStatus("error");
          ws.close();
          return;
        }

        if (message.type !== "Turn" || !message.transcript) return;

        const transcript = message.transcript.trim();
        if (!transcript) return;

        if (message.end_of_turn && message.turn_is_formatted !== false) {
          const turnOrder = message.turn_order;
          if (
            typeof turnOrder === "number" &&
            finalizedTurnsRef.current.has(turnOrder)
          ) {
            return;
          }

          if (typeof turnOrder === "number") {
            finalizedTurnsRef.current.add(turnOrder);
          } else if (finalizedTranscriptFallbackRef.current === transcript) {
            return;
          }

          finalizedTranscriptFallbackRef.current = transcript;
          setLiveTranscript("");
          onTranscriptRef.current(transcript, true);
          return;
        }

        setLiveTranscript(transcript);
        onTranscriptRef.current(transcript, false);
      };

      ws.onerror = () => {
        setError("The transcription connection failed.");
        setStatus("error");
        cleanup();
      };

      ws.onclose = (event) => {
        wsRef.current = null;
        cleanup();
        setLiveTranscript("");
        setStatus((current) => {
          if (current === "error") return "error";
          if (event.code !== 1000) {
            setError(
              event.reason ||
                `The transcription connection closed unexpectedly (${event.code}).`
            );
            return "error";
          }
          return "idle";
        });
      };
    } catch (startError) {
      console.error("AssemblyAI streaming error:", startError);
      setError(
        startError instanceof Error
          ? startError.message
          : "Could not start transcription."
      );
      cleanup();
      setStatus("error");
    }
  }, [cleanup, status]);

  useEffect(() => stop, [stop]);

  return {
    error,
    isRecording: status === "recording",
    liveTranscript,
    start,
    status,
    stop,
  };
}
