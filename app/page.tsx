"use client";

import { useEffect, useState } from "react";
import Dots from "@/components/home/Dots";
import Menu from "@/components/home/Menu";

import {
  Coordinate,
  getMapData,
  MapData,
  show3dMap,
} from "@mappedin/mappedin-js";
import "@mappedin/mappedin-js/lib/index.css";
import { useRestaurant } from "@/lib/supabase/useRestaurant";
import { createSupabaseClient } from "@/lib/supabase/client";
const supabase = createSupabaseClient();
interface CustomerData {
  restaurant: string;
  count: number;
}
const options = {
  key: process.env.NEXT_PUBLIC_MAPPEDIN_KEY,
  secret: process.env.NEXT_PUBLIC_MAPPEDIN_SECRET!,
  mapId: "673531dfeadd0a000b15f06c",
};

export default function Home() {
  const { getLatestCustomers } = useRestaurant();
  const [mapDat, setMapDat] = useState<MapData>();
  const [count, setCount] = useState<number>(0); // Initialize count

  useEffect(() => {
    getLatestCustomers().then((data) => setCount(data[0].count));

    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT", //from updated
          schema: "public",
          table: "customersRealTime", //new db
        },
        (payload: any) => {
          console.log("Received payload:", payload);
          const updatedData: CustomerData = payload.new;
          setCount(updatedData.count);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const mapData = await getMapData(options);
        const mapView = await show3dMap(
          document.getElementById("mappedin-map") as HTMLDivElement,
          mapData
        );

        setMapDat(mapData);

        const centerCoordinate = new Coordinate(43.47137392, -80.54522914);

        mapView.Camera.set({
          center: centerCoordinate,
          zoomLevel: 21.2,
        });

        const newCord = new Coordinate(43.47137392, -80.54522914);
        mapView.Labels.add(newCord, "", {
          appearance: {
            marker: {
              foregroundColor: { active: "blue", inactive: "blue" },
              iconSize: 10,
            },
          },
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
      {/* <Dots /> */}
      <div id="mappedin-map" className="absolute top-0 left-0 w-full h-full" />
    </div>
  );
}
