import { useCallback, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, EmptyState, Txt } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { formatShortDate } from '../../lib/format';
import { colors } from '../../lib/theme';

export default function Messages() {
  const router = useRouter();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const { data: convs } = await supabase
          .from('conversations')
          .select('id, listing_id, user_a, user_b, created_at')
          .order('created_at', { ascending: false });
        const list = convs || [];
        if (!list.length) {
          if (active) { setRows([]); setLoading(false); }
          return;
        }
        const otherIds = [...new Set(list.map(c => (c.user_a === user.id ? c.user_b : c.user_a)))];
        const listingIds = [...new Set(list.map(c => c.listing_id).filter(Boolean))];
        const convIds = list.map(c => c.id);

        const [{ data: people }, { data: listings }, { data: msgs }] = await Promise.all([
          supabase.from('public_profiles').select('id, full_name, avatar_url').in('id', otherIds),
          listingIds.length ? supabase.from('listings').select('id, title').in('id', listingIds) : { data: [] },
          supabase.from('messages').select('conversation_id, body, created_at').in('conversation_id', convIds).order('created_at', { ascending: false }).limit(300),
        ]);

        const lastBy = {};
        (msgs || []).forEach(m => { if (!lastBy[m.conversation_id]) lastBy[m.conversation_id] = m; });

        const out = list.map(c => {
          const otherId = c.user_a === user.id ? c.user_b : c.user_a;
          const p = (people || []).find(x => x.id === otherId);
          const l = (listings || []).find(x => x.id === c.listing_id);
          const last = lastBy[c.id];
          return {
            id: c.id,
            name: p?.full_name || 'Utilisateur',
            avatar: p?.avatar_url,
            title: c.listing_id ? l?.title || 'Annonce' : 'Profil de recherche',
            last: last?.body || 'Aucun message',
            at: last?.created_at || c.created_at,
          };
        });
        out.sort((a, b) => new Date(b.at) - new Date(a.at));
        if (active) { setRows(out); setLoading(false); }
      })();
      return () => { active = false; };
    }, [user.id])
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.white }}>
      <FlatList
        data={rows}
        keyExtractor={r => r.id}
        ListHeaderComponent={<Txt weight="bold" size={20} style={{ marginBottom: 8 }}>Messages</Txt>}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/chat/${item.id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}
          >
            <Avatar uri={item.avatar} name={item.name} size={48} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Txt weight="semi" size={14} numberOfLines={1} style={{ flex: 1 }}>{item.name}</Txt>
                <Txt size={11} color={colors.muted}>{formatShortDate(item.at)}</Txt>
              </View>
              <Txt size={12} color={colors.blue} numberOfLines={1}>{item.title}</Txt>
              <Txt size={13} color={colors.muted} numberOfLines={1}>{item.last}</Txt>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState icon="chatbubble-outline" title="Aucune discussion" text="Après avoir débloqué un contact ou écrit à un colocataire, vos discussions apparaissent ici." />
          )
        }
      />
    </SafeAreaView>
  );
}
