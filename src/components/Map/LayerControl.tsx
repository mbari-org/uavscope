import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';

interface LayerControlProps {
  className?: string;
}

const LayerControl: React.FC<LayerControlProps> = ({ className = '' }) => {
  const { mapState, toggleLayerVisibility } = useAppStore();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const layers = [
    {
      key: 'basemap' as const,
      label: 'Base Map',
      color: 'bg-gray-500',
      description: 'OpenStreetMap base layer',
    },
    {
      key: 'nauticalOverlay' as const,
      label: 'Nautical Overlay',
      color: 'bg-blue-400',
      description: 'Marine navigation markers',
    },
    {
      key: 'flightPaths' as const,
      label: 'Flight Paths',
      color: 'bg-blue-500',
      description: 'UAV flight trajectories',
    },
    {
      key: 'mediaFootprints' as const,
      label: 'Media Footprints',
      color: 'bg-blue-300',
      description: 'Photo coverage areas',
    },
    {
      key: 'detectionMarkers' as const,
      label: 'Detection Markers',
      color: 'bg-gray-500',
      description: 'Object Detection Markers',
    },
  ];

  const visibleLayersCount = Object.values(mapState.layerVisibility).filter(Boolean).length;

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${className}`}>
      {/* Header */}
      <div 
        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center space-x-2">
          <div className="text-sm font-semibold text-gray-700">
            Map Layers
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {visibleLayersCount}/{layers.length}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Quick toggle for all layers */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const allVisible = visibleLayersCount === layers.length;
              layers.forEach(layer => {
                if (mapState.layerVisibility[layer.key] === allVisible) {
                  toggleLayerVisibility(layer.key);
                }
              });
            }}
            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
            title={visibleLayersCount === layers.length ? 'Hide all layers' : 'Show all layers'}
          >
            {visibleLayersCount === layers.length ? 'Hide All' : 'Show All'}
          </button>
          
          {/* Collapse/Expand icon */}
          <div className={`transform transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}>
            <svg 
              className="w-4 h-4 text-gray-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Collapsible Content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
        <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
          {layers.map((layer) => (
            <div key={layer.key} className="flex items-center justify-between space-x-3 py-1">
              <div className="flex items-center space-x-2 flex-1">
                <div className={`w-3 h-3 rounded ${layer.color}`}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {layer.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {layer.description}
                  </div>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={mapState.layerVisibility[layer.key]}
                  onChange={() => toggleLayerVisibility(layer.key)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
          
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Toggle layers on/off to customize your map view
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayerControl;