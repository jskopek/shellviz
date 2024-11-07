// import { MapContainer, TileLayer, Marker } from "react-leaflet";
// import { icon } from "leaflet";
import { getCoordinates } from "../../utils/helpers";
import { faMapLocation } from "@fortawesome/free-solid-svg-icons";
import { isValidLocation } from "../../utils/dataValidator";

// // a hack to make leaflet marker work with nextjs
// // https://github.com/PaulLeCam/react-leaflet/issues/808#issuecomment-747719927
// const ICON = icon({
//   iconUrl: "/marker.png",
//   iconSize: [64, 64],
// });

export const MapView = {
  name: "map",
  label: "Map",
  icon: faMapLocation,
  evaluator: (value) => isValidLocation(value),
  component: ({ data }) => {
    const coordinates = getCoordinates(data);
    return (
      <div className="bg-gray-200 p-4 rounded-md">
        <MapContainer
          id="map"
          center={coordinates}
          zoom={13}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={coordinates} icon={ICON} />
        </MapContainer>
      </div>
    );
  }
}


// TODO: look into this:
// // We need to use dynamic import here otherwise we get undefined window error
// import dynamic from "next/dynamic";
// const MapView = dynamic(() => import("./mapView"), { ssr: false });
// const MapDataView = ({ data }) => <MapView data={data} />;
