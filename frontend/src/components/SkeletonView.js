import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Chip } from 'react-native-paper';

const SkeletonView = ({ skeleton, tripInfo, expandedDays, currentExpandDay, onExpandDay }) => {
    if (!skeleton || !skeleton.days || skeleton.days.length === 0) {
        return null;
    }

    const isExpanded = (dayNumber) => {
        return expandedDays && expandedDays[dayNumber];
    };

    const isCurrent = (dayNumber) => {
        return dayNumber === currentExpandDay;
    };

    const getDayStatus = (dayNumber) => {
        if (isExpanded(dayNumber)) return 'expanded';
        if (isCurrent(dayNumber)) return 'current';
        return 'pending';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'expanded': return '#4CAF50';
            case 'current': return '#1f77b4';
            case 'pending': return '#9e9e9e';
            default: return '#9e9e9e';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'expanded': return 'Planned';
            case 'current': return 'Planning';
            case 'pending': return 'Pending';
            default: return 'Pending';
        }
    };

    return (
        <View style={styles.container}>
            <Title style={styles.mainTitle}>Trip Overview</Title>
            {tripInfo && (
                <View style={styles.tripInfoRow}>
                    <Text style={styles.tripInfoText}>
                        {tripInfo.destination} | {tripInfo.durationDays} days
                    </Text>
                    <Text style={styles.tripDates}>
                        {tripInfo.startDate} to {tripInfo.endDate}
                    </Text>
                </View>
            )}

            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${(Object.keys(expandedDays || {}).length / skeleton.days.length) * 100}%` }
                    ]}
                />
            </View>
            <Text style={styles.progressText}>
                {Object.keys(expandedDays || {}).length} of {skeleton.days.length} days planned
            </Text>

            {skeleton.days.map((day) => {
                const status = getDayStatus(day.dayNumber);
                const statusColor = getStatusColor(status);

                return (
                    <TouchableOpacity
                        key={day.dayNumber}
                        onPress={() => onExpandDay && onExpandDay(day.dayNumber)}
                        activeOpacity={0.7}
                    >
                        <Card style={[styles.dayCard, isCurrent(day.dayNumber) && styles.currentDayCard]}>
                            <Card.Content>
                                <View style={styles.dayHeader}>
                                    <View style={styles.dayTitleRow}>
                                        <Title style={styles.dayTitle}>Day {day.dayNumber}</Title>
                                        <Chip
                                            style={[styles.statusChip, { backgroundColor: statusColor }]}
                                            textStyle={styles.statusChipText}
                                        >
                                            {getStatusLabel(status)}
                                        </Chip>
                                    </View>
                                    <Text style={styles.dayDate}>{day.date}</Text>
                                </View>

                                <Text style={styles.themeText}>{day.theme}</Text>

                                <View style={styles.highlightsContainer}>
                                    {day.highlights.map((highlight, idx) => (
                                        <View key={idx} style={styles.highlightItem}>
                                            <Text style={styles.bulletPoint}>•</Text>
                                            <Text style={styles.highlightText}>{highlight}</Text>
                                        </View>
                                    ))}
                                </View>

                                {isExpanded(day.dayNumber) && expandedDays[day.dayNumber] && (
                                    <View style={styles.expandedSection}>
                                        <View style={styles.expandedHeader}>
                                            <Text style={styles.expandedLabel}>Today's Plan:</Text>
                                        </View>

                                        {/* Breakfast */}
                                        {expandedDays[day.dayNumber].breakfast && (
                                            <View style={styles.mealItem}>
                                                <Text style={styles.mealIcon}>🍳</Text>
                                                <View style={styles.mealInfo}>
                                                    <Text style={styles.mealName}>{expandedDays[day.dayNumber].breakfast.name}</Text>
                                                    <Text style={styles.mealTime}>{expandedDays[day.dayNumber].breakfast.timeSlot}</Text>
                                                </View>
                                            </View>
                                        )}

                                        {/* Morning Activities */}
                                        {expandedDays[day.dayNumber].morning?.map((act, idx) => (
                                            <View key={`morning-${idx}`} style={styles.activityItem}>
                                                <Text style={styles.activityIcon}>🌅</Text>
                                                <View style={styles.activityInfo}>
                                                    <Text style={styles.activityName}>{act.name}</Text>
                                                    <Text style={styles.activityTime}>{act.time}</Text>
                                                </View>
                                            </View>
                                        ))}

                                        {/* Lunch */}
                                        {expandedDays[day.dayNumber].lunch && (
                                            <View style={styles.mealItem}>
                                                <Text style={styles.mealIcon}>🍽️</Text>
                                                <View style={styles.mealInfo}>
                                                    <Text style={styles.mealName}>{expandedDays[day.dayNumber].lunch.name}</Text>
                                                    <Text style={styles.mealTime}>{expandedDays[day.dayNumber].lunch.timeSlot}</Text>
                                                </View>
                                            </View>
                                        )}

                                        {/* Afternoon Activities */}
                                        {expandedDays[day.dayNumber].afternoon?.map((act, idx) => (
                                            <View key={`afternoon-${idx}`} style={styles.activityItem}>
                                                <Text style={styles.activityIcon}>☀️</Text>
                                                <View style={styles.activityInfo}>
                                                    <Text style={styles.activityName}>{act.name}</Text>
                                                    <Text style={styles.activityTime}>{act.time}</Text>
                                                </View>
                                            </View>
                                        ))}

                                        {/* Dinner */}
                                        {expandedDays[day.dayNumber].dinner && (
                                            <View style={styles.mealItem}>
                                                <Text style={styles.mealIcon}>🍷</Text>
                                                <View style={styles.mealInfo}>
                                                    <Text style={styles.mealName}>{expandedDays[day.dayNumber].dinner.name}</Text>
                                                    <Text style={styles.mealTime}>{expandedDays[day.dayNumber].dinner.timeSlot}</Text>
                                                </View>
                                            </View>
                                        )}

                                        {/* Evening Activities */}
                                        {expandedDays[day.dayNumber].evening?.map((act, idx) => (
                                            <View key={`evening-${idx}`} style={styles.activityItem}>
                                                <Text style={styles.activityIcon}>🌙</Text>
                                                <View style={styles.activityInfo}>
                                                    <Text style={styles.activityName}>{act.name}</Text>
                                                    <Text style={styles.activityTime}>{act.time}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                );
            })}
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
    tripInfoRow: {
        marginBottom: 15,
    },
    tripInfoText: {
        fontSize: 16,
        color: '#1f77b4',
        fontWeight: '600',
    },
    tripDates: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginBottom: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 15,
    },
    dayCard: {
        marginBottom: 12,
        borderRadius: 12,
        elevation: 2,
        backgroundColor: '#fff',
    },
    currentDayCard: {
        borderWidth: 2,
        borderColor: '#1f77b4',
    },
    dayHeader: {
        marginBottom: 10,
    },
    dayTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dayTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f77b4',
    },
    statusChip: {
        height: 24,
    },
    statusChipText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    dayDate: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    themeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    highlightsContainer: {
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 8,
    },
    highlightItem: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    bulletPoint: {
        color: '#1f77b4',
        marginRight: 8,
        fontSize: 14,
    },
    highlightText: {
        fontSize: 14,
        color: '#555',
        flex: 1,
    },
    expandedSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    expandedHeader: {
        marginBottom: 10,
    },
    expandedLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    mealItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: '#fff8e1',
        borderRadius: 8,
        marginBottom: 6,
    },
    mealIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    mealInfo: {
        flex: 1,
    },
    mealName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    mealTime: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        marginBottom: 6,
    },
    activityIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    activityInfo: {
        flex: 1,
    },
    activityName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    activityTime: {
        fontSize: 12,
        color: '#1f77b4',
        marginTop: 2,
    },
});

export default SkeletonView;
