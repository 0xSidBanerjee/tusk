import { useState, useEffect } from "react";

export function useActiveList() {
  const [activeListId, setActiveListId] = useState<string>(() => {
    return localStorage.getItem("tusk_active_list_id") || "all";
  });

  useEffect(() => {
    localStorage.setItem("tusk_active_list_id", activeListId);
  }, [activeListId]);

  return { activeListId, setActiveListId };
}
