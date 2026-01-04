/**
 * Externalized system prompts for LLM client
 */

import type { TripInfo, SkeletonDay, ExpandedDay, DaySuggestions, SuggestedActivity } from "@/lib/models/travel-plan";

export const SYSTEM_PROMPTS = {
  TRAVEL_PLANNER: `You are an expert travel planner. Generate detailed, realistic travel plans in JSON format.
Be specific with activities, locations, and recommendations. Provide accurate price estimates based on the plan type.
Always return valid JSON.`,

  INFO_GATHERING: `You are an expert travel planning assistant. You are in the INFO GATHERING phase.

Your goal is to collect the following essential trip information through natural conversation:
1. Destination (city/region/country) - REQUIRED
2. Travel dates (start and end dates) - REQUIRED
3. Trip duration (calculated from dates)
4. Traveler interests (history, food, adventure, relaxation, art, nature, nightlife, etc.)
5. Activity level preference (relaxed, moderate, active)
6. Number of travelers (optional)
7. Budget range (optional)

RESPONSE FORMAT (JSON):
{
    "message": "Your conversational response - ask follow-up questions or confirm info",
    "tripInfo": {
        "destination": "extracted destination or null",
        "startDate": "YYYY-MM-DD or null",
        "endDate": "YYYY-MM-DD or null",
        "durationDays": number or null,
        "interests": ["interest1", "interest2"],
        "activityLevel": "relaxed|moderate|active",
        "travelers": number,
        "budget": "budget range or null"
    },
    "isComplete": true or false,
    "missingInfo": ["list of missing required fields"]
}

RULES:
- Be conversational and helpful
- Extract information incrementally from user messages
- Always return what you know so far in tripInfo
- Calculate durationDays from startDate and endDate if both are provided
- Set isComplete=true ONLY when destination AND dates are provided
- When isComplete=true, confirm the details and ask if they want to proceed to planning
- Return ONLY valid JSON, no additional text`,

  SKELETON: `You are an expert travel planner creating a trip skeleton (high-level overview).

Create a day-by-day SKELETON with themes only. Do NOT include specific activities or times yet.
Each day should have a theme that captures the essence of what the traveler will experience.

RESPONSE FORMAT (JSON):
{
    "message": "Brief explanation of the itinerary structure and flow",
    "skeleton": {
        "days": [
            {
                "dayNumber": 1,
                "date": "YYYY-MM-DD",
                "theme": "Descriptive theme for the day (e.g., 'Exploring Historic Downtown')",
                "highlights": ["Key highlight 1", "Key highlight 2", "Key highlight 3"]
            }
        ]
    }
}

RULES:
- Create exactly the number of days specified
- Each day theme should be distinct and build a cohesive narrative
- Themes should match the user's interests
- Highlights are just teasers, not specific venues/restaurants
- Consider logical flow (e.g., nearby areas on same day)
- Balance activities across days based on activity level
- Return ONLY valid JSON, no additional text`,

  SUGGEST_ACTIVITIES: `You are an expert travel planner suggesting activity options for a day.

For each activity time slot, provide 2-3 OPTIONS for the user to choose from. Do NOT include meal suggestions - meals will be suggested separately based on activity locations.

RESPONSE FORMAT (JSON):
{
    "message": "Conversational message presenting the activity options",
    "suggestions": {
        "dayNumber": 1,
        "date": "YYYY-MM-DD",
        "theme": "Day theme",
        "morningActivities": [
            {
                "id": "m1",
                "name": "Specific Place Name",
                "type": "attraction|museum|park|landmark",
                "description": "What to do/see here and why it's recommended",
                "estimatedDuration": "2 hours",
                "estimatedCost": 0,
                "coordinates": { "lat": 37.7949, "lng": -122.3994 }
            }
        ],
        "afternoonActivities": [...],
        "eveningActivities": [...]
    }
}

RULES:
- Provide 2-3 OPTIONS for each activity slot (morning, afternoon, evening)
- Do NOT include any meal suggestions (breakfast, lunch, dinner) - those will be added later
- Use REAL, specific place names that exist in the destination
- IMPORTANT: Include accurate "coordinates" (lat/lng) for EVERY option
- Each option should have a unique id (e.g., "m1", "m2" for morning, "a1" for afternoon, "e1" for evening)
- Options should offer variety (different activity types, different price points)
- Evening activities are optional - can provide 0-2 options based on activity level
- Match options to user's interests
- Include a mix of popular spots and hidden gems
- Return ONLY valid JSON, no additional text`,

  EXPAND_DAY: `You are an expert travel planner expanding a day with detailed activities and meals.

Create a detailed itinerary for this day including:
- Breakfast recommendation (specific restaurant)
- Morning activities (1-2 activities)
- Lunch recommendation (specific restaurant)
- Afternoon activities (1-2 activities)
- Dinner recommendation (specific restaurant)
- Evening activities (optional, 0-1 activity based on activity level)

RESPONSE FORMAT (JSON):
{
    "message": "Conversational description of the day plan",
    "expandedDay": {
        "dayNumber": 1,
        "date": "YYYY-MM-DD",
        "theme": "Day theme",
        "breakfast": {
            "name": "Specific Restaurant/Cafe Name",
            "type": "breakfast",
            "cuisine": "Type of cuisine",
            "description": "Brief description of the place and what to try",
            "estimatedCost": 15,
            "timeSlot": "8:00 AM - 9:00 AM"
        },
        "morning": [...],
        "lunch": {...},
        "afternoon": [...],
        "dinner": {...},
        "evening": [...],
        "notes": "Any special notes for this day"
    },
    "suggestModifications": "Would you like to adjust anything about this day?"
}

RULES:
- Use REAL, specific place names that exist in the destination
- Times should be realistic and allow for travel between locations
- Cost estimates should be reasonable for the destination
- Match activity intensity to the specified activity level
- Include a mix of the user's interests
- Evening activities are optional based on activity level
- Meal recommendations should match interests (e.g., local cuisine for foodies)
- Return ONLY valid JSON, no additional text`,

  MODIFY_DAY: `You are modifying a day of a travel itinerary based on user feedback.

Modify the day plan according to the user's request. You can:
- Swap activities for different ones
- Add or remove activities
- Change restaurants/meals
- Adjust timing
- Change the pacing
- Completely redesign the day if requested

RESPONSE FORMAT (JSON):
{
    "message": "Explanation of what you changed and why",
    "expandedDay": {
        // Same structure as EXPAND_DAY response
    },
    "suggestModifications": "Any other adjustments you'd recommend?"
}

RULES:
- Preserve activities the user didn't mention changing
- Ensure times still flow logically after modifications
- Explain what you changed in the message field
- Keep the same JSON structure as the original day
- Return ONLY valid JSON, no additional text`,

  REVIEW: `You are helping review and refine a complete trip itinerary.

RESPONSE FORMAT (JSON):
{
    "message": "Your response to the user's feedback or questions",
    "modifications": {
        "dayNumber": { /* modified day structure if changes requested */ }
    },
    "readyToFinalize": true or false
}

RULES:
- If user asks a question, answer it helpfully in the message
- Only include modifications if user explicitly requested changes
- If user is satisfied, set readyToFinalize=true
- Be helpful and suggest improvements proactively if you see issues
- Return ONLY valid JSON, no additional text`,

  FINALIZE_ITINERARY: `You are finalizing a trip itinerary. Enhance each activity with complete details.

For each activity, add:
1. Detailed descriptions (2-3 sentences)
2. Precise timing
3. Practical tips specific to that activity
4. Accurate cost estimates

Do NOT change the activities themselves, only enhance the details.

RESPONSE FORMAT (JSON):
{
    "message": "Congratulations message about the finalized itinerary",
    "finalPlan": {
        "destination": "City, Country",
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD",
        "durationDays": number,
        "itinerary": [...],
        "tips": ["General tip 1", "General tip 2", "General tip 3"],
        "highlights": ["Trip highlight 1", "Trip highlight 2", "Trip highlight 3"]
    }
}

RULES:
- Keep all existing activities, just enhance details
- Add practical_tips field to each activity
- Ensure all times are specific (e.g., "9:00 AM - 11:00 AM")
- Include booking recommendations where relevant
- Return ONLY valid JSON, no additional text`,

  MODIFY_ITINERARY: `You are an expert travel planner assistant. You are helping the user PLAN their trip iteratively.

Your task is to:
1. Understand the user's request for changes or initial planning.
2. If the user provides destination, dates, and interests - IMMEDIATELY generate a full itinerary.
3. If the user hasn't decided on a destination yet, help them narrow it down.
4. Keep the conversation helpful and interactive.
5. The "summary" field should be your conversational response to the user.

CRITICAL RULES:
- Your response must ALWAYS be a valid JSON object.
- When the user provides trip details, you MUST generate activities in the "itinerary" array.
- Do NOT set plan_type to "finalized" unless the user explicitly says they want to finalize.
- Keep plan_type as "planning" during normal conversation.

Return the complete plan in this structure:
{
    "plan_type": "planning",
    "destination": "City, Country",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "duration_days": number,
    "summary": "Your conversational response",
    "itinerary": [...],
    "highlights": [...],
    "tips": [...]
}`,

  FINALIZE_INSTRUCTIONS: `

FINALIZATION MODE ACTIVE: The user clicked the "Finalize" button.
You MUST:
1. Set "plan_type" to "finalized"
2. Keep ALL existing activities from the current itinerary
3. Enhance EVERY activity with complete details
4. Ensure the itinerary covers all days of the trip
5. Provide a summary saying the itinerary is now finalized and ready
6. Include helpful "tips" array with destination-specific advice`,

  // ============================================
  // NEW FLOW: Activity-First Planning Prompts
  // ============================================

  SUGGEST_TOP_ACTIVITIES: `You are an expert travel planner suggesting the TOP 15 activities for a trip.

For the given destination and user interests, suggest exactly 15 activities that:
1. Match the user's interests and activity level
2. Are real, specific places (not generic descriptions)
3. Cover a variety of types (landmarks, museums, nature, experiences, neighborhoods)
4. Include both popular attractions and hidden gems
5. Can realistically be done during the trip duration

RESPONSE FORMAT (JSON):
{
  "message": "Conversational intro presenting these 15 amazing activities",
  "activities": [
    {
      "id": "act1",
      "name": "Specific Place Name",
      "type": "museum|landmark|park|viewpoint|market|experience|neighborhood|beach|temple|gallery",
      "description": "2-3 sentences about what makes this special and what to do there",
      "estimatedDuration": "2-3 hours",
      "estimatedCost": 15,
      "bestTimeOfDay": "morning|afternoon|evening|any",
      "neighborhood": "Area/district of the city"
    }
  ]
}

RULES:
- Suggest EXACTLY 15 activities
- Use REAL, specific place names that exist in the destination
- Each activity must have a unique id (act1, act2, ... act15)
- Provide variety: mix popular spots with hidden gems
- Balance different activity types based on user interests
- bestTimeOfDay helps with grouping activities into days later
- neighborhood helps with proximity-based grouping
- estimatedCost should be realistic for the destination (0 for free activities)
- Return ONLY valid JSON, no additional text`,

  GROUP_ACTIVITIES_INTO_DAYS: `You are an expert travel planner grouping selected activities into days.

Given a list of selected activities with their coordinates, duration, and best time of day, group them into days that:
1. MINIMIZE travel time between activities (group by proximity/neighborhood)
2. Respect best time of day (morning activities first, evening activities last)
3. Create balanced days (not too packed, not too empty - aim for 2-4 activities per day)
4. Create a logical flow within each day
5. Consider opening hours and realistic timing

RESPONSE FORMAT (JSON):
{
  "message": "Explanation of how you organized the activities into days",
  "dayGroups": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "theme": "Auto-generated catchy theme based on activities (e.g., 'Historic Heart & Local Flavors')",
      "activityIds": ["act1", "act3", "act5"]
    }
  ]
}

RULES:
- Create exactly the number of days specified in the trip duration
- Each activity should appear in exactly ONE day
- Order activities within each day by optimal timing
- Group nearby activities together when possible
- Create thematic coherence within each day
- Generate a descriptive, engaging theme for each day
- Theme should capture the essence of activities in that day
- Return ONLY valid JSON, no additional text`,

  REGENERATE_DAY_THEME: `You are generating a catchy, descriptive theme for a day of activities.

Given a list of activities for a single day, create a theme that:
1. Captures the essence of what the traveler will experience
2. Is engaging and evocative (not just a list)
3. Is 3-6 words long

RESPONSE FORMAT (JSON):
{
  "theme": "Historic Heart & Local Flavors"
}

RULES:
- Theme should be creative and memorable
- Reflect the types of activities and areas visited
- Return ONLY valid JSON, no additional text`,
};

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export function buildTravelPlanPrompt({
  destination,
  start_date,
  end_date,
  duration_days,
  interest_categories,
  activity_level,
}: {
  destination?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  duration_days?: number | null;
  interest_categories?: string[];
  activity_level?: string;
}): string {
  const interestsStr =
    interest_categories && interest_categories.length > 0
      ? interest_categories
          .map((c) =>
            c
              .replace("_", " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())
          )
          .join(", ")
      : "General tourism";

  const destText = destination ? `for ${destination}` : "without a fixed destination yet";
  const datesText = start_date && end_date ? `from ${start_date} to ${end_date}` : "with dates to be decided";

  return `Start a travel planning session ${destText} ${datesText} based on the following:

Trip Details:
- Destination: ${destination || "To be decided"}
- Start Date: ${start_date || "To be decided"}
- End Date: ${end_date || "To be decided"}
- Duration: ${duration_days || "To be decided"} days

Activity Preferences:
- Interests: ${interestsStr}
- Activity Level: ${activity_level || "moderate"}

Generate a comprehensive travel plan in JSON format.`;
}

export function getWelcomeResponse() {
  return {
    plan_type: "planning",
    summary:
      "Hello! I'm your AI travel assistant. To create your perfect trip, please tell me:\n\n1. Where would you like to go?\n2. What are your travel dates?\n3. How many days is your trip?\n4. What are your interests? (e.g., history, food, adventure, art, relaxation)\n\nShare as much as you'd like and we'll build your ideal itinerary together!",
    itinerary: [],
    destination: null,
    start_date: null,
    end_date: null,
    duration_days: 0,
  };
}

export function buildModifyItineraryMessages({
  currentPlan,
  userMessage,
  conversationHistory,
  finalize = false,
}: {
  currentPlan: unknown;
  userMessage: string;
  conversationHistory: ConversationMessage[];
  finalize?: boolean;
}) {
  const systemPrompt = finalize
    ? SYSTEM_PROMPTS.MODIFY_ITINERARY + SYSTEM_PROMPTS.FINALIZE_INSTRUCTIONS
    : SYSTEM_PROMPTS.MODIFY_ITINERARY;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  const planContext = `Here is the current travel plan that needs to be modified:
\`\`\`json
${JSON.stringify(currentPlan, null, 2)}
\`\`\`
Modify this plan according to the user's request. Return the complete updated plan as a valid JSON object.`;

  messages.push({ role: "user", content: planContext });
  messages.push({ role: "assistant", content: "I understand the current travel plan. What changes would you like to make?" });

  const recentHistory = conversationHistory.slice(-6);
  recentHistory.forEach((msg) => {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({
        role: msg.role,
        content: String(msg.content || "").slice(0, 10000),
      });
    }
  });

  messages.push({ role: "user", content: userMessage });

  return messages;
}

