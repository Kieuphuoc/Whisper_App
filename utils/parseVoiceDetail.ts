import { VoicePin } from "@/types";

type UnknownRec = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRec {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

/** Lấy object pin từ một lớp bọc phổ biến của backend. */
function unwrapPinCandidate(body: UnknownRec): unknown {
  const direct =
    body.data ?? body.result ?? body.voice ?? body.voicePin ?? body.voice_pin;
  if (direct != null) return direct;
  return body;
}

function hasCoords(o: UnknownRec): boolean {
  return (
    (typeof o.latitude === "number" || typeof o.latitude === "string") &&
    (typeof o.longitude === "number" || typeof o.longitude === "string")
  );
}

/**
 * Chuẩn hoá body GET /voice/:id/ (axios `res`) thành VoicePin khi đủ id + tọa độ.
 * Hỗ trợ id dạng number hoặc string, và vài dạng bọc { data }, { result }, { voice }…
 */
export function parseVoicePinFromDetailResponse(res: { data?: unknown }): VoicePin | null {
  const body = res?.data;
  if (!isRecord(body)) return null;

  let raw: unknown = unwrapPinCandidate(body);
  if (isRecord(raw) && !hasCoords(raw) && isRecord(raw.data) && hasCoords(raw.data)) {
    raw = raw.data;
  }
  if (isRecord(raw) && !hasCoords(raw) && isRecord(raw.voice) && hasCoords(raw.voice)) {
    raw = raw.voice;
  }

  if (!isRecord(raw) || !hasCoords(raw)) return null;

  const idRaw = raw.id;
  const idNum =
    typeof idRaw === "number" && Number.isFinite(idRaw)
      ? idRaw
      : typeof idRaw === "string" && idRaw.trim() !== "" && Number.isFinite(Number(idRaw))
        ? Number(idRaw)
        : NaN;
  if (!Number.isFinite(idNum)) return null;

  const latNum = Number(raw.latitude);
  const lngNum = Number(raw.longitude);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;

  return { ...raw, id: idNum, latitude: latNum, longitude: lngNum } as VoicePin;
}
