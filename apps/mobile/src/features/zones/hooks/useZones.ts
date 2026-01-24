import { useCallback, useEffect, useState } from 'react';

import { loadZones, saveZones, type Zone } from '../storage/zonesRepository';

type UseZonesState = {
  zones: Zone[];
  hydrated: boolean;
  addZone: (zone: Zone) => void;
  updateZone: (index: number, zone: Zone) => void;
  deleteZone: (index: number) => void;
  reorderZones: (from: number, to: number) => void;
  replaceZones: (zones: Zone[]) => void;
};

export function useZones(): UseZonesState {
  const [zones, setZones] = useState<Zone[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const storedZones = await loadZones();
        setZones(storedZones);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void saveZones(zones);
  }, [zones, hydrated]);

  const addZone = useCallback((zone: Zone) => {
    setZones((prev) => [...prev, zone]);
  }, []);

  const updateZone = useCallback((index: number, zone: Zone) => {
    setZones((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...zone } : item)));
  }, []);

  const deleteZone = useCallback((index: number) => {
    setZones((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const reorderZones = useCallback((from: number, to: number) => {
    setZones((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const replaceZones = useCallback((next: Zone[]) => {
    setZones(next);
  }, []);

  return {
    zones,
    hydrated,
    addZone,
    updateZone,
    deleteZone,
    reorderZones,
    replaceZones,
  };
}
