import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Segmented } from '@/components/ui';
import { Brand } from '@/constants/brand';

const TRADES = ['Electrician', 'Plumbing', 'AC Repair', 'Carpentry', 'Painting', 'Masonry'];
const BASE: Record<string, number> = { Electrician: 350, Plumbing: 300, 'AC Repair': 400, Carpentry: 320, Painting: 280, Masonry: 380 };
const SIZE_MULT: Record<string, number> = { Small: 1, Medium: 2.2, Large: 4 };

interface Estimate { labour: number; materials: number; callout: number; low: number; high: number; }

export default function AiQuoteScreen() {
  const [trade, setTrade] = useState('Electrician');
  const [desc, setDesc] = useState('');
  const [size, setSize] = useState('Medium');
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [thinking, setThinking] = useState(false);

  const generate = () => {
    setThinking(true);
    setEstimate(null);
    // Simulated AI estimate (deterministic heuristic). Swaps to Claude API later.
    setTimeout(() => {
      const emergency = /emergency|urgent|asap|leak|sparks|no power/i.test(desc);
      const labour = Math.round(BASE[trade] * SIZE_MULT[size] * (emergency ? 1.3 : 1));
      const materials = Math.round(labour * 0.6);
      const callout = 200;
      const total = labour + materials + callout;
      setEstimate({ labour, materials, callout, low: Math.round(total * 0.9 / 10) * 10, high: Math.round(total * 1.15 / 10) * 10 });
      setThinking(false);
    }, 900);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={26} color={Brand.ink} /></Pressable>
        <Text style={styles.title}>AI Quote Generator</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Ionicons name="sparkles" size={20} color={Brand.red} />
            <Text style={styles.introText}>Describe the job and get a suggested price in seconds.</Text>
          </View>

          <Text style={styles.label}>Trade</Text>
          <View style={styles.chips}>
            {TRADES.map((t) => (
              <Pressable key={t} onPress={() => setTrade(t)} style={[styles.chip, trade === t && styles.chipActive]}>
                <Text style={[styles.chipText, trade === t && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Describe the job</Text>
          <TextInput
            style={styles.textarea}
            placeholder="e.g. Replace main breaker panel, 2-storey home, some old wiring…"
            placeholderTextColor={Brand.muted}
            value={desc}
            onChangeText={setDesc}
            multiline
          />

          <Text style={styles.label}>Job size</Text>
          <Segmented options={['Small', 'Medium', 'Large']} value={size} onChange={setSize} />

          <Pressable style={styles.genBtn} onPress={generate} disabled={thinking}>
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={styles.genBtnText}>{thinking ? 'Generating…' : 'Generate estimate'}</Text>
          </Pressable>

          {estimate && (
            <Card style={styles.result}>
              <View style={styles.resultHead}>
                <Ionicons name="sparkles" size={16} color={Brand.red} />
                <Text style={styles.resultTitle}>Suggested quote</Text>
              </View>
              <Text style={styles.range}>TT${estimate.low.toLocaleString()} – ${estimate.high.toLocaleString()}</Text>
              <View style={styles.breakdown}>
                <Row label="Labour" value={estimate.labour} />
                <Row label="Materials (est.)" value={estimate.materials} />
                <Row label="Call-out fee" value={estimate.callout} />
              </View>
              <Text style={styles.note}>Based on {trade.toLowerCase()} rates and a {size.toLowerCase()} job. Adjust before sending.</Text>
              <Pressable style={styles.useBtn} onPress={() => router.back()}>
                <Text style={styles.useBtnText}>Use this quote</Text>
              </Pressable>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>TT${value.toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },

  intro: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Brand.redSoft, padding: 14, borderRadius: 14 },
  introText: { flex: 1, fontSize: 13, color: Brand.body },

  label: { fontSize: 14, fontWeight: '700', color: Brand.ink, marginTop: 22, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Brand.line },
  chipActive: { backgroundColor: Brand.red, borderColor: Brand.red },
  chipText: { fontSize: 13, fontWeight: '600', color: Brand.body },
  chipTextActive: { color: '#fff' },
  textarea: { borderWidth: 1, borderColor: Brand.line, borderRadius: 12, padding: 14, minHeight: 90, textAlignVertical: 'top', fontSize: 15, color: Brand.ink },

  genBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.ink, borderRadius: 14, paddingVertical: 16, marginTop: 24 },
  genBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  result: { marginTop: 20 },
  resultHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resultTitle: { fontSize: 13, fontWeight: '700', color: Brand.red, textTransform: 'uppercase', letterSpacing: 0.5 },
  range: { fontSize: 30, fontWeight: '800', color: Brand.ink, marginTop: 8, letterSpacing: -0.5 },
  breakdown: { marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { fontSize: 14, color: Brand.body },
  rowValue: { fontSize: 14, fontWeight: '700', color: Brand.ink },
  note: { fontSize: 12, color: Brand.muted, marginTop: 12, lineHeight: 17 },
  useBtn: { backgroundColor: Brand.red, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  useBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
