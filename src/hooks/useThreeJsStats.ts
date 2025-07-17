import { useEffect, useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D, WebGLRenderer } from 'three'
import { usePerformanceStore } from '@/store/performance'
import { PerformanceMonitor, ComponentMetrics } from '@/utils/performance'

interface UseThreeJsStatsOptions {
  enabled?: boolean
  trackObject?: Object3D
  updateInterval?: number
  autoStartMonitoring?: boolean
}

/**
 * Hook for integrating Three.js performance monitoring into any scene
 * Usage:
 * 
 * ```tsx
 * function MyScene() {
 *   const { startMonitoring, stopMonitoring, getObjectStats } = useThreeJsStats({
 *     enabled: true,
 *     updateInterval: 60
 *   })
 *   
 *   const meshRef = useRef()
 *   
 *   // Track specific object performance
 *   const objectStats = getObjectStats(meshRef.current)
 *   
 *   return (
 *     <mesh ref={meshRef}>
 *       <boxGeometry />
 *       <meshStandardMaterial />
 *       {objectStats && <ComponentStatsCard object={meshRef.current} />}
 *     </mesh>
 *   )
 * }
 * ```
 */
export const useThreeJsStats = (options: UseThreeJsStatsOptions = {}) => {
  const {
    enabled = true,
    trackObject,
    updateInterval = 60,
    autoStartMonitoring = true
  } = options

  const {
    monitor,
    updateGlobalMetrics,
    updateComponentMetrics,
    addPerformanceChange,
    isMonitoringEnabled
  } = usePerformanceStore()

  const lastUpdateTime = useRef(0)
  const rendererRef = useRef<WebGLRenderer | null>(null)

  // Initialize monitoring on mount
  useEffect(() => {
    if (enabled && autoStartMonitoring && !monitor) {
      const performanceMonitor = new PerformanceMonitor()
      usePerformanceStore.setState({ monitor: performanceMonitor })
    }
  }, [enabled, autoStartMonitoring, monitor])

  // Frame-based monitoring using R3F's useFrame
  useFrame((state) => {
    if (!enabled || !isMonitoringEnabled || !monitor) return

    const currentTime = state.clock.elapsedTime * 1000
    const renderer = state.gl as WebGLRenderer
    
    // Store renderer reference
    if (!rendererRef.current) {
      rendererRef.current = renderer
    }

    // Update at specified interval
    if (currentTime - lastUpdateTime.current >= updateInterval) {
      monitor.begin()
      
      // Start render call timing
      monitor.startRenderCall()
      
      // Update global metrics
      monitor.updateRendererStats(renderer)
      
      // End GPU timing measurement
      monitor.endGPUTiming()
      
      // End render call timing
      monitor.endRenderCall()
      
      updateGlobalMetrics(monitor.metrics)
      
      // Update component metrics if tracking specific object
      if (trackObject) {
        const componentMetrics = monitor.getComponentMetrics(trackObject)
        updateComponentMetrics(trackObject.uuid, componentMetrics)
      }
      
      // Add performance changes
      monitor.changes.forEach(change => {
        addPerformanceChange(change)
      })
      
      monitor.end()
      lastUpdateTime.current = currentTime
    }
  })

  // Manual control functions
  const startMonitoring = useCallback(() => {
    usePerformanceStore.setState({ isMonitoringEnabled: true })
  }, [])

  const stopMonitoring = useCallback(() => {
    usePerformanceStore.setState({ isMonitoringEnabled: false })
  }, [])

  const getObjectStats = useCallback((object: Object3D | null) => {
    if (!object || !monitor) return null
    return monitor.getComponentMetrics(object)
  }, [monitor])

  const trackNewObject = useCallback((object: Object3D) => {
    if (!monitor) return null
    const metrics = monitor.getComponentMetrics(object)
    updateComponentMetrics(object.uuid, metrics)
    return metrics
  }, [monitor, updateComponentMetrics])

  return {
    isMonitoringEnabled,
    startMonitoring,
    stopMonitoring,
    getObjectStats,
    trackNewObject,
    monitor
  }
}

