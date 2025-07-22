"use client";
import React, { useEffect, useState, useRef } from "react";

interface ImmersiveVRButtonProps {
  style?: React.CSSProperties;
  className?: string;
  onSessionStart?: (session: XRSession) => void;
  onSessionEnd?: () => void;
}

const ImmersiveVRButton: React.FC<ImmersiveVRButtonProps> = ({
  style,
  className,
  onSessionStart,
  onSessionEnd,
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const sessionRef = useRef<XRSession | null>(null);

  useEffect(() => {
    // Check for WebXR support specifically for immersive VR
    if (typeof navigator !== "undefined" && "xr" in navigator) {
      navigator.xr?.isSessionSupported("immersive-vr").then(setIsSupported);
    }
  }, []);

  const handleEnterVR = async () => {
    if (!isSupported || isPresenting || isLoading) return;

    setIsLoading(true);
    try {
      // Request immersive VR session with fallback options
      const sessionOptions: XRSessionInit = {
        optionalFeatures: [
          "local-floor",
          "bounded-floor",
          "hand-tracking",
          "layers",
        ],
        // Make required features optional first, then try without if it fails
      };

      let session: XRSession | undefined;

      // First try with local-floor as required
      try {
        session = await navigator.xr?.requestSession("immersive-vr", {
          ...sessionOptions,
          requiredFeatures: ["local-floor"],
        });
      } catch (error) {
        console.warn(
          "Failed with local-floor required, trying with just 'local':",
          error
        );
        // Fallback to basic local tracking
        session = await navigator.xr?.requestSession("immersive-vr", {
          ...sessionOptions,
          requiredFeatures: ["local"],
        });
      }

      if (session) {
        sessionRef.current = session;
        setIsPresenting(true);
        console.log("🎮 Immersive VR session started via button");
        console.log("🔧 XR State: BUTTON TRIGGERED IMMERSIVE VR");
        console.log("📊 Session Details:", {
          inputSources: session.inputSources?.length || 0,
          environmentBlendMode: session.environmentBlendMode,
          interactionMode: session.interactionMode,
        });

        // Listen for session end
        session.addEventListener("end", () => {
          sessionRef.current = null;
          setIsPresenting(false);
          setIsLoading(false);
          console.log("🚪 VR session ended via button");
          console.log("🔧 XR State: BUTTON TRIGGERED VR EXIT");
          onSessionEnd?.();
        });

        // Notify parent component
        onSessionStart?.(session);
      }
    } catch (error) {
      console.error("Failed to start immersive VR session:", error);

      // Provide helpful error messages
      if (error instanceof Error) {
        if (error.message.includes("NotSupportedError")) {
          console.error("Immersive VR not supported on this device/browser");
        } else if (error.message.includes("SecurityError")) {
          console.error("WebXR requires HTTPS or localhost");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExitVR = async () => {
    if (sessionRef.current) {
      try {
        await sessionRef.current.end();
      } catch (error) {
        console.error("Error ending VR session:", error);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={isPresenting ? handleExitVR : handleEnterVR}
      disabled={isLoading}
      style={{
        background: isLoading
          ? "rgba(128, 128, 128, 0.2)"
          : "rgba(0, 212, 255, 0.2)",
        border: `1px solid ${
          isLoading ? "rgba(128, 128, 128, 0.5)" : "rgba(0, 212, 255, 0.5)"
        }`,
        borderRadius: "0.75rem",
        padding: "0.75rem 1.5rem",
        color: isLoading ? "#808080" : "#00d4ff",
        fontWeight: "500",
        backdropFilter: "blur(8px)",
        cursor: isLoading ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        opacity: isLoading ? 0.7 : 1,
        ...style,
      }}
      className={className}
    >
      {isLoading
        ? "Starting VR..."
        : isPresenting
        ? "Exit VR"
        : "Enter Immersive VR"}
    </button>
  );
};

export default ImmersiveVRButton;
