# NammaFix Frontend - Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- React 19
- React Router DOM
- Tailwind CSS
- Leaflet & React-Leaflet
- Lucide React (icons)
- React Hot Toast (notifications)

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or next available port).

### 3. Build for Production

```bash
npm run build
```

Production files will be in the `dist/` directory.

## Configuration

### API Base URL

The API base URL is configured in `src/services/api.js`:

```javascript
const API_BASE_URL = 'https://build-for-bengaluru.onrender.com/api';
```

To change it, edit this constant.

### Map Center

The map center is configured in `src/pages/CityMap.jsx`:

```javascript
const center = [12.9716, 77.5946]; // Bengaluru
```

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   ├── App.jsx         # Main app with routing
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── package.json
├── tailwind.config.js  # Tailwind configuration
├── vite.config.js      # Vite configuration
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Troubleshooting

### Port Already in Use

If port 5173 is in use, Vite will automatically try the next available port.

### Leaflet CSS Not Loading

Make sure `import 'leaflet/dist/leaflet.css'` is in `src/index.css`.

### Map Markers Not Showing

The marker icons are loaded from CDN. Check your internet connection.

### API Errors

Verify the backend API is running and accessible at the configured URL.

## Environment Variables

Create a `.env` file if you need custom configuration:

```env
VITE_API_BASE_URL=https://your-api-url.com/api
```

Then update `src/services/api.js` to use:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://build-for-bengaluru.onrender.com/api';
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Development Tips

### Hot Module Replacement

Vite provides instant HMR. Changes to components will reflect immediately without full page reload.

### React DevTools

Install React DevTools browser extension for debugging.

### Tailwind IntelliSense

Install the Tailwind CSS IntelliSense VS Code extension for autocomplete.

## Deployment

### Vercel

```bash
npm run build
vercel --prod
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### GitHub Pages

```bash
npm run build
# Copy dist/ contents to gh-pages branch
```

## Next Steps

1. Test all pages and features
2. Verify API integration
3. Check responsive design on mobile
4. Test geolocation feature
5. Verify map markers and popups
6. Test form validation
7. Check toast notifications

## Support

For issues, check:
1. Console for JavaScript errors
2. Network tab for API errors
3. Browser compatibility
4. Internet connection

Happy coding! 🚀
