"use client";

import { useState, useRef, useCallback } from 'react';

interface UseWebcamProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function useWebcam({ videoRef, canvasRef }: UseWebcamProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);

  const startWebcam = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError(null);
        setIsWebcamActive(true);
      } catch (err) {
        console.error("Error accessing webcam:", err);
        if (err instanceof Error) {
          setError(`Error accessing webcam: ${err.message}. Please ensure permissions are granted.`);
        } else {
          setError("An unknown error occurred while accessing the webcam.");
        }
        setIsWebcamActive(false);
      }
    } else {
      setError("Webcam access is not supported by this browser.");
      setIsWebcamActive(false);
    }
  }, [videoRef]);

  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsWebcamActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, videoRef]);

  const capturePhoto = useCallback((): string | null => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg');
      }
    }
    return null;
  }, [videoRef, canvasRef, stream]);

  return { stream, error, isWebcamActive, startWebcam, stopWebcam, capturePhoto, setError };
}
