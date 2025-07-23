import "./style.css";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-expand";
import "@arcgis/map-components/components/arcgis-basemap-gallery";
import "@arcgis/map-components/components/arcgis-placement";

import "@esri/calcite-components/components/calcite-button";

import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";

// Initialize map
const map = document.querySelector("arcgis-map");

// Initialize layers
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
