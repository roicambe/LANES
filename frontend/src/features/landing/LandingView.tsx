"use client";



import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Home, Info, Phone, LogIn, Map as MapIcon, MapPin, ArrowRight } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/Card";

import { Button } from "@/shared/ui/Button";

import { LocationAutocomplete } from "@/shared/ui/LocationAutocomplete";

import type { LocationSuggestion } from "@/features/geocoding/types";
import { getCurrentLocation } from "@/features/geocoding/geocodingApi";



export default function LandingView() {

  const router = useRouter();
  const pathname = usePathname();

  const [locationLabel, setLocationLabel] = useState("");

  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);

  const [pointType, setPointType] = useState<"start" | "end">("start");

  const [isLoading, setIsLoading] = useState(false);



  const handleUseCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const coords = await getCurrentLocation();
      setSelectedCoords(coords);
      setLocationLabel("Current Location");
    } catch (err: any) {
      alert(err.message || "Unable to retrieve your location");
    } finally {
      setIsLoading(false);
    }
  };



  const handleLocationSelect = (suggestion: LocationSuggestion) => {

    setSelectedCoords([suggestion.lng, suggestion.lat]);

    setLocationLabel(suggestion.label);

  };



  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    if (!selectedCoords) {

      return alert("Please select a location from the suggestions or use your current location");

    }



    const [lng, lat] = selectedCoords;

    const params = new URLSearchParams({

      location: `${lng},${lat}`,

      type: pointType,

      label: locationLabel,

    });

    router.push(`/map?${params.toString()}`);

  };



  return (

    <div className="min-h-screen bg-gray-50 flex flex-col">

      <main className="flex-grow flex flex-col lg:flex-row items-center justify-center p-6 md:p-12 gap-8 lg:gap-12 max-w-7xl mx-auto w-full pt-8 lg:pt-24">

        <div className="flex-1 space-y-6 text-center lg:text-left">

          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">

            Navigate Safely <br className="hidden lg:block" /> During Floods

          </h1>

          <p className="text-lg text-gray-600 max-w-lg mx-auto lg:mx-0">

            LANES (Localised Alternative Navigation for Environs under Submersion) helps commuters

            and drivers find safe, flood-free routes in real-time. Enter your location to instantly

            see the safest path to your destination.

          </p>

          <div className="pt-4 flex gap-4 justify-center lg:justify-start">

            <a href="/about" className="text-blue-600 font-semibold hover:underline">

              Learn more about how LANES works <ArrowRight className="inline-block w-4 h-4 ml-1" />

            </a>

          </div>

        </div>



        <div className="flex-1 w-full max-w-md">

          <Card className="w-full shadow-xl border-t-4 border-t-blue-600">

            <CardHeader className="text-center pb-2">

              <CardTitle className="text-xl font-bold">Start Your Journey</CardTitle>

            </CardHeader>

            <CardContent>

              <form onSubmit={handleSubmit} className="space-y-6">

                <div className="space-y-3">

                  <label className="text-sm font-medium text-gray-700">Where are you?</label>



                  <Button

                    type="button"

                    variant="secondary"

                    className="w-full justify-center bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"

                    onClick={handleUseCurrentLocation}

                    disabled={isLoading}

                  >

                    {isLoading ? "Getting location..." : <><MapPin className="inline-block w-4 h-4 mr-2" /> Use My Current Location</>}

                  </Button>



                  <div className="relative flex items-center py-2">

                    <div className="flex-grow border-t border-gray-300"></div>

                    <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">or enter manually</span>

                    <div className="flex-grow border-t border-gray-300"></div>

                  </div>



                  <LocationAutocomplete

                    value={locationLabel}

                    onChange={(value) => {

                      setLocationLabel(value);

                      setSelectedCoords(null);

                    }}

                    onSelect={handleLocationSelect}

                    placeholder="Search for a street or place (e.g. C. Santos)"

                  />

                </div>



                <div className="space-y-3">

                  <label className="text-sm font-medium text-gray-700">Is this location your:</label>

                  <div className="flex gap-4">

                    <label className="flex items-center gap-2 cursor-pointer">

                      <input

                        type="radio"

                        name="pointType"

                        value="start"

                        checked={pointType === "start"}

                        onChange={() => setPointType("start")}

                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"

                      />

                      <span className="text-sm text-gray-900">Starting Point</span>

                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">

                      <input

                        type="radio"

                        name="pointType"

                        value="end"

                        checked={pointType === "end"}

                        onChange={() => setPointType("end")}

                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"

                      />

                      <span className="text-sm text-gray-900">End Point</span>

                    </label>

                  </div>

                </div>



                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md">

                  Go to Map <ArrowRight className="inline-block w-4 h-4 ml-2" />

                </Button>

              </form>

            </CardContent>

          </Card>

        </div>

      </main>



      <footer className="bg-gray-100 py-8 pb-24 sm:pb-8 mt-auto">

        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">

          <p>&copy; {new Date().getFullYear()} LANES Project. All rights reserved.</p>

          <div className="flex gap-4 mt-4 md:mt-0">

            <a href="#" className="hover:text-gray-900">Privacy Policy</a>

            <a href="#" className="hover:text-gray-900">Terms of Service</a>

          </div>

        </div>

      </footer>

    </div>

  );

}

