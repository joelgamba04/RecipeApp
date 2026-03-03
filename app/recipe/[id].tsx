// app/recipe/[id].tsx

import { ThemedText } from "@/components/themed-text";

const RecipePage = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  return (
    <>
      <ThemedText>Recipe ID: {id}</ThemedText>
    </>
  );
};

export default RecipePage;
