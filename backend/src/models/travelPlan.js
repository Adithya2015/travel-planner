const { z } = require('zod');

const TransportationSchema = z.object({
    type: z.string(),
    to_location: z.string().optional().nullable(),
    departure_date: z.string().optional().nullable(),
    departure_time: z.string().optional().nullable(),
    arrival_date: z.string().optional().nullable(),
    arrival_time: z.string().optional().nullable(),
    airline: z.string().optional().nullable(),
    flight_number: z.string().optional().nullable(),
    class_type: z.string().optional().nullable(),
    price: z.number().optional().nullable(),
    currency: z.string().default("USD"),
    duration: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

const AccommodationSchema = z.object({
    name: z.string(),
    type: z.string(),
    location: z.string(),
    price_per_night: z.number().optional().nullable(),
    total_price: z.number().optional().nullable(),
    currency: z.string().default("USD"),
    rating: z.number().optional().nullable(),
    address: z.string().optional().nullable(),
    check_in: z.string().optional().nullable(),
    check_out: z.string().optional().nullable(),
    nights: z.number().optional().nullable(),
    notes: z.string().optional().nullable(),
    amenities: z.array(z.string()).optional().nullable(),
});

const ActivitySchema = z.object({
    name: z.string(),
    type: z.string(),
    time: z.string(),
    description: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    duration: z.string().optional().nullable(),
    cost: z.number().optional().nullable(),
    currency: z.string().default("USD"),
    notes: z.string().optional().nullable(),
    rating: z.number().optional().nullable(),
    user_ratings_total: z.number().optional().nullable(),
});

const DayItinerarySchema = z.object({
    date: z.string(),
    day_number: z.number(),
    morning: z.array(ActivitySchema),
    afternoon: z.array(ActivitySchema),
    evening: z.array(ActivitySchema),
    notes: z.string().optional().nullable(),
});

const CostBreakdownSchema = z.object({
    transportation: z.number(),
    accommodation: z.number(),
    activities: z.number(),
    food: z.number(),
    local_transport: z.number(),
    total: z.number(),
    currency: z.string().default("USD"),
    per_person: z.number().optional().nullable(),
});

const TravelPlanSchema = z.object({
    plan_type: z.string(),
    destination: z.string().optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    duration_days: z.number().optional().nullable(),
    transportation: z.array(TransportationSchema).optional().default([]),
    accommodation: AccommodationSchema.optional().nullable(),
    itinerary: z.array(DayItinerarySchema).optional().default([]),
    cost_breakdown: CostBreakdownSchema.optional().nullable(),
    summary: z.string().optional().nullable(),
    highlights: z.array(z.string()).optional().nullable(),
    tips: z.array(z.string()).optional().nullable(),
});

const TravelRequestSchema = z.object({
    destination: z.string().optional().nullable(),
    start_date: z.string().optional().nullable(), // YYYY-MM-DD
    end_date: z.string().optional().nullable(),   // YYYY-MM-DD
    interest_categories: z.array(z.string()).default([]),
    activity_level: z.string().default("moderate"),
});

module.exports = {
    TravelPlanSchema,
    TravelRequestSchema
};
