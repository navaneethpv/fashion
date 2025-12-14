

"use client";
import { useState } from "react";

interface ImageInput {
  type: 'file' | 'url';
  id: number;
  value: File | string;
  preview: string;
}

interface CategorySuggestion {
  category: string;
  subCategory: string;
}

export function useCategorySuggest() {
  const [suggestedCategory, setSuggestedCategory] = useState<CategorySuggestion | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const suggestCategoryFromFile = async (file: File) => {
    setIsSuggesting(true);

    try {
      const form = new FormData();
      form.append("image", file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/suggest-category`,
        {
          method: "POST",
          body: form,
        }
      );

      const data = await res.json();
      setSuggestedCategory({
        category: data.category || "",
        subCategory: data.subCategory || ""
      });
    } catch (err) {
      console.error("Suggest category failed", err);
      setSuggestedCategory(null);
    } finally {
      setIsSuggesting(false);
    }
  };

  const suggestCategoryFromUrl = async (imageUrl: string) => {
    setIsSuggesting(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/suggest-category-url`,
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl }),
        }
      );

      const data = await res.json();
      setSuggestedCategory({
        category: data.category || "",
        subCategory: data.subCategory || ""
      });
    } catch (err) {
      console.error("Suggest category from URL failed", err);
      setSuggestedCategory(null);
    } finally {
      setIsSuggesting(false);
    }
  };

  // Generic function that handles both file and URL scenarios
  const suggestCategory = (imageInputs: ImageInput[]) => {
    // Prioritize file over URL
    const fileInput = imageInputs.find(i => i.type === 'file' && i.value instanceof File);
    const urlInput = imageInputs.find(i => i.type === 'url' && typeof i.value === 'string');

    if (fileInput && fileInput.value instanceof File) {
      suggestCategoryFromFile(fileInput.value);
    } else if (urlInput && typeof urlInput.value === 'string' && urlInput.value.trim()) {
      suggestCategoryFromUrl(urlInput.value.trim());
    } else {
      alert("Please upload an image file or provide an image URL to use AI suggestion.");
      setIsSuggesting(false);
    }
  };

  return {
    suggestCategory,
    suggestedCategory,
    isSuggesting,
    setSuggestedCategory,
    suggestCategoryFromFile,
    suggestCategoryFromUrl,
  };
}
