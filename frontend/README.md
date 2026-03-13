# NammaFix - AI Civic Intelligence Platform (Frontend)

A production-quality React dashboard for reporting and monitoring civic infrastructure issues across the city.

## 🚀 Features

### Dashboard
- Real-time statistics with animated counters
- City issue hotspots visualization
- Alert banner for critical clusters
- Responsive stat cards with icons

### Report Issue
- Complaint submission form
- Geolocation integration ("Use My Location" button)
- Form validation
- Success notifications with complaint ID

### Track Complaint
- Search complaints by ID
- Visual progress timeline (Pending → In Progress → Resolved)
- Detailed complaint information
- Status and priority badges

### City Map
- Interactive Leaflet map centered on Bengaluru
- Color-coded markers by issue category
- Heatmap overlay for complaint density
- Popup details on marker click
- Legend for issue categories

### Trending Issues
- Sortable table of complaint clusters
- Ranked by complaint count
- Summary statistics
- Location coordinates

## 🛠️ Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Leaflet & React-Leaflet** - Interactive maps
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 API Integration

The frontend connects to the backend API at:
```
https://build-for-bengaluru.onrender.com/api
```

### API Endpoints Used

- `POST /api/complaints` - Submit new complaint
- `GET /api/complaints/:id` - Get complaint by ID
- `GET /api/trending` - Get trending issue clusters
- `GET /api/heatmap` - Get all complaints for map visualization

## 📁 Project Structure

```
src/
├── components/
│   ├── Navbar.jsx           # Top navigation bar
│   ├── Sidebar.jsx          # Collapsible sidebar navigation
│   ├── StatCard.jsx         # Animated statistics card
│   ├── PriorityBadge.jsx    # Priority level badge
│   ├── StatusBadge.jsx      # Status badge
│   ├── AlertBanner.jsx      # Alert notification banner
│   └── LoadingSpinner.jsx   # Loading indicator
├── pages/
│   ├── Dashboard.jsx        # Main dashboard view
│   ├── ReportIssue.jsx      # Complaint submission form
│   ├── TrackComplaint.jsx   # Complaint tracking
│   ├── CityMap.jsx          # Interactive city map
│   └── TrendingIssues.jsx   # Trending issues table
├── services/
│   └── api.js               # API service layer
├── App.jsx                  # Main app component with routing
├── main.jsx                 # App entry point
└── index.css                # Global styles with Tailwind
```

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6) - Main actions and highlights
- **Accent**: Orange (#f97316) - Secondary actions
- **Background**: Light gray (#f9fafb)

### Issue Category Colors
- Pothole: Red (#ef4444)
- Garbage: Orange (#f97316)
- Flooding: Blue (#3b82f6)
- Drainage: Purple (#a855f7)
- Streetlight: Yellow (#eab308)
- Water Leak: Cyan (#06b6d4)
- Traffic Signal: Pink (#ec4899)

### Priority Levels
- **High**: Red badge
- **Medium**: Yellow badge
- **Low**: Green badge

### Status Levels
- **Pending**: Gray badge
- **In Progress**: Blue badge
- **Resolved**: Green badge

## 🗺️ Map Configuration

The map is centered on Bengaluru:
- Latitude: 12.9716
- Longitude: 77.5946
- Default Zoom: 12

Markers are color-coded by issue category with popup details showing:
- Issue category
- Priority level
- Location coordinates

## 📱 Responsive Design

The dashboard is fully responsive:
- **Desktop**: Full sidebar + main content
- **Tablet**: Collapsible sidebar
- **Mobile**: Hamburger menu with overlay sidebar

## 🔔 Notifications

Toast notifications are shown for:
- Successful complaint submission
- Complaint found/not found
- API errors
- Location capture success/failure

## 🚦 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
4. Open http://localhost:5174 in your browser

## 🏗️ Building for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` directory.

## 🌟 Key Features

### Animated Statistics
Statistics cards feature smooth number animations when data loads.

### Geolocation
The "Use My Location" button automatically fills latitude/longitude using the browser's geolocation API.

### Progress Timeline
Visual timeline shows complaint status progression with checkmarks and color coding.

### Interactive Map
Click markers to see complaint details. Heatmap circles show complaint density.

### Real-time Data
All data is fetched from the live backend API with loading states and error handling.

## 🎯 Demo Clusters

If no trending data is available, the dashboard shows demo clusters to ensure the UI never appears empty.

## 📄 License

MIT License - Built for Build for Bengaluru Hackathon 2026

## 👥 Support

For issues or questions, please contact the development team.
