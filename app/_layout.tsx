import { Stack } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#000000');
  }, []);

  return (
    <Stack  screenOptions={{
        headerShown: false,
        animation: 'slide_from_right', 
        contentStyle: { backgroundColor: '#000000' }, 
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
    </Stack>
  );
}
