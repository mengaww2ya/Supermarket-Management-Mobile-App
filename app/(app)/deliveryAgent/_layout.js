import { Stack } from "expo-router";

export default function DeliveryAgentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="systemChat" options={{ headerShown: false, presentation: 'card' }} />
    </Stack>
  );
}
