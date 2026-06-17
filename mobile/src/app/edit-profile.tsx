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

import { AreaPicker } from '@/components/AreaPicker';
import { Brand } from '@/constants/brand';
import { useAuth } from '@/lib/auth';
import { clearWriteError, getLastUploadError, getLastWriteError, uploadImage } from '@/lib/db';
import { pickImage } from '@/lib/images';
import { useStore } from '@/lib/store';

export default function EditProfileScreen() {
  const { email, userId, role } = useAuth();
  const { myProfile, updateMyProfile, setupTradesman, getPro, trades: allTrades, addTrade, featureEnabled } = useStore();
  const isTradesman = role === 'tradesman';
  const pro = isTradesman && userId ? getPro(userId) : undefined;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [bio, setBio] = useState('');
  const [years, setYears] = useState('');
  const [trades, setTrades] = useState<string[]>([]);
  const [customTrade, setCustomTrade] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  useEffect(() => {
    if (myProfile) {
      setName(myProfile.fullName);
      setPhone(myProfile.phone);
      setArea(myProfile.area || 'Port of Spain');
      setPhoto(myProfile.photoUrl);
      setBanner(myProfile.bannerUrl);
      if (myProfile.lat != null && myProfile.lng != null) setCoords({ lat: myProfile.lat, lng: myProfile.lng });
    }
  }, [myProfile]);

  // Preload a tradesman's current trade + bio so re-saving doesn't wipe them.
  const DEFAULT_BIO = 'Trusted local tradesman on Trini Tradesman.';
  useEffect(() => {
    if (!pro) return;
    setTrades((cur) => (cur.length ? cur : (pro.services?.length ? pro.services : [])));
    setBio((b) => b || (pro.bio && pro.bio !== DEFAULT_BIO ? pro.bio : ''));
    setYears((y) => y || (pro.yearsExperience != null ? String(pro.yearsExperience) : ''));
  }, [pro?.id, pro?.services?.join(','), pro?.bio, pro?.yearsExperience]);

  const toggleTrade = (t: string) =>
    setTrades((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const submitCustomTrade = async () => {
    const name = customTrade.trim();
    if (!name || busy) return;
    setBusy(true);
    const created = await addTrade(name);
    setBusy(false);
    if (created) {
      setTrades((cur) => (cur.includes(created) ? cur : [...cur, created]));
      setCustomTrade('');
    }
  };

  const choosePhoto = async () => {
    setUploadErr(null);
    const uri = await pickImage();
    if (!uri || !userId) return;
    setPhoto(uri); // show immediately
    setBusy(true);
    // Unique filename per upload so the public URL changes and never serves a
    // stale cached image.
    const url = await uploadImage('uploads', `avatars/${userId}-${Date.now()}.jpg`, uri);
    setBusy(false);
    if (url) setPhoto(url);
    else setUploadErr(getLastUploadError() ?? 'Photo upload failed.');
  };

  const chooseBanner = async () => {
    setUploadErr(null);
    const uri = await pickImage();
    if (!uri || !userId) return;
    setBanner(uri);
    setBusy(true);
    const url = await uploadImage('uploads', `banners/${userId}-${Date.now()}.jpg`, uri);
    setBusy(false);
    if (url) setBanner(url);
    else setUploadErr(getLastUploadError() ?? 'Banner upload failed.');
  };

  const save = async () => {
    setBusy(true);
    setUploadErr(null);
    clearWriteError();
    await updateMyProfile({
      full_name: name.trim(),
      phone: phone.trim(),
      area: area.trim(),
      ...(coords ? { location_lat: coords.lat, location_lng: coords.lng } : {}),
      ...(photo && !photo.startsWith('file') && !photo.startsWith('blob') ? { photo_url: photo.split('?')[0] } : {}),
      ...(banner && !banner.startsWith('file') && !banner.startsWith('blob') ? { banner_url: banner.split('?')[0] } : {}),
    });
    if (isTradesman) {
      await setupTradesman(trades, bio.trim(), years.trim() ? Number(years) : null);
    }
    setBusy(false);
    const err = getLastWriteError();
    if (err) { setSaveErr(err); setSaved(false); }
    else { setSaveErr(null); setSaved(true); }
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
          {isTradesman && (
            <Pressable style={styles.bannerWrap} onPress={chooseBanner}>
              {banner ? (
                <Image source={{ uri: banner }} style={styles.bannerImg} contentFit="cover" />
              ) : (
                <View style={styles.bannerEmpty}>
                  <Ionicons name="image-outline" size={24} color={Brand.muted} />
                  <Text style={styles.bannerHint}>Add a branding banner (your shopfront, work van, logo)</Text>
                </View>
              )}
              <View style={styles.bannerEdit}><Ionicons name="camera" size={14} color="#fff" /></View>
            </Pressable>
          )}

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

          {uploadErr && (
            <View style={styles.uploadErrBox}>
              <Ionicons name="warning-outline" size={16} color={Brand.red} />
              <Text style={styles.uploadErrText}>Couldn’t upload image: {uploadErr}</Text>
            </View>
          )}

          <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
          <Field label="Email" value={email ?? ''} editable={false} placeholder="—" />
          <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="+1 (868) 000-0000" keyboardType="phone-pad" />

          <View style={styles.field}>
            <Text style={styles.label}>Area</Text>
            <AreaPicker area={area} onChange={(v) => { setArea(v.area); setCoords({ lat: v.lat, lng: v.lng }); }} />
            <Text style={styles.tradeHint}>Used to show customers how far you are and to match you with nearby jobs.</Text>
          </View>

          {isTradesman && (
            <View style={styles.field}>
              <Text style={styles.label}>Your trades & skills</Text>
              <View style={styles.tradeGrid}>
                {allTrades.map((t) => {
                  const on = trades.includes(t);
                  return (
                    <Pressable key={t} onPress={() => toggleTrade(t)} style={[styles.tradeChip, on && styles.tradeChipActive]}>
                      {on && <Ionicons name="checkmark" size={13} color="#fff" style={{ marginRight: 4 }} />}
                      <Text style={[styles.tradeChipText, on && styles.tradeChipTextActive]}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {featureEnabled('custom_trades') && (
                <View style={styles.addTradeRow}>
                  <TextInput
                    style={styles.addTradeInput}
                    value={customTrade}
                    onChangeText={setCustomTrade}
                    placeholder="Add your own trade or skill…"
                    placeholderTextColor={Brand.muted}
                    onSubmitEditing={submitCustomTrade}
                    returnKeyType="done"
                    maxLength={40}
                  />
                  <Pressable
                    style={[styles.addTradeBtn, (!customTrade.trim() || busy) && styles.addTradeBtnDisabled]}
                    onPress={submitCustomTrade}
                    disabled={!customTrade.trim() || busy}
                  >
                    <Ionicons name="add" size={22} color="#fff" />
                  </Pressable>
                </View>
              )}
              <Text style={styles.tradeHint}>
                {featureEnabled('custom_trades')
                  ? 'Pick all that apply, or add your own. Customers can search and post jobs for any trade you list.'
                  : 'Pick all that apply so customers can find you when they search.'}
              </Text>
            </View>
          )}

          {isTradesman && (
            <Field label="Years of experience" value={years} onChangeText={setYears} placeholder="e.g. 8" keyboardType="numeric" />
          )}

          {isTradesman && (
            <Field label="About your business" value={bio} onChangeText={setBio} placeholder="Tell customers about your work…" multiline />
          )}

          {saved && (
            <View style={styles.savedRow}>
              <Ionicons name="checkmark-circle" size={18} color={Brand.green} />
              <Text style={styles.savedText}>Profile saved</Text>
            </View>
          )}

          {saveErr && (
            <View style={styles.uploadErrBox}>
              <Ionicons name="warning-outline" size={16} color={Brand.red} />
              <Text style={styles.uploadErrText}>Couldn’t save: {saveErr}</Text>
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

  bannerWrap: { height: 120, borderRadius: 16, backgroundColor: Brand.surfaceAlt, overflow: 'hidden', marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
  bannerImg: { width: '100%', height: '100%' },
  bannerEmpty: { alignItems: 'center', gap: 6, paddingHorizontal: 24 },
  bannerHint: { fontSize: 12, color: Brand.muted, textAlign: 'center' },
  bannerEdit: { position: 'absolute', bottom: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: Brand.red, alignItems: 'center', justifyContent: 'center' },

  avatarWrap: { alignSelf: 'center', marginTop: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 96, height: 96 },
  photoBtn: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: Brand.red, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  changePhoto: { alignSelf: 'center', color: Brand.red, fontWeight: '700', fontSize: 13, marginTop: 10, marginBottom: 12 },
  uploadErrBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FDECEC', borderRadius: 10, padding: 10, marginBottom: 8 },
  uploadErrText: { flex: 1, color: Brand.red, fontSize: 12.5, lineHeight: 17 },

  field: { marginTop: 16 },
  label: { fontSize: 13, fontWeight: '700', color: Brand.ink, marginBottom: 8 },
  tradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tradeChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 11, borderWidth: 1, borderColor: Brand.line },
  tradeChipActive: { backgroundColor: Brand.red, borderColor: Brand.red },
  tradeChipText: { fontSize: 13, fontWeight: '600', color: Brand.body },
  tradeChipTextActive: { color: '#fff' },
  tradeHint: { fontSize: 12, color: Brand.muted, marginTop: 8 },
  addTradeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  addTradeInput: { flex: 1, borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: Brand.ink },
  addTradeBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: Brand.red, alignItems: 'center', justifyContent: 'center' },
  addTradeBtnDisabled: { backgroundColor: Brand.muted },
  input: { borderWidth: 1, borderColor: Brand.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Brand.ink },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  disabled: { backgroundColor: Brand.surfaceAlt, color: Brand.muted },

  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  savedText: { color: Brand.green, fontWeight: '700' },

  saveBtn: { backgroundColor: Brand.red, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
