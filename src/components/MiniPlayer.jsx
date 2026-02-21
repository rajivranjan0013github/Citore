import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import TrackPlayer, {
    usePlaybackState,
    useActiveTrack,
    useProgress,
    State,
} from 'react-native-track-player';
import { PRIMARY } from '../theme/colors';

const { width } = Dimensions.get('window');

// --- Icons ---
const PlayArrow = ({ size = 30, color = '#000' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <Path d="M8 5v14l11-7z" />
    </Svg>
);
const PauseIcon = ({ size = 24, color = '#000' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <Path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </Svg>
);
const SkipPrev = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)">
        <Path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </Svg>
);
const SkipNext = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)">
        <Path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </Svg>
);

const MiniPlayer = ({ currentRouteName }) => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const playbackState = usePlaybackState();
    const activeTrack = useActiveTrack();
    const progress = useProgress(500);

    // Don't show if no track or if we're on specific screens (onboarding, playback, etc.)
    const hiddenScreens = [
        'Play',
        'Premium',
        'EditProfile',
        'EditLanguage',
        'Language',
        'Gender',
        'Age',
        'NotificationPermission'
    ];
    if (!activeTrack || hiddenScreens.includes(currentRouteName)) return null;

    const isPlaying = playbackState.state === State.Playing;
    const miniProgressPercent =
        progress.duration > 0 ? (progress.position / progress.duration) * 100 : 0;

    return (
        <View style={[styles.miniPlayer, { bottom: 60 + (insets.bottom > 0 ? insets.bottom : 0) }]}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Play')}
                style={styles.miniPlayerInner}>
                <Image
                    source={{ uri: activeTrack.artwork }}
                    style={styles.miniCover}
                />
                <View style={styles.miniTextGroup}>
                    <Text style={styles.miniTitle} numberOfLines={1}>
                        {activeTrack.title}
                    </Text>
                    <View style={styles.miniSubRow}>
                        <Text style={styles.miniAuthor}>
                            {activeTrack.artist}
                        </Text>
                    </View>
                </View>
                <View style={styles.miniControls}>
                    <TouchableOpacity
                        style={styles.miniControlBtn}
                        onPress={() => TrackPlayer.skipToPrevious().catch(() => TrackPlayer.seekTo(0))}>
                        <SkipPrev />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.miniPlayBtn}
                        activeOpacity={0.85}
                        onPress={() => isPlaying ? TrackPlayer.pause() : TrackPlayer.play()}>
                        {playbackState.state === State.Loading || playbackState.state === State.Buffering ? (
                            <ActivityIndicator size="small" color="#000" />
                        ) : isPlaying ? (
                            <PauseIcon size={22} color="#000" />
                        ) : (
                            <PlayArrow size={22} color="#000" />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.miniControlBtn}
                        onPress={() => TrackPlayer.skipToNext().catch(() => { })}>
                        <SkipNext />
                    </TouchableOpacity>
                </View>
                <View style={styles.fullWidthProgressTrack}>
                    <View
                        style={[
                            styles.miniProgressFill,
                            { width: `${miniProgressPercent}%` },
                        ]}
                    />
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    miniPlayer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 12,
        paddingTop: 12,
        zIndex: 1000,
    },
    miniPlayerInner: {
        backgroundColor: '#121212',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
    },
    miniCover: {
        width: 48,
        height: 48,
        borderRadius: 6,
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    miniTextGroup: {
        flex: 1,
        gap: 4,
    },
    miniTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    miniSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    miniAuthor: {
        fontSize: 12,
        fontWeight: '500',
        color: PRIMARY,
    },
    fullWidthProgressTrack: {
        position: 'absolute',
        bottom: 0,
        left: 12,
        right: 12,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        overflow: 'hidden',
    },
    miniProgressFill: {
        height: '100%',
        backgroundColor: PRIMARY,
    },
    miniControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    miniControlBtn: {
        padding: 4,
    },
    miniPlayBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default MiniPlayer;
