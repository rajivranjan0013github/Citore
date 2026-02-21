import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    StatusBar,
    PanResponder,
    Animated,
    AppState,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import TrackPlayer, {
    useProgress,
    usePlaybackState,
    useActiveTrack,
    State,
} from 'react-native-track-player';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRIMARY } from '../theme/colors';
import { syncPlayHistory } from '../redux/slices/playHistorySlice';

const { width } = Dimensions.get('window');
const COVER_SIZE = width - 64;

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const LOCAL_SAVE_INTERVAL = 15000; // 15 seconds
const COMPLETION_THRESHOLD = 0.95; // 95% of duration = completed

// --- Icons ---
const ChevronDown = () => (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
        <Path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
    </Svg>
);
const MoreIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
        <Path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </Svg>
);
const SkipPrev = () => (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)">
        <Path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </Svg>
);
const SkipNext = () => (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)">
        <Path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </Svg>
);
const Replay10 = () => (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">
        <Path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
        <SvgText
            x="12"
            y="15.5"
            fontSize="7"
            fontWeight="bold"
            fill="rgba(255,255,255,0.7)"
            textAnchor="middle">
            10
        </SvgText>
    </Svg>
);
const Forward30 = () => (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">
        <Path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8V1l-5 5 5 5V7c3.31 0 6 2.69 6 6z" />
        <SvgText
            x="12"
            y="15.5"
            fontSize="7"
            fontWeight="bold"
            fill="rgba(255,255,255,0.7)"
            textAnchor="middle">
            30
        </SvgText>
    </Svg>
);
const PlayArrow = ({ style }) => (
    <Svg style={style} width={48} height={48} viewBox="0 0 24 24" fill="white">
        <Path d="M8 5v14l11-7z" />
    </Svg>
);
const PauseIcon = () => (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="white">
        <Path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </Svg>
);
const MoonIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)">
        <Path d="M12.34 2.02C6.59 1.82 2 6.42 2 12c0 5.52 4.48 10 10 10 3.71 0 6.93-2.02 8.66-5.02-7.51-.25-12.09-8.43-8.32-14.96z" />
    </Svg>
);
const BookmarkIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)">
        <Path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
    </Svg>
);
const ListIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)">
        <Path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
    </Svg>
);

