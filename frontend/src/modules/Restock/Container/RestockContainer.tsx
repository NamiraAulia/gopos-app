"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRestockSuggestions } from "@/service/restock.service";
import { useRestockStore } from "../Store/useRestockStore";
import { RestockView } from "../Component/RestockView";
import type { RestockItemDTO } from "../DTO/restock.dto";

export default function RestockContainer() {
  const { selectedSupplier, setSelectedSupplier } = useRestockStore();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["restockSuggestions"],
    queryFn: fetchRestockSuggestions,
  });

  const suppliers = Array.from(
    new Set((items as RestockItemDTO[]).map((item) => item.supplier_name).filter(Boolean))
  ) as string[];

  const filteredItems = (items as RestockItemDTO[]).filter((item) => {
    if (selectedSupplier !== "all" && item.supplier_name !== selectedSupplier) {
      return false;
    }
    return true;
  });

  return (
    <RestockView
      items={items as RestockItemDTO[]}
      filteredItems={filteredItems}
      suppliers={suppliers}
      selectedSupplier={selectedSupplier}
      setSelectedSupplier={setSelectedSupplier}
      isLoading={isLoading}
    />
  );
}
