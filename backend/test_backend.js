const http = require('http');

const data = JSON.stringify({
    destination: "London",
    start_date: "2024-06-01",
    end_date: "2024-06-07",
    interest_categories: ["culture", "food"],
    activity_level: "moderate"
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/generate-plan',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log("Sending request to backend...");

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Response body:', body.substring(0, 500) + "...");
        try {
            const json = JSON.parse(body);
            if (json.success && json.plan) {
                console.log("TEST PASSED: Plan generated successfully");
            } else {
                console.log("TEST FAILED: " + (json.message || "Unknown error"));
            }
        } catch (e) {
            console.log("TEST FAILED: Invalid JSON response");
        }
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
    process.exit(1);
});

req.write(data);
req.end();
