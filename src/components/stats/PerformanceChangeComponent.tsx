'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Clock, AlertCircle } from 'lucide-react'
import { usePerformanceChanges } from '@/store/performance'
import { PerformanceChange } from '@/utils/performance'

interface ChangeItemProps {
  change: PerformanceChange
  index: number
}

const ChangeItem: React.FC<ChangeItemProps> = ({ change, index }) => {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'excellent': return 'metric-excellent'
      case 'good': return 'metric-good'
      case 'warning': return 'metric-warning'
      case 'critical': return 'metric-critical'
      case 'danger': return 'metric-danger'
      default: return 'metric-good'
    }
  }

  const getTrendIcon = (delta: number) => {
    if (delta > 0) return <TrendingUp className="w-3 h-3" />
    if (delta < 0) return <TrendingDown className="w-3 h-3" />
    return <Minus className="w-3 h-3" />
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 1000) return 'now'
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return `${Math.floor(diff / 3600000)}h ago`
  }

  const formatValue = (metric: string, value: number) => {
    switch (metric) {
      case 'fps':
        return `${value.toFixed(0)} FPS`
      case 'ms':
      case 'frameTime':
        return `${value.toFixed(1)}ms`
      case 'memory':
        return `${(value / 1024 / 1024).toFixed(1)}MB`
      case 'drawCalls':
      case 'triangles':
      case 'geometries':
      case 'textures':
      case 'programs':
        return value.toFixed(0)
      default:
        return value.toFixed(2)
    }
  }

  const getMetricDisplayName = (metric: string) => {
    const names: { [key: string]: string } = {
      fps: 'FPS',
      ms: 'Frame Time',
      memory: 'Memory',
      drawCalls: 'Draw Calls',
      triangles: 'Triangles',
      geometries: 'Geometries',
      textures: 'Textures',
      programs: 'Programs',
      frameTime: 'Frame Time',
      cpuTime: 'CPU Time',
      gpuTime: 'GPU Time',
      networkLatency: 'Network'
    }
    return names[metric] || metric
  }

  return (
    <div className={`stats-panel ${getSeverityStyles(change.severity)} mb-2 transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getTrendIcon(change.delta)}
          <span className="text-sm font-medium">{getMetricDisplayName(change.metric)}</span>
        </div>
        <div className="flex items-center space-x-1 text-xs opacity-70">
          <Clock className="w-3 h-3" />
          <span>{formatTimestamp(change.timestamp)}</span>
        </div>
      </div>
      
      <div className="mt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-70">
            {formatValue(change.metric, change.oldValue)} → {formatValue(change.metric, change.newValue)}
          </span>
          <span className={`font-bold ${change.deltaPercent > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {change.deltaPercent > 0 ? '+' : ''}{change.deltaPercent.toFixed(1)}%
          </span>
        </div>
        
        {change.severity === 'critical' || change.severity === 'danger' ? (
          <div className="flex items-center space-x-1 mt-1 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>Performance impact detected</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

interface PerformanceChangeComponentProps {
  position?: [number, number, number]
  maxChanges?: number
  isMinimized?: boolean
  onToggleMinimize?: () => void
}

const PerformanceChangeComponent: React.FC<PerformanceChangeComponentProps> = ({
  position = [0, 0, 0],
  maxChanges = 10,
  isMinimized = false,
  onToggleMinimize
}) => {
  const changes = usePerformanceChanges()
  const [filteredChanges, setFilteredChanges] = useState<PerformanceChange[]>([])
  const [filter, setFilter] = useState<'all' | 'critical' | 'recent'>('all')
  const [realTimeChanges, setRealTimeChanges] = useState<PerformanceChange[]>([])

  // Real-time updates for changes
  useEffect(() => {
    setRealTimeChanges(changes)
  }, [changes])

  // Real-time filtering
  useEffect(() => {
    let filtered = [...realTimeChanges]
    
    switch (filter) {
      case 'critical':
        filtered = realTimeChanges.filter(change => 
          change.severity === 'critical' || change.severity === 'danger'
        )
        break
      case 'recent':
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
        filtered = realTimeChanges.filter(change => change.timestamp > fiveMinutesAgo)
        break
      default:
        break
    }
    
    setFilteredChanges(filtered.slice(0, maxChanges))
  }, [realTimeChanges, filter, maxChanges])

  const getSummaryStats = () => {
    const recentChanges = realTimeChanges.filter(change => 
      change.timestamp > Date.now() - 60 * 1000 // Last minute
    )
    
    const criticalCount = recentChanges.filter(change => 
      change.severity === 'critical' || change.severity === 'danger'
    ).length
    
    return {
      total: recentChanges.length,
      critical: criticalCount,
      improvement: recentChanges.filter(change => change.deltaPercent < 0).length
    }
  }

  const stats = getSummaryStats()

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Performance Changes</h2>
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
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Summary Stats */}
              <div className="stats-panel mb-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xl font-bold text-blue-400 font-mono">{stats.total}</div>
                    <div className="text-xs opacity-70">Changes (1m)</div>
                  </div>
                  <div>
                    <div className={`text-xl font-bold font-mono ${stats.critical > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {stats.critical}
                    </div>
                    <div className="text-xs opacity-70">Critical</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-400 font-mono">{stats.improvement}</div>
                    <div className="text-xs opacity-70">Improved</div>
                  </div>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="flex space-x-2 mb-3">
                {(['all', 'critical', 'recent'] as const).map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      filter === filterType
                        ? 'bg-ui-primary text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </button>
                ))}
              </div>

              {/* Changes List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredChanges.length > 0 ? (
                  filteredChanges.map((change, index) => (
                    <ChangeItem
                      key={`${change.timestamp}-${change.metric}`}
                      change={change}
                      index={index}
                    />
                  ))
                ) : (
                  <div className="stats-panel text-center py-8">
                    <div className="text-gray-400">
                      {filter === 'all' ? 'No changes yet' : `No ${filter} changes`}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      Performance changes will appear here
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default PerformanceChangeComponent 