# Travel Planner

A full-stack travel planning application that generates personalized travel plans with multiple options based on different budgets and preferences. Features AI-powered itinerary generation with real-time flight search and place enrichment.

## Features

- **Multi-Plan Generation**: Creates 3 travel plan variants (Budget-Friendly, Balanced, Comfort-Focused)
- **Flight Recommendations**: Integrates with Amadeus API for real-time flight search
- **Accommodation Suggestions**: Hotel recommendations with pricing
- **Day-by-Day Itineraries**: Detailed daily schedules with activities for mornings, afternoons, and evenings
- **Cost Breakdowns**: Complete cost analysis including transportation, accommodation, activities, food, and local transport
- **Real Places Integration**: Uses Google Places API to enrich itineraries with real locations, ratings, and photos
- **Interactive Maps**: Visualize your itinerary with Leaflet maps (web) or native maps (mobile)
- **Chat-Based Refinement**: Iteratively modify your travel plan through conversation

## Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Expo (React Native) with React Native Paper
- **LLM**: OpenAI GPT-3.5-turbo
- **Flights API**: Amadeus Flight Offers Search API
- **Places API**: Google Places API
- **Geocoding**: Google Geocoding API
- **Maps**: Leaflet (web) / react-native-maps (mobile)

## Project Structure

```
travel-planner/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── server.js           # Express app and routes
│   │   ├── travelPlanner.js    # Core planning logic
│   │   ├── controllers/        # API endpoint handlers
│   │   ├── models/             # Zod validation schemas
│   │   └── services/           # API integrations (OpenAI, Amadeus, Google)
│   └── package.json
├── frontend/                   # Expo React Native app
│   ├── src/
│   │   ├── screens/            # App screens (ItineraryScreen)
│   │   ├── components/         # Reusable components (MapComponent)
│   │   └── services/           # API client
│   ├── App.js
│   └── package.json
├── run.sh                      # Script to run both services
└── .env                        # Environment variables
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd travel-planner
```

### 2. Install Dependencies

Install dependencies for both backend and frontend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

cd ..
```

### 3. Set Up API Keys

Create a `.env` file in the root directory:

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Amadeus API (for Flight Search)
AMADEUS_CLIENT_ID=your-amadeus-client-id-here
AMADEUS_CLIENT_SECRET=your-amadeus-client-secret-here
AMADEUS_ENVIRONMENT=test  # Use "test" for sandbox or "production" for live

# Google APIs
GOOGLE_PLACES_API_KEY=your-google-places-api-key-here
GOOGLE_GEOCODING_API_KEY=your-google-geocoding-api-key-here
```

**Important**: Set usage limits and restrictions on your API keys in provider dashboards.

### 4. Get API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key

#### Amadeus API Credentials
1. Go to [Amadeus for Developers](https://developers.amadeus.com/)
2. Sign up for a free account
3. Create a new app in your dashboard
4. Get your `CLIENT_ID` and `CLIENT_SECRET`
5. Use the test environment for development (free tier available)

#### Google Places API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Places API" and "Geocoding API"
4. Go to "Credentials" and create an API key

## Running the Application

### Quick Start (Recommended)

Use the provided script to start both backend and frontend simultaneously:

```bash
./run.sh
```

This will:
- Start the backend server on `http://localhost:3000`
- Start the frontend web app (Expo) on `http://localhost:8081`

Press `Ctrl+C` to stop both services.

### Manual Start

If you prefer to run services separately:

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run web
```

### Development Mode

For development with auto-reload:

**Backend (with nodemon):**
```bash
cd backend
npm run dev
```

**Frontend (Expo dev server):**
```bash
cd frontend
npm start
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/generate-plan` | POST | Generate initial travel plan |
| `/api/modify-plan` | POST | Modify existing plan via chat |
| `/api/autocomplete` | GET | Location autocomplete suggestions |
