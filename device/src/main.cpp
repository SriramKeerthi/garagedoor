#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>
#include <Preferences.h>

#define RELAY_PIN               13
#define LED_CHANNEL             1
#define LED_PIN                 2
#define INACTIVITY_TIMEOUT      2000
#define MAX_RESETS_WITHOUT_CONN 50

/* BLE Settings */
#define BLE_SCAN_TIME          30
#define BLE_INTERVAL           100
#define BLE_WINDOW             99

/* Config Strings */
#define CFG_OWNER_UUID         "OWNER_UUID"
#define CFG_CODE               "CODE"
#define CFG_RESET_WITHOUT_CONN "RST_WO_CONN"

Preferences pref;
BLEScan* pBLEScan;

void scanForDevices( void * pvParameters ) {
    while(true) {
        Serial.println("Scanning...");
        pBLEScan->start(BLE_SCAN_TIME, false);
        pBLEScan->clearResults();
    }
}

// Calculates distance from the beacon
double calculateDistance(int txPower, double rssi) {
    if (rssi == 0) {
        return -1.0; // if we cannot determine accuracy, return -1.
    }

    double ratio = rssi*1.0/txPower;
    if (ratio < 1.0) {
        return pow(ratio,10);
    }
    else {
        double accuracy =  (0.89976)*pow(ratio,7.7095) + 0.111;
        return accuracy;
    }
    // return sqrt(pow(10, (txPower - rssi)/10.0));
}

long lastDeviceNear = millis();

// Event handler for BLE
class GarageDoorCallbacks: public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice advertisedDevice) {
        uint8_t *data = (uint8_t*)advertisedDevice.getManufacturerData().data();
        int len = advertisedDevice.getManufacturerData().length();
        int major = (data[len-5]<<8 | data[len-4]);
        int minor = (data[len-3]<<8 | data[len-2]);
        String uuid = String(advertisedDevice.toString().c_str());
        int subIndex = uuid.indexOf("manufacturer data: ") + 19;
        uuid = uuid.substring(subIndex, subIndex + 32);

        if (pref.isKey(CFG_OWNER_UUID)) { // There is an owner already
            if (pref.getString(CFG_OWNER_UUID).equals(uuid)) { // And it's communicating
                if (pref.isKey(CFG_RESET_WITHOUT_CONN)) {
                    pref.remove(CFG_RESET_WITHOUT_CONN);
                }
                if (major == pref.getInt(CFG_CODE)) {
                    int txPower = (int8_t)advertisedDevice.getManufacturerData().data()[len-1];
                    int rxPower = advertisedDevice.getRSSI();
                    double distance = calculateDistance(txPower, rxPower);
                    Serial.printf("TX: %d RX: %d Distance: %lfm\n", txPower, rxPower, distance);
                    if (distance < 5) {
                        ledcWrite(LED_CHANNEL, 255);
                        if (minor == 0) {
                            digitalWrite(RELAY_PIN, LOW);
                        } else {
                            digitalWrite(RELAY_PIN, HIGH);
                        }
                        lastDeviceNear = millis();
                    }
                } else {
                    // Owner Code seems wrong, ignore
                }
            }
        } else {
            // Check if advertiser is trying to connect
            if (pref.getInt(CFG_CODE) == major && minor == 0) {
                pref.putString(CFG_OWNER_UUID, uuid);
                Serial.printf("Registered new owner: %s!\n", pref.getString(CFG_OWNER_UUID).c_str());
            }
        }
    }
};

void lightCode(int code) {
    int dCode = code;
    int cCode = 0;
    while(dCode > 0) {
        cCode *= 10;
        cCode += dCode % 10;
        dCode /= 10;
    }
    for (int i = 0; i < 255; i++) {
        ledcWrite(LED_CHANNEL, i);
        delay(10);
    }
    ledcWrite(LED_CHANNEL, 0);
    delay(2000);
    for (int i = 0; i < 5; i++) {
        for (int j = 0; j < cCode % 10; j++) {
            ledcWrite(LED_CHANNEL, 255);
            delay(500);
            ledcWrite(LED_CHANNEL, 0);
            delay(500);
        }
        ledcWrite(LED_CHANNEL, 0);
        delay(450);
        ledcWrite(LED_CHANNEL, 20);
        delay(100);
        ledcWrite(LED_CHANNEL, 0);
        delay(450);

        cCode /= 10;
    }
    delay(1000);
    for (int i = 0; i < 255; i++) {
        ledcWrite(LED_CHANNEL, i);
        delay(10);
    }
    ledcWrite(LED_CHANNEL, 0);
}

void setup() {
    Serial.begin(115200);
    delay(100);
    Serial.println("\n\n\n**************************\nGARAGE DOOR DEVICE STARTED\n**************************\nInitializing...");

    // Setup relay pin
    pinMode(RELAY_PIN, OUTPUT);

    // Setup onbloard LED
    ledcSetup(LED_CHANNEL, 5000, 8);
    ledcAttachPin(LED_PIN, LED_CHANNEL);

    // Initialize Pref
    Serial.println("Checking for owner...");
    pref.begin("garagedoor");
    if (pref.isKey(CFG_RESET_WITHOUT_CONN)) {
        int resets = pref.getString(CFG_RESET_WITHOUT_CONN).toInt();
        Serial.printf("Resets without connection: %d (%s)\n", resets, pref.getString(CFG_RESET_WITHOUT_CONN).c_str());
        if (resets > MAX_RESETS_WITHOUT_CONN) {
            pref.clear();
            ESP.restart();
        } else {
            pref.putString(CFG_RESET_WITHOUT_CONN, String(resets + 1).c_str());
        }
    } else {
        pref.putString(CFG_RESET_WITHOUT_CONN, "1");
    }
    if (!pref.isKey(CFG_CODE)) {
        pref.putInt(CFG_CODE, 10000 + random(55000)); // Generate a random number between 10000 - 65000
    }
    Serial.printf("Code: %05d\n", pref.getInt(CFG_CODE));
    if (pref.isKey(CFG_OWNER_UUID)) {
        Serial.printf("Owner exists: %s\n", pref.getString(CFG_OWNER_UUID).c_str());
    } else {
        Serial.println("No owner found");
        lightCode(pref.getInt(CFG_CODE));
    }

    Serial.println("Staring BLE Scanning...");
    // Initialize BLE device
    BLEDevice::init("GarageDoor");
    pBLEScan = BLEDevice::getScan();
    pBLEScan->setAdvertisedDeviceCallbacks(new GarageDoorCallbacks());
    pBLEScan->setActiveScan(true);
    pBLEScan->setInterval(BLE_INTERVAL);
    pBLEScan->setWindow(BLE_WINDOW);

    // Scan for devices in a different core
    xTaskCreatePinnedToCore(
        scanForDevices,
        "scanForDevices",
        64000,
        NULL,
        1,
        NULL,
        1);
}

int ledState = 0;
void loop() {
    if (!pref.isKey(CFG_OWNER_UUID)) {
        ledState = (ledState + 1) % 255;
        ledcWrite(LED_CHANNEL, ledState);
    } else {
        if (millis() - lastDeviceNear > INACTIVITY_TIMEOUT) { // Device inactive, turn off
            ledcWrite(LED_CHANNEL, 0);
        }
    }
    delay(5);
}
