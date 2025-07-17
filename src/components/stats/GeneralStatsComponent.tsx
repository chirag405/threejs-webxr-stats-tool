'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Cpu, HardDrive, Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useGlobalMetrics, useMonitoringSettings, usePerformanceStore } from '@/store/performance'

interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  severity: 'excellent' | 'good' | 'warning' | 'critical' | 'danger'
  icon: React.ReactNode
  description?: string
  trend?: 'up' | 'down' | 'stable'
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  unit = '', 
  severity, 
  icon, 
  description,
  trend = 'stable'
}) => {
  const [displayValue, setDisplayValue] = useState(value)

  // Real-time value updates
  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'excellent': return 'metric-excellent border-2'
      case 'good': return 'metric-good border-2'
      case 'warning': return 'metric-warning border-2'
      case 'critical': return 'metric-critical border-2'
      case 'danger': return 'metric-danger border-2'
      default: return 'metric-good border-2'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />
      case 'good': return <CheckCircle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'critical': return <AlertTriangle className="w-4 h-4" />
      case 'danger': return <XCircle className="w-4 h-4" />
      default: return <CheckCircle className="w-4 h-4" />
    }
  }

  const getTrendIndicator = (trend: string) => {
    switch (trend) {
      case 'up': return '↗'
      case 'down': return '↘'
      case 'stable': return '→'
      default: return '→'
    }
  }

  return (
    <div className={`stats-panel ${getSeverityStyles(severity)} transition-all duration-200`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center space-x-1">
          {getSeverityIcon(severity)}
          <span className="text-xs opacity-70">{getTrendIndicator(trend)}</span>
        </div>
      </div>
      
      <div className="flex items-baseline space-x-1">
        <span className="text-2xl font-bold font-mono">{displayValue}</span>
        {unit && <span className="text-sm opacity-70">{unit}</span>}
      </div>
      
      {description && (
        <p className="text-xs opacity-70 mt-1">{description}</p>
      )}
    </div>
  )
}

interface GeneralStatsComponentProps {
  position?: [number, number, number]
  isMinimized?: boolean
  onToggleMinimize?: () => void
}

