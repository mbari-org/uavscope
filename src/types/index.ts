export interface Detection {
  id: number; // primary key
  attributes?: Record<string, any>; // jsonb
  created_datetime?: string; // ISO timestamp with timezone
  modified_datetime?: string; // ISO timestamp with timezone
  media_attributes?: MediaAttributes; // populated from associated media
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  elemental_id?: string; // uuid
  media?: number; // FK to main_media.id
  modified_by?: number; // FK to main_user.id\
  version?: number; // FK to main_version.id
}

export interface Media {
  id: number; // primary key
  attributes?: Record<string, any>; // jsonb
  modified_datetime?: string; // ISO timestamp with timezone
  name: string; // varchar(256), not null
  width?: number;
  height?: number;
  media_files?: Record<string, any>; // jsonb
  source_url?: string; // varchar(2048)
  elemental_id?: string; // uuid
  modified_by?: number; // FK to main_user.id
  media_attributes?: MediaAttributes; // populated from attributes
}

export interface Mission {
  mneumonic: string; // primary key
  start_datetime?: string; // ISO timestamp 
  end_datetime?: string; // ISO timestamp 
}

// Extended interfaces for UI components
export interface DetectionAttributes {
  Label?: string;
  score?: number;
  delete?: boolean;
  cluster?: string;
  comment?: string;
  saliency?: number;
  verified?: boolean;
}

export interface MediaAttributes {
  date?: Date; // Date object
  make?: string; // Camera manufacturer
  model?: string; // Camera model
  FileType?: string; // File format (JPEG, RAW, etc.)
  altitude?: number; // Altitude in meters
  latitude?: number; // GPS latitude
  longitude?: number; // GPS longitude
}

export interface MediaFiles {
  image?: Array<{
    mime: string;
    path: string;
    size: number;
    resolution: [number, number];
  }>;
  thumbnail?: Array<{
    mime: string;
    path: string;
    size: number;
    resolution: [number, number];
  }>;
}

// Map-related types
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface FlightPath {
  mission: string;
  coordinates: [number, number][];
  color: string;
  startTime: string;
  endTime: string;
}

export interface ClusterInfo {
  clusterId: string;
  count: number;
  bounds: MapBounds;
  color: string;
}

// Filter types
export interface DateRange {
  start: Date;
  end: Date;
}


export interface FilterState {
  dateRange?: DateRange;
  missionId?: string;
  labels?: string[];
  mapBounds?: MapBounds;
  verifiedOnly?: boolean;
  visibleMediaDates?: string[];
}

// UI state types
export interface MapState {
  center: [number, number];
  zoom: number;
  bounds?: MapBounds;
  selectedDetection?: number;
  hoveredDetection?: number;
  layerVisibility: {
    basemap: boolean;
    nauticalOverlay: boolean;
    flightPaths: boolean;
    mediaFootprints: boolean;
    detectionMarkers: boolean;
  };
}

export interface GalleryState {
  selectedConfidenceLevel?: 'high' | 'medium' | 'low' | 'any';
  viewMode: 'grid' | 'list';
  sortBy: 'date' | 'confidence' | 'cluster';
  sortOrder: 'asc' | 'desc';
  currentPage: number;
  itemsPerPage: number;
}
