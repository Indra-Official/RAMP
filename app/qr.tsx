import {
  View,
  Text,
  Pressable,
  Platform,
  StatusBar,
  Image,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';

export default function Chat() {
  const back = require('../assets/img/Back.png');
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  const backgroundColor = colorScheme === 'dark' ? '#000' : '#fff';

  const statusBarHeight =
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor,        // match root/stack contentStyle
        paddingTop: statusBarHeight,
      }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Image
            style={[styles.icon, { tintColor: textColor }]}
            source={back}
          />
        </Pressable>
        <Text style={{color: '#fff'}}>Qr</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  icon: {
    width: 30,
    height: 30,
  },
  title: {
    fontSize: 18,
    marginLeft: 12,
    fontWeight: '600',
  },
});
