import { useState, useEffect, useCallback } from "react";
import type { Settings } from "../types";
import { DEFAULT_SETTINGS } from "../types";
import * as storage from "../utils/storage";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const reload = useCallback(async () => {
    const data = await storage.getSettings();
    setSettings(data);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const update = useCallback(
    async (updates: Partial<Settings>) => {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await storage.saveSettings(newSettings);
    },
    [settings],
  );

  return { settings, update, reload };
}
