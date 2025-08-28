# 🌍 Seismic Sight

Real‑time earthquake monitoring and visualization. Explore recent global seismic activity with an interactive map, rich filters, and quick visual analytics.

## ✨ Highlights

- Interactive world map (React Leaflet + OSM tiles)
- Live USGS data with loading and error states
- Smart, readable markers sized by magnitude: radius = 2 + mag × 2
- Clear color scheme by magnitude:
  - Green: < 3.0
  - Blue: 3.0 – 3.9
  - Yellow: 4.0 – 5.9
  - Red: ≥ 6.0
- Insight dialog with “closest 10” nearby events and quick zoom

## 🎛️ Filters and Controls

Right panel (toggle Show/Hide):

- Date range picker (supports multi‑month ranges; auto‑chunks requests)
- Time window: Last 24 hours or Last 7 days
- Minimum magnitude slider
  - When magnitude range is NOT used, the single slider acts as an upper cap (shows 0..selected)
- Magnitude range slider (optional explicit [min, max])
- Depth range slider (km)
- Maximum earthquakes (cap large result sets)
- Basemap: Map or Satellite
- Plate boundaries overlay toggle
- Visualize button: opens charts for events per day and by magnitude buckets

## 🧭 How magnitude filtering works

- With a custom date range: the USGS query uses `minmagnitude` and `maxmagnitude` directly.
- With time-window feeds (day/week): results are fetched then filtered client‑side.
- Behavior when the magnitude range slider is not used:
  - Shows 0..Minimum Magnitude only (higher magnitudes are excluded).
- Behavior when the magnitude range slider is used:
  - Shows events within that explicit [min, max] window.

## 🛠️ Tech Stack

- React 18 + TypeScript
- Vite build tooling
- Tailwind CSS + shadcn/ui components
- Leaflet + React Leaflet
- Recharts (visualize dialog)
- Lucide icons

## 🚀 Getting Started

Prereqs: Node.js 18+ and npm.

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📌 Usage Tips

- Click a marker to see details and open USGS links.
- Use the Visualize button for quick charts of recent activity.
- Toggle the right panel to maximize the map.
- If the header height changes, the map auto‑fits to fill available space.

## 🔗 Data Source

- USGS Earthquake Hazards Program (GeoJSON)
  - Feeds: `all_day.geojson`, `all_week.geojson`
  - Custom queries for date ranges via `fdsnws/event/1/query`

## 📦 Project Structure

- `src/pages/Index.tsx`: App layout, state, and wiring
- `src/components/EarthquakeMap.tsx`: Map, markers, popups, insights dialog
- `src/components/EarthquakeFilters.tsx`: Filters panel and controls
- `src/components/EarthquakeHeader.tsx`: Compact header with visualize entry point
- `src/index.css`: Theme tokens and Tailwind layers

## 🧩 Known limitations

- USGS feeds are limited to recent windows; large custom ranges are chunked but still network‑bound.
- No offline support (map tiles and data require network).
- Browser support: modern evergreen browsers.

## 📜 License

MIT (see LICENSE if present). Data © respective providers (USGS, OSM, Esri).
