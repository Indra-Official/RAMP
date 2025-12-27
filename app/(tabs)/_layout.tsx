import { Tabs } from 'expo-router';
import { Image, useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colorScheme === 'dark' ? '#ff0000ff' : '#ff0000ff',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#888' : '#666',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
          borderTopColor: colorScheme === 'dark' ? '#333' : '#e0e0e0',
        },
      }}
    >


      <Tabs.Screen
        name="home"
        options={{
          title: 'chat',
          tabBarIcon: ({ color }) => (
            <Image 
              source={require('../../assets/img/Chat.png')}
              style={{ width: 28, height: 28, tintColor: color }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="transact"
        options={{
          title: 'Transact',
          tabBarIcon: ({ color }) => (
            <Image 
              source={require('../../assets/img/Pay.png')}
              style={{ width: 28, height: 28, tintColor: color }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="broadcast"
        options={{
          title: 'BroadCast',
          tabBarIcon: ({ color }) => (
            <Image 
              source={require('../../assets/img/Broad.png')}
              style={{ width: 26, height: 22, tintColor: color }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="p2p"
        options={{
          title: 'Peer Send',
          tabBarIcon: ({ color }) => (
            <Image 
              source={require('../../assets/img/P2p.png')}
              style={{ width: 23, height: 23, tintColor: color }}
            />
          ),
        }}
      />



    </Tabs>
  );
}