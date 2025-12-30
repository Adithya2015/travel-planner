import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Button, Text, Divider } from 'react-native-paper';
import { generatePlan } from '../services/api';

const HomeScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const payload = {
                destination: null,
                start_date: null,
                end_date: null,
                interest_categories: [],
                activity_level: 'moderate'
            };

            const response = await generatePlan(payload);

            if (response.success && response.plan) {
                navigation.navigate('Itinerary', { plan: response.plan });
            } else {
                Alert.alert('Error', 'Failed to start planning');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text variant="headlineMedium" style={styles.title}>Travel Planner</Text>

            <View style={styles.welcomeContainer}>
                <Text variant="titleMedium" style={styles.welcomeText}>
                    Welcome! Let's plan your next adventure together.
                </Text>
            </View>

            <Divider style={styles.divider} />

            <Button
                mode="contained"
                onPress={handleGenerate}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
            >
                Start Planning with AI
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 20,
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: 'bold',
    },
    welcomeContainer: {
        marginVertical: 40,
        alignItems: 'center',
    },
    welcomeText: {
        textAlign: 'center',
        lineHeight: 28,
        color: '#666',
    },
    divider: {
        marginVertical: 20,
    },
    button: {
        paddingVertical: 10,
        borderRadius: 30,
    },
    buttonContent: {
        height: 50,
    }
});

export default HomeScreen;
