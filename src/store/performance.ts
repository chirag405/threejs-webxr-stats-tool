import { create } from 'zustand'
import { PerformanceMonitor, PerformanceMetrics, ComponentMetrics, PerformanceChange } from '../utils/performance'

interface SpatialScreen {
  id: string
  title: string
  position: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  isEnlarged: boolean
  isVisible: boolean
  type: 'main' | 'stats' | 'performance' | 'component'
}

interface PerformanceStore {
  // Performance Monitor Instance
  monitor: PerformanceMonitor | null
  
  // Metrics
  globalMetrics: PerformanceMetrics
  componentMetrics: Map<string, ComponentMetrics>
  performanceChanges: PerformanceChange[]
  
  // Spatial UI State
  screens: SpatialScreen[]
  activeScreenId: string | null
  isXRActive: boolean
  
  // Settings
  updateInterval: number
  isMonitoringEnabled: boolean
  showDetailedStats: boolean
  
  // Actions
  initializeMonitor: () => void
  updateGlobalMetrics: (metrics: PerformanceMetrics) => void
  updateComponentMetrics: (id: string, metrics: ComponentMetrics) => void
  addPerformanceChange: (change: PerformanceChange) => void
  
  // Spatial UI Actions
  createScreen: (type: SpatialScreen['type'], title: string) => string
  deleteScreen: (id: string) => void
  enlargeScreen: (id: string) => void
  shrinkScreen: (id: string) => void
  moveToNextScreen: () => void
  moveToPreviousScreen: () => void
  setActiveScreen: (id: string) => void
  updateScreenPosition: (id: string, position: { x: number; y: number; z: number }) => void
  
  // XR Actions
  setXRActive: (active: boolean) => void
  
  // Settings Actions
  setUpdateInterval: (interval: number) => void
  toggleMonitoring: () => void
  toggleDetailedStats: () => void
}

