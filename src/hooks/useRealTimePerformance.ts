import { useEffect, useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { usePerformanceStore } from '@/store/performance'
import { PerformanceMonitor } from '@/utils/performance'

/**
 * Real-time performance monitoring hook that updates at 60fps
 * Provides truly real-time metrics for WebXR applications
 */
export const useRealTimePerformance = (enabled = true) => {
  const {
    monitor,
    updateGlobalMetrics,
    addPerformanceChange,
    isMonitoringEnabled,
    initializeMonitor
  } = usePerformanceStore()

  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const fpsBuffer = useRef<number[]>([])

  // Initialize monitor if not already done
  useEffect(() => {
    if (!monitor && enabled) {
      initializeMonitor()
    }
  }, [monitor, enabled, initializeMonitor])

  // Real-time frame monitoring using useFrame (60fps)
  useFrame((state) => {
    if (!enabled || !isMonitoringEnabled || !monitor) return

    const currentTime = performance.now()
    const deltaTime = currentTime - lastTime.current
    
    frameCount.current++
    
    // Start render call timing
    monitor.startRenderCall()
    
    // Calculate FPS every frame for smooth updates
    if (deltaTime > 0) {
      const fps = 1000 / deltaTime
      fpsBuffer.current.push(fps)
      
      // Keep rolling average of last 60 frames
      if (fpsBuffer.current.length > 60) {
        fpsBuffer.current.shift()
      }
      
      // Update metrics with smoothed values
      const avgFps = fpsBuffer.current.reduce((a, b) => a + b, 0) / fpsBuffer.current.length
      
      // Update monitor with real-time data
      monitor.metrics.fps = Math.round(avgFps)
      monitor.metrics.ms = deltaTime
      monitor.metrics.frameTime = deltaTime
      
      // Update renderer stats from Three.js state
      if (state.gl) {
        monitor.updateRendererStats(state.gl)
        // End GPU timing measurement after render update
        monitor.endGPUTiming()
      }
      
      // End render call timing
      monitor.endRenderCall()
      
      // Update global metrics in store
      updateGlobalMetrics({ ...monitor.metrics })
      
      // Add performance changes if significant
      monitor.changes.forEach(change => {
        addPerformanceChange(change)
      })
      
      // Clear changes after processing
      monitor.changes = []
    }
    
    lastTime.current = currentTime
  })

  return {
    isEnabled: enabled && isMonitoringEnabled,
    frameCount: frameCount.current,
    monitor
  }
}

/**
 * Hook for tracking real-time component performance
 */
export const useRealTimeComponentTracking = (componentId: string, enabled = true) => {
  const { updateComponentMetrics } = usePerformanceStore()
  const renderCount = useRef(0)
  const lastRenderTime = useRef(performance.now())

  useFrame(() => {
    if (!enabled) return
    
    const currentTime = performance.now()
    const renderTime = currentTime - lastRenderTime.current
    renderCount.current++
    
    // Update component-specific metrics
    updateComponentMetrics(componentId, {
      id: componentId,
      name: `Component-${componentId}`,
      triangles: 0,
      vertices: 0,
      drawCalls: 1,
      memoryUsage: 0,
      visible: true,
      position: [0, 0, 0],
      scale: [1, 1, 1],
      renderTime: renderTime
    })
    
    lastRenderTime.current = currentTime
  })

  return {
    renderCount: renderCount.current,
    isTracking: enabled
  }
}

/**
 * Hook for memory monitoring with leak detection
 */
export const useRealTimeMemoryMonitor = (enabled = true) => {
  const { monitor, updateGlobalMetrics } = usePerformanceStore()
  const memoryHistory = useRef<number[]>([])
  const checkInterval = useRef(0)

  useFrame(() => {
    if (!enabled || !monitor) return
    
    // Check memory every 60 frames (roughly 1 second at 60fps)
    checkInterval.current++
    if (checkInterval.current >= 60) {
      checkInterval.current = 0
      
      // Update memory metrics
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
        const memory = (performance as any).memory
        const currentUsage = memory.usedJSHeapSize
        
        memoryHistory.current.push(currentUsage)
        
        // Keep last 60 readings (1 minute of data)
        if (memoryHistory.current.length > 60) {
          memoryHistory.current.shift()
        }
        
        // Update memory metrics
        monitor.metrics.memory = {
          used: currentUsage,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        }
        
        // Detect memory leaks (consistent growth over time)
        if (memoryHistory.current.length >= 10) {
          const recent = memoryHistory.current.slice(-10)
          const trend = recent[recent.length - 1] - recent[0]
          monitor.metrics.memoryLeaks = trend > (memory.jsHeapSizeLimit * 0.1) // 10% growth
        }
        
        updateGlobalMetrics({ ...monitor.metrics })
      }
    }
  })

  return {
    memoryHistory: memoryHistory.current,
    isMonitoring: enabled
  }
}



/**
 * Hook for advanced WebXR performance monitoring with comprehensive metrics
 */
export const useWebXRPerformanceMonitor = (enabled = true) => {
  const { monitor, updateGlobalMetrics, isXRActive, setXRActive } = usePerformanceStore()
  const xrSessionRef = useRef<XRSession | null>(null)
  const isInitialized = useRef(false)
  const xrFrameRate = useRef(90) // Default VR target

  useFrame((state) => {
    if (!enabled || !monitor) return

    // Initialize XR session monitoring if in XR mode
    if (isXRActive && state.gl.xr && state.gl.xr.getSession && !isInitialized.current) {
      const session = state.gl.xr.getSession()
      if (session && session !== xrSessionRef.current) {
        xrSessionRef.current = session
        monitor.initializeXRSession(session)
        isInitialized.current = true
        console.log('Advanced WebXR performance monitoring initialized')
      }
    }

    // Start render call timing
    monitor.startRenderCall()
    
    // Update advanced timing metrics
    monitor.updateAdvancedTiming()
    
    // VR-specific performance monitoring
    const targetFrameTime = 1000 / xrFrameRate.current
    const currentFrameTime = monitor.metrics.ms
    
    if (currentFrameTime > targetFrameTime * 1.1) {
      // Frame time exceeded target by 10% - potential VR discomfort
      monitor.metrics.gpuTime = currentFrameTime - targetFrameTime
    }
    
    // End render call timing
    monitor.endRenderCall()
    
    // Update metrics
    updateGlobalMetrics({ ...monitor.metrics })
  })

  // Cleanup when XR session ends
  useEffect(() => {
    if (!isXRActive && isInitialized.current) {
      isInitialized.current = false
      xrSessionRef.current = null
    }
  }, [isXRActive])

  useEffect(() => {
    if (!enabled) return
    
    // Listen for XR session events
    const handleXRSessionStart = () => {
      setXRActive(true)
      xrFrameRate.current = 90 // VR typically targets 90fps
    }
    
    const handleXRSessionEnd = () => {
      setXRActive(false)
      xrFrameRate.current = 60 // Desktop typically targets 60fps
    }
    
    return () => {
      // Cleanup event listeners
    }
  }, [enabled, monitor, setXRActive])

  return {
    isMonitoring: enabled && isXRActive,
    xrSession: xrSessionRef.current,
    targetFrameRate: xrFrameRate.current,
    metrics: monitor?.metrics,
    isXROptimized: enabled
  }
} 