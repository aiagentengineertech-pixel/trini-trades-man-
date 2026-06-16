// A real (static) map image built from OpenStreetMap tiles — no API key, works
// in Expo Go. Shows the location centred with a coverage-radius circle and a pin.
// (The fully interactive/pan-zoom map comes with react-native-maps at the
// native build stage; this gives a true map picture in the meantime.)
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Dimensions, Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';

const TILE = 256;

const lngToWorldX = (lng: number, z: number) => ((lng + 180) / 360) * Math.pow(2, z) * TILE;
const latToWorldY = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z) * TILE;
};
const metersPerPixel = (lat: number, z: number) =>
  (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, z);

export function CoverageMap({
  lat,
  lng,
  radiusKm,
  height = 180,
}: {
  lat: number;
  lng: number;
  radiusKm: number;
  height?: number;
}) {
  // Seed width from the screen so tiles render even if onLayout is slow/absent
  // (e.g. on web); onLayout then refines it to the real container width.
  const [w, setW] = useState(Math.round(Dimensions.get('window').width));
  const onLayout = (e: LayoutChangeEvent) => {
    const lw = Math.round(e.nativeEvent.layout.width);
    if (lw > 0) setW(lw);
  };

  return (
    <View style={[styles.wrap, { height }]} onLayout={onLayout}>
      {w > 0 && <Tiles lat={lat} lng={lng} radiusKm={radiusKm} w={w} h={height} />}
    </View>
  );
}

function Tiles({ lat, lng, radiusKm, w, h }: { lat: number; lng: number; radiusKm: number; w: number; h: number }) {
  const minDim = Math.min(w, h);
  // Pick a zoom so the coverage circle fills ~70% of the smaller dimension.
  const targetMpp = (2 * radiusKm * 1000) / (0.7 * minDim);
  let z = Math.round(Math.log2((156543.03392 * Math.cos((lat * Math.PI) / 180)) / targetMpp));
  z = Math.max(9, Math.min(16, z));

  const n = Math.pow(2, z);
  const cx = lngToWorldX(lng, z);
  const cy = latToWorldY(lat, z);
  const originX = cx - w / 2;
  const originY = cy - h / 2;

  const tiles: { key: string; url: string; left: number; top: number }[] = [];
  const firstTx = Math.floor(originX / TILE);
  const lastTx = Math.floor((originX + w) / TILE);
  const firstTy = Math.floor(originY / TILE);
  const lastTy = Math.floor((originY + h) / TILE);
  for (let tx = firstTx; tx <= lastTx; tx++) {
    for (let ty = firstTy; ty <= lastTy; ty++) {
      if (ty < 0 || ty >= n) continue;
      const wrappedX = ((tx % n) + n) % n;
      tiles.push({
        key: `${tx}_${ty}`,
        url: `https://tile.openstreetmap.org/${z}/${wrappedX}/${ty}.png`,
        left: tx * TILE - originX,
        top: ty * TILE - originY,
      });
    }
  }

  const mpp = metersPerPixel(lat, z);
  const diameter = (2 * radiusKm * 1000) / mpp;

  return (
    <>
      {tiles.map((t) => (
        <Image key={t.key} source={{ uri: t.url }} style={{ position: 'absolute', left: t.left, top: t.top, width: TILE, height: TILE }} resizeMode="cover" />
      ))}
      {/* coverage circle */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: w / 2 - diameter / 2,
          top: h / 2 - diameter / 2,
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          borderWidth: 2,
          borderColor: 'rgba(225,29,38,0.7)',
          backgroundColor: 'rgba(225,29,38,0.12)',
        }}
      />
      {/* centre pin */}
      <View pointerEvents="none" style={{ position: 'absolute', left: w / 2 - 15, top: h / 2 - 28 }}>
        <Ionicons name="location" size={30} color={Brand.red} />
      </View>
      <Text style={styles.attribution}>© OpenStreetMap</Text>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', backgroundColor: '#E8EEF0', overflow: 'hidden', position: 'relative' },
  attribution: { position: 'absolute', right: 4, bottom: 2, fontSize: 9, color: 'rgba(0,0,0,0.55)', backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 4, borderRadius: 3 },
});
