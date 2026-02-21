import React, { useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import TrackPlayer, {
    usePlaybackState,
    useActiveTrack,
    useProgress,
    State,
} from 'react-native-track-player';
import { useDispatch, useSelector } from 'react-redux';
import { PRIMARY } from '../theme/colors';
import { fetchPlaylistHistory } from '../redux/slices/playHistorySlice';
import { checkBookmark, toggleBookmark, fetchBookmarks, selectIsBookmarked } from '../redux/slices/bookmarkSlice';

const { width } = Dimensions.get('window');
const COVER_SIZE = width * 0.65;

// --- Icons ---
const ChevronLeft = () => (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="white">
        <Path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </Svg>
);
const MoreIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="white">
        <Path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </Svg>
);
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
const HeartIcon = ({ filled }) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={filled ? PRIMARY : 'none'} stroke={PRIMARY} strokeWidth={filled ? 0 : 2}>
        <Path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z" />
    </Svg>
);

const PlayCircle = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
        <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
    </Svg>
);
const PauseCircle = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
    </Svg>
);

const CrownIcon = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="#FFD700">
        <Path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
    </Svg>
);



/** Format seconds to mm:ss */
function formatTime(secs) {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// --- Components ---
const ChapterItem = ({
    chapter,
    isActive,
    isPlaying,
    isLastPlayed,
    onPress,
}) => {
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={[styles.chapterRow, isActive && styles.chapterRowActive]}>
            {/* Left: number or equalizer */}
            {isActive ? (
                <View style={styles.eqContainer}>
                    <View style={[styles.eqBar, { height: isPlaying ? 8 : 4 }]} />
                    <View style={[styles.eqBar, { height: isPlaying ? 16 : 4 }]} />
                    <View style={[styles.eqBar, { height: isPlaying ? 12 : 4 }]} />
                </View>
            ) : isLastPlayed ? (
                <View style={styles.lastPlayedDot} />
            ) : (
                <Text style={styles.chapterNum}>
                    {chapter.number}
                </Text>
            )}

            {/* Middle: text */}
            <View style={styles.chapterTextGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                        style={[styles.chapterTitle, (isActive || isLastPlayed) && styles.chapterTitleActive]}
                        numberOfLines={1}>
                        {chapter.title}
                    </Text>
                    {chapter.gold && <View style={{ marginLeft: 6 }}><CrownIcon /></View>}
                </View>
                <Text style={styles.chapterMeta} numberOfLines={1}>
                    {chapter.author} •{' '}
                    {isActive ? (
                        <Text style={{ color: PRIMARY }}>
                            {isPlaying ? 'Playing' : 'Paused'}
                        </Text>
                    ) : isLastPlayed ? (
                        <Text style={{ color: PRIMARY }}>Resume</Text>
                    ) : (
                        chapter.durationText
                    )}
                </Text>
            </View>

            {/* Right: play/pause or checkmark */}
            {isActive ? <PauseCircle /> : <PlayCircle />}
        </TouchableOpacity>
    );
};

// --- Main Screen ---
const PlaylistScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute();
    const dispatch = useDispatch();
    const playbackState = usePlaybackState();
    const activeTrack = useActiveTrack();
    const progress = useProgress(500);

    const playlist = route.params?.playlist;
    const userId = useSelector((state) => state.user.userData?.id);
    const isPremium = useSelector((state) => state.user.isPremium);
    const currentHistory = useSelector((state) => state.playHistory.currentHistory);

    // Fetch play history for this playlist on mount
    useEffect(() => {
        if (userId && playlist?._id) {
            dispatch(fetchPlaylistHistory({ userId, playlistId: playlist._id }));
            dispatch(checkBookmark({ userId, playlistId: playlist._id }));
        }
    }, [userId, playlist?._id, dispatch]);

    const isBookmarked = useSelector(selectIsBookmarked(playlist?._id));

    const chapters = useMemo(() => {
        if (!playlist || !playlist.chapters) return [];
        return playlist.chapters.map((ch, index) => ({
            id: ch._id,
            number: (index + 1).toString().padStart(2, '0'),
            title: ch.title,
            author: ch.author || playlist.author,
            description: ch.description,
            duration: ch.duration,
            durationText: formatTime(ch.duration),
            url: ch.url,
            artwork: ch.image || playlist.images?.[0],
            gold: ch.gold,
        }));
    }, [playlist]);

    // Completed chapters from history
    const completedChapterIds = useMemo(() => {
        return currentHistory?.completedChapters || [];
    }, [currentHistory]);

    const completedCount = completedChapterIds.length;
    const totalChapters = chapters.length;

    const isPlaying = playbackState.state === State.Playing;
    const hasResumeData = currentHistory && currentHistory.positionSeconds > 0;

    const loadAndPlayTrack = useCallback(
        async (chapter, index) => {
            try {
                console.log('[TrackPlayer] Loading track:', chapter.title, chapter.url);
                await TrackPlayer.reset();

                let queue = chapters.map(ch => ({
                    id: ch.id,
                    url: ch.url,
                    title: ch.title,
                    artist: ch.author,
                    description: ch.description,
                    artwork: ch.artwork,
                    gold: ch.gold,
                    contentType: 'audio/aac',
                    playlist: playlist,
                }));

                // Filter out gold tracks for non-premium users
                if (!isPremium) {
                    queue = queue.filter(track => !track.gold);
                }

                if (queue.length === 0) return;

                // Find the new index of the current chapter in the filtered queue
                const filteredIndex = queue.findIndex(track => track.id === chapter.id);
                if (filteredIndex === -1) return; // Selected track was premium

                // Add the filtered queue to the player
                await TrackPlayer.add(queue);

                // Skip to the correct track
                if (filteredIndex > 0) {
                    await TrackPlayer.skip(filteredIndex);
                }

                await TrackPlayer.play();
            } catch (error) {
                console.error('[TrackPlayer] Error loading track:', error);
            }
        },
        [chapters, playlist],
    );

    const handleChapterPress = useCallback(
        async (chapter, index) => {
            if (activeTrack?.id === chapter.id) {
                if (isPlaying) {
                    await TrackPlayer.pause();
                } else {
                    await TrackPlayer.play();
                }
            } else {
                if (chapter.gold && !isPremium) {
                    navigation.navigate('Premium');
                    return;
                }
                await loadAndPlayTrack(chapter, index);
            }
        },
        [activeTrack, isPlaying, loadAndPlayTrack],
    );

    const handleFloatingPlay = useCallback(async () => {
        const isCurrentPlaylist = activeTrack?.playlist?._id === playlist?._id;

        if (isCurrentPlaylist && activeTrack) {
            // Active track belongs to THIS playlist — toggle play/pause
            if (isPlaying) {
                await TrackPlayer.pause();
            } else {
                await TrackPlayer.play();
            }
        } else if (chapters.length > 0) {
            // Load this playlist — resume from history if available
            if (hasResumeData) {
                const resumeIndex = currentHistory.currentChapterIndex || 0;
                const resumePos = currentHistory.positionSeconds || 0;
                const resumeChapter = chapters[resumeIndex] || chapters[0];

                if (resumeChapter?.gold && !isPremium) {
                    navigation.navigate('Premium');
                    return;
                }

                await loadAndPlayTrack(resumeChapter, resumeIndex);
                setTimeout(async () => {
                    try {
                        await TrackPlayer.seekTo(resumePos);
                    } catch (e) {
                        console.warn('[PlaylistScreen] Resume seek failed:', e);
                    }
                }, 500);
            } else {
                const firstChapter = chapters[0];
                if (firstChapter?.gold && !isPremium) {
                    navigation.navigate('Premium');
                    return;
                }
                await loadAndPlayTrack(firstChapter, 0);
            }
        }
    }, [activeTrack, isPlaying, loadAndPlayTrack, chapters, hasResumeData, currentHistory, playlist]);

    if (!playlist) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#fff' }}>Playlist not found</Text>
            </View>
        );
    }

    const playlistArtwork = playlist.images?.[0] || 'https://via.placeholder.com/600';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={styles.topGlow} />

            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => navigation.goBack()}>
                    <ChevronLeft />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerBtn}>
                    <MoreIcon />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>
                <View style={styles.coverSection}>
                    <View style={styles.coverGlow} />
                    <View style={{ width: COVER_SIZE, height: COVER_SIZE, position: 'relative' }}>
                        <View style={styles.coverWrapper}>
                            <Image source={{ uri: playlistArtwork }} style={styles.coverImage} />
                        </View>
                        <TouchableOpacity style={styles.saveBtnOutside} activeOpacity={0.7}
                            onPress={() => {
                                if (userId && playlist?._id) {
                                    dispatch(toggleBookmark({ userId, playlistId: playlist._id })).then(() => {
                                        dispatch(fetchBookmarks(userId));
                                    });
                                }
                            }}>
                            <HeartIcon filled={isBookmarked} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.floatingPlay}
                        activeOpacity={0.85}
                        onPress={handleFloatingPlay}>
                        {activeTrack?.playlist?._id === playlist?._id && isPlaying ? (
                            <PauseIcon size={30} color="#000" />
                        ) : (
                            <PlayArrow size={30} color="#000" />
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.playlistTitle}>{playlist.title}</Text>
                    {playlist.description && (
                        <Text style={styles.playlistDescription} numberOfLines={3}>
                            {playlist.description}
                        </Text>
                    )}
                    <View style={styles.metaRow}>
                        <Text style={styles.categoryText}>{playlist.category}</Text>
                        <View style={styles.dot} />
                        <Text style={styles.metaText}>{playlist.author || 'Editorial Team'}</Text>
                        <View style={styles.dot} />
                        <Text style={styles.metaText}>{formatTime(playlist.duration || 0)}</Text>
                    </View>
                </View>

                <View style={styles.chaptersSection}>
                    <Text style={styles.chaptersLabel}>CHAPTERS</Text>
                    {chapters.map((ch, index) => {
                        const isCurrentPlaylist = activeTrack?.playlist?._id === playlist._id;
                        const resumeIndex = currentHistory?.currentChapterIndex ?? -1;
                        return (
                            <ChapterItem
                                key={ch.id}
                                chapter={ch}
                                isActive={activeTrack?.id === ch.id}
                                isPlaying={activeTrack?.id === ch.id && isPlaying}
                                isLastPlayed={!isCurrentPlaylist && hasResumeData && index === resumeIndex}
                                onPress={() => handleChapterPress(ch, index)}
                            />
                        );
                    })}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    topGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 380,
        backgroundColor: 'rgba(255,0,127,0.06)',
        zIndex: -1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    headerBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    scrollContent: {
        paddingTop: 140,
        paddingHorizontal: 24,
    },
    // Cover
    coverSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    coverGlow: {
        position: 'absolute',
        top: -16,
        width: COVER_SIZE + 32,
        height: COVER_SIZE + 32,
        borderRadius: (COVER_SIZE + 32) / 2,
        backgroundColor: 'rgba(255,0,127,0.12)',
    },
    coverWrapper: {
        width: COVER_SIZE,
        height: COVER_SIZE,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    floatingPlay: {
        position: 'absolute',
        bottom: -24,
        right: (width - COVER_SIZE) / 2 + 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 3,
        borderWidth: 3,
        borderColor: '#000',
        elevation: 10,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
    },
    // Info
    infoSection: {
        alignItems: 'center',
        marginBottom: 16,
    },
    playlistTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 6,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: PRIMARY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
    },
    metaText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
    },
    playlistDescription: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 20,
        paddingHorizontal: 12,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    saveBtnOutside: {
        position: 'absolute',
        top: -14,
        right: -14,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#121212',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        zIndex: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    actionRow: {
        display: 'none',
    },
    // Progress
    progressSection: {
        alignItems: 'center',
        marginBottom: 24,
        gap: 8,
    },
    progressBarBg: {
        width: '100%',
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
    // Chapters
    chaptersSection: {
        gap: 4,
    },
    chaptersLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: 1.5,
        marginBottom: 14,
        paddingHorizontal: 8,
    },
    chapterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    chapterRowActive: {
        backgroundColor: '#121212',
        borderWidth: 1,
        borderColor: 'rgba(255,0,127,0.35)',
    },
    eqContainer: {
        width: 32,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 2,
        height: 20,
    },
    eqBar: {
        width: 4,
        backgroundColor: PRIMARY,
        borderRadius: 2,
    },
    chapterNum: {
        width: 32,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.3)',
    },
    lastPlayedDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: PRIMARY,
        marginHorizontal: 11,
    },
    chapterTextGroup: {
        flex: 1,
        gap: 3,
    },
    chapterTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.7)',
    },
    chapterTitleActive: {
        color: PRIMARY,
        fontWeight: '600',
    },
    chapterMeta: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
    },
});

export default PlaylistScreen;
