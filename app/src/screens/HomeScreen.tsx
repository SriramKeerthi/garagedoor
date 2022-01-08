import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import "react-native-get-random-values";
import { Button, TextInput, Title } from "react-native-paper";
import SmoothPinCodeInput from "react-native-smooth-pincode-input";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";
import { sendBeacon, sendNotification, startGeofencing } from "../util/util";

const StyledContainer = styled(View)`
  flex: 1;
  justify-content: center;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const StyledButton = styled(Button).attrs({
  labelStyle: {
    fontSize: 20,
  },
})`
  padding: 10px;
  margin: 10px;
`;

const StyledActionButton = styled(StyledButton).attrs({
  labelStyle: {
    fontSize: 20,
  },
})``;

const StyledTitle = styled(Title)`
  font-size: 20px;
  padding: 10px;
`;

const StyledPinCode = styled(SmoothPinCodeInput).attrs({
  containerStyle: {
    alignSelf: "center",
    marginBottom: 20,
  },
  cellStyle: {
    height: 80,
    borderColor: "black",
    borderBottomWidth: 2,
  },
  textStyle: {
    color: "black",
    fontSize: 42,
    marginBottom: -20,
  },
  cellStyleFocused: {
    borderBottomWidth: 1,
    height: 80,
    borderColor: "#b7410e",
  },
  textStyleFocused: { color: "red" },
})``;

const StyledTextInput = styled(TextInput)`
  font-size: 20px;
`;

const StyledLocation = styled(View)`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
`;

const HomeScreen = () => {
  const [uuid, setUuid] = useState<string | undefined>();
  const [code, setCode] = useState<string | undefined>();
  const [major, setMajor] = useState<number | undefined>(undefined);
  const [minor, setMinor] = useState<number | undefined>(undefined);
  const [beaconState, setBeaconState] = useState(0);
  const [status, requestPermission] = Location.useBackgroundPermissions();
  const [statusFg, requestPermissionFg] = Location.useForegroundPermissions();
  const [latitude, setLatitude] = useState<string>("52.360468");
  const [longitude, setLongitude] = useState<string>("4.839489");
  const [fenceLocation, setFenceLocation] = useState<{
    lat: number;
    lng: number;
  }>({ lat: 52.360468, lng: 4.839489 });

  useEffect(() => {
    sendNotification("Waiting for you to come home!");
    requestPermission();
    requestPermissionFg();
  }, []);

  useEffect(() => {
    startGeofencing(
      status,
      requestPermission,
      fenceLocation.lat,
      fenceLocation.lng
    );
  }, [status, requestPermission, fenceLocation]);

  useEffect(() => {
    sendBeacon(uuid, major, minor);
  }, [beaconState]);

  useEffect(() => {
    const loadStoredCode = async () => {
      const storedCode = (await AsyncStorage.getItem("code")) || undefined;
      setCode(storedCode);
      let storedUuid = await AsyncStorage.getItem("uuid");
      if (!storedUuid) {
        const newUuid = uuidv4();
        AsyncStorage.setItem("uuid", newUuid);
        storedUuid = newUuid;
      }
      setUuid(storedUuid);

      const lat = (await AsyncStorage.getItem("lat")) || "52.360468";
      const lng = (await AsyncStorage.getItem("lng")) || "4.839489";
      setLatitude(lat);
      setLongitude(lng);
      setFenceLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
    };
    loadStoredCode();
  }, []);

  const resetDevice = () => {
    AsyncStorage.removeItem("code");
    setMajor(undefined);
    setMinor(undefined);
    setBeaconState(0);
  };

  const pairWithDevice = () => {
    if (code) {
      AsyncStorage.setItem("code", code);
      setMajor(parseInt(code));
      setMinor(0);
      setBeaconState(1);
    }
  };

  const unlockDoor = () => {
    setMinor(1);
    setBeaconState(2);
  };

  const lockDoor = () => {
    setMinor(0);
    setBeaconState(1);
  };

  return (
    <StyledContainer>
      {beaconState == 0 && (
        <>
          <StyledTitle>Door Location:</StyledTitle>
          <StyledLocation>
            <StyledTextInput
              value={latitude}
              autoComplete={"number"}
              onChangeText={setLatitude}
            ></StyledTextInput>

            <StyledTextInput
              value={longitude}
              autoComplete={"number"}
              onChangeText={setLongitude}
            ></StyledTextInput>

            <StyledActionButton
              onPress={() => {
                AsyncStorage.setItem("lat", latitude);
                AsyncStorage.setItem("lng", longitude);
                setFenceLocation({
                  lat: parseFloat(latitude),
                  lng: parseFloat(longitude),
                });
              }}
              mode="contained"
            >
              Set
            </StyledActionButton>
          </StyledLocation>
          <StyledTitle>Device Code:</StyledTitle>

          <StyledPinCode
            value={code}
            onTextChange={setCode}
            codeLength={5}
            restrictToNumbers
          />

          <StyledActionButton
            onPress={pairWithDevice}
            mode="contained"
            disabled={!code || code.length !== 5}
          >
            Pair device
          </StyledActionButton>
        </>
      )}
      {beaconState == 1 && (
        <StyledActionButton onPress={unlockDoor} mode="contained">
          Unlock door
        </StyledActionButton>
      )}
      {beaconState == 2 && (
        <StyledActionButton onPress={lockDoor} mode="contained">
          Lock door
        </StyledActionButton>
      )}
      {beaconState > 0 && (
        <StyledButton onPress={resetDevice}>Unpair device</StyledButton>
      )}
      <StatusBar style="dark" />
    </StyledContainer>
  );
};

export default HomeScreen;
