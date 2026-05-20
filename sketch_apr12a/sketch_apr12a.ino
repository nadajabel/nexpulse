#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#include "MAX30105.h"
#include "heartRate.h"
#include "DHT.h"

// ================= WIFI =================
const char* WIFI_SSID = "Galaxy A34 5G DAEA";
const char* WIFI_PASS = "00000000";

const char* NODE_RED_HOST = "192.168.236.126";
const uint16_t NODE_RED_PORT = 1880;
const char* NODE_RED_PATH = "/vitals";

WiFiClient client;

// ================= OLED =================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ❤️ Heart icon
const unsigned char heart_bmp [] PROGMEM = {
  0b00000000, 0b00000000,
  0b00001100, 0b00110000,
  0b00011110, 0b01111000,
  0b00111111, 0b11111100,
  0b00111111, 0b11111100,
  0b00011111, 0b11111000,
  0b00001111, 0b11110000,
  0b00000111, 0b11100000,
  0b00000011, 0b11000000,
  0b00000001, 0b10000000,
  0b00000000, 0b00000000,
  0b00000000, 0b00000000
};

// ================= DHT =================
#define DHTPIN D5
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ================= MAX30102 =================
MAX30105 particleSensor;

const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;

float beatsPerMinute;
int beatAvg = 0;

// SpO2
double spo2 = 98.0;
float lastTemp = 0;

// ================= WIFI =================
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("Connecting WiFi");

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (millis() - start > 20000) {
      Serial.println("\nRetry WiFi...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASS);
      start = millis();
    }
  }

  Serial.println("\nWiFi connected");
  Serial.println(WiFi.localIP());
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  Wire.begin();

  connectWiFi();

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED ERROR");
    while (1);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(10, 25);
  display.print("SYSTEM STARTING");
  display.display();

  dht.begin();

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 ERROR");
    while (1);
  }

  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeIR(0x1F);

  delay(2000);
}

// ================= LOOP =================
void loop() {

  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  long irValue = particleSensor.getIR();

  // ================= HEART RATE =================
  if (checkForBeat(irValue)) {
    long delta = millis() - lastBeat;
    lastBeat = millis();

    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute > 30 && beatsPerMinute < 200) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;

      beatAvg = 0;
      for (byte i = 0; i < RATE_SIZE; i++) {
        beatAvg += rates[i];
      }
      beatAvg /= RATE_SIZE;
    }
  }

  static unsigned long lastSend = 0;

  if (millis() - lastSend > 1000) {

    float rawTemp = dht.readTemperature();
    bool finger = (irValue > 30000);

    // ================= TEMP LOGIC =================
    if (finger) {
      // simulation température corps humain
      float target = 36.5 + random(-4, 5) * 0.1;
      lastTemp = (lastTemp * 0.8) + (target * 0.2);
    } else {
      // température réelle environnement
      lastTemp = rawTemp;
    }

    // ================= SPO2 =================
    if (irValue > 50000) {
      long red = particleSensor.getRed();
      double ratio = (double)red / (double)irValue;

      double current = 110 - (18 * ratio);

      if (current > 100) current = 100;
      if (current < 90) current = 90;

      spo2 = (spo2 * 0.8) + (current * 0.2);
    }

    // ================= JSON =================
    String json = "{";
    json += "\"finger\":" + String(finger ? "true" : "false") + ",";
    json += "\"bpm\":" + String(beatAvg) + ",";
    json += "\"spo2\":" + String((int)spo2) + ",";
    json += "\"temp\":" + String(lastTemp);
    json += "}";

    HTTPClient http;
    String url = String("http://") + NODE_RED_HOST + ":" + NODE_RED_PORT + NODE_RED_PATH;

    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");

    int code = http.POST(json);
    http.end();

    Serial.println(json);
    Serial.println(code);

    // ================= OLED =================
    display.clearDisplay();
    display.setTextColor(WHITE);

    if (!finger) {

      display.setTextSize(1);
      display.setCursor(18, 10);
      display.print("HEALTH MONITOR");

      display.setCursor(18, 30);
      display.print("Place finger");

      display.setCursor(25, 45);
      display.print("on sensor");

    } else {

      display.drawBitmap(110, 0, heart_bmp, 10, 10, WHITE);

      display.setTextSize(1);
      display.setCursor(0, 0);
      display.print("LIVE DASHBOARD");

      display.drawLine(0, 10, 128, 10, WHITE);

      display.setCursor(0, 15);
      display.print("Heart: ");
      display.setTextSize(2);
      display.setCursor(60, 12);
      display.print(beatAvg);
      display.setTextSize(1);

      display.setCursor(0, 35);
      display.print("SpO2 : ");
      display.print((int)spo2);
      display.print("%");

      display.setCursor(0, 50);
      display.print("Temp : ");
      display.print(lastTemp);
      display.print(" C");
    }

    display.display();

    lastSend = millis();
  }
}