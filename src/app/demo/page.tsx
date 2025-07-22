"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Text,
  Html,
  Box,
  Sphere,
  Cylinder,
  Torus,
  Plane,
} from "@react-three/drei";
import { XR, VRButton, useXR, Controllers, Hands } from "@react-three/xr";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "@react-spring/three";
import {
  Plus,
  Minus,
  RotateCw,
  Settings,
  Monitor,
  Activity,
  Zap,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Play,
  Pause,
} from "lucide-react";

import GeneralStatsComponent from "../../components/stats/GeneralStatsComponent";
import ComponentStatsCard from "../../components/stats/ComponentStatsCard";
import AdvancedMetricsCard from "../../components/stats/AdvancedMetricsCard";
import Navigation from "../../components/Navigation";
import { usePerformanceStore, useGlobalMetrics } from "../../store/performance";
import {
  useThreeJsStats,
  useObjectTracking,
} from "../../hooks/useThreeJsStats";
import {
  useWebXRPerformanceMonitor,
  useRealTimePerformance,
} from "../../hooks/useRealTimePerformance";

// Demo Components
const RotatingCube: React.FC<{
  position: [number, number, number];
  color: string;
  name: string;
}> = ({ position, color, name }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { metrics, getStatsCard } = useObjectTracking(meshRef, true);
  const { isPresenting } = useXR();

  useFrame((state) => {
    if (meshRef.current) {
      // Adjust rotation speed based on XR mode for better performance
      const rotationSpeed = isPresenting ? 0.3 : 0.5;
      meshRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime) * rotationSpeed;
      meshRef.current.rotation.y =
        Math.cos(state.clock.elapsedTime) * rotationSpeed;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} name={name}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {getStatsCard() && (
        <Html position={[1, 1, 0]} transform>
          <ComponentStatsCard object={meshRef.current} position="top-right" />
        </Html>
      )}
    </group>
  );
};

const AnimatedSphere: React.FC<{
  position: [number, number, number];
  color: string;
  name: string;
}> = ({ position, color, name }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { metrics, getStatsCard } = useObjectTracking(meshRef, true);
  const { isPresenting } = useXR();

  const { scale } = useSpring({
    scale: [1, 1, 1],
    config: { tension: 120, friction: 14 },
  });

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      // Adjust animation intensity for XR mode
      const animationIntensity = isPresenting ? 0.3 : 0.5;
      meshRef.current.position.y =
        position[1] + Math.sin(time * 2) * animationIntensity;
      meshRef.current.scale.setScalar(
        1 + Math.sin(time * 3) * (isPresenting ? 0.1 : 0.2)
      );
    }
  });

  return (
    <animated.mesh
      ref={meshRef}
      position={position}
      scale={scale as any}
      name={name}
    >
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color={color} />
      {getStatsCard() && (
        <Html position={[-1, -1, 0]} transform>
          <ComponentStatsCard object={meshRef.current} position="bottom-left" />
        </Html>
      )}
    </animated.mesh>
  );
};

const ComplexGeometry: React.FC<{
  position: [number, number, number];
  color: string;
  name: string;
}> = ({ position, color, name }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { metrics, getStatsCard } = useObjectTracking(groupRef, true);
  const { isPresenting } = useXR();

  useFrame((state) => {
    if (groupRef.current) {
      // Adjust rotation speed for XR mode
      const rotationSpeed = isPresenting ? 0.3 : 0.5;
      groupRef.current.rotation.y = state.clock.elapsedTime * rotationSpeed;
    }
  });

  return (
    <group ref={groupRef} position={position} name={name}>
      <mesh>
        <torusGeometry args={[0.8, 0.3, 16, 100]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {getStatsCard() && (
        <Html position={[-1, 1, 0]} transform>
          <ComponentStatsCard object={groupRef.current} position="top-left" />
        </Html>
      )}
    </group>
  );
};

const ParticleSystem: React.FC<{
  position: [number, number, number];
  color: string;
  name: string;
}> = ({ position, color, name }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { metrics, getStatsCard } = useObjectTracking(groupRef, true);
  const { isPresenting } = useXR();
  const particles = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (groupRef.current) {
      // Adjust particle count based on XR mode for performance
      const particleCount = isPresenting ? 25 : 50;
      for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.02, 8, 8),
          new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7,
          })
        );
        particle.position.set(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4
        );
        groupRef.current.add(particle);
        particles.current.push(particle);
      }
    }
  }, [color, isPresenting]);

  useFrame((state) => {
    particles.current.forEach((particle, index) => {
      const time = state.clock.elapsedTime;
      // Adjust animation speed for XR mode
      const animationSpeed = isPresenting ? 0.5 : 1.0;
      particle.position.x = Math.sin(time * animationSpeed + index * 0.1) * 2;
      particle.position.y = Math.cos(time * animationSpeed + index * 0.1) * 2;
      particle.position.z =
        Math.sin(time * 0.5 * animationSpeed + index * 0.1) * 2;
    });
  });

  return (
    <group ref={groupRef} position={position} name={name}>
      {getStatsCard() && (
        <Html position={[1, -1, 0]} transform>
          <ComponentStatsCard
            object={groupRef.current}
            position="bottom-right"
          />
        </Html>
      )}
    </group>
  );
};

