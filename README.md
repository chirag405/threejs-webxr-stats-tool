# Three.js WebXR Performance Debugger

A comprehensive performance monitoring and debugging tool for Three.js WebXR applications with Iron Man-style spatial UI controls and real-time metrics tracking.

![Three.js WebXR Debugger](https://img.shields.io/badge/Three.js-WebXR-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)

## ✨ Features

### 🎯 Three Performance Components

1. **GeneralStatsComponent** - Shows whole scene performance metrics
   - Real-time FPS, frame time, memory usage
   - Draw calls, triangles, geometries count
   - Color-coded severity indicators (green/yellow/red)
   - Memory leak detection

2. **PerformanceChangeComponent** - Tracks performance changes
   - Real-time performance delta tracking
   - Historical change timeline
   - Severity-based filtering
   - Impact analysis with trend indicators

3. **ComponentStatsCard** - Individual object metrics
   - Per-component triangle/vertex counts
   - Memory usage per object
   - Transform information (position, scale, rotation)
   - Visibility toggle controls

### 🥽 WebXR & Spatial UI

- **Iron Man helmet-style interface** with spatial screen management
- **Horizontal screen alignment** with enlarge/shrink controls
- **WebXR session support** with immersive VR mode
- **Spatial navigation** between multiple screens
- **Responsive controls** that work in both 2D and VR

### 📊 Advanced Monitoring APIs

- **Stats.js integration** with custom panels
- **Performance Observer API** for frame timing
- **WebXR Frame Timing API** for VR-specific metrics
- **Custom profiling wrapper classes**
- **Memory leak detection tools**
- **Network performance monitoring**

## 🚀 Quick Start

### Installation

```bash
npm install
# or
yarn install
```

### Development

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the debugger in action.

### WebXR Testing

For WebXR features, you'll need:
- A WebXR-compatible browser (Chrome with WebXR API enabled)
- A VR headset or WebXR emulator
- HTTPS connection (required for WebXR)

## 🔧 Integration Guide

### Basic Integration

```tsx
import { useThreeJsStats } from '@/hooks/useThreeJsStats'
import { ComponentStatsCard } from '@/hooks/useThreeJsStats'

function MyThreeJsScene() {
  const { startMonitoring, getObjectStats } = useThreeJsStats({
    enabled: true,
    updateInterval: 60 // Update every 60ms
  })

  const meshRef = useRef()

  return (
    <mesh ref={meshRef}>
      <boxGeometry />
      <meshStandardMaterial />
      {meshRef.current && (
        <ComponentStatsCard 
          object={meshRef.current}
          position="top-left"
          showPosition={true}
          showScale={true}
        />
      )}
    </mesh>
  )
}
```

### Advanced Object Tracking

```tsx
import { useObjectTracking } from '@/hooks/useThreeJsStats'

function TrackedMesh() {
  const meshRef = useRef()
  const { metrics, getStatsCard } = useObjectTracking(meshRef)
  
  const statsCardProps = getStatsCard()

  return (
    <mesh ref={meshRef}>
      <sphereGeometry />
      <meshStandardMaterial />
      {statsCardProps && (
        <ComponentStatsCard {...statsCardProps} />
      )}
    </mesh>
  )
}
```

### Scene-Level Monitoring

```tsx
import { useSceneMonitoring, usePerformanceWarnings } from '@/hooks/useThreeJsStats'

function MyApp() {
  const sceneRef = useRef()
  
  // Auto-track all meshes in scene
  useSceneMonitoring(sceneRef, true)
  
  // Get performance warnings
  const { warnings, hasWarnings, hasCriticalWarnings } = usePerformanceWarnings({
    fpsWarning: 30,
    fpsCritical: 15,
    memoryWarning: 0.8,
    memoryCritical: 0.95
  })

  return (
    <Canvas>
      <scene ref={sceneRef}>
        {/* Your 3D content */}
      </scene>
      
      {/* Show warnings */}
      {hasWarnings && (
        <div className="warning-panel">
          {warnings.map((warning, i) => (
            <div key={i} className={hasCriticalWarnings ? 'critical' : 'warning'}>
              {warning}
            </div>
          ))}
        </div>
      )}
    </Canvas>
  )
}
```

## 🎮 Spatial UI Controls

### Navigation Controls
- **←/→ Arrows**: Navigate between screens
- **+**: Create new screen
- **Expand/Minimize**: Toggle screen size
- **×**: Delete current screen
- **Settings**: Open configuration panel

### Keyboard Shortcuts
- `Space`: Toggle WebXR mode
- `Esc`: Exit WebXR session
- `Tab`: Cycle between screens
- `Delete`: Remove current screen

## 📊 Performance Metrics

### Global Scene Metrics
- **FPS**: Frames per second (target: 60fps for VR, 30fps+ for desktop)
- **Frame Time**: Milliseconds per frame (target: <16ms for 60fps)
- **Memory Usage**: JavaScript heap usage with leak detection
- **Draw Calls**: Number of render batches (target: <1000)
- **Triangles**: Total rendered triangles (target: <500K for VR)

### Component-Level Metrics
- **Triangle Count**: Per-object triangle count
- **Vertex Count**: Per-object vertex count
- **Memory Usage**: Estimated memory per object
- **Transform Data**: Position, scale, rotation
- **Visibility State**: Object visibility status

### Performance Changes
- **Delta Tracking**: Real-time performance change detection
- **Trend Analysis**: Performance improvement/degradation trends
- **Historical Data**: Last 100 performance changes
- **Severity Levels**: Excellent → Good → Warning → Critical → Danger

## 🎨 Customization

### Color Themes
```css
/* Modify in src/app/globals.css */
.stats-panel {
  --excellent: #22c55e;
  --good: #84cc16;
  --warning: #eab308;
  --critical: #ef4444;
  --danger: #dc2626;
}
```

### Performance Thresholds
```tsx
const customThresholds = {
  fps: { excellent: 60, good: 45, warning: 30, critical: 15 },
  memory: { excellent: 50, good: 70, warning: 85, critical: 95 },
  triangles: { excellent: 50000, good: 200000, warning: 500000, critical: 1000000 }
}
```

## 🛠️ API Reference

### useThreeJsStats Hook
```tsx
const {
  isMonitoringEnabled,
  startMonitoring,
  stopMonitoring,
  getObjectStats,
  trackNewObject,
  monitor
} = useThreeJsStats(options)
```

**Options:**
- `enabled: boolean` - Enable/disable monitoring
- `trackObject: Object3D` - Specific object to track
- `updateInterval: number` - Update frequency in milliseconds
- `autoStartMonitoring: boolean` - Auto-start on mount

### Performance Store
```tsx
const {
  globalMetrics,
  componentMetrics,
  performanceChanges,
  screens,
  isXRActive,
  // ... actions
} = usePerformanceStore()
```

## 🎯 Best Practices

### VR Performance Guidelines
- Keep triangle count under 500K for smooth VR
- Maintain 90fps for VR headsets (11ms frame time)
- Monitor memory usage carefully (VR is memory-constrained)
- Use LOD (Level of Detail) for distant objects
- Batch similar objects to reduce draw calls

### Memory Management
- Enable memory leak detection
- Monitor heap growth over time
- Use object pooling for frequently created/destroyed objects
- Dispose of unused geometries and textures

### WebXR Optimization
- Use WebXR Frame Timing API for accurate VR metrics
- Test on actual VR hardware, not just desktop
- Implement foveated rendering if supported
- Use WebXR layers for UI elements

## 🔮 Advanced Features

### Custom Profiling
```tsx
import { PerformanceMonitor } from '@/utils/performance'

const monitor = new PerformanceMonitor()

// Custom timing
monitor.begin()
// ... expensive operation
monitor.end()

// Network monitoring
const startTime = performance.now()
fetch('/api/data').then(() => {
  const latency = performance.now() - startTime
  monitor.updateMetric('networkLatency', latency)
})
```

### WebXR Session Management
```tsx
// Detect XR session changes
useEffect(() => {
  const handleXRSessionStart = (session) => {
    monitor.setXRSession(session)
    setXRActive(true)
  }
  
  const handleXRSessionEnd = () => {
    monitor.setXRSession(null)
    setXRActive(false)
  }
  
  // Listen for XR events
}, [])
```

## 📱 Mobile & VR Support

- **Responsive Design**: Works on desktop, mobile, and VR
- **Touch Controls**: Full touch support for mobile devices
- **WebXR Compatibility**: Supports VR headsets via WebXR
- **Progressive Enhancement**: Graceful degradation on unsupported devices

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) - 3D JavaScript library
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) - React renderer for Three.js
- [React Three XR](https://github.com/pmndrs/react-three-xr) - WebXR integration
- [Stats.js](https://github.com/mrdoob/stats.js/) - Performance monitoring
- [Framer Motion](https://www.framer.com/motion/) - Animation library

---

Built with ❤️ for the Three.js and WebXR community 