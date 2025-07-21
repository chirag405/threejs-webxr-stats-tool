# AndroidXR Deployment Guide

## Overview
This Three.js WebXR Performance Monitor is fully compatible with AndroidXR emulator and devices.

## Prerequisites
- AndroidXR emulator or compatible device
- HTTPS connection (required for WebXR)
- Chrome or WebXR-compatible browser

## Local Development for AndroidXR

### 1. Start the Development Server with HTTPS
```bash
# Install local SSL certificates (first time only)
npm install -g local-ssl-proxy

# Start Next.js dev server
npm run dev

# In another terminal, create HTTPS proxy
local-ssl-proxy --source 3001 --target 3000
```

### 2. Access from AndroidXR Emulator
- Open Chrome on AndroidXR emulator
- Navigate to: `https://[your-local-ip]:3001`
- Accept the security warning (development certificate)
- Click the "Enter VR" button

### 3. AndroidXR Specific Features
- Hand tracking support (if available)
- Controller support
- Spatial UI optimized for VR/AR
- Performance monitoring in immersive mode

## Production Deployment

### 1. Build for Production
```bash
npm run build
```

### 2. Deploy with HTTPS
Deploy to any HTTPS-enabled hosting service:
- Vercel (recommended)
- Netlify
- AWS Amplify
- Custom server with SSL

### 3. Environment Requirements
- HTTPS is mandatory for WebXR
- Proper CORS headers (already configured)
- WebXR permissions policy (already set)

## AndroidXR Compatibility Features

### Supported Features
- ✅ Immersive VR mode
- ✅ Hand tracking (optional)
- ✅ Controller input
- ✅ Spatial UI panels
- ✅ Real-time performance monitoring
- ✅ Local floor reference space
- ✅ Bounded floor (optional)
- ✅ Layers API (optional)

### UI Adaptations for AndroidXR
- Screens arranged in semicircle for better visibility
- Larger text and UI elements in VR mode
- Gesture-based interactions
- Controller-friendly interface
- Optimized render performance

## Testing on AndroidXR Emulator

1. **Setup AndroidXR Emulator**
   - Follow Google's AndroidXR emulator setup guide
   - Ensure WebXR flags are enabled in Chrome

2. **Enable WebXR Flags**
   ```
   chrome://flags/#webxr
   chrome://flags/#webxr-incubations
   chrome://flags/#webxr-runtime
   ```

3. **Performance Considerations**
   - The app automatically adjusts quality based on device
   - GPU timing features work best on actual hardware
   - Monitor FPS and adjust scene complexity as needed

## Troubleshooting

### "Enter VR" button not appearing
- Ensure HTTPS connection
- Check WebXR browser support
- Verify permissions in browser settings

### Performance issues
- Reduce number of active screens
- Disable complex visualizations
- Check GPU memory usage

### Hand tracking not working
- Verify device/emulator supports hand tracking
- Check permissions for camera access
- Ensure good lighting conditions

## API Integration
The app exposes performance data that can be accessed programmatically:
- Real-time FPS monitoring
- GPU timing (when available)
- Memory usage tracking
- DrawCall statistics
- WebXR-specific metrics

## Support
For AndroidXR-specific issues, please refer to:
- [AndroidXR Documentation](https://developers.google.com/ar/develop/unity/androidxr)
- [WebXR Device API](https://www.w3.org/TR/webxr/)
- [Three.js XR Documentation](https://threejs.org/docs/#manual/en/introduction/How-to-use-WebXR)
