import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { getConfig } from '../services/api';

const containerStyle = {
    width: '100%',
    height: '100%'
};

const MapComponent = ({ itinerary }) => {
    const [apiKey, setApiKey] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch API key from backend
    useEffect(() => {
        const fetchConfig = async () => {
            const config = await getConfig();
            setApiKey(config.googleMapsApiKey || '');
            setLoading(false);
        };
        fetchConfig();
    }, []);

    // Extract locations from itinerary
    const locations = [];
    if (itinerary) {
        itinerary.forEach((day, dayIndex) => {
            const dayNumber = day.day_number || (dayIndex + 1);
            ['morning', 'afternoon', 'evening'].forEach((slot, slotIndex) => {
                if (day[slot]) {
                    day[slot].forEach((act, actIndex) => {
                        if (act.coordinates && act.coordinates.lat && act.coordinates.lng) {
                            locations.push({
                                name: act.name,
                                lat: act.coordinates.lat,
                                lng: act.coordinates.lng,
                                slot: slot,
                                slotIndex: slotIndex,
                                actIndex: actIndex,
                                day: dayNumber,
                                desc: `Day ${dayNumber} - ${slot}`
                            });
                        }
                    });
                }
            });
        });
    }

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 10 }}>Loading map...</Text>
            </View>
        );
    }

    if (!apiKey) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text>Google Maps API key not configured.</Text>
            </View>
        );
    }

    if (locations.length === 0) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text>No map locations found in itinerary.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <GoogleMapContent apiKey={apiKey} locations={locations} itinerary={itinerary} />
        </View>
    );
};

// Color palette for different days
const DAY_COLORS = [
    '#E53935', // Red
    '#1E88E5', // Blue
    '#43A047', // Green
    '#FB8C00', // Orange
    '#8E24AA', // Purple
    '#00ACC1', // Cyan
    '#FFB300', // Amber
    '#5E35B1', // Deep Purple
    '#D81B60', // Pink
    '#00897B', // Teal
];

// Inner component that renders after API is loaded
const GoogleMapContent = ({ apiKey, locations, itinerary }) => {
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [map, setMap] = useState(null);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey
    });

    // Group locations by day for polylines
    const locationsByDay = {};
    locations.forEach(loc => {
        if (loc.day == null) return; // Skip if day is null/undefined
        if (!locationsByDay[loc.day]) {
            locationsByDay[loc.day] = [];
        }
        locationsByDay[loc.day].push(loc);
    });

    // Sort locations within each day by time slot order, then by activity index
    Object.keys(locationsByDay).forEach(day => {
        locationsByDay[day].sort((a, b) => {
            if (a.slotIndex !== b.slotIndex) return a.slotIndex - b.slotIndex;
            return a.actIndex - b.actIndex;
        });
    });

    // Get color for a specific day (with robust handling)
    const getDayColor = (dayNumber) => {
        const num = Number(dayNumber);
        if (isNaN(num) || num < 1) return DAY_COLORS[0];
        return DAY_COLORS[(num - 1) % DAY_COLORS.length];
    };

    // Fit bounds when map loads
    const onLoad = useCallback((mapInstance) => {
        setMap(mapInstance);
        if (locations.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            locations.forEach(loc => bounds.extend({ lat: loc.lat, lng: loc.lng }));
            mapInstance.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
        }
    }, [locations]);

    // Update bounds when itinerary changes
    useEffect(() => {
        if (map && locations.length > 0 && window.google) {
            const bounds = new window.google.maps.LatLngBounds();
            locations.forEach(loc => bounds.extend({ lat: loc.lat, lng: loc.lng }));
            map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
        }
    }, [map, itinerary]);

    // Get marker icon based on day (only call when API is loaded)
    const getMarkerIcon = (dayNumber) => {
        return {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: getDayColor(dayNumber),
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 10
        };
    };

    if (loadError) {
        return (
            <View style={[styles.innerContainer, styles.center]}>
                <Text>Error loading Google Maps</Text>
            </View>
        );
    }

    if (!isLoaded) {
        return (
            <View style={[styles.innerContainer, styles.center]}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: locations[0].lat, lng: locations[0].lng }}
            zoom={12}
            onLoad={onLoad}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true
            }}
        >
            {/* Draw polylines connecting locations for each day */}
            {Object.entries(locationsByDay)
                .filter(([day, dayLocations]) => dayLocations.length >= 2)
                .map(([day, dayLocations]) => (
                    <Polyline
                        key={`polyline-day-${day}`}
                        path={dayLocations.map(loc => ({ lat: loc.lat, lng: loc.lng }))}
                        options={{
                            strokeColor: getDayColor(parseInt(day)) || '#666666',
                            strokeOpacity: 0.8,
                            strokeWeight: 4
                        }}
                    />
                ))}

            {/* Draw markers for each location */}
            {locations.map((loc, idx) => (
                <Marker
                    key={idx}
                    position={{ lat: loc.lat, lng: loc.lng }}
                    icon={getMarkerIcon(loc.day)}
                    onClick={() => setSelectedMarker(loc)}
                />
            ))}

            {selectedMarker && (
                <InfoWindow
                    position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                    onCloseClick={() => setSelectedMarker(null)}
                >
                    <div style={{ textAlign: 'center', padding: '5px' }}>
                        <strong>{selectedMarker.name}</strong><br />
                        <span style={{ fontSize: '0.9em', color: '#666' }}>{selectedMarker.desc}</span>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
};

const styles = StyleSheet.create({
    container: {
        height: '100%',
        width: '100%',
        minHeight: 500,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: '#f0f0f0'
    },
    innerContainer: {
        height: '100%',
        width: '100%'
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default MapComponent;
