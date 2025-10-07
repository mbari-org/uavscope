import { QueryClient } from '@tanstack/react-query';
import { Detection, Media, Mission, MediaAttributes } from '../types';

// TATOR API Configuration
const TATOR_HOST = import.meta.env.VITE_TATOR_HOST || '';
const TATOR_TOKEN = import.meta.env.VITE_TATOR_TOKEN;
const BOX_TYPE = Number(import.meta.env.VITE_BOX_TYPE) || 3;
const PROJECT_ID = Number(import.meta.env.VITE_PROJECT_ID) || 4;
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 3000;
const MAX_RETRIES = Number(import.meta.env.VITE_MAX_RETRIES) || 3;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: MAX_RETRIES,
      refetchOnWindowFocus: false,
    },
  },
});

// TATOR API service
class TatorApiService {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = TATOR_HOST;
    this.token = TATOR_TOKEN || '';
  }

  private async makeImageRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    
    const defaultHeaders = {
      'Accept': 'image/*',
      'Authorization': `Token ${this.token}`
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: AbortSignal.timeout(API_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`TATOR API Error: ${response.status} ${response.statusText}`);
    }

    // For image requests, we need to return the blob URL
    const blob = await response.blob();
    return URL.createObjectURL(blob) as T;
  }


  private async makeImageRequestPerm<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/rest/${endpoint}`;
    
    const defaultHeaders = {
      'Accept': '*/*',
      'Authorization': `Token ${this.token}`
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: AbortSignal.timeout(API_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`TATOR API Error: ${response.status} ${response.statusText}`);
    }
    
    console.log('===>Permalink response:', response);
    console.log('===>Response URL:', response.url);
    
    // The permalink request returns the actual image, so we return the final URL
    return { link: response.url } as T;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/rest${endpoint}`;
    
    const defaultHeaders = {
      'Accept': 'application/json',
      'Authorization': `Token ${this.token}`
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: AbortSignal.timeout(API_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`TATOR API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }


  async fetchDetectionsWithMediaDates(projectId: number = PROJECT_ID, boxType: number = BOX_TYPE): Promise<Detection[]> {
    console.log('🚀 DataService: fetchDetectionsWithMediaDates called with projectId:', projectId, 'boxType:', boxType);
    
    try {
      console.log('📡 DataService: Fetching Detections and Media data in parallel...');
      // Fetch both Detections and Media in parallel
      const [detectionData, mediaData] = await Promise.all([
        this.makeRequest<any[]>(`/Localizations/${projectId}?type=${boxType}&merge=1&show_deleted=0&show_all_marks=0`),
        this.makeRequest<any[]>(`/Medias/${projectId}?`)
      ]);

      console.log('📥 DataService: Raw Detection data received:', detectionData?.length || 0, 'items');
      console.log('📥 DataService: Raw Media data received:', mediaData?.length || 0, 'items');
      console.log('🔍 DataService: Sample Detection data:', detectionData?.slice(0, 2));
      console.log('🔍 DataService: Sample Media data:', mediaData?.slice(0, 2));

      // Create a map of media ID to media object for quick lookup
      console.log('🗺️ DataService: Creating media map...');
      const mediaMap = new Map<number, Media>();
      mediaData.forEach(item => {
        const media: Media = {
          id: item.id,
          attributes: item.attributes || {},
          modified_datetime: item.modified_datetime,
          name: item.name,
          width: item.width,
          height: item.height,
          media_files: item.media_files || {},
          source_url: item.source_url,
          elemental_id: item.elemental_id,
          modified_by: item.modified_by,
        };
        // Populate media_attributes using the utility function
        media.media_attributes = extractMediaAttributes(media);
        mediaMap.set(item.id, media);
      });
      console.log('✅ DataService: Media map created with', mediaMap.size, 'entries');

      // Map Detections and populate media_attributes from associated media
      console.log('🔄 DataService: Mapping Detections with media attributes...');
      const mappedDetections = detectionData.map(item => {
        let mediaAttributes: MediaAttributes | undefined;
        
        // If this Detection has an associated media, get its media_attributes
        if (item.media && mediaMap.has(item.media)) {
          const associatedMedia = mediaMap.get(item.media)!;
          mediaAttributes = associatedMedia.media_attributes;
        }

        return {
          id: item.id,
          attributes: item.attributes || {},
          created_datetime: item.created_datetime,
          modified_datetime: item.modified_datetime,
          media_attributes: mediaAttributes,
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          elemental_id: item.elemental_id,
          media: item.media,
          modified_by: item.modified_by,
          version: item.version,
        };
      });
      
      console.log('✅ DataService: Successfully mapped', mappedDetections.length, 'Detections');
      console.log('📋 DataService: Sample mapped Detection:', mappedDetections.slice(0, 1));
      return mappedDetections;
    } catch (error) {
      console.error('❌ DataService: Error fetching Detections with media dates from TATOR:', error);
      console.log('🔄 DataService: Falling back to mock data...');
      const mockData = this.getMockDetectionsWithMediaDates();
      console.log('📦 DataService: Mock data returned:', mockData.length, 'items');
      return mockData;
    }
  }

  async fetchMediaGraphic(path: string): Promise<string> {
    try {
      const data = await this.makeImageRequest<string>(path);
      return data;
    } catch (error) {
      console.error('Error fetching Media Graphic from TATOR:', error);
      return `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="150" fill="#f3f4f6"/>
          <text x="100" y="75" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="14">
            Media ${path}
          </text>
          <text x="100" y="95" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="10">
            Image not available
          </text>
        </svg>
      `)}`;
    }
  }

  async fetchDetectionGraphic(localizationId: number): Promise<string> {
    try {
      console.log('LocalizationId:', localizationId);
      const data = await this.makeImageRequest<string>(`rest/LocalizationGraphic/${localizationId}?`);
      return data;
    } catch (error) {
      console.error('Error fetching Localization Graphic from TATOR:', error);
      // Return a placeholder data URL instead of empty string
      return `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="150" fill="#f3f4f6"/>
          <text x="100" y="75" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="14">
            Detection ${localizationId}
          </text>
          <text x="100" y="95" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="10">
            Image not available
          </text>
        </svg>
      `)}`;
    }
  }

  async fetchMedia(projectId: number = PROJECT_ID): Promise<Media[]> {
    try {
      const data = await this.makeRequest<any[]>(`/Medias/${projectId}?`);
      // print JSON formatted attributes
      console.log('Media Attributes:', JSON.stringify(data[0].attributes, null, 2));
      return data.map(item => {
        const media: Media = {
          id: item.id,
          attributes: item.attributes || {},
          modified_datetime: item.modified_datetime,
          name: item.name,
          width: item.width,
          height: item.height,
          media_files: item.media_files || {},
          source_url: item.source_url,
          elemental_id: item.elemental_id,
          modified_by: item.modified_by,
        };
        // Populate media_attributes using the utility function
        media.media_attributes = extractMediaAttributes(media);
        return media;
      });
    } catch (error) {
      console.error('Error fetching Media from TATOR:', error);
      // Fallback to mock data if API fails
      return this.getMockMedia();
    }
  }

  async fetchMediaById(mediaId: number): Promise<Media> {
    try {
      const data = await this.makeRequest<any>(`/Media/${mediaId}`);
      console.log('Media by ID:', data);
      const media: Media = {
        id: data.id,
        attributes: data.attributes || {},
        modified_datetime: data.modified_datetime,
        name: data.name,
        width: data.width,
        height: data.height,
        media_files: data.media_files || {},
        source_url: data.source_url,
        elemental_id: data.elemental_id,
        modified_by: data.modified_by,
      };
      // Populate media_attributes using the utility function
      media.media_attributes = extractMediaAttributes(media);
      return media;
    } catch (error) {
      console.error('Error fetching Media by ID from TATOR:', error);
      // Fallback to mock data if API fails
      return this.getMockMediaById(mediaId);
    }
  }

  async fetchMediaByIdPerma(mediaId: number): Promise<{ link: string }> {
    try {
      const data = await this.makeImageRequestPerm<{ link: string }>(`Permalink/${mediaId}?element=image&quality=720`);
      console.log('===>Media permalink:', data);
      return data;
    } catch (error) {
      console.error('Error fetching Media permalink from TATOR:', error);
      // Fallback to mock data if API fails
      return this.getMockMediaPermalink(mediaId);
    }
  }

  async fetchMissions(): Promise<Mission[]> {
    try {
      // Read missions from local JSON file
      const response = await fetch('/missions.json');
      if (!response.ok) {
        throw new Error(`Failed to load missions.json: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Missions from JSON:', data);
      
      return data.map((item: any) => ({
        mneumonic: item.mneumonic || item.name || item.id.toString(),
        start_datetime: item.start_datetime || item.start_date,
        end_datetime: item.end_datetime || item.end_date,
      }));
    } catch (error) {
      console.error('Error fetching Missions from JSON file:', error);
      // Fallback to mock data if JSON file fails
      return this.getMockMissions();
    }
  }

  // Mock data fallbacks
  private getMockDetections(): Detection[] {
    return [
      {
        id: 1,
        attributes: {
          Label: "Bird",
          score: 0.7553,
          delete: false,
          cluster: "Unknown C-1",
          comment: "",
          saliency: -1,
          verified: false
        },
        created_datetime: "2024-01-15T10:30:00Z",
        modified_datetime: "2024-01-15T10:30:00Z",
        x: 100,
        y: 150,
        width: 200,
        height: 300,
        elemental_id: "uuid-1",
        media: 1,
        modified_by: 1,
        version: 1
      },
      {
        id: 2,
        attributes: {
          Label: "Kelp",
          score: 0.9234,
          delete: false,
          cluster: "Unknown C-2",
          comment: "Large kelp bed",
          saliency: 0.8,
          verified: true
        },
        created_datetime: "2024-01-15T11:45:00Z",
        modified_datetime: "2024-01-15T11:45:00Z",
        x: 300,
        y: 200,
        width: 400,
        height: 250,
        elemental_id: "uuid-2",
        media: 2,
        modified_by: 1,
        version: 1
      },
      {
        id: 3,
        attributes: {
          Label: "Whale",
          score: 1.0,
          delete: false,
          cluster: "Unknown C-1",
          comment: "Humpback whale",
          saliency: 0.9,
          verified: true
        },
        created_datetime: "2024-01-15T12:15:00Z",
        modified_datetime: "2024-01-15T12:15:00Z",
        x: 150,
        y: 100,
        width: 300,
        height: 400,
        elemental_id: "uuid-3",
        media: 3,
        modified_by: 2,
        version: 1
      }
    ];
  }

  private getMockMedia(): Media[] {
    const mockMediaData = [
      {
        id: 1,
        attributes: {
          "date": "2025-06-11T00:46:38+00:00",
          "make": "SONY",
          "model": "DSC-RX1RM2",
          "FileType": "JPEG",
          "altitude": 58.6133999167707,
          "latitude": 36.96728886599935,
          "longitude": 121.90745440500415,
        },
        modified_datetime: "2024-01-15T10:30:00Z",
        name: "trinity-2_20250404T173830_Seymour_DSC02050.JPG",
        width: 5304,
        height: 7952,
        media_files: {
          image: [{
            mime: "image/mpo",
            path: "https://mbari-uav-data.svx.axds.co/trinity-2_20250404T173830_Seymour/SONY_DSC-RX1RM2/trinity-2_20250404T173830_Seymour_DSC02050.JPG",
            size: 9575443,
            resolution: [5304, 7952]
          }],
          thumbnail: [{
            mime: "image/None",
            path: "7/4/444447/thumb.jpg",
            size: 2450,
            resolution: [171, 256]
          }]
        },
        source_url: "https://mbari-uav-data.svx.axds.co/trinity-2_20250404T173830_Seymour/SONY_DSC-RX1RM2/trinity-2_20250404T173830_Seymour_DSC02050.JPG",
        elemental_id: "media-uuid-1",
        modified_by: 1
      }
    ];

    // Populate media_attributes for each mock media item
    return mockMediaData.map(item => {
      const media: Media = {
        id: item.id,
        attributes: item.attributes,
        modified_datetime: item.modified_datetime,
        name: item.name,
        width: item.width,
        height: item.height,
        media_files: item.media_files,
        source_url: item.source_url,
        elemental_id: item.elemental_id,
        modified_by: item.modified_by,
      };
      // Populate media_attributes using the utility function
      media.media_attributes = extractMediaAttributes(media);
      return media;
    });
  }

  private getMockMediaById(mediaId: number): Media {
    const media: Media = {
      id: mediaId,
      attributes: {
        "date": "2025-06-18T16:54:42+00:00",
        "make": "SONY",
        "model": "DSC-RX1RM2",
        "FileType": "JPEG",
        "altitude": 67.5924,
        "latitude": 36.9467414919991,
        "longitude": 122.0672223969985,
        "tator_user_sections": "e7e1ef20-9bf2-11f0-911f-45b3095cc69a"
      },
      modified_datetime: "2025-09-27T22:41:01.136Z",
      name: `trinity-2_20250618T165438_Seymour_DSC02478.JPG`,
      width: 7952,
      height: 5304,
      media_files: {
        image: [{
          mime: "image/png",
          path: `1/4/${mediaId}/image.png`,
          size: 43089680,
          resolution: [5304, 7952]
        }],
        thumbnail: [{
          mime: "image/None",
          path: `1/4/${mediaId}/thumb.jpg`,
          size: 5392,
          resolution: [171, 256]
        }]
      },
      source_url: `https://mbari-uav-data.svx.axds.co/media/${mediaId}`,
      elemental_id: "53f351b4-79b4-4b8e-a04a-1ef524bc521f",
      modified_by: 1
    };
    // Populate media_attributes using the utility function
    media.media_attributes = extractMediaAttributes(media);
    return media;
  }

  private getMockMediaPermalink(mediaId: number): { link: string } {
    return {
      link: `https://mbari-uav-data.svx.axds.co/media/${mediaId}/permalink`
    };
  }

  private getMockMissions(): Mission[] {
    return [
      {
        mneumonic: "TRINITY-2-20250404",
        start_datetime: "2024-01-15T08:00:00Z",
        end_datetime: "2024-01-15T16:00:00Z"
      },
      {
        mneumonic: "TRINITY-2-20250405",
        start_datetime: "2024-01-16T08:00:00Z",
        end_datetime: "2024-01-16T16:00:00Z"
      }
    ];
  }

  private getMockDetectionsWithMediaDates(): Detection[] {
    console.log('🎭 DataService: Generating mock Detections with media dates...');
    
    // Get the mock Detections and Media
    const mockDetections = this.getMockDetections();
    const mockMedia = this.getMockMedia();
    
    console.log('📊 DataService: Mock Detections count:', mockDetections.length);
    console.log('📊 DataService: Mock Media count:', mockMedia.length);
    
    // Create a map of media ID to media object for quick lookup
    const mediaMap = new Map<number, Media>();
    mockMedia.forEach(media => {
      // Ensure media_attributes is populated
      if (!media.media_attributes) {
        media.media_attributes = extractMediaAttributes(media);
      }
      mediaMap.set(media.id, media);
    });
    console.log('🗺️ DataService: Mock media map created with', mediaMap.size, 'entries');

    // Map Detections and populate media_attributes from associated media
    const mockDetectionsWithAttributes = mockDetections.map(detection => {
      let mediaAttributes: MediaAttributes | undefined;
      
      // If this Detection has an associated media, get its media_attributes
      if (detection.media && mediaMap.has(detection.media)) {
        const associatedMedia = mediaMap.get(detection.media)!;
        mediaAttributes = associatedMedia.media_attributes;
      }

      return {
        ...detection,
        media_attributes: mediaAttributes
      };
    });
    
    console.log('✅ DataService: Mock Detections with media attributes generated:', mockDetectionsWithAttributes.length, 'items');
    return mockDetectionsWithAttributes;
  }
}

