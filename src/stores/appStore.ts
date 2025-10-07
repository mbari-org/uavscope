import { create } from 'zustand';
import { MapState, GalleryState, FilterState, Detection, Media, Mission, MapBounds } from '../types';
import { mockDataService, PROJECT_ID, BOX_TYPE } from '../services/dataService';

interface AppState {
  // Data
  detections: Detection[];
  media: Media[];
  missions: Mission[];
  
  // UI State
  mapState: MapState;
  galleryState: GalleryState;
  filterState: FilterState;
  
  // Actions
  setDetections: (detections: Detection[]) => void;
  setMedia: (media: Media[]) => void;
  setMissions: (missions: Mission[]) => void;
  
  updateMapState: (updates: Partial<MapState>) => void;
  updateGalleryState: (updates: Partial<GalleryState>) => void;
  updateFilterState: (updates: Partial<FilterState>) => void;
  toggleLayerVisibility: (layer: keyof MapState['layerVisibility']) => void;
  refreshDetectionsWithFilters: () => Promise<void>;
  
  // Computed getters
  filteredDetections: () => Detection[];
  selectedDetection: () => Detection | undefined;
  galleryVisibleDetections: () => Detection[];
  currentMapBounds: () => MapBounds | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial data
  detections: [],
  media: [],
  missions: [],
  
  // Initial UI state
  mapState: {
    center: [36.8, -121.9], // Monterey Bay, California
    zoom: 11,
    layerVisibility: {
      basemap: true,
      nauticalOverlay: true,
      flightPaths: true,
      mediaFootprints: true,
      detectionMarkers: true,
    },
  },
  
  galleryState: {
    viewMode: 'grid',
    sortBy: 'date',
    sortOrder: 'desc',
    currentPage: 1,
    itemsPerPage: 30,
  },
  
  filterState: {},
  
  // Actions
  setDetections: (detections) => set({ detections }),
  setMedia: (media) => set({ media }),
  setMissions: (missions) => set({ missions }),
  
  updateMapState: (updates) => 
    set((state) => ({ 
      mapState: { ...state.mapState, ...updates } 
    })),
    
  updateGalleryState: (updates) => 
    set((state) => ({ 
      galleryState: { ...state.galleryState, ...updates } 
    })),
    
  updateFilterState: (updates) => 
    set((state) => ({ 
      filterState: { ...state.filterState, ...updates } 
    })),
    
  toggleLayerVisibility: (layer) => 
    set((state) => ({
      mapState: {
        ...state.mapState,
        layerVisibility: {
          ...state.mapState.layerVisibility,
          [layer]: !state.mapState.layerVisibility[layer],
        },
      },
    })),
  
  refreshDetectionsWithFilters: async () => {
    const { filterState, mapState } = get();
    console.log('🔄 Store: refreshDetectionsWithFilters called with filters:', filterState);
    console.log('🗺️ Store: Current map bounds:', mapState.bounds);
    
    try {
      // Fetch fresh Detections from the data service
      const freshDetections = await mockDataService.fetchDetectionsWithMediaDates(PROJECT_ID, BOX_TYPE);
      console.log('📥 Store: Fresh Detections received:', freshDetections.length, 'items');
      
      // Apply current filters to the fresh data
      let filteredDetections = [...freshDetections];
      
      // Apply date range filter if present
      if (filterState.dateRange) {
        const { start, end } = filterState.dateRange;
        filteredDetections = filteredDetections.filter(detection => {
          const dateToUse = detection.media_attributes?.date || detection.created_datetime;
          console.log(` 📅 Store: Date to use: ${dateToUse} ${start.toISOString()} ${end.toISOString()}`);
          if (!dateToUse) return false;
          const detectionDate = detection.media_attributes?.date || new Date(detection.created_datetime!);
          return detectionDate >= start && detectionDate <= end;
        });
        console.log(`📅 Store: Date filter applied: ${freshDetections.length} → ${filteredDetections.length} Detections`);
      }
      
      // Apply map bounds filter if present
      if (mapState.bounds) {
        const { north, south, east, west } = mapState.bounds;
        const beforeCount = filteredDetections.length;
        filteredDetections = filteredDetections.filter(detection => {
          const latitude = detection.media_attributes?.latitude;
          const longitude = detection.media_attributes?.longitude;
          
          if (latitude === undefined || longitude === undefined) {
            return false;
          } 
          // Correct the sign of the longitude
          const correctedLongitude = -longitude;

          return latitude >= south && latitude <= north && 
          correctedLongitude >= west && correctedLongitude <= east;
        });
        console.log(`🗺️ Store: Map bounds filter applied: ${beforeCount} → ${filteredDetections.length} Detections`);
      }
      
      // Update the store with filtered data
      set({ detections: filteredDetections });
      console.log('✅ Store: Filtered Detections updated successfully');
      
      // Reset gallery to first page
      set((state) => ({
        galleryState: {
          ...state.galleryState,
          currentPage: 1
        }
      }));
      console.log('📄 Store: Gallery reset to first page');
      
    } catch (error) {
      console.error('❌ Store: Error refreshing Detections with filters:', error);
      throw error;
    }
  },
  
  // Computed getters
  filteredDetections: () => {
    const { detections, filterState } = get();
    console.log('🔍 Store: filteredDetections called with', detections.length, 'total Detections');
    console.log('🎯 Store: Current filter state:', filterState);
    
    let filtered = [...detections];
    console.log('📊 Store: Starting with', filtered.length, 'Detections');
    
    // Apply filters
    if (filterState.dateRange) {
      const { start, end } = filterState.dateRange;
      const beforeCount = filtered.length;
      filtered = filtered.filter(detection => {
        // Use media_date if available, fallback to created_datetime
        const dateToUse = detection.media_attributes?.date || detection.created_datetime;
        if (!dateToUse) return false;
        const detectionDate = detection.media_attributes?.date || new Date(detection.created_datetime!);
        return detectionDate >= start && detectionDate <= end;
      });
      console.log(`📅 Store: Date range filter applied: ${beforeCount} → ${filtered.length} Detections`);
    }
    
    if (filterState.labels && filterState.labels.length > 0) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(detection => 
        filterState.labels!.includes(detection.attributes?.Label)
      );
      console.log(`🏷️ Store: Labels filter applied: ${beforeCount} → ${filtered.length} Detections`);
    }
    
    if (filterState.verifiedOnly) {
      filtered = filtered.filter(detection => 
        detection.attributes?.verified === true
      );
    }
    
    return filtered;
  },
  
  selectedDetection: () => {
    const { detections, mapState } = get();
    return detections.find(detection => detection.id === mapState.selectedDetection);
  },
  
  galleryVisibleDetections: () => {
    const { detections, galleryState } = get();
    let visibleDetections = [...detections];
    
    // Helper function to categorize Detections by confidence level
    const getConfidenceLevel = (score: number | undefined): 'high' | 'medium' | 'low' => {
      if (!score) return 'low';
      if (score >= 0.8) return 'high';
      if (score >= 0.5) return 'medium';
      return 'low';
    };
    
    // Apply gallery confidence filter if selected
    if (galleryState.selectedConfidenceLevel) {
      visibleDetections = visibleDetections.filter(detection => {
        const detectionConfidenceLevel = getConfidenceLevel(detection.attributes?.score);
        return detectionConfidenceLevel === galleryState.selectedConfidenceLevel;
      });
    }
    
    return visibleDetections;
  },
  
  currentMapBounds: () => {
    const { mapState } = get();
    return mapState.bounds;
  },
}));