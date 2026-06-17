// Shared iOS-style UI kit for Trini Tradesman.
// Clean white background, soft shadows, rounded "frosted" cards, red accent.
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Switch, Text, View, type ViewStyle } from 'react-native';

import { Brand } from '@/constants/brand';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Tradesman avatar: shows their photo if set, else the trade icon on a tinted background. */
export function ProAvatar({
  photoUrl, icon, color, bg, iconSize = 26, style, children,
}: {
  photoUrl?: string | null; icon: IconName; color: string; bg: string;
  iconSize?: number; style?: ViewStyle; children?: React.ReactNode;
}) {
  return (
    <View style={[{ backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      ) : (
        <Ionicons name={icon} size={iconSize} color={color} />
      )}
      {children}
    </View>
  );
}

/** Soft, frosted "liquid glass" card with layered 3D depth. */
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** A frosted glass surface (for bars, overlays). Caller positions/sizes it. */
export function Glass({ children, style, intensity = 40 }: { children?: React.ReactNode; style?: ViewStyle; intensity?: number }) {
  return (
    <BlurView intensity={intensity} tint="light" style={style}>
      {children}
    </BlurView>
  );
}

/** Soft ambient glow backdrop — gives "liquid glass" surfaces something to refract. */
// Soft blur turns the colour blobs into ambient glows instead of hard circles.
const BLUR = { filter: 'blur(80px)' } as any;

export function Ambient() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['#FFF4F4', '#F7F8FC', '#FFFFFF']} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, BLUR, { backgroundColor: 'rgba(225,29,38,0.18)', top: -80, right: -60 }]} />
      <View style={[styles.blob, BLUR, { backgroundColor: 'rgba(47,111,237,0.14)', top: 160, left: -90 }]} />
      <View style={[styles.blob, BLUR, { backgroundColor: 'rgba(139,92,246,0.12)', bottom: -60, right: -40 }]} />
    </View>
  );
}

/** Section title with optional trailing action ("See all"). */
export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Compact stat card (value + label + icon). */
export function StatCard({ value, label, icon, tint = Brand.red, bg = Brand.redSoft }: { value: string; label: string; icon: IconName; tint?: string; bg?: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** Tappable list row with icon + label, optional value/right element. */
export function ListRow({
  icon, label, value, onPress, danger, right, last, tint,
}: {
  icon?: IconName; label: string; value?: string; onPress?: () => void;
  danger?: boolean; right?: React.ReactNode; last?: boolean; tint?: string;
}) {
  return (
    <Pressable style={[styles.row, !last && styles.rowDivider]} onPress={onPress}>
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: danger ? '#FDECEC' : Brand.surfaceAlt }]}>
          <Ionicons name={icon} size={18} color={danger ? Brand.red : (tint ?? Brand.body)} />
        </View>
      )}
      <Text style={[styles.rowLabel, danger && { color: Brand.red }]}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {right ?? (onPress && <Ionicons name="chevron-forward" size={18} color={Brand.muted} />)}
    </Pressable>
  );
}

/** Row with a toggle switch. */
export function ToggleRow({ icon, label, value, onValueChange, last }: { icon?: IconName; label: string; value: boolean; onValueChange: (v: boolean) => void; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: Brand.surfaceAlt }]}>
          <Ionicons name={icon} size={18} color={Brand.body} />
        </View>
      )}
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D9DBDF', true: Brand.red }}
        thumbColor="#fff"
      />
    </View>
  );
}

/** Small pill badge. */
export function Badge({ label, color = Brand.green, icon }: { label: string; color?: string; icon?: IconName }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '1A' }]}>
      {icon && <Ionicons name={icon} size={12} color={color} />}
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

/** Segmented control / tabs. */
export function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.segment}>
      {options.map((o) => (
        <Pressable key={o} style={[styles.segmentItem, value === o && styles.segmentActive]} onPress={() => onChange(o)}>
          <Text style={[styles.segmentText, value === o && styles.segmentTextActive]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Progress bar. */
export function Progress({ percent }: { percent: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, percent))}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#0B1220',
    shadowOpacity: 0.12,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 9,
  },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: Brand.ink, letterSpacing: -0.3 },
  sectionAction: { fontSize: 13, fontWeight: '700', color: Brand.red },

  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#0B1220',
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800', color: Brand.ink },
  statLabel: { fontSize: 11, color: Brand.muted, marginTop: 2, textAlign: 'center' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, color: Brand.ink, fontWeight: '500' },
  rowValue: { fontSize: 14, color: Brand.muted },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  segment: { flexDirection: 'row', backgroundColor: Brand.surfaceAlt, borderRadius: 12, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  segmentActive: { backgroundColor: Brand.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentText: { fontSize: 13, fontWeight: '600', color: Brand.muted },
  segmentTextActive: { color: Brand.ink },

  progressTrack: { height: 8, borderRadius: 4, backgroundColor: Brand.surfaceAlt, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: Brand.red },
});
