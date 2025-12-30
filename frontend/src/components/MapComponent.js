import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout } from 'react-native-maps';

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

// Get color for a specific day (with robust handling)
const getDayColor = (dayNumber) => {
    const num = Number(dayNumber);
    if (isNaN(num) || num < 1) return DAY_COLORS[0];
    return DAY_COLORS[(num - 1) % DAY_COLORS.length];
};

const MapComponent = ({ itinerary }) => {
    const mapRef = useRef(null);

    // Extract all activities with valid coordinates
    const markers = [];
    const locationsByDay = {};

    if (itinerary) {
        itinerary.forEach((day, dayIndex) => {
            const dayNumber = day.day_number || (dayIndex + 1);
            if (!locationsByDay[dayNumber]) {
                locationsByDay[dayNumber] = [];
            }

            ['morning', 'afternoon', 'evening'].forEach((timeSlot, slotIndex) => {
                if (day[timeSlot]) {
                    day[timeSlot].forEach((activity, actIndex) => {
                        if (activity.coordinates && activity.coordinates.lat && activity.coordinates.lng) {
                            const coordinate = {
                                latitude: activity.coordinates.lat,
                                longitude: activity.coordinates.lng
                            };

                            markers.push({
                                id: `${dayIndex}-${timeSlot}-${activity.name}`,
                                title: activity.name,
                                description: `Day ${dayNumber} - ${timeSlot}`,
                                coordinate,
                                pinColor: getDayColor(dayNumber),
                                dayNumber
                            });

                            locationsByDay[dayNumber].push({
                                coordinate,
                                slotIndex,
                                actIndex
                            });
                        }
                    });
                }
            });
        });
    }

    // Sort locations within each day by time slot order, then by activity index
    Object.keys(locationsByDay).forEach(day => {
        locationsByDay[day].sort((a, b) => {
            if (a.slotIndex !== b.slotIndex) return a.slotIndex - b.slotIndex;
            return a.actIndex - b.actIndex;
        });
    });

    useEffect(() => {
        if (markers.length > 0 && mapRef.current) {
            mapRef.current.fitToCoordinates(markers.map(m => m.coordinate), {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }
    }, [itinerary]);

    if (markers.length === 0) {
        return (
            <View style={[styles.container, styles.emptyContainer]}>
                <Text>No map data available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                // provider={PROVIDER_GOOGLE}  // Commented out to fallback to default (Apple Maps on iOS, Google on Android with config) to strictly avoid crashing if config missing
                initialRegion={{
                    latitude: markers[0].coordinate.latitude,
                    longitude: markers[0].coordinate.longitude,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                }}
            >
                {/* Draw polylines connecting locations for each day */}
                {Object.entries(locationsByDay)
                    .filter(([day, dayLocations]) => dayLocations.length >= 2)
                    .map(([day, dayLocations]) => (
                        <Polyline
                            key={`polyline-day-${day}`}
                            coordinates={dayLocations.map(loc => loc.coordinate)}
                            strokeColor={getDayColor(parseInt(day)) || '#666666'}
                            strokeWidth={4}
                        />
                    ))}

                {/* Draw markers for each location */}
                {markers.map((marker, index) => (
                    <Marker
                        key={index}
                        coordinate={marker.coordinate}
                        title={marker.title}
                        description={marker.description}
                        pinColor={marker.pinColor}
                    />
                ))}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 300,
        width: '100%',
        marginBottom: 10,
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});

export default MapComponent;
