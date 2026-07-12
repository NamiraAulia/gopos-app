import { useState, useEffect, useCallback } from "react";
import { restockApi } from "../api";
import type { RestockItem } from "../types";

export function useRestock() {
  const [items, setItems] = useState<RestockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await restockApi.getRestockSuggestions();
      if (res.success && res.data) {
        setItems(res.data);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Gagal load asumsi restock", error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    items,
    isLoading,
    refetch: fetchSuggestions,
  };
}
