import {
  View,
  Text,
  Pressable,
  Platform,
  StatusBar,
  Image,
  FlatList,
  useColorScheme,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useMode , useUsers } from "../store";


const INITIAL_MESSAGES = [
  { id: "1", sender: "System", message: "Welcome to the chat UI demo.", time: "10:00 AM" },
];

export default function Chat() {
  // Assets
  const back = require("../assets/img/Back.png");
  const dots = require("../assets/img/Dot.png");
  const plus = require("../assets/img/Plus.png");
  const pay = require("../assets/img/Pay.png");
  const send = require("../assets/img/Send.png");

  // State Management
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const mode = useMode((state) => state.status);
  const setMode = useMode((state) => state.setdtatus);
  const users = useUsers((state) => state.status);
  const setUsers = useUsers((state) => state.setdtatus);
  const listRef = useRef<FlatList>(null);
  
  // Theme Configuration
  const { title } = useLocalSearchParams<{ title: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const textColor = isDark ? "#fff" : "#000";
  const lColor = isDark ? "#cececeff" : "#999";
  const backgroundColor = isDark ? "#000" : "#fff";
  const redColor = "#d40000";
  const statusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Message Send Handler (Local only)
  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      sender: "You",
      message: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMessage]);
    if (mode == "CONNECTED ONLINE") {
      console.log(users);
    };
    setInputValue("");
  };

  // Keyboard Animation
  const { height } = useGradualAnimation();
  const fakeView = useAnimatedStyle(
    () => ({ height: Math.abs(height.value) }),
    []
  );

  // Render Message Bubble
  const renderMessage = ({ item }: { item: any }) => (
    <TouchableOpacity activeOpacity={0.9}>
      <View
        style={[
          styles.container,
          item.sender === "You" ? styles.rightAlign : styles.leftAlign,
        ]}
      >
        <View
          style={[
            styles.bubble,
            item.sender === "You"
              ? styles.currentUserBubble
              : styles.otherUserBubble,
          ]}
        >
          {item.sender !== "You" && (
            <Text style={styles.sender}>{item.sender}</Text>
          )}
          <Text style={[styles.message, { color: textColor }]}>
            {item.message}
          </Text>
          <View style={styles.timeContainer}>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <View style={{ height: statusBarHeight, backgroundColor }} />

      {/* Connection Status Indicator (Static) */}
      <View style={[styles.statusIndicator, {
    'DISCONNECTED': {backgroundColor: '#d32525ff'},
    'CONNECTED OFFLINE': {backgroundColor: '#257fd3ff'},
    'CONNECTED ONLINE': {backgroundColor: '#25D366'},
  }[mode]]}>
        <Text style={styles.statusText}>{mode}</Text>
      </View>

      {/* Header */}
      <View style={[styles.topBar, { backgroundColor }]}>
        <Pressable onPress={() => router.back()} hitSlop={20}>
          <Image
            style={[styles.icon, { tintColor: textColor }]}
            source={back}
          />
        </Pressable>

        <View style={styles.titleBlock}>
          <View style={[styles.GrpImg, { backgroundColor: textColor }]} />
          <View style={styles.titleText}>
            <Text style={[styles.title, { color: textColor }]}>
              {title || "Chat"}
            </Text>
            <Text style={[styles.online, { color: lColor }]}>
              Connected
            </Text>
          </View>
        </View>

        <Pressable onPress={() => {}} hitSlop={20}>
          <Image
            style={[styles.icon, { tintColor: textColor }]}
            source={dots}
          />
        </Pressable>
      </View>

      {/* Main Content Area */}
      <View style={{ flex: 1, paddingHorizontal: 10 }}>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          ref={listRef}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 10,
            paddingBottom: 10,
          }}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        />
      </View>

      {/* Message Input Area */}
      <View>
        <View style={[styles.inputBar, { backgroundColor }]}>
          <View style={styles.inputContainer}>
            <Image source={plus} style={styles.smallIcon} />
            <TextInput
              placeholder="Message"
              placeholderTextColor={lColor}
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <Image source={pay} style={styles.smallIcon} />
          </View>
          <Pressable
            style={[styles.sendButton, { backgroundColor: redColor }]}
            onPress={handleSend}
          >
            <Image source={send} style={styles.sendIcon} />
          </Pressable>
        </View>
        <Animated.View style={fakeView} />
      </View>
    </View>
  );
}

// Animation & Styles
const useGradualAnimation = () => {
  const height = useSharedValue(0);
  useKeyboardHandler(
    {
      onMove: (e) => {
        "worklet";
        height.value = Math.max(e.height, 0);
      },
      onEnd: (e) => {
        "worklet";
        height.value = e.height;
      },
    },
    []
  );
  return { height };
};

const styles = StyleSheet.create({
  statusIndicator: {
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  topBar: {
    height: 56,
    flexDirection: "row",
    paddingHorizontal: 10,
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cececeff",
  },
  icon: { width: 30, height: 30 },
  titleBlock: {
    flex: 1,
    flexDirection: "row",
    marginLeft: 12,
    alignItems: "center",
  },
  GrpImg: { width: 40, height: 40, borderRadius: 40 },
  titleText: { marginLeft: 14, flex: 1 },
  title: { fontSize: 18, fontWeight: "500" },
  online: { fontWeight: "400", fontSize: 14 },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    height: 50,
    backgroundColor: "#2b2b2b",
    borderRadius: 21,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  input: { flex: 1, color: "#fff", fontSize: 15, marginHorizontal: 8 },
  smallIcon: { width: 30, height: 30, tintColor: "#ffffff" },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 21,
    paddingLeft: 12,
    paddingTop: 0.5,
    justifyContent: "center",
  },
  sendIcon: { width: 23, height: 23, tintColor: "#ffffff" },
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  leftAlign: { justifyContent: "flex-start" },
  rightAlign: { flexDirection: "row-reverse" },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  currentUserBubble: {
    backgroundColor: "#1C1C1C",
    marginRight: 8,
    borderBottomRightRadius: 2,
  },
  otherUserBubble: {
    backgroundColor: "#1C1C1C",
    marginLeft: 8,
    borderBottomLeftRadius: 4,
  },
  sender: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF0000",
    marginBottom: 4,
  },
  message: { fontSize: 15, lineHeight: 20 },
  timeContainer: { alignSelf: "flex-end", marginTop: 4 },
  time: { fontSize: 12, color: "#7A7A7A" },
});