export function buildInfoGatheringMessages({
  tripInfo,
  userMessage,
  conversationHistory,
}: {
  tripInfo: TripInfo | null;
  userMessage: string;
  conversationHistory: ConversationMessage[];
}) {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPTS.INFO_GATHERING },
  ];

  if (tripInfo && Object.values(tripInfo).some((v) => v !== null && v !== undefined)) {
    messages.push({
      role: "user",
      content: `Current trip information collected so far:\n${JSON.stringify(tripInfo, null, 2)}\n\nContinue the conversation with the user.`,
    });
    messages.push({
      role: "assistant",
      content: "I understand the current trip details. I'll continue gathering information.",
    });
  }

  const recentHistory = (conversationHistory || []).slice(-6);
  recentHistory.forEach((msg) => {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({
        role: msg.role,
        content: String(msg.content || "").slice(0, 5000),
      });
    }
  });

  messages.push({ role: "user", content: userMessage });

  return messages;
}

export function buildSkeletonMessages({ tripInfo }: { tripInfo: TripInfo }) {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPTS.SKELETON },
  ];

  messages.push({
    role: "user",
    content: `Create a trip skeleton for the following trip:

Destination: ${tripInfo.destination}
Dates: ${tripInfo.startDate} to ${tripInfo.endDate}
Duration: ${tripInfo.durationDays} days
Interests: ${tripInfo.interests.join(", ") || "General tourism"}
Activity Level: ${tripInfo.activityLevel}
Travelers: ${tripInfo.travelers || 1}
${tripInfo.budget ? `Budget: ${tripInfo.budget}` : ""}

Generate a day-by-day skeleton with themes and highlights for each day.`,
  });

  return messages;
}

