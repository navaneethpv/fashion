"use client";

import { useEffect, useRef, useState } from "react";
import { X, MapPin, Loader2, Navigation } from "lucide-react";

interface LocationPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectLocation: (address: {
        zip: string;
        city: string;
        district: string;
        state: string;
        street: string;
    }) => void;
}

declare global {
    interface Window {
        google: any;
        initMap: () => void;
    }
}

export default function LocationPicker({ isOpen, onClose, onSelectLocation }: LocationPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [mapInstance, setMapInstance] = useState<any>(null);
    const [markerInstance, setMarkerInstance] = useState<any>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Load Google Maps Script
    useEffect(() => {
        if (!isOpen) return;

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            setError("Google Maps API Key is missing");
            setLoading(false);
            return;
        }

        if (window.google && window.google.maps) {
            initMap();
        } else {
            const existingScript = document.getElementById("google-maps-script");
            if (!existingScript) {
                const script = document.createElement("script");
                script.id = "google-maps-script";
                script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
                script.async = true;
                script.defer = true;
                script.onload = () => initMap();
                script.onerror = () => {
                    setError("Failed to load Google Maps");
                    setLoading(false);
                };
                document.body.appendChild(script);
            } else {
                // If script exists but not loaded yet, wait for it
                const checkGoogle = setInterval(() => {
                    if (window.google && window.google.maps) {
                        clearInterval(checkGoogle);
                        initMap();
                    }
                }, 100);
            }
        }
    }, [isOpen]);

    const initMap = () => {
        setLoading(true);
        setError("");

        // Default to India Center
        const defaultCenter = { lat: 20.5937, lng: 78.9629 };

        // Try to get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setCurrentPos(pos);
                    loadMap(pos);
                },
                () => {
                    // Permission denied or error
                    loadMap(defaultCenter);
                }
            );
        } else {
            loadMap(defaultCenter);
        }
    };

    const loadMap = (center: { lat: number; lng: number }) => {
        if (!mapRef.current) return;

        try {
            const map = new window.google.maps.Map(mapRef.current, {
                center,
                zoom: 15,
                disableDefaultUI: true,
                zoomControl: true,
            });

            const marker = new window.google.maps.Marker({
                position: center,
                map,
                draggable: true,
                animation: window.google.maps.Animation.DROP,
            });

            // Update marker position on drag end
            marker.addListener("dragend", () => {
                const pos = marker.getPosition();
                setCurrentPos({ lat: pos.lat(), lng: pos.lng() });
                map.panTo(pos);
            });

            // Update marker on map click
            map.addListener("click", (e: any) => {
                const pos = e.latLng;
                marker.setPosition(pos);
                setCurrentPos({ lat: pos.lat(), lng: pos.lng() });
                map.panTo(pos);
            });

            setMapInstance(map);
            setMarkerInstance(marker);
            setCurrentPos(center);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Error initializing map");
            setLoading(false);
        }
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation || !mapInstance || !markerInstance) return;

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setCurrentPos(pos);
                mapInstance.panTo(pos);
                mapInstance.setZoom(15);
                markerInstance.setPosition(pos);
                setLoading(false);
            },
            () => {
                setLoading(false);
                alert("Could not fetch location.");
            }
        );
    };

    const handleConfirm = async () => {
        if (!currentPos || !window.google) return;
        setConfirming(true);

        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: currentPos });

            if (response.results && response.results.length > 0) {
                const result = response.results[0];
                const components = result.address_components;

                let zip = "";
                let city = "";
                let district = "";
                let state = "";
                let street = "";

                // Map Google Maps components to our fields
                for (const component of components) {
                    const types = component.types;

                    if (types.includes("postal_code")) {
                        zip = component.long_name;
                    }
                    if (types.includes("locality")) {
                        city = component.long_name;
                    }
                    if (types.includes("administrative_area_level_2")) {
                        district = component.long_name;
                    }
                    if (types.includes("administrative_area_level_1")) {
                        state = component.long_name;
                    }
                    // Fallback for district if level 2 is missing
                    if (!district && types.includes("administrative_area_level_3")) {
                        district = component.long_name;
                    }
                }

                // Formatted address as street fallback
                street = result.formatted_address;

                onSelectLocation({ zip, city, district, state, street });
                onClose();
            } else {
                setError("No address found for this location.");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to fetch address details.");
        } finally {
            setConfirming(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            {/* Modal Container */}
            <div
                className={`
                    bg-white w-full 
                    ${isMobile ? "rounded-t-3xl h-[85vh] slide-in-from-bottom" : "max-w-3xl h-[600px] rounded-2xl"}
                    flex flex-col shadow-2xl overflow-hidden relative
                `}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-red-500 fill-current" />
                        Pin Your Location
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Map Area */}
                <div className="flex-1 relative bg-gray-100">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gray-100/80 backdrop-blur-sm">
                            <Loader2 className="w-8 h-8 animate-spin text-black mb-2" />
                            <p className="text-sm font-medium text-gray-600">Loading Map...</p>
                        </div>
                    )}

                    {error ? (
                        <div className="flex items-center justify-center h-full p-6 text-center">
                            <div>
                                <p className="text-red-500 font-bold mb-2">{error}</p>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
                                >
                                    Close & Enter Manually
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div ref={mapRef} className="w-full h-full" />
                    )}

                    {/* Current Location Button */}
                    {!loading && !error && (
                        <button
                            onClick={handleCurrentLocation}
                            className="absolute bottom-24 right-4 sm:bottom-6 sm:right-6 bg-white p-3 rounded-full shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-black transition-all group z-10"
                            title="Use Current Location"
                        >
                            <Navigation className="w-6 h-6 group-active:scale-90 transition-transform" />
                        </button>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-5 border-t border-gray-100 bg-white z-10">
                    <p className="text-xs text-gray-500 mb-3 text-center">
                        Drag the marker to pinpoint your exact delivery location.
                    </p>
                    <button
                        onClick={handleConfirm}
                        disabled={loading || !!error || confirming}
                        className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {confirming ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Fetching Address...
                            </>
                        ) : (
                            "Confirm Location"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
