import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
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
            ['morning', 'afternoon', 'evening'].forEach(slot => {
                if (day[slot]) {
                    day[slot].forEach(act => {
                        if (act.coordinates && act.coordinates.lat) {
                            locations.push({
                                name: act.name,
                                lat: act.coordinates.lat,
                                lng: act.coordinates.lng,
                                slot: slot,
                                day: day.day_number,
                                desc: `Day ${day.day_number} - ${slot}`
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

// Inner component that renders after API is loaded
const GoogleMapContent = ({ apiKey, locations, itinerary }) => {
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [map, setMap] = useState(null);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey
    });

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

    // Get marker color based on time slot (only call when API is loaded)
    const getMarkerIcon = (slot) => {
        const colors = {
            morning: '#4CAF50',   // green
            afternoon: '#FF9800', // orange
            evening: '#2196F3'    // blue
        };
        return {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: colors[slot] || '#F44336',
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
            {locations.map((loc, idx) => (
                <Marker
                    key={idx}
                    position={{ lat: loc.lat, lng: loc.lng }}
                    icon={getMarkerIcon(loc.slot)}
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
        height: 400,
        width: '100%',
        marginBottom: 15,
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
