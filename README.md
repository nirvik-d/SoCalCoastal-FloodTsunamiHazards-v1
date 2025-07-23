# SoCal Coastal Flood & Tsunami Hazards

A web application that displays flood and tsunami hazard zones for coastal Southern California using ArcGIS Maps SDK for JavaScript and Calcite UI components.

## Features

- Interactive map showing flood hazard zones (red) and tsunami hazard zones (blue) for coastal Southern California
- Toggle between flood and tsunami hazard layers using the navigation buttons
- Flood hazard data is cached for optimal performance when switching between layers
- Modern UI with responsive design using Calcite components

## Screenshots

The main application
<img width="959" height="479" alt="image" src="https://github.com/user-attachments/assets/8ac89383-8758-4575-8ff4-64bdb898db2b" />

## Prerequisites

- Node.js (v16 or higher)

## Setup

1. Create a new vite project:
```bash
npm create vite@latest
```
Follow the instructions on screen to initialize the project.

2. Navigate to the project directory and install the dependencies:
```bash
npm install
```

3. Install ArcGIS Maps SDK for JavaScript and Calcite UI components:
```bash
npm install @arcgis/map-components
```

## Project Structure

### HTML Structure

The HTML file sets up the basic structure for the ArcGIS web application:

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>SoCal Coastal Flood & Tsunami Hazards</title>
    </head>
    <body>
        <arcgis-map basemap="topo-vector" center="-117.9988, 33.6595" zoom="8">
            <arcgis-zoom position="top-left"></arcgis-zoom>
            <arcgis-expand position="top-left">
                <arcgis-basemap-gallery></arcgis-basemap-gallery>
            </arcgis-expand>
            <arcgis-placement position="top-right">
                <calcite-button id="flood-hazard">Flood Hazard</calcite-button> <br />
            </arcgis-placement>
            <arcgis-placement position="top-right">
                <calcite-button id="tsunami-hazard">Tsunami Hazard</calcite-button>
            </arcgis-placement>
        </arcgis-map>
        <script type="module" src="./src/main.ts"></script>
    </body>
</html>
```

### CSS Structure

The CSS file styles the ArcGIS web application:

```css
html,
body {
    height: 100vh;
    width: 100vw;
    margin: 0;
    padding: 0;
}

#flood-hazard {
    width: 200px;
}

#tsunami-hazard {
    width: 200px;
}
```

### JavaScript/TypeScript Structure

1. Initialize map
```typescript
const map = document.querySelector("arcgis-map");
```

2. Initialize layers
```typescript
const coastalBufferLayer = new FeatureLayer({
    url: "https://services3.arcgis.com/uknczv4rpevve42E/arcgis/rest/services/California_County_Boundaries_and_Identifiers_with_Coastal_Buffers/FeatureServer/1",
    definitionExpression:
        "OFFSHORE IS NOT NULL AND CDTFA_COUNTY in ('Santa Barbara County', 'Ventura County', 'Los Angeles County', 'Orange County', 'San Diego County', 'San Luis Obispo County', 'Imperial County')",
    outFields: ["*"],
});

const floodHazardLayer = new FeatureLayer({
    url: "https://services2.arcgis.com/Uq9r85Potqm3MfRV/arcgis/rest/services/S_FLD_HAZ_AR_Reduced_Set_CA_wm/FeatureServer",
    outFields: ["*"],
});

const tsunamiHazardLayer = new FeatureLayer({
    url: "https://services2.arcgis.com/zr3KAIbsRSUyARHG/ArcGIS/rest/services/CA_Tsunami_Hazard_Area/FeatureServer",
    outFields: ["*"],
    definitionExpression:
        "County in ('Santa Barbara', 'Ventura', 'Los Angeles', 'Orange', 'San Diego', 'San Luis Obispo', 'Imperial') and Evacuate = 'Yes, Tsunami Hazard Area'",
});
```

3. Initialize flood hazard graphics layer
```typescript
// Create flood hazard graphics layer
let floodHazardGraphicsLayer: __esri.GraphicsLayer | null = null;
let isFloodHazardLayerInitialized = false;

// Function to initialize flood hazard graphics layer
const initializeFloodHazardLayer = async (): Promise<any> => {
  if (floodHazardGraphicsLayer) {
    console.log("Flood hazard layer already initialized");
    return floodHazardGraphicsLayer;
  }

  console.log("Initializing flood hazard layer...");

  // Create flood hazard graphics layer
  const graphicsLayer = new GraphicsLayer({
    id: "flood-hazard",
  });

  console.log("Processing flood hazard data...");
  
  // Query coastal buffer layer
  const [coastalBufferResult] = await Promise.all([
    coastalBufferLayer.queryFeatures()
  ]);

  // Query flood hazard layer
  const floodHazardPromises = coastalBufferResult.features.map((coastalBufferFeature: any) => {
    return floodHazardLayer.queryFeatures({
      geometry: coastalBufferFeature.geometry,
      spatialRelationship: "intersects",
      returnGeometry: true,
      outFields: ["*"],
    });
  });
  
  const floodHazardResponses = await Promise.all(floodHazardPromises);
  const floodHazardResults = floodHazardResponses.flatMap((response: any) => response.features);

  // Add flood hazard graphics to layer
  floodHazardResults.forEach((result: any) => {
    const graphic = new Graphic({
      geometry: result.geometry,
      symbol: {
        type: "simple-fill",
        color: [255, 0, 0, 0.2],
        outline: {
          color: [255, 0, 0],
          width: 1,
        },
      },
    });
    graphicsLayer.add(graphic);
  });

  floodHazardGraphicsLayer = graphicsLayer;
  return graphicsLayer;
};
```

4. Set up event listeners
```typescript
map?.addEventListener("arcgisViewReadyChange", async () => {
  console.log("View is ready");
  
  // Initialize and add flood hazard layer
  const layer = await initializeFloodHazardLayer();
  map?.map?.add(layer);
  isFloodHazardLayerInitialized = true;

  // Set up event listeners
  document.getElementById("flood-hazard")?.addEventListener("click", async () => {
    console.log("isFloodHazardLayerInitialized: ", isFloodHazardLayerInitialized);
    if (!isFloodHazardLayerInitialized) {
      await initializeFloodHazardLayer();
      isFloodHazardLayerInitialized = true;
    }
    map?.map?.removeAll();
    map?.map?.add(floodHazardGraphicsLayer!);
  });
  
  // Set up tsunami hazard layer
  document.getElementById("tsunami-hazard")?.addEventListener("click", () => {
    map?.map?.removeAll();
    map?.map?.add(tsunamiHazardLayer);
  });
});
```

### Run the application
```bash
npm run dev
```

The application can then be run on `https://localhost:5173`

### Deploy the application
```bash
npm run build
npm run preview
```