const GeneralStatsComponent: React.FC<GeneralStatsComponentProps> = ({ 
  position = [0, 0, 0],
  isMinimized = false,
  onToggleMinimize
}) => {
  const metrics = useGlobalMetrics()
  const { isMonitoringEnabled, showDetailedStats } = useMonitoringSettings()
  const { monitor, initializeMonitor } = usePerformanceStore()
  const [realTimeMetrics, setRealTimeMetrics] = useState(metrics)

  // Initialize performance monitor
  useEffect(() => {
    if (!monitor) {
      initializeMonitor()
    }
  }, [monitor, initializeMonitor])

  // Real-time updates every 16ms (60fps)
  useEffect(() => {
    if (!isMonitoringEnabled || !monitor) return

    const interval = setInterval(() => {
      // Update FPS with real calculation
      const now = performance.now()
      if (monitor.lastFrameTime) {
        const deltaTime = now - monitor.lastFrameTime
        const fps = deltaTime > 0 ? Math.round(1000 / deltaTime) : 0
        
        // Update metrics
        const updatedMetrics = {
          ...monitor.metrics,
          fps: fps,
          ms: deltaTime,
          frameTime: deltaTime
        }
        
        setRealTimeMetrics(updatedMetrics)
      }
      monitor.lastFrameTime = now

      // Update memory if available
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
        const memory = (performance as any).memory
        setRealTimeMetrics(prev => ({
          ...prev,
          memory: {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
          }
        }))
      }
    }, 16) // 60fps updates

    return () => clearInterval(interval)
  }, [isMonitoringEnabled, monitor])

  // Helper function to determine severity based on metric value
  const getMetricSeverity = (metric: string, value: number): 'excellent' | 'good' | 'warning' | 'critical' | 'danger' => {
    switch (metric) {
      case 'fps':
        if (value >= 60) return 'excellent'
        if (value >= 45) return 'good'
        if (value >= 30) return 'warning'
        if (value >= 15) return 'critical'
        return 'danger'
      
      case 'ms':
        if (value <= 16) return 'excellent'
        if (value <= 22) return 'good'
        if (value <= 33) return 'warning'
        if (value <= 66) return 'critical'
        return 'danger'
      
      case 'memory':
        const memoryUsage = (realTimeMetrics.memory.used / realTimeMetrics.memory.limit) * 100
        if (memoryUsage <= 50) return 'excellent'
        if (memoryUsage <= 70) return 'good'
        if (memoryUsage <= 85) return 'warning'
        if (memoryUsage <= 95) return 'critical'
        return 'danger'
      
      case 'drawCalls':
        if (value <= 100) return 'excellent'
        if (value <= 500) return 'good'
        if (value <= 1000) return 'warning'
        if (value <= 2000) return 'critical'
        return 'danger'
      
      case 'triangles':
        if (value <= 50000) return 'excellent'
        if (value <= 200000) return 'good'
        if (value <= 500000) return 'warning'
        if (value <= 1000000) return 'critical'
        return 'danger'
      
      case 'latency':
        if (value <= 50) return 'excellent'
        if (value <= 100) return 'good'
        if (value <= 200) return 'warning'
        if (value <= 500) return 'critical'
        return 'danger'
      
      default:
        return 'good'
    }
  }

  const formatMemory = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  if (!isMonitoringEnabled) {
    return (
      <div className="stats-panel border-gray-600">
        <div className="flex items-center justify-center p-4">
          <span className="text-gray-400">Monitoring Disabled</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="space-y-3 max-w-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Scene Performance</h2>
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="control-button p-2 text-xs"
            >
              {isMinimized ? '▲' : '▼'}
            </button>
          )}
        </div>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              className="space-y-3"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Core Performance Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  title="FPS"
                  value={realTimeMetrics.fps}
                  severity={getMetricSeverity('fps', realTimeMetrics.fps)}
                  icon={<Activity className="w-4 h-4" />}
                  description="Frames per second"
                />
                
                <MetricCard
                  title="Frame Time"
                  value={realTimeMetrics.ms.toFixed(1)}
                  unit="ms"
                  severity={getMetricSeverity('ms', realTimeMetrics.ms)}
                  icon={<Zap className="w-4 h-4" />}
                  description="Time per frame"
                />
              </div>

              {/* Network Latency */}
              <MetricCard
                title="Network Latency"
                value={realTimeMetrics.networkLatency.toFixed(1)}
                unit="ms"
                severity={getMetricSeverity('latency', realTimeMetrics.networkLatency)}
                icon={<Activity className="w-4 h-4" />}
                description="Network response time"
              />

              {/* Memory Usage */}
              <MetricCard
                title="Memory Usage"
                value={formatMemory(realTimeMetrics.memory.used)}
                severity={getMetricSeverity('memory', realTimeMetrics.memory.used)}
                icon={<HardDrive className="w-4 h-4" />}
                description={`${((realTimeMetrics.memory.used / realTimeMetrics.memory.limit) * 100).toFixed(1)}% of ${formatMemory(realTimeMetrics.memory.limit)}`}
              />

              {/* Render Statistics */}
              {showDetailedStats && (
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                      title="Draw Calls"
                      value={formatNumber(realTimeMetrics.drawCalls)}
                      severity={getMetricSeverity('drawCalls', realTimeMetrics.drawCalls)}
                      icon={<Cpu className="w-4 h-4" />}
                      description="Render batches"
                    />
                    
                    <MetricCard
                      title="Triangles"
                      value={formatNumber(realTimeMetrics.triangles)}
                      severity={getMetricSeverity('triangles', realTimeMetrics.triangles)}
                      icon={<Activity className="w-4 h-4" />}
                      description="Rendered triangles"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <MetricCard
                      title="Geometries"
                      value={realTimeMetrics.geometries}
                      severity="good"
                      icon={<span className="w-4 h-4 text-center">G</span>}
                    />
                    
                    <MetricCard
                      title="Textures"
                      value={realTimeMetrics.textures}
                      severity="good"
                      icon={<span className="w-4 h-4 text-center">T</span>}
                    />
                    
                    <MetricCard
                      title="Programs"
                      value={realTimeMetrics.programs}
                      severity="good"
                      icon={<span className="w-4 h-4 text-center">P</span>}
                    />
                  </div>
                </motion.div>
              )}

              {/* Memory Leak Warning */}
              {realTimeMetrics.memoryLeaks && (
                <motion.div
                  className="stats-panel metric-danger border-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Memory Leak Detected</span>
                  </div>
                  <p className="text-xs opacity-70 mt-1">
                    Memory usage has doubled from baseline
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default GeneralStatsComponent 