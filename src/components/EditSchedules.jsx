import mapboxgl from "mapbox-gl";

class MapBox extends HTMLElement {
  constructor() {
    super();
    this.map = null;
    this.markers = [];
  }

  // Called when the component is added to the DOM
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.render();
    this.loadMap();
  }

  // Load the Mapbox map
  loadMap() {
    const mapContainer = this.shadowRoot.getElementById("map");
    if (!mapContainer) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    this.map = new mapboxgl.Map({
      container: mapContainer,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-96.7970, 32.7767],
      zoom: 12,
    });

    this.map.addControl(new mapboxgl.NavigationControl());

    // Load initial markers
    this.updateMarkers();
  }

  // Set markers dynamically
  set markersData(data) {
    this.markers = data;
    this.updateMarkers();
  }

  updateMarkers() {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    // Add new markers
    const markerData = JSON.parse(this.getAttribute("markers") || "[]");
    markerData.forEach(({ lng, lat }) => {
      const marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(this.map);
      this.markers.push(marker);
    });
  }

  // Update when attributes change (for reactivity)
  static get observedAttributes() {
    return ["markers"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "markers") {
      this.updateMarkers();
    }
  }

  // Render the component
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        #map {
          width: 100%;
          height: 400px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
      </style>
      <div id="map"></div>
    `;
  }
}

// Register the web component
customElements.define("edit-schedules", MapBox);

