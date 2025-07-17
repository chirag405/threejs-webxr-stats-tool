'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Triangle, Cpu, HardDrive, Move, Scale, RotateCcw } from 'lucide-react'
import { useComponentMetrics } from '../../store/performance'
import { ComponentMetrics } from '../../utils/performance'


interface ComponentStatsCardProps {
  object: any // Using any to avoid Three.js dependency issues
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  isMinimized?: boolean
  showPosition?: boolean
  showScale?: boolean
  showRotation?: boolean
  onToggleMinimize?: () => void
  className?: string
}

const ComponentStatsCard: React.FC<ComponentStatsCardProps> = ({
  object,
  position = 'top-left',
  isMinimized = false,
  showPosition = true,
  showScale = true,
  showRotation = false,
  onToggleMinimize,
  className = ''
}) => {
  const componentMetrics = useComponentMetrics()
  const [metrics, setMetrics] = useState<ComponentMetrics | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Real-time metrics updates
  useEffect(() => {
    if (object && componentMetrics.has(object.uuid)) {
      setMetrics(componentMetrics.get(object.uuid) || null)
    }
  }, [object, componentMetrics])

  // Real-time updates every 100ms for component-specific data
  useEffect(() => {
    if (!object) return

    const interval = setInterval(() => {
      if (componentMetrics.has(object.uuid)) {
        const latestMetrics = componentMetrics.get(object.uuid)
        if (latestMetrics) {
          // Update with fresh object data
          const updatedMetrics = {
            ...latestMetrics,
            visible: object.visible,
            position: object.position ? [object.position.x, object.position.y, object.position.z] as [number, number, number] : [0, 0, 0] as [number, number, number],
            scale: object.scale ? [object.scale.x, object.scale.y, object.scale.z] as [number, number, number] : [1, 1, 1] as [number, number, number]
          }
          setMetrics(updatedMetrics)
        }
      }
    }, 100) // Update every 100ms

    return () => clearInterval(interval)
  }, [object, componentMetrics])

  const getPositionClass = (pos: string) => {
    switch (pos) {
      case 'top-left': return 'top-0 left-0'
      case 'top-right': return 'top-0 right-0'
      case 'bottom-left': return 'bottom-0 left-0'
      case 'bottom-right': return 'bottom-0 right-0'
      default: return 'top-0 left-0'
    }
  }

  const getSeverityFromTriangles = (triangles: number): 'excellent' | 'good' | 'warning' | 'critical' | 'danger' => {
    if (triangles <= 1000) return 'excellent'
    if (triangles <= 5000) return 'good'
    if (triangles <= 20000) return 'warning'
    if (triangles <= 50000) return 'critical'
    return 'danger'
  }

  const getSeverityFromMemory = (memory: number): 'excellent' | 'good' | 'warning' | 'critical' | 'danger' => {
    const mb = memory / (1024 * 1024)
    if (mb <= 1) return 'excellent'
    if (mb <= 5) return 'good'
    if (mb <= 20) return 'warning'
    if (mb <= 50) return 'critical'
    return 'danger'
  }

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'excellent': return 'border-stats-excellent bg-stats-excellent/10'
      case 'good': return 'border-stats-good bg-stats-good/10'
      case 'warning': return 'border-stats-warning bg-stats-warning/10'
      case 'critical': return 'border-stats-critical bg-stats-critical/10'
      case 'danger': return 'border-stats-danger bg-stats-danger/10'
      default: return 'border-gray-500 bg-gray-500/10'
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

  const formatPosition = (pos: [number, number, number]): string => {
    return `(${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}, ${pos[2].toFixed(1)})`
  }

  if (!metrics) {
    return (
      <div className={`absolute ${getPositionClass(position)} p-2 z-10 ${className}`}>
        <div className="stats-panel border-gray-600 text-xs">
          <div className="flex items-center space-x-1">
            <Cpu className="w-3 h-3" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  const triangleSeverity = getSeverityFromTriangles(metrics.triangles)
  const memorySeverity = getSeverityFromMemory(metrics.memoryUsage)
  const overallSeverity = triangleSeverity === 'danger' || memorySeverity === 'danger' ? 'danger' :
                         triangleSeverity === 'critical' || memorySeverity === 'critical' ? 'critical' :
                         triangleSeverity === 'warning' || memorySeverity === 'warning' ? 'warning' :
                         triangleSeverity === 'good' || memorySeverity === 'good' ? 'good' : 'excellent'

  return (
    <div
      ref={cardRef}
      className={`absolute ${getPositionClass(position)} p-2 z-10 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`stats-panel border-2 ${getSeverityStyle(overallSeverity)} min-w-0 transition-all duration-300 ${isHovered ? 'scale-105' : 'scale-100'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${metrics.visible ? 'bg-green-400' : 'bg-red-400'} transition-colors duration-200`} />
            <span className="text-xs font-medium truncate max-w-20">
              {metrics.name || 'Object'}
            </span>
          </div>
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="text-xs opacity-70 hover:opacity-100 transition-opacity"
            >
              {isMinimized ? '▲' : '▼'}
            </button>
          )}
        </div>

        {!isMinimized && (
          <div className="space-y-2 text-xs">
            {/* Core Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-1 rounded border ${getSeverityStyle(triangleSeverity)}`}>
                <div className="flex items-center space-x-1">
                  <Triangle className="w-3 h-3" />
                  <span className="font-mono">{formatNumber(metrics.triangles)}</span>
                </div>
                <div className="text-xs opacity-70">Triangles</div>
              </div>
              
              <div className="p-1 rounded border border-gray-600">
                <div className="flex items-center space-x-1">
                  <span className="w-3 h-3 text-center font-bold">V</span>
                  <span className="font-mono">{formatNumber(metrics.vertices)}</span>
                </div>
                <div className="text-xs opacity-70">Vertices</div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-1 rounded border border-gray-600">
                <div className="flex items-center space-x-1">
                  <Cpu className="w-3 h-3" />
                  <span className="font-mono">{metrics.drawCalls}</span>
                </div>
                <div className="text-xs opacity-70">Draw Calls</div>
              </div>
              
              <div className={`p-1 rounded border ${getSeverityStyle(memorySeverity)}`}>
                <div className="flex items-center space-x-1">
                  <HardDrive className="w-3 h-3" />
                  <span className="font-mono">{formatMemory(metrics.memoryUsage)}</span>
                </div>
                <div className="text-xs opacity-70">Memory</div>
              </div>
            </div>

            {/* Transform Information */}
            {(showPosition || showScale || showRotation) && (
              <div className="space-y-1 pt-2 border-t border-gray-600">
                {showPosition && (
                  <div className="flex items-center space-x-1">
                    <Move className="w-3 h-3" />
                    <span className="text-xs font-mono">{formatPosition(metrics.position)}</span>
                  </div>
                )}
                
                {showScale && (
                  <div className="flex items-center space-x-1">
                    <Scale className="w-3 h-3" />
                    <span className="text-xs font-mono">{formatPosition(metrics.scale)}</span>
                  </div>
                )}
                
                {showRotation && object.rotation && (
                  <div className="flex items-center space-x-1">
                    <RotateCcw className="w-3 h-3" />
                    <span className="text-xs font-mono">
                      ({object.rotation.x.toFixed(1)}, {object.rotation.y.toFixed(1)}, {object.rotation.z.toFixed(1)})
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Visibility Toggle */}
            <div className="pt-2 border-t border-gray-600">
              <button
                onClick={() => {
                  if (object) {
                    object.visible = !object.visible
                  }
                }}
                className={`w-full flex items-center justify-center space-x-1 p-1 rounded transition-colors ${
                  metrics.visible
                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                    : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                }`}
              >
                {metrics.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span className="text-xs">{metrics.visible ? 'Visible' : 'Hidden'}</span>
              </button>
            </div>

            {/* Performance Warning */}
            {(triangleSeverity === 'danger' || memorySeverity === 'danger') && (
              <div className="p-1 rounded bg-red-600/20 border border-red-600/50 text-red-400 transition-all duration-200">
                <div className="text-xs text-center">⚠ High Impact</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ComponentStatsCard

// Hook for easy integration with Three.js components
export const useComponentStats = (object: any, enabled = true) => {
  const [showStats, setShowStats] = useState(enabled)
  const [isMinimized, setIsMinimized] = useState(false)

  const StatsCard = React.useMemo(() => {
    if (!showStats) return null
    
    return (
      <ComponentStatsCard
        object={object}
        isMinimized={isMinimized}
        onToggleMinimize={() => setIsMinimized(!isMinimized)}
      />
    )
  }, [object, showStats, isMinimized])

  return {
    StatsCard,
    showStats,
    setShowStats,
    isMinimized,
    setIsMinimized
  }
} 

 