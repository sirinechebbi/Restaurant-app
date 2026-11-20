import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/AuthContext';
import { CartProvider } from './src/CartContext';
import { colors } from './src/ui';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import RestaurantsScreen from './src/screens/RestaurantsScreen';
import MenuScreen from './src/screens/MenuScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const tabIcon = (name) => ({ color, size }) => <Ionicons name={name} color={color} size={size} />;

function Home() {
  return (
    <Tabs.Navigator screenOptions={{headerShown: false, tabBarActiveTintColor: colors.primary }}>
            <Tabs.Screen name="Restaurants" component={RestaurantsScreen}
                   options={{ title: 'Accueil', headerShown: false, tabBarIcon: tabIcon('home-outline') }} />
      <Tabs.Screen name="Orders" component={OrdersScreen}
                   options={{ title: 'Commandes', tabBarIcon: tabIcon('receipt-outline') }} />
      <Tabs.Screen name="Profile" component={ProfileScreen}
                   options={{ title: 'Profil', tabBarIcon: tabIcon('person-outline') }} />
    </Tabs.Navigator>
  );
}

function Root() {
  const { user, loading } = useAuth();
  const [onboarded, setOnboarded] = useState(null); // null = pas encore lu

  // Pour revoir l'onboarding pendant les tests : remplace temporairement la ligne setOnboarded(v === '1') par setOnboarded(false)
  useEffect(() => {
    SecureStore.getItemAsync('onboarded')
      .then((v) => setOnboarded(v === '1'))
      .catch(() => setOnboarded(true));
  }, []);

  async function finishOnboarding() {
    try { await SecureStore.setItemAsync('onboarded', '1'); } catch (e) { /* sans gravité */ }
    setOnboarded(true);
  }

  if (loading || onboarded === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator  screenOptions={{
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerStyle: { backgroundColor: '#fff' },
      }}>
      {user ? (
        <>
          <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
          <Stack.Screen name="Menu" component={MenuScreen}
                        options={({ route }) => ({ title: route.params.restaurant.name })} />
          <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Mon panier' }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Finaliser la commande' }} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Ma commande' }} />
        </>
      ) : !onboarded ? (
        <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
          {() => <OnboardingScreen onDone={finishOnboarding} />}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Mot de passe oublié' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer>
            <Root />
          </NavigationContainer>
          <StatusBar style="auto" />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}