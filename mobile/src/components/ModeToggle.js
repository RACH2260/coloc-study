import { Pressable, View } from 'react-native';
import { Txt } from './ui';
import { colors, radius } from '../lib/theme';

// Bascule "Logements / Colocataires" en haut de l'onglet Rechercher (étudiants seulement)
export default function ModeToggle({ mode, onChange }) {
  const items = [
    { key: 'logements', label: 'Logements' },
    { key: 'colocataires', label: 'Colocataires' },
  ];
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.bg, borderRadius: radius.md, padding: 4, marginBottom: 14 }}>
      {items.map(i => {
        const on = mode === i.key;
        return (
          <Pressable
            key={i.key}
            onPress={() => onChange(i.key)}
            style={{ flex: 1, paddingVertical: 9, borderRadius: radius.sm, alignItems: 'center', backgroundColor: on ? colors.white : 'transparent' }}
          >
            <Txt weight={on ? 'semi' : 'medium'} size={13} color={on ? colors.blue : colors.muted}>{i.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
