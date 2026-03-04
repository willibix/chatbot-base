import { useCallback, useEffect, useRef, useState } from "react";

interface UseVoiceRecorderReturn {
    /** Start recording audio from the microphone */
    startRecording: () => Promise<void>;
    /** Stop recording and return the audio blob */
    stopRecording: () => Promise<Blob>;
    /** Cancel the current recording without returning data */
    cancelRecording: () => void;
    /** Whether the recorder is currently capturing audio */
    isRecording: boolean;
    /** Duration of the current recording in seconds */
    recordingDuration: number;
    /** Whether the user denied microphone permission */
    permissionDenied: boolean;
}

function useVoiceRecorder(): UseVoiceRecorderReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const resolveRef = useRef<((blob: Blob) => void) | null>(null);

    const cleanup = useCallback(() => {
        // Stop duration timer
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Stop all media tracks (releases the microphone)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        mediaRecorderRef.current = null;
        chunksRef.current = [];
        setRecordingDuration(0);
    }, []);

    // Cleanup on unmount
    useEffect(
        () => () => {
            cleanup();
        },
        [cleanup],
    );

    const startRecording = useCallback(async () => {
        // Reset state
        chunksRef.current = [];
        setPermissionDenied(false);
        setRecordingDuration(0);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Use webm/opus if supported, fall back to default
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : undefined;

            const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: mediaRecorder.mimeType || "audio/webm",
                });
                if (resolveRef.current) {
                    resolveRef.current(blob);
                    resolveRef.current = null;
                }
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Start duration counter
            const startTime = Date.now();
            intervalRef.current = setInterval(() => {
                setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        } catch (error) {
            cleanup();
            if (error instanceof DOMException && error.name === "NotAllowedError") {
                setPermissionDenied(true);
            } else {
                throw error;
            }
        }
    }, [cleanup]);

    const stopRecording = useCallback(
        async (): Promise<Blob> =>
            new Promise<Blob>((resolve, reject) => {
                const mediaRecorder = mediaRecorderRef.current;
                if (mediaRecorder?.state !== "recording") {
                    reject(new Error("Not recording"));
                    return;
                }

                resolveRef.current = resolve;
                mediaRecorder.stop();
                setIsRecording(false);

                // Stop duration timer
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }

                // Stop all media tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                    streamRef.current = null;
                }
            }),
        [],
    );

    const cancelRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === "recording") {
            // Clear the resolve so the onstop handler doesn't fire callback
            resolveRef.current = null;
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        cleanup();
    }, [cleanup]);

    return {
        startRecording,
        stopRecording,
        cancelRecording,
        isRecording,
        recordingDuration,
        permissionDenied,
    };
}

export default useVoiceRecorder;
