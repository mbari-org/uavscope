import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mockDataService, PROJECT_ID, BOX_TYPE } from '../../services/dataService';
import { useAppStore } from '../../stores/appStore';
import MapView from '../Map/MapView';
import Gallery from '../Gallery/Gallery';
import Timeline from '../Timeline/Timeline';
import Filters from '../Filters/Filters';
import Header from '../Header/Header';

const Layout: React.FC = () => {
  const { setDetections, setMedia, setMissions } = useAppStore();

  // Fetch data on component mount
  const { data: detections, isLoading: detectionsLoading } = useQuery({
    queryKey: ['detections'],
    queryFn: () => mockDataService.fetchDetectionsWithMediaDates(PROJECT_ID, BOX_TYPE),
  });

  const { data: media, isLoading: mediaLoading } = useQuery({
    queryKey: ['media'],
    queryFn: () => mockDataService.fetchMedia(PROJECT_ID),
  });

  const { data: missions, isLoading: missionsLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: mockDataService.fetchMissions,
  });

  // Update store when data is loaded
  useEffect(() => {
    if (detections) setDetections(detections);
  }, [detections, setDetections]);

  useEffect(() => {
    if (media) setMedia(media);
  }, [media, setMedia]);

  useEffect(() => {
    if (missions) setMissions(missions);
  }, [missions, setMissions]);

  const isLoading = detectionsLoading || mediaLoading || missionsLoading;

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Map */}
        <div className="flex-1 relative">
          <MapView />
        </div>
        
        {/* Right Pane - Gallery */}
        <div className="w-[28rem] border-l border-gray-200 bg-white flex flex-col">
          <Gallery />
        </div>
      </div>
      
      {/* Bottom Timeline */}
      <div className="h-32 border-t border-gray-200 bg-white">
        <Timeline />
      </div>
      
      {/* Filters Sidebar */}
      <Filters />
    </div>
  );
};

export default Layout;
