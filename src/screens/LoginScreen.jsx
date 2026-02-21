import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    Platform,
    ActivityIndicator,
    Alert,
    NativeModules,
    Linking,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { signUpWithGoogle, signUpWithApple } from 'react-native-credentials-manager';
import { API_BASE } from '../utils/api';

const { width, height } = Dimensions.get('window');

// Native module for iOS Google Sign-In
const { GoogleSignInModule } = NativeModules;

// Google Web Client ID (used as serverClientId for Android)
const GOOGLE_CLIENT_ID_WEB = '369760073328-5ng2odnbd6o1v737ug0veujcjm8ebklq.apps.googleusercontent.com';

// Apple Logo SVG Component
const AppleLogo = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="white">
        <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.84 3.67-.84 1.54.12 2.7.75 3.44 1.83-2.92 1.76-2.39 5.38.44 6.6-.54 1.54-1.25 2.94-2.63 4.64zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.54 4.33-3.74 4.25z" />
    </Svg>
);

// Google Logo SVG Component
const GoogleLogo = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <Path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <Path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
        />
        <Path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </Svg>
);

// Audio Wave Logo Component
const AudioWaveLogo = () => (
    <Svg width={96} height={96} viewBox="0 0 100 100">
        <Path
            d="M20,50 Q35,20 50,50 T80,50"
            fill="none"
            stroke="#f4257b"
            strokeLinecap="round"
            strokeWidth={8}
        />
        <Circle
            cx={50}
            cy={50}
            r={45}
            fill="none"
            stroke="#f4257b"
            strokeWidth={3}
            opacity={0.5}
        />
        <Circle
            cx={50}
            cy={50}
            r={35}
            fill="none"
            stroke="#f4257b"
            strokeWidth={1}
            opacity={0.3}
        />
    </Svg>
);

const LoginScreen = ({ onLogin }) => {
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isAppleLoading, setIsAppleLoading] = useState(false);


    const handleGoogleSignIn = async () => {
        try {
            setIsGoogleLoading(true);

            let idToken;

            if (Platform.OS === 'ios') {
                // Native iOS Google Sign-In
                const result = await GoogleSignInModule.signIn();
                idToken = result.idToken;
            } else {
                // Android - use credentials manager
                const googleCredential = await signUpWithGoogle({
                    serverClientId: GOOGLE_CLIENT_ID_WEB,
                    autoSelectEnabled: false,
                });
                idToken = googleCredential?.idToken;
            }

            if (!idToken) {
                throw new Error('No ID token received from Google');
            }

            // Send token to backend for verification
            const response = await fetch(`${API_BASE}/api/login/google/loginSignUp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: idToken,
                    platform: Platform.OS,
                }),
            });

            const text = await response.text();


            if (!text) {
                throw new Error('Empty response from server');
            }

            const data = JSON.parse(text);

            if (data.success && data.user) {
                onLogin?.(data.user, data.isNewUser || false);
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Google sign-in failed:', error);
            // Don't show alert for user cancellation
            if (error?.message !== 'User canceled sign in' && error?.code !== 'canceled') {
                Alert.alert('Sign In Failed', error.message || 'Please try again');
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleAppleSignIn = async () => {
        try {
            setIsAppleLoading(true);

            // Get Apple credential using credentials manager
            const appleCredential = await signUpWithApple({
                requestedScopes: ['fullName', 'email'],
            });

            if (!appleCredential?.idToken) {
                throw new Error('No ID token received from Apple');
            }

            // Send token to backend for verification
            const response = await fetch(`${API_BASE}/api/login/apple/loginSignUp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idToken: appleCredential.idToken,
                    displayName: appleCredential.displayName,
                    email: appleCredential.email,
                }),
            });

            const data = await response.json();

            if (data.success && data.user) {
                onLogin?.(data.user, data.isNewUser || false);
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Apple sign-in failed:', error);
            if (error?.message !== 'User canceled sign in' && error?.code !== 'canceled') {
                Alert.alert('Sign In Failed', error.message || 'Please try again');
            }
        } finally {
            setIsAppleLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />



            {/* Background Glows */}
            <View style={styles.glowTop} />
            <View style={styles.glowBottom} />

            {/* Main Content */}
            <View style={styles.content}>
                {/* Top Section: Logo & Tagline */}
                <View style={styles.topSection}>
                    <View style={styles.logoContainer}>
                        <AudioWaveLogo />
                    </View>
                    <Text style={styles.appName}>
                        Cit<Text style={styles.appNameAccent}>ore</Text>
                    </Text>
                    <Text style={styles.tagline}>Stories that move you.</Text>
                </View>

                {/* Bottom Section: Actions */}
                <View style={styles.bottomSection}>
                    {/* Apple Login Button - iOS only */}
                    {Platform.OS === 'ios' && (
                        <TouchableOpacity
                            style={styles.authButton}
                            activeOpacity={0.8}
                            onPress={handleAppleSignIn}
                            disabled={isAppleLoading}>
                            {isAppleLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <AppleLogo />
                                    <Text style={styles.authButtonText}>Continue with Apple</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Google Login Button */}
                    <TouchableOpacity
                        style={styles.authButton}
                        activeOpacity={0.8}
                        onPress={handleGoogleSignIn}
                        disabled={isGoogleLoading}>
                        {isGoogleLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <GoogleLogo />
                                <Text style={styles.authButtonText}>Continue with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Terms */}
                    <Text style={styles.termsText}>
                        By continuing, you agree to our{' '}
                        <Text style={styles.termsLink} onPress={() => Linking.openURL('https://ayushk9799.github.io/CitorePolicy/terms-of-service.html')}>Terms</Text> and{' '}
                        <Text style={styles.termsLink} onPress={() => Linking.openURL('https://ayushk9799.github.io/CitorePolicy/privacy-policy.html')}>Privacy Policy</Text>.
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    glowTop: {
        position: 'absolute',
        top: -height * 0.1,
        left: -width * 0.2,
        width: width * 1.2,
        height: width * 1.2,
        borderRadius: width * 0.6,
        backgroundColor: 'rgba(244, 37, 123, 0.08)',
    },
    glowBottom: {
        position: 'absolute',
        bottom: -height * 0.1,
        right: -width * 0.1,
        width: width * 0.9,
        height: width * 0.9,
        borderRadius: width * 0.45,
        backgroundColor: 'rgba(244, 37, 123, 0.05)',
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 80,
        paddingBottom: 48,
        justifyContent: 'space-between',
    },
    topSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        marginBottom: 24,
    },
    appName: {
        fontSize: 36,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    appNameAccent: {
        color: '#f4257b',
    },
    tagline: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '300',
    },
    bottomSection: {
        width: '100%',
        gap: 14,
    },
    authButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 16,
        borderRadius: 999,
    },
    authButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    termsText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.25)',
        textAlign: 'center',
        fontWeight: '300',
        marginTop: 16,
        paddingHorizontal: 16,
        lineHeight: 18,
    },
    termsLink: {
        textDecorationLine: 'underline',
    },

});

export default LoginScreen;
