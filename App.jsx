import React, { useEffect, useRef, useState } from 'react';
import { AppState, StatusBar, Platform, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import BootSplash from 'react-native-bootsplash';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer, {
  Capability,
  AppKilledPlaybackBehavior,
  Event,
  useTrackPlayerEvents
} from 'react-native-track-player';

import { store } from './src/redux/store';
import { setPlayerReady } from './src/redux/slices/playerSlice';
import { setUserData, clearUserData, getUser, setCustomerInfo, updateUser } from './src/redux/slices/userSlice';
import PremiumUpsellModal from './src/components/PremiumUpsellModal';
import { syncPlayHistory } from './src/redux/slices/playHistorySlice';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupPushNotifications } from './src/utils/pushNotifications';

import LoginScreen from './src/screens/LoginScreen';
import SplashScreen from './src/screens/SplashScreen';

import GenderScreen from './src/screens/onboarding/GenderScreen';
import AgeScreen from './src/screens/onboarding/AgeScreen';
import LanguageScreen from './src/screens/onboarding/LanguageScreen';
import EditLanguageScreen from './src/screens/EditLanguageScreen';
import NotificationPermissionScreen from './src/screens/onboarding/NotificationPermissionScreen';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PlaylistScreen from './src/screens/PlaylistScreen';
import PlayScreen from './src/screens/PlayScreen';
import PremiumScreen from './src/screens/PremiumScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ViewPlaylistsScreen from './src/screens/ViewPlaylistsScreen';
import MiniPlayer from './src/components/MiniPlayer';

import { storage } from './src/utils/storage';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Playlist" component={PlaylistScreen} />
    </HomeStack.Navigator>
  );
}

