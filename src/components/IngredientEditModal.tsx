import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import type { RecipeIngredientRow } from "../types";

type Props = {
  visible: boolean;
  ingredient: RecipeIngredientRow | null;
  onSave: (grams: number) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onClose: () => void;
};

const toNumber = (input: string): number => {
  const n = Number(String(input).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export default function IngredientEditModal({
  visible,
  ingredient,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [grams, setGrams] = useState("0");

  useEffect(() => {
    if (ingredient) setGrams(String(ingredient.grams ?? 0));
  }, [ingredient]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "800" }}>Edit Ingredient</Text>

        {!ingredient ? (
          <Text style={{ opacity: 0.7 }}>No ingredient selected.</Text>
        ) : (
          <>
            <Text style={{ fontWeight: "700" }}>{ingredient.description}</Text>

            <TextInput
              value={grams}
              onChangeText={setGrams}
              keyboardType="decimal-pad"
              placeholder="Grams"
              style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
            />

            <Pressable
              onPress={() => void onSave(Math.max(0, toNumber(grams)))}
              style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}
            >
              <Text style={{ textAlign: "center", fontWeight: "700" }}>
                Save
              </Text>
            </Pressable>

            <Pressable
              onPress={() => void onDelete()}
              style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}
            >
              <Text style={{ textAlign: "center", fontWeight: "700" }}>
                Delete
              </Text>
            </Pressable>
          </>
        )}

        <Pressable
          onPress={onClose}
          style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}
        >
          <Text style={{ textAlign: "center" }}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