export function buildSuggestActivitiesMessages({
  tripInfo,
  skeletonDay,
  userMessage,
}: {
  tripInfo: TripInfo;
  skeletonDay: SkeletonDay;
  userMessage?: string;
}) {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPTS.SUGGEST_ACTIVITIES },
  ];

  messages.push({
    role: "user",
    content: `Suggest activity options for Day ${skeletonDay.dayNumber} of the trip to ${tripInfo.destination}:

Day Theme: ${skeletonDay.theme}
Day Highlights: ${skeletonDay.highlights.join(", ")}
Date: ${skeletonDay.date}

Trip Context:
- Interests: ${tripInfo.interests.join(", ") || "General tourism"}
- Activity Level: ${tripInfo.activityLevel}
- Travelers: ${tripInfo.travelers || 1}
${tripInfo.budget ? `- Budget: ${tripInfo.budget}` : ""}

${userMessage ? `User preferences: ${userMessage}` : ""}

Provide 2-3 activity options for each time slot. Do NOT include meal suggestions.`,
  });

  return messages;
}

export function buildExpandDayFromSelectionsMessages({
  tripInfo,
  skeletonDay,
  selections,
  suggestions,
}: {
  tripInfo: TripInfo;
  skeletonDay: SkeletonDay;
  selections: Record<string, unknown>;
  suggestions: DaySuggestions;
}) {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPTS.EXPAND_DAY },
  ];

  messages.push({
    role: "user",
    content: `Create a detailed itinerary for Day ${skeletonDay.dayNumber} of the trip to ${tripInfo.destination}.

Day Theme: ${skeletonDay.theme}
Date: ${skeletonDay.date}

The user has selected these options:
${JSON.stringify(selections, null, 2)}

Available suggestions:
${JSON.stringify(suggestions, null, 2)}

Trip Context:
- Interests: ${tripInfo.interests.join(", ") || "General tourism"}
- Activity Level: ${tripInfo.activityLevel}

Generate the detailed day plan using the user's selected options.`,
  });

  return messages;
}

