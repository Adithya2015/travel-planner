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
  - `llmClient.js` - OpenAI for itinerary generation with workflow-specific methods
  - `placesClient.js` - Google Places for activity enrichment (real coordinates, photos, ratings)
  - `geocodingService.js` - Location coordinate lookup
  - `sessionStore.js` - In-memory session management with 30-min TTL
  - `prompts.js` - Externalized LLM prompts for each workflow state

### Frontend (`/frontend/src/`)

- **screens/ItineraryScreen.js** - Main interface with session-based workflow state machine
- **components/MapComponent.js** - Native mobile maps (react-native-maps)
- **components/MapComponent.web.js** - Web maps (Google Maps) - platform-specific file
- **components/SkeletonView.js** - Display day themes and progress during planning
- **components/DetailedItineraryView.js** - Day-by-day itinerary display with activity details and links
- **services/api.js** - Axios client with session-based API functions

### Data Flow

1. Map view on the left (60%), chat sidebar on the right (40%)
2. Session-based workflow with the following states:
   1. **INFO_GATHERING** - Collect destination, dates, interests via chat. Proceeds when required info is complete.
   2. **SKELETON** - Generate day themes only (no detailed activities). User reviews the high-level plan.
   3. **EXPAND_DAY** - Expand each day with activities + meals (breakfast/lunch/dinner). User can modify each day before proceeding.
   4. **REVIEW** - All days expanded. User can edit any day or provide general feedback.
   5. **FINALIZE** - Enrich with Places API (coordinates, ratings, place_ids). Generate final itinerary with links.

### API Endpoints

**Session-Based Workflow (New):**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/start-session` | POST | Initialize session, begin INFO_GATHERING |
| `/api/chat` | POST | Chat in INFO_GATHERING or REVIEW states |
| `/api/generate-skeleton` | POST | Generate day themes after info complete |
| `/api/expand-day` | POST | Expand a specific day with activities + meals |
| `/api/modify-day` | POST | Modify an already-expanded day |
| `/api/start-review` | POST | Transition to REVIEW state |
| `/api/finalize` | POST | Enrich with Places API, generate final plan |
| `/api/session/:sessionId` | GET | Get current session state |

**Legacy Endpoints (Backward Compatible):**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/generate-plan` | POST | Create initial travel plan (one-shot) |
| `/api/modify-plan` | POST | Refine plan via chat conversation |
| `/health` | GET | Health check |

## Environment Variables

Required in `backend/.env`:
- `OPENAI_API_KEY` - For itinerary generation
- `GOOGLE_PLACES_API_KEY` - Google Places for activity enrichment
- `GOOGLE_GEOCODING_API_KEY` - Location coordinate lookup
