# Travel Planner App - Design Document

## Overview
A Streamlit-based travel planner that generates 3 personalized travel plans with hybrid approach (LLM + Real-time APIs).

---

## 1. Technology Stack

### LLM API (Choose One)
**Recommended: OpenAI GPT-3.5-turbo**
- **Pricing**: ~$0.50 per 1M input tokens, ~$1.50 per 1M output tokens
- **Why**: Most reliable, excellent JSON output, widely supported
- **Alternative**: DeepSeek API (cheaper but less proven: $0.28/$0.42 per 1M tokens)

### Real-Time APIs

#### Flights
**Note**: Google Flights API was discontinued in 2018 - no official API available.

**Option 1: HasData Google Flights Scraper** (RECOMMENDED for real Google Flights data)
- **Free Tier**: 1,000 free API calls (no credit card required)
- **Features**: Real-time flight prices, schedules, airlines from Google Flights
- **Pricing**: Free tier available, then paid plans
- **Pros**: Actual Google Flights data, good free tier
- **Cons**: Web scraping service (may have rate limits), requires account
- **Link**: https://hasdata.com/apis/google-flights-api

**Option 2: Amadeus Self-Service API** (Good for structure/testing)
- **Free Tier**: Unlimited test environment requests
- **Features**: Flight search, pricing, schedules
- **Sign-up**: https://developers.amadeus.com/get-started
- **Note**: Test environment uses dummy data, but structure is realistic
- **Pros**: Official API, unlimited free test requests
- **Cons**: Test data only (not real prices)

**Option 3: Apify Google Flights Scraper**
- **Free Tier**: $5 worth of usage credits (free trial)
- **Features**: Flight prices, schedules, booking options from Google Flights
- **Link**: https://apify.com/api/google-flights-api

**Option 4: Aviationstack**
- **Free Tier**: 100 free requests/month for flight status
- **Note**: More for flight status tracking, less for price searches

**Recommendation**: Use **HasData** if you want real Google Flights prices (1,000 free calls is generous for MVP). Use **Amadeus** if you want to test structure first and don't need real prices yet.

#### Hotels
**Challenge**: Most hotel APIs require paid plans or partnerships

**Solution Options**:
1. **LLM-generated suggestions** with estimated price ranges (budget/mid-range/luxury)
2. **Google Places API** (free tier) - search for hotels by name/location
3. **Hotels.com API** (requires partnership) - skip for MVP

**Recommendation**: Use LLM for hotel suggestions with price category tags + Google Places for validation

#### Attractions & Places
**Google Places API** (FREE tier: $200 credit/month)
- **Features**: Nearby places, attractions, restaurants, reviews
- **Free Credit**: Covers ~40,000 requests/month typically
- **Use Cases**: Get real locations, ratings, opening hours

#### Geocoding & Distance
**OpenCage Geocoding API** (FREE tier: 2,500 requests/day)
- **Features**: Convert addresses to coordinates, reverse geocoding
- **Alternative**: Google Geocoding API (uses Places API credit)

---

## 2. Application Architecture

```
travel-planner/
├── app.py                    # Main Streamlit application
├── requirements.txt          # Python dependencies
├── config.py                # Configuration & API keys (gitignored)
├── .env.example             # Example environment variables
├── .gitignore               # Git ignore file
├── utils/
│   ├── __init__.py
│   ├── llm_client.py        # LLM API wrapper (OpenAI/DeepSeek)
│   ├── flights_client.py    # Flight API integration (HasData/Amadeus/Apify)
│   ├── places_client.py     # Google Places API integration
│   ├── geocoding.py         # Geocoding utilities
│   ├── travel_planner.py    # Core planning logic (orchestrator)
│   └── display_helpers.py   # Streamlit UI rendering helpers
├── models/
│   ├── __init__.py
│   └── travel_plan.py       # Data models/schemas
└── README.md                # Setup instructions
```

---

## 3. User Interface Flow

### Step 1: Input Form (Sidebar)
```
┌─────────────────────────────┐
│ Travel Planner              │
├─────────────────────────────┤
│ Source Location: [____]     │
│ Destination: [____]         │
│ Start Date: [📅]            │
│ End Date: [📅]              │
│ Number of Travelers: [1]    │
│ Budget Preference:          │
│  ○ Budget                  │
│  ○ Balanced                │
│  ○ Comfort (Default)       │
│                             │
│ [Generate Plans]            │
└─────────────────────────────┘
```

### Step 2: Results Display (Main Area)
```
┌──────────────────────────────────────────────┐
│ 🌍 Travel Plans for: NYC → Paris            │
│ 📅 Trip Dates: Jan 15-20, 2024              │
├──────────────────────────────────────────────┤
│                                              │
│ [Plan 1: Budget-Friendly] [Plan 2: Balanced]│
│ [Plan 3: Comfort-Focused]                   │
│                                              │
│ ┌──────────────────────────────────────────┐│
│ │ 📋 Plan 1: Budget-Friendly              ││
│ │ Estimated Cost: $1,200                  ││
│ │                                          ││
│ │ ✈️ Transportation:                      ││
│ │   - Flight: $450 (Economy)              ││
│ │   - Local transport: $50                ││
│ │                                          ││
│ │ 🏨 Accommodation:                       ││
│ │   - Budget hotel: $80/night (4 nights)  ││
│ │                                          ││
│ │ 📅 Itinerary:                           ││
│ │                                          ││
│ │ Day 1 (Jan 15):                         ││
│ │   ☀️ Morning: Arrival, check-in        ││
│ │   🌤️ Afternoon: Eiffel Tower visit     ││
│ │   🌙 Evening: Dinner at local bistro    ││
│ │                                          ││
│ │ Day 2 (Jan 16):                         ││
│ │   ...                                   ││
│ │                                          ││
│ │ [Expand Full Itinerary ▼]              ││
│ └──────────────────────────────────────────┘│
│                                              │
│ [Plan 2] [Plan 3] (similar structure)       │
└──────────────────────────────────────────────┘
```

