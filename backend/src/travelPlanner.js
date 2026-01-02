const LLMClient = require('./services/llmClient');
const PlacesClient = require('./services/placesClient');
const GeocodingService = require('./services/geocodingService');
const { TravelPlanSchema } = require('./models/travelPlan');

class TravelPlanner {
    constructor() {
        this.llmClient = new LLMClient();
        this.placesClient = new PlacesClient();
        this.geocoding = new GeocodingService();
    }

    async generateTravelPlan(request) {
        try {
            // Calculate duration if dates are present
            let duration = 0;
            if (request.start_date && request.end_date) {
                const start = new Date(request.start_date);
                const end = new Date(request.end_date);
                duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            }

            // Geocode destination if provided
            const destCoords = request.destination ? await this.geocoding.geocode(request.destination) : null;

            // Generate base plan
            const llmPlanData = await this.llmClient.generateTravelPlan({
                ...request,
                duration_days: duration
            });

            // Enrich itinerary with real places
            if (destCoords && llmPlanData.itinerary) {
                llmPlanData.itinerary = await this._enrichItineraryWithPlaces(
                    llmPlanData.itinerary,
                    destCoords
                );
            }

            // Format for final response (and basic validation)
            const formattedPlan = this._formatPlan(llmPlanData, request, duration);

            return formattedPlan;

        } catch (error) {
            console.error("Error inside TravelPlanner:", error);
            throw error;
        }
    }

    async modifyTravelPlan(request) {
        try {
            const { current_plan, user_message, conversation_history, finalize } = request;

            // call LLM to modify
            const result = await this.llmClient.modifyItinerary(
                current_plan,
                user_message,
                conversation_history || [],
                finalize || false
            );

            if (result.success && result.plan) {
                // Geocode destination if needed (though we likely have it, but for enrichment we need coords)
                // We can re-use the destination from the plan
                let destCoords = null;
                if (result.plan.destination) {
                    destCoords = await this.geocoding.geocode(result.plan.destination);
                }

                if (destCoords && result.plan.itinerary) {
                    result.plan.itinerary = await this._enrichItineraryWithPlaces(
                        result.plan.itinerary,
                        destCoords
                    );
                }
            }
            return result;

        } catch (error) {
            console.error("Error inside TravelPlanner modify:", error);
            throw error;
        }
    }

    async _enrichItineraryWithPlaces(itineraryData, destinationCoords) {
        const enrichedItinerary = [];

        for (const dayData of itineraryData) {
            const enrichedDay = { ...dayData };

            for (const timeSlot of ['morning', 'afternoon', 'evening']) {
                if (enrichedDay[timeSlot]) {
                    const enrichedActivities = [];

                    for (const activity of enrichedDay[timeSlot]) {
                        const activityName = activity.name;
                        if (activityName && destinationCoords) {
                            const placeData = await this.placesClient.enrichActivityWithPlaces(
                                activityName,
                                destinationCoords,
                                activity.type === 'attraction' ? 'tourist_attraction' : 'restaurant'
                            );

                            if (placeData) {
                                activity.rating = placeData.rating;
                                activity.location = placeData.vicinity;
                                activity.user_ratings_total = placeData.user_ratings_total;
                                activity.coordinates = placeData.location;
                                activity.place_id = placeData.place_id;
                            }
                        }
                        enrichedActivities.push(activity);
                    }
                    enrichedDay[timeSlot] = enrichedActivities;
                }
            }
            enrichedItinerary.push(enrichedDay);
        }
        return enrichedItinerary;
    }

    _formatPlan(llmData, request, duration) {
        // Ensure transportation is an array
        if (llmData.transportation && !Array.isArray(llmData.transportation)) {
            llmData.transportation = [llmData.transportation];
        }

        // Construct final object ensuring all required fields for TravelPlanSchema
        // This mostly passes through llmData but handles defaults if missing
        return {
            ...llmData,
            duration_days: duration,
            start_date: request.start_date,
            end_date: request.end_date,
            destination: request.destination || llmData.destination || "To be decided",
        };
    }

