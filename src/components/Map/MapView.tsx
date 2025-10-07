import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '../../stores/appStore';
import { Detection, FlightPath, MediaAttributes } from '../../types';
import { mockDataService } from '../../services/dataService';
import FlightPathLayer from './FlightPathLayer';
import MediaFootprintLayer from './MediaFootprintLayer';
import LayerControl from './LayerControl';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Detection marker icon
const createDetectionIcon = (cluster: string, verified: boolean, isHighlighted: boolean = false) => {
  const colors = {
    'Unknown C-1': '#3B82F6',
    'Unknown C-2': '#10B981',
    'Unknown C-3': '#F59E0B',
    'Unknown C-4': '#EF4444',
    'Unknown C-5': '#8B5CF6',
  };
  
  const color = colors[cluster as keyof typeof colors] || '#6B7280';
  const iconSize = verified ? [20, 20] : [16, 16];
  
  // Enhanced styling for highlighted Detections
  const borderColor = isHighlighted ? '#FFD700' : 'white';
  const borderWidth = isHighlighted ? '3px' : '2px';
  const boxShadow = isHighlighted 
    ? '0 0 0 3px rgba(255, 215, 0, 0.3), 0 4px 8px rgba(0,0,0,0.4)' 
    : '0 2px 4px rgba(0,0,0,0.3)';
  const scale = isHighlighted ? '1.2' : '1';
  
  return L.divIcon({
    className: `custom-detection-marker ${isHighlighted ? 'highlighted' : ''}`,
    html: `
      <div style="
        background-color: ${color};
        width: ${iconSize[0]}px;
        height: ${iconSize[1]}px;
        border-radius: 50%;
        border: ${borderWidth} solid ${borderColor};
        box-shadow: ${boxShadow};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
        transform: scale(${scale});
        transition: all 0.2s ease-in-out;
      ">
        ${verified ? '✓' : '?'}
      </div>
    `,
    iconSize: iconSize as [number, number],
    iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
  });
};

// Map controller component
const MapController: React.FC = () => {
  const map = useMap();
  const { mapState, updateMapState } = useAppStore();
  const isUpdatingFromStore = React.useRef(false);

  // Update map view when store state changes (but not from map events)
  useEffect(() => {
    if (mapState.center && mapState.zoom && !isUpdatingFromStore.current) {
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();
      
      // Only update if there's a meaningful difference
      const centerDiff = Math.abs(currentCenter.lat - mapState.center[0]) + 
                        Math.abs(currentCenter.lng - mapState.center[1]);
      const zoomDiff = Math.abs(currentZoom - mapState.zoom);
      
      if (centerDiff > 0.0001 || zoomDiff > 0.1) {
        isUpdatingFromStore.current = true;
        map.setView(mapState.center, mapState.zoom);
        // Reset flag after a short delay
        setTimeout(() => {
          isUpdatingFromStore.current = false;
        }, 100);
      }
    }
  }, [map, mapState.center, mapState.zoom]);

  // Initialize map bounds on first load
  useEffect(() => {
    if (!mapState.bounds) {
      const bounds = map.getBounds();
      const mapBounds = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      };
      
      updateMapState({ bounds: mapBounds });
      console.log('🗺️ MapController: Initial map extents saved to store:', mapBounds);
    }
  }, [map, mapState.bounds, updateMapState]);

  // Update store when map view changes (but not from store updates)
  useEffect(() => {
    const handleMoveEnd = () => {
      if (isUpdatingFromStore.current) return;
      
      const center = map.getCenter();
      const zoom = map.getZoom();
      const bounds = map.getBounds();
      
      // Ensure zoom is within reasonable bounds
      const clampedZoom = Math.max(1, Math.min(20, zoom));
      
      // Create map bounds object
      const mapBounds = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      };
      
      updateMapState({
        center: [center.lat, center.lng],
        zoom: clampedZoom,
        bounds: mapBounds,
      });
      
      console.log('🗺️ MapController: Map extents saved to store:', mapBounds);
    };

    const handleZoomEnd = () => {
      if (isUpdatingFromStore.current) return;
      
      const center = map.getCenter();
      const zoom = map.getZoom();
      const bounds = map.getBounds();
      
      // Ensure zoom is within reasonable bounds
      const clampedZoom = Math.max(1, Math.min(18, zoom));
      
      // Create map bounds object
      const mapBounds = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      };
      
      updateMapState({
        center: [center.lat, center.lng],
        zoom: clampedZoom,
        bounds: mapBounds,
      });
      
      console.log('🗺️ MapController: Map extents saved to store (zoom):', mapBounds);
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, updateMapState]);

  return null;
};

