import BeaconBroadcast from "@jaidis/react-native-ibeacon-simulator";
import * as Location from "expo-location";
import { PermissionResponse } from "expo-modules-core";
import * as Notifications from "expo-notifications";

export const sendNotification = async (message: string) => {
  const notificationId =
    await Notifications.dismissAllNotificationsAsync().then(() =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Garage Door",
          body: message,
          data: {},
          autoDismiss: false,
          sticky: true,
        },
        trigger: null,
      })
    );
  console.log("Notification ID:", notificationId);
};

export const sendBeacon = (
  uuid: string | undefined,
  major: number | undefined,
  minor: number | undefined
) => {
  BeaconBroadcast.checkTransmissionSupported()
    .then(() => {
      BeaconBroadcast.stopAdvertisingBeacon();
      if (uuid && major != undefined && minor != undefined) {
        console.log("Starting beacon!", uuid, major, minor);
        BeaconBroadcast.startAdvertisingBeaconWithString(
          uuid,
          "Hello",
          major,
          minor
        );
        sendNotification(
          minor == 1
            ? "Welcome home, unlocking garage!"
            : "Goodbye, your garage is locked!"
        );
      }
    })
    .catch((e: any) => {
      /* handle return errors */
      // - NOT_SUPPORTED_MIN_SDK
      // - NOT_SUPPORTED_BLE
      // - DEPRECATED_NOT_SUPPORTED_MULTIPLE_ADVERTISEMENTS
      // - NOT_SUPPORTED_CANNOT_GET_ADVERTISER
      // - NOT_SUPPORTED_CANNOT_GET_ADVERTISER_MULTIPLE_ADVERTISEMENTS
      console.log("Unable to transmit beacon:", e);
    });
};

export const startGeofencing = async (
  status: PermissionResponse | null,
  requestPermission: () => Promise<PermissionResponse>,
  latitude: number,
  longitude: number
) => {
  if (status?.granted) {
    const region = {
      identifier: "Home",
      latitude,
      longitude,
      radius: 10,
    };
    console.log("Geofencing start", status);
    await Location.startGeofencingAsync("LOCATION_GEOFENCE", [region]).catch(
      (err) => {
        console.log("Error setting up geofencing", err);
      }
    );
  } else {
    requestPermission();
  }
};
