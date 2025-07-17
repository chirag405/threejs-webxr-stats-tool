'use client'

import React, { Suspense, useEffect, useRef, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { XR, VRButton, useXR, Controllers, Hands } from '@react-three/xr'
import { OrbitControls, Environment, Text, Html, Box, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpring, animated } from '@react-spring/three'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Expand, 
  Minimize2, 
  Settings, 
  Monitor,
  Activity,
  Zap
} from 'lucide-react'

import GeneralStatsComponent from '@/components/stats/GeneralStatsComponent'
import PerformanceChangeComponent from '@/components/stats/PerformanceChangeComponent'
import AdvancedMetricsCard from '@/components/stats/AdvancedMetricsCard'
import { usePerformanceStore, useScreens, useActiveScreen, useGlobalMetrics } from '@/store/performance'
import { useRealTimePerformance, useRealTimeMemoryMonitor, useWebXRPerformanceMonitor } from '@/hooks/useRealTimePerformance'

// XR store is handled internally by @react-three/xr

interface SpatialScreenProps {
  position: [number, number, number]
  scale: [number, number, number]
  title: string
  isActive: boolean
  isEnlarged: boolean
  type: 'main' | 'stats' | 'performance' | 'component'
  screenNumber: number
  screenId: string
  onDelete?: (id: string) => void
  onEnlarge?: (id: string) => void
  onShrink?: (id: string) => void
}

