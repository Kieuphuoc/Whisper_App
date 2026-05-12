# Spiderfy Feature — Dev Backup

Code hoàn chỉnh của tính năng Spiderfy (tỏa pin trùng tọa độ), được backup lại để phát triển tiếp.

## Cấu trúc file

| File trong thư mục này | Deploy vào |
|---|---|
| `useSpiderfy.ts` | `App/hooks/useSpiderfy.ts` |
| `SpiderfyMarker.tsx` | `App/components/home/SpiderfyMarker.tsx` |
| `SpiderfyLegs.tsx` | `App/components/home/SpiderfyLegs.tsx` |
| `MapContainer.PATCHED.tsx` | Thay thế `App/components/home/MapContainer.tsx` |

## Trạng thái hiện tại

Logic và animation đã hoàn chỉnh:
- Phát hiện cluster pile-up (epsilon-based, robust với supercluster centroid shift)
- Spiral Archimedean tính vị trí ảo (60m separation, không re-cluster)
- Glassmorphism marker + emoji badge (emotionLabel)
- Reanimated enter (stagger 40ms/pin) + exit animation (runOnJS đúng thread)
- Polyline legs từ tâm đến từng marker ảo
- Dismiss khi tap map trống / pan / zoom

## Vấn đề cần giải quyết trước khi deploy

**react-native-maps không hỗ trợ opt-out clustering cho từng Marker riêng lẻ.**
Virtual spread markers vẫn là children của MapViewClustering nên có thể bị gom
cluster lại nếu user zoom ra đủ xa.

### Hướng giải quyết lâu dài

**Option A — Mapbox (khuyến nghị):**
Chuyển map sang `@rnmapbox/maps`. Dùng `ShapeSource` + `SymbolLayer` để render
markers dưới dạng GeoJSON data thay vì native View. Spiderfy markers có thể được
thêm vào một `ShapeSource` riêng biệt hoàn toàn không liên quan đến clustering layer.

**Option B — Screen coordinate overlay:**
Giữ `react-native-maps`, dùng `mapRef.current.pointForCoordinate(coord)` để
chuyển geo → screen coordinates, render spiderfy markers là `View` tuyệt đối
bên ngoài MapView. Nhược điểm: async API, phải re-calculate khi map pan/zoom.

## Cách deploy khi sẵn sàng

```bash
# 1. Copy 3 file mới vào đúng vị trí
cp App/_spiderfy_dev/useSpiderfy.ts App/hooks/useSpiderfy.ts
cp App/_spiderfy_dev/SpiderfyMarker.tsx App/components/home/SpiderfyMarker.tsx
cp App/_spiderfy_dev/SpiderfyLegs.tsx App/components/home/SpiderfyLegs.tsx

# 2. Sửa require path trong SpiderfyMarker.tsx (dòng ~118):
#    require('../assets/images/...')
#    → require('../../assets/images/...')

# 3. Thay MapContainer
cp App/_spiderfy_dev/MapContainer.PATCHED.tsx App/components/home/MapContainer.tsx
```
