import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Activity, Globe, TrendingUp, Clock, BarChart2 } from 'lucide-react';

interface EarthquakeHeaderProps {
  title?: string;
  subtitle?: string;
  totalCount?: number;
  lastUpdated?: Date;
  onVisualize?: () => void;
}

const EarthquakeHeader: React.FC<EarthquakeHeaderProps> = ({
  title = "Seismic Sight",
  subtitle = "Real-time earthquake monitoring and visualization",
  totalCount = 0,
  lastUpdated,
  onVisualize
}) => {
  
  return (
    <Card className="bg-primary text-primary-foreground border-none rounded-none">
      <CardContent className="p-2 sm:p-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white/20 rounded-md">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{title}</h1>
                <p className="text-primary-foreground/80 text-[11px] leading-4">{subtitle}</p>
              </div>
            </div>
          </div>
          
          <div className="text-right space-y-1">
            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={onVisualize} className="text-primary">
                <BarChart2 className="h-4 w-4 mr-1" />
                Visualize
              </Button>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <Globe className="h-3.5 w-3.5" />
              <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-white/30 text-xs h-5 px-1.5">
                {totalCount} Events
              </Badge>
            </div>
            
            {lastUpdated && (
              <div className="flex items-center gap-1 text-[10px] text-primary-foreground/70">
                <Clock className="h-2.5 w-2.5" />
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-1 pt-1 border-t border-white/20">
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-primary-foreground/80">
                Data from USGS Earthquake Hazards Program
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EarthquakeHeader;