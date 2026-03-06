// src/components/IngredientSearchModal.tsx
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import type { FdcSearchFood } from "../types";

type Props = {
  visible: boolean;
  results: FdcSearchFood[];
  search: string;
  setSearch: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSelect: (food: FdcSearchFood) => void;
  onClose: () => void;
};

const getResultSubtitle = (item: FdcSearchFood) => {
  const bits: string[] = [];

  if (item.dataType) bits.push(item.dataType);

  const maybeBrandOwner = (item as any).brandOwner;
  if (maybeBrandOwner) bits.push(maybeBrandOwner);

  return bits.join(" • ");
};

const IngredientSearchModal = ({
  visible,
  results,
  search,
  setSearch,
  loading,
  error,
  onSelect,
  onClose,
}: Props) => {
  if (!visible) return null;
  const insets = useSafeAreaInsets();

  const showStartHint = search.trim().length < 2;
  const showEmpty =
    !loading && !error && search.trim().length >= 2 && results.length === 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        style={{ flex: 1, padding: 16, gap: 12, paddingBottom: insets.bottom }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "800" }}>
            Add Ingredient
          </Text>

          <Pressable
            onPress={onClose}
            style={{ paddingHorizontal: 10, paddingVertical: 8 }}
          >
            <Text style={{ fontWeight: "600" }}>Close</Text>
          </Pressable>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search food (e.g., chicken breast)"
          autoFocus
          style={{
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
          }}
        />

        {showStartHint ? (
          <Text style={{ opacity: 0.65 }}>
            Type at least 2 characters to search.
          </Text>
        ) : null}

        {loading ? <Text>Searching…</Text> : null}

        {error ? (
          <View
            style={{
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Text style={{ opacity: 0.75 }}>{error}</Text>
          </View>
        ) : null}

        {showEmpty ? (
          <Text style={{ opacity: 0.65 }}>No matching ingredients found.</Text>
        ) : null}

        <FlatList
          data={results}
          keyExtractor={(i) => String(i.fdcId)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => {
            const subtitle = getResultSubtitle(item);
            const servingSize = (item as any).servingSize;
            const servingUnit = (item as any).servingSizeUnit;

            return (
              <Pressable
                onPress={() => onSelect(item)}
                style={{
                  borderWidth: 1,
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 10,
                  gap: 4,
                }}
              >
                <Text style={{ fontWeight: "700", fontSize: 15 }}>
                  {item.description}
                </Text>

                {subtitle ? (
                  <Text style={{ opacity: 0.65 }}>{subtitle}</Text>
                ) : null}

                {servingSize ? (
                  <Text style={{ opacity: 0.65 }}>
                    Serving size: {servingSize} {servingUnit ?? ""}
                  </Text>
                ) : null}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
};

export default IngredientSearchModal;