// Performance Monitor Component (must be inside Canvas)
const PerformanceMonitor: React.FC = () => {
  const { startMonitoring, stopMonitoring } = useThreeJsStats({
    enabled: true,
  });

  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  return null;
};

// XR Performance Monitor Component (must be inside Canvas)
const XRPerformanceMonitor: React.FC<{ onMetrics: (metrics: any) => void }> = ({
  onMetrics,
}) => {
  const {
    isMonitoring: isXRMonitoring,
    targetFrameRate,
    isXROptimized,
  } = useWebXRPerformanceMonitor(true);
  const { isEnabled: isRealTimeEnabled } = useRealTimePerformance(true);

  useEffect(() => {
    onMetrics({
      isXRMonitoring,
      targetFrameRate,
      isXROptimized,
      isRealTimeEnabled,
    });
  }, [
    isXRMonitoring,
    targetFrameRate,
    isXROptimized,
    isRealTimeEnabled,
    onMetrics,
  ]);

  return null;
};

// XR Stats Panel Component
const XRStatsPanel: React.FC<{ position: [number, number, number] }> = ({
  position,
}) => {
  const metrics = useGlobalMetrics();
  const { isPresenting } = useXR();

  if (!isPresenting) return null;

  return (
    <group position={position}>
      {/* Panel Background */}
      <mesh>
        <planeGeometry args={[2, 1.5]} />
        <meshBasicMaterial color="#000022" transparent opacity={0.9} />
      </mesh>

      {/* Panel Border */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[2.1, 1.6]} />
        <meshBasicMaterial color="#00aaff" transparent opacity={0.4} />
      </mesh>

      {/* Stats Content */}
      <Html position={[0, 0, 0.01]} transform>
        <div className="text-white text-xs p-2 w-48">
          <div className="font-bold mb-2">XR Performance</div>
          <div className="space-y-1">
            <div>FPS: {metrics.fps}</div>
            <div>Frame Time: {metrics.ms.toFixed(1)}ms</div>
            <div>
              Memory: {(metrics.memory.used / 1024 / 1024).toFixed(1)}MB
            </div>
            <div>Draw Calls: {metrics.drawCalls}</div>
            <div>Triangles: {metrics.triangles.toLocaleString()}</div>
          </div>
        </div>
      </Html>
    </group>
  );
};