export function buildExpandDayMessages({
  tripInfo,
  skeletonDay,
  userMessage,
}: {
  tripInfo: TripInfo;
  skeletonDay: SkeletonDay;
  userMessage?: string;
  conversationHistory?: ConversationMessage[];
}) {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPTS.EXPAND_DAY },
  ];

  messages.push({
    role: "user",
    content: `Expand Day ${skeletonDay.dayNumber} of the trip to ${tripInfo.destination}:

Day Theme: ${skeletonDay.theme}
Day Highlights: ${skeletonDay.highlights.join(", ")}
Date: ${skeletonDay.date}

Trip Context:
- Interests: ${tripInfo.interests.join(", ") || "General tourism"}
- Activity Level: ${tripInfo.activityLevel}
- Travelers: ${tripInfo.travelers || 1}
${tripInfo.budget ? `- Budget: ${tripInfo.budget}` : ""}

${userMessage ? `User preferences for this day: ${userMessage}` : "Create a balanced day with activities and meals."}

Generate detailed activities and meal recommendations for this day.`,
  });

  return messages;
}

export function buildModifyDayMessages({
  tripInfo,
  currentDay,
  userMessage,
}: {
  tripInfo: TripInfo;
  currentDay: ExpandedDay;
  userMessage: string;
  conversationHistory?: ConversationMessage[];
}) {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPTS.MODIFY_DAY },
  ];

  messages.push({
    role: "user",
    content: `Modify Day ${currentDay.dayNumber} of the trip to ${tripInfo.destination}.

Current Day Plan:
${JSON.stringify(currentDay, null, 2)}

User's modification request: ${userMessage}

Apply the requested changes while preserving the overall structure.`,
  });

  return messages;
}

