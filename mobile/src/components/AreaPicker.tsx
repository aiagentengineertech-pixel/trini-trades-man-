// Area selector: tap to choose a T&T town from a searchable list, or use the
// device GPS (snaps to the nearest town). Always yields real coordinates.
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { getCurrentArea } from '@/lib/geo';
import { TT_AREAS } from '@/lib/locations';

export interface AreaValue {
  area: string;
  lat: number;
  lng: number;
}

export function AreaPicker({
  area,
  onChange,
  placeholder = 'Select your area',
}: {
  area: string;
  onChange: (v: AreaValue) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = TT_AREAS.filter((a) => a.name.toLowerCase().includes(q.trim().toLowerCase()));

  const useGPS = async () => {
    setError(null);
    setLocating(true);
    const r = await getCurrentArea();
    setLocating(false);
    if (!r) {
      setError('Could not get your location. Pick your area from the list instead.');
      return;
    }
    onChange({ area: r.area.name, lat: r.lat, lng: r.lng });
    setOpen(false);
  };

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Ionicons name="location-outline" size={18} color={Brand.muted} />
        <Text style={[styles.fieldText, !area && { color: Brand.muted }]}>{area || placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={Brand.muted} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <SafeAreaView style={styles.sheet} edges={['bottom']}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Choose your area</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={Brand.ink} />
              </Pressable>
            </View>

            <Pressable style={styles.gpsBtn} onPress={useGPS} disabled={locating}>
              <Ionicons name="navigate" size={18} color={Brand.red} />
              <Text style={styles.gpsText}>{locating ? 'Locating…' : 'Use my current location'}</Text>
            </Pressable>
            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.search}>
              <Ionicons name="search" size={18} color={Brand.muted} />
              <TextInput
                placeholder="Search towns…"
                placeholderTextColor={Brand.muted}
                style={styles.searchInput}
                value={q}
                onChangeText={setQ}
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={list}
              keyExtractor={(a) => a.name}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 380 }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    onChange({ area: item.name, lat: item.lat, lng: item.lng });
                    setOpen(false);
                  }}>
                  <Ionicons name="location" size={16} color={area === item.name ? Brand.red : Brand.muted} />
                  <Text style={[styles.rowText, area === item.name && { color: Brand.red, fontWeight: '700' }]}>{item.name}</Text>
                  <Text style={styles.rowRegion}>{item.region}</Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.empty}>No matching towns.</Text>}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  fieldText: { flex: 1, fontSize: 15, color: Brand.ink },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Brand.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: Brand.line, marginBottom: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Brand.ink },

  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: Brand.red, borderRadius: 12, paddingVertical: 13, marginBottom: 12 },
  gpsText: { color: Brand.red, fontWeight: '800', fontSize: 14 },
  error: { color: Brand.red, fontSize: 12, marginBottom: 10 },

  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Brand.surfaceAlt, borderRadius: 12, paddingHorizontal: 14, marginBottom: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: Brand.ink },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  rowText: { flex: 1, fontSize: 15, color: Brand.ink },
  rowRegion: { fontSize: 12, color: Brand.muted },
  empty: { textAlign: 'center', color: Brand.muted, paddingVertical: 24 },
});
