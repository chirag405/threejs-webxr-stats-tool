# Three.js Stats Tools Demo

## Overview

This demo page showcases the Three.js performance monitoring tools with multiple interactive 3D components. It demonstrates how easy it is to integrate performance tracking into any Three.js scene.

## Features

### 🎯 **Easy Integration**
- Simply wrap any Three.js object with `useObjectTracking()` hook
- Automatic performance monitoring with real-time metrics
- No complex setup required

### 📊 **Real-time Stats**
- **FPS Monitoring**: Track frame rate performance
- **Memory Usage**: Monitor memory consumption per component
- **Triangle Count**: Track geometry complexity
- **Draw Calls**: Monitor rendering performance
- **Component Visibility**: Toggle visibility with stats

### 🥽 **WebXR Support**
- **VR/AR Performance Monitoring**: Specialized metrics for XR applications
- **Adaptive Performance**: Components automatically optimize for XR mode
- **XR Stats Panel**: Floating performance display in VR
- **Controller Support**: Hand tracking and controller visualization
- **Frame Rate Optimization**: Automatic adjustments for VR comfort

### 🎮 **Interactive Controls**
- **Add Components**: Dynamically add new 3D objects
- **Remove Components**: Remove objects to see performance impact
- **Toggle Stats**: Show/hide performance overlays
- **Reset Scene**: Return to initial state

## Demo Components

### 1. **Rotating Cube**
- Simple geometry with continuous rotation
- Low triangle count, high performance
- Stats card shows minimal resource usage

### 2. **Bouncing Sphere**
- Animated sphere with spring physics
- Medium complexity with smooth animations
- Demonstrates animation performance tracking

### 3. **Complex Geometry**
- Torus + Cylinder combination
- Higher triangle count, more draw calls
- Shows performance impact of complex meshes

### 4. **Particle System**
- 50 animated particles (25 in XR mode for performance)
- High vertex count, intensive rendering
- Demonstrates performance monitoring under load
- Adaptive particle count for VR optimization

## How to Use

### Basic Usage
```tsx
import { useObjectTracking } from '@/hooks/useThreeJsStats'

function MyComponent() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { metrics, getStatsCard } = useObjectTracking(meshRef, true)

  return (
    <mesh ref={meshRef}>
      <boxGeometry />
      <meshStandardMaterial />
      {getStatsCard() && <ComponentStatsCard object={meshRef.current} />}
    </mesh>
  )
}
```

### Advanced Usage
```tsx
import { useThreeJsStats } from '@/hooks/useThreeJsStats'
import { useWebXRPerformanceMonitor } from '@/hooks/useRealTimePerformance'

function MyScene() {
  const { startMonitoring, stopMonitoring, getObjectStats } = useThreeJsStats({
    enabled: true,
    updateInterval: 60
  })

  // WebXR performance monitoring
  const { isMonitoring, targetFrameRate, isXROptimized } = useWebXRPerformanceMonitor(true)

  // Track specific object
  const objectStats = getObjectStats(meshRef.current)
  
  return (
    <Canvas>
      <XR>
        <mesh ref={meshRef}>
          <boxGeometry />
          <meshStandardMaterial />
          {objectStats && <ComponentStatsCard object={meshRef.current} />}
        </mesh>
      </XR>
    </Canvas>
  )
}
```

## Performance Metrics Explained

### 🟢 **Excellent** (Green)
- FPS: 60+ fps
- Memory: < 1MB per component
- Triangles: < 1,000
- Draw Calls: < 100

### 🟡 **Good** (Yellow)
- FPS: 45-59 fps
- Memory: 1-5MB per component
- Triangles: 1,000-5,000
- Draw Calls: 100-500

### 🟠 **Warning** (Orange)
- FPS: 30-44 fps
- Memory: 5-20MB per component
- Triangles: 5,000-20,000
- Draw Calls: 500-1,000

### 🔴 **Critical** (Red)
- FPS: 15-29 fps
- Memory: 20-50MB per component
- Triangles: 20,000-50,000
- Draw Calls: 1,000-2,000

### ⚫ **Danger** (Dark Red)
- FPS: < 15 fps
- Memory: > 50MB per component
- Triangles: > 50,000
- Draw Calls: > 2,000

## Tips for Performance Optimization

1. **Monitor Triangle Count**: Keep individual meshes under 10,000 triangles
2. **Batch Draw Calls**: Use instancing for repeated geometries
3. **Optimize Materials**: Reduce texture sizes and material complexity
4. **Level of Detail**: Implement LOD for distant objects
5. **Memory Management**: Dispose of unused geometries and materials

## Navigation

- **Main Page**: `/` - Full WebXR experience with spatial screens
- **Demo Page**: `/demo` - Interactive component testing environment

## Getting Started

1. Navigate to the demo page using the purple Activity button
2. Observe the initial 4 components with their performance stats
3. Use the control panel to add/remove components
4. Toggle stats visibility to see the impact
5. Watch how performance metrics change in real-time
6. **WebXR Testing**: Click the VR button to test in VR mode
7. **XR Performance**: Notice how components adapt for VR optimization

The demo demonstrates how seamlessly the stats tools integrate with any Three.js project, providing immediate insights into performance bottlenecks and optimization opportunities. 