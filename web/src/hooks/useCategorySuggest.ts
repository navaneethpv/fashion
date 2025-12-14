// /web/src/hooks/useCategorySuggest.ts
"use client";

import { useState } from 'react';
import axios from 'axios';

// The API endpoint is the same for both request types
const SUGGEST_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/ai/suggest-category`;

export function useCategorySuggest() {
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Can be called with either a File object or an image URL string.
   */
  const suggestCategory = async (source: File | string) => {
    setIsSuggesting(true);
    setError(null);
    setSuggestedCategory(null);

    try {
      let response;
      // CASE 1: The source is a File object from a local upload
      if (source instanceof File) {
        const formData = new FormData();
        formData.append('image', source);
        response = await axios.post<{ category: string }>(SUGGEST_URL, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } 
      // CASE 2: The source is a string (URL)
      else if (typeof source === 'string') {
        response = await axios.post<{ category: string }>(SUGGEST_URL, {
          imageUrl: source // Send as a JSON object
        }, {
          headers: { 'Content-Type': 'application/json' },
        });
      } 
      // Invalid source type
      else {
        throw new Error("Invalid source type for AI suggestion.");
      }
      
      if (response.data && response.data.category) {
        setSuggestedCategory(response.data.category);
      } else {
        throw new Error("AI did not return a valid category.");
      }

    } catch (err: any) {
      const message = err.response?.data?.message || "AI suggestion failed. Check the URL or image file.";
      setError(message);
      alert(message);
    } finally {
      setIsSuggesting(false);
    }
  };

  return { suggestCategory, suggestedCategory, isSuggesting, error, setSuggestedCategory };
}