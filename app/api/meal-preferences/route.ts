import { NextRequest, NextResponse } from "next/server";
import { sessionStore, WORKFLOW_STATES } from "@/lib/services/session-store";
import type { GroupedDay, RestaurantSuggestion } from "@/lib/models/travel-plan";

/**
 * Distribute restaurants across days based on proximity to activities
 */
function distributeRestaurantsAcrossDays(
  groupedDays: GroupedDay[],
  selectedRestaurants: RestaurantSuggestion[]
): GroupedDay[] {
  if (selectedRestaurants.length === 0) {
    return groupedDays;
  }

  // Clone grouped days
  const updatedDays = groupedDays.map((day) => ({
    ...day,
    activities: [...day.activities],
    restaurants: [] as RestaurantSuggestion[],
  }));

  // Simple distribution: spread restaurants evenly across days
  const restaurantsPerDay = Math.ceil(selectedRestaurants.length / updatedDays.length);

  let restaurantIndex = 0;
  for (const day of updatedDays) {
    const dayRestaurants: RestaurantSuggestion[] = [];
    for (let i = 0; i < restaurantsPerDay && restaurantIndex < selectedRestaurants.length; i++) {
      dayRestaurants.push(selectedRestaurants[restaurantIndex]);
      restaurantIndex++;
    }
    day.restaurants = dayRestaurants;
  }

  return updatedDays;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, wantsRestaurants, selectedRestaurantIds } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Missing sessionId" },
        { status: 400 }
      );
    }

    if (typeof wantsRestaurants !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Missing wantsRestaurants boolean" },
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

    // Validate state
    if (
      session.workflowState !== WORKFLOW_STATES.DAY_ITINERARY &&
      session.workflowState !== WORKFLOW_STATES.MEAL_PREFERENCES
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Can only set meal preferences from DAY_ITINERARY or MEAL_PREFERENCES state",
        },
        { status: 400 }
      );
    }

    let updatedGroupedDays = session.groupedDays;
    let message: string;

    if (wantsRestaurants && selectedRestaurantIds && selectedRestaurantIds.length > 0) {
      // Validate selected restaurant IDs
      const validIds = new Set(session.restaurantSuggestions.map((r) => r.id));
      const invalidIds = selectedRestaurantIds.filter((id: string) => !validIds.has(id));

      if (invalidIds.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid restaurant IDs: ${invalidIds.join(", ")}`,
          },
          { status: 400 }
        );
      }

      // Get selected restaurants
      const selectedRestaurants = session.restaurantSuggestions.filter((r) =>
        selectedRestaurantIds.includes(r.id)
      );

      // Distribute restaurants across days
      updatedGroupedDays = distributeRestaurantsAcrossDays(session.groupedDays, selectedRestaurants);

      message = `Added ${selectedRestaurants.length} restaurant${selectedRestaurants.length === 1 ? "" : "s"} to your itinerary. Ready for review!`;
    } else {
      message = "Your itinerary is ready for review!";
    }

    // Update session
    sessionStore.update(sessionId, {
      workflowState: WORKFLOW_STATES.REVIEW,
      wantsRestaurants: wantsRestaurants,
      selectedRestaurantIds: selectedRestaurantIds || [],
      groupedDays: updatedGroupedDays,
    });

    sessionStore.addToConversation(sessionId, "assistant", message);

    return NextResponse.json({
      success: true,
      sessionId,
      workflowState: WORKFLOW_STATES.REVIEW,
      message,
      groupedDays: updatedGroupedDays,
      wantsRestaurants,
      selectedRestaurantIds: selectedRestaurantIds || [],
    });
  } catch (error) {
    console.error("Error in mealPreferences:", error);
    return NextResponse.json(
      { success: false, message: "Failed to set meal preferences", error: String(error) },
      { status: 500 }
    );
  }
}
