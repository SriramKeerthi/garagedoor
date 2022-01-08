import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NativeStackHeaderProps } from "@react-navigation/native-stack/lib/typescript/src/types";
import * as Location from "expo-location";
import { GeofencingEventType } from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { DefaultTheme, Provider as PaperProvider } from "react-native-paper";
import HomeScreen from "./src/screens/HomeScreen";
import { sendBeacon } from "./src/util/util";
import AutoStart from "react-native-autostart";

export type RootStackParamList = {
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});

interface LocationData {
  eventType: GeofencingEventType;
  region: Location.LocationRegion;
}

TaskManager.defineTask("LOCATION_GEOFENCE", async ({ data, error }) => {
  if (error) {
    console.log("Geofencing error", error);
    return;
  }
  const { eventType, region } = data as LocationData;
  const storedCode = parseInt((await AsyncStorage.getItem("code")) || "-1");
  const uuid = (await AsyncStorage.getItem("uuid")) || undefined;

  if (eventType === GeofencingEventType.Enter) {
    console.log(
      "You've entered region:",
      region,
      await Location.getLastKnownPositionAsync()
    );
    sendBeacon(uuid, storedCode < 0 ? undefined : storedCode, 1);
  } else if (eventType === GeofencingEventType.Exit) {
    console.log(
      "You've left region:",
      region,
      await Location.getLastKnownPositionAsync()
    );
    sendBeacon(uuid, storedCode < 0 ? undefined : storedCode, 0);
  }
});

function App() {
  const options = { headerTitleStyle: { fontFamily: "Stainless-Bold" } };

  useEffect(() => {
    if (AutoStart.isCustomAndroid()) {
      AutoStart.startAutostartSettings();
    }
  }, []);

  function Header(props: NativeStackHeaderProps) {
    const title =
      typeof props.options.headerTitle === "string"
        ? props.options.headerTitle
        : '';
    return (
      <View style={{ height: 100, backgroundColor: "white", elevation: 10 }}>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 30,
            paddingHorizontal: 30,
          }}
        >
          <Text
            style={{
              flex: 2,
              color: "black",
              fontSize: 18,
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            {title}
          </Text>
          {props.options.headerRight && props.options.headerRight({})}
        </View>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{ header: (props) => <Header {...props} /> }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerTitle: "Garage Door", ...options }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

export default App;

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#b7410e",
    accent: "black",
  },
};