    /**
     * Geocode activities in an expanded day for immediate map display
     * Called during expand-day phase
     */
    async geocodeExpandedDay(expandedDay, destination) {
        if (!expandedDay || !destination) {
            return expandedDay;
        }

        // Geocode destination to get base coordinates
        const destCoords = await this.geocoding.geocode(destination);
        if (!destCoords) {
            console.warn("Could not geocode destination:", destination);
            return expandedDay;
        }

        // Helper to geocode a single place
        const geocodePlace = async (name, type = 'tourist_attraction') => {
            if (!name) return null;
            try {
                const placeData = await this.placesClient.enrichActivityWithPlaces(
                    name,
                    destCoords,
                    type
                );
                if (placeData && placeData.location) {
                    return {
                        lat: placeData.location.lat,
                        lng: placeData.location.lng
                    };
                }
            } catch (err) {
                console.warn(`Failed to geocode ${name}:`, err.message);
            }
            return null;
        };

        // Geocode meals (only if coordinates not already set)
        for (const mealType of ['breakfast', 'lunch', 'dinner']) {
            const meal = expandedDay[mealType];
            if (meal && meal.name && !meal.coordinates?.lat) {
                const coords = await geocodePlace(meal.name, 'restaurant');
                if (coords) {
                    meal.coordinates = coords;
                }
            }
        }

        // Geocode activities in each time slot (only if coordinates not already set)
        for (const timeSlot of ['morning', 'afternoon', 'evening']) {
            if (expandedDay[timeSlot] && Array.isArray(expandedDay[timeSlot])) {
                for (const activity of expandedDay[timeSlot]) {
                    if (activity.name && !activity.coordinates?.lat) {
                        const placeType = activity.type === 'restaurant' ? 'restaurant' : 'tourist_attraction';
                        const coords = await geocodePlace(activity.name, placeType);
                        if (coords) {
                            activity.coordinates = coords;
                        }
                    }
                }
            }
        }

        return expandedDay;
    }

    /**
     * Enrich the final plan with Places API data
     * Used by the new session-based workflow during finalization
     */
    async enrichFinalPlan(finalPlan) {
        if (!finalPlan || !finalPlan.destination) {
            return finalPlan;
        }

        // Geocode destination
        const destCoords = await this.geocoding.geocode(finalPlan.destination);
        if (!destCoords) {
            console.warn("Could not geocode destination:", finalPlan.destination);
            return finalPlan;
        }

        // Enrich each day's activities and meals
        if (finalPlan.itinerary && Array.isArray(finalPlan.itinerary)) {
            for (const day of finalPlan.itinerary) {
                // Enrich meals
                for (const mealType of ['breakfast', 'lunch', 'dinner']) {
                    if (day[mealType] && day[mealType].name) {
                        const placeData = await this.placesClient.enrichActivityWithPlaces(
                            day[mealType].name,
                            destCoords,
                            'restaurant'
                        );
                        if (placeData) {
                            day[mealType].rating = placeData.rating;
                            day[mealType].place_id = placeData.place_id;
                            day[mealType].coordinates = {
                                lat: placeData.location?.lat,
                                lng: placeData.location?.lng
                            };
                        }
                    }
                }

                // Enrich activities in each time slot
                for (const timeSlot of ['morning', 'afternoon', 'evening']) {
                    if (day[timeSlot] && Array.isArray(day[timeSlot])) {
                        for (const activity of day[timeSlot]) {
                            if (activity.name) {
                                const placeType = activity.type === 'restaurant' ? 'restaurant' : 'tourist_attraction';
                                const placeData = await this.placesClient.enrichActivityWithPlaces(
                                    activity.name,
                                    destCoords,
                                    placeType
                                );
                                if (placeData) {
                                    activity.rating = placeData.rating;
                                    activity.place_id = placeData.place_id;
                                    activity.user_ratings_total = placeData.user_ratings_total;
                                    activity.location = placeData.vicinity;
                                    activity.coordinates = placeData.location;
                                }
                            }
                        }
                    }
                }
            }
        }

        return finalPlan;
    }
}

module.exports = TravelPlanner;
