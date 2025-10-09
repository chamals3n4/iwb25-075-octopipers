"use client";
import { useState, useEffect } from "react";
import { SearchBox } from "@mapbox/search-js-react";
import mapboxgl from "mapbox-gl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, X, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

// Initialize mapboxgl only on client side to avoid SSR issues
let mapboxAccessToken = "";
if (typeof window !== 'undefined') {
  mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
}

export default function LocationSelector({ onLocationSet, currentLocation }) {
  const [userLocation, setUserLocation] = useState(currentLocation || null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  // Log component mount and session data
  useEffect(() => {
    console.log(" LocationSelector component mounted");
    console.log("  Current location:", currentLocation);
    console.log("  Session exists:", !!session);
    console.log("  Session user:", session?.user);
    console.log("  Access token exists:", !!session?.access_token);
    console.log("  Mapbox access token exists:", !!mapboxAccessToken);
    console.log("  Mapbox access token:", mapboxAccessToken ? mapboxAccessToken.substring(0, 20) + "..." : "NOT SET");
  }, [session, currentLocation]);

  const handleLocationSelect = (result) => {
    console.log(" Location selected from mapbox:");
    console.log("  Raw result:", result);

    const { coordinates } = result.features[0].geometry;
    const location = {
      cityName: result.features[0].place_name,
      latitude: coordinates[1],
      longitude: coordinates[0],
    };

    console.log(" Processed location data:");
    console.log("  City Name:", location.cityName);
    console.log("  Latitude:", location.latitude);
    console.log("  Longitude:", location.longitude);

    setUserLocation(location);
    console.log(" Location state updated");
  };

  const saveLocation = async () => {
    console.log("=== LOCATION SAVER START ===");
    console.log("User location:", userLocation);
    console.log("Session access token exists:", !!session?.access_token);

    if (!userLocation || !session?.access_token) {
      console.log(" Missing required data - userLocation:", !!userLocation, "access_token:", !!session?.access_token);
      return;
    }

    // Check if cityName is missing and provide a fallback
    if (!userLocation.cityName) {
      console.log(" City name is missing, using coordinates as fallback");
      userLocation.cityName = `Location (${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)})`;
      console.log(" Updated city name:", userLocation.cityName);
    }

    try {
      setIsLoading(true);
      
      // Decode the JWT token to get the user ID (sub field)
      console.log(" Decoding JWT token...");
      const tokenPayload = JSON.parse(atob(session.access_token.split('.')[1]));
      const userId = tokenPayload.sub;
      console.log(" User ID extracted:", userId);

      const requestData = {
        cityName: userLocation.cityName,
        cityLatitude: userLocation.latitude,
        cityLongitude: userLocation.longitude,
      };

      console.log(" Sending request to backend:");
      console.log("  URL: http://localhost:8080/api/users/" + userId);
      console.log("  Method: PUT");
      console.log("  Data:", JSON.stringify(requestData, null, 2));
      console.log("  Headers:", {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + session.access_token.substring(0, 20) + "..."
      });
      console.log(" Debugging user ID:");
      console.log("  JWT sub (user ID):", userId);
      console.log("  JWT full payload:", JSON.stringify(tokenPayload, null, 2));

      const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestData),
      });

      console.log(" Backend response received:");
      console.log("  Status:", response.status);
      console.log("  Status Text:", response.statusText);
      console.log("  OK:", response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log(" Location saved successfully!");
        console.log("  Response data:", JSON.stringify(responseData, null, 2));
        onLocationSet?.(userLocation);
      } else {
        const errorData = await response.text();
        console.log(" Failed to save location:");
        console.log("  Status:", response.status);
        console.log("  Error response:", errorData);
      }
    } catch (error) {
      console.log(" Error occurred while saving location:");
      console.log("  Error type:", error.constructor.name);
      console.log("  Error message:", error.message);
      console.log("  Full error:", error);
    } finally {
      setIsLoading(false);
      console.log("=== LOCATION SAVER END ===");
    }
  };

  const clearLocation = () => {
    setUserLocation(null);
    // Optionally, you could also clear the location from the backend
  };

  return (
    <div className="relative z-0">
      <Card className="relative overflow-hidden p-4 space-y-3 bg-card border">
        {/* soft light gradient only in light mode */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:hidden" />
        <div className="relative flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">Set Your Location</h3>
          {userLocation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLocation}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="relative w-full">
          <SearchBox
            accessToken={mapboxAccessToken}
            onRetrieve={(result) => {
              console.log("🔍 Mapbox SearchBox onRetrieve triggered");
              console.log("  Result:", result);
              handleLocationSelect(result);
            }}
            placeholder="Search for your city..."
            options={{
              types: "place,locality",
              language: ["en"],
              limit: 8
            }}
          />
        </div>

        <div className="relative space-y-2">
          {userLocation && (
            <div className="p-2 bg-muted rounded text-sm">
              <p className="font-medium text-foreground">{userLocation.cityName}</p>
              <p className="text-xs text-muted-foreground">
                {userLocation.latitude.toFixed(4)},{" "}
                {userLocation.longitude.toFixed(4)}
              </p>
            </div>
          )}
          <Button
            onClick={() => {
              console.log(" Save Location button clicked");
              console.log("  User location:", userLocation);
              console.log("  Session:", !!session);
              saveLocation();
            }}
            className="w-full"
            disabled={!userLocation || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : userLocation ? (
              "Save Location"
            ) : (
              "Search a city to save"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}