// Create and export the TATOR API service instance
export const tatorApiService = new TatorApiService();

// Export the service methods for backward compatibility
export const mockDataService = {
  fetchDetectionsWithMediaDates: (projectId: number, boxType: number) => tatorApiService.fetchDetectionsWithMediaDates(projectId, boxType),
  fetchMedia: (projectId?: number) => tatorApiService.fetchMedia(projectId),
  fetchMediaById: (mediaId: number) => tatorApiService.fetchMediaById(mediaId),
  fetchMediaByIdPerma: (mediaId: number) => tatorApiService.fetchMediaByIdPerma(mediaId),
  fetchDetectionGraphic: (localizationId: number) => tatorApiService.fetchDetectionGraphic(localizationId),
  fetchMissions: () => tatorApiService.fetchMissions(),
  fetchMediaGraphic: (path: string) => tatorApiService.fetchMediaGraphic(path),
};
 
// Utility function to extract MediaAttributes object from Media
export const extractMediaAttributes = (media: Media): MediaAttributes => {
  if (!media.attributes) {
    return {};
  }

  const attributes: MediaAttributes = {};

  // Extract date
  if (media.attributes.date) {
    attributes.date = new Date(media.attributes.date as string);
  }

  // Extract make
  if (media.attributes.make) {
    attributes.make = media.attributes.make as string;
  }

  // Extract model
  if (media.attributes.model) {
    attributes.model = media.attributes.model as string;
  }

  // Extract FileType
  if (media.attributes.FileType) {
    attributes.FileType = media.attributes.FileType as string;
  }

  // Extract altitude
  if (media.attributes.altitude !== undefined && media.attributes.altitude !== null) {
    const altitude = Number(media.attributes.altitude);
    if (!isNaN(altitude)) {
      attributes.altitude = altitude;
    }
  }

  // Extract latitude
  if (media.attributes.latitude !== undefined && media.attributes.latitude !== null) {
    const latitude = Number(media.attributes.latitude);
    if (!isNaN(latitude)) {
      attributes.latitude = latitude;
    }
  }

  // Extract longitude
  if (media.attributes.longitude !== undefined && media.attributes.longitude !== null) {
    const longitude = Number(media.attributes.longitude);
    if (!isNaN(longitude)) {
      attributes.longitude = longitude;
    }
  }

  return attributes;
};

// Export constants for use in components
export { PROJECT_ID, BOX_TYPE };
