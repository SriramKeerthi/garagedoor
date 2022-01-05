import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackHeaderProps } from "@react-navigation/native-stack/lib/typescript/src/types";
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';

export type RootStackParamList = {
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const options = { headerTitleStyle: { fontFamily: 'Stainless-Bold' } }

  function Header(props: NativeStackHeaderProps) {

    const title = typeof props.options.headerTitle === "string" ? props.options.headerTitle : props.options.headerTitle?.({})
    return <View style={{ height: 100, backgroundColor: 'white', elevation: 10 }}>
      <View style={{ flex: 1, flexDirection: "row", alignItems: 'center', justifyContent: 'space-between', paddingTop: 30, paddingHorizontal: 30 }}>
        <Text style={{ flex: 2, color: 'black', fontSize: 18, textTransform: "uppercase", fontWeight: 'bold' }}>{title}</Text>
        {props.options.headerRight && props.options.headerRight({})}
      </View>
    </View>
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home" screenOptions={{ header: (props) => <Header {...props} /> }}>
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerTitle: "Garage Door", ...options }} />
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
    primary: '#b7410e',
    accent: 'black',
  },
};
