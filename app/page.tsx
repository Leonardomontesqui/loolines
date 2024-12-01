"use client";

import { useEffect } from "react";
import Dots from "@/components/home/Dots";
import Menu from "@/components/home/Menu";

import { Coordinate, getMapData, show3dMap } from "@mappedin/mappedin-js";
import "@mappedin/mappedin-js/lib/index.css";

const options = {
  key: process.env.NEXT_PUBLIC_MAPPEDIN_KEY,
  secret: process.env.NEXT_PUBLIC_MAPPEDIN_SECRET!,
  mapId: "673531dfeadd0a000b15f06c",
};

export default function Home() {
  useEffect(() => {
    async function init() {
      try {
        const mapData = await getMapData(options);
        const mapView = await show3dMap(
          document.getElementById("mappedin-map") as HTMLDivElement,
          mapData
        );

        const centerCoordinate = new Coordinate(43.47137392, -80.54522914);

        mapView.Camera.set({
          center: centerCoordinate,
          zoomLevel: 21.2,
        });
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }

    init();
  }, []);

  return (
    <div className="w-full h-screen relative">
      <Menu />
      <Dots />
      <div id="mappedin-map" className="absolute top-0 left-0 w-full h-full" />
    </div>
  );
}
