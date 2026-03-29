import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from "prop-types";

// --- Version 4 Icon Fix ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

ChangeView.propTypes = {
  center: PropTypes.array.isRequired,
};

export default function Map({ address }) {
  const [geoData, setGeoData] = useState({ lat: 13.7563, lng: 100.5018 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCoords = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
          { headers: { "User-Agent": "MickeyEstateApp" } },
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setGeoData({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Map Error:", error);
        setLoading(false);
      }
    };
    if (address) getCoords();
  }, [address]);

  return (
    <div
      style={{
        height: "400px",
        width: "100%",
        position: "relative",
        zIndex: 0,
      }}
    >
      {loading ? (
        <div className="h-full w-full flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed">
          Searching for location...
        </div>
      ) : (
        <MapContainer
          center={[geoData.lat, geoData.lng]}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%", borderRadius: "10px" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={[geoData.lat, geoData.lng]} />
          <Marker position={[geoData.lat, geoData.lng]}>
            <Popup>{address}</Popup>
          </Marker>
        </MapContainer>
      )}
    </div>
  );
}

Map.propTypes = {
  address: PropTypes.string.isRequired,
};
