import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { FdcSearchFood } from "../types";

type Props = {
  visible: boolean;
  results: FdcSearchFood[];
  search: string;
  setSearch: (v: string) => void;
  onSearch: () => void | Promise<void>;
  onSelect: (food: FdcSearchFood) => void;
  onClose: () => void;
};

const IngredientSearchModal = ({
  visible,
  results,
  search,
  setSearch,
  onSearch,
  onSelect,
  onClose,
}: Props) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, padding: 16, gap: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "800" }}>Add Ingredient</Text>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search food (e.g., chicken breast)"
            style={{ flex: 1, borderWidth: 1, borderRadius: 10, padding: 10 }}
          />
          <Pressable
            onPress={() => void onSearch()}
            style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}
          >
            <Text>Search</Text>
          </Pressable>
        </View>

        <FlatList
          data={results}
          keyExtractor={(i) => String(i.fdcId)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelect(item)}
              style={{
                padding: 12,
                borderWidth: 1,
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontWeight: "700" }}>{item.description}</Text>
              {item.brandName && (
                <Text style={{ opacity: 0.7 }}>{item.brandName ?? ""}</Text>
              )}
              {item.ingridients && (
                <Text style={{ opacity: 0.7 }}>{item.ingridients ?? ""}</Text>
              )}
              {item.foodCategory && (
                <Text style={{ opacity: 0.7 }}>{item.foodCategory ?? ""}</Text>
              )}
            </Pressable>
          )}
        />

        <Pressable
          onPress={onClose}
          style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}
        >
          <Text style={{ textAlign: "center" }}>Close</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
};

export default IngredientSearchModal;