// Control Panel Component
const ControlPanel: React.FC<{
  onAddComponent: () => void;
  onRemoveComponent: () => void;
  onToggleStats: () => void;
  onReset: () => void;
  isStatsVisible: boolean;
  componentCount: number;
  isXRActive: boolean;
}> = ({
  onAddComponent,
  onRemoveComponent,
  onToggleStats,
  onReset,
  isStatsVisible,
  componentCount,
  isXRActive,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Demo Controls</h3>
          <div className="text-sm text-gray-400">
            {componentCount} components
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAddComponent}
            className="control-button flex items-center justify-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>

          <button
            onClick={onRemoveComponent}
            className="control-button flex items-center justify-center space-x-1"
            disabled={componentCount === 0}
          >
            <Minus className="w-4 h-4" />
            <span>Remove</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onToggleStats}
            className={`control-button flex items-center justify-center space-x-1 ${
              isStatsVisible ? "bg-blue-600/20 text-blue-400" : ""
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Stats</span>
          </button>

          <button
            onClick={onReset}
            className="control-button flex items-center justify-center space-x-1"
          >
            <RotateCw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

        <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
          <p className="font-semibold mb-1">Quick Guide:</p>
          <p>
            • <span className="text-cyan-400">Click</span> components to see
            individual stats
          </p>
          <p>
            • <span className="text-green-400">Add/Remove</span> components with
            buttons
          </p>
          <p>
            • <span className="text-blue-400">Stats</span> toggle shows/hides
            performance data
          </p>
          <p>
            • <span className="text-purple-400">WebXR</span>:{" "}
            {isXRActive ? "Active" : "Inactive"}
          </p>
        </div>

        {/* WebXR Button */}
        <div className="mt-3">
          <VRButton
            style={{
              background: "rgba(0, 212, 255, 0.2)",
              border: "1px solid rgba(0, 212, 255, 0.5)",
              borderRadius: "0.75rem",
              padding: "0.5rem 1rem",
              color: "#00d4ff",
              fontWeight: "500",
              backdropFilter: "blur(8px)",
              fontSize: "0.875rem",
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Main Demo Scene
const DemoScene: React.FC = () => {
  const [components, setComponents] = useState([
    {
      id: 1,
      type: "cube",
      position: [-3, 0, 0],
      color: "#ff6b6b",
      name: "Rotating Cube",
    },
    {
      id: 2,
      type: "sphere",
      position: [0, 0, 0],
      color: "#4ecdc4",
      name: "Bouncing Sphere",
    },
    {
      id: 3,
      type: "complex",
      position: [3, 0, 0],
      color: "#45b7d1",
      name: "Complex Geometry",
    },
    {
      id: 4,
      type: "particles",
      position: [0, -3, 0],
      color: "#96ceb4",
      name: "Particle System",
    },
  ]);

  const [isStatsVisible, setIsStatsVisible] = useState(true);
  const [isXRActive, setIsXRActive] = useState(false);
  const [nextId, setNextId] = useState(5);
  const [xrMetrics, setXrMetrics] = useState({
    isXRMonitoring: false,
    targetFrameRate: 60,
    isXROptimized: false,
    isRealTimeEnabled: false,
  });

  const addComponent = () => {
    const types = ["cube", "sphere", "complex", "particles"];
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#54a0ff",
      "#5f27cd",
    ];

    const newComponent = {
      id: nextId,
      type: types[Math.floor(Math.random() * types.length)],
      position: [
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
      ] as [number, number, number],
      color: colors[Math.floor(Math.random() * colors.length)],
      name: `Component ${nextId}`,
    };

    setComponents((prev) => [...prev, newComponent]);
    setNextId((prev) => prev + 1);
  };

  const removeComponent = () => {
    if (components.length > 0) {
      setComponents((prev) => prev.slice(0, -1));
    }
  };

  const resetScene = () => {
    setComponents([
      {
        id: 1,
        type: "cube",
        position: [-3, 0, 0],
        color: "#ff6b6b",
        name: "Rotating Cube",
      },
      {
        id: 2,
        type: "sphere",
        position: [0, 0, 0],
        color: "#4ecdc4",
        name: "Bouncing Sphere",
      },
      {
        id: 3,
        type: "complex",
        position: [3, 0, 0],
        color: "#45b7d1",
        name: "Complex Geometry",
      },
      {
        id: 4,
        type: "particles",
        position: [0, -3, 0],
        color: "#96ceb4",
        name: "Particle System",
      },
    ]);
    setNextId(5);
  };

  const renderComponent = (component: any) => {
    switch (component.type) {
      case "cube":
        return (
          <RotatingCube
            key={component.id}
            position={component.position}
            color={component.color}
            name={component.name}
          />
        );
      case "sphere":
        return (
          <AnimatedSphere
            key={component.id}
            position={component.position}
            color={component.color}
            name={component.name}
          />
        );
      case "complex":
        return (
          <ComplexGeometry
            key={component.id}
            position={component.position}
            color={component.color}
            name={component.name}
          />
        );
      case "particles":
        return (
          <ParticleSystem
            key={component.id}
            position={component.position}
            color={component.color}
            name={component.name}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 5, 10], fov: 75 }}
        style={{
          background: "linear-gradient(to bottom, #1a1a2e, #16213e, #0f3460)",
        }}
      >
        <XR
          referenceSpace="local-floor"
          onSessionStart={() => setIsXRActive(true)}
          onSessionEnd={() => setIsXRActive(false)}
        >
          <Environment preset="sunset" />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />

          {/* Ground Plane */}
          <Plane
            args={[20, 20]}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -2, 0]}
          >
            <meshStandardMaterial color="#2c3e50" transparent opacity={0.3} />
          </Plane>

          {/* Performance Monitor */}
          <PerformanceMonitor />

          {/* Render Components */}
          {components.map(renderComponent)}

          {/* XR Performance Monitor */}
          <XRPerformanceMonitor onMetrics={setXrMetrics} />

          {/* XR Stats Panel */}
          <XRStatsPanel position={[0, 2, -3]} />

          {/* XR Controllers */}
          <Controllers />
          <Hands />

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />
        </XR>
      </Canvas>

      {/* Navigation */}
      <Navigation />

      {/* UI Overlay */}
      <ControlPanel
        onAddComponent={addComponent}
        onRemoveComponent={removeComponent}
        onToggleStats={() => setIsStatsVisible(!isStatsVisible)}
        onReset={resetScene}
        isStatsVisible={isStatsVisible}
        componentCount={components.length}
        isXRActive={isXRActive}
      />

      {/* Stats Components - Same positioning as main screen */}
      {isStatsVisible && !isXRActive && (
        <div className="fixed top-4 left-4 z-50 space-y-4">
          <GeneralStatsComponent />
          <AdvancedMetricsCard className="max-w-sm" />
        </div>
      )}

      {/* XR-specific stats when in XR mode */}
      {isStatsVisible && isXRActive && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-purple-900/90 backdrop-blur-sm border border-purple-500/50 rounded-lg p-3">
            <div className="text-purple-400 text-sm font-semibold mb-2">
              XR Performance
            </div>
            <div className="text-xs text-purple-300 space-y-1">
              <div>Target Frame Rate: {xrMetrics.targetFrameRate}fps</div>
              <div>XR Optimized: {xrMetrics.isXROptimized ? "Yes" : "No"}</div>
              <div>
                Real-time Monitoring:{" "}
                {xrMetrics.isRealTimeEnabled ? "Active" : "Inactive"}
              </div>
              <div>
                XR Monitoring:{" "}
                {xrMetrics.isXRMonitoring ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default function DemoPage() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <DemoScene />
    </div>
  );
}
