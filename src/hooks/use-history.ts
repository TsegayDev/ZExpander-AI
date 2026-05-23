
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { HistoryItem } from '@/lib/types';

const HISTORY_STORAGE_KEY = 'zexpander-history';

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof localStorage === 'undefined') return [];
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
      return [];
    }
  });
  const [isLoaded] = useState(true);

  // No need for the first useEffect anymore

  useEffect(() => {
    if (isLoaded) {
      try {
        if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        }
      } catch (error) {
        console.error("Failed to save history to localStorage", error);
      }
    }
  }, [history, isLoaded]);

  const addHistoryItem = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: new Date().toISOString() + Math.random(),
      timestamp: Date.now(),
    };
    setHistory(prev => [newItem, ...prev].slice(0, 50)); // Keep history to 50 items
  }, []);

  const removeHistoryItem = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const removeHistoryItems = useCallback((ids: string[]) => {
    setHistory(prev => prev.filter(item => !ids.includes(item.id)));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getHistoryItem = (id: string) => {
    return history.find(item => item.id === id);
  }

  return { history, isLoaded, addHistoryItem, removeHistoryItem, removeHistoryItems, clearHistory, getHistoryItem };
}
