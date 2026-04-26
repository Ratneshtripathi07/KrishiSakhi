# ESP32 Integration Guide for KrishiSakhi

This guide provides the necessary steps to connect your ESP32 hardware to the KrishiSakhi IoT backend.

## 1. Network Requirements
- The ESP32 must be connected to a WiFi network with internet access (or access to the local server).
- Your server should be reachable from the ESP32. If running locally, use your computer's local IP address (e.g., `192.168.1.x`) instead of `localhost`.

## 2. API Endpoint Details
The KrishiSakhi server listens for data on the following endpoint:

- **URL**: `http://<YOUR_SERVER_IP>:4000/api/hardware/update-data`
- **Method**: `GET`
- **Port**: `4000` (Default)

### Query Parameters
| Parameter | Description | Format |
|-----------|-------------|--------|
| `farmId` | ID of the farm (defaults to 1) | Integer |
| `t` | Air Temperature | Float (°C) |
| `h` | Air Humidity | Float (%) |
| `st` | Soil Temperature | Float (°C) |
| `m` | Soil Moisture | Integer (%) |
| `n` | Nitrogen Level | Integer (mg/kg) |
| `p` | Phosphorus Level | Integer (mg/kg) |
| `k` | Potassium Level | Integer (mg/kg) |
| `ph` | Soil pH | Float (0.0 - 14.0) |

## 3. Example ESP32 Sketch (Arduino C++)

You will need the `WiFi` and `HTTPClient` libraries installed in your Arduino IDE.

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

// Replace with your network credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Replace with your server IP address (Check your computer's IP using ipconfig/ifconfig)
const char* serverName = "http://192.168.1.100:4000/api/hardware/update-data";

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  Serial.println("Connecting");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if(WiFi.status()== WL_CONNECTED){
    HTTPClient http;

    // Simulate sensor readings - Replace these with actual sensor data
    float temp = 28.5;
    float hum = 65.0;
    int moisture = 40;
    int nitrogen = 45;
    int phos = 30;
    int potas = 20;
    float ph = 6.8;

    // Construct request URL with parameters
    String serverPath = String(serverName) + 
                        "?t=" + String(temp) + 
                        "&h=" + String(hum) + 
                        "&m=" + String(moisture) + 
                        "&n=" + String(nitrogen) + 
                        "&p=" + String(phos) + 
                        "&k=" + String(potas) + 
                        "&ph=" + String(ph);
    
    Serial.print("Sending request: ");
    Serial.println(serverPath);

    http.begin(serverPath.c_str());
    
    int httpResponseCode = http.GET();
    
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      String payload = http.getString();
      Serial.println(payload);
    }
    else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
  else {
    Serial.println("WiFi Disconnected");
  }

  // Send data every 30 seconds
  delay(30000);
}
```

## 4. Troubleshooting
- **Firewall**: Ensure the port `4000` is open on your host machine to allow incoming connections from the ESP32.
- **Local IP**: Double check that you are using the computer's IP address (e.g., `192.168.1.10`) and not `127.0.0.1` on the ESP32.
- **Port Matching**: Check `server/.env` to confirm the `PORT` is indeed `4000`.
