import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { storage } from '../../utils/storage';
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../redux/slices/userSlice';

const { width } = Dimensions.get('window');

// Notification Bell Icon
const BellIcon = () => (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="#f4257b">
        <Path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </Svg>
);

// Feature item icons
const BookIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="#f4257b">
        <Path d="M19 2H6c-1.206 0-3 .799-3 3v14c0 2.201 1.794 3 3 3h15v-2H6.012C5.55 19.988 5 19.806 5 19s.55-.988 1.012-1H21V4c0-1.103-.897-2-2-2zm0 14H5V5c0-.806.55-.988 1-1h13v12z" />
    </Svg>
);

const ClockIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="#f4257b">
        <Path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
        <Path d="M13 7h-2v5.414l3.293 3.293 1.414-1.414L13 11.586z" />
    </Svg>
);

const NotificationPermissionScreen = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const user = useSelector(state => state.user.userData);

    const handleEnable = async () => {
        console.log('handleEnable called');
        try {
            if (Platform.OS === 'android' && Platform.Version >= 33) {
                console.log('Android 13+ detected, requesting POST_NOTIFICATIONS');
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                );
                console.log('Permission status:', granted);
            }

            const authStatus = await messaging().requestPermission();
            console.log('Firebase AuthStatus:', authStatus);

            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                const token = await messaging().getToken();
                console.log('FCM Token generated:', token);

                // Save token to server if user is logged in
                const uid = user?.id || user?._id;
                if (uid) {
                    await dispatch(updateUser({
                        userId: uid,
                        userData: { fcmToken: token, plateform: Platform.OS }
                    })).unwrap();
                    console.log('FCM Token saved to server');
                }
            } else {
                console.log('Notifications not enabled by user');
            }
        } catch (error) {
            console.error('Error in handleEnable:', error);
        }

        // Clear onboarding flag so user won't see it again
        await storage.set('isNewUser', false);
        console.log('Navigating to Main');
        navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
        });
    };

    const handleSkip = async () => {
        // Clear onboarding flag so user won't see it again
        await storage.set('isNewUser', false);
        navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Background glow */}
            <View style={styles.glowCenter} />

            {/* Main Content */}
            <View style={styles.mainContent}>
                {/* Hero Icon */}
                <View style={styles.heroSection}>
                    {/* Pulse ring */}
                    <View style={styles.pulseRing} />
                    <View style={styles.outerRing} />

                    {/* Icon Box */}
                    <View style={styles.iconBox}>
                        <BellIcon />
                    </View>
                </View>

                {/* Text */}
                <View style={styles.textSection}>
                    <Text style={styles.heading}>Never miss a story</Text>
                    <Text style={styles.subtitle}>
                        Stay connected to your library. Get notified about new chapters,
                        author releases, and resume exactly where you left off.
                    </Text>
                </View>

                {/* Feature List */}
                <View style={styles.featureList}>
                    <View style={styles.featureCard}>
                        <View style={styles.featureIcon}>
                            <BookIcon />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>New Releases</Text>
                            <Text style={styles.featureDesc}>
                                Alerts for your favorite authors
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureCard}>
                        <View style={styles.featureIcon}>
                            <ClockIcon />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>Daily Reminders</Text>
                            <Text style={styles.featureDesc}>
                                Keep your listening streak alive
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Bottom Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.enableButton}
                    activeOpacity={0.85}
                    onPress={handleEnable}>
                    <Text style={styles.enableButtonText}>Enable Notifications</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.laterButton}
                    activeOpacity={0.7}
                    onPress={handleSkip}>
                    <Text style={styles.laterButtonText}>Maybe Later</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    glowCenter: {
        position: 'absolute',
        top: '30%',
        left: '50%',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(244,37,123,0.1)',
        transform: [{ translateX: -150 }, { translateY: -150 }],
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    heroSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 48,
        width: 160,
        height: 160,
    },
    pulseRing: {
        position: 'absolute',
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 1,
        borderColor: 'rgba(244,37,123,0.15)',
    },
    outerRing: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 1,
        borderColor: 'rgba(244,37,123,0.08)',
    },
    iconBox: {
        width: 96,
        height: 96,
        borderRadius: 28,
        backgroundColor: '#121212',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(244,37,123,0.25)',
    },
    textSection: {
        alignItems: 'center',
        gap: 14,
        maxWidth: 300,
    },
    heading: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        lineHeight: 22,
    },
    featureList: {
        width: '100%',
        marginTop: 40,
        gap: 14,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(244,37,123,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.8)',
    },
    featureDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.35)',
        marginTop: 2,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        gap: 12,
    },
    enableButton: {
        width: '100%',
        backgroundColor: '#f4257b',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    enableButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    laterButton: {
        width: '100%',
        paddingVertical: 14,
        alignItems: 'center',
    },
    laterButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.4)',
    },
});

export default NotificationPermissionScreen;