---

## 4. Data Flow & Logic

### Core Planning Process

```
1. User Input Collection
   ↓
2. Geocode locations (source + destination)
   ↓
3. Calculate trip duration
   ↓
4. Fetch flight options (Amadeus API)
   ↓
5. Generate 3 plan variants via LLM:
   ├── Plan 1: Budget-Friendly
   ├── Plan 2: Balanced
   └── Plan 3: Comfort-Focused
   ↓
6. For each plan:
   ├── LLM generates itinerary structure
   ├── Enrich with real places (Google Places API)
   ├── Calculate estimated costs
   └── Format for display
   ↓
7. Render plans in Streamlit UI
```

### LLM Prompt Structure
```
You are a travel planning expert. Generate a detailed travel plan in JSON format.

User Input:
- Source: {source}
- Destination: {destination}
- Dates: {start_date} to {end_date}
- Duration: {duration} days
- Plan Type: {budget/balanced/comfort}
- Number of travelers: {count}

Generate a travel plan with:
1. Transportation recommendations (flight, local transport)
2. Accommodation suggestions (3 options with price ranges)
3. Day-by-day itinerary with:
   - Morning activities (9 AM - 12 PM)
   - Afternoon activities (12 PM - 5 PM)
   - Evening activities (5 PM - 9 PM)
   - Restaurant recommendations for each meal
4. Estimated total cost breakdown

Return JSON in this format:
{
  "plan_type": "...",
  "transportation": {...},
  "accommodation": {...},
  "itinerary": [...],
  "estimated_cost": {...}
}
```

---

## 5. Plan Variant Differentiation

### Plan 1: Budget-Friendly
- **Transportation**: Economy flights, public transport, walking
- **Accommodation**: Hostels, budget hotels ($50-100/night range)
- **Activities**: Free/low-cost attractions, public spaces
- **Dining**: Street food, local cafes, affordable restaurants
- **Focus**: Maximize experiences while minimizing costs

### Plan 2: Balanced
- **Transportation**: Economy/standard flights, mix of public & private transport
- **Accommodation**: Mid-range hotels ($100-200/night range)
- **Activities**: Mix of free and paid attractions, guided tours
- **Dining**: Mix of casual and mid-range restaurants
- **Focus**: Comfort and value balance

### Plan 3: Comfort-Focused
- **Transportation**: Business/premium economy flights, private transfers
- **Accommodation**: 4-5 star hotels ($200-500+/night range)
- **Activities**: Premium experiences, private tours, exclusive access
- **Dining**: Fine dining, renowned restaurants
- **Focus**: Luxury and comfort, premium experiences

---

## 6. API Configuration

### Required API Keys
```python
# config.py or .env
OPENAI_API_KEY = "sk-..."
# OR
DEEPSEEK_API_KEY = "..."

# Flight API (choose one):
HASDATA_API_KEY = "..."  # For Google Flights data
# OR
AMADEUS_API_KEY = "..."
AMADEUS_API_SECRET = "..."
# OR
APIFY_API_TOKEN = "..."  # For Apify Google Flights scraper

GOOGLE_PLACES_API_KEY = "..."

OPENCAGE_API_KEY = "..."  # Optional, can use Google Geocoding
```

### API Rate Limiting Strategy
- **LLM**: Cache prompts/responses when possible
- **HasData**: 1,000 free calls (cache results, batch requests)
- **Amadeus**: Test environment (unlimited)
- **Google Places**: Batch requests, use caching
- **Geocoding**: Cache location coordinates

---

## 7. Error Handling

- **API Failures**: Graceful fallback (e.g., if flight API fails, use LLM estimates)
- **Invalid Locations**: Validate geocoding, suggest alternatives
- **Date Validation**: Ensure end date > start date, reasonable ranges
- **No Results**: Provide helpful error messages with suggestions

---

## 8. Future Enhancements (Post-MVP)

- Export plans as PDF/JSON
- Save favorite plans
- Share plans via link
- Weather integration
- Real-time flight price tracking
- Hotel booking integration
- Multiple destinations (multi-city trips)
- User preferences/profiles

---

## 9. Implementation Phases

### Phase 1: MVP (Current Scope)
- ✅ Basic input form
- ✅ LLM integration for plan generation
- ✅ Google Places API for attractions
- ✅ 3 plan variants
- ✅ Day-by-day itinerary display
- ✅ Cost estimation

### Phase 2: Enhanced APIs
- Amadeus flight integration
- More accurate hotel suggestions
- Distance calculations

### Phase 3: Polish
- Better UI/UX
- Export functionality
- Caching and performance optimization

---

## Questions for Finalization

1. **LLM Choice**: OpenAI GPT-3.5-turbo (recommended) or DeepSeek?
2. **Hotel Data**: Accept LLM-generated hotel suggestions with price ranges, or try to integrate a free hotel API?
3. **Flight Data**: 
   - **HasData** (recommended - real Google Flights data, 1,000 free calls)
   - **Amadeus** (test environment with dummy data, unlimited free)
   - **Apify** ($5 free trial)
   - Or LLM-only suggestions (no API needed)
4. **UI Style**: Modern/minimalist or more detailed/feature-rich?

Please review and let me know if you'd like any changes before we start implementation!

