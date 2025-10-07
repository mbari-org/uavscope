import React from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import { FlightPath } from '../../types';

interface FlightPathLayerProps {
  flightPaths: FlightPath[];
}

const FlightPathLayer: React.FC<FlightPathLayerProps> = ({ flightPaths }) => {
  return (
    <>
      {flightPaths.map((path, index) => (
        <Polyline
          key={`${path.mission}-${index}`}
          positions={path.coordinates}
          pathOptions={{
            color: path.color,
            weight: 3,
            opacity: 0.8,
            dashArray: '5, 10',
          }}
          eventHandlers={{
            mouseover: (e) => {
              const layer = e.target;
              layer.setStyle({
                weight: 5,
                opacity: 1,
              });
            },
            mouseout: (e) => {
              const layer = e.target;
              layer.setStyle({
                weight: 3,
                opacity: 0.8,
              });
            },
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            <div className="p-2">
              <h4 className="font-semibold text-gray-900">{path.mission}</h4>
              <p className="text-sm text-gray-600">
                Start: {new Date(path.startTime).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                End: {new Date(path.endTime).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                Duration: {Math.round((new Date(path.endTime).getTime() - new Date(path.startTime).getTime()) / (1000 * 60))} minutes
              </p>
            </div>
          </Tooltip>
        </Polyline>
      ))}
    </>
  );
};

export default FlightPathLayer;
