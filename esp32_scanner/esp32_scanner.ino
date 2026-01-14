/**
 * ===============================================
 * ESP32 Barcode Scanner - Smart Cart System
 * ===============================================
 * 
 * Hardware:
 * - ESP32 (WiFi + BT model)
 * - MH-ET LIVE Scanner v3.0 barcode scanner
 * 
 * Connections:
 * - Scanner TX -> ESP32 GPIO16 (RX2)
 * - Scanner RX -> ESP32 GPIO17 (TX2)
 * - Scanner VCC -> 3.3V or 5V (check scanner specs)
 * - Scanner GND -> GND
 * 
 * This code:
 * 1) Connects ESP32 to WiFi
 * 2) Reads barcode data from scanner via UART
 * 3) Sends barcode to Node.js backend via HTTP POST
 * 4) Displays response on Serial Monitor
 * 
 * Author: Smart Cart Team
 * Date: January 2026
 */

#include <WiFi.h>
#include <HTTPClient.h>

// ========================================
// WiFi Configuration - UPDATE THESE!
// ========================================
const char* WIFI_SSID = "YOUR_WIFI_SSID";           // Replace with your WiFi name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";   // Replace with your WiFi password

// ========================================
// Backend Server Configuration
// ========================================
const char* SERVER_IP = "192.168.1.100";  // Replace with your PC's IP address
const int SERVER_PORT = 3000;
const char* CART_ID = "CART001";          // Default cart ID

// ========================================
// UART Configuration for Barcode Scanner
// ========================================
#define SCANNER_RX 16   // ESP32 RX pin (connect to Scanner TX)
#define SCANNER_TX 17   // ESP32 TX pin (connect to Scanner RX)
#define SCANNER_BAUD 9600

// Create second serial port for scanner
HardwareSerial scannerSerial(2);

// Buffer for barcode data
String barcodeBuffer = "";
bool scannerReady = false;

// ========================================
// Setup Function
// ========================================
void setup() {
  // Initialize Serial Monitor for debugging
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("   ESP32 Barcode Scanner - Smart Cart");
  Serial.println("========================================\n");

  // Initialize Scanner Serial
  scannerSerial.begin(SCANNER_BAUD, SERIAL_8N1, SCANNER_RX, SCANNER_TX);
  Serial.println("[Scanner] UART initialized on GPIO16/17");

  // Connect to WiFi
  connectWiFi();
  
  Serial.println("\n[Ready] Waiting for barcode scans...\n");
  scannerReady = true;
}

// ========================================
// Main Loop
// ========================================
void loop() {
  // Check if data available from barcode scanner
  while (scannerSerial.available()) {
    char c = scannerSerial.read();
    
    // Check for end of barcode (Enter/CR/LF)
    if (c == '\n' || c == '\r') {
      // Process complete barcode
      if (barcodeBuffer.length() > 0) {
        processBarcode(barcodeBuffer);
        barcodeBuffer = "";  // Clear buffer for next scan
      }
    } else {
      // Add character to buffer
      barcodeBuffer += c;
    }
  }
  
  // Small delay to prevent watchdog issues
  delay(10);
}

// ========================================
// WiFi Connection Function
// ========================================
void connectWiFi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] Connection FAILED!");
    Serial.println("[WiFi] Please check SSID and password");
  }
}

// ========================================
// Process Scanned Barcode
// ========================================
void processBarcode(String barcode) {
  // Trim whitespace
  barcode.trim();
  
  // Validate barcode (basic check)
  if (barcode.length() < 3) {
    Serial.println("[Scan] Invalid barcode (too short): " + barcode);
    return;
  }
  
  Serial.println("\n----------------------------------------");
  Serial.println("[Scan] Barcode received: " + barcode);
  
  // Send to backend
  sendToBackend(barcode);
}

// ========================================
// Send Barcode to Backend via HTTP POST
// ========================================
void sendToBackend(String barcode) {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Error] WiFi not connected! Reconnecting...");
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[Error] Could not reconnect to WiFi");
      return;
    }
  }
  
  HTTPClient http;
  
  // Build URL
  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/api/scan";
  Serial.println("[HTTP] Sending to: " + url);
  
  // Begin HTTP connection
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Build JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"cartId\":\"" + String(CART_ID) + "\",";
  jsonPayload += "\"barcode\":\"" + barcode + "\"";
  jsonPayload += "}";
  
  Serial.println("[HTTP] Payload: " + jsonPayload);
  
  // Send POST request
  int httpResponseCode = http.POST(jsonPayload);
  
  // Handle response
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("[HTTP] Response code: " + String(httpResponseCode));
    Serial.println("[HTTP] Response: " + response);
    
    if (httpResponseCode == 200) {
      Serial.println("[Success] Product added to cart!");
    } else if (httpResponseCode == 404) {
      Serial.println("[Warning] Product not found in inventory");
    } else {
      Serial.println("[Warning] Unexpected response");
    }
  } else {
    Serial.println("[Error] HTTP request failed");
    Serial.println("[Error] Code: " + String(httpResponseCode));
    Serial.println("[Error] Check server IP and port");
  }
  
  // Close connection
  http.end();
  Serial.println("----------------------------------------\n");
}

// ========================================
// Utility: Check if WiFi is Connected
// ========================================
bool isWiFiConnected() {
  return WiFi.status() == WL_CONNECTED;
}

// ========================================
// Utility: Get ESP32 IP Address
// ========================================
String getIPAddress() {
  if (isWiFiConnected()) {
    return WiFi.localIP().toString();
  }
  return "Not connected";
}
