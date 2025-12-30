const AmadeusClient = require('./src/services/amadeusClient');

async function testAmadeusIntegration() {
    console.log("Testing AmadeusClient...");
    const amadeus = new AmadeusClient();

    try {
        console.log("Searching for flights (NYC -> LON)...");
        const flights = await amadeus.searchFlights("New York", "London", "2024-06-01");

        console.log("Search Result:");
        console.log(JSON.stringify(flights[0], null, 2));

        if (flights && flights.length > 0) {
            console.log("SUCCESS: Flight data retrieved (or mocked).");
        } else {
            console.log("FAILURE: No flight data returned.");
        }
    } catch (error) {
        console.error("ERROR during flight search:", error);
    }
}

testAmadeusIntegration();
