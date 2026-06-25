// Supabase client for Trini Side Hustle.
// react-native-url-polyfill must be imported before the client is created —
// Supabase relies on the WHATWG URL API which React Native lacks by default.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaces early if .env wasn't set up, instead of failing on the first query.
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy mobile/.env.example to mobile/.env and add your keys.',
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: AsyncStorage,        // persist the session on the device
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,    // not applicable in a native app
  },
});
