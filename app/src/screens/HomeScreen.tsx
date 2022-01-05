import BeaconBroadcast from '@jaidis/react-native-ibeacon-simulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-get-random-values';
import { Button, Title } from 'react-native-paper';
import SmoothPinCodeInput from "react-native-smooth-pincode-input";
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

const StyledContainer = styled(View)`
    flex: 1;
    alignItems: center;
    justifyContent: center;
    padding: 20px;
`;

const StyledButton = styled(Button)`
    padding: 10px;
    margin: 10px;
`;

const StyledActionButton = styled(StyledButton)`
`;

const StyledTitle = styled(Title)`
    fontSize: 30px;
    padding: 10px;
`;

const HomeScreen = () => {
    const [uuid, setUuid] = useState<string>('');
    const [code, setCode] = useState<string>('');
    const [major, setMajor] = useState<Number | undefined>(undefined);
    const [minor, setMinor] = useState<Number | undefined>(undefined);
    const [beaconState, setBeaconState] = useState(0);


    useEffect(() => {
        BeaconBroadcast.checkTransmissionSupported()
            .then(() => {
                BeaconBroadcast.stopAdvertisingBeacon()
                if (uuid && major != undefined && minor != undefined) {
                    console.log("Starting beacon!", uuid, major, minor);
                    BeaconBroadcast.startAdvertisingBeaconWithString(uuid, 'Hello', major, minor)
                }
            })
            .catch((e: any) => {
                /* handle return errors */
                // - NOT_SUPPORTED_MIN_SDK
                // - NOT_SUPPORTED_BLE
                // - DEPRECATED_NOT_SUPPORTED_MULTIPLE_ADVERTISEMENTS
                // - NOT_SUPPORTED_CANNOT_GET_ADVERTISER
                // - NOT_SUPPORTED_CANNOT_GET_ADVERTISER_MULTIPLE_ADVERTISEMENTS
                console.log(e);
            })
        return () => {
            console.log('Stopping beacon');
            BeaconBroadcast.stopAdvertisingBeacon();
        }
    }, [beaconState]);

    useEffect(() => {
        const loadStoredCode = async () => {
            const storedCode = await AsyncStorage.getItem('code');
            setCode(storedCode ? storedCode : '');
            let storedUuid = await AsyncStorage.getItem('uuid');
            if (!storedUuid) {
                const newUuid = uuidv4();
                AsyncStorage.setItem('uuid', newUuid);
                storedUuid = newUuid;
            }
            setUuid(storedUuid ? storedUuid : '');
        }
        loadStoredCode();
    }, []);

    const resetDevice = () => {
        AsyncStorage.setItem('code', '');
        setMajor(undefined);
        setMinor(undefined);
        setBeaconState(0);
    }

    const pairWithDevice = () => {
        AsyncStorage.setItem('code', code);
        setMajor(parseInt(code));
        setMinor(0);
        setBeaconState(1);
    }

    const unlockDoor = () => {
        setMinor(1);
        setBeaconState(2);
    }

    const lockDoor = () => {
        setMinor(0);
        setBeaconState(1);
    }

    return (
        <StyledContainer>
            {beaconState == 0 && <>
                <StyledTitle>Device Code:</StyledTitle>

                <SmoothPinCodeInput
                    value={code}
                    onTextChange={setCode}
                    codeLength={5}
                    restrictToNumbers
                    containerStyle={styles.pinInput}
                    cellStyle={styles.cell}
                    textStyle={styles.cellText}
                    cellStyleFocused={styles.cellFocused}
                    textStyleFocused={styles.cellFocusedText}
                />


                <StyledActionButton labelStyle={styles.buttonLabel} onPress={pairWithDevice} mode="contained" disabled={code.length !== 5}>Pair device</StyledActionButton>
            </>}
            {beaconState == 1 && <StyledActionButton labelStyle={styles.buttonLabel} onPress={unlockDoor} mode="contained">Unlock door</StyledActionButton>}
            {beaconState == 2 && <StyledActionButton labelStyle={styles.buttonLabel} onPress={lockDoor} mode="contained">Lock door</StyledActionButton>}
            {beaconState > 0 && <StyledButton labelStyle={styles.buttonLabel} onPress={resetDevice} >Unpair device</StyledButton>}
            <StatusBar style="dark" />
        </StyledContainer>
    )
}

const styles = StyleSheet.create({
    buttonLabel: {
        fontSize: 30
    },
    pinInput: {
        alignSelf: "center",
        marginBottom: 20,
    },
    cell: {
        height: 80,
        borderColor: "black",
        borderBottomWidth: 2
    },
    cellText: {
        color: "black",
        fontSize: 42,
        marginBottom: -20
    },
    cellFocused: {
        borderBottomWidth: 1,
        height: 80,
        borderColor: "#b7410e"
    },
    cellFocusedText: { color: "red" },
});

export default HomeScreen
