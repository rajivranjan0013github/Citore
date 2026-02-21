import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
    Alert,
    Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import TrackPlayer from 'react-native-track-player';
import { clearUserData } from '../redux/slices/userSlice';
import Svg, { Path } from 'react-native-svg';
import { storage } from '../utils/storage';

const defaultAvatar = require('../assets/default_avatar.png');

const PRIMARY = '#f4257b';

// --- Icons ---
const EditIcon = () => (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="white">
        <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </Svg>
);
const PersonIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </Svg>
);
const CardIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M20 2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h4v5l4-2 4 2v-5h4c1.11 0 2-.89 2-2V4c0-1.11-.89-2-2-2zm0 13H4V4h16v11z" />
    </Svg>
);
const LogoutIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </Svg>
);
const PremiumIcon = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
    </Svg>
);
const BooksIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M19 2H6c-1.206 0-3 .799-3 3v14c0 2.201 1.794 3 3 3h15v-2H6.012C5.55 19.988 5 19.806 5 19s.55-.988 1.012-1H21V4c0-1.103-.897-2-2-2z" />
    </Svg>
);
const HeadphonesIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
    </Svg>
);
const TrophyIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </Svg>
);
const TranslateIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
    </Svg>
);
const ShieldIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v5.7c0 4.43-2.99 8.57-7 9.82-4.01-1.25-7-5.39-7-9.82V6.3l7-3.12z" />
    </Svg>
);
const FileTextIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </Svg>
);

const StarIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </Svg>
);
const ChevronRight = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="rgba(255,255,255,0.2)">
        <Path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </Svg>
);

const SmallChevronRight = () => (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </Svg>
);



// --- Menu Item ---
const MenuItem = ({
    icon,
    label,
    subtitle,
    onPress,
}) => (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
        <View style={styles.menuLeft}>
            <View style={styles.menuIconBox}>{icon}</View>
            <View>
                <Text style={styles.menuLabel}>{label}</Text>
                {subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
            </View>
        </View>
        <ChevronRight />
    </TouchableOpacity>
);

const ProfileScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { userData, isPremium } = useSelector((state) => state.user);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    // Delete user from storage and clear Redux state
                    await storage.delete('user');
                    await storage.delete('isNewUser');
                    // Clear playback cache
                    try {
                        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                        await AsyncStorage.removeItem('lastPlayedTrack');
                    } catch (e) { }

                    // Stop any playing audio
                    await TrackPlayer.reset();
                    dispatch(clearUserData());
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Background glows */}
            <View style={styles.glowTopRight} />
            <View style={styles.glowBottomLeft} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 32 },
                ]}>
                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarRing}>
                        <Image source={userData?.profilePic ? { uri: userData.profilePic } : defaultAvatar} style={styles.avatarImage} />
                        <View style={styles.editBadge}>
                            <EditIcon />
                        </View>
                    </View>
                    <Text style={styles.userName}>{userData?.name || 'User'}</Text>

                    <TouchableOpacity
                        style={styles.memberBadge}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('Premium')}
                    >
                        <Text style={styles.memberText}>
                            {isPremium ? 'GOLD MEMBER' : 'UPGRADE PLAN'}
                        </Text>
                        {isPremium ? <PremiumIcon /> : <SmallChevronRight />}
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                {/* <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <BooksIcon />
                        <Text style={styles.statValue}>42</Text>
                        <Text style={styles.statLabel}>BOOKS READ</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <HeadphonesIcon />
                        <Text style={styles.statValue}>128h</Text>
                        <Text style={styles.statLabel}>HOURS</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <TrophyIcon />
                        <Text style={styles.statValue}>15</Text>
                        <Text style={styles.statLabel}>BADGES</Text>
                    </View>
                </View> */}

                {/* Menu Group 1 */}
                <View style={styles.menuGroup}>
                    <MenuItem icon={<PersonIcon />} label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
                    <View style={styles.menuDivider} />
                    <MenuItem
                        icon={<TranslateIcon />}
                        label="Audio Language"
                        subtitle={userData?.language ? userData.language.charAt(0).toUpperCase() + userData.language.slice(1) : 'Select Language'}
                        onPress={() => navigation.navigate('EditLanguage')}
                    />

                    <View style={styles.menuDivider} />
                    <MenuItem
                        icon={<CardIcon />}
                        label="Subscription Plan"
                        subtitle={isPremium ? 'Premium Active' : 'Free Plan'}
                        onPress={() => navigation.navigate('Premium')}
                    />
                </View>

                {/* Menu Group 2: Support & Legal */}
                <View style={styles.menuGroup}>

                    <MenuItem icon={<StarIcon />} label="Rate App" onPress={() => Alert.alert('Rate App', 'Rate us on the App Store/Play Store')} />
                    <View style={styles.menuDivider} />
                    <MenuItem icon={<ShieldIcon />} label="Privacy Policy" onPress={() => Linking.openURL('https://ayushk9799.github.io/CitorePolicy/privacy-policy.html')} />
                    <View style={styles.menuDivider} />
                    <MenuItem icon={<FileTextIcon />} label="Terms of Use" onPress={() => Linking.openURL('https://ayushk9799.github.io/CitorePolicy/terms-of-service.html')} />
                </View>

                {/* Logout */}
                <View style={styles.menuGroup}>
                    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleLogout}>
                        <View style={styles.menuLeft}>
                            <View style={[styles.menuIconBox, styles.logoutIconBox]}>
                                <LogoutIcon />
                            </View>
                            <Text style={[styles.menuLabel, { color: PRIMARY, fontWeight: '600' }]}>
                                Logout
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    glowTopRight: {
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '40%',
        height: '40%',
        borderRadius: 999,
        backgroundColor: 'rgba(244,37,123,0.04)',
        opacity: 0.5,
    },
    glowBottomLeft: {
        position: 'absolute',
        bottom: '-5%',
        left: '-10%',
        width: '30%',
        height: '30%',
        borderRadius: 999,
        backgroundColor: 'rgba(244,37,123,0.03)',
        opacity: 0.5,
    },
    scrollContent: {
        paddingBottom: 56,
    },
    // Avatar
    avatarSection: {
        alignItems: 'center',
        paddingBottom: 36,
    },
    avatarRing: {
        width: 132,
        height: 132,
        borderRadius: 66,
        padding: 4,
        backgroundColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
    },
    avatarImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#000',
    },
    editBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#000',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginTop: 20,
        letterSpacing: -0.3,
    },
    memberBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(244,37,123,0.4)',
        backgroundColor: 'rgba(244,37,123,0.08)',
    },
    memberText: {
        fontSize: 11,
        fontWeight: '600',
        color: PRIMARY,
        letterSpacing: 1.2,
    },
    // Stats
    statsCard: {
        flexDirection: 'row',
        marginHorizontal: 24,
        marginBottom: 28,
        backgroundColor: 'rgba(244,37,123,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(244,37,123,0.08)',
        borderRadius: 14,
        paddingVertical: 20,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    // Menu
    menuGroup: {
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    menuIconBox: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutIconBox: {
        backgroundColor: 'rgba(244,37,123,0.08)',
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#fff',
    },
    menuSub: {
        fontSize: 10,
        color: 'rgba(244,37,123,0.6)',
        marginTop: 2,
    },
    menuDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        marginHorizontal: 16,
    },
});

export default ProfileScreen;
