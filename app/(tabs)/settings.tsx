// app/(tabs)/settings.tsx

import { useEffect, useState } from "react";
import { FlatList, Switch, Text, TextInput, View } from "react-native";
import {
  listNutrientCatalog,
  NutrientCatalogRow,
} from "../../src/db/nutrientsRepo";
import {
  isVisible,
  loadVisibility,
  NutrientVisibilityMap,
  saveVisibility,
} from "../../src/prefs/nutrientPrefs";

export default function NutrientSettings() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<NutrientCatalogRow[]>([]);
  const [vis, setVis] = useState<NutrientVisibilityMap>({});

  async function refresh(search = "") {
    setRows(await listNutrientCatalog(search));
  }

  useEffect(() => {
    (async () => {
      setVis(await loadVisibility());
      await refresh("");
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void refresh(q);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  async function toggle(key: string, value: boolean) {
    const next = { ...vis, [key]: value };
    setVis(next);
    await saveVisibility(next);
  }

  return (
    <View style={{ padding: 12, gap: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: "900" }}>
        Show / Hide Nutrients
      </Text>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search nutrients… (e.g., Energy, Sodium)"
        style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
      />

      <FlatList
        data={rows}
        keyExtractor={(r) => r.nutrient_key}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 10,
              borderBottomWidth: 0.5,
              opacity: 0.98,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontWeight: "700" }}>{item.name}</Text>
              <Text style={{ opacity: 0.6 }}>
                {item.nutrient_key} • {item.unit}
              </Text>
            </View>
            <Switch
              value={isVisible(vis, item.nutrient_key)}
              onValueChange={(v) => void toggle(item.nutrient_key, v)}
            />
          </View>
        )}
      />
    </View>
  );
}
