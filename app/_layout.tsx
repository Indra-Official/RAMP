import { Stack } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useNetInfo } from "@react-native-community/netinfo";
import { WalletProvider } from '../context/WalletContext';
import {
  turnOnWifiDirect,
  turnOffWifiDirect,
  startScan,
  connectToDevice,
  listenForConnection,
} from "../utils/WifiDirectChat";
import {
  turnOnWebRTC,
} from "../utils/WebRTCChat";
import { useMode, useOffline, useOnline, useUsers } from "../store";

export default function RootLayout() {
  // 1. Always call hooks at the top level
  const netInfo = useNetInfo();
  // Safe access with default to false if null/undefined
  const isInternetReachable = netInfo.isInternetReachable ?? false;
  const isConnected = netInfo.isConnected ?? false; 

  const mode = useMode((state) => state.status);
  const setMode = useMode((state) => state.setdtatus);
  const online = useOnline((state) => state.status);
  const setOnline = useOnline((state) => state.setdtatus);
  const offline = useOffline((state) => state.status);
  const setOffline = useOffline((state) => state.setdtatus);
  const users = useUsers((state) => state.status);
  const setUsers = useUsers((state) => state.setdtatus);


  // 2. SystemUI effect (Run once on mount)
  useEffect(() => {
    SystemUI.setBackgroundColorAsync("#000000");
    const init = async () => {
      const success = await turnOnWifiDirect();
      console.log(23, success)
      if (success) {
        // Start listening for connections immediately after init
        console.log(23)
        listenForConnection(
          (msg) => console.log(msg), // Handle incoming message
          (newStatus) => setMode('CONNECTED OFFLINE')         // Handle status change
        );
      }
    };

    init();
  }, []);

  // 3. WebRTC effect (Logic moved INSIDE the effect)
  useEffect(() => {
    if (isInternetReachable && isConnected && mode == 'DISCONNECTED') {
      console.log("Internet detected, initializing WebRTC...", Date.now().toString());
      
      turnOnWebRTC(
        "http://192.168.1.9:8080",
        () => {
          setMode('CONNECTED ONLINE');
        },
        () => {
          setMode('DISCONNECTED');
        },
        (data) => {
          setUsers(data);
        }
      );
    }

    
    return () => {
    };
  }, [isInternetReachable]); // Re-run when internet status changes

  // 4. Render
  return (
    <WalletProvider>
      <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: "#000000" },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="account" options={{ headerShown: false }} />
          <Stack.Screen name="peers" options={{ headerShown: false }} />
          <Stack.Screen name="qr" options={{ headerShown: false }} />
        </Stack>
      </KeyboardProvider>
    </WalletProvider>
  );
}
