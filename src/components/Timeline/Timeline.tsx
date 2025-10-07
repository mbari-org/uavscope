import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Calendar, Clock, Play, Pause } from 'lucide-react';

const Timeline: React.FC = () => {
  const { missions, updateFilterState, filterState } = useAppStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const timelineRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get date range from missions (memoized to prevent unnecessary re-renders)
  const dateRange = useMemo(() => {
    return missions.length > 0 ? {
      start: new Date(Math.min(...missions.map(m => new Date(m.start_datetime || 0).getTime()))),
      end: new Date(Math.max(...missions.map(m => new Date(m.end_datetime || 0).getTime())))
    } : {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      end: new Date()
    };
  }, [missions]);

  const handleTimeChange = (time: Date) => {
    setCurrentTime(time);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = new Date(prev.getTime() + 5 * 60 * 1000); // 5 minutes forward
          if (next > dateRange.end) {
            // Clear the interval when we reach the end
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setIsPlaying(false);
            return dateRange.start;
          }
          return next;
        });
      }, 1000); // Update every second for smooth animation
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Cleanup interval when isPlaying changes to false
  useEffect(() => {
    if (!isPlaying && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isPlaying]);

  // Sync current time with filter state's date range end when it changes from external sources
  useEffect(() => {
    if (filterState.dateRange?.end && !isPlaying) {
      setCurrentTime(filterState.dateRange.end);
    }
  }, [filterState.dateRange?.end, isPlaying]);

  // Update filter state when currentTime changes
  useEffect(() => {
    const currentFilterState = useAppStore.getState().filterState;
    const newDateRange = {
      start: dateRange.start, // Always start from the beginning of the timeline
      end: currentTime
    };
    
    // Only update if the date range has actually changed
    if (
      !currentFilterState.dateRange ||
      currentFilterState.dateRange.start.getTime() !== newDateRange.start.getTime() ||
      currentFilterState.dateRange.end.getTime() !== newDateRange.end.getTime()
    ) {
      updateFilterState({
        ...currentFilterState, // Preserve existing filters
        dateRange: newDateRange
      });
    }
  }, [currentTime, dateRange.start, updateFilterState]);

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimePosition = (time: Date) => {
    const totalDuration = dateRange.end.getTime() - dateRange.start.getTime();
    const currentDuration = time.getTime() - dateRange.start.getTime();
    return (currentDuration / totalDuration) * 100;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = new Date(dateRange.start.getTime() + percentage * (dateRange.end.getTime() - dateRange.start.getTime()));
    
    handleTimeChange(newTime);
  };

  return (
    <div className="h-full p-4 bg-white">
      <div className="h-full flex flex-col">
        {/* Timeline Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Timeline</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {formatTime(dateRange.start)} - {formatTime(dateRange.end)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePlayPause}
              className="btn btn-secondary flex items-center space-x-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
          </div>
        </div>
        
        {/* Timeline Slider */}
        <div className="flex-1 flex items-center">
          <div className="w-full">
            <div
              ref={timelineRef}
              className="relative h-8 bg-gray-200 rounded-lg cursor-pointer"
              onClick={handleTimelineClick}
            >
              {/* Mission markers */}
              {missions.map((mission) => {
                const missionStart = new Date(mission.start_datetime || 0);
                const missionEnd = new Date(mission.end_datetime || 0);
                const startPos = getTimePosition(missionStart);
                const endPos = getTimePosition(missionEnd);
                
                return (
                  <div
                    key={mission.mneumonic}
                    className="absolute h-full bg-primary-500 rounded"
                    style={{
                      left: `${startPos}%`,
                      width: `${endPos - startPos}%`,
                      opacity: 0.7
                    }}
                    title={`${mission.mneumonic}: ${formatTime(missionStart)} - ${formatTime(missionEnd)}`}
                  />
                );
              })}
              
              {/* Current time indicator */}
              <div
                className="absolute top-0 h-full w-1 bg-red-500 rounded-full z-10"
                style={{ left: `${getTimePosition(currentTime)}%` }}
              />
              
              {/* Time labels */}
              <div className="absolute -top-6 left-0 text-xs text-gray-500">
                {formatTime(dateRange.start)}
              </div>
              <div className="absolute -top-6 right-0 text-xs text-gray-500">
                {formatTime(dateRange.end)}
              </div>
              <div 
                className="absolute top-8 text-xs text-red-600 font-medium"
                style={{ left: `${getTimePosition(currentTime)}%`, transform: 'translateX(-50%)' }}
              >
                {formatTime(currentTime)}
              </div>
            </div>
            
            {/* Mission labels */}
            <div className="mt-2 flex justify-between">
              {missions.map((mission) => (
                <div key={mission.mneumonic} className="text-xs text-gray-600">
                  {mission.mneumonic}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Timeline Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Current:</span> {formatTime(currentTime)}
            </div>
            
            <div className="text-sm text-gray-600">
              <span className="font-medium">Range:</span> {Math.round((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60))} hours
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleTimeChange(dateRange.start)}
              className="btn btn-secondary text-xs"
            >
              Start
            </button>
            <button
              onClick={() => handleTimeChange(dateRange.end)}
              className="btn btn-secondary text-xs"
            >
              End
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
