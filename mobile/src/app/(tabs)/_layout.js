import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { colors, fonts } from '../../lib/theme';

const ICONS = {
  home: ['home', 'home-outline'],
  search: ['search', 'search-outline'],
  favorites: ['heart', 'heart-outline'],
  messages: ['chatbubble', 'chatbubble-outline'],
  profile: ['person', 'person-outline'],
};

function tab(name) {
  return {
    tabBarIcon: ({ focused, color }) => (
      <Ionicons name={ICONS[name][focused ? 0 : 1]} size={22} color={color} />
    ),
  };
}

export default function TabsLayout() {
  const { signedIn } = useAuth();
  if (!signedIn) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: '#8A94A6',
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarStyle: { borderTopColor: colors.line, backgroundColor: colors.white },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Accueil', ...tab('home') }} />
      <Tabs.Screen name="search" options={{ title: 'Rechercher', ...tab('search') }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favoris', ...tab('favorites') }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', ...tab('messages') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', ...tab('profile') }} />
    </Tabs>
  );
}
