import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from '../config/firebase';
import { APP_ID, DB_FIELDS } from '../config/constants';
import { processRow } from '../utils/dataProcessing';

export const useTireData = (user) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Dynamically detect all fields from the data (union of all keys in all rows)
  const dynamicFields = useMemo(() => {
    if (data.length === 0) return DB_FIELDS;
    const allKeys = new Set();
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        // Skip internal computed fields
        if (key !== 'capacityValue' && key !== 'typeTags') {
          allKeys.add(key);
        }
      });
    });
    // Prioritize known fields first, then add any new ones
    const knownSet = new Set(DB_FIELDS);
    const known = DB_FIELDS.filter(f => allKeys.has(f));
    const extra = Array.from(allKeys).filter(k => !knownSet.has(k));
    return [...known, ...extra.sort()];
  }, [data]);

  useEffect(() => {
    if (!user) return;
    
    const unsub = onSnapshot(
      doc(db, 'artifacts', APP_ID, 'public', 'data', 'market_data', 'global'),
      (snap) => {
        if (snap.exists()) {
          const rows = snap.data().rows || [];
          setData(rows.map(row => processRow(row)));
        }
        setIsLoading(false);
      }
    );
    
    return unsub;
  }, [user]);

  const syncToCloud = useCallback(async () => {
    if (!window.confirm("CAUTION: This will overwrite the live database. Continue?")) return;
    
    setIsSyncing(true);
    try {
      const cleanRows = data.map(({ capacityValue, typeTags, ...rest }) => rest);
      await setDoc(
        doc(db, 'artifacts', APP_ID, 'public', 'data', 'market_data', 'global'),
        { rows: cleanRows, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      alert("Database synced successfully.");
    } catch (e) {
      alert("Sync error: " + e.message);
    }
    setIsSyncing(false);
  }, [data]);

  const updateRow = useCallback((index, field, value) => {
    setData(prev => {
      const newData = [...prev];
      newData[index] = { ...newData[index], [field]: value };
      // Re-process row if capacity or tire types changed
      if (field === 'Estimated Capacity' || field === 'Tire Types') {
        newData[index] = processRow(newData[index]);
      }
      return newData;
    });
  }, []);

  const addRow = useCallback(() => {
    // Create empty row with all dynamic fields as empty strings
    const emptyRow = dynamicFields.reduce((acc, field) => ({ ...acc, [field]: '' }), {});
    setData(prev => [processRow(emptyRow), ...prev]);
  }, [dynamicFields]);

  const deleteRow = useCallback((index) => {
    setData(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    data,
    setData,
    isLoading,
    isSyncing,
    syncToCloud,
    updateRow,
    addRow,
    deleteRow,
    dbFields: dynamicFields  // Now dynamically detected from data
  };
};
