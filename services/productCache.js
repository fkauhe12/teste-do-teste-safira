// services/productCache.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRODUTOS_CACHE_KEY = "@cache:produtos:v1";

export async function loadProdutosFromCache() {
  try {
    const raw = await AsyncStorage.getItem(PRODUTOS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveProdutosToCache(produtos) {
  try {
    await AsyncStorage.setItem(PRODUTOS_CACHE_KEY, JSON.stringify(produtos));
  } catch {}
}

export async function clearProdutosCache() {
  try {
    await AsyncStorage.removeItem(PRODUTOS_CACHE_KEY);
  } catch {}
}