export const usePerformanceStore = create<PerformanceStore>((set, get) => ({
  // Initial State
  monitor: null,
  globalMetrics: {
    fps: 0,
    ms: 0,
    memory: { used: 0, total: 0, limit: 0 },
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    programs: 0,
    frameTime: 0,
    cpuTime: 0,
    gpuTime: 0,
    networkLatency: 0,
    memoryLeaks: false,
    
    // WebXR Specific Metrics
    xrSessionInitTime: 0,
    motionToPhotonDelay: 0,
    controllerInputLag: 0,
    xrFrameRate: 0,
    xrPredictedDisplayTime: 0,
    
    // GPU Specific Metrics
    gpuFragmentComplexity: 0,
    gpuVertexComplexity: 0,
    gpuMemoryUsage: 0,
    shaderCompileTime: 0,
    textureBindings: 0,
    bufferBindings: 0,
    
    // Advanced Timing Metrics
    cpuFrameTime: 0,
    gpuFrameTime: 0,
    renderCallDuration: 0,
    javascriptTime: 0,
    garbageCollectionTime: 0,
    
    // Three.js Renderer Info
    rendererInfo: {
      memory: {
        geometries: 0,
        textures: 0
      },
      render: {
        frame: 0,
        calls: 0,
        triangles: 0,
        points: 0,
        lines: 0
      },
      programs: 0
    }
  },
  componentMetrics: new Map(),
  performanceChanges: [],
  
  screens: [
    {
      id: 'main-screen',
      title: 'Main View',
      position: { x: 0, y: 0, z: -2 },
      scale: { x: 1, y: 1, z: 1 },
      isEnlarged: false,
      isVisible: true,
      type: 'main'
    }
  ],
  activeScreenId: 'main-screen',
  isXRActive: false,
  
  updateInterval: 60, // Update every 60ms (16.67fps)
  isMonitoringEnabled: true,
  showDetailedStats: false,
  
  // Performance Actions
  initializeMonitor: () => {
    const monitor = new PerformanceMonitor()
    set({ monitor })
  },
  
  updateGlobalMetrics: (metrics) => {
    set({ globalMetrics: metrics })
  },
  
  updateComponentMetrics: (id, metrics) => {
    const componentMetrics = new Map(get().componentMetrics)
    componentMetrics.set(id, metrics)
    set({ componentMetrics })
  },
  
  addPerformanceChange: (change) => {
    const changes = [change, ...get().performanceChanges].slice(0, 100) // Keep last 100
    set({ performanceChanges: changes })
  },
  
  // Spatial UI Actions
  createScreen: (type, title) => {
    const screens = get().screens
    const newScreenId = `screen-${Date.now()}`
    
    // Calculate position for new screen (horizontal alignment)
    const lastScreen = screens[screens.length - 1]
    const newPosition = {
      x: lastScreen.position.x + 3, // 3 units apart horizontally
      y: lastScreen.position.y,
      z: lastScreen.position.z
    }
    
    const newScreen: SpatialScreen = {
      id: newScreenId,
      title,
      position: newPosition,
      scale: { x: 1, y: 1, z: 1 },
      isEnlarged: false,
      isVisible: true,
      type
    }
    
    set({ 
      screens: [...screens, newScreen],
      activeScreenId: newScreenId
    })
    
    return newScreenId
  },
  
  deleteScreen: (id) => {
    const currentScreens = get().screens
    const deletedScreenIndex = currentScreens.findIndex(screen => screen.id === id)
    const screens = currentScreens.filter(screen => screen.id !== id)
    const activeScreenId = get().activeScreenId
    
    // Auto-adjust positions: move screens after the deleted one forward
    const adjustedScreens = screens.map((screen, index) => {
      // If this is the main screen, don't adjust
      if (screen.id === 'main-screen') return screen
      
      // Calculate new position based on index
      const newPosition = {
        x: (index - 1) * 3, // 3 units apart horizontally, start from -3 for first non-main screen
        y: screen.position.y,
        z: screen.position.z
      }
      
      return { ...screen, position: newPosition }
    })
    
    // If deleted screen was active, set first screen as active
    const newActiveId = activeScreenId === id && adjustedScreens.length > 0 
      ? adjustedScreens[0].id 
      : activeScreenId
    
    set({ 
      screens: adjustedScreens,
      activeScreenId: newActiveId
    })
  },
  
  enlargeScreen: (id) => {
    const screens = get().screens.map(screen => 
      screen.id === id 
        ? { ...screen, isEnlarged: true, scale: { x: 2, y: 2, z: 1 } }
        : { ...screen, isEnlarged: false, scale: { x: 1, y: 1, z: 1 } }
    )
    set({ screens })
  },
  
  shrinkScreen: (id) => {
    const screens = get().screens.map(screen => 
      screen.id === id 
        ? { ...screen, isEnlarged: false, scale: { x: 1, y: 1, z: 1 } }
        : screen
    )
    set({ screens })
  },
  
  moveToNextScreen: () => {
    const { screens, activeScreenId } = get()
    const currentIndex = screens.findIndex(screen => screen.id === activeScreenId)
    const nextIndex = (currentIndex + 1) % screens.length
    const nextScreenId = screens[nextIndex].id
    
    // Carousel-style transitions: screens slide to the left
    const rearrangedScreens = screens.map((screen, index) => {
      const screenIndex = screens.findIndex(s => s.id === screen.id)
      const relativeIndex = (screenIndex - nextIndex + screens.length) % screens.length
      
      // Calculate carousel position
      const carouselX = relativeIndex === 0 ? 0 : (relativeIndex <= screens.length / 2 ? relativeIndex * 3 : (relativeIndex - screens.length) * 3)
      
      return { 
        ...screen, 
        position: { 
          x: carouselX,
          y: screen.position.y, 
          z: relativeIndex === 0 ? -2 : -1 // Active screen slightly forward
        } 
      }
    })
    
    set({ activeScreenId: nextScreenId, screens: rearrangedScreens })
  },
  
  moveToPreviousScreen: () => {
    const { screens, activeScreenId } = get()
    const currentIndex = screens.findIndex(screen => screen.id === activeScreenId)
    const prevIndex = currentIndex === 0 ? screens.length - 1 : currentIndex - 1
    const prevScreenId = screens[prevIndex].id
    
    // Carousel-style transitions: screens slide to the right
    const rearrangedScreens = screens.map((screen, index) => {
      const screenIndex = screens.findIndex(s => s.id === screen.id)
      const relativeIndex = (screenIndex - prevIndex + screens.length) % screens.length
      
      // Calculate carousel position
      const carouselX = relativeIndex === 0 ? 0 : (relativeIndex <= screens.length / 2 ? relativeIndex * 3 : (relativeIndex - screens.length) * 3)
      
      return { 
        ...screen, 
        position: { 
          x: carouselX,
          y: screen.position.y, 
          z: relativeIndex === 0 ? -2 : -1 // Active screen slightly forward
        } 
      }
    })
    
    set({ activeScreenId: prevScreenId, screens: rearrangedScreens })
  },
  
  setActiveScreen: (id) => {
    set({ activeScreenId: id })
  },
  
  updateScreenPosition: (id, position) => {
    const screens = get().screens.map(screen => 
      screen.id === id 
        ? { ...screen, position }
        : screen
    )
    set({ screens })
  },
  
  // XR Actions
  setXRActive: (active) => {
    set({ isXRActive: active })
  },
  
  // Settings Actions
  setUpdateInterval: (interval) => {
    set({ updateInterval: interval })
  },
  
  toggleMonitoring: () => {
    set({ isMonitoringEnabled: !get().isMonitoringEnabled })
  },
  
  toggleDetailedStats: () => {
    set({ showDetailedStats: !get().showDetailedStats })
  }
}))

// Selector hooks for better performance
export const useGlobalMetrics = () => usePerformanceStore(state => state.globalMetrics)
export const useComponentMetrics = () => usePerformanceStore(state => state.componentMetrics)
export const usePerformanceChanges = () => usePerformanceStore(state => state.performanceChanges)
export const useScreens = () => usePerformanceStore(state => state.screens)
export const useActiveScreen = () => usePerformanceStore(state => 
  state.screens.find(screen => screen.id === state.activeScreenId)
)
export const useMonitoringSettings = () => usePerformanceStore(state => ({
  updateInterval: state.updateInterval,
  isMonitoringEnabled: state.isMonitoringEnabled,
  showDetailedStats: state.showDetailedStats
})) 