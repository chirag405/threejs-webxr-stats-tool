# Three.js WebXR Stats Library

A comprehensive, modular performance monitoring library for Three.js and React Three Fiber applications, with special support for WebXR environments.

## Features

- **Real-time Performance Monitoring**: FPS, frame time, memory usage, GPU metrics
- **WebXR Optimization**: Specialized monitoring for VR/AR applications
- **Component-Level Tracking**: Per-object performance metrics
- **Memory Leak Detection**: Automatic detection and warnings
- **Flexible UI Components**: Customizable stats cards and displays
- **Zero Dependencies**: Works with any Three.js or React Three Fiber setup
- **TypeScript Support**: Full type safety and IntelliSense

## Installation

```bash
npm install @your-org/threejs-webxr-stats
```

## Quick Start

### Basic Usage

```tsx
import { useThreeJsStats, GeneralStatsComponent } from '@your-org/threejs-webxr-stats'

function MyScene() {
  const { startMonitoring, stopMonitoring } = useThreeJsStats({
    enabled: true,
    updateInterval: 60 // Update every 60ms
  })

  return (
    <>
      <GeneralStatsComponent />
      {/* Your Three.js scene */}
      <mesh>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
    </>
  )
}
```

### Component-Level Monitoring

```tsx
import { useObjectTracking, ComponentStatsCard } from '@your-org/threejs-webxr-stats'

function MyMesh() {
  const meshRef = useRef()
  const { metrics, getStatsCard } = useObjectTracking(meshRef)

  return (
    <mesh ref={meshRef}>
      <boxGeometry />
      <meshStandardMaterial />
      <ComponentStatsCard object={meshRef.current} />
    </mesh>
  )
}
```

### WebXR Monitoring

```tsx
import { useWebXRPerformanceMonitor } from '@your-org/threejs-webxr-stats'

function XRScene() {
  const { isMonitoring, metrics, targetFrameRate } = useWebXRPerformanceMonitor(true)

  return (
    <XR>
      {/* Your XR scene */}
      {isMonitoring && (
        <Text position={[0, 2, -1]}>
          FPS: {metrics?.fps} / Target: {targetFrameRate}
        </Text>
      )}
    </XR>
  )
}
```

## API Reference

### Hooks

#### `useThreeJsStats(options)`

Main hook for Three.js performance monitoring.

**Parameters:**
- `options.enabled` (boolean): Enable/disable monitoring
- `options.trackObject` (Object3D): Specific object to track
- `options.updateInterval` (number): Update interval in milliseconds
- `options.autoStartMonitoring` (boolean): Auto-start monitoring on mount

**Returns:**
- `isMonitoringEnabled`: Current monitoring state
- `startMonitoring()`: Start monitoring
- `stopMonitoring()`: Stop monitoring
- `getObjectStats(object)`: Get metrics for specific object
- `trackNewObject(object)`: Start tracking new object
- `monitor`: Performance monitor instance

#### `useRealTimePerformance(enabled)`

Real-time performance monitoring at 60fps.

**Parameters:**
- `enabled` (boolean): Enable real-time monitoring

**Returns:**
- `isEnabled`: Current state
- `frameCount`: Current frame count
- `monitor`: Monitor instance

#### `useObjectTracking(objectRef, enabled)`

Track individual Three.js objects with automatic cleanup.

**Parameters:**
- `objectRef` (React.RefObject<Object3D>): Reference to object
- `enabled` (boolean): Enable tracking

**Returns:**
- `metrics`: Object metrics
- `getStatsCard()`: Get stats card component
- `object`: Current object reference

#### `useWebXRPerformanceMonitor(enabled)`

Advanced WebXR performance monitoring.

**Parameters:**
- `enabled` (boolean): Enable XR monitoring

**Returns:**
- `isMonitoring`: Current monitoring state
- `xrSession`: Active XR session
- `targetFrameRate`: Target frame rate (90 for VR, 60 for desktop)
- `metrics`: Performance metrics
- `isXROptimized`: XR optimization state

#### `usePerformanceWarnings(thresholds)`

Memory leak detection and performance warnings.

**Parameters:**
- `thresholds` (object): Warning thresholds
  - `fpsWarning`: FPS warning threshold (default: 30)
  - `fpsCritical`: FPS critical threshold (default: 15)
  - `memoryWarning`: Memory warning threshold (default: 0.8)
  - `memoryCritical`: Memory critical threshold (default: 0.95)

**Returns:**
- `warnings`: Array of warning messages
- `hasWarnings`: Boolean indicating if warnings exist
- `hasCriticalWarnings`: Boolean indicating critical warnings
- `recentChanges`: Recent performance changes

### Components

#### `<GeneralStatsComponent />`

Main performance statistics display component.

**Props:**
- `position?: [number, number, number]`: 3D position
- `isMinimized?: boolean`: Minimized state
- `onToggleMinimize?: () => void`: Minimize toggle callback

#### `<ComponentStatsCard />`

