const OpenAI = require('openai');
const { z } = require('zod');

class LLMClient {
    constructor() {
        const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("LLM API key not configured");
        }

        this.openai = new OpenAI({ apiKey });
        this.model = "gpt-3.5-turbo";
    }

    async generateTravelPlan({
        destination,
        start_date,
        end_date,
        duration_days,
        interest_categories,
        activity_level
    }) {
        // If no enough info to even start planning, return a welcoming prompt with all questions
        if (!destination && !start_date && !end_date) {
            return {
                plan_type: "planning",
                summary: "Hello! I'm your AI travel assistant. To create your perfect trip, please tell me:\n\n1. Where would you like to go?\n2. What are your travel dates?\n3. How many days is your trip?\n4. What are your interests? (e.g., history, food, adventure, art, relaxation)\n\nShare as much as you'd like and we'll build your ideal itinerary together!",
                itinerary: [],
                destination: null,
                start_date: null,
                end_date: null,
                duration_days: 0
            };
        }

        const prompt = this._buildPrompt(
            destination, start_date, end_date,
            duration_days, interest_categories, activity_level
        );

        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: "system", content: this._getSystemPrompt() },
                    { role: "user", content: prompt }
                ],
                model: this.model,
                temperature: 0.7,
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0].message.content;
            return JSON.parse(content);

        } catch (error) {
            console.error("Error generating travel plan:", error);
            throw error;
        }
    }

    async modifyItinerary(currentPlan, userMessage, conversationHistory, finalize = false) {
        const baseSystemPrompt = `You are an expert travel planner assistant. You are helping the user PLAN their trip iteratively.

Your task is to:
1. Understand the user's request for changes or initial planning.
2. If the user provides destination, dates, and interests - IMMEDIATELY generate a full itinerary with activities for each day.
3. If the user hasn't decided on a destination yet, help them narrow it down.
4. Keep the conversation helpful and interactive.
5. The "summary" field should be your conversational response to the user explaining what you've planned or asking follow-up questions.

CRITICAL RULES:
- Your response must ALWAYS be a valid JSON object.
- When the user provides trip details (destination, dates, duration), you MUST generate activities in the "itinerary" array.
- Do NOT set plan_type to "finalized" unless the user explicitly says they want to finalize.
- Keep plan_type as "planning" during normal conversation.

Return the complete plan in this structure:
{
    "plan_type": "planning",
    "destination": "City, Country",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "duration_days": number,
    "summary": "Your conversational response explaining the plan or asking questions",
    "itinerary": [
        {
            "day_number": 1,
            "date": "YYYY-MM-DD",
            "morning": [{"name": "Activity Name", "type": "attraction", "description": "...", "duration": "2 hours", "cost": 0}],
            "afternoon": [{"name": "Activity Name", "type": "attraction", "description": "...", "duration": "2 hours", "cost": 0}],
            "evening": [{"name": "Restaurant Name", "type": "restaurant", "description": "...", "duration": "2 hours", "cost": 30}]
        }
    ],
    "highlights": ["highlight1", "highlight2"],
    "tips": ["tip1", "tip2"]
}

IMPORTANT:
- When user provides trip info, generate a COMPLETE itinerary with activities for ALL days.
- Each day MUST have morning, afternoon, and evening activities.
- Activity names should be real, specific places (e.g., "Golden Gate Bridge", "Fisherman's Wharf", "Chinatown").
- The summary should explain what you've planned in a friendly, conversational way.`;

        const finalizeInstructions = `

FINALIZATION MODE ACTIVE: The user clicked the "Finalize" button.
You MUST:
1. Set "plan_type" to "finalized"
2. Keep ALL existing activities from the current itinerary
3. Enhance EVERY activity with complete details:
   - Detailed description (2-3 sentences)
   - Specific time (e.g., "9:00 AM - 11:00 AM")
   - Duration
   - Estimated cost
   - Add "practical_tips" field with helpful advice for that activity
4. Ensure the itinerary covers all days of the trip
5. Provide a summary saying the itinerary is now finalized and ready
6. Include helpful "tips" array with destination-specific advice`;

        const systemPrompt = finalize
            ? baseSystemPrompt + finalizeInstructions
            : baseSystemPrompt;

        const messages = [{ role: "system", content: systemPrompt }];

        const planContext = `Here is the current travel plan that needs to be modified:
\`\`\`json
${JSON.stringify(currentPlan, null, 2)}
\`\`\`
Modify this plan according to the user's request. Return the complete updated plan as a valid JSON object.`;

        messages.push({ role: "user", content: planContext });
        messages.push({ role: "assistant", content: "I understand the current travel plan. What changes would you like to make?" });

        // Add recent history
        const recentHistory = conversationHistory.slice(-6);
        recentHistory.forEach(msg => messages.push(msg));

        messages.push({ role: "user", content: userMessage });

        try {
            const completion = await this.openai.chat.completions.create({
                messages: messages,
                model: this.model,
                temperature: 0.7,
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0].message.content;
            let modifiedPlan = JSON.parse(content);

            // Ensure transportation is a list
            if (modifiedPlan.transportation && !Array.isArray(modifiedPlan.transportation)) {
                modifiedPlan.transportation = [modifiedPlan.transportation];
            }

            // Merge with original plan
            const mergedPlan = { ...currentPlan, ...modifiedPlan };

            return {
                success: true,
                plan: mergedPlan,
                message: modifiedPlan.summary || "Itinerary updated!"
            };

        } catch (error) {
            console.error("Error modifying itinerary:", error);
            return {
                success: false,
                plan: currentPlan,
                message: "Sorry, something went wrong while updating the itinerary. Please try again."
            };
        }
    }

    _getSystemPrompt() {
        return `You are an expert travel planner. Generate detailed, realistic travel plans in JSON format.
Be specific with activities, locations, and recommendations. Provide accurate price estimates based on the plan type.
Always return valid JSON.`;
    }

    _buildPrompt(destination, start_date, end_date, duration_days, interest_categories, activity_level) {
        const interestsStr = interest_categories && interest_categories.length > 0
            ? interest_categories.map(c => c.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())).join(", ")
            : "General tourism";

        const destText = destination ? `for ${destination}` : "without a fixed destination yet";
        const datesText = start_date && end_date ? `from ${start_date} to ${end_date}` : "with dates to be decided";

        return `Start a travel planning session ${destText} ${datesText} based on the following:

Trip Details:
- Destination: ${destination || "To be decided"}
- Start Date: ${start_date || "To be decided"}
- End Date: ${end_date || "To be decided"}
- Duration: ${duration_days || "To be decided"} days (Help plan for these days)

Activity Preferences:
- Interests: ${interestsStr}
- Activity Level: ${activity_level}

Guidelines:
- Transportation: Suggest standard flights or travel methods with estimated costs.
- Accommodation: Suggest a suitable hotel with estimated costs.
- Activities: Focus on ${interestsStr}. Activity level should be ${activity_level}.

Generate a comprehensive travel plan in JSON format with the following structure:

{
    "plan_type": "customized",
    "summary": "Brief summary of the plan",
    "transportation": {
        "type": "flight",
        "to_location": "${destination}",
        "departure_date": "${start_date}",
        "arrival_date": "${start_date}",
        "airline": "suggested airline",
        "class_type": "economy",
        "estimated_price": 0.0,
        "duration": "estimated duration",
        "notes": "any relevant notes"
    },
    "accommodation": {
        "name": "hotel name suggestion",
        "type": "hotel",
        "location": "${destination}",
        "price_per_night": 0.0,
        "total_price": 0.0,
        "check_in": "${start_date}",
        "check_out": "${end_date}",
        "nights": ${duration_days},
        "rating": 0.0,
        "amenities": ["amenity1", "amenity2"],
        "notes": "accommodation notes"
    },
    "itinerary": [
        {
            "date": "YYYY-MM-DD",
            "day_number": 1,
            "morning": [{"name": "activity", "type": "attraction", "time": "morning", "description": "...", "location": "...", "duration": "...", "cost": 0.0}],
            "afternoon": [{"name": "activity", "type": "attraction", "time": "afternoon", "description": "...", "location": "...", "duration": "...", "cost": 0.0}],
            "evening": [{"name": "activity", "type": "restaurant", "time": "evening", "description": "...", "location": "...", "duration": "...", "cost": 0.0}]
        }
        ... generate for ALL ${duration_days} days of the trip ...
    ],
    "cost_breakdown": {
        "transportation": 0.0,
        "accommodation": 0.0,
        "activities": 0.0,
        "food": 0.0,
        "local_transport": 0.0,
        "total": 0.0,
        "per_person": 0.0
    },
    "highlights": ["highlight1", "highlight2"],
    "tips": ["tip1", "tip2"]
}

CRITICAL REQUIREMENTS:
1. Generate itinerary for ALL ${duration_days} days of the trip (from ${start_date} to ${end_date})
2. Each day must have day_number from 1 to ${duration_days}, with corresponding dates
3. Fill in realistic activities for EACH day matching the interests: ${interestsStr}
4. Include morning, afternoon, and evening activities for EVERY day
5. Provide estimated costs.
6. Match the ${activity_level} activity level.
7. All prices should be in USD
8. Focus activities on: ${interestsStr}
9. The itinerary array MUST contain exactly ${duration_days} day objects, one for each day of the trip
10. Return ONLY valid JSON, no additional text`;
    }
}

module.exports = LLMClient;
