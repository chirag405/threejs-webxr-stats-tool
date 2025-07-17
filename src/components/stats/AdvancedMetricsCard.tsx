import React from 'react'
import { motion } from 'framer-motion'
import { useGlobalMetrics } from '@/store/performance'
import { 
  Monitor, 
  Cpu, 
  HardDrive, 
  Zap, 
  Activity, 
  Clock, 
  Eye,
  Gamepad2,
  Timer,
  BarChart3
} from 'lucide-react'

interface AdvancedMetricsCardProps {
  position?: [number, number, number]
  className?: string
}

const AdvancedMetricsCard: React.FC<AdvancedMetricsCardProps> = ({ 
  position = [0, 0, 0],
  className = ''
}) => {
  const metrics = useGlobalMetrics()

  const formatValue = (value: number, unit: string = 'ms', decimals: number = 2) => {
    if (value === 0) return `0${unit}`
    return `${value.toFixed(decimals)}${unit}`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const getPerformanceColor = (value: number, threshold: number, inverted: boolean = false) => {
    const isGood = inverted ? value < threshold : value > threshold
    return isGood ? 'text-green-400' : value > threshold * 1.5 ? 'text-red-400' : 'text-yellow-400'
  }

  return (
    <motion.div
      className={`bg-black/90 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-4">
        {/* WebXR Metrics */}
        <div className="border-b border-cyan-500/20 pb-3">
          <div className="flex items-center space-x-2 mb-3">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-cyan-400">WebXR Metrics</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-gray-400">Session Init</div>
              <div className={`font-mono ${getPerformanceColor(metrics.xrSessionInitTime, 100)}`}>
                {formatValue(metrics.xrSessionInitTime)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400">Motion→Photon</div>
              <div className={`font-mono ${getPerformanceColor(metrics.motionToPhotonDelay, 20)}`}>
                {formatValue(metrics.motionToPhotonDelay)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400">Controller Lag</div>
              <div className={`font-mono ${getPerformanceColor(metrics.controllerInputLag, 16)}`}>
                {formatValue(metrics.controllerInputLag)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400">XR Frame Rate</div>
              <div className={`font-mono ${getPerformanceColor(metrics.xrFrameRate, 80, true)}`}>
                {formatValue(metrics.xrFrameRate, 'fps', 0)}
              </div>
            </div>
          </div>
        </div>

        {/* GPU Metrics */}
        <div className="border-b border-cyan-500/20 pb-3">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-yellow-400">GPU Metrics</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-gray-400">Fragment Complexity</div>
              <div className={`font-mono ${getPerformanceColor(metrics.gpuFragmentComplexity, 500)}`}>
                {metrics.gpuFragmentComplexity.toFixed(0)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400">Vertex Complexity</div>
              <div className={`font-mono ${getPerformanceColor(metrics.gpuVertexComplexity, 250)}`}>
                {metrics.gpuVertexComplexity.toFixed(0)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400">GPU Memory</div>
              <div className={`font-mono ${getPerformanceColor(metrics.gpuMemoryUsage, 100000000)}`}>
                {formatBytes(metrics.gpuMemoryUsage)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400">Shader Compile</div>
              <div className={`font-mono ${getPerformanceColor(metrics.shaderCompileTime, 10)}`}>
                {formatValue(metrics.shaderCompileTime)}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Timing */}
        <div className="border-b border-cyan-500/20 pb-3">
          <div className="flex items-center space-x-2 mb-3">
            <Timer className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-green-400">Advanced Timing</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-gray-400">CPU Frame Time</div>
              <div className={`font-mono ${getPerformanceColor(metrics.cpuFrameTime, 16.67)}`}>
                {formatValue(metrics.cpuFrameTime)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400">GPU Frame Time</div>
              <div className={`font-mono ${getPerformanceColor(metrics.gpuFrameTime, 16.67)}`}>
                {formatValue(metrics.gpuFrameTime)}
                {metrics.gpuFrameTime === 0 && (
                  <span className="text-xs text-yellow-500 ml-1">(est)</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400">Render Call</div>
              <div className={`font-mono ${getPerformanceColor(metrics.renderCallDuration, 5)}`}>
                {formatValue(metrics.renderCallDuration)}
                {metrics.renderCallDuration === 0 && (
                  <span className="text-xs text-yellow-500 ml-1">(est)</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400">JavaScript</div>
              <div className={`font-mono ${getPerformanceColor(metrics.javascriptTime, 10)}`}>
                {formatValue(metrics.javascriptTime)}
              </div>
            </div>
          </div>
        </div>

        {/* Renderer Info */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-purple-400">Renderer Info</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-gray-400">Draw Calls</div>
              <div className={`font-mono ${getPerformanceColor(metrics.rendererInfo.render.calls, 100)}`}>
                {metrics.rendererInfo.render.calls}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400">Triangles</div>
              <div className={`font-mono ${getPerformanceColor(metrics.rendererInfo.render.triangles, 100000)}`}>
                {metrics.rendererInfo.render.triangles.toLocaleString()}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400">Geometries</div>
              <div className="font-mono text-gray-300">
                {metrics.rendererInfo.memory.geometries}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400">Textures</div>
              <div className="font-mono text-gray-300">
                {metrics.rendererInfo.memory.textures}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="pt-2 border-t border-cyan-500/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-400">Monitoring Active</span>
            </div>
            <div className="text-cyan-400 font-mono">
              {formatValue(metrics.networkLatency, 'ms')} ping
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AdvancedMetricsCard 