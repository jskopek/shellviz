import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet"; // Import the Leaflet namespace
import { getCoordinates } from "../../utils/helpers";
import { faMapLocation } from "@fortawesome/free-solid-svg-icons";
import { isValidLocation } from "../../utils/dataValidator";
import { parseJSON } from "../../utils/dataValidator";
import { useEffect, useState } from "react";
import _ from "lodash";

const ICON = L.divIcon({
  className: "custom-div-icon",
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="red" viewBox="0 0 24 24"><path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 5.38 10.25 6.39 11.15.37.32.88.32 1.25 0C13.62 19.25 19 14.25 19 9c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"></path></svg>`,
});


// Helper component to zoom and center on a location when a marker is clicked
const ZoomAndCenter = ({ position, zoomOut }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      if (zoomOut) {
        map.setZoom(13, { animate: true }); // Zoom out to default zoom level
        map.fitBounds(map.getBounds(), { animate: true }); // Ensure all markers are shown
      } else {
        map.setView(position, 15, { animate: true }); // Zoom to level 15 with animation
      }
    }
  }, [position, zoomOut, map]);
  return null;
};



// A helper component to fit the map to bounds
const FitBounds = ({ bounds }) => {
  const map = useMap(); // Access the map instance
  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [50, 50] }); // Fit the map to the bounds with padding
  }
  return null;
};

export const LocationView = {
  name: "location",
  label: "Location",
  icon: faMapLocation,
  evaluator: (value) => isValidLocation(value),
  Component: ({ data }) => {
    const jsonData = parseJSON(data); // Ensure data is parsed into a usable JSON format
    const coordinates = _.isArray(jsonData)
      ? jsonData // If it's an array, use it directly
      : [jsonData]; // Otherwise, wrap it in an array for uniformity

    // Calculate bounds from coordinates
    const bounds = coordinates.map((location) => [
      location.latitude || location.lat,
      location.longitude || location.lng,
    ]);

    const [selectedPosition, setSelectedPosition] = useState(null);
    const [zoomOut, setZoomOut] = useState(false);

    const handleMarkerClick = (position) => {
      // Toggle zoom behavior
      if (
        selectedPosition &&
        selectedPosition[0] === position[0] &&
        selectedPosition[1] === position[1]
      ) {
        setZoomOut(true); // Zoom out if clicking the same marker again
        setSelectedPosition(null);
      } else {
        setSelectedPosition(position); // Zoom in to the clicked marker
        setZoomOut(false);
      }
    };

    return (
      <div className="bg-gray-200 p-4 rounded-md">
        <MapContainer
          id="map"
          className="h-96"
          zoom={13}
          scrollWheelZoom={false}
        >
          <FitBounds bounds={bounds} /> {/* Fit the map to the markers */}
          {selectedPosition && (
            <ZoomAndCenter position={selectedPosition} zoomOut={zoomOut} />
          )}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Render a marker for each location */}
          {coordinates.map((location, index) => (
            <Marker
              key={index}
              position={[
                location.latitude || location.lat,
                location.longitude || location.lng,
              ]}
              icon={ICON}
              eventHandlers={{
                click: () =>
                  handleMarkerClick([
                    location.latitude || location.lat,
                    location.longitude || location.lng,
                  ]),
              }}
            >
              {/* Popup that displays the JSON data */}
              <Popup>
                <pre className="text-sm text-gray-800">
                  {JSON.stringify(location, null, 2)}
                </pre>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    );
  },
};
