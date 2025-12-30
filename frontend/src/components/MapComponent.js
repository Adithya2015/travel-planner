import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';

const MapComponent = ({ itinerary }) => {
    const mapRef = useRef(null);

    // Extract all activities with valid coordinates
    const markers = [];
    if (itinerary) {
        itinerary.forEach((day, dayIndex) => {
            ['morning', 'afternoon', 'evening'].forEach(timeSlot => {
                if (day[timeSlot]) {
                    day[timeSlot].forEach(activity => {
                        if (activity.coordinates && activity.coordinates.lat && activity.coordinates.lng) {
                            markers.push({
                                id: `${dayIndex}-${timeSlot}-${activity.name}`,
                                title: activity.name,
                                description: `Day ${day.day_number} - ${timeSlot}`,
                                coordinate: {
                                    latitude: activity.coordinates.lat,
                                    longitude: activity.coordinates.lng
                                },
                                pinColor: timeSlot === 'morning' ? 'green' : (timeSlot === 'afternoon' ? 'orange' : 'blue')
                            });
                        }
                    });
                }
            });
        });
    }

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