const SpatialScreen: React.FC<SpatialScreenProps> = ({ 
  position, 
  scale, 
  title, 
  isActive, 
  isEnlarged,
  type,
  screenNumber,
  screenId,
  onDelete,
  onEnlarge,
  onShrink
}) => {
  const metrics = useGlobalMetrics()
  const groupRef = useRef<THREE.Group>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, z: 0 })
  const [initialPosition, setInitialPosition] = useState(position)
  const { updateScreenPosition, isXRActive } = usePerformanceStore()
  const { isPresenting } = useXR()
  
  const handleDelete = () => {
    if (onDelete) onDelete(screenId)
  }
  
  const handleResize = () => {
    if (isEnlarged && onShrink) {
      onShrink(screenId)
    } else if (!isEnlarged && onEnlarge) {
      onEnlarge(screenId)
    }
  }
  
  // XR-compatible drag handling using Three.js event system
  const handlePointerDown = useCallback((event: any) => {
    if (isEnlarged) return // Don't allow dragging enlarged screens
    
    event.stopPropagation()
    setIsDragging(true)
    
    // For XR mode, use the 3D intersection point
    if (isPresenting && event.point) {
      setDragStart({ 
        x: event.point.x, 
        y: event.point.y, 
        z: event.point.z 
      })
      setInitialPosition([position[0], position[1], position[2]])
    } else {
      // Fallback to screen coordinates for desktop mode
      setDragStart({ x: event.clientX || 0, y: event.clientY || 0, z: 0 })
      setInitialPosition([position[0], position[1], position[2]])
    }
    
    // Only add DOM listeners for non-XR mode
    if (!isPresenting) {
      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp)
    }
  }, [position, isEnlarged, isPresenting])
  
  const handlePointerMove = useCallback((event: any) => {
    if (!isDragging || !groupRef.current) return
    
    let newPosition: [number, number, number]
    
    if (isPresenting && event.point) {
      // Direct 3D positioning for XR mode
      const deltaX = event.point.x - dragStart.x
      const deltaY = event.point.y - dragStart.y
      const deltaZ = event.point.z - dragStart.z
      
      newPosition = [
        initialPosition[0] + deltaX,
        initialPosition[1] + deltaY,
        initialPosition[2] + deltaZ * 0.5 // Reduced Z sensitivity
      ]
    } else {
      // Screen coordinate mapping for desktop mode
      const deltaX = ((event.clientX || 0) - dragStart.x) * 0.008
      const deltaY = -((event.clientY || 0) - dragStart.y) * 0.008
      
      newPosition = [
        initialPosition[0] + deltaX,
        initialPosition[1] + deltaY,
        initialPosition[2]
      ]
    }
    
    groupRef.current.position.set(...newPosition)
  }, [isDragging, dragStart, initialPosition, isPresenting])
  
  const handlePointerUp = useCallback((event?: any) => {
    if (!isDragging || !groupRef.current) return
    
    setIsDragging(false)
    
    // Update the store with the new position
    const newPos = groupRef.current.position
    if (updateScreenPosition) {
      updateScreenPosition(screenId, {
        x: newPos.x,
        y: newPos.y,
        z: newPos.z
      })
    }
    
    // Only remove DOM listeners for non-XR mode
    if (!isPresenting) {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDragging, screenId, updateScreenPosition, isPresenting])
  
  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      if (!isPresenting) {
        document.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('pointerup', handlePointerUp)
      }
    }
  }, [handlePointerMove, handlePointerUp, isPresenting])
  
  // Smooth animation for position changes
  const { animatedPosition, animatedScale } = useSpring({
    animatedPosition: isDragging ? [position[0], position[1], position[2]] : position,
    animatedScale: scale,
    config: { tension: 120, friction: 14, mass: 1 }
  })
  
  return (
    <animated.group 
      ref={groupRef}
      position={animatedPosition as any} 
      scale={animatedScale as any}
      onPointerDown={handlePointerDown}
      onPointerMove={isDragging ? handlePointerMove : undefined}
      onPointerUp={isDragging ? handlePointerUp : undefined}
      onPointerEnter={() => !isEnlarged && setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      {/* Screen Frame - Iron Man style */}
      <mesh>
        <planeGeometry args={[2.4, 1.8]} />
        <meshBasicMaterial 
          color={isDragging ? "#ffff00" : (isHovered ? "#0088ff" : (isActive ? "#00d4ff" : "#004466"))} 
          transparent 
          opacity={isDragging ? 0.4 : (isHovered ? 0.3 : 0.2)}
        />
      </mesh>
      
      {/* Screen Border */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[2.5, 1.9]} />
        <meshBasicMaterial 
          color={isActive ? "#00d4ff" : "#0088cc"} 
          transparent 
          opacity={0.5}
        />
      </mesh>
      
      {/* Corner Indicators */}
      {[-1.1, 1.1].map((x) => 
        [-0.8, 0.8].map((y) => (
          <mesh key={`corner-${x}-${y}`} position={[x, y, 0.01]}>
            <planeGeometry args={[0.1, 0.1]} />
            <meshBasicMaterial 
              color={isActive ? "#00ffff" : "#006699"} 
              transparent 
              opacity={0.8}
            />
          </mesh>
        ))
      )}
      
      {/* Screen Content - Simple 3D display */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[2.2, 1.6]} />
        <meshBasicMaterial 
          color="#001122" 
          transparent 
          opacity={0.9}
        />
      </mesh>
      
      {/* Screen Controls - Browser Tab Style */}
      <group position={[0, 0.9, 0.03]}>
        {/* Delete Button */}
        <mesh 
          position={[0.8, 0, 0]} 
          onClick={handleDelete}
          onPointerOver={(e) => { 
            e.stopPropagation()
            const mesh = e.object as any
            if (mesh.material) mesh.material.color.setHex(0xff4444)
          }}
          onPointerOut={(e) => { 
            e.stopPropagation()
            const mesh = e.object as any
            if (mesh.material) mesh.material.color.setHex(0xff0000)
          }}
        >
          <planeGeometry args={[0.2, 0.2]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
        </mesh>
        <Text
          position={[0.8, 0, 0.01]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          ×
        </Text>
        
        {/* Enlarge/Shrink Button */}
        <mesh 
          position={[0.5, 0, 0]} 
          onClick={handleResize}
          onPointerOver={(e) => { 
            e.stopPropagation()
            const mesh = e.object as any
            if (mesh.material) mesh.material.color.setHex(0x44ff44)
          }}
          onPointerOut={(e) => { 
            e.stopPropagation()
            const mesh = e.object as any
            if (mesh.material) mesh.material.color.setHex(0x00ff00)
          }}
        >
          <planeGeometry args={[0.2, 0.2]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
        </mesh>
        <Text
          position={[0.5, 0, 0.01]}
          fontSize={0.06}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {isEnlarged ? '⧉' : '⧈'}
        </Text>
      </group>
      
      {/* Large Screen Number Display */}
      <Text
        position={[0, 0, 0.02]}
        fontSize={0.4}
        color={isActive ? "#00ffff" : "#004466"}
        anchorX="center"
        anchorY="middle"
      >
        {screenNumber}
      </Text>
      
      {/* Screen Type Label */}
      <Text
        position={[0, -0.4, 0.02]}
        fontSize={0.08}
        color="#0088cc"
        anchorX="center"
        anchorY="middle"
      >
        {type.toUpperCase()}
      </Text>
      
      <Text
        position={[0, -0.6, 0.02]}
        fontSize={0.06}
        color="#006699"
        anchorX="center"
        anchorY="middle"
      >
        {isActive ? 'ACTIVE' : 'STANDBY'}
      </Text>
      
      {/* Title Label */}
      <Text
        position={[0, 1.0, 0.01]}
        fontSize={0.1}
        color={isActive ? "#00ffff" : "#0088cc"}
        anchorX="center"
        anchorY="middle"
      >
        Screen {screenNumber} {isDragging ? '(Dragging)' : (isHovered ? '(Draggable)' : '')}
      </Text>
      
      {/* Active Indicator */}
      {isActive && (
        <mesh position={[0, -1.0, 0.01]}>
          <planeGeometry args={[0.2, 0.05]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
      )}
    </animated.group>
  )
}



interface SpatialControlsProps {
  onCreateScreen: () => void
  onDeleteScreen: () => void
  onEnlargeScreen: () => void
  onShrinkScreen: () => void
  onNextScreen: () => void
  onPrevScreen: () => void
  onToggleSettings: () => void
}

const SpatialControls: React.FC<SpatialControlsProps> = ({
  onCreateScreen,
  onDeleteScreen,
  onEnlargeScreen,
  onShrinkScreen,
  onNextScreen,
  onPrevScreen,
  onToggleSettings
}) => {
  const activeScreen = useActiveScreen()
  const screens = useScreens()
  
  return (
    <motion.div 
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-2 bg-black/90 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-3">
        {/* Navigation Controls */}
        <button
          onClick={onPrevScreen}
          className="p-3 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 rounded-lg transition-all duration-200"
          disabled={screens.length <= 1}
        >
          <ChevronLeft className="w-5 h-5 text-cyan-400" />
        </button>
        
        <div className="text-sm text-cyan-400 px-4 py-2 bg-cyan-500/20 rounded-lg font-mono">
          {activeScreen?.title || 'No Screen'} ({screens.findIndex(s => s.id === activeScreen?.id) + 1}/{screens.length})
        </div>
        
        <button
          onClick={onNextScreen}
          className="p-3 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 rounded-lg transition-all duration-200"
          disabled={screens.length <= 1}
        >
          <ChevronRight className="w-5 h-5 text-cyan-400" />
        </button>

        <div className="w-px h-8 bg-cyan-500/30 mx-2" />

        {/* Screen Controls */}
        <button
          onClick={onCreateScreen}
          className="p-3 bg-green-500/20 hover:bg-green-500/40 border border-green-500/50 rounded-lg transition-all duration-200"
          title="Create New Screen"
        >
          <Plus className="w-5 h-5 text-green-400" />
        </button>
        
        <button
          onClick={activeScreen?.isEnlarged ? onShrinkScreen : onEnlargeScreen}
          className="p-3 bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/50 rounded-lg transition-all duration-200"
          title={activeScreen?.isEnlarged ? "Shrink Screen" : "Enlarge Screen"}
        >
          {activeScreen?.isEnlarged ? 
            <Minimize2 className="w-5 h-5 text-yellow-400" /> : 
            <Expand className="w-5 h-5 text-yellow-400" />
          }
        </button>
        
        <button
          onClick={onDeleteScreen}
          className="p-3 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-lg transition-all duration-200"
          disabled={screens.length <= 1}
          title="Delete Screen"
        >
          <X className="w-5 h-5 text-red-400" />
        </button>

        <div className="w-px h-8 bg-cyan-500/30 mx-2" />

        {/* Settings */}
        <button
          onClick={onToggleSettings}
          className="p-3 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 rounded-lg transition-all duration-200"
          title="Settings"
        >
          <Settings className="w-5 h-5 text-blue-400" />
        </button>
      </div>
    </motion.div>
  )
}

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { 
    isMonitoringEnabled, 
    showDetailedStats,
    updateInterval,
    toggleMonitoring,
    toggleDetailedStats,
    setUpdateInterval
  } = usePerformanceStore()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed top-6 right-6 z-50 w-80"
          initial={{ opacity: 0, scale: 0.9, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-black/90 backdrop-blur-md border border-cyan-500/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-cyan-400">Settings</h3>
              <button onClick={onClose} className="p-1 text-cyan-400 hover:text-cyan-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Monitoring Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Performance Monitoring</span>
                <button
                  onClick={toggleMonitoring}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    isMonitoringEnabled ? 'bg-cyan-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    isMonitoringEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Detailed Stats Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Detailed Statistics</span>
                <button
                  onClick={toggleDetailedStats}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    showDetailedStats ? 'bg-cyan-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    showDetailedStats ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Update Interval */}
              <div>
                <label className="block text-sm text-white mb-2">Update Interval (ms)</label>
                <input
                  type="range"
                  min="16"
                  max="1000"
                  step="16"
                  value={updateInterval}
                  onChange={(e) => setUpdateInterval(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>16ms (60fps)</span>
                  <span className="text-cyan-400">{updateInterval}ms</span>
                  <span>1000ms (1fps)</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Floating 3D Metrics Panel for XR
const XRMetricsPanel: React.FC<{ position: [number, number, number], title: string, type: 'performance' | 'xr' }> = ({ position, title, type }) => {
  const metrics = useGlobalMetrics()
  
  return (
    <group position={position}>
      {/* Panel Background with glow effect */}
      <mesh>
        <planeGeometry args={[1.8, 2.4]} />
        <meshBasicMaterial color="#000022" transparent opacity={0.9} />
      </mesh>
      
      {/* Panel Border with animated glow */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[1.9, 2.5]} />
        <meshBasicMaterial color="#00aaff" transparent opacity={0.4} />
      </mesh>
      
      {/* Corner accents */}
      {[[-0.9, 1.2], [0.9, 1.2], [-0.9, -1.2], [0.9, -1.2]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.01]}>
          <planeGeometry args={[0.1, 0.1]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
        </mesh>
      ))}
      
      {/* Title */}
      <Text
        position={[0, 1.1, 0.01]}
        fontSize={0.09}
        color="#00aaff"
        anchorX="center"
        anchorY="middle"
      >
        {title}
      </Text>
      
      {type === 'performance' ? (
        <>
          {/* Performance Metrics */}
          <Text position={[-0.8, 0.8, 0.01]} fontSize={0.07} color="#ffffff" anchorX="left">
            FPS: 
          </Text>
          <Text position={[-0.4, 0.8, 0.01]} fontSize={0.07} color={metrics.fps > 60 ? "#00ff00" : metrics.fps > 30 ? "#ffaa00" : "#ff0000"} anchorX="left">
            {metrics.fps}
          </Text>
          
          <Text position={[-0.8, 0.6, 0.01]} fontSize={0.07} color="#ffffff" anchorX="left">
            Frame: {metrics.frameTime.toFixed(1)}ms
          </Text>
          
          <Text position={[-0.8, 0.4, 0.01]} fontSize={0.07} color="#ffffff" anchorX="left">
            CPU: {metrics.cpuFrameTime.toFixed(1)}ms
          </Text>
          
          <Text position={[-0.8, 0.2, 0.01]} fontSize={0.07} color="#ffffff" anchorX="left">
            GPU: {metrics.gpuFrameTime.toFixed(1)}ms
          </Text>
          
          <Text position={[-0.8, 0, 0.01]} fontSize={0.07} color="#ffffff" anchorX="left">
            Memory: {(metrics.memory.used / 1024 / 1024).toFixed(1)}MB
          </Text>
          
          <Text position={[-0.8, -0.2, 0.01]} fontSize={0.07} color="#ffffff" anchorX="left">
            Draw Calls: {metrics.drawCalls}
          </Text>
          
          <Text position={[-0.8, -0.4, 0.01]} fontSize={0.07} color="#ffffff" anchorX="left">
            Triangles: {(metrics.triangles / 1000).toFixed(1)}K
          </Text>
          
          <Text position={[-0.8, -0.6, 0.01]} fontSize={0.07} color="#ffffff" anchorX="left">
            Textures: {metrics.textures}
          </Text>
          
          <Text position={[-0.8, -0.8, 0.01]} fontSize={0.07} color="#ffffff" anchorX="left">
            Geometries: {metrics.geometries}
          </Text>
          
          <Text position={[-0.8, -1.0, 0.01]} fontSize={0.07} color="#ffffff" anchorX="left">
            Programs: {metrics.programs}
          </Text>
        </>
      ) : (
        <>
          {/* XR-Specific Metrics */}
          <Text position={[-0.8, 0.8, 0.01]} fontSize={0.07} color="#00ffaa" anchorX="left">
            XR FPS: {metrics.xrFrameRate.toFixed(1)}
          </Text>
          
          <Text position={[-0.8, 0.6, 0.01]} fontSize={0.07} color="#00ffaa" anchorX="left">
            Motion-Photon: {metrics.motionToPhotonDelay.toFixed(1)}ms
          </Text>
          
          <Text position={[-0.8, 0.4, 0.01]} fontSize={0.07} color="#00ffaa" anchorX="left">
            Controller Lag: {metrics.controllerInputLag.toFixed(1)}ms
          </Text>
          
          <Text position={[-0.8, 0.2, 0.01]} fontSize={0.07} color="#00ffaa" anchorX="left">
            Session Init: {metrics.xrSessionInitTime.toFixed(0)}ms
          </Text>
          
          <Text position={[-0.8, 0, 0.01]} fontSize={0.07} color="#00ffaa" anchorX="left">
            Predicted Time: {metrics.xrPredictedDisplayTime.toFixed(1)}ms
          </Text>
          
          <Text position={[-0.8, -0.2, 0.01]} fontSize={0.07} color="#ffffff" anchorX="left">
            Network Latency: {metrics.networkLatency.toFixed(1)}ms
          </Text>
          
          <Text position={[-0.8, -0.4, 0.01]} fontSize={0.07} color="#ffffff" anchorX="left">
            JS Time: {metrics.javascriptTime.toFixed(2)}ms
          </Text>
          
          <Text position={[-0.8, -0.6, 0.01]} fontSize={0.07} color="#ffffff" anchorX="left">
            GC Time: {metrics.garbageCollectionTime.toFixed(2)}ms
          </Text>
          
          <Text position={[-0.8, -0.8, 0.01]} fontSize={0.07} color="#ffffff" anchorX="left">
            GPU Memory: {(metrics.gpuMemoryUsage / 1024 / 1024).toFixed(1)}MB
          </Text>
          
          <Text position={[-0.8, -1.0, 0.01]} fontSize={0.07} color="#ffffff" anchorX="left">
            Shader Compile: {metrics.shaderCompileTime.toFixed(1)}ms
          </Text>
        </>
      )}
    </group>
  )
}

// XR Controllers Visualization
const XRControllerVisualization: React.FC = () => {
  const { controllers, isPresenting } = useXR()
  
  // Fallback controller positions for simulation
  const fallbackControllers = [
    { position: [-0.3, 1, -0.5], rotation: [0, 0, 0] },
    { position: [0.3, 1, -0.5], rotation: [0, 0, 0] }
  ]
  
  const controllersToRender = controllers.length > 0 ? controllers : (isPresenting ? fallbackControllers : [])
  
  return (
    <>
      {controllersToRender.map((controller, index) => (
        <group key={index} position={controller.position as [number, number, number]} rotation={controller.rotation as [number, number, number]}>
          {/* Controller Model */}
          <Box args={[0.03, 0.1, 0.03]} position={[0, 0, -0.05]}>
            <meshBasicMaterial color="#333333" />
          </Box>
          
          {/* Trigger */}
          <Box args={[0.02, 0.02, 0.04]} position={[0, -0.02, -0.02]}>
            <meshBasicMaterial color="#666666" />
          </Box>
          
          {/* Pointer Ray */}
          <mesh position={[0, 0, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.001, 0.001, 1]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
          </mesh>
          
          {/* Controller Tip */}
          <Sphere args={[0.01]} position={[0, 0, -1]}>
            <meshBasicMaterial color="#00ffff" />
          </Sphere>
          
          {/* Controller Label */}
          <Text
            position={[0, 0.15, 0]}
            fontSize={0.03}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            Controller {index + 1}
          </Text>
        </group>
      ))}
    </>
  )
}

// Enhanced XR Environment with floating UI
const XREnvironment: React.FC = () => {
  const [time, setTime] = useState(0)
  
  // Animate environment elements
  useFrame((state) => {
    setTime(state.clock.elapsedTime)
  })
  
  return (
    <>
      {/* Floating Metrics Panels */}
      <XRMetricsPanel position={[-2.5, 1, -1.8]} title="Performance Metrics" type="performance" />
      <XRMetricsPanel position={[2.5, 1, -1.8]} title="XR Metrics" type="xr" />
      
      {/* Interactive 3D Status Indicators */}
      <group position={[0, 2, -2]}>
        {/* FPS Status Orb */}
        <Sphere args={[0.1]} position={[-0.5, 0, 0]}>
          <meshBasicMaterial color="#00ff00" />
        </Sphere>
        <Text position={[-0.5, -0.2, 0]} fontSize={0.05} color="#ffffff" anchorX="center">
          FPS OK
        </Text>
        
        {/* Memory Status Orb */}
        <Sphere args={[0.1]} position={[0, 0, 0]}>
          <meshBasicMaterial color="#ffaa00" />
        </Sphere>
        <Text position={[0, -0.2, 0]} fontSize={0.05} color="#ffffff" anchorX="center">
          MEM
        </Text>
        
        {/* GPU Status Orb */}
        <Sphere args={[0.1]} position={[0.5, 0, 0]}>
          <meshBasicMaterial color="#00aaff" />
        </Sphere>
        <Text position={[0.5, -0.2, 0]} fontSize={0.05} color="#ffffff" anchorX="center">
          GPU
        </Text>
      </group>
      
      {/* Controller Visualization */}
      <XRControllerVisualization />
      
      {/* Enhanced Lighting for VR */}
      <ambientLight intensity={0.3} />
      
      {/* Animated main lighting */}
      <pointLight 
        position={[Math.sin(time * 0.5) * 2, 2.5, Math.cos(time * 0.5) * 2]} 
        intensity={1.2} 
        color="#00aaff"
      />
      
      {/* Panel accent lighting */}
      <pointLight position={[-2.5, 1, -1.5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[2.5, 1, -1.5]} intensity={0.8} color="#ffffff" />
      
      {/* Background atmosphere lighting */}
      <pointLight position={[0, 0, -3]} intensity={0.4} color="#004466" />
      
      {/* Immersive Environment Elements */}
      {/* Floor Grid with glow */}
      <gridHelper args={[12, 24, "#004466", "#002244"]} position={[0, -1.5, 0]} />
      
      {/* Ceiling Grid for full immersion */}
      <gridHelper args={[12, 24, "#002244", "#001122"]} position={[0, 3.5, 0]} rotation={[Math.PI, 0, 0]} />
      
      {/* Side walls with subtle geometry */}
      <mesh position={[-6, 1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshBasicMaterial color="#001122" transparent opacity={0.1} />
      </mesh>
      
      <mesh position={[6, 1, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshBasicMaterial color="#001122" transparent opacity={0.1} />
      </mesh>
      
      {/* Back wall */}
      <mesh position={[0, 1, -4]}>
        <planeGeometry args={[12, 5]} />
        <meshBasicMaterial color="#001122" transparent opacity={0.2} />
      </mesh>
      
      {/* Floating data streams (decorative) */}
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i}>
          <mesh 
            position={[
              Math.sin((i / 8) * Math.PI * 2 + time * 0.3) * 4,
              1 + Math.sin(time * 0.5 + i) * 0.5,
              Math.cos((i / 8) * Math.PI * 2 + time * 0.3) * 4
            ]}
          >
            <boxGeometry args={[0.02, 0.02, 0.4]} />
            <meshBasicMaterial color="#00aaff" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
      
      {/* Floating particles for ambiance */}
      {Array.from({ length: 20 }, (_, i) => (
        <Sphere 
          key={i}
          args={[0.005]} 
          position={[
            Math.sin((i / 20) * Math.PI * 4 + time * 0.1) * 6,
            0.5 + Math.sin(time * 0.2 + i * 0.5) * 2,
            Math.cos((i / 20) * Math.PI * 4 + time * 0.1) * 6
          ]}
        >
          <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
        </Sphere>
      ))}
      
      {/* Central holographic display */}
      <group position={[0, 0.5, -3]}>
        <Text
          position={[0, 0, 0]}
          fontSize={0.15}
          color="#00aaff"
          anchorX="center"
          anchorY="middle"
        >
          WebXR Performance Lab
        </Text>
        
        <Text
          position={[0, -0.3, 0]}
          fontSize={0.08}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Real-time Monitoring Active
        </Text>
        
        {/* Animated ring around the text */}
        <mesh rotation={[0, 0, time]}>
          <ringGeometry args={[0.8, 0.85, 32]} />
          <meshBasicMaterial color="#00aaff" transparent opacity={0.4} />
        </mesh>
      </group>
    </>
  )
}

// Test component with complex geometry for GPU timing validation
const ComplexTestGeometry: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01
      meshRef.current.rotation.y += 0.01
    }
  })
  
  return (
    <group position={[0, 2, -3]}>
      {/* Complex geometry for GPU testing */}
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[1, 0.3, 128, 16]} />
        <meshStandardMaterial color="#00d4ff" />
      </mesh>
      
      {/* Additional complex meshes */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[Math.sin(i * 1.2) * 3, Math.cos(i * 1.2) * 3, 0] as [number, number, number]}>
          <icosahedronGeometry args={[0.5, 2]} />
          <meshStandardMaterial color={`hsl(${i * 60}, 70%, 50%)`} />
        </mesh>
      ))}
      
      {/* High-poly sphere */}
      <mesh position={[0, -2, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="#ff4444" />
      </mesh>
    </group>
  )
}

// XR-aware spatial scene component
function XRSpatialScene() {
  const { isPresenting } = useXR()
  const screens = useScreens()
  const activeScreen = useActiveScreen()
  const { deleteScreen, enlargeScreen, shrinkScreen, setXRActive } = usePerformanceStore()
  
  // Update XR state in store
  useEffect(() => {
    setXRActive(isPresenting)
  }, [isPresenting, setXRActive])
  
  // Enable real-time performance monitoring
  useRealTimePerformance(true)
  useRealTimeMemoryMonitor(true) 
  useWebXRPerformanceMonitor(true)

  return (
    <>
      {/* Test component with complex geometry for GPU timing validation */}
      <ComplexTestGeometry />
      
      {/* XR Controllers and Hand Tracking */}
      <Controllers />
      <Hands />
      
      {/* Enhanced XR Environment (only in XR mode) */}
      {isPresenting && <XREnvironment />}
      
      {/* Standard lighting for desktop mode */}
      {!isPresenting && (
        <>
          <ambientLight intensity={0.4} />
          <pointLight position={[0, 0, 5]} intensity={0.8} color="#00d4ff" />
          <pointLight position={[5, 5, 0]} intensity={0.6} color="#ffffff" />
          <directionalLight position={[0, 10, 0]} intensity={0.5} color="#004466" />
        </>
      )}
      
      {/* XR-aware screen rendering - render only once per frame */}
      <group key={`screens-${isPresenting ? 'xr' : 'desktop'}`}>
        {screens.map((screen, index) => {
          // Render enlarged screen as modal overlay
          if (screen.isEnlarged) {
            return (
              <SpatialScreen
                key={`${screen.id}-enlarged`}
                position={[0, 0, isPresenting ? -0.5 : 1]} // Different depth for XR
                scale={isPresenting ? [1.2, 1.2, 1] : [2, 2, 1]} 
                title={screen.title}
                isActive={screen.id === activeScreen?.id}
                isEnlarged={screen.isEnlarged}
                type={screen.type}
                screenNumber={index + 1}
                screenId={screen.id}
                onDelete={deleteScreen}
                onEnlarge={enlargeScreen}
                onShrink={shrinkScreen}
              />
            )
          }
          
          // XR-specific positioning to avoid overlap and improve visibility
          let xrAdjustedPosition: [number, number, number]
          let xrAdjustedScale: [number, number, number]
          
          if (isPresenting) {
            // In XR: arrange screens in a semicircle around the user at a higher position
            const angle = (index / Math.max(screens.length - 1, 1)) * Math.PI * 0.8 - Math.PI * 0.4 // 144 degree arc
            const radius = 3
            xrAdjustedPosition = [
              Math.sin(angle) * radius,
              0.5 + screen.position.y * 0.3, // Higher positioning in VR
              Math.cos(angle) * radius - 1.5 // Place in front of user
            ]
            xrAdjustedScale = [0.8, 0.8, 1] // Slightly larger for better visibility
          } else {
            // Desktop mode: use original positions
            xrAdjustedPosition = [screen.position.x, screen.position.y, screen.position.z]
            xrAdjustedScale = [screen.scale.x, screen.scale.y, screen.scale.z]
          }
          
          return (
            <SpatialScreen
              key={`${screen.id}-${isPresenting ? 'xr' : 'desktop'}`}
              position={xrAdjustedPosition}
              scale={xrAdjustedScale}
              title={screen.title}
              isActive={screen.id === activeScreen?.id}
              isEnlarged={screen.isEnlarged}
              type={screen.type}
              screenNumber={index + 1}
              screenId={screen.id}
              onDelete={deleteScreen}
              onEnlarge={enlargeScreen}
              onShrink={shrinkScreen}
            />
          )
        })}
      </group>
      
      {/* Background grid for better spatial awareness (desktop only) */}
      {!isPresenting && (
        <>
          <gridHelper args={[20, 20, "#004466", "#002233"]} position={[0, -3, 0]} />
          <Environment preset="night" />
        </>
      )}
    </>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-black text-cyan-400">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mb-4"></div>
        <p>Initializing WebXR Debugger...</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [showSettings, setShowSettings] = useState(false)
  const [isXRSupported, setIsXRSupported] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isXRActive, setIsXRActiveLocal] = useState(false)
  const {
    createScreen,
    deleteScreen,
    enlargeScreen,
    shrinkScreen,
    moveToNextScreen,
    moveToPreviousScreen,
    initializeMonitor,
    setXRActive,
    screens,
    isXRActive: storeXRActive
  } = usePerformanceStore()

  const activeScreen = useActiveScreen()

  useEffect(() => {
    let mounted = true
    
    if (!isInitialized && mounted) {
      // Initialize performance monitor first
      initializeMonitor()
      
      // Check WebXR support
      if (typeof navigator !== 'undefined' && 'xr' in navigator) {
        navigator.xr?.isSessionSupported('immersive-vr').then(setIsXRSupported)
      }
      
      // Only create initial screens if none exist (prevent duplicates)
      const hasOnlyMainScreen = screens.length <= 1 && screens.every(s => s.id === 'main-screen')
      if (hasOnlyMainScreen) {
        setTimeout(() => {
          if (mounted) {
            createScreen('stats', 'Performance Stats')
            createScreen('performance', 'Performance Changes') 
            createScreen('component', 'Component Monitor')
          }
        }, 100) // Small delay to prevent race conditions
      }
      
      setIsInitialized(true)
    }
    
    return () => {
      mounted = false
    }
  }, [initializeMonitor, createScreen, isInitialized]) // Removed screens.length dependency

  const handleCreateScreen = () => {
    const screenTypes = ['stats', 'performance', 'component'] as const
    const randomType = screenTypes[Math.floor(Math.random() * screenTypes.length)]
    createScreen(randomType, `${randomType.charAt(0).toUpperCase() + randomType.slice(1)} ${Date.now()}`)
  }

  const handleDeleteScreen = () => {
    if (activeScreen) {
      deleteScreen(activeScreen.id)
    }
  }

  const handleEnlargeScreen = () => {
    if (activeScreen) {
      enlargeScreen(activeScreen.id)
    }
  }

  const handleShrinkScreen = () => {
    if (activeScreen) {
      shrinkScreen(activeScreen.id)
    }
  }

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      {/* WebXR Button */}
      <div className="absolute top-6 left-6 z-50">
        {isXRSupported && (
          <VRButton 
            style={{
              background: 'rgba(0, 212, 255, 0.2)',
              border: '1px solid rgba(0, 212, 255, 0.5)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1.5rem',
              color: '#00d4ff',
              fontWeight: '500',
              backdropFilter: 'blur(8px)'
            }}
          />
        )}
      </div>

      {/* Main 3D Scene with Spatial Screens */}
      <Canvas 
        camera={{ position: [0, 0, 3], fov: 75 }}
        gl={{ 
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: false,
          powerPreference: "high-performance"
        }}
        onCreated={({ gl, camera }) => {
          // Prevent size changes in XR mode
          const originalSetSize = gl.setSize.bind(gl)
          gl.setSize = function(width: number, height: number, updateStyle?: boolean) {
            if (!gl.xr?.isPresenting) {
              originalSetSize(width, height, updateStyle)
            }
          }
          
          const originalSetPixelRatio = gl.setPixelRatio.bind(gl)
          gl.setPixelRatio = function(pixelRatio: number) {
            if (!gl.xr?.isPresenting) {
              originalSetPixelRatio(pixelRatio)
            }
          }

          // Configure XR rendering to handle stereo properly
          if (gl.xr) {
            gl.xr.enabled = true
            // Set proper XR session mode for better performance
            gl.xr.cameraAutoUpdate = true
          }
        }}
      >
        <XR 
          referenceSpace="local-floor"
          onSessionStart={() => {
            setIsXRActiveLocal(true)
            setXRActive(true)
            console.log('XR Session Started - Enhanced UI Active')
          }}
          onSessionEnd={() => {
            setIsXRActiveLocal(false)
            setXRActive(false)
            console.log('XR Session Ended')
          }}
        >
          <Suspense fallback={null}>
            <XRSpatialScene />
          </Suspense>
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            enabled={!storeXRActive} // Disable controls in XR mode
          />
        </XR>
      </Canvas>

      {/* Real-time Stats Overlay (Desktop only - XR has floating panels) */}
      {!storeXRActive && (
        <div className="fixed top-4 right-4 z-40 space-y-4">
          <GeneralStatsComponent />
          <AdvancedMetricsCard className="max-w-sm" />
        </div>
      )}

      {/* Spatial Controls (Desktop only - XR uses hand/controller interaction) */}
      {!storeXRActive && (
        <SpatialControls 
          onCreateScreen={handleCreateScreen}
          onDeleteScreen={handleDeleteScreen}
          onEnlargeScreen={handleEnlargeScreen}
          onShrinkScreen={handleShrinkScreen}
          onNextScreen={moveToNextScreen}
          onPrevScreen={moveToPreviousScreen}
          onToggleSettings={() => setShowSettings(!showSettings)}
        />
      )}

      {/* Settings Panel */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Loading Fallback */}
      <Suspense fallback={<Loading />} />
    </div>
  )
} 