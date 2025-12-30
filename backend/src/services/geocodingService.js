const { Client } = require("@googlemaps/google-maps-services-js");

class GeocodingService {
    constructor() {
        const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
        if (!apiKey) {
            throw new Error("GOOGLE_GEOCODING_API_KEY not set.");
        }

        // Check for empty key or spaces
        if (!apiKey.trim()) {
            throw new Error("GOOGLE_GEOCODING_API_KEY is empty.");
        }

        this.client = new Client({});
        this.apiKey = apiKey.trim();
    }

    async geocode(address) {
        try {
            const response = await this.client.geocode({
                params: {
                    address: address,
                    key: this.apiKey
                }
            });

            if (response.data.results && response.data.results.length > 0) {
                const location = response.data.results[0].geometry.location;
                return { lat: location.lat, lng: location.lng };
            }
            return null;
        } catch (error) {
            console.error(`Geocoding error for '${address}':`, error.message);
            return null;
        }
    }

    async reverseGeocode(lat, lng) {
        try {
            const response = await this.client.reverseGeocode({
                params: {
                    latlng: { lat, lng },
                    key: this.apiKey
                }
            });

            if (response.data.results && response.data.results.length > 0) {
                return response.data.results[0].formatted_address;
            }
            return null;
        } catch (error) {
            console.error("Reverse geocoding error:", error.message);
            return null;
        }
    }
}

module.exports = GeocodingService;
