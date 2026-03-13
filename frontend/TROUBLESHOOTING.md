# Troubleshooting Guide

## Common Issues and Solutions

### 1. Tailwind CSS Not Working

**Problem**: Styles not applying, classes not working

**Solution**:
```bash
# Reinstall Tailwind dependencies
npm install @tailwindcss/postcss postcss autoprefixer

# Verify postcss.config.js has:
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

# Verify index.css has:
@import "tailwindcss";
```

### 2. Map Not Displaying

**Problem**: Blank map or markers not showing

**Solution**:
- Check internet connection (tiles load from CDN)
- Verify Leaflet CSS is imported in index.css
- Check browser console for errors
- Ensure coordinates are valid numbers

### 3. API Errors

**Problem**: "Failed to fetch" or CORS errors

**Solution**:
- Verify backend API is running
- Check API URL in `src/services/api.js`
- Ensure backend has CORS enabled
- Check network tab in browser DevTools

### 4. Geolocation Not Working

**Problem**: "Use My Location" button doesn't work

**Solution**:
- Use HTTPS (geolocation requires secure context)
- Allow location permission in browser
- Check if browser supports geolocation
- Test in different browser

### 5. Build Errors

**Problem**: `npm run build` fails

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

### 6. Port Already in Use

**Problem**: Port 5173 is already in use

**Solution**:
- Vite automatically tries next port (5174, 5175, etc.)
- Or manually kill the process:
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### 7. Hot Reload Not Working

**Problem**: Changes not reflecting in browser

**Solution**:
- Hard refresh browser (Ctrl+Shift+R)
- Restart dev server
- Clear browser cache
- Check if file is saved

### 8. Icons Not Showing

**Problem**: Lucide icons not displaying

**Solution**:
```bash
# Reinstall lucide-react
npm install lucide-react

# Verify import in component:
import { IconName } from 'lucide-react';
```

### 9. Toast Notifications Not Appearing

**Problem**: No toast messages on actions

**Solution**:
- Verify `<Toaster />` is in App.jsx
- Check react-hot-toast is installed
- Look for console errors
- Ensure toast.success() or toast.error() is called

### 10. Routing Not Working

**Problem**: 404 on page refresh or navigation

**Solution**:
- Verify BrowserRouter is wrapping App
- Check route paths match exactly
- For production, configure server for SPA routing
- Use HashRouter as fallback

## Development Tips

### Clear All Caches
```bash
# Clear npm cache
npm cache clean --force

# Clear Vite cache
rm -rf node_modules/.vite

# Reinstall
npm install
```

### Check Dependencies
```bash
# List installed packages
npm list --depth=0

# Check for outdated packages
npm outdated

# Update packages
npm update
```

### Debug Mode

Enable verbose logging:
```javascript
// In api.js
console.log('API Request:', url, data);
console.log('API Response:', response);
```

### Browser DevTools

1. **Console**: Check for JavaScript errors
2. **Network**: Monitor API calls
3. **Elements**: Inspect DOM and styles
4. **Application**: Check localStorage/cookies

## Performance Issues

### Slow Loading

**Solutions**:
- Enable production build: `npm run build`
- Use code splitting
- Optimize images
- Lazy load components

### Memory Leaks

**Solutions**:
- Clean up useEffect hooks
- Remove event listeners
- Cancel pending API calls
- Use React DevTools Profiler

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Unsupported Features
- IE 11 (not supported)
- Old mobile browsers

## Environment-Specific Issues

### Development
- Use `npm run dev`
- Hot reload enabled
- Source maps available
- Detailed error messages

### Production
- Use `npm run build`
- Minified code
- No source maps
- Generic error messages

## Getting Help

1. Check browser console for errors
2. Review network tab for failed requests
3. Verify API is accessible
4. Test in incognito mode
5. Try different browser
6. Check GitHub issues
7. Contact development team

## Quick Fixes

```bash
# Nuclear option - fresh start
rm -rf node_modules package-lock.json dist
npm install
npm run dev
```

## Logs Location

- Browser Console: F12 → Console tab
- Network Logs: F12 → Network tab
- Vite Logs: Terminal where `npm run dev` is running

## Still Having Issues?

1. Document the error message
2. Note steps to reproduce
3. Check browser and OS version
4. Provide screenshot if possible
5. Contact support team

---

**Remember**: Most issues are solved by clearing cache and reinstalling dependencies!
