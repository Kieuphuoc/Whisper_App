import AsyncStorage from "@react-native-async-storage/async-storage";

type ProgressRecord = {
  // epoch ms
  promptedAt?: number;
  cooldownUntil?: number;
  unlockedAt?: number;
};

type ProgressStore = Record<string, ProgressRecord>;

const STORAGE_KEY = "voiceARProgress:v1";

async function readStore(): Promise<ProgressStore> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as ProgressStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: ProgressStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export async function canPromptAR(pinId: string | number, now = Date.now()) {
  const store = await readStore();
  const rec = store[String(pinId)];
  if (!rec) return true;
  if (rec.unlockedAt) return false;
  if (rec.cooldownUntil && rec.cooldownUntil > now) return false;
  return true;
}

export async function markPromptedAR(
  pinId: string | number,
  cooldownSeconds = 10 * 60,
  now = Date.now()
) {
  const store = await readStore();
  const key = String(pinId);
  const rec: ProgressRecord = store[key] ?? {};
  rec.promptedAt = now;
  rec.cooldownUntil = now + cooldownSeconds * 1000;
  store[key] = rec;
  await writeStore(store);
}

export async function markUnlockedAR(pinId: string | number, now = Date.now()) {
  const store = await readStore();
  const key = String(pinId);
  const rec: ProgressRecord = store[key] ?? {};
  rec.unlockedAt = now;
  store[key] = rec;
  await writeStore(store);
}

