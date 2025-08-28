import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card } from './ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';

interface EarthquakeFeature {
  id: string;
  properties: { mag: number; time: number };
  geometry: { type: 'Point'; coordinates: [number, number, number] };
}

interface EarthquakeVisualizeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateRange: [Date | null, Date | null];
  timeWindow: string;
  magRange?: [number, number];
}

const EarthquakeVisualize: React.FC<EarthquakeVisualizeProps> = ({ open, onOpenChange, dateRange, timeWindow, magRange }) => {
  const [data, setData] = useState<EarthquakeFeature[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [start, end] = dateRange;
        let url: string;
        if (start && end) {
          const formatDate = (d: Date) => d.toISOString().split('T')[0];
          const lowerMag = magRange ? magRange[0] : 0;
          const upperMag = magRange ? magRange[1] : 10;
          url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${formatDate(start)}&endtime=${formatDate(end)}&minmagnitude=${lowerMag}&maxmagnitude=${upperMag}&limit=20000`;
        } else {
          let feed = 'all_day';
          if (timeWindow === 'week') feed = 'all_week';
          url = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${feed}.geojson`;
        }
        const res = await fetch(url);
        const gj = await res.json();
        setData((gj.features || []) as EarthquakeFeature[]);
      } catch (_) {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [open, dateRange, timeWindow, magRange?.[0], magRange?.[1]]);

  const byDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of data) {
      const day = new Date(f.properties.time).toISOString().slice(0, 10);
      map[day] = (map[day] || 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([day, count]) => ({ day, count }));
  }, [data]);

  const byMagnitudeBucket = useMemo(() => {
    const buckets = [
      { key: '<2', label: '<2.0', min: -Infinity, max: 2 },
      { key: '2-3.9', label: '2.0-3.9', min: 2, max: 4 },
      { key: '4-5.9', label: '4.0-5.9', min: 4, max: 6 },
      { key: '6+', label: '6.0+', min: 6, max: Infinity },
    ];
    const counts: Record<string, number> = {};
    for (const b of buckets) counts[b.key] = 0;
    for (const f of data) {
      const m = f.properties.mag;
      for (const b of buckets) {
        if (m >= b.min && m < b.max) {
          counts[b.key] += 1;
          break;
        }
      }
    }
    return buckets.map(b => ({ bucket: b.label, count: counts[b.key] }));
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Recent Earthquake Activity</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="text-sm font-medium mb-2">Events per day</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={byDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" hide={byDay.length > 20} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium mb-2">Events by magnitude</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMagnitudeBucket}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#38bdf8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        {loading && <div className="text-xs text-muted-foreground">Loading…</div>}
      </DialogContent>
    </Dialog>
  );
};

export default EarthquakeVisualize;


