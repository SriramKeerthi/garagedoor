#include <Arduino.h>

#define RELAY_PIN 13

void setup() {
    // put your setup code here, to run once:
    pinMode(RELAY_PIN, OUTPUT);
}

bool pinState = false;
void loop() {
    // put your main code here, to run repeatedly:
    pinState = !pinState;
    digitalWrite(RELAY_PIN, pinState ? HIGH : LOW);
    delay(5000);
}
