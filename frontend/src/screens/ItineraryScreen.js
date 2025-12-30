import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert, Linking, TouchableOpacity } from 'react-native';
import { Text, Title, Paragraph, List, Button, Divider, TextInput as PaperInput, ActivityIndicator } from 'react-native-paper';
import { generatePlan, modifyPlan } from '../services/api';
import MapComponent from '../components/MapComponent';
import DetailedItineraryView from '../components/DetailedItineraryView';

const INITIAL_PLAN = {
    plan_type: "planning",
    summary: "Hello! I'm your AI travel assistant. To create your perfect trip, please tell me:\n\n1. Where would you like to go?\n2. What are your travel dates?\n3. How many days is your trip?\n4. What are your interests? (e.g., history, food, adventure, art, relaxation)\n\nShare as much as you'd like and we'll build your ideal itinerary together!",
    itinerary: [],
    destination: null,
    start_date: null,
    end_date: null,
    duration_days: 0
};

const ItineraryScreen = ({ route, navigation }) => {
    const [plan, setPlan] = useState(route?.params?.plan || INITIAL_PLAN);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(!route?.params?.plan);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isFinalized, setIsFinalized] = useState(false);
    const chatScrollRef = useRef(null);

    // Auto-scroll to bottom when chat history changes
    useEffect(() => {
        if (chatScrollRef.current) {
            setTimeout(() => {
                chatScrollRef.current.scrollToEnd?.({ animated: true });
            }, 100);
        }
    }, [chatHistory]);

    // Update finalized state when plan changes
    useEffect(() => {
        setIsFinalized(plan.plan_type === 'finalized');
    }, [plan.plan_type]);

    // Fetch initial plan on mount if not passed via route
    useEffect(() => {
        const initializePlan = async () => {
            if (!route?.params?.plan) {
                try {
                    const response = await generatePlan({
                        destination: null,
                        start_date: null,
                        end_date: null,
                        interest_categories: [],
                        activity_level: 'moderate'
                    });
                    if (response.success && response.plan) {
                        setPlan(response.plan);
                        if (response.plan.summary) {
                            setChatHistory([{ role: 'assistant', content: response.plan.summary }]);
                        }
                    }
                } catch (error) {
                    console.error('Failed to initialize plan:', error);
                } finally {
                    setInitializing(false);
                }
            } else {
                if (plan.summary) {
                    setChatHistory([{ role: 'assistant', content: plan.summary }]);
                }
                setInitializing(false);
            }
        };
        initializePlan();
    }, []);

    const handleModify = async () => {
        if (!chatInput.trim()) return;

        const userMessage = chatInput;
        setChatInput('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);

        setLoading(true);
        try {
            const payload = {
                current_plan: plan,
                user_message: userMessage,
                conversation_history: chatHistory
            };

            const response = await modifyPlan(payload);

            if (response.success && response.plan) {
                setPlan(response.plan);
                setChatHistory(prev => [
                    ...prev,
                    { role: 'assistant', content: response.message || response.plan.summary || 'Updated!' }
                ]);
            } else {
                setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
            }
        } catch (error) {
            console.error(error);
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Error connecting to server.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async () => {
        if (!plan.itinerary || plan.itinerary.length === 0) {
            Alert.alert("Not Ready", "Please complete your itinerary first by chatting with the assistant.");
            return;
        }

        setLoading(true);
        try {
            const response = await modifyPlan({
                current_plan: plan,
                user_message: "",
                conversation_history: chatHistory,
                finalize: true
            });

            if (response.success && response.plan) {
                setPlan(response.plan);
                setChatHistory(prev => [
                    ...prev,
                    { role: 'assistant', content: "Your itinerary is finalized! Scroll down to see the detailed day-by-day plan with all the information you need." }
                ]);
            } else {
                Alert.alert("Error", "Failed to finalize itinerary. Please try again.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to finalize itinerary. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10 }}>Starting your planning session...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.mainContent}>
                {/* Left Panel: Map + Finalize Button + Detailed Itinerary */}
                <ScrollView style={styles.leftPanel} contentContainerStyle={styles.leftPanelContent}>
                    <View style={styles.mapContainer}>
                        {plan.itinerary && <MapComponent itinerary={plan.itinerary} />}
                    </View>

                    {/* Finalize Button - below map, only when not finalized and has itinerary */}
                    {!isFinalized && plan.itinerary && plan.itinerary.length > 0 && (
                        <Button
                            mode="contained"
                            onPress={handleFinalize}
                            loading={loading}
                            disabled={loading}
                            style={styles.finalizeButton}
                        >
                            Finalize Itinerary
                        </Button>
                    )}

                    {/* Detailed Itinerary View - only when finalized */}
                    {isFinalized && plan.itinerary && plan.itinerary.length > 0 && (
                        <DetailedItineraryView itinerary={plan.itinerary} />
                    )}
                </ScrollView>

                {/* Right Panel: Chat */}
                <View style={styles.chatPanel}>
                    {/* Header - fixed at top */}
                    <View style={styles.chatHeader}>
                        <Title style={styles.headerTitle}>{plan.destination || 'Planning Your Trip'}</Title>
                        {plan.start_date && plan.end_date ? (
                            <Paragraph>{plan.start_date} - {plan.end_date}</Paragraph>
                        ) : (
                            <Paragraph>Dates to be decided</Paragraph>
                        )}
                        {isFinalized && (
                            <Text style={styles.finalizedBadge}>Finalized</Text>
                        )}
                    </View>

                    {/* Scrollable Chat Content */}
                    <ScrollView
                        ref={chatScrollRef}
                        style={styles.chatScroll}
                        contentContainerStyle={styles.chatContent}
                    >
                        {/* Chat History */}
                        <View style={styles.conversation}>
                            {chatHistory.map((msg, idx) => (
                                <View key={idx} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                                    <Text style={msg.role === 'user' ? styles.userText : styles.assistantText}>{msg.content}</Text>
                                </View>
                            ))}
                            {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
                        </View>

                        {/* Draft Itinerary Accordion - only when not finalized */}
                        {!isFinalized && plan.itinerary && plan.itinerary.length > 0 && (
                            <>
                                <Divider style={styles.divider} />
                                <Title style={styles.sectionTitle}>Draft Itinerary</Title>
                                {plan.itinerary.map((day, index) => (
                                    <List.Accordion
                                        key={index}
                                        title={`Day ${day.day_number}: ${day.date}`}
                                        left={props => <List.Icon {...props} icon="calendar" />}
                                        style={styles.accordion}
                                    >
                                        <View style={styles.dayContent}>
                                            {['morning', 'afternoon', 'evening'].map(slot => (
                                                <View key={slot}>
                                                    <Text style={styles.timeSlot}>{slot.charAt(0).toUpperCase() + slot.slice(1)}</Text>
                                                    {day[slot]?.map((act, i) => (
                                                        act.place_id ? (
                                                            <TouchableOpacity
                                                                key={`${slot}-${i}`}
                                                                onPress={() => Linking.openURL(`https://www.google.com/maps/place/?q=place_id:${act.place_id}`)}
                                                            >
                                                                <Paragraph style={styles.placeLink}>• {act.name}</Paragraph>
                                                            </TouchableOpacity>
                                                        ) : (
                                                            <Paragraph key={`${slot}-${i}`}>• {act.name}</Paragraph>
                                                        )
                                                    ))}
                                                    <Divider style={styles.divider} />
                                                </View>
                                            ))}
                                        </View>
                                    </List.Accordion>
                                ))}
                            </>
                        )}
                    </ScrollView>

                    {/* Chat Input - fixed at bottom */}
                    <View style={styles.inputArea}>
                        <PaperInput
                            mode="outlined"
                            value={chatInput}
                            onChangeText={setChatInput}
                            placeholder="Type your message..."
                            style={styles.chatInput}
                            onSubmitEditing={handleModify}
                        />
                        <Button
                            mode="contained"
                            onPress={handleModify}
                            loading={loading}
                            disabled={loading}
                            style={styles.sendButton}
                        >
                            Send
                        </Button>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
    },
    mainContent: {
        flex: 1,
        flexDirection: 'row',
        minHeight: 0,
        overflow: 'hidden',
    },
    leftPanel: {
        flex: 0.6,
        overflow: 'auto',
        minHeight: 0,
    },
    leftPanelContent: {
        flexGrow: 1,
    },
    mapContainer: {
        height: 600,
        minHeight: 500,
    },
    chatPanel: {
        flex: 0.4,
        backgroundColor: '#fff',
        borderLeftWidth: 1,
        borderLeftColor: '#e0e0e0',
        position: 'relative',
    },
    chatHeader: {
        padding: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        alignItems: 'center',
        backgroundColor: '#fff',
        height: 80,
    },
    chatScroll: {
        position: 'absolute',
        top: 80,
        bottom: 70,
        left: 0,
        right: 0,
        overflow: 'auto',
    },
    chatContent: {
        padding: 15,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    conversation: {
        marginBottom: 20,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 15,
        marginBottom: 10,
        maxWidth: '85%',
    },
    userBubble: {
        backgroundColor: '#0084ff',
        alignSelf: 'flex-end',
    },
    assistantBubble: {
        backgroundColor: '#e4e6eb',
        alignSelf: 'flex-start',
    },
    userText: {
        color: '#fff',
    },
    assistantText: {
        color: '#1c1e21',
    },
    inputArea: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 70,
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    chatInput: {
        flex: 1,
        marginRight: 10,
        backgroundColor: '#f0f2f5',
    },
    sendButton: {
        borderRadius: 20,
    },
    finalizeButton: {
        margin: 15,
        backgroundColor: '#1f77b4',
    },
    finalizedBadge: {
        backgroundColor: '#4CAF50',
        color: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 8,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    accordion: {
        backgroundColor: '#fafafa',
        marginBottom: 2,
        borderRadius: 8,
    },
    dayContent: {
        padding: 15,
    },
    timeSlot: {
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
        color: '#1f77b4',
    },
    divider: {
        marginVertical: 10,
    },
    placeLink: {
        color: '#1a73e8',
        textDecorationLine: 'underline',
    },
});

export default ItineraryScreen;
