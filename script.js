
// script.js
// Interactive map showing storm basins and hydrants in Corvallis
// - Basins are a non-interactive, pink layer
// - Hydrants are pink, clustered, and clicking the map finds the nearest hydrant


// Create the Leaflet map and center it on Corvallis
const map = L.map('map').setView([44.5646, -123.2620], 13);

// Add OpenStreetMap tiles as the base map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);


// We'll store the hydrant GeoJSON here after loading
let hydrantData;

// Create a cluster group for hydrant markers so they don't overlap
let hydrantCluster = L.markerClusterGroup({
  showCoverageOnHover: false,
  maxClusterRadius: 40
});



// Load the storm basin polygons and add as a pink, non-interactive layer
fetch('Storm_Basins.geojson')
  .then(response => response.json())
  .then(basinData => {
    // Add the polygons with a pink outline and light pink fill
    L.geoJSON(basinData, {
      style: {
        color: '#e75480', // pink outline
        weight: 2,
        fillColor: '#ffc0cb', // light pink fill
        fillOpacity: 0.2,
        interactive: false // users can't click/select basins
      }
    }).addTo(map);
  });


// Load the hydrant points and add them as clustered pink markers
fetch('Water_Hydrant.geojson')
  .then(response => response.json())
  .then(data => {
    hydrantData = data;
    // Each hydrant is a pink dot, clustered to avoid overlap
    const geoJsonLayer = L.geoJSON(hydrantData, {
      pointToLayer: (feature, latlng) => L.marker(latlng, {
        icon: L.divIcon({
          className: 'custom-hydrant',
          html: '<div style="background:#e75480;border-radius:50%;width:12px;height:12px;border:2px solid #ffc0cb;"></div>',
          iconSize: [16, 16]
        })
      })
    });
    hydrantCluster.addLayer(geoJsonLayer);
    map.addLayer(hydrantCluster);
  });


// Add Turf.js for spatial calculations (finding closest hydrant)
const turfScript = document.createElement('script');
turfScript.src = 'https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js';
document.head.appendChild(turfScript);

// When Turf.js is loaded, set up the click handler
turfScript.onload = () => {
  // When the user clicks the map, find the closest hydrant
  map.on('click', function(e) {
    if (!hydrantData) return; // Wait until hydrants are loaded
    // Create a Turf point from the click location
    const pt = turf.point([e.latlng.lng, e.latlng.lat]);
    let nearest = null;
    let minDist = Infinity;
    // Loop through all hydrants to find the closest
    hydrantData.features.forEach(feature => {
      if (feature.geometry.type !== 'Point') return;
      const dist = turf.distance(pt, feature, {units: 'kilometers'});
      if (dist < minDist) {
        minDist = dist;
        nearest = feature;
      }
    });
    // If we found a hydrant, show its info in a popup
    if (nearest) {
      const props = nearest.properties;
      let info = '';
      for (const key in props) {
        info += `<b>${key}</b>: ${props[key]}<br>`;
      }
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`<b>Closest Hydrant Info:</b><br>${info}`)
        .openOn(map);
    }
  });
};
