"use client";

import React, { useEffect, useState } from "react";
import { useXR } from "@react-three/xr";

interface ImmersiveVRButtonProps {
  style?: React.CSSProperties;
  className?: string;
}

const ImmersiveVRButton: React.FC<ImmersiveVRButtonProps> = ({
  style,
  className,
}) => {
  const { session, isPresenting } = useXR();
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check for WebXR support specifically for immersive VR
    if (typeof navigator !== "undefined" && "xr" in navigator) {
      navigator.xr?.isSessionSupported("immersive-vr").then(setIsSupported);
    }
  }, []);

  const handleEnterVR = async () => {
    if (!isSupported || isPresenting) return;

    try {
      // Explicitly request immersive VR session
      const session = await navigator.xr?.requestSession("immersive-vr", {
        optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
        requiredFeatures: ["local-floor"],
      });

      if (session) {
        console.log("Immersive VR session started");
      }
    } catch (error) {
      console.error("Failed to start immersive VR session:", error);
    }
  };

  const handleExitVR = () => {
    if (session) {
      session.end();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={isPresenting ? handleExitVR : handleEnterVR}
      style={{
        background: "rgba(0, 212, 255, 0.2)",
        border: "1px solid rgba(0, 212, 255, 0.5)",
        borderRadius: "0.75rem",
        padding: "0.75rem 1.5rem",
        color: "#00d4ff",
        fontWeight: "500",
        backdropFilter: "blur(8px)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        ...style,
      }}
      className={className}
    >
      {isPresenting ? "Exit VR" : "Enter Immersive VR"}
    </button>
  );
};

export default ImmersiveVRButton;
