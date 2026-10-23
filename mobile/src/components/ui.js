import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../lib/theme';
import { initials } from '../lib/format';

/* ---------- Texte ---------- */
export function Txt({ weight = 'regular', size = 14, color = colors.ink, style, ...rest }) {
  return <Text {...rest} style={[{ fontFamily: fonts[weight], fontSize: size, color }, style]} />;
}

/* ---------- Écran ---------- */
export function Screen({ children, scroll = true, edges = ['top', 'bottom'], style, contentStyle, footer }) {
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: colors.white }, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[{ padding: 20, paddingBottom: 32 }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

/* ---------- En-tête avec retour ---------- */
export function Header({ title, onBack, right, center = false }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48, marginBottom: 8 }}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={10} accessibilityLabel="Retour" style={{ width: 40, height: 40, justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
      ) : null}
      <Txt weight="bold" size={center ? 17 : 18} style={{ flex: 1, textAlign: center ? 'center' : 'left' }} numberOfLines={1}>
        {title}
      </Txt>
      <View style={{ minWidth: 40, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

/* ---------- Boutons ---------- */
export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style }) {
  const v = {
    primary: { bg: colors.blue, fg: colors.white, border: colors.blue },
    outline: { bg: colors.white, fg: colors.ink, border: colors.ink },
    soft: { bg: colors.white, fg: colors.blue, border: colors.line },
    orange: { bg: colors.orange, fg: colors.white, border: colors.orange },
    danger: { bg: colors.white, fg: colors.danger, border: colors.danger },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 50,
          paddingHorizontal: 16,
          borderRadius: radius.md,
          borderWidth: 1.5,
          backgroundColor: v.bg,
          borderColor: v.border,
          opacity: off ? 0.55 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={v.fg} /> : null}
          <Txt weight="bold" size={15} color={v.fg}>{title}</Txt>
        </>
      )}
    </Pressable>
  );
}

/* ---------- Champ de saisie ---------- */
export function Field({ label, error, prefix, multiline, style, inputStyle, ...props }) {
  return (
    <View style={[{ marginTop: 14 }, style]}>
      {label ? <Txt weight="semi" size={13} style={{ marginBottom: 6 }}>{label}</Txt> : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.line,
          borderRadius: radius.md,
          backgroundColor: colors.white,
        }}
      >
        {prefix ? (
          <View style={{ paddingHorizontal: 12, alignSelf: 'stretch', justifyContent: 'center', backgroundColor: colors.bg, borderTopLeftRadius: radius.md, borderBottomLeftRadius: radius.md, borderRightWidth: 1, borderRightColor: colors.line }}>
            <Txt weight="semi" size={14}>{prefix}</Txt>
          </View>
        ) : null}
        <TextInput
          {...props}
          multiline={multiline}
          placeholderTextColor="#98A2B3"
          style={[
            {
              flex: 1,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontFamily: fonts.regular,
              fontSize: 14,
              color: colors.ink,
              minHeight: multiline ? 96 : 46,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            inputStyle,
          ]}
        />
      </View>
      {error ? <Txt size={12} color={colors.danger} style={{ marginTop: 4 }}>{error}</Txt> : null}
    </View>
  );
}

/* ---------- Puces de filtre ---------- */
export function Chip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? colors.blue : colors.line,
        backgroundColor: active ? colors.blue : colors.white,
      }}
    >
      <Txt weight="semi" size={13} color={active ? colors.white : colors.ink}>{label}</Txt>
    </Pressable>
  );
}

/* ---------- Badges ---------- */
export function Badge({ label, bg = colors.blue, fg = colors.white, style }) {
  return (
    <View style={[{ alignSelf: 'flex-start', backgroundColor: bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }, style]}>
      <Txt weight="semi" size={11} color={fg}>{label}</Txt>
    </View>
  );
}

export function StatusPill({ status }) {
  const map = {
    en_ligne: { bg: colors.okSoft, fg: colors.ok, dot: colors.ok, label: 'En ligne' },
    en_attente: { bg: colors.orangeSoft, fg: '#B35A00', dot: colors.orange, label: 'En attente' },
    refuse: { bg: colors.dangerSoft, fg: colors.danger, dot: colors.danger, label: 'Refusée' },
    archive: { bg: colors.bg, fg: colors.muted, dot: colors.muted, label: 'Archivée' },
  }[status] || { bg: colors.bg, fg: colors.muted, dot: colors.muted, label: status };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: map.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: map.dot }} />
      <Txt weight="semi" size={11} color={map.fg}>{map.label}</Txt>
    </View>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ uri, name, size = 56 }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.line }} contentFit="cover" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
      <Txt weight="bold" size={size * 0.34} color={colors.blue}>{initials(name)}</Txt>
    </View>
  );
}

/* ---------- Carte, message vide, erreur ---------- */
export function Card({ children, style }) {
  return (
    <View style={[{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 16 }, style]}>
      {children}
    </View>
  );
}

export function EmptyState({ icon = 'albums-outline', title, text, children }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Ionicons name={icon} size={32} color={colors.blue} />
      </View>
      <Txt weight="bold" size={16} style={{ textAlign: 'center' }}>{title}</Txt>
      {text ? <Txt color={colors.muted} style={{ textAlign: 'center', marginTop: 6 }}>{text}</Txt> : null}
      {children ? <View style={{ marginTop: 16, alignSelf: 'stretch' }}>{children}</View> : null}
    </View>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <Txt weight="semi" size={13} color={colors.danger} style={{ marginTop: 10 }}>{children}</Txt>;
}

export function Loader() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
      <ActivityIndicator size="large" color={colors.blue} />
    </View>
  );
}

/* ---------- Logo ---------- */
export function Logo({ size = 28, light = false }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name="school" size={size * 1.25} color={light ? colors.white : colors.blue} />
      <Txt weight="black" size={size} color={light ? colors.white : colors.blue} style={{ letterSpacing: -0.5 }}>
        Coloc
        <Txt weight="black" size={size} color={light ? colors.yellow : colors.blue}>'Study</Txt>
      </Txt>
    </View>
  );
}
