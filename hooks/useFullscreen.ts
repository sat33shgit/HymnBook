"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bgMode, setBgMode] = useState<"white" | "black">("white");
  const containerRef = useRef<HTMLDivElement>(null);

  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    document.body.style.overflow = "";
  }, []);

  const toggleBgMode = useCallback(() => {
    setBgMode((prev) => (prev === "white" ? "black" : "white"));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        exitFullscreen();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, exitFullscreen]);

  // Clean up overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return {
    isFullscreen,
    bgMode,
    containerRef,
    enterFullscreen,
    exitFullscreen,
    toggleBgMode,
  };
}
