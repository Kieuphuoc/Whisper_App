import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";

const CACHE_DIR = new Directory(Paths.cache, "ar-models");

async function ensureCacheDir() {
  if (!CACHE_DIR.exists) {
    CACHE_DIR.create({ intermediates: true, idempotent: true });
  }
}

/** Download remote GLB to cache; return local file URI for Viro. */
export async function resolveArModelUri(remoteUrl: string): Promise<string> {
  const trimmed = remoteUrl.trim();
  if (!trimmed) throw new Error("Empty model URL");

  if (trimmed.startsWith("file://")) return trimmed;

  await ensureCacheDir();
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, trimmed);
  const dest = new File(CACHE_DIR, `${digest}.glb`);

  if (dest.exists) return dest.uri;

  const downloaded = await File.downloadFileAsync(trimmed, dest, { idempotent: true });
  return downloaded.uri;
}