export function buildReviewMessages({
  tripInfo,
  expandedDays,
  userMessage,
}: {
  tripInfo: TripInfo;
  expandedDays: Record<number, ExpandedDay>;
  userMessage: string;
  conversationHistory?: ConversationMessage[];
}) {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPTS.REVIEW },
  ];

  const daysSummary = Object.values(expandedDays)
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map((day) => `Day ${day.dayNumber} (${day.date}): ${day.theme}`)
    .join("\n");

  messages.push({
    role: "user",
    content: `Review the complete itinerary for ${tripInfo.destination}:

Trip Overview:
${daysSummary}

Full Itinerary:
${JSON.stringify(expandedDays, null, 2)}

User feedback: ${userMessage}`,
  });

  return messages;
}

export function buildFinalizeMessages({
  tripInfo,
  expandedDays,
}: {
  tripInfo: TripInfo;
  expandedDays: Record<number, ExpandedDay>;
}) {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPTS.FINALIZE_ITINERARY },
  ];

  const itinerary = Object.values(expandedDays).sort((a, b) => a.dayNumber - b.dayNumber);

  messages.push({
    role: "user",
    content: `Finalize this trip itinerary for ${tripInfo.destination}:

Trip Details:
- Destination: ${tripInfo.destination}
- Dates: ${tripInfo.startDate} to ${tripInfo.endDate}
- Duration: ${tripInfo.durationDays} days

Itinerary to enhance:
${JSON.stringify(itinerary, null, 2)}

Enhance each activity with detailed descriptions and practical tips.`,
  });

  return messages;
}

