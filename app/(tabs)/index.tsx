import {
  Text,
  View,
  FlatList,
  Image,
  useColorScheme,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Searchbar } from "react-native-paper";
import React, { useState } from "react";

export default function Index() {
  const peers = require("../../assets/img/Peer.png");
  const Qr = require("../../assets/img/Qr.png");
  const Account = require("../../assets/img/Account.png");

  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#000" : "#fff";
  const bColor = colorScheme === "dark" ? "#282828" : "#e4e4e4ff";
  const pColor = colorScheme === "dark" ? "#999" : "#5b5b5bff";
  const lColor = colorScheme === "dark" ? "#cececeff" : "#999";
  const aColor = colorScheme === "dark" ? "#480000" : "#ff000020";
  const textColor = colorScheme === "dark" ? "#fff" : "#000";

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    "All" | "Unread" | "Groups" | "Servers" | "+"
  >("All");

  const statusBarHeight =
    Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;

  const data = [
    {
      id: "1",
      title: "Red Cloud",
      category: "Unread",
      img: 0,
      last: "You: Where are we meeting?",
    },
    {
      id: "2",
      title: "Akatsuki",
      category: "Groups",
      img: 1,
      last: "Sasuke: Plan changed",
    },
    {
      id: "3",
      title: "Ramp",
      category: "Servers",
      img: 2,
      last: "You: Server uptime 99%",
    },
    {
      id: "4",
      title: "Naruto",
      category: "Unread",
      img: 3,
      last: "Naruto: Believe it!",
    },
    {
      id: "5",
      title: "Hinata",
      category: "Unread",
      img: 4,
      last: "You: Dinner tonight?",
    },
    {
      id: "6",
      title: "Team 7",
      category: "Groups",
      img: 5,
      last: "Sakura: Mission briefing",
    },
    {
      id: "7",
      title: "Dev Team",
      category: "Groups",
      img: 6,
      last: "You: PR approved",
    },
    {
      id: "8",
      title: "Blockchain",
      category: "Servers",
      img: 7,
      last: "Node: Block confirmed",
    },
    {
      id: "9",
      title: "Database",
      category: "Servers",
      img: 8,
      last: "You: Query optimized",
    },
    {
      id: "10",
      title: "Kakashi",
      category: "Unread",
      img: 9,
      last: "You: Late again...",
    },
    {
      id: "11",
      title: "Itachi",
      category: "Groups",
      img: 10,
      last: "You: We need to talk",
    },
    {
      id: "12",
      title: "Support",
      category: "Unread",
      img: 11,
      last: "User: App crashed",
    },
    {
      id: "13",
      title: "Sakura",
      category: "Unread",
      img: 12,
      last: "You: Hospital visit?",
    },
    {
      id: "14",
      title: "Konoha Devs",
      category: "Groups",
      img: 13,
      last: "Shikamaru: Strategy call",
    },
    {
      id: "15",
      title: "API Server",
      category: "Servers",
      img: 14,
      last: "You: 500 error fixed",
    },
    {
      id: "16",
      title: "Sasuke",
      category: "Unread",
      img: 15,
      last: "Sasuke: Meet at valley",
    },
    {
      id: "17",
      title: "Jiraiya",
      category: "Unread",
      img: 16,
      last: "Research complete",
    },
    {
      id: "18",
      title: "Security",
      category: "Servers",
      img: 17,
      last: "You: Firewall updated",
    },
    {
      id: "19",
      title: "ANBU",
      category: "Groups",
      img: 18,
      last: "Mission assigned",
    },
    {
      id: "20",
      title: "Tsunade",
      category: "Unread",
      img: 19,
      last: "Tsunade: Report now",
    },
  ];

  const filteredData = data.filter(
    (item) => activeCategory === "All" || item.category === activeCategory
  );

  type ChatItem = {
    id: string;
    title: string;
    category: "Unread" | "Groups" | "Servers" | string;
    img: number;
    last: string;
  };

  const renderItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/chat",
          params: { id: item.id, title: item.title },
        })
      }
    >
      <View style={styles.chatBox}>
        <View style={[styles.chatLogo, { backgroundColor: textColor }]} />
        <View style={styles.chatDetail}>
          <Text style={[styles.chatTitle, { color: textColor }]}>
            {item.title}
          </Text>
          <Text style={[styles.chatLast, { color: lColor }]}>{item.last}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const listHeader = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.typebar}
      contentContainerStyle={styles.typebarContent}
    >
      {["All", "Unread", "Groups", "Servers"].map((cat) => (
        <TouchableOpacity
          key={cat}
          onPress={() => setActiveCategory(cat as any)}
        >
          <Text
            style={[
              styles.type,
              activeCategory === cat && { backgroundColor: aColor },
            ]}
          >
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={() => setActiveCategory("+")}>
        <Text style={styles.type}>+</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor,
        paddingTop: statusBarHeight,
      }}
    >
      <View style={styles.topbar}>
        <Text style={[styles.logo, { color: textColor }]}>RAMP</Text>
        <View style={styles.buttons}>
          <Image
            style={[styles.icon, { tintColor: textColor }]}
            source={peers}
          />
          <Image style={[styles.icon, { tintColor: textColor }]} source={Qr} />
          <Image
            style={[styles.icon, { tintColor: textColor }]}
            source={Account}
          />
        </View>
      </View>

      <View style={{ marginTop: 10, marginBottom: 10 }}>
        <Searchbar
          placeholder="Search"
          onChangeText={setSearchQuery}
          value={searchQuery}
          placeholderTextColor={pColor}
          style={[styles.search, { backgroundColor: bColor }]}
          inputStyle={styles.searchplace}
        />
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 1,
          paddingBottom: 0,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    alignItems: "center",
    marginTop: -6,
    height: 60,
  },
  logo: {
    fontSize: 35,
    fontWeight: "500", // bold logo
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  icon: {
    width: 30,
    height: 30,
  },
  search: {
    marginHorizontal: 10,
    borderRadius: 5,
    marginTop: -10,
    height: 46,
  },
  searchplace: {
    alignSelf: "center",
    fontSize: 15,
  },
  typebar: {
    marginTop: 5,
    marginBottom: 10,
    maxHeight: 40,
  },
  typebarContent: {
    alignItems: "center",
    paddingHorizontal: 5,
  },
  type: {
    color: "#FF6E6E",
    borderColor: "#FF0000",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    height: 32,
    fontSize: 15,
    fontWeight: "500",
    textAlignVertical: "center",
    lineHeight: 22,
    marginLeft: 10,
  },
  chatBox: {
    flexDirection: "row",
    height: 70,
    marginHorizontal: 15,
    alignItems: "center",
    borderColor: "#454545ff",
    borderBottomWidth: 0.2,
    borderRadius: 40,
  },
  chatLogo: {
    height: 50,
    width: 50,
    borderRadius: 70,
  },
  chatDetail: {
    flex: 1,
    marginLeft: 15,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  chatLast: {
    fontWeight: "300",
  },
});
