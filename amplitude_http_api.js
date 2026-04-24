// include the following lines in your HTML file
// <script src="amplitude_http_api.js"></script>
// <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

// amplitude_http_api.js
$.ajax({
    url: 'https://api2.amplitude.com/2/httpapi',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*'
    },
    success: function () {
        console.log(JSON.stringify({
            "api_key": "91f2e5830ffdf15de071511eb5e892c7",
            "events": [{
                "device_id": "424861",
                "event_type": "Sign up"
            }]
        }));
    }
})