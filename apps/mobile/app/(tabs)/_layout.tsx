import { colors } from "@tastemap/tokens";
import { Tabs } from "expo-router";
import { Text } from "react-native";

// Emoji placeholders for the tab icons — to be swapped for the design's line
// icons later. Meaning stays legible (map / explore / profile).
function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{glyph}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent.DEFAULT,
        tabBarInactiveTintColor: colors.ink[3],
        tabBarStyle: {
          backgroundColor: colors.surface.DEFAULT,
          borderTopColor: colors.line.DEFAULT,
        },
        tabBarLabelStyle: { fontWeight: "700", fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "地圖",
          tabBarIcon: ({ focused }) => <TabIcon glyph="🗺️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "探索",
          tabBarIcon: ({ focused }) => <TabIcon glyph="🔍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "我的",
          tabBarIcon: ({ focused }) => <TabIcon glyph="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