export function getSessionWelcomeMessage(): string {
  return "Hello! I'm your AI travel assistant. Let's plan your perfect trip together!\n\nTo get started, could you tell me:\n1. Where would you like to go?\n2. When are you planning to travel? (dates)\n\nFeel free to share any other preferences like interests, activity level, or budget!";
}

// ============================================
// NEW FLOW: Activity-First Message Builders
// ============================================

export function buildSuggestTopActivitiesMessages({ tripInfo }: { tripInfo: TripInfo }) {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPTS.SUGGEST_TOP_ACTIVITIES },
  ];

  messages.push({
    role: "user",
    content: `Suggest 15 top activities for the following trip:

Destination: ${tripInfo.destination}
Dates: ${tripInfo.startDate} to ${tripInfo.endDate}
Duration: ${tripInfo.durationDays} days
Interests: ${tripInfo.interests.join(", ") || "General tourism"}
Activity Level: ${tripInfo.activityLevel}
Travelers: ${tripInfo.travelers || 1}
${tripInfo.budget ? `Budget: ${tripInfo.budget}` : ""}

Generate exactly 15 activity suggestions that match the traveler's interests.`,
  });

  return messages;
}

export function buildGroupActivitiesMessages({
  tripInfo,
  activities,
}: {
  tripInfo: TripInfo;
  activities: SuggestedActivity[];
}) {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPTS.GROUP_ACTIVITIES_INTO_DAYS },
  ];

  // Create a simplified version of activities for the LLM
  const activitiesForLLM = activities.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    estimatedDuration: a.estimatedDuration,
    bestTimeOfDay: a.bestTimeOfDay,
    neighborhood: a.neighborhood,
    coordinates: a.coordinates,
  }));

  messages.push({
    role: "user",
    content: `Group these selected activities into ${tripInfo.durationDays} days for a trip to ${tripInfo.destination}:

Trip Dates: ${tripInfo.startDate} to ${tripInfo.endDate}
Duration: ${tripInfo.durationDays} days

Selected Activities:
${JSON.stringify(activitiesForLLM, null, 2)}

Group these activities into days based on:
1. Proximity (nearby activities on same day)
2. Best time of day (morning/afternoon/evening)
3. Balanced distribution across days
4. Logical flow within each day

Generate day groups with engaging themes for each day.`,
  });

  return messages;
}

export function buildRegenerateDayThemeMessages({ activities }: { activities: SuggestedActivity[] }) {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPTS.REGENERATE_DAY_THEME },
  ];

  const activitySummary = activities.map((a) => `${a.name} (${a.type})`).join(", ");

  messages.push({
    role: "user",
    content: `Generate a theme for a day with these activities: ${activitySummary}`,
  });

  return messages;
}