Individual component statistics card.

**Props:**
- `object: Object3D`: Three.js object to monitor
- `position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'`: Card position
- `isMinimized?: boolean`: Minimized state
- `showPosition?: boolean`: Show position information
- `showScale?: boolean`: Show scale information
- `showRotation?: boolean`: Show rotation information
- `onToggleMinimize?: () => void`: Minimize toggle callback
- `className?: string`: Additional CSS classes

### Performance Classes

#### `PerformanceMonitor`

Core performance monitoring class.

**Methods:**
- `begin()`: Start frame timing
- `end()`: End frame timing
- `updateRendererStats(renderer)`: Update renderer statistics
- `getComponentMetrics(object)`: Get metrics for specific object
- `getMetricSeverity(metric, value)`: Get severity level for metric
- `dispose()`: Clean up resources

**Properties:**
- `metrics`: Current performance metrics
- `changes`: Performance changes array

### Store Integration

The library uses Zustand for state management. You can access the store directly:

```tsx
import { usePerformanceStore } from '@your-org/threejs-webxr-stats'

function MyComponent() {
  const { globalMetrics, componentMetrics, isMonitoringEnabled } = usePerformanceStore()
  
  // Use metrics in your component
  return <div>FPS: {globalMetrics.fps}</div>
}
```

## Advanced Usage

### Custom Metric Thresholds

```tsx
const customThresholds = {
  fpsWarning: 45,
  fpsCritical: 20,
  memoryWarning: 0.7,
  memoryCritical: 0.9,
  triangleWarning: 750000,
  triangleCritical: 1500000
}

const { warnings, hasCriticalWarnings } = usePerformanceWarnings(customThresholds)
```

### Scene-Level Monitoring

```tsx
function SceneManager() {
  const sceneRef = useRef()
  const { trackedObjects } = useSceneMonitoring(sceneRef, true)

  return (
    <scene ref={sceneRef}>
      {/* All meshes in this scene will be automatically tracked */}
      <mesh><boxGeometry /><meshStandardMaterial /></mesh>
      <mesh><sphereGeometry /><meshStandardMaterial /></mesh>
    </scene>
  )
}
```

### Real-Time Memory Monitoring

```tsx
function MemoryMonitor() {
  const { memoryHistory, isMonitoring } = useRealTimeMemoryMonitor(true)

  return (
    <div>
      <h3>Memory Usage History</h3>
      {memoryHistory.map((usage, index) => (
        <div key={index}>Frame {index}: {usage.toFixed(2)} MB</div>
      ))}
    </div>
  )
}
```

## Performance Metrics

### Global Metrics
- **FPS**: Frames per second
- **Frame Time**: Time per frame in milliseconds
- **Memory Usage**: JavaScript heap usage
- **Draw Calls**: Number of draw calls per frame
- **Triangles**: Number of triangles rendered
- **Network Latency**: Network response time
- **GPU Metrics**: GPU usage and timing

### Component Metrics
- **Triangle Count**: Triangles for specific object
- **Vertex Count**: Vertices for specific object
- **Memory Usage**: Estimated memory usage
- **Visibility**: Object visibility state
- **Transform Data**: Position, scale, rotation

### WebXR Metrics
- **XR Frame Rate**: VR/AR frame rate
- **Motion-to-Photon Delay**: Latency from motion to display
- **Controller Input Lag**: Controller response time
- **Session Init Time**: XR session startup time

## Styling

The library includes CSS classes for styling:

```css
.stats-panel {
  /* Base panel styling */
}

.metric-excellent { border-color: #10b981; }
.metric-good { border-color: #3b82f6; }
.metric-warning { border-color: #f59e0b; }
.metric-critical { border-color: #ef4444; }
.metric-danger { border-color: #dc2626; }
```

## TypeScript Support

Full TypeScript definitions are included:

```typescript
interface PerformanceMetrics {
  fps: number
  ms: number
  memory: {
    used: number
    total: number
    limit: number
  }
  drawCalls: number
  triangles: number
  // ... more metrics
}

interface ComponentMetrics {
  id: string
  name: string
  triangles: number
  vertices: number
  memoryUsage: number
  visible: boolean
  position: [number, number, number]
  scale: [number, number, number]
  renderTime: number
}
```

## Best Practices

1. **Enable monitoring only in development**: Use environment variables to control monitoring in production
2. **Set appropriate update intervals**: Balance between performance and real-time updates
3. **Use component-level tracking sparingly**: Only track objects that need detailed monitoring
4. **Monitor memory usage**: Keep an eye on memory leaks, especially in long-running applications
5. **Configure thresholds based on your target hardware**: Adjust warning thresholds for different devices

## Browser Support

- Chrome 80+
- Firefox 76+
- Safari 13+
- Edge 80+

WebXR features require additional browser support for WebXR APIs.

## Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) for details on submitting pull requests.

## License

MIT License - see [LICENSE](LICENSE) file for details.
