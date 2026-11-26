/**
 * Leaflet is only loaded when the Memories view opens, so it never slows down the player.
 */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { PlacePlays } from './places';

export interface MemoryMap {
  show(places: PlacePlays[], describe: (place: PlacePlays) => HTMLElement): void;
  destroy(): void;
}

export function createMap(container: HTMLElement, accent: string): MemoryMap {
  const map = L.map(container, {
    zoomControl: true,
    attributionControl: true,
    worldCopyJump: true,
  });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  const layer = L.layerGroup().addTo(map);

  return {
    show(places, describe) {
      layer.clearLayers();
      if (places.length === 0) {
        map.setView([20, 0], 2);
        return;
      }
      const busiest = places[0]?.count ?? 1;
      for (const place of places) {
        // Area grows with plays, so the busiest place stands out without hiding the rest.
        const radius = 8 + 18 * Math.sqrt(place.count / busiest);
        L.circleMarker([place.latitude, place.longitude], {
          radius,
          color: accent,
          weight: 2,
          fillColor: accent,
          fillOpacity: 0.45,
        })
          .bindPopup(() => describe(place))
          .addTo(layer);
      }
      const bounds = L.latLngBounds(places.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 11 });
    },
    destroy() {
      map.remove();
    },
  };
}
