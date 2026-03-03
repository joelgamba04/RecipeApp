// app/(tabs)/settings.tsx

import { useEffect, useState } from "react";
import { Switch, Text, View } from "react-native";
import { NUTRIENTS } from "../../src/nutrition/nutrientCatalog";
import type { NutrientVisibilityMap } from "../../src/prefs/nutrientPrefs";
import { loadVisibility, saveVisibility } from "../../src/prefs/nutrientPrefs";

export default function NutrientSettings() {
  const [vis, setVis] = useState<NutrientVisibilityMap | null>(null);

  useEffect(() => {
    (async () => setVis(await loadVisibility()))();
  }, []);

  async function toggle(key: string, value: boolean) {
    if (!vis) return;
    const next = { ...vis, [key]: value };
    setVis(next);
    await saveVisibility(next);
  }

  if (!vis)
    return (
      <View style={{ padding: 12 }}>
        <Text>Loading…</Text>
      </View>
    );

  return (
    <View style={{ padding: 12, gap: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: "900" }}>
        Show / Hide Nutrients
      </Text>

      {NUTRIENTS.map((n) => (
        <View
          key={n.key}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 8,
          }}
        >
          <Text>{n.label}</Text>
          <Switch
            value={!!vis[n.key]}
            onValueChange={(v) => void toggle(n.key, v)}
          />
        </View>
      ))}
    </View>
  );
}
