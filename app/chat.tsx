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
import io from 'socket.io-client';

// 🔧 CONFIGURATION
const SOCKET_URL = 'http://192.168.1.9:8080';

// Initialize socket outside component to maintain singleton connection
const socket = io(SOCKET_URL, {
  transports: ['polling', 'websocket'],
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 10,
  autoConnect: false, // Control connection manually in useEffect
});

type MessageData = {
  id: string; // Renamed from 'tey' for clarity
  sender: string;
  message: string;
  time: string;
};

type SocketMessagePayload = {
  id: string;
  senderId: string;
  message: string;
  time?: string;
  roomId: string;
};

export default function Chat() {
  // Assets
  const back = require("../assets/img/Back.png");
  const dots = require("../assets/img/Dot.png");
  const plus = require("../assets/img/Plus.png");
  const pay = require("../assets/img/Pay.png");
  const send = require("../assets/img/Send.png");

  // Router Params
  const { id: roomIdParams, title } = useLocalSearchParams<{ id: string; title: string }>();
  const roomId = roomIdParams || 'test123';

  // State
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<MessageData[]>([]);
  
  // Refs
  const listRef = useRef<FlatList>(null);

  // Theme
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const textColor = isDark ? "#fff" : "#000";
  const lColor = isDark ? "#cececeff" : "#999";
  const backgroundColor = isDark ? "#000" : "#fff";
  const redColor = "#d40000";
  const statusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;

  // 1. Socket Logic (Connection + Join)
  useEffect(() => {
    // Handlers
    const onConnect = () => {
      setIsConnected(true);
      socket.emit('join', roomId);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onMessageReceived = (data: SocketMessagePayload) => {
      // Filter out own messages (echo)
      if (data.senderId === socket.id) return;

      setMessages((prevMessages) => {
        // Duplicate Protection
        const isDuplicate = prevMessages.some((msg) => msg.id === data.id);
        if (isDuplicate) return prevMessages;

        return [...prevMessages, {
          id: data.id || Date.now().toString(),
          sender: "Other",
          message: data.message,
          time: data.time || "Now",
        }];
      });
    };

    // Setup Listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message', onMessageReceived);

    // Initial Connection Logic
    if (!socket.connected) {
      socket.connect();
    } else {
      // If already connected (e.g., navigating back), ensure we join the room
      socket.emit('join', roomId);
    }

    // Cleanup
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message', onMessageReceived);
    };
  }, [roomId]);

  // 2. Auto-scroll
  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 3. Send Message
  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const uniqueId = Date.now().toString() + Math.random().toString(36).substring(7);

    // Optimistic UI Update
    const newData: MessageData = {
      id: uniqueId,
      sender: "You",
      message: inputValue,
      time: time,
    };

    setMessages((prev) => [...prev, newData]);
    
    // Emit to Server
    const payload: SocketMessagePayload = {
      id: uniqueId,
      roomId: roomId,
      message: inputValue,
      senderId: socket.id || 'unknown',
      time: time
    };
    
    socket.emit('message', payload);
    setInputValue("");
  };

  // 4. Keyboard Animation
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

  const { height } = useGradualAnimation();
  const fakeView = useAnimatedStyle(() => {
    return {
      height: Math.abs(height.value),
    };
  }, []);

  // 5. Render Item
  const renderMessage = ({ item }: { item: MessageData }) => (
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
            item.sender === "You" ? styles.currentUserBubble : styles.otherUserBubble,
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
      
      {/* Connection Status Indicator */}
      <View style={[
        styles.statusIndicator, 
        { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
      ]}>
        <Text style={styles.statusText}>
          {isConnected ? `CONNECTED` : `DISCONNECTED`}
        </Text>
      </View>

      {/* Header */}
      <View style={[styles.topBar, { backgroundColor }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Image
            style={[styles.icon, { tintColor: textColor }]}
            source={back}
          />
        </Pressable>

        <View style={styles.titleBlock}>
          <View style={[styles.GrpImg, { backgroundColor: textColor }]} />
          <View style={styles.titleText}>
            <Text style={[styles.title, { color: textColor }]}>{title || 'Chat'}</Text>
            <Text style={[styles.online, { color: lColor }]}>Online</Text>
          </View>
        </View>

        <Pressable onPress={() => {}} hitSlop={10}>
          <Image
            style={[styles.icon, { tintColor: textColor }]}
            source={dots}
          />
        </Pressable>
      </View>

      {/* Chat List */}
      <View style={{ flex: 1, paddingHorizontal: 10 }}>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          ref={listRef}
          contentContainerStyle={{ flexGrow: 1, paddingTop: 10, paddingBottom: 10 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />
      </View>

      {/* Input Area */}
      <View>
        <View style={[styles.inputBar, { backgroundColor }]}>
          <View style={styles.inputContainer}>
            <Image source={plus} style={styles.smallIcon} />
            <TextInput
              placeholder="Message"
              placeholderTextColor={lColor}
              style={styles.input}
              returnKeyType="send"
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={sendMessage}
            />
            <Image source={pay} style={styles.smallIcon} />
          </View>

          <Pressable
            style={[styles.sendButton, { backgroundColor: redColor }]}
            onPress={sendMessage}
          >
            <Image source={send} style={styles.sendIcon} />
          </Pressable>
        </View>
        {/* Animated Spacer */}
        <Animated.View style={fakeView} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusIndicator: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  topBar: {
    height: 56,
    flexDirection: "row",
    paddingHorizontal: 10,
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cececeff",
  },
  icon: {
    width: 30,
    height: 30,
  },
  titleBlock: {
    flex: 1,
    flexDirection: "row",
    marginLeft: 12,
    alignItems: "center",
  },
  GrpImg: {
    width: 40,
    height: 40,
    borderRadius: 40,
  },
  titleText: {
    marginLeft: 14,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "500",
  },
  online: {
    fontWeight: "400",
    fontSize: 14,
  },
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
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    marginHorizontal: 8,
  },
  smallIcon: {
    width: 30,
    height: 30,
    tintColor: "#ffffff",
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 21,
    paddingLeft: 12,
    paddingTop: 0.5,
    justifyContent: "center",
  },
  sendIcon: {
    width: 23,
    height: 23,
    tintColor: "#ffffff",
  },
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  leftAlign: {
    justifyContent: "flex-start",
  },
  rightAlign: {
    flexDirection: "row-reverse",
  },
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
  message: {
    fontSize: 15,
    lineHeight: 20,
  },
  timeContainer: {
    alignSelf: "flex-end",
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    color: "#7A7A7A",
  },
});
