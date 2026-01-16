/**
 * ===============================================
 * ESP32 Smart Cart - Barcode Scanner + LCD + WiFi
 * ===============================================
 * 
 * Hardware:
 * - ESP32
 * - MH-ET LIVE Scanner v3.0 (UART)
 * - 16x2 I2C LCD Display
 * 
 * Connections:
 * - Scanner TX -> ESP32 GPIO16 (RX2)
 * - Scanner RX -> ESP32 GPIO17 (TX2)
 * - LCD SDA -> ESP32 GPIO21
 * - LCD SCL -> ESP32 GPIO22
 * - LCD VCC -> 3.3V, GND -> GND
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// ========================================
// WiFi Configuration (Phone Hotspot)
// ========================================
const char* WIFI_SSID = "raj";
const char* WIFI_PASSWORD = "20202020";

// ========================================
// Backend Server Configuration
// ========================================
const char* SERVER_URL = "https://unimart-backend-hz8v.onrender.com/api/scan";
const char* STATUS_URL = "https://unimart-backend-hz8v.onrender.com/api/cart/";
const char* CART_ID = "101";  // Valid: 101 to 110

// Status polling
unsigned long lastStatusCheck = 0;
const unsigned long STATUS_CHECK_INTERVAL = 2000;  // Check every 2 seconds
String lastCheckoutStatus = "idle";
int dotCount = 0;

// ========================================
// LCD Configuration (I2C address 0x27 or 0x3F)
// ========================================
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ========================================
// Setup
// ========================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  // Scanner on UART2
  Serial2.begin(9600, SERIAL_8N1, 16, 17);

  // LCD init
  lcd.init();
  lcd.backlight();

  // Show startup message
  lcd.setCursor(0, 0);
  lcd.print("  UniMart Cart  ");
  lcd.setCursor(0, 1);
  lcd.print("  Connecting... ");

  // Connect to WiFi
  connectWiFi();

  // Ready message
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Smart Shopping");
  lcd.setCursor(0, 1);
  lcd.print("Scan Product...");

  Serial.println("\n[Ready] Scan a barcode!");
}

// ========================================
// Main Loop
// ========================================
void loop() {
  // Check for barcode scans
  if (Serial2.available()) {
    String code = Serial2.readStringUntil('\n');
    code.trim();

    if (code.length() > 0) {
      Serial.print("SCANNED: ");
      Serial.println(code);

      // Show scanning on LCD
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Scanning...");
      lcd.setCursor(0, 1);
      if (code.length() > 16) {
        lcd.print(code.substring(code.length() - 16));
      } else {
        lcd.print(code);
      }

      // Send to backend and get product info
      sendToBackend(code);
    }
  }
  
  // Poll for checkout status every 2 seconds
  if (millis() - lastStatusCheck > STATUS_CHECK_INTERVAL) {
    lastStatusCheck = millis();
    checkCartStatus();
  }
}

// ========================================
// WiFi Connection
// ========================================
void connectWiFi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected!");
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
    delay(1500);
  } else {
    Serial.println("\n[WiFi] FAILED!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi FAILED!");
    lcd.setCursor(0, 1);
    lcd.print("Check Settings");
    delay(2000);
  }
}

// ========================================
// Send Barcode to Backend
// ========================================
void sendToBackend(String barcode) {
  // Check WiFi
  if (WiFi.status() != WL_CONNECTED) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Lost!");
    lcd.setCursor(0, 1);
    lcd.print("Reconnecting...");
    connectWiFi();
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  // Build JSON payload
  String jsonPayload = "{\"cartId\":\"" + String(CART_ID) + "\",\"barcode\":\"" + barcode + "\"}";
  
  Serial.println("[HTTP] Sending: " + jsonPayload);

  // Send POST request
  int httpCode = http.POST(jsonPayload);

  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("[HTTP] Response: " + response);

    // Parse JSON response to get product name and total
    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, response);

    if (!error) {
      // Get last added item name
      JsonArray items = doc["items"];
      if (items.size() > 0) {
        JsonObject lastItem = items[items.size() - 1];
        const char* productName = lastItem["name"];
        float price = lastItem["price"];
        float total = doc["total"];

        // Show product on LCD
        lcd.clear();
        lcd.setCursor(0, 0);
        
        // Truncate name if too long
        String name = String(productName);
        if (name.length() > 16) {
          name = name.substring(0, 13) + "...";
        }
        lcd.print(name);
        
        lcd.setCursor(0, 1);
        lcd.print("Rs.");
        lcd.print(price, 0);

        Serial.println("[Success] Added: " + name + " Rs." + String(price));
      }
    }

    delay(2000);

  } else if (httpCode == 404) {
    Serial.println("[Warning] Product not found");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Product Not");
    lcd.setCursor(0, 1);
    lcd.print("Found!");
    delay(1500);

  } else {
    Serial.println("[Error] HTTP code: " + String(httpCode));
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Server Error");
    lcd.setCursor(0, 1);
    lcd.print("Code: " + String(httpCode));
    delay(1500);
  }

  http.end();

  // Show ready for next scan
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Scan Next Item");
  lcd.setCursor(0, 1);
  lcd.print("...");
}
// ========================================
// Check Cart Status for Payment Updates
// ========================================
void checkCartStatus() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  HTTPClient http;
  String url = String(STATUS_URL) + String(CART_ID) + "/status";
  http.begin(url);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error) {
      String checkoutStatus = doc["checkoutStatus"].as<String>();
      
      // Only update LCD if status changed or if showing animation
      if (checkoutStatus != lastCheckoutStatus || checkoutStatus == "processing") {
        lastCheckoutStatus = checkoutStatus;
        
        if (checkoutStatus == "checkout") {
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Payment Ongoing");
          lcd.setCursor(0, 1);
          lcd.print("Please wait...");
          
        } else if (checkoutStatus == "processing") {
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Processing");
          lcd.setCursor(0, 1);
          // Animated dots
          dotCount = (dotCount + 1) % 4;
          String dots = "";
          for (int i = 0; i < dotCount; i++) dots += ".";
          lcd.print("Payment" + dots);
          
        } else if (checkoutStatus == "success") {
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("   Payment    ");
          lcd.setCursor(0, 1);
          lcd.print("  Successful!  ");
          
        } else if (checkoutStatus == "receipt") {
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("   Receipt    ");
          lcd.setCursor(0, 1);
          lcd.print("  Generated!   ");
          
        } else if (checkoutStatus == "idle") {
          // Only show ready message if we were in a different state
          if (lastCheckoutStatus != "idle") {
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Smart Shopping");
            lcd.setCursor(0, 1);
            lcd.print("Scan Product...");
          }
        }
      }
    }
  }
  
  http.end();
}