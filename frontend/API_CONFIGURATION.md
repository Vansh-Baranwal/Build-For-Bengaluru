# API Configuration Guide

## Current Setup

The frontend is configured to work with **mock data** when the API is unavailable. This ensures the UI is always functional for demos and development.

## API Endpoints

### Option 1: Local Backend (Default)
```
VITE_API_URL=http://localhost:3000/api
```

### Option 2: Deployed Backend
```
VITE_API_URL=https://build-for-bengaluru.onrender.com/api
```

## Configuration

Edit `.env` file in the frontend directory:

```env
# Use local backend
VITE_API_URL=http://localhost:3000/api

# Or use deployed backend (uncomment to use)
# VITE_API_URL=https://build-for-bengaluru.onrender.com/api
```

## Mock Data Fallback

When the API is unavailable, the frontend automatically falls back to mock data:

### Dashboard
- 5 mock complaints with various categories
- Demo statistics
- Sample hotspot clusters

### City Map
- 8 mock complaint markers
- Distributed across Bengaluru
- Various categories and priorities

### Trending Issues
- 5 mock clusters
- Sorted by complaint count
- Sample locations

## Starting the Backend

If you want to use the local backend:

```bash
cd backend
npm start
```

**Note**: The backend requires:
- PostgreSQL database connection
- Supabase credentials
- Groq API key

## Testing API Connection

### Check if backend is running:
```bash
curl http://localhost:3000/api/heatmap
```

### Check if deployed backend is accessible:
```bash
curl https://build-for-bengaluru.onrender.com/api/heatmap
```

## Troubleshooting

### API Not Loading

**Symptoms**:
- Pages show "Using demo data - API unavailable" toast
- Mock data is displayed

**Solutions**:
1. Check if backend server is running
2. Verify API URL in `.env` file
3. Check network connectivity
4. Look for CORS errors in browser console

### Backend Connection Issues

**Symptoms**:
- Backend fails to start
- Database connection timeout

**Solutions**:
1. Check database credentials in `backend/.env`
2. Verify Supabase database is accessible
3. Check internet connection
4. Verify firewall settings

### CORS Errors

**Symptoms**:
- API requests blocked by browser
- CORS policy errors in console

**Solutions**:
1. Ensure backend has CORS enabled
2. Check backend CORS configuration
3. Use same origin (localhost) for both frontend and backend

## Demo Mode

The frontend is designed to work perfectly in **demo mode** with mock data. This is ideal for:

- Hackathon presentations
- UI/UX demonstrations
- Development without backend
- Testing frontend features

## Production Deployment

For production:

1. Update `.env` with production API URL
2. Ensure backend is deployed and accessible
3. Test all API endpoints
4. Remove or update mock data fallbacks if desired

## Environment Variables

The frontend uses Vite's environment variable system:

- Variables must start with `VITE_`
- Access in code: `import.meta.env.VITE_API_URL`
- Restart dev server after changing `.env`

## API Service Layer

The API service (`src/services/api.js`) handles:

- API base URL configuration
- Request/response formatting
- Error handling
- Automatic fallback to mock data

## Current Status

✅ Frontend works with mock data
✅ All pages functional
✅ UI fully interactive
✅ Ready for demo

⚠️ Backend API connection may timeout
⚠️ Using mock data as fallback

## Next Steps

1. **For Demo**: Use current setup with mock data
2. **For Development**: Start local backend
3. **For Production**: Deploy backend and update API URL

---

**The frontend is fully functional and ready to use!**
