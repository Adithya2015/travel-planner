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
}

module.exports = TravelPlanner;
