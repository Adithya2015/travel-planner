# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Running the Application

```bash
# Start both backend and frontend simultaneously
./run.sh

# Manual start (separate terminals)
cd backend && npm start      # Backend on http://localhost:3000
cd frontend && npm run web   # Frontend on http://localhost:8081
```

### Development

```bash
# Backend with auto-reload
cd backend && npm run dev

# Frontend Expo dev server (all platforms)
cd frontend && npm start

# Platform-specific
cd frontend && npm run android
cd frontend && npm run ios
```

### Installing Dependencies

```bash
cd backend && npm install
cd frontend && npm install
```

## Architecture

This is a full-stack AI travel planning application with a Node.js/Express backend and Expo (React Native) frontend.

### Backend (`/backend/src/`)

- **server.js** - Express app with API routes
- **travelPlanner.js** - Core orchestration that coordinates LLM and places enrichment
- **controllers/plannerController.js** - API endpoint handlers with Zod validation
- **models/travelPlan.js** - Zod schemas defining TravelPlan, DayItinerary, Activity structures
- **services/** - External API integrations:
  - `llmClient.js` - OpenAI GPT-3.5-turbo for itinerary generation
  - `placesClient.js` - Google Places for activity enrichment (real coordinates, photos, ratings)
  - `geocodingService.js` - Location coordinate lookup

### Frontend (`/frontend/src/`)

- **screens/ItineraryScreen.js** - Main interface with chat-based plan refinement
- **components/MapComponent.js** - Native mobile maps (react-native-maps)
- **components/MapComponent.web.js** - Web maps (Leaflet) - platform-specific file
- **components/DetailedItineraryView.js** - Day-by-day itinerary display with activity details and links
- **services/api.js** - Axios client with platform-aware base URL (Android emulator uses `10.0.2.2`)

### Data Flow

1. Map view on the left, and chat sidebar on the right
2. AI bot first get basic details, like destination, duration of trip, and presents a basic itinerary
3. User can iteratively refine plan through chat - conversation history maintained client-side
4. The itinerary keeps updating on the refinements
5. When the user is finished, a detailed day-by-day itinerary is generated below the map, containing clickable links

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/generate-plan` | POST | Create initial travel plan |
| `/api/modify-plan` | POST | Refine plan via chat conversation |
| `/api/autocomplete` | GET | Location suggestions |
| `/health` | GET | Health check |

## Environment Variables

Required in `backend/.env`:
- `OPENAI_API_KEY` - For itinerary generation
- `GOOGLE_PLACES_API_KEY` - Google Places for activity enrichment
- `GOOGLE_GEOCODING_API_KEY` - Location coordinate lookup
