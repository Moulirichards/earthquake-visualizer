import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Filter, TrendingUp, Calendar as CalendarIcon, BarChart2 } from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface EarthquakeFiltersProps {
  minMagnitude: number;
  onMinMagnitudeChange: (value: number) => void;
  timeWindow: string;
  onTimeWindowChange: (value: string) => void;
  dateRange: [Date | null, Date | null];
  onDateRangeChange: (value: [Date | null, Date | null]) => void;
  earthquakeCount?: number;
  magRange?: [number, number];
  onMagRangeChange?: (value: [number, number]) => void;
  depthRange?: [number, number];
  onDepthRangeChange?: (value: [number, number]) => void;
  maxCount?: number;
  onMaxCountChange?: (value: number) => void;
  onApply?: () => void;
  showPlates?: boolean;
  onShowPlatesChange?: (value: boolean) => void;
  basemap?: 'streets' | 'satellite';
  onBasemapChange?: (value: 'streets' | 'satellite') => void;
  onVisualize?: () => void;
}

const EarthquakeFilters: React.FC<EarthquakeFiltersProps> = ({
  minMagnitude,
  onMinMagnitudeChange,
  timeWindow,
  onTimeWindowChange,
  dateRange,
  onDateRangeChange,
  earthquakeCount = 0,
  magRange,
  onMagRangeChange,
  depthRange,
  onDepthRangeChange,
  maxCount,
  onMaxCountChange,
  onApply,
  showPlates,
  onShowPlatesChange,
  basemap = 'streets',
  onBasemapChange,
  onVisualize,
}) => {
  const [temporaryDate, setTemporaryDate] = useState<Date | null>(null);

  const handleMagnitudeChange = (value: number[]) => {
    const nextMin = value[0];
    onMinMagnitudeChange(nextMin);
    if (onMagRangeChange && magRange) {
      const upper = Math.max(nextMin, magRange[1]);
      onMagRangeChange([nextMin, upper]);
    }
  };

  const getMagnitudeDescription = (magnitude: number) => {
    if (magnitude < 2) return 'Often not felt';
    if (magnitude < 4) return 'Often felt, minor damage';
    if (magnitude < 6) return 'Moderate damage';
    return 'Major to great damage';
  };

  const getMagnitudeColor = (magnitude: number) => {
    if (magnitude < 2) return 'seismic-low';
    if (magnitude < 4) return 'seismic-medium';
    if (magnitude < 6) return 'seismic-high';
    return 'seismic-extreme';
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!dateRange[0] || (dateRange[0] && dateRange[1])) {
      onDateRangeChange([date, null]);
      setTemporaryDate(date);
    } else if (dateRange[0] && !dateRange[1]) {
      const [start] = dateRange;
      if (date < start) {
        onDateRangeChange([date, start]);
      } else {
        onDateRangeChange([start, date]);
      }
      setTemporaryDate(null);
    }
  };

  const isDateInRange = (date: Date) => {
    if (!dateRange[0] || !dateRange[1]) return false;
    return date > dateRange[0] && date < dateRange[1];
  };

  const isDateSelected = (date: Date) => {
    if (!dateRange[0] || !dateRange[1]) return false;
    return (
      date.toDateString() === dateRange[0].toDateString() ||
      date.toDateString() === dateRange[1].toDateString()
    );
  };

  const Day = (props: any) => {
    const date = new Date(props.date);
    const isSelected = isDateSelected(date);
    const isInRange = isDateInRange(date);
    const isDisabled = date > new Date();

    return (
      <div
        onClick={() => !isDisabled && handleDateSelect(date)}
        className={cn(
          "h-9 w-9 p-0 text-center text-sm flex items-center justify-center rounded-full",
          isSelected
            ? "bg-primary text-primary-foreground"
            : isInRange
            ? "bg-accent/50"
            : "hover:bg-accent/20",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {date.getDate()}
      </div>
    );
  };

  const handleDateRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return;
    
    if (range.from && range.to) {
      const startDate = range.from;
      const endDate = range.to;
      
      
      const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                       (endDate.getMonth() - startDate.getMonth());
      
      
      if (monthDiff > 5) {
        const maxEndDate = new Date(startDate);
        maxEndDate.setMonth(maxEndDate.getMonth() + 5);
        maxEndDate.setDate(maxEndDate.getDate() - 1); 
        onDateRangeChange([startDate, maxEndDate]);
      } else {
        
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        onDateRangeChange([startDate, endOfDay]);
      }
      
      onTimeWindowChange('custom');
    } else if (range.from) {
      
      onDateRangeChange([range.from, null]);
    }
  };

  return (
    <Card className="w-full max-w-md h-full overflow-y-auto bg-secondary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <span>Filters</span>
        </CardTitle>
        <CardDescription>
          {earthquakeCount} earthquakes found
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange[0] && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange[0] ? (
                  dateRange[1] ? (
                    <>
                      {format(dateRange[0], "MMM d, yyyy")} -{" "}
                      {format(dateRange[1], "MMM d, yyyy")}
                    </>
                  ) : (
                    format(dateRange[0], "MMM d, yyyy")
                  )
                ) : (
                  <span>Select a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4">
                <div className="text-sm font-medium mb-2">
                  {!dateRange[0] 
                    ? "Select start date" 
                    : !dateRange[1] 
                      ? "Select end date" 
                      : `${format(dateRange[0], 'MMM d, yyyy')} - ${format(dateRange[1], 'MMM d, yyyy')}`}
                </div>
                <Calendar
                  mode="range"
                  selected={{
                    from: dateRange[0] || undefined,
                    to: dateRange[1] || undefined,
                  }}
                  defaultMonth={dateRange[0] || new Date()}
                  onSelect={handleDateRangeSelect}
                  className="rounded-md border"
                  disabled={(date) => {
                    
                    const today = new Date();
                    const fiveMonthsAgo = new Date();
                    fiveMonthsAgo.setMonth(today.getMonth() - 5);
                    return date > today || date < fiveMonthsAgo;
                  }}
                />
                {(dateRange[0] || dateRange[1]) && (
                  <div className="flex justify-between mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onDateRangeChange([null, null]);
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (dateRange[0] && dateRange[1]) {
                          onTimeWindowChange('custom');
                          
                          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                        }
                      }}
                      disabled={!dateRange[0] || !dateRange[1]}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {}
        <div className="space-y-2">
          <Label>Time Window</Label>
          <Select
            value={timeWindow}
            onValueChange={(value) => {
              onTimeWindowChange(value);
              
              if (value !== 'custom') {
                onDateRangeChange([null, null]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select time window" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24 hours</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Minimum Magnitude</Label>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                {minMagnitude.toFixed(1)}
              </span>
              <Badge 
                variant="outline"
                style={{ 
                  borderColor: `hsl(var(--${getMagnitudeColor(minMagnitude)}))`,
                  color: `hsl(var(--${getMagnitudeColor(minMagnitude)}))`
                }}
              >
                {getMagnitudeDescription(minMagnitude)}
              </Badge>
            </div>
            
            <Slider
              value={[minMagnitude]}
              onValueChange={handleMagnitudeChange}
              max={8}
              min={0}
              step={0.1}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.0</span>
              <span>4.0</span>
              <span>8.0+</span>
            </div>

            <div className="pt-1">
              <Button type="button" variant="default" size="sm" className="w-full" onClick={() => onVisualize && onVisualize()}>
                <BarChart2 className="h-4 w-4 mr-1" /> Visualize Activity
              </Button>
            </div>
          </div>
        </div>

        {}
        <div className="space-y-4 pt-2 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground">Advanced</h4>
          {}
          {}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Show plate boundaries</Label>
            <Switch checked={!!showPlates} onCheckedChange={(v) => onShowPlatesChange && onShowPlatesChange(v)} />
          </div>
          {}
          <div className="space-y-2">
            <Label className="text-sm">Maximum earthquakes</Label>
            {}
            <input
              type="number"
              min={50}
              step={50}
              value={maxCount ?? 1000}
              onChange={(e) => onMaxCountChange && onMaxCountChange(parseInt(e.target.value || '0', 10))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {}
          <div className="space-y-2">
            <Label className="text-sm">Basemap</Label>
            <Select value={basemap ?? 'streets'} onValueChange={(v) => onBasemapChange && onBasemapChange(v as 'streets' | 'satellite')}>
              <SelectTrigger>
                <SelectValue placeholder="Select basemap" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="streets">Map</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Magnitude range</Label>
              {magRange && (
                <span className="text-xs text-muted-foreground">{magRange[0].toFixed(1)} - {magRange[1].toFixed(1)}</span>
              )}
            </div>
            <Slider
              value={magRange ?? [0, 10]}
              onValueChange={(v) => {
                if (onMagRangeChange && v.length === 2) onMagRangeChange([v[0], v[1]] as [number, number]);
                onMinMagnitudeChange(v[0]);
              }}
              max={10}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>

          {}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Depth range (km)</Label>
              {depthRange && (
                <span className="text-xs text-muted-foreground">{depthRange[0]} - {depthRange[1]}</span>
              )}
            </div>
            <Slider
              value={depthRange ?? [0, 800]}
              onValueChange={(v) => onDepthRangeChange && v.length === 2 && onDepthRangeChange([v[0], v[1]] as [number, number])}
              max={800}
              min={0}
              step={10}
              className="w-full"
            />
          </div>

          <button className="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-9 px-4 py-2 text-sm font-medium" onClick={() => onApply && onApply()}>
            Apply
          </button>
        </div>

        {}
        <div className="space-y-2 pt-2 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground">Magnitude Scale</h4>
          <div className="space-y-1">
            {[
              { range: '< 2.0', color: 'seismic-low', label: 'Minor' },
              { range: '2.0 - 3.9', color: 'seismic-medium', label: 'Light' },
              { range: '4.0 - 5.9', color: 'seismic-high', label: 'Moderate (Yellow)' },
              { range: '6.0+', color: 'seismic-extreme', label: 'Major to great (Red)' }
            ].map((item) => (
              <div key={item.range} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: `hsl(var(--${item.color}))` }}
                ></div>
                <span className="text-muted-foreground">{item.range}</span>
                <span className="text-foreground font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EarthquakeFilters;