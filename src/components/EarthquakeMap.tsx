import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ExternalLink, MapPin, Clock, Activity } from 'lucide-react';


delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface EarthquakeFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    tz: number;
    url: string;
    detail: string;
    felt?: number;
    cdi?: number;
    mmi?: number;
    alert?: string;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst?: number;
    dmin?: number;
    rms?: number;
    gap?: number;
    magType: string;
    type: string;
    title: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; 
  };
}

interface EarthquakeData {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: EarthquakeFeature[];
}

interface EarthquakeMapProps {
  minMagnitude: number;
  timeWindow: string;
  dateRange: [Date | null, Date | null];
  refreshTrigger?: number;
  onEarthquakeCountUpdate?: (count: number) => void;
  magRange?: [number, number];
  depthRange?: [number, number];
  maxCount?: number;
  showPlates?: boolean;
  showFilters?: boolean;
  basemap?: 'streets' | 'satellite';
  flyTo?: { lat?: number; lng?: number; zoom?: number; bbox?: [number, number, number, number] } | null;
  mapKey?: number;
}


const createEarthquakeIcon = (magnitude: number) => {
  let color = '';
  const radius = Math.max(4, 2 + magnitude * 2); 
  const size = radius * 2;

  
  if (magnitude < 3) {
    color = '#22c55e'; 
  } else if (magnitude < 4) {
    color = '#38bdf8'; 
  } else if (magnitude < 6) {
    color = '#f59e0b'; 
  } else {
    color = '#ef4444'; 
  }

  return L.divIcon({
    className: 'earthquake-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${Math.max(8, size * 0.3)}px;
        font-weight: bold;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      ">
        ${magnitude.toFixed(1)}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const getMagnitudeBadgeColor = (magnitude: number) => {
  if (magnitude < 2) return 'seismic-low';
  if (magnitude < 4) return 'seismic-medium';
  if (magnitude < 6) return 'seismic-high';
  return 'seismic-extreme';
};

const formatUtcDate = (timestamp?: number) => {
  if (!Number.isFinite(timestamp as number)) return '—';
  const d = new Date(timestamp as number);
  try { return d.toISOString().slice(0, 10); } catch { return '—'; }
};

const formatUtcTime = (timestamp?: number) => {
  if (!Number.isFinite(timestamp as number)) return '—';
  const d = new Date(timestamp as number);
  try { return d.toISOString().slice(11, 19) + 'Z'; } catch { return '—'; }
};

const EarthquakeMap: React.FC<EarthquakeMapProps> = ({ 
  minMagnitude, 
  timeWindow, 
  dateRange,
  refreshTrigger,
  onEarthquakeCountUpdate,
  magRange,
  depthRange,
  maxCount,
  showPlates,
  showFilters,
  basemap = 'streets',
  flyTo,
  mapKey
}) => {
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plateData, setPlateData] = useState<any | null>(null);
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const [selectedEq, setSelectedEq] = useState<EarthquakeFeature | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [nearestFromApi, setNearestFromApi] = useState<EarthquakeFeature[] | null>(null);

  const fetchEarthquakes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let allEarthquakes: any[] = [];
      const [startDate, endDate] = dateRange;
      
      if (startDate && endDate) {
        
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        
        
        const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         (endDate.getMonth() - startDate.getMonth());
        
        
        const chunkSize = monthDiff > 1 ? 1 : 0; 
        let currentStart = new Date(startDate);
        
        do {
          let chunkEnd = new Date(currentStart);
          if (chunkSize > 0) {
            chunkEnd.setMonth(chunkEnd.getMonth() + chunkSize);
            if (chunkEnd > endDate) chunkEnd = new Date(endDate);
          } else {
            chunkEnd = new Date(endDate);
          }
          
          let url = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson';
          url += `&starttime=${formatDate(currentStart)}`;
          url += `&endtime=${formatDate(chunkEnd)}`;
          
          
          
          const lowerMag = Array.isArray(magRange) ? magRange[0] : 0;
          const upperMag = Array.isArray(magRange) ? magRange[1] : minMagnitude;
          url += `&minmagnitude=${lowerMag}&maxmagnitude=${upperMag}`;
          
          
          url += '&limit=10000';
          
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error('Failed to fetch earthquake data');
          }
          
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            allEarthquakes = [...allEarthquakes, ...data.features];
          }
          
          
          if (chunkSize > 0) {
            currentStart = new Date(chunkEnd);
            currentStart.setDate(currentStart.getDate() + 1); 
            
            
            await new Promise(resolve => setTimeout(resolve, 300));
          } else {
            break; 
          }
          
        } while (currentStart < endDate);
        
        
        let filteredEarthquakes = allEarthquakes;
        if (depthRange) {
          const [minDepth, maxDepth] = depthRange;
          filteredEarthquakes = filteredEarthquakes.filter(earthquake => {
            const depth = earthquake.geometry.coordinates[2];
            return depth >= minDepth && depth <= maxDepth;
          });
        }

        if (typeof maxCount === 'number' && maxCount > 0 && 
            filteredEarthquakes.length > maxCount) {
          filteredEarthquakes = filteredEarthquakes.slice(0, maxCount);
        }

        setEarthquakes(filteredEarthquakes);
        
        if (onEarthquakeCountUpdate) {
          onEarthquakeCountUpdate(filteredEarthquakes.length);
        }
      } else {
        
        let url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/';
        switch (timeWindow) {
          case 'day':
            url += 'all_day.geojson';
            break;
          case 'week':
            url += 'all_week.geojson';
            break;
          default:
            url += 'all_day.geojson';
        }
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch earthquake data');
        }
        const data = await response.json();
        allEarthquakes = data.features || [];
        
        const lowerMag = Array.isArray(magRange) ? magRange[0] : 0;
        const upperMag = Array.isArray(magRange) ? magRange[1] : minMagnitude;
        allEarthquakes = allEarthquakes.filter((e: any) => {
          const m = e?.properties?.mag;
          return typeof m === 'number' && m >= lowerMag && m <= upperMag;
        });
        
        
        let filteredEarthquakes = allEarthquakes;
        if (depthRange) {
          const [minDepth, maxDepth] = depthRange;
          filteredEarthquakes = filteredEarthquakes.filter(earthquake => {
            const depth = earthquake.geometry.coordinates[2];
            return depth >= minDepth && depth <= maxDepth;
          });
        }

        if (typeof maxCount === 'number' && maxCount > 0 && 
            filteredEarthquakes.length > maxCount) {
          filteredEarthquakes = filteredEarthquakes.slice(0, maxCount);
        }

        setEarthquakes(filteredEarthquakes);
        
        if (onEarthquakeCountUpdate) {
          onEarthquakeCountUpdate(filteredEarthquakes.length);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarthquakes();
  }, [minMagnitude, timeWindow, dateRange, refreshTrigger, onEarthquakeCountUpdate, magRange?.[0], magRange?.[1], depthRange?.[0], depthRange?.[1], maxCount]);

  
  useEffect(() => {
    if (!mapRef || !flyTo) return;
    if (flyTo.bbox && flyTo.bbox.length === 4) {
      
      const [[south, west], [north, east]] = [
        [flyTo.bbox[1], flyTo.bbox[0]],
        [flyTo.bbox[3], flyTo.bbox[2]],
      ];
      const bounds = L.latLngBounds([south, west], [north, east]);
      mapRef.fitBounds(bounds as any, { animate: true } as any);
      return;
    }
    if (typeof flyTo.lat === 'number' && typeof flyTo.lng === 'number') {
      const z = typeof flyTo.zoom === 'number' ? flyTo.zoom : 5;
      mapRef.setView([flyTo.lat, flyTo.lng], z as any, { animate: true } as any);
    }
  }, [flyTo, mapRef]);

  
  useEffect(() => {
    let cancelled = false;
    const fetchPlates = async () => {
      if (!showPlates || plateData) return;
      try {
        const res = await fetch('https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json');
        if (!res.ok) return;
        const gj = await res.json();
        if (!cancelled) setPlateData(gj);
      } catch (_) {
        
      }
    };
    fetchPlates();
    return () => {
      cancelled = true;
    };
  }, [showPlates, plateData]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading earthquake data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-destructive mb-2">Error loading earthquake data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <>
    <div className="absolute inset-0 rounded-none">
      <MapContainer
        key={mapKey}
        {...({ 
          center: [20, 0], 
          zoom: 2, 
          maxBounds: [[-85, -180], [85, 180]], 
          maxBoundsViscosity: 1.0, 
          worldCopyJump: true,
          tap: false, 
          touchZoom: 'center',
          scrollWheelZoom: 'center'
        } as any)}
        style={{ height: '100%', width: '100%' }}
        className="z-0 h-full w-full"
        whenCreated={(m) => {
          setMapRef(m as unknown as L.Map);
          
          const container = m.getContainer();
          container.style.pointerEvents = 'auto';
        }}
      >
        {}
        <AutoFit />
        {basemap === 'streets' ? (
          <TileLayer
            {...({ attribution: '&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors' } as any)}
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            noWrap={false}
          />
        ) : (
          <TileLayer
            {...({ attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community' } as any)}
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            noWrap={false}
          />
        )}
        {showPlates && plateData && (
          <GeoJSON
            data={plateData as any}
            pathOptions={{ color: '#ff7f00', weight: 1.5, opacity: 0.8 }}
          />
        )}
        
        {earthquakes.map((earthquake) => {
          const [longitude, latitude, depth] = earthquake.geometry.coordinates;
          const { properties } = earthquake;

          return (
            <Marker
              key={earthquake.id}
              {...({ position: [latitude, longitude], icon: createEarthquakeIcon(properties.mag) } as any)}
              eventHandlers={{
                click: async () => {
                  setSelectedEq(earthquake);
                  setInsightsOpen(true);
                  
                  try {
                    const [lon, lat] = earthquake.geometry.coordinates;
                    const radiusKm = 500; 
                    const params = new URLSearchParams({
                      format: 'geojson',
                      latitude: String(lat),
                      longitude: String(lon),
                      maxradiuskm: String(radiusKm),
                      limit: '200',
                      orderby: 'time'
                    });
                    const res = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`);
                    if (res.ok) {
                      const gj = await res.json();
                      const feats = (gj.features || []) as EarthquakeFeature[];
                      
                      const [bLon, bLat] = earthquake.geometry.coordinates;
                      const sorted = feats
                        .map((f: any) => {
                          const [lon2, lat2] = f.geometry.coordinates;
                          return { f, d: haversineKm(bLat, bLon, lat2, lon2) };
                        })
                        .sort((a: any, b: any) => a.d - b.d)
                        .slice(0, 10)
                        .map((x: any) => x.f);
                      setNearestFromApi(sorted);
                    } else {
                      setNearestFromApi(null);
                    }
                  } catch {
                    setNearestFromApi(null);
                  }
                }
              }}
            >
              <Popup>
                <div className="p-2 space-y-3">
                  <div className="flex items-start gap-2">
                    <Activity className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground mb-1">
                        {properties.title}
                      </h3>
                      <Badge 
                        variant="secondary"
                        className="text-xs"
                        style={{ 
                          backgroundColor: `hsl(var(--${getMagnitudeBadgeColor(properties.mag)}))`,
                          color: 'white'
                        }}
                      >
                        Magnitude {properties.mag}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-card-foreground">{properties.place}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Time (UTC):</span>
                      <span className="text-card-foreground">{formatUtcDate(properties.time)} {formatUtcTime(properties.time)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                      <div>
                        <span className="text-muted-foreground text-xs">Depth</span>
                        <p className="text-card-foreground font-medium">{depth.toFixed(1)} km</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Type</span>
                        <p className="text-card-foreground font-medium capitalize">{properties.type}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <a
                      href={properties.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View on USGS
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>

    {}
    <Dialog open={insightsOpen} onOpenChange={setInsightsOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Closest 10 quakes shown</DialogTitle>
        </DialogHeader>
        {selectedEq && (
          <InsightsTable 
            base={selectedEq} 
            earthquakes={nearestFromApi ?? earthquakes}
            onZoom={(lat, lng) => {
              if (mapRef) {
                mapRef.setView([lat, lng], 6, { animate: true });
              }
            }}
          />
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};


const AutoFit: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    window.addEventListener('resize', invalidate);
    const t = setTimeout(invalidate, 50);
    
    const ro = new ResizeObserver(() => invalidate());
    try {
      const container = map.getContainer();
      if (container && container.parentElement) ro.observe(container.parentElement);
    } catch {}
    return () => {
      window.removeEventListener('resize', invalidate);
      clearTimeout(t);
      try { ro.disconnect(); } catch {}
    };
  }, [map]);
  return null;
};

export default EarthquakeMap;


interface InsightsTableProps {
  base: EarthquakeFeature;
  earthquakes: EarthquakeFeature[];
  onZoom: (lat: number, lng: number) => void;
}

const toKm = (meters: number) => meters / 1000;

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const InsightsTable: React.FC<InsightsTableProps> = ({ base, earthquakes, onZoom }) => {
  const [baseLon, baseLat] = base.geometry.coordinates;
  
  const rows = earthquakes
    .map((e) => {
      const [lon, lat] = e.geometry.coordinates;
      return { e, distKm: haversineKm(baseLat, baseLon, lat, lon) };
    })
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 10);

  return (
    <div className="overflow-auto max-h-[60vh]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mag</TableHead>
            <TableHead>Depth km</TableHead>
            <TableHead>Day</TableHead>
            <TableHead>Time UTC</TableHead>
            <TableHead>Lat</TableHead>
            <TableHead>Lon</TableHead>
            <TableHead>Dist km</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ e, distKm }) => {
            const [lon, lat, depth] = e.geometry.coordinates;
            const d = new Date(e.properties.time);
            const day = d.toISOString().slice(0,10);
            const time = d.toISOString().slice(11,19) + 'Z';
            return (
              <TableRow key={e.id} className="cursor-pointer" onClick={() => onZoom(lat, lon)}>
                <TableCell>{e.properties.mag.toFixed(1)}</TableCell>
                <TableCell>{depth.toFixed(0)}</TableCell>
                <TableCell>{day}</TableCell>
                <TableCell>{time}</TableCell>
                <TableCell>{lat.toFixed(2)}</TableCell>
                <TableCell>{lon.toFixed(2)}</TableCell>
                <TableCell>{distKm.toFixed(0)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="text-xs text-muted-foreground mt-2">Click a row to zoom to this vicinity</div>
    </div>
  );
};