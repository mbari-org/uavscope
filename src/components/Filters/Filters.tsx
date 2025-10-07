import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Filter, X, Calendar, Tag, MapPin, CheckCircle, RefreshCw } from 'lucide-react';

const Filters: React.FC = () => {
  const { filterState, updateFilterState, missions, filteredDetections: getFilteredDetections, detections, refreshDetectionsWithFilters } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const filteredDetections = getFilteredDetections();
  const uniqueCategories = Array.from(new Set(detections.map(detection => detection.attributes?.Label).filter(Boolean)));

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDate = new Date(value);
    const currentRange = filterState.dateRange || { start: new Date(), end: new Date() };
    
    updateFilterState({
      dateRange: {
        ...currentRange,
        [field]: newDate
      }
    });
  };

  const handleLabelChange = (label: string) => {
    const currentLabels = filterState.labels || [];
    const newLabels = currentLabels.includes(label)
      ? currentLabels.filter((l: string) => l !== label)
      : [...currentLabels, label];
    
    updateFilterState({
      labels: newLabels.length > 0 ? newLabels : undefined
    });
  };

  const handleMissionChange = (missionId: string) => {
    updateFilterState({
      missionId: missionId === filterState.missionId ? undefined : missionId
    });
  };


  const handleVerifiedToggle = () => {
    updateFilterState({
      verifiedOnly: !filterState.verifiedOnly
    });
  };

  const clearAllFilters = () => {
    updateFilterState({
      dateRange: undefined,
      missionId: undefined,
      labels: undefined,
      mapBounds: undefined,
      verifiedOnly: undefined,
    });
  };

  const handleRefreshDetectionsWithFilters = async () => {
    setIsRefreshing(true);
    try {
      await refreshDetectionsWithFilters();
    } catch (error) {
      console.error('Error refreshing detections:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const hasActiveFilters = Object.values(filterState).some(value => 
    value !== undefined && value !== null && value !== false
  );

  return (
    <>
      {/* Refresh and Filter Toggle Buttons */}
      <div className="fixed top-20 right-4 z-40 flex items-center space-x-2">
        {/* Refresh Button */}
        <button
          onClick={handleRefreshDetectionsWithFilters}
          disabled={isRefreshing}
          className={`btn flex items-center space-x-2 ${
            isRefreshing ? 'btn-disabled' : 'btn-secondary'
          }`}
          title="Refresh detections"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
        
        {/* Filter Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`btn flex items-center space-x-2 ${
            hasActiveFilters ? 'btn-primary' : 'btn-secondary'
          }`}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-white text-primary-600 rounded-full px-2 py-0.5 text-xs font-medium">
              {Object.values(filterState).filter(v => v !== undefined && v !== null && v !== false).length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div className="fixed top-20 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <div className="flex items-center space-x-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium text-gray-900">Date Range</h4>
              </div>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={filterState.dateRange?.start.toISOString().slice(0, 16) || ''}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={filterState.dateRange?.end.toISOString().slice(0, 16) || ''}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Mission Filter */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium text-gray-900">Mission</h4>
              </div>
              
              <div className="space-y-2">
                {missions.map((mission) => (
                  <label key={mission.mneumonic} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="mission"
                      checked={filterState.missionId === mission.mneumonic}
                      onChange={() => handleMissionChange(mission.mneumonic)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{mission.mneumonic}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Label Filter */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Tag className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium text-gray-900">Detection Labels</h4>
              </div>
              
              <div className="space-y-2">
                {uniqueCategories.map((category) => (
                  <label key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(filterState.labels || []).includes(category)}
                      onChange={() => handleLabelChange(category)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>


            {/* Verification Filter */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium text-gray-900">Verification</h4>
              </div>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filterState.verifiedOnly || false}
                  onChange={handleVerifiedToggle}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Verified only</span>
              </label>
            </div>

            {/* Results Summary */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{filteredDetections.length}</span> detections match current filters
                </div>
                <button
                  onClick={handleRefreshDetectionsWithFilters}
                  disabled={isRefreshing}
                  className={`btn btn-sm flex items-center space-x-1 ${
                    isRefreshing ? 'btn-disabled' : 'btn-secondary'
                  }`}
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
              
              {/* Map Bounds Info */}
              {filterState.mapBounds && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <div className="font-medium mb-1">Current Map Bounds:</div>
                  <div>North: {filterState.mapBounds.north.toFixed(4)}</div>
                  <div>South: {filterState.mapBounds.south.toFixed(4)}</div>
                  <div>East: {filterState.mapBounds.east.toFixed(4)}</div>
                  <div>West: {filterState.mapBounds.west.toFixed(4)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Filters;

