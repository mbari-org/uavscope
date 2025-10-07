import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../../stores/appStore';
import { Detection } from '../../types';
import { mockDataService } from '../../services/dataService';
import { Grid, List, Eye, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// Custom hook to fetch Detection graphic data
const useDetectionGraphic = (detectionId: number | null) => {
  return useQuery({
    queryKey: ['detectionGraphic', detectionId],
    queryFn: () => detectionId ? mockDataService.fetchDetectionGraphic(detectionId) : null,
    enabled: !!detectionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

const Gallery: React.FC = () => {
  const { galleryState, updateGalleryState, filteredDetections: getFilteredDetectionsFromStore, updateMapState } = useAppStore();
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  
  const detections = getFilteredDetectionsFromStore();
  
  // Log Detections changes for debugging
  useEffect(() => {
    console.log('🔄 Gallery component: Detections data changed');
    console.log('📊 Current Detections count:', detections.length);
    console.log('📋 Detections sample:', detections.slice(0, 3).map(detection => ({ id: detection.id, label: detection.attributes?.Label, media_date: detection.media_attributes?.date })));
  }, [detections]);
  
  // Reset pagination when filters change
  useEffect(() => {
    console.log('🎯 Gallery state changed, resetting pagination to page 1');
    updateGalleryState({ currentPage: 1 });
  }, [galleryState.selectedConfidenceLevel, updateGalleryState]);

  
  // Helper function to categorize Detections by confidence level
  const getConfidenceLevel = (score: number | undefined): 'high' | 'medium' | 'low' => {
    if (!score) return 'low';
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  };
  
  // Pagination logic
  const getConfidenceFilteredDetections = () => {
    return galleryState.selectedConfidenceLevel 
      ? detections.filter(detection => {
          const detectionConfidenceLevel = getConfidenceLevel(detection.attributes?.score);
          return detectionConfidenceLevel === galleryState.selectedConfidenceLevel;
        })
      : detections;
  };
  
  const confidenceFilteredDetections = getConfidenceFilteredDetections();
  const totalItems = confidenceFilteredDetections.length;
  const totalPages = Math.ceil(totalItems / galleryState.itemsPerPage);
  const startIndex = (galleryState.currentPage - 1) * galleryState.itemsPerPage;
  const endIndex = startIndex + galleryState.itemsPerPage;
  const paginatedDetections = confidenceFilteredDetections.slice(startIndex, endIndex);
  
  // Pagination handlers
  const goToPage = (page: number) => {
    updateGalleryState({ currentPage: page });
  };
  
  const goToNextPage = () => {
    if (galleryState.currentPage < totalPages) {
      updateGalleryState({ currentPage: galleryState.currentPage + 1 });
    }
  };
  
  const goToPrevPage = () => {
    if (galleryState.currentPage > 1) {
      updateGalleryState({ currentPage: galleryState.currentPage - 1 });
    }
  };
  
  // Count Detections by confidence level
  const confidenceCounts = {
    high: detections.filter(detection => getConfidenceLevel(detection.attributes?.score) === 'high').length,
    medium: detections.filter(detection => getConfidenceLevel(detection.attributes?.score) === 'medium').length,
    low: detections.filter(detection => getConfidenceLevel(detection.attributes?.score) === 'low').length,
    any: detections.length
  };
  
  // Fetch graphic data for selected Detection
  const { data: selectedDetectionGraphic, isLoading: isGraphicLoading } = useDetectionGraphic(selectedDetection?.id || null);

  const handleDetectionClick = (detection: Detection, event?: React.MouseEvent) => {
    // Debug log to track clicks
    console.log('Detection clicked:', detection.id, detection.attributes?.Label);

    // Prevent event bubbling and default behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    } 
    
    // Ensure the pop-up opens reliably with a small delay to prevent race conditions
    setTimeout(() => {
      setSelectedDetection(detection);
      updateMapState({ selectedDetection: detection.id });
    }, 0);
  };

  const handleDetectionHover = (detection: Detection | null) => {
    updateMapState({ hoveredDetection: detection?.id });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600 bg-green-100';
    if (score >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getClusterColor = (cluster: string) => {
    const colors = {
      'Unknown C-1': 'bg-blue-100 text-blue-800',
      'Unknown C-2': 'bg-green-100 text-green-800',
      'Unknown C-3': 'bg-yellow-100 text-yellow-800',
      'Unknown C-4': 'bg-red-100 text-red-800',
      'Unknown C-5': 'bg-purple-100 text-purple-800',
    };
    return colors[cluster as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Custom hook for individual Detection graphic data
  const useDetectionGraphicForItem = (detectionId: number) => {
    return useQuery({
      queryKey: ['detectionGraphic', detectionId],
      queryFn: () => mockDataService.fetchDetectionGraphic(detectionId),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  const DetectionGridItem: React.FC<{ detection: Detection; isGrid: boolean }> = ({ detection, isGrid }) => {
    const { data: detectionGraphic, isLoading } = useDetectionGraphicForItem(detection.id);
    
    const imageSrc = detectionGraphic || `https://via.placeholder.com/200x150?text=Detection+${detection.id}`;
    
    return (
      <div
        key={detection.id}
        className={`cursor-pointer transition-all duration-200 ${
          isGrid ? 'p-2' : 'p-3 border-b border-gray-100'
        }`}
        onClick={(event) => handleDetectionClick(detection, event)}
        onMouseEnter={() => handleDetectionHover(detection)}
        onMouseLeave={() => handleDetectionHover(null)}
      >
        {isGrid ? (
          <div className="relative group">
            {isLoading ? (
              <div 
                className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer"
                onClick={(event) => handleDetectionClick(detection, event)}
              >
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <img
                src={imageSrc}
                alt={detection.attributes?.Label || 'Detection'}
                className="w-full h-32 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                onClick={(event) => handleDetectionClick(detection, event)}
                onError={(e) => {
                  e.currentTarget.src = `https://via.placeholder.com/200x150?text=Detection+${detection.id}`;
                }}
              />
            )}
          
          {/* Persistent Label Overlay */}
          <div className="absolute top-2 left-2 right-2">
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded px-2 py-1 shadow-sm">
              <div className="text-xs font-semibold text-gray-800 truncate">
                {detection.attributes?.Label || 'Unknown'} {(detection.attributes?.score || 0).toFixed(2)}
              </div>
            </div>
          </div>
          
          {/* Hover Overlay with additional metadata */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-end">
            <div className="p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">
                  {detection.attributes?.Label || 'Unknown'}
                </span>
                <div className="flex items-center space-x-1">
                  {detection.attributes?.verified ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className={`px-1 py-0.5 rounded text-xs ${getConfidenceColor(detection.attributes?.score || 0)}`}>
                  {(detection.attributes?.score || 0).toFixed(2)}
                </span>
                <span className={`px-1 py-0.5 rounded text-xs ${getClusterColor(detection.attributes?.cluster || 'Unknown')}`}>
                  {detection.attributes?.cluster || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
        ) : (
          <div className="flex items-center space-x-3">
            {isLoading ? (
              <div 
                className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer"
                onClick={(event) => handleDetectionClick(detection, event)}
              >
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <img
                src={imageSrc}
                alt={detection.attributes?.Label || 'Detection'}
                className="w-16 h-16 object-cover rounded-lg cursor-pointer"
                onClick={(event) => handleDetectionClick(detection, event)}
                onError={(e) => {
                  e.currentTarget.src = `https://via.placeholder.com/64x64?text=Detection+${detection.id}`;
                }}
              />
            )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {detection.attributes?.Label || 'Unknown'}
              </h3>
              <div className="flex items-center space-x-1">
                {detection.attributes?.verified ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-yellow-500" />
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mb-1">
              <span className={`px-2 py-1 rounded text-xs ${getConfidenceColor(detection.attributes?.score || 0)}`}>
                Score: {(detection.attributes?.score || 0).toFixed(3)}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${getClusterColor(detection.attributes?.cluster || 'Unknown')}`}>
                {detection.attributes?.cluster || 'Unknown'}
              </span>
            </div>
            
            {detection.attributes?.comment && (
              <p className="text-xs text-gray-600 truncate">
                {detection.attributes.comment}
              </p>
            )}
            
            <p className="text-xs text-gray-500">
              {(detection.media_attributes?.date || detection.created_datetime) ? 
                (detection.media_attributes?.date || new Date(detection.created_datetime!)).toLocaleString() : 
                'No date'
              }
            </p>
          </div>
        </div>
        )}
      </div>
    );
  };

  const renderDetectionItem = (detection: Detection, isGrid: boolean = true) => (
    <DetectionGridItem key={detection.id} detection={detection} isGrid={isGrid} />
  );

  return (
    <div className="h-full flex flex-col">
      {/* Gallery Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Detections</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => updateGalleryState({ viewMode: 'grid' })}
              className={`p-2 rounded ${galleryState.viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => updateGalleryState({ viewMode: 'list' })}
              className={`p-2 rounded ${galleryState.viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>        
        
 
        
        {/* Confidence Score Tabs */}
        <div className="flex space-x-1 mb-3">
          <button
            onClick={() => updateGalleryState({ selectedConfidenceLevel: undefined })}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              !galleryState.selectedConfidenceLevel 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Any ({confidenceCounts.any})
          </button>
          <button
            onClick={() => updateGalleryState({ selectedConfidenceLevel: 'high' })}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              galleryState.selectedConfidenceLevel === 'high'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            High ({confidenceCounts.high})
          </button>
          <button
            onClick={() => updateGalleryState({ selectedConfidenceLevel: 'medium' })}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              galleryState.selectedConfidenceLevel === 'medium'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Medium ({confidenceCounts.medium})
          </button>
          <button
            onClick={() => updateGalleryState({ selectedConfidenceLevel: 'low' })}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              galleryState.selectedConfidenceLevel === 'low'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Low ({confidenceCounts.low})
          </button>
        </div>
      </div>
      
      {/* Gallery Content */}
      <div className="flex-1 overflow-y-auto">
        {confidenceFilteredDetections.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No Detections found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className={galleryState.viewMode === 'grid' ? 'p-2' : 'p-0'}>
            {galleryState.viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-2">
                {paginatedDetections.map((detection: Detection) => renderDetectionItem(detection, true))}
              </div>
            ) : (
              <div className="space-y-0">
                {paginatedDetections.map((detection: Detection) => renderDetectionItem(detection, false))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Pagination Controls */}
      {confidenceFilteredDetections.length > 0 && totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} Detections
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPrevPage}
                disabled={galleryState.currentPage === 1}
                className={`p-2 rounded-md ${
                  galleryState.currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (galleryState.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (galleryState.currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = galleryState.currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        pageNum === galleryState.currentPage
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 5 && galleryState.currentPage < totalPages - 2 && (
                  <>
                    <span className="text-gray-400">...</span>
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={galleryState.currentPage === totalPages}
                className={`p-2 rounded-md ${
                  galleryState.currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Lightbox */}
      {selectedDetection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedDetection.attributes?.Label || 'Unknown Detection'}
                </h3>
                <button
                  onClick={() => setSelectedDetection(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {isGraphicLoading ? (
                  <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <img
                    src={selectedDetectionGraphic || `https://via.placeholder.com/400x300?text=Detection+${selectedDetection.id}`}
                    alt={selectedDetection.attributes?.Label || 'Detection'}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/400x300?text=Detection+${selectedDetection.id}`;
                    }}
                  />
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Confidence Score</label>
                    <p className={`text-lg font-semibold ${getConfidenceColor(selectedDetection.attributes?.score || 0)}`}>
                      {(selectedDetection.attributes?.score || 0).toFixed(3)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cluster</label>
                    <p className={`text-lg font-semibold ${getClusterColor(selectedDetection.attributes?.cluster || 'Unknown')}`}>
                      {selectedDetection.attributes?.cluster || 'Unknown'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <p className={`text-lg font-semibold ${
                      selectedDetection.attributes?.verified ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {selectedDetection.attributes?.verified ? 'Verified' : 'Unverified'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {(selectedDetection.media_attributes?.date || selectedDetection.created_datetime) ? 
                        (selectedDetection.media_attributes?.date || new Date(selectedDetection.created_datetime!)).toLocaleString() : 
                        'Unknown'
                      }
                    </p>
                  </div>
                </div>
                
                {selectedDetection.attributes?.comment && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Comment</label>
                    <p className="text-gray-900">{selectedDetection.attributes.comment}</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <button
                    onClick={() => setSelectedDetection(null)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;

