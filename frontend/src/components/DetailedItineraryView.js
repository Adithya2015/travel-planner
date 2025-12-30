import React from 'react';
import { View, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Paragraph, Chip, Divider } from 'react-native-paper';

const DetailedItineraryView = ({ itinerary }) => {
    const getGoogleMapsUrl = (coords, name) => {
        if (!coords?.lat || !coords?.lng) return null;
        return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
    };

    const openLink = (url) => {
        if (url) {
            Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
        }
    };

    const getTimeSlotIcon = (slot) => {
        switch (slot) {
            case 'morning': return 'weather-sunny';
            case 'afternoon': return 'white-balance-sunny';
            case 'evening': return 'weather-night';
            default: return 'clock';
        }
    };

    const getTimeSlotColor = (slot) => {
        switch (slot) {
            case 'morning': return '#FFA726';
            case 'afternoon': return '#FF7043';
            case 'evening': return '#5C6BC0';
            default: return '#1f77b4';
        }
    };

    if (!itinerary || itinerary.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Title style={styles.mainTitle}>Your Finalized Itinerary</Title>
            <Paragraph style={styles.subtitle}>
                Click on "View on Maps" to open locations in Google Maps
            </Paragraph>

            {itinerary.map((day, dayIdx) => (
                <Card key={dayIdx} style={styles.dayCard}>
                    <Card.Content>
                        <View style={styles.dayHeader}>
                            <Title style={styles.dayTitle}>Day {day.day_number}</Title>
                            <Text style={styles.dayDate}>{day.date}</Text>
                        </View>

                        {['morning', 'afternoon', 'evening'].map(slot => {
                            const activities = day[slot];
                            if (!activities || activities.length === 0) return null;

                            return (
                                <View key={slot} style={styles.slotSection}>
                                    <View style={styles.slotHeader}>
                                        <Chip
                                            icon={getTimeSlotIcon(slot)}
                                            style={[styles.slotChip, { backgroundColor: getTimeSlotColor(slot) }]}
                                            textStyle={styles.slotChipText}
                                        >
                                            {slot.charAt(0).toUpperCase() + slot.slice(1)}
                                        </Chip>
                                    </View>

                                    {activities.map((activity, actIdx) => (
                                        <View key={actIdx} style={styles.activityCard}>
                                            <Text style={styles.activityName}>{activity.name}</Text>

                                            {activity.time && (
                                                <Text style={styles.activityTime}>{activity.time}</Text>
                                            )}

                                            {activity.description && (
                                                <Paragraph style={styles.activityDescription}>
                                                    {activity.description}
                                                </Paragraph>
                                            )}

                                            <View style={styles.metaRow}>
                                                {activity.duration && (
                                                    <Chip icon="clock-outline" style={styles.metaChip} textStyle={styles.metaChipText}>
                                                        {activity.duration}
                                                    </Chip>
                                                )}
                                                {activity.cost !== undefined && activity.cost !== null && (
                                                    <Chip icon="currency-usd" style={styles.metaChip} textStyle={styles.metaChipText}>
                                                        ${activity.cost}
                                                    </Chip>
                                                )}
                                                {activity.rating && (
                                                    <Chip icon="star" style={styles.metaChip} textStyle={styles.metaChipText}>
                                                        {activity.rating}
                                                    </Chip>
                                                )}
                                            </View>

                                            {activity.practical_tips && (
                                                <View style={styles.tipsBox}>
                                                    <Text style={styles.tipsLabel}>Tip:</Text>
                                                    <Text style={styles.tipsText}>{activity.practical_tips}</Text>
                                                </View>
                                            )}

                                            {activity.coordinates && (
                                                <TouchableOpacity
                                                    onPress={() => openLink(getGoogleMapsUrl(activity.coordinates, activity.name))}
                                                    style={styles.mapLink}
                                                >
                                                    <Text style={styles.mapLinkText}>View on Maps</Text>
                                                </TouchableOpacity>
                                            )}

                                            {actIdx < activities.length - 1 && (
                                                <Divider style={styles.activityDivider} />
                                            )}
                                        </View>
                                    ))}
                                </View>
                            );
                        })}
                    </Card.Content>
                </Card>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 15,
        backgroundColor: '#f5f5f5',
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 5,
    },
    subtitle: {
        color: '#666',
        marginBottom: 20,
        fontSize: 14,
    },
    dayCard: {
        marginBottom: 20,
        borderRadius: 12,
        elevation: 2,
        backgroundColor: '#fff',
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    dayTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f77b4',
    },
    dayDate: {
        fontSize: 14,
        color: '#666',
    },
    slotSection: {
        marginBottom: 15,
    },
    slotHeader: {
        marginBottom: 10,
    },
    slotChip: {
        alignSelf: 'flex-start',
    },
    slotChipText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    activityCard: {
        paddingLeft: 10,
        marginBottom: 10,
    },
    activityName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    activityTime: {
        fontSize: 13,
        color: '#1f77b4',
        marginBottom: 6,
    },
    activityDescription: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    metaChip: {
        backgroundColor: '#e8f4fd',
        height: 28,
    },
    metaChipText: {
        fontSize: 12,
        color: '#1f77b4',
    },
    tipsBox: {
        backgroundColor: '#fff8e1',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tipsLabel: {
        fontWeight: 'bold',
        color: '#f57c00',
        marginRight: 5,
    },
    tipsText: {
        flex: 1,
        color: '#5d4037',
        fontSize: 13,
    },
    mapLink: {
        backgroundColor: '#1f77b4',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginTop: 5,
    },
    mapLinkText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    activityDivider: {
        marginTop: 15,
        marginBottom: 10,
    },
});

export default DetailedItineraryView;
