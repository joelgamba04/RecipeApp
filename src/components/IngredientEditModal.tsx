import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import type { RecipeIngredientRow } from "../types";

type Props = {
  visible: boolean;
  ingredient: RecipeIngredientRow | null;
  onSave: (grams: number) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onClose: () => void;
};

const QUICK_GRAMS = [50, 100, 150, 200];

const toNumber = (input: string): number => {
  const n = Number(String(input).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

const IngredientEditModal = ({
  visible,
  ingredient,
  onSave,
  onDelete,
  onClose,
}: Props) => {
  const insets = useSafeAreaInsets();
  const [grams, setGrams] = useState("0");

  useEffect(() => {
    if (ingredient) {
      setGrams(String(ingredient.grams ?? 0));
    }
  }, [ingredient]);

  if (!visible) return null;

  const gramsNumber = Math.max(0, toNumber(grams));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        style={{ flex: 1, padding: 20, gap: 18, paddingBottom: insets.bottom }}
      >
        {/* Header */}
        <Text style={{ fontSize: 20, fontWeight: "900" }}>Edit Ingredient</Text>

        {!ingredient ? (
          <Text style={{ opacity: 0.6 }}>No ingredient selected.</Text>
        ) : (
          <>
            {/* Ingredient name */}
            <View
              style={{
                borderWidth: 1,
                borderRadius: 14,
                padding: 12,
              }}
            >
              <Text style={{ fontWeight: "800", fontSize: 16 }}>
                {ingredient.description}
              </Text>

              <Text style={{ opacity: 0.6 }}>FDC ID: {ingredient.fdc_id}</Text>
            </View>

            {/* Gram input */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontWeight: "700" }}>Amount (grams)</Text>

              <TextInput
                value={grams}
                onChangeText={setGrams}
                keyboardType="decimal-pad"
                placeholder="Grams"
                style={{
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 16,
                }}
              />
            </View>

            {/* Quick gram buttons */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontWeight: "700" }}>Quick select</Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {QUICK_GRAMS.map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setGrams(String(g))}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ fontWeight: "600" }}>{g} g</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={{ gap: 10, marginTop: 6 }}>
              <Pressable
                onPress={() => void onSave(gramsNumber)}
                style={{
                  padding: 14,
                  borderWidth: 1,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "800", fontSize: 16 }}>Save</Text>
              </Pressable>

              <Pressable
                onPress={() => void onDelete()}
                style={{
                  padding: 14,
                  borderWidth: 1,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "800", color: "#cc3333" }}>
                  Delete Ingredient
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Close */}
        <Pressable
          onPress={onClose}
          style={{
            marginTop: "auto",
            padding: 12,
            borderWidth: 1,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text>Close</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
};

export default IngredientEditModal;
