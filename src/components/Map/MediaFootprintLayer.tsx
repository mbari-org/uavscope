import React from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import { Media, MediaAttributes } from '../../types';
import { tatorApiService } from '../../services/dataService';

interface MediaFootprintLayerProps {
  media: Media[];
}



const MediaFootprintLayer: React.FC<MediaFootprintLayerProps> = ({ media }) => {
  // Function to handle media click - fetch image blob and open in new tab with metadata overlay
  const handleMediaClick = async (mediaItem: Media) => {
    try {
      const { link } = await tatorApiService.fetchMediaByIdPerma(mediaItem.id);
      const mediaAttributes = mediaItem.attributes as MediaAttributes | undefined;
      const win = window.open('', mediaItem.name.replace(/\.[^/.]+$/, ''));
      win?.document.write(`
        <html>
          <head>
            <title>${mediaItem.name.replace(/\.[^/.]+$/, '')}</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                background: #000;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                cursor: pointer;
              }
              img {
                max-width: 100%;
                max-height: 100vh;
                object-fit: contain;
              }
              .metadata-overlay {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 8px;
                font-family: Arial, sans-serif;
                max-width: 300px;
                z-index: 1000;
                font-size: 14px;
                cursor: default;
              }
            </style>
            <script>
              const mediaName = '${mediaItem.name}';
               
              function downloadImage() {
                const img = document.querySelector('img');
                const mediaName = '${mediaItem.name}';
                fetch(img.src)
                  .then(response => response.blob())
                  .then(blob => {
                    const blobUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = mediaName; // ✅ preserve original filename
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(blobUrl);
                  })
                  .catch(err => {
                    console.error('Download failed:', err);
                    alert('Failed to download image.');
                  });
              }

            </script>
          </head>
          <body>
            <img src="${link}" alt="${mediaItem.name}" />
            <div class="metadata-overlay">
              <h3 style="margin: 0 0 15px 0; color: #3B82F6; font-size: 16px;">${mediaItem.name}</h3>
              <div style="margin-bottom: 10px;">
                <strong>Resolution:</strong> ${mediaItem.width || 'Unknown'} × ${mediaItem.height || 'Unknown'}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>File Size:</strong> ${
                  mediaItem.media_files?.image?.[0]?.size
                    ? `${Math.round(mediaItem.media_files.image[0].size / 1024 / 1024)} MB`
                    : 'Unknown'
                }
              </div>
              ${
                mediaAttributes?.date
                  ? `<div style="margin-bottom: 10px;">
                      <strong>Captured:</strong> ${mediaAttributes.date.toLocaleString()}
                    </div>`
                  : ''
              }
              ${
                mediaAttributes?.make || mediaAttributes?.model
                  ? `<div style="margin-bottom: 10px;">
                      <strong>Camera:</strong> ${mediaAttributes.make || ''} ${mediaAttributes.model || ''}
                    </div>`
                  : ''
              }
              ${
                mediaAttributes?.FileType
                  ? `<div style="margin-bottom: 10px;">
                      <strong>File Type:</strong> ${mediaAttributes.FileType}
                    </div>`
                  : ''
              }
              ${
                mediaAttributes?.altitude
                  ? `<div style="margin-bottom: 10px;">
                      <strong>Altitude:</strong> ${mediaAttributes.altitude}m
                    </div>`
                  : ''
              }
              ${
                mediaAttributes?.latitude && mediaAttributes?.longitude
                  ? `<div style="margin-bottom: 10px;">
                      <strong>Location:</strong> ${mediaAttributes.latitude.toFixed(6)}, ${mediaAttributes.longitude.toFixed(6)}
                    </div>`
                  : ''
              }
              <button onclick="downloadImage()" style="margin-top: 15px; padding: 8px 16px; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-family: Arial, sans-serif;">
                Download Image
              </button>
            </div>
          </body>
        </html>
      `);

      
    } catch (error) {
      console.error('Permalink Error fetching media image:', error);
      
      // Fallback: try to open the source_url directly if available
      if (mediaItem.source_url) {
        window.open(mediaItem.source_url, '_blank');
      } else {
        alert(`Permalink Failed to load image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  // Generate mock polygon coordinates for media footprints
  const generateFootprint = (mediaItem: Media, mediaAttributes: MediaAttributes | undefined): [number, number][] => {
    const centerLat = mediaAttributes?.latitude || 36.7783; // Default to Monterey Bay
    const centerLng = mediaAttributes?.longitude ? 
      (mediaAttributes.longitude < 0 ? mediaAttributes.longitude : mediaAttributes.longitude * -1) : 
      -119.4179; // Default to Monterey Bay
    const altitude = mediaAttributes?.altitude || 60; // Default altitude in meters

    // Calculate footprint based on image dimensions and altitude (mock)
    const width = mediaItem.width || 4000;
    const height = mediaItem.height || 3000; 
    const fov = 60; // Mock field of view in degrees
    
    // Calculate ground coverage (simplified)
    const groundWidth = (altitude * Math.tan(fov * Math.PI / 180)) * (width / height);
    const groundHeight = altitude * Math.tan(fov * Math.PI / 180);
    
    // Convert to lat/lng offsets (rough approximation)
    const latOffset = groundHeight / 111000; // Rough meters per degree latitude
    const lngOffset = groundWidth / (111000 * Math.cos(centerLat * Math.PI / 180));
    
    return [
      [centerLat - latOffset/2, centerLng - lngOffset/2],
      [centerLat + latOffset/2, centerLng - lngOffset/2],
      [centerLat + latOffset/2, centerLng + lngOffset/2],
      [centerLat - latOffset/2, centerLng + lngOffset/2],
      [centerLat - latOffset/2, centerLng - lngOffset/2], // Close the polygon
    ];
  };

  return (
    <>
      {media.map((mediaItem) => {
        const mediaAttributes = mediaItem.attributes as MediaAttributes | undefined;
        const footprint = generateFootprint(mediaItem, mediaAttributes);
        
        return (
          <Polygon
            key={mediaItem.id}
            positions={footprint}
            pathOptions={{
              color: '#3B82F6',
              weight: 2,
              opacity: 0.6,
              fillColor: '#3B82F6',
              fillOpacity: 0.1,
            }}
            eventHandlers={{
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                  weight: 3,
                  opacity: 0.8,
                  fillOpacity: 0.2,
                });
              },
              mouseout: (e) => {
                const layer = e.target;
                layer.setStyle({
                  weight: 2,
                  opacity: 0.6,
                  fillOpacity: 0.1,
                });
              },
              click: async () => {
                // Handle media click - fetch full image and open in new tab
                await handleMediaClick(mediaItem);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="p-2">
                <h4 className="font-semibold text-gray-900">{mediaItem.name}</h4>
                <p className="text-sm text-gray-600">
                  Resolution: {mediaItem.width} × {mediaItem.height}
                </p>
                <p className="text-sm text-gray-600">
                  Size: {mediaItem.media_files?.image?.[0]?.size ? 
                    `${Math.round(mediaItem.media_files.image[0].size / 1024 / 1024)} MB` : 
                    'Unknown'
                  }
                </p>
                <p className="text-sm text-gray-600">
                  Captured: {mediaAttributes?.date ? 
                    mediaAttributes.date.toLocaleString() : 
                    'Unknown'
                  }
                </p>
              </div>
            </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
};

export default MediaFootprintLayer;

