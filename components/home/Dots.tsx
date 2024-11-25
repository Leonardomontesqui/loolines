"use client";
import React, { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRestaurant } from "@/lib/supabase/useRestaurant";

const supabase = createSupabaseClient();

export default function Dots() {
  const { getLatestCustomers } = useRestaurant();
  const [count, setCount] = useState<number>(0);
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    // Fetch initial count
    getLatestCustomers().then((data) => {
      if (data && data.length > 0) {
        const customerCount = Math.min(data[0].customers, 50);
        setCount(customerCount);
        generateRandomPositions(customerCount);
      }
    });

    // Subscribe to real-time updates
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "customersAtRestaurantsV2",
        },
        (payload: any) => {
          const updatedCount = Math.min(payload.new.customers, 50);
          setCount(updatedCount);
          generateRandomPositions(updatedCount);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Generate random positions for dots
  const generateRandomPositions = (dotCount: number) => {
    const newPositions = Array.from({ length: dotCount }, () => ({
      x: Math.random() * 100, // Random percentage for X
      y: Math.random() * 100, // Random percentage for Y
    }));
    setPositions(newPositions);
  };

  return (
    <div className="absolute inset-0">
      {positions.map((pos, index) => (
        <div
          key={index}
          className="absolute border-green-500 bg-green-700 rounded-full"
          style={{
            width: "20px",
            height: "20px",
            left: `${pos.x}%`,
            top: `${pos.y}%`,
          }}
        />
      ))}
    </div>
  );
}