// Custom hook to fetch Detection graphic data for map markers
const useDetectionGraphic = (detectionId: number) => {
  return useQuery({
    queryKey: ['detectionGraphic', detectionId],
    queryFn: () => mockDataService.fetchDetectionGraphic(detectionId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!detectionId && detectionId > 0, // Only run query if detectionId is valid
    retry: false, // Don't retry on failure to prevent infinite loops
  });
};

// Detection Marker component
const DetectionMarker: React.FC<{ detection: Detection; isHighlighted?: boolean }> = ({ detection, isHighlighted = false }) => {
  const { updateMapState, media } = useAppStore();
  const { data: detectionGraphic, isLoading, error } = useDetectionGraphic(detection.id);
  
  // Guard clause to prevent rendering if Detection data is invalid
  if (!detection || !detection.id) {
    return null;
  }

  // Handle query errors gracefully
  if (error) {
    console.warn(`Failed to load Detection graphic for Detection ${detection.id}:`, error);
  }
  
  // Helper function to find Media by ID
  const findMediaById = (mediaId: number) => {
    console.log('looking up media by id', mediaId);
    const m = media.find(m => m.id === mediaId);
    console.log('media', m);
    return media.find(m => m.id === mediaId);
  };
  
  // Extract coordinates from Media attributes using detection.media ID
  const mediaItem = detection.media ? findMediaById(detection.media) : null;
  const mediaAttributes = mediaItem?.attributes as MediaAttributes | undefined;
  const latitude = mediaAttributes?.latitude;
  const longitude = mediaAttributes?.longitude ? 
    (mediaAttributes.longitude < 0 ? mediaAttributes.longitude : mediaAttributes.longitude * -1) : 
    undefined;
  
  // Validate coordinates - if invalid, use fallback coordinates within Monterey Bay
  const isValidCoordinate = (lat: any, lng: any) => {
    return typeof lat === 'number' && typeof lng === 'number' && 
           !isNaN(lat) && !isNaN(lng);
  };
  
  const coords: [number, number] = isValidCoordinate(latitude, longitude) 
    ? [latitude!, longitude!]
    : [36.8, -121.9]; // Fallback to center of Monterey Bay

  const handleClick = () => {
    console.log('Detection clicked:', detection.id, detection.attributes?.Label);
    updateMapState({ selectedDetection: detection.id });
  };

  const handleMouseOver = () => {
    console.log('Detection hovered:', detection.id, detection.attributes?.Label);
    updateMapState({ hoveredDetection: detection.id });
  };

  const handleMouseOut = () => {
    console.log('Detection mouse out:', detection.id, detection.attributes?.Label);
    updateMapState({ hoveredDetection: undefined });
  };

  // const isSelected = mapState.selectedDetection === detection.id;
  // const isHovered = mapState.hoveredDetection === detection.id;

  const icon = createDetectionIcon(
    detection.attributes?.cluster || 'Unknown',
    detection.attributes?.verified || false,
    isHighlighted
  );

  return (
    <Marker
      position={coords}
      icon={icon}
      eventHandlers={{
        click: handleClick,
        mouseover: handleMouseOver,
        mouseout: handleMouseOut,
      }}
    >
      <Popup>
        <div className="p-2 min-w-48">
          <div className="flex items-center space-x-2 mb-2">
            {isLoading ? (
              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <img
                src={detectionGraphic || `https://via.placeholder.com/64x64?text=Detection+${detection.id}`}
                alt={detection.attributes?.Label || 'Detection'}
                className="w-16 h-16 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = `https://via.placeholder.com/64x64?text=Detection+${detection.id}`;
                }}
              />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">
                {detection.attributes?.Label || 'Unknown'}
              </h3>
              <p className="text-sm text-gray-600">
                Cluster: {detection.attributes?.cluster || 'Unknown'}
              </p>
              <p className="text-sm text-gray-600">
                Score: {(detection.attributes?.score || 0).toFixed(3)}
              </p>
            </div>
          </div>
          
          {detection.attributes?.comment && (
            <p className="text-sm text-gray-700 mb-2">
              {detection.attributes.comment}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {(detection.media_attributes?.date || detection.created_datetime) ? 
                (detection.media_attributes?.date || new Date(detection.created_datetime!)).toLocaleString() : 
                'No date'
              }
            </span>
            <span className={`px-2 py-1 rounded ${
              detection.attributes?.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {detection.attributes?.verified ? 'Verified' : 'Unverified'}
            </span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

const MapView: React.FC = () => {
  const { mapState, filteredDetections, galleryVisibleDetections, media, currentMapBounds } = useAppStore();
  const detections = filteredDetections();
  const visibleDetections = galleryVisibleDetections();
  const mapBounds = currentMapBounds();
  
  // Generate mock flight paths
  const flightPaths: FlightPath[] = [
    {
      mission: 'TRINITY-2-20250404',
      coordinates: [
        [36.7783, -119.4179],
        [36.7850, -119.4100],
        [36.7900, -119.4000],
        [36.7950, -119.3900],
        [36.8000, -119.3800],
      ],
      color: '#3B82F6',
      startTime: '2024-01-15T08:00:00Z',
      endTime: '2024-01-15T12:00:00Z',
    },
    {
      mission: 'TRINITY-2-20250405',
      coordinates: [
        [36.8000, -119.3800],
        [36.8100, -119.3700],
        [36.8200, -119.3600],
        [36.8300, -119.3500],
        [36.8400, -119.3400],
      ],
      color: '#10B981',
      startTime: '2024-01-16T08:00:00Z',
      endTime: '2024-01-16T12:00:00Z',
    },
  ];

  return (
    <div className="h-full w-full">
      <MapContainer
        center={mapState.center}
        zoom={mapState.zoom}
        style={{ height: '100%', width: '100%' }}
        preferCanvas={true}
        zoomControl={true}
        attributionControl={true}
        minZoom={1}
        maxZoom={20}
        maxBounds={[[36.4, -122.4], [37.2, -121.4]]}
        maxBoundsViscosity={1.0}
      >
        <MapController />
        
        {/* Basemap - OpenStreetMap */}
        {mapState.layerVisibility.basemap && (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            subdomains={['a', 'b', 'c']}
            maxZoom={20}
            errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
          />
        )}
        
        {/* Nautical Overlay */}
        {mapState.layerVisibility.nauticalOverlay && (
          <TileLayer
            url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openseamap.org">OpenSeaMap</a> contributors'
            opacity={0.7}
            maxZoom={20}
          />
        )}
        
        {/* Flight Paths */}
        {mapState.layerVisibility.flightPaths && (
          <FlightPathLayer flightPaths={flightPaths} />
        )}
        
        {/* Media Footprints */}
        {mapState.layerVisibility.mediaFootprints && (
          <MediaFootprintLayer media={media} />
        )}
        
        {/* Detection Markers */}
        {mapState.layerVisibility.detectionMarkers && detections && detections.length > 0 && detections.map((detection) => {
          const isHighlighted = visibleDetections.some(visibleDetection => visibleDetection.id === detection.id);
          return (
            <DetectionMarker key={detection.id} detection={detection} isHighlighted={isHighlighted} />
          );
        })}
      </MapContainer>
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <LayerControl />
        
        {/* Layer Count Summary */}
        <div className="bg-white rounded-lg shadow-lg p-2 space-y-2">
          <div className="text-xs text-gray-600 px-2">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Flight Paths ({flightPaths.length})</span>
            </div>
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-3 h-3 bg-blue-300 rounded"></div>
              <span>Media Footprints ({media.length})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span>Detection Markers ({detections.length})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-yellow-300"></div>
              <span>Gallery Visible ({visibleDetections.length})</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug: Current Map Extents */}
      {mapBounds && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg text-xs font-mono">
          <div className="font-semibold mb-1">Map Extents:</div>
          <div>North: {mapBounds.north.toFixed(4)}</div>
          <div>South: {mapBounds.south.toFixed(4)}</div>
          <div>East: {mapBounds.east.toFixed(4)}</div>
          <div>West: {mapBounds.west.toFixed(4)}</div>
        </div>
      )}
    </div>
  );
};

export default MapView;
