import { NextRequest, NextResponse } from "next/server";
import { sessionStore, WORKFLOW_STATES } from "@/lib/services/session-store";
import { getLLMClient } from "@/lib/services/llm-client";
import { getGeocodingService } from "@/lib/services/geocoding-service";
import { getPlacesClient, PlacesClient } from "@/lib/services/places-client";
import type { SuggestedActivity } from "@/lib/models/travel-plan";

/**
 * Enrich activities with Places API data (coordinates, ratings, place_id)
 */
async function enrichActivitiesWithPlaces(
  activities: SuggestedActivity[],
  destination: string
): Promise<SuggestedActivity[]> {
  const geocodingService = getGeocodingService();
  let placesClient: PlacesClient | null = null;
  try {
    placesClient = getPlacesClient();
  } catch {
    console.warn("Places client not available, using geocoding only");
  }

  const enrichActivity = async (activity: SuggestedActivity): Promise<SuggestedActivity> => {
    try {
      // First try to get place data from Places API
      if (placesClient) {
        const searchQuery = `${activity.name}, ${destination}`;
        const places = await placesClient.searchPlaces(searchQuery, null, 5000);

        if (places && places.length > 0) {
          const place = places[0];
          return {
            ...activity,
            coordinates: place.location,
            rating: place.rating || null,
            place_id: place.place_id,
          };
        }
      }

      // Fallback to geocoding
      if (geocodingService) {
        const query = `${activity.name}, ${destination}`;
        const coords = await geocodingService.geocode(query);
        if (coords) {
          return { ...activity, coordinates: coords };
        }
      }
    } catch (error) {
      console.warn(`Failed to enrich ${activity.name}:`, (error as Error).message);
    }
    return activity;
  };

  // Process activities in parallel with concurrency limit
  const BATCH_SIZE = 5;
  const enrichedActivities: SuggestedActivity[] = [];

  for (let i = 0; i < activities.length; i += BATCH_SIZE) {
    const batch = activities.slice(i, i + BATCH_SIZE);
    const enrichedBatch = await Promise.all(batch.map(enrichActivity));
    enrichedActivities.push(...enrichedBatch);
  }

  return enrichedActivities;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Missing sessionId" },
        { status: 400 }
      );
    }

    const session = sessionStore.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found or expired" },
        { status: 404 }
      );
    }

    // Validate state - should be called after INFO_GATHERING is complete
    if (session.workflowState !== WORKFLOW_STATES.INFO_GATHERING) {
      return NextResponse.json(
        {
          success: false,
          message: "Can only suggest activities from INFO_GATHERING state",
        },
        { status: 400 }
      );
    }

    // Validate required trip info
    if (!session.tripInfo.destination || !session.tripInfo.startDate || !session.tripInfo.endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required trip info: destination, startDate, or endDate",
        },
        { status: 400 }
      );
    }

    // Generate top 15 activities using LLM
    const llmClient = getLLMClient();
    const result = await llmClient.suggestTopActivities({
      tripInfo: session.tripInfo,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    // Enrich activities with Places API data
    let activities = result.activities;
    try {
      activities = await enrichActivitiesWithPlaces(activities, session.tripInfo.destination);
    } catch (enrichError) {
      console.warn("Enriching activities failed:", (enrichError as Error).message);
    }

    // Update session state
    sessionStore.update(sessionId, {
      workflowState: WORKFLOW_STATES.SUGGEST_ACTIVITIES,
      suggestedActivities: activities,
      selectedActivityIds: [],
    });

    sessionStore.addToConversation(sessionId, "assistant", result.message);

    return NextResponse.json({
      success: true,
      sessionId,
      workflowState: WORKFLOW_STATES.SUGGEST_ACTIVITIES,
      message: result.message,
      suggestedActivities: activities,
    });
  } catch (error) {
    console.error("Error in suggestActivities:", error);
    return NextResponse.json(
      { success: false, message: "Failed to suggest activities", error: String(error) },
      { status: 500 }
    );
  }
}