function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Library':
              iconName = focused ? 'library' : 'library-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#f4257b',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(255,255,255,0.1)',
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
          paddingTop: 5,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}>
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const dispatch = useDispatch();
  const isSetup = useRef(false);
  const user = useSelector((state) => state.user.userData);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);
  const [upsellModalVisible, setUpsellModalVisible] = useState(false);

  const isPremium = useSelector((state) => state.user.isPremium);
  const lastActiveTrackRef = useRef(null);

  // Auto-play prevention for gold tracks
  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged, Event.PlaybackQueueEnded], async (event) => {
    if (event.type === Event.PlaybackActiveTrackChanged && event.track) {
      lastActiveTrackRef.current = event.track;
      if (event.track.gold && !isPremium) {
        console.log('[TrackPlayer] Blocking auto-play of gold track:', event.track.title);
        await TrackPlayer.pause();
        // Use a small delay to ensure navigation is ready if needed
        setTimeout(() => {
          if (navigationRef.current) {
            navigationRef.current.navigate('Premium');
          }
        }, 100);
      }
    }

    if (event.type === Event.PlaybackQueueEnded) {
      const lastTrack = lastActiveTrackRef.current;
      if (!isPremium && lastTrack?.playlist?.chapters?.some(ch => ch.gold)) {
        setUpsellModalVisible(true);
      }
    }
  });

  // RevenueCat configuration
  const purchasesConfiguredRef = useRef(false);
  const lastIdentifiedUserIdRef = useRef(null);

  const initPurchases = React.useCallback(async () => {
    try {
      if (purchasesConfiguredRef.current) return;
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

      if (Platform.OS === 'ios') {
        // Replace with your actual iOS API Key
        Purchases.configure({ apiKey: 'appl_WKUseNQMxIhmYyZzPAAvczEdzdw' });
      } else if (Platform.OS === 'android') {
        // Replace with your actual Android API Key
        Purchases.configure({ apiKey: 'goog_rMAprCvaMtWLKDsvaSHMXnDBNif' });
      }
      purchasesConfiguredRef.current = true;
    } catch (e) {
      console.warn('RevenueCat init error:', e);
    }
  }, []);

  const getCustomerInfo = React.useCallback(async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      dispatch(setCustomerInfo(customerInfo));
    } catch (e) {
      console.warn('Failed to fetch customer info:', e);
    }
  }, [dispatch]);

  const identifyPurchasesUser = React.useCallback(async (appUserId) => {
    try {
      // Prevent redundant identification
      if (appUserId === lastIdentifiedUserIdRef.current) return;

      await initPurchases();
      if (appUserId) {
        console.log('Logging in with appUserId:', appUserId);
        await Purchases.logIn(String(appUserId));
        lastIdentifiedUserIdRef.current = appUserId;
      } else {
        try {
          await Purchases.logOut();
          lastIdentifiedUserIdRef.current = null;
        } catch { }
      }
      await getCustomerInfo();
    } catch (e) {
      console.warn('RevenueCat login/logout error:', e);
    }
  }, [initPurchases, getCustomerInfo]);

  useEffect(() => {
    initPurchases();
  }, [initPurchases]);

  // Identify RevenueCat user after login or logout
  useEffect(() => {
    const uid = user?.email || user?.id || user?._id || null;
    identifyPurchasesUser(uid);
  }, [user, identifyPurchasesUser]);

  // Setup TrackPlayer
  useEffect(() => {
    async function setupPlayer() {
      if (isSetup.current) return;
      try {
        await TrackPlayer.setupPlayer({
          autoHandleInterruptions: true,
        });
        await TrackPlayer.updateOptions({
          android: {
            appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
          },
          // This enables background playback support in the notification shade/lock screen
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
            Capability.JumpForward,
            Capability.JumpBackward,
            Capability.Stop,
          ],
          compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
          ],
          notificationCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.Stop,
            Capability.JumpForward,
            Capability.JumpBackward,
          ],
          forwardJumpInterval: 30,
          backwardJumpInterval: 10,
        });
        isSetup.current = true;
        dispatch(setPlayerReady(true));
      } catch (error) {
        console.log('TrackPlayer setup error:', error);
      }
    }
    setupPlayer();

    // Start listening for push notifications
    const unsubscribePush = setupPushNotifications();

    // Handle FCM token refresh
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
      console.log('FCM Token refreshed:', token);
      const userData = store.getState().user.userData;
      const uid = userData?.id || userData?._id;
      if (uid) {
        try {
          await dispatch(updateUser({
            userId: uid,
            userData: { fcmToken: token, plateform: Platform.OS }
          })).unwrap();
          console.log('Refreshed FCM Token saved to server');
        } catch (err) {
          console.error('Failed to save refreshed FCM token:', err);
        }
      }
    });

    return () => {
      if (unsubscribePush) {
        unsubscribePush();
      }
      if (unsubscribeTokenRefresh) {
        unsubscribeTokenRefresh();
      }
    };
  }, [dispatch]);

  // Save track data when app goes to background/inactive (works from any screen)
  useEffect(() => {
    const handleAppState = async (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        try {
          const queue = await TrackPlayer.getQueue();
          if (queue.length === 0) return;

          const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
          const currentTrack = await TrackPlayer.getActiveTrack();
          const prog = await TrackPlayer.getProgress();

          // Save to AsyncStorage for instant restore
          await AsyncStorage.setItem('lastPlayedTrack', JSON.stringify({
            queue: queue.map(t => ({
              id: t.id,
              url: t.url,
              title: t.title,
              artist: t.artist,
              description: t.description,
              artwork: t.artwork,
              contentType: t.contentType,
              playlist: t.playlist,
            })),
            currentIndex: currentTrackIndex || 0,
            positionSeconds: prog.position || 0,
          }));

          // Also sync to backend if we have user + playlist info
          const uid = user?.id || user?._id;
          const playlistId = currentTrack?.playlist?._id;
          if (uid && playlistId) {
            dispatch(syncPlayHistory({
              userId: uid,
              playlistId,
              currentChapterIndex: currentTrackIndex || 0,
              currentChapterId: currentTrack?.id,
              positionSeconds: prog.position || 0,
              completedChapters: [],
              isCompleted: false,
            }));
          }
        } catch (e) {
          // Silent fail
        }
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub?.remove();
  }, [user, dispatch]);

  // Restore last played track on app launch
  useEffect(() => {
    async function restoreLastPlayed() {
      if (!user || !isSetup.current) return;
      const uid = user?.id || user?._id;
      if (!uid) return;

      try {
        // Check if there's already a track loaded
        const queue = await TrackPlayer.getQueue();
        if (queue.length > 0) return;

        // Try AsyncStorage first (instant)
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const cached = await AsyncStorage.getItem('lastPlayedTrack');

        if (cached) {
          const { queue: savedQueue, currentIndex, positionSeconds } = JSON.parse(cached);
          if (savedQueue?.length > 0) {
            await TrackPlayer.add(savedQueue);
            if (currentIndex > 0 && currentIndex < savedQueue.length) {
              await TrackPlayer.skip(currentIndex);
            }
            if (positionSeconds > 0) {
              await TrackPlayer.seekTo(positionSeconds);
            }
            return; // Done — restored from local cache
          }
        }

        // Fallback: fetch from API
        const { API_BASE } = require('./src/utils/api');
        const res = await fetch(`${API_BASE}/api/play-history/${uid}`);
        const data = await res.json();
        if (!data?.success || !data.data?.length) return;

        const latest = data.data[0];
        const playlist = latest.playlistId;
        if (!playlist || typeof playlist !== 'object' || !playlist.chapters?.length) return;

        let tracks = playlist.chapters.map(ch => ({
          id: ch._id,
          url: ch.url,
          title: ch.title,
          artist: ch.author || playlist.author,
          description: ch.description,
          artwork: ch.image || playlist.images?.[0],
          gold: ch.gold,
          contentType: 'audio/aac',
          playlist: playlist,
        }));

        // Filter premium tracks for non-premium users
        if (!isPremium) {
          tracks = tracks.filter(t => !t.gold);
        }

        if (tracks.length === 0) return;

        await TrackPlayer.add(tracks);

        const currentChapterId = latest.currentChapterId;
        const filteredIndex = tracks.findIndex(t => t.id === currentChapterId);

        // Only set index and position if it's a track we're allowed to play
        if (filteredIndex !== -1) {
          if (filteredIndex > 0) {
            await TrackPlayer.skip(filteredIndex);
          }
          if (latest.positionSeconds > 0) {
            await TrackPlayer.seekTo(latest.positionSeconds);
          }
        }
      } catch (e) {
        console.warn('[App] Failed to restore last played:', e);
      }
    }
    restoreLastPlayed();
  }, [user, isPremium]); // Added isPremium to dependency array

  // Load stored user credential on mount (like gtdfront)
  useEffect(() => {
    async function loadUser() {
      try {
        const stored = await storage.getString('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          dispatch(setUserData(parsed));
          // Check if this user still needs onboarding
          const newUserFlag = await storage.getBoolean('isNewUser');
          setIsNewUser(newUserFlag === true);
        }
      } catch (e) {
        console.warn('Failed to load user from storage', e);
      } finally {
        setLoading(false);
        BootSplash.hide({ fade: true });
      }
    }
    loadUser();
  }, [dispatch]);

  // After login, fetch fresh user data from server and store in Redux
  useEffect(() => {
    if (!user) return;
    const uid = user?.id || user?._id;
    if (uid) {
      dispatch(getUser(uid));
    }
  }, [dispatch, user?.id, user?._id]);


  const navigationRef = useRef();
  const [currentRouteName, setCurrentRouteName] = useState();

  // Don't render until we've checked storage
  if (loading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      {!splashComplete && (
        <SplashScreen onAnimationComplete={() => setSplashComplete(true)} />
      )}
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          setCurrentRouteName(navigationRef.current.getCurrentRoute()?.name);
        }}
        onStateChange={() => {
          const previousRouteName = currentRouteName;
          const currentRoute = navigationRef.current.getCurrentRoute();
          if (currentRoute && previousRouteName !== currentRoute.name) {
            setCurrentRouteName(currentRoute.name);
          }
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            // Auth screens
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLogin={async (loggedInUser, newUser) => {
                // Persist to AsyncStorage — the listener will update state
                await storage.set('user', JSON.stringify(loggedInUser));
                await storage.set('isNewUser', newUser === true);
                setIsNewUser(newUser === true);
                dispatch(setUserData(loggedInUser));
              }} />}
            </Stack.Screen>
          ) : isNewUser ? (
            // New user: show onboarding first
            <>
              <Stack.Screen name="Language" component={LanguageScreen} />
              <Stack.Screen name="Gender" component={GenderScreen} />
              <Stack.Screen name="Age" component={AgeScreen} />
              <Stack.Screen name="NotificationPermission" component={NotificationPermissionScreen} />
              <Stack.Screen
                name="Main"
                component={TabNavigator}
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen name="Play" component={PlayScreen} />
              <Stack.Screen name="Premium" component={PremiumScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="ViewPlaylists" component={ViewPlaylistsScreen} />
            </>
          ) : (
            // Returning user: skip to main
            <>
              <Stack.Screen
                name="Main"
                component={TabNavigator}
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen name="Play" component={PlayScreen} />
              <Stack.Screen name="Premium" component={PremiumScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="ViewPlaylists" component={ViewPlaylistsScreen} />
              <Stack.Screen name="EditLanguage" component={EditLanguageScreen} />
            </>
          )}
        </Stack.Navigator>
        <MiniPlayer currentRouteName={currentRouteName} />
        <PremiumUpsellModal
          visible={upsellModalVisible}
          onClose={() => setUpsellModalVisible(false)}
          onSubscribe={() => {
            setUpsellModalVisible(false);
            if (navigationRef.current) {
              navigationRef.current.navigate('Premium');
            }
          }}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
