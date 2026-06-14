import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/db';
import { pickImage } from '@/lib/images';
import { useStore } from '@/lib/store';

const TRADES = ['Electrician', 'Plumbing', 'AC Repair', 'Carpentry', 'Painting', 'Masonry'];

export default function EditProfileScreen() {
  const { email, userId, role } = useAuth();
  const { myProfile, updateMyProfile, setupTradesman } = useStore();
  const isTradesman = role === 'tradesman';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [bio, setBio] = useState('');
  const [trade, setTrade] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (myProfile) {
      setName(myProfile.fullName);
      setPhone(myProfile.phone);
      setArea(myProfile.area || 'Port of Spain');
      setPhoto(myProfile.photoUrl);
    }
  }, [myProfile]);

  const choosePhoto = async () => {
    const uri = await pickImage();
    if (!uri || !userId) return;
    setPhoto(uri); // show immediately
    setBusy(true);
    const url = await uploadImage('uploads', `avatars/${userId}.jpg`, uri);
    setBusy(false);
    if (url) setPhoto(url + '?t=' + Date.now());
  };

  const save = async () => {
    setBusy(true);
    await updateMyProfile({
      full_name: name.trim(),
      phone: phone.trim(),
      area: area.trim(),
      ...(photo && !photo.startsWith('file') && !photo.startsWith('blob') ? { photo_url: photo.split('?')[0] } : {}),
    });
    if (isTradesman && trade) {
      await setupTradesman(trade, bio.trim());
    }
    setBusy(false);
    setSaved(true);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Brand.ink} />
        </Pressable>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.avatarWrap} onPress={choosePhoto}>
            <View style={styles.avatar}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <Ionicons name="person" size={40} color={Brand.muted} />
              )}
            </View>
            <View style={styles.photoBtn}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </Pressable>
          <Pressable onPress={choosePhoto}>
            <Text style={styles.changePhoto}>{photo ? 'Change photo' : 'Add photo'}</Text>
          </Pressable>

          <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
          <Field label="Email" value={email ?? ''} editable={false} placeholder="—" />
          <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="+1 (868) 000-0000" keyboardType="phone-pad" />
          <Field label="Area" value={area} onChangeText={setArea} placeholder="e.g. Port of Spain" />

          {isTradesman && (
            <View style={styles.field}>
              <Text style={styles.label}>Your trade</Text>
              <View style={styles.tradeGrid}>
                {TRADES.map((t) => (
                  <Pressable key={t} onPress={() => setTrade(t)} style={[styles.tradeChip, trade === t && styles.tradeChipActive]}>
                    <Text style={[styles.tradeChipText, trade === t && styles.tradeChipTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.tradeHint}>Pick your trade so customers can find you when they search.</Text>
            </View>
          )}

          <Field label={isTradesman ? 'About your business' : 'About'} value={bio} onChangeText={setBio} placeholder="Tell customers about your work…" multiline />

          {saved && (
            <View style={styles.savedRow}>
              <Ionicons name="checkmark-circle" size={18} color={Brand.green} />
              <Text style={styles.savedText}>Profile saved</Text>
            </View>
          )}

          <Pressable style={styles.saveBtn} onPress={save} disabled={busy}>
            <Text style={styles.saveBtnText}>{busy ? 'Saving…' : 'Save Changes'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, multiline, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea, props.editable === false && styles.disabled]}
        placeholderTextColor={Brand.muted}
        multiline={multiline}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.surface },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: Brand.ink },
  content: { padding: 20, paddingBottom: 40 },

  avatarWrap: { alignSelf: 'center', marginTop: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 96, height: 96 },
  photoBtn: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: Brand.red, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  changePhoto: { alignSelf: 'center', color: Brand.red, fontWeight: '700', fontSize: 13, marginTop: 10, marginBottom: 12 },

  field: { marginTop: 16 },
  label: { fontSize: 13, fontWeight: '700', color: Brand.ink, marginBottom: 8 },
  tradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tradeChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 11, borderWidth: 1, borderColor: Brand.line },
  tradeChipActive: { backgroundColor: Brand.red, borderColor: Brand.red },
  tradeChipText: { fontSize: 13, fontWeight: '600', color: Brand.body },
  tradeChipTextActive: { color: '#fff' },
  tradeHint: { fontSize: 12, color: Brand.muted, marginTop: 8 },
  input: { borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Brand.ink },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  disabled: { backgroundColor: Brand.surfaceAlt, color: Brand.muted },

  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  savedText: { color: Brand.green, fontWeight: '700' },

  saveBtn: { backgroundColor: Brand.red, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
