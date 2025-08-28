import React, { useState, useEffect } from 'react';
import EarthquakeMap from '../components/EarthquakeMap';
import EarthquakeFilters from '../components/EarthquakeFilters';
import EarthquakeHeader from '../components/EarthquakeHeader';
import EarthquakeVisualize from '../components/EarthquakeVisualize';
import { Button } from '../components/ui/button';
import { RefreshCw } from 'lucide-react';

const Index = () => {
  const [minMagnitude, setMinMagnitude] = useState(2.0);
  const [timeWindow, setTimeWindow] = useState('day');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [earthquakeCount, setEarthquakeCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [magRange, setMagRange] = useState<[number, number]>([0, 10]);
  const [depthRange, setDepthRange] = useState<[number, number]>([0, 800]);
  const [maxCount, setMaxCount] = useState<number>(1000);
  const [showPlates, setShowPlates] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [basemap, setBasemap] = useState<'streets' | 'satellite'>('streets');
  const [visualizeOpen, setVisualizeOpen] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat?: number; lng?: number; zoom?: number; bbox?: [number, number, number, number] } | null>(null);
  const [mapKey, setMapKey] = useState(0);

  
  useEffect(() => {
    setLastUpdated(new Date());
  }, [minMagnitude, timeWindow]);

  const handleRefresh = () => {
    setLastUpdated(new Date());
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEarthquakeCountUpdate = (count: number) => {
    setEarthquakeCount(count);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {}
      <div className="flex-shrink-0 p-3">
        <EarthquakeHeader 
          totalCount={earthquakeCount}
          lastUpdated={lastUpdated}
          onVisualize={() => setVisualizeOpen(true)}
        />
      </div>

      {}
      <div className="flex-1 flex min-h-0">
        {}
        <div className="flex-1 relative overflow-hidden min-w-0">
          <EarthquakeMap
            minMagnitude={minMagnitude}
            timeWindow={timeWindow}
            dateRange={dateRange}
            refreshTrigger={refreshTrigger}
            onEarthquakeCountUpdate={handleEarthquakeCountUpdate}
            magRange={magRange}
            depthRange={depthRange}
            maxCount={maxCount}
            showPlates={showPlates}
            showFilters={showFilters}
            basemap={basemap}
            flyTo={flyTo}
            mapKey={mapKey}
          />
        </div>

        
        <div 
          className={`${showFilters ? 'w-80' : 'w-0'} transition-all duration-300 flex-shrink-0 overflow-hidden border-l border-border bg-secondary z-10`}
          onClick={(e) => e.stopPropagation()}
        >
          {showFilters && (
            <div 
              className="h-full overflow-y-auto p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <EarthquakeFilters
                minMagnitude={minMagnitude}
                onMinMagnitudeChange={setMinMagnitude}
                timeWindow={timeWindow}
                onTimeWindowChange={setTimeWindow}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                magRange={magRange}
                onMagRangeChange={setMagRange}
                depthRange={depthRange}
                onDepthRangeChange={setDepthRange}
                maxCount={maxCount}
                onMaxCountChange={setMaxCount}
                showPlates={showPlates}
                onShowPlatesChange={setShowPlates}
                basemap={basemap}
                onBasemapChange={setBasemap}
                onVisualize={() => setVisualizeOpen(true)}
                onRegionSearch={async (q) => {
                  const query = (q || '').trim();
                  if (!query) return;
                  const tryGeocode = async (url: string) => {
                    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
                    if (!res.ok) return null;
                    const arr = await res.json();
                    if (!Array.isArray(arr) || arr.length === 0) return null;
                    const hit = arr[0];
                    const { lat, lon, type, boundingbox } = hit;
                    if (Array.isArray(boundingbox) && boundingbox.length === 4) {
                      const [south, north, west, east] = boundingbox.map((n: string) => parseFloat(n));
                      return { bbox: [west, south, east, north] as [number, number, number, number] };
                    }
                    return { lat: parseFloat(lat), lng: parseFloat(lon), zoom: type === 'country' ? 4 : 6 };
                  };
                  try {
                    const p1 = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', addressdetails: '0' });
                    let result = await tryGeocode(`https://nominatim.openstreetmap.org/search?${p1.toString()}`);
                    if (!result) {
                      const p2 = new URLSearchParams({ q: query, format: 'json', limit: '1' });
                      result = await tryGeocode(`https://geocode.maps.co/search?${p2.toString()}`);
                    }
                    if (result) {
                      setFlyTo(result);
                      
                      setMapKey((k) => k + 1);
                    }
                  } catch {
                    
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {}
      <div className="absolute top-44 right-10 z-50">
        <Button size="sm" variant="secondary" onClick={() => setShowFilters((v) => !v)}>
          {showFilters ? 'Hide panel' : 'Show panel'}
        </Button>
      </div>

      {}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center text-xs text-muted-foreground bg-background/70 backdrop-blur-sm px-3 py-1 rounded-md border">
        Earthquake data provided by{' '}
        <a 
          href="https://earthquake.usgs.gov/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 transition-colors"
        >
          USGS Earthquake Hazards Program
        </a>
      </div>

      {}
      <EarthquakeVisualize 
        open={visualizeOpen}
        onOpenChange={setVisualizeOpen}
        dateRange={dateRange}
        timeWindow={timeWindow}
        magRange={magRange}
      />
    </div>
  );
};

export default Index;