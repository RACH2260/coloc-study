import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header, Screen, Txt } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { formatShortDate } from '../../lib/format';
import { colors, fonts, radius } from '../../lib/theme';

export default function Chat() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('Discussion');
  const [otherId, setOtherId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const idsRef = useRef(new Set());

  function addMessage(m) {
    if (idsRef.current.has(m.id)) return;
    idsRef.current.add(m.id);
    setMessages(prev => [...prev, m]);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: conv } = await supabase.from('conversations').select('user_a, user_b').eq('id', id).maybeSingle();
      if (conv) {
        const other = conv.user_a === user.id ? conv.user_b : conv.user_a;
        if (active) setOtherId(other);
        const { data: p } = await supabase.from('public_profiles').select('full_name').eq('id', other).maybeSingle();
        if (active && p) setTitle(p.full_name);
      }
      const { data } = await supabase
        .from('messages')
        .select('id, sender_id, body, created_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });
      if (!active) return;
      idsRef.current = new Set((data || []).map(m => m.id));
      setMessages(data || []);
    })();

    const channel = supabase
      .channel(`chat-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, payload => addMessage(payload.new))
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [id, user.id]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    const { data, error: err } = await supabase
      .from('messages')
      .insert({ conversation_id: id, sender_id: user.id, body })
      .select('id, sender_id, body, created_at')
      .single();
    setSending(false);
    if (err) return setError('Message non envoyé. Réessayez.');
    setText('');
    addMessage(data);
  }

  const data = [...messages].reverse();

  return (
    <Screen scroll={false} contentStyle={{ paddingHorizontal: 16 }}>
      <Header
        onBack={() => router.back()}
        title={title}
        right={
          otherId ? (
            <Pressable onPress={() => router.push({ pathname: '/report', params: { type: 'profil', id: otherId } })} hitSlop={10} accessibilityLabel="Signaler">
              <Ionicons name="flag-outline" size={22} color={colors.muted} />
            </Pressable>
          ) : null
        }
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={data}
          inverted
          keyExtractor={m => m.id}
          contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
          renderItem={({ item }) => {
            const mine = item.sender_id === user.id;
            return (
              <View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
                <View style={{ maxWidth: '80%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.lg, backgroundColor: mine ? colors.blue : colors.bg }}>
                  <Txt size={14} color={mine ? colors.white : colors.ink}>{item.body}</Txt>
                </View>
                <Txt size={10} color={colors.muted} style={{ marginTop: 2 }}>{formatShortDate(item.created_at)}</Txt>
              </View>
            );
          }}
          ListEmptyComponent={<Txt color={colors.muted} style={{ textAlign: 'center', marginTop: 40, transform: [{ scaleY: -1 }] }}>Écrivez votre premier message.</Txt>}
        />
        {error ? <Txt size={12} color={colors.danger} weight="semi" style={{ marginBottom: 6 }}>{error}</Txt> : null}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 8, paddingBottom: 4 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Votre message"
            placeholderTextColor="#98A2B3"
            multiline
            maxLength={1000}
            style={{ flex: 1, maxHeight: 110, minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 22, fontFamily: fonts.regular, fontSize: 14, color: colors.ink }}
          />
          <Pressable onPress={send} disabled={!text.trim() || sending} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: text.trim() ? colors.blue : colors.line, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="send" size={19} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