/** Format seconds to mm:ss */
function formatTime(secs) {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const PlayScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const progress = useProgress(250);
    const playbackState = usePlaybackState();
    const activeTrack = useActiveTrack();

    const userId = useSelector((state) => state.user.userData?.id);

    const [speedIndex, setSpeedIndex] = useState(2); // default 1.0x

    const isPlaying = playbackState.state === State.Playing;

    // --- Play history tracking ---
    const completedChaptersRef = useRef([]);
    const prevTrackIdRef = useRef(null);
    const prevIsPlayingRef = useRef(false);

    // Get playlist info from the active track
    const playlist = activeTrack?.playlist;
    const playlistId = playlist?._id;

    // Build the sync data object
    const buildHistoryData = useCallback(async () => {
        if (!userId || !playlistId) return null;
        try {
            const queue = await TrackPlayer.getQueue();
            const currentIndex = queue.findIndex(t => t.id === activeTrack?.id);
            const prog = await TrackPlayer.getProgress();

            return {
                userId,
                playlistId,
                currentChapterIndex: currentIndex >= 0 ? currentIndex : 0,
                currentChapterId: activeTrack?.id,
                positionSeconds: prog.position || 0,
                completedChapters: completedChaptersRef.current,
                isCompleted: false,
            };
        } catch {
            return null;
        }
    }, [userId, playlistId, activeTrack]);

    // Sync to backend + save to AsyncStorage for instant restore
    const syncToBackend = useCallback(async () => {
        const data = await buildHistoryData();
        if (data) {
            dispatch(syncPlayHistory(data));

            // Also save track data locally for instant mini player on next launch
            try {
                const queue = await TrackPlayer.getQueue();
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
                    currentIndex: data.currentChapterIndex,
                    positionSeconds: data.positionSeconds,
                }));
            } catch (e) {
                // Silent fail for local cache
            }
        }
    }, [buildHistoryData, dispatch]);

    // Save to AsyncStorage locally
    const saveLocally = useCallback(async () => {
        const data = await buildHistoryData();
        if (data) {
            try {
                await AsyncStorage.setItem(
                    `playHistory_${playlistId}`,
                    JSON.stringify(data)
                );
            } catch (e) {
                console.warn('[PlayHistory] Local save failed:', e);
            }
        }
    }, [buildHistoryData, playlistId]);

    // Track chapter completion (when position ≥ 95% of duration)
    useEffect(() => {
        if (activeTrack?.id && progress.duration > 0) {
            const ratio = progress.position / progress.duration;
            if (ratio >= COMPLETION_THRESHOLD) {
                if (!completedChaptersRef.current.includes(activeTrack.id)) {
                    completedChaptersRef.current = [
                        ...completedChaptersRef.current,
                        activeTrack.id,
                    ];
                }
            }
        }
    }, [activeTrack?.id, progress.position, progress.duration]);

    // Detect track change → sync previous track to backend + mark completed
    useEffect(() => {
        if (activeTrack?.id && prevTrackIdRef.current && activeTrack.id !== prevTrackIdRef.current) {
            if (!completedChaptersRef.current.includes(prevTrackIdRef.current)) {
                completedChaptersRef.current = [
                    ...completedChaptersRef.current,
                    prevTrackIdRef.current,
                ];
            }
            syncToBackend();
        }
        prevTrackIdRef.current = activeTrack?.id;
    }, [activeTrack?.id, syncToBackend]);

    // Local save every 15 seconds while playing
    useEffect(() => {
        let interval;
        if (isPlaying && playlistId) {
            interval = setInterval(saveLocally, LOCAL_SAVE_INTERVAL);
        }
        return () => clearInterval(interval);
    }, [isPlaying, playlistId, saveLocally]);

    // Sync to backend on pause
    useEffect(() => {
        if (prevIsPlayingRef.current && !isPlaying && playlistId) {
            syncToBackend();
        }
        prevIsPlayingRef.current = isPlaying;
    }, [isPlaying, playlistId, syncToBackend]);

    // Sync to backend when app goes to background
    useEffect(() => {
        const handleAppState = (nextState) => {
            if (nextState === 'background' && playlistId) {
                syncToBackend();
            }
        };
        const sub = AppState.addEventListener('change', handleAppState);
        return () => sub?.remove();
    }, [playlistId, syncToBackend]);

    // Sync to backend on unmount (navigating away)
    useEffect(() => {
        return () => {
            if (playlistId) {
                syncToBackend();
            }
        };
    }, [playlistId, syncToBackend]);

    // --- Smooth seek (no state updates during drag, time-based snap-back guard) ---
    const isSeekingRef = useRef(false);
    const seekPosRef = useRef(0);
    const lastSeekTimeRef = useRef(0);
    const lastSeekTargetRef = useRef(0);
    const progressBarWidth = useRef(0);
    const fillAnim = useRef(new Animated.Value(0)).current;

    // Sync animated fill with actual progress when NOT actively seeking
    const timeSinceSeek = Date.now() - lastSeekTimeRef.current;
    const isPostSeek = timeSinceSeek < 500;

    if (isSeekingRef.current) {
        // During an active drag — do nothing, PanResponder handles fillAnim
    } else if (isPostSeek) {
        // Just finished seeking — hold bar at seek target until TrackPlayer catches up
        if (progress.duration > 0 && progressBarWidth.current > 0) {
            const ratio = lastSeekTargetRef.current / progress.duration;
            fillAnim.setValue(Math.max(0, Math.min(1, ratio)) * progressBarWidth.current);
        }
    } else {
        // Normal playback — follow useProgress
        if (progress.duration > 0 && progressBarWidth.current > 0) {
            const ratio = progress.position / progress.duration;
            fillAnim.setValue(Math.max(0, Math.min(1, ratio)) * progressBarWidth.current);
        }
    }

    // Display position for time labels
    const displayPosition = isSeekingRef.current
        ? seekPosRef.current
        : isPostSeek
            ? lastSeekTargetRef.current
            : progress.position;

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
            isSeekingRef.current = true;
            const x = evt.nativeEvent.locationX;
            const barW = progressBarWidth.current;
            if (barW > 0 && progress.duration > 0) {
                const ratio = Math.max(0, Math.min(1, x / barW));
                seekPosRef.current = ratio * progress.duration;
                fillAnim.setValue(ratio * barW);
            }
        },
        onPanResponderMove: (evt) => {
            const x = evt.nativeEvent.locationX;
            const barW = progressBarWidth.current;
            if (barW > 0 && progress.duration > 0) {
                const ratio = Math.max(0, Math.min(1, x / barW));
                seekPosRef.current = ratio * progress.duration;
                fillAnim.setValue(ratio * barW);
            }
        },
        onPanResponderRelease: async () => {
            const newPos = seekPosRef.current;
            lastSeekTargetRef.current = newPos;
            lastSeekTimeRef.current = Date.now();
            isSeekingRef.current = false;
            if (progress.duration > 0) {
                await TrackPlayer.seekTo(newPos);
            }
        },
        onPanResponderTerminate: () => {
            isSeekingRef.current = false;
        },
    }), [fillAnim, progress.duration]);

    const handlePlayPause = useCallback(async () => {
        if (isPlaying) {
            await TrackPlayer.pause();
        } else {
            await TrackPlayer.play();
        }
    }, [isPlaying]);

    const handleSkipPrev = useCallback(async () => {
        try {
            await TrackPlayer.skipToPrevious();
        } catch {
            await TrackPlayer.seekTo(0);
        }
    }, []);

    const handleSkipNext = useCallback(async () => {
        try {
            await TrackPlayer.skipToNext();
        } catch {
            // Already at last track
        }
    }, []);

    const handleReplay10 = useCallback(async () => {
        const newPos = Math.max(0, progress.position - 10);
        await TrackPlayer.seekTo(newPos);
    }, [progress.position]);

    const handleForward30 = useCallback(async () => {
        const newPos = Math.min(progress.duration, progress.position + 30);
        await TrackPlayer.seekTo(newPos);
    }, [progress.position, progress.duration]);

    const handleSpeed = useCallback(async () => {
        const nextIndex = (speedIndex + 1) % SPEED_OPTIONS.length;
        setSpeedIndex(nextIndex);
        await TrackPlayer.setRate(SPEED_OPTIONS[nextIndex]);
    }, [speedIndex]);

    const trackTitle = activeTrack?.title ?? 'No Track Selected';
    const trackArtist = activeTrack?.artist || activeTrack?.playlist?.author || 'Editorial Team';
    const trackDescription = activeTrack?.description ?? '';
    const trackArtwork = activeTrack?.artwork || activeTrack?.playlist?.images?.[0];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Background glow */}
            <View style={styles.bgGlow} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => navigation.goBack()}>
                    <ChevronDown />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
                    <Text style={styles.chapterLabel} numberOfLines={1}>
                        {trackTitle}
                    </Text>
                </View>
                <TouchableOpacity style={styles.headerBtn}>
                    <MoreIcon />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Cover Art */}
                <View style={styles.coverContainer}>
                    <View style={styles.coverGlow} />
                    <View style={styles.coverWrapper}>
                        <Image
                            source={{
                                uri: trackArtwork || 'https://via.placeholder.com/300',
                            }}
                            style={styles.coverImage}
                        />
                        <View style={styles.coverOverlay} />
                    </View>
                </View>

                {/* Title Info */}
                <View style={styles.titleSection}>
                    <Text style={styles.title} numberOfLines={1}>
                        {trackTitle}
                    </Text>
                    {trackDescription ? (
                        <Text style={styles.trackDescription} numberOfLines={2}>
                            {trackDescription}
                        </Text>
                    ) : null}
                </View>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                    <View
                        style={styles.progressTouchArea}
                        onLayout={(e) => {
                            const w = e.nativeEvent.layout.width;
                            progressBarWidth.current = w;
                            // Set initial fill width on layout
                            if (!isSeekingRef.current) {
                                const ratio = progress.duration > 0
                                    ? progress.position / progress.duration : 0;
                                fillAnim.setValue(ratio * w);
                            }
                        }}
                        {...panResponder.panHandlers}
                    >
                        <View style={styles.progressTrack}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    { width: fillAnim },
                                ]}>
                                <View style={styles.progressThumb} />
                            </Animated.View>
                        </View>
                    </View>
                    <View style={styles.timeRow}>
                        <Text style={styles.timeText}>
                            {formatTime(displayPosition)}
                        </Text>
                        <Text style={styles.timeText}>
                            -{formatTime(progress.duration - displayPosition)}
                        </Text>
                    </View>
                </View>

                {/* Playback Controls */}
                <View style={styles.controlsRow}>
                    <TouchableOpacity
                        style={styles.controlBtn}
                        onPress={handleSkipPrev}>
                        <SkipPrev />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.controlBtn}
                        onPress={handleReplay10}>
                        <Replay10 />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.playMainBtn}
                        activeOpacity={0.85}
                        onPress={handlePlayPause}>
                        <View style={styles.playGlow} />
                        <View style={styles.playCircle}>
                            {(playbackState.state === State.Loading || playbackState.state === State.Buffering) ? (
                                <ActivityIndicator size="large" color="#000" />
                            ) : isPlaying ? (
                                <PauseIcon />
                            ) : (
                                <PlayArrow style={{ marginLeft: 4 }} />
                            )}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.controlBtn}
                        onPress={handleForward30}>
                        <Forward30 />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.controlBtn}
                        onPress={handleSkipNext}>
                        <SkipNext />
                    </TouchableOpacity>
                </View>

                {/* Bottom Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={handleSpeed}>
                        <View style={styles.actionCircle}>
                            <Text style={styles.speedText}>
                                {SPEED_OPTIONS[speedIndex]}x
                            </Text>
                        </View>
                        <Text style={styles.actionLabel}>Speed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionItem}>
                        <View style={styles.actionCircle}>
                            <MoonIcon />
                        </View>
                        <Text style={styles.actionLabel}>Sleep</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionItem}>
                        <View style={styles.actionCircle}>
                            <BookmarkIcon />
                        </View>
                        <Text style={styles.actionLabel}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => {
                            if (activeTrack?.playlist) {
                                navigation.navigate('Main', {
                                    screen: 'Home',
                                    params: {
                                        screen: 'Playlist',
                                        params: { playlist: activeTrack.playlist }
                                    }
                                });
                            }
                        }}
                    >
                        <View style={styles.actionCircle}>
                            <ListIcon />
                        </View>
                        <Text style={styles.actionLabel}>List</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom indicator */}
            <View style={[styles.bottomIndicator, { paddingBottom: insets.bottom + 8 }]}>
                <View style={styles.homeBar} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    bgGlow: {
        position: 'absolute',
        top: '15%',
        left: '10%',
        right: '10%',
        height: width,
        borderRadius: width / 2,
        backgroundColor: 'rgba(255,20,147,0.08)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 8,
    },
    headerBtn: {
        padding: 8,
        borderRadius: 20,
    },
    headerCenter: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 8,
    },
    nowPlayingLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
        color: PRIMARY,
        marginBottom: 2,
    },
    chapterLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.4)',
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'space-evenly',
    },
    // Cover
    coverContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    coverGlow: {
        position: 'absolute',
        width: COVER_SIZE + 40,
        height: COVER_SIZE + 40,
        borderRadius: (COVER_SIZE + 40) / 2,
        backgroundColor: 'rgba(255,20,147,0.18)',
    },
    coverWrapper: {
        width: COVER_SIZE,
        height: COVER_SIZE,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        elevation: 20,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    // Title
    titleSection: {
        alignItems: 'center',
        gap: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.3,
    },
    author: {
        fontSize: 16,
        fontWeight: '600',
        color: PRIMARY,
        textAlign: 'center',
        marginTop: 4,
    },
    trackDescription: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
        paddingHorizontal: 20,
    },
    // Progress
    progressSection: {
        gap: 8,
    },
    progressTouchArea: {
        paddingVertical: 12,
        justifyContent: 'center',
    },
    progressTrack: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 2,
        overflow: 'visible',
    },
    progressFill: {
        height: '100%',
        backgroundColor: PRIMARY,
        borderRadius: 2,
        position: 'relative',
    },
    progressThumb: {
        position: 'absolute',
        right: -8,
        top: -6,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: PRIMARY,
        borderWidth: 2,
        borderColor: '#000',
        elevation: 4,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeText: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.3)',
        fontVariant: ['tabular-nums'],
    },
    // Controls
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    controlBtn: {
        padding: 8,
    },
    playMainBtn: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    playGlow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: PRIMARY,
        opacity: 0.3,
    },
    playCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,20,147,0.5)',
        elevation: 10,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
    },
    // Bottom actions
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
    },
    actionItem: {
        alignItems: 'center',
        gap: 6,
    },
    actionCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    speedText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
    },
    actionLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.3)',
    },
    // Bottom
    bottomIndicator: {
        alignItems: 'center',
        paddingTop: 8,
    },
    homeBar: {
        width: 128,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
});

export default PlayScreen;