/**
 * Hook for tracking individual Three.js objects with automatic cleanup
 * Usage:
 * 
 * ```tsx
 * function MyMesh() {
 *   const meshRef = useRef()
 *   const { metrics, StatsCard } = useObjectTracking(meshRef)
 *   
 *   return (
 *     <mesh ref={meshRef}>
 *       <boxGeometry />
 *       <meshStandardMaterial />
 *       {StatsCard}
 *     </mesh>
 *   )
 * }
 * ```
 */
export const useObjectTracking = (objectRef: React.RefObject<Object3D>, enabled = true) => {
  const { trackNewObject, getObjectStats } = useThreeJsStats({ enabled })
  const { updateComponentMetrics } = usePerformanceStore()
  const metricsRef = useRef<ComponentMetrics | null>(null)

  useEffect(() => {
    if (!enabled || !objectRef.current) return

    // Start tracking the object
    const metrics = trackNewObject(objectRef.current)
    metricsRef.current = metrics

    // Cleanup on unmount
    return () => {
      if (objectRef.current) {
        // Remove from tracking (optional - store will handle cleanup)
        updateComponentMetrics(objectRef.current.uuid, null as any)
      }
    }
  }, [enabled, objectRef.current, trackNewObject, updateComponentMetrics])

  // Generate StatsCard component (will be rendered by consumer)
  const getStatsCard = useCallback(() => {
    if (!objectRef.current) return null
    return {
      object: objectRef.current,
      position: "top-left" as const
    }
  }, [objectRef.current])

  return {
    metrics: metricsRef.current,
    getStatsCard,
    object: objectRef.current
  }
}

/**
 * Hook for scene-level performance monitoring
 * Automatically tracks all meshes in the scene
 */
export const useSceneMonitoring = (sceneRef: React.RefObject<Object3D>, enabled = true) => {
  const { trackNewObject } = useThreeJsStats({ enabled })
  const trackedObjects = useRef(new Set<string>())

  useFrame(() => {
    if (!enabled || !sceneRef.current) return

    sceneRef.current.traverse((child) => {
      if (child.type === 'Mesh' && !trackedObjects.current.has(child.uuid)) {
        trackNewObject(child)
        trackedObjects.current.add(child.uuid)
      }
    })
  })

  return {
    trackedObjects: trackedObjects.current
  }
}

/**
 * Advanced hook for memory leak detection and performance warnings
 */
export const usePerformanceWarnings = (thresholds = {
  fpsWarning: 30,
  fpsCritical: 15,
  memoryWarning: 0.8, // 80% of heap limit
  memoryCritical: 0.95, // 95% of heap limit
  triangleWarning: 500000,
  triangleCritical: 1000000
}) => {
  const { globalMetrics, performanceChanges } = usePerformanceStore()
  const warnings = useRef<string[]>([])

  useEffect(() => {
    warnings.current = []

    // FPS warnings
    if (globalMetrics.fps < thresholds.fpsCritical) {
      warnings.current.push('Critical: FPS below 15')
    } else if (globalMetrics.fps < thresholds.fpsWarning) {
      warnings.current.push('Warning: FPS below 30')
    }

    // Memory warnings
    const memoryUsage = globalMetrics.memory.used / globalMetrics.memory.limit
    if (memoryUsage > thresholds.memoryCritical) {
      warnings.current.push('Critical: Memory usage above 95%')
    } else if (memoryUsage > thresholds.memoryWarning) {
      warnings.current.push('Warning: Memory usage above 80%')
    }

    // Triangle count warnings
    if (globalMetrics.triangles > thresholds.triangleCritical) {
      warnings.current.push('Critical: Too many triangles (>1M)')
    } else if (globalMetrics.triangles > thresholds.triangleWarning) {
      warnings.current.push('Warning: High triangle count (>500K)')
    }

    // Memory leak detection
    if (globalMetrics.memoryLeaks) {
      warnings.current.push('Critical: Memory leak detected')
    }

  }, [globalMetrics, thresholds])

  return {
    warnings: warnings.current,
    hasWarnings: warnings.current.length > 0,
    hasCriticalWarnings: warnings.current.some(w => w.startsWith('Critical')),
    recentChanges: performanceChanges.slice(0, 5) // Last 5 changes
  }
}

// Export ComponentStatsCard for convenience
export { default as ComponentStatsCard } from '@/components/stats/ComponentStatsCard' 