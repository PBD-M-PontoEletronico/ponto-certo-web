import { useEffect } from 'react';
import { MapContainer, TileLayer,Circle, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';


// Corrige o ícone padrão do Leaflet, que não resolve certo com o bundler (Vite).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const CENTRO_PADRAO: [number, number] = [-14.235, -51.9253]; // centro aproximado do Brasil

interface MapaSelecionarLocalProps {
  latitude: number | null;
  longitude: number | null;
  raioMetros?: number;
  onMudar: (lat: number, lng: number) => void;
}

function ClickNoMapa({ onMudar }: { onMudar: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMudar(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Recentraliza o mapa quando a coordenada muda por fora (ex: depois da busca por endereço)
function RecentralizarMapa({ latitude, longitude }: { latitude: number | null; longitude: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (latitude != null && longitude != null) {
      map.setView([latitude, longitude], Math.max(map.getZoom(), 16));
    }
  }, [latitude, longitude, map]);
  return null;
}

export function MapaSelecionarLocal({ latitude, longitude, raioMetros, onMudar }: MapaSelecionarLocalProps) {
  const posicao: [number, number] =
    latitude != null && longitude != null ? [latitude, longitude] : CENTRO_PADRAO;

  return (
    <div className="overflow-hidden rounded-sm border border-border" style={{ height: 260 }}>
      <MapContainer center={posicao} zoom={latitude != null ? 16 : 4} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {latitude != null && longitude != null && (
          <>
            <Marker
              position={[latitude, longitude]}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const marcador = e.target as L.Marker;
                  const { lat, lng } = marcador.getLatLng();
                  onMudar(lat, lng);
                },
              }}
            />
            {!!raioMetros && raioMetros > 0 && (
              <Circle
                center={[latitude, longitude]}
                radius={raioMetros}
                pathOptions={{ color: '#2B3A67', fillColor: '#2B3A67', fillOpacity: 0.15 }}
              />
            )}
          </>
        )}
        <ClickNoMapa onMudar={onMudar} />
        <RecentralizarMapa latitude={latitude} longitude={longitude} />
      </MapContainer>
    </div>
  );
}
  