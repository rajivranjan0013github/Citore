import React, { useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Svg, { Path } from 'react-native-svg';
import { fetchPlayHistory, selectContinueListening } from '../redux/slices/playHistorySlice';
import { fetchBookmarks, selectBookmarks } from '../redux/slices/bookmarkSlice';

const PRIMARY = '#f4257b';
const { width } = Dimensions.get('window');

// --- Icons ---
const SearchIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">
        <Path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </Svg>
);
const PlayIcon = () => (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="white">
        <Path d="M8 5v14l11-7z" />
    </Svg>
);
const BookmarkHeart = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
    </Svg>
);

// (hardcoded BOOKMARKS removed — now using real data from backend)

/** Format seconds to mm:ss */
function formatTime(secs) {
    if (isNaN(secs) || secs < 0) return '0m';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

// --- Components ---
const ContinueListeningCard = ({ item, onPress }) => {
    const playlist = item.playlistId;
    if (!playlist || typeof playlist !== 'object') return null;

    const totalChapters = playlist.chapters?.length || 1;
    const completedCount = item.completedChapters?.length || 0;
    const progress = Math.round((completedCount / totalChapters) * 100);
    const coverUri = playlist.images?.[0] || 'https://via.placeholder.com/300';

    // Estimate remaining duration
    const totalDuration = playlist.duration || 0;
    const elapsedRatio = completedCount / totalChapters;
    const remaining = Math.max(0, totalDuration * (1 - elapsedRatio));

    return (
        <TouchableOpacity style={styles.continueCard} activeOpacity={0.85} onPress={onPress}>
            <View style={styles.continueGlow} />
            <View style={styles.continueImageWrapper}>
                <Image source={{ uri: coverUri }} style={styles.continueImage} />
                <View style={styles.continuePlayOverlay}>
                    <PlayIcon />
                </View>
            </View>
            <View style={styles.continueInfo}>
                <Text style={styles.continueTitle} numberOfLines={1}>
                    {playlist.title}
                </Text>
                {playlist.description ? (
                    <Text style={styles.continueAuthor} numberOfLines={2}>
                        {playlist.description}
                    </Text>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                        {completedCount}/{totalChapters}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const BookmarkItem = ({ item, onPress }) => {
    const playlist = item.playlistId;
    if (!playlist || typeof playlist !== 'object') return null;
    const coverUri = playlist.images?.[0] || 'https://via.placeholder.com/300';
    const chapterCount = playlist.chapters?.length || 0;

    return (
        <TouchableOpacity style={styles.bookmarkCard} activeOpacity={0.7} onPress={onPress}>
            <Image source={{ uri: coverUri }} style={styles.bookmarkCover} />
            <View style={styles.bookmarkContent}>
                <View style={styles.bookmarkTopRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.bookmarkTitle} numberOfLines={1}>
                            {playlist.title}
                        </Text>
                        <Text style={styles.bookmarkQuote} numberOfLines={1}>
                            {playlist.author || 'Unknown author'}
                        </Text>
                    </View>
                    <BookmarkHeart />
                </View>
                <View style={styles.bookmarkBottomRow}>
                    <Text style={styles.bookmarkMeta}>
                        {chapterCount} chapters • {formatTime(playlist.duration || 0)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const LibraryScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const userId = useSelector((state) => state.user.userData?.id);
    const continueListeningHistory = useSelector(selectContinueListening);
    const bookmarks = useSelector(selectBookmarks);

    useEffect(() => {
        if (userId) {
            dispatch(fetchPlayHistory(userId));
            dispatch(fetchBookmarks(userId));
        }
    }, [userId, dispatch]);

    const handleContinuePress = (item) => {
        const playlist = item.playlistId;
        if (playlist && typeof playlist === 'object') {
            navigation.navigate('Home', { screen: 'Playlist', params: { playlistId: playlist._id, playlist } });
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.headerTitle}>Library</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>
                {/* Continue Listening */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>CONTINUE LISTENING</Text>
                    {continueListeningHistory.length > 0 ? (
                        <View style={{ gap: 12 }}>
                            {continueListeningHistory.map((item) => (
                                <ContinueListeningCard
                                    key={item._id || item.playlistId?._id}
                                    item={item}
                                    onPress={() => handleContinuePress(item)}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                Start listening to see your history here
                            </Text>
                        </View>
                    )}
                </View>

                {/* Saved Playlists */}
                <View style={styles.section}>
                    <View style={styles.bookmarksHeader}>
                        <Text style={styles.sectionLabel}>SAVED PLAYLISTS</Text>
                    </View>
                    {bookmarks.length > 0 ? (
                        <View style={styles.bookmarksList}>
                            {bookmarks.map(bk => (
                                <BookmarkItem
                                    key={bk._id}
                                    item={bk}
                                    onPress={() => {
                                        const playlist = bk.playlistId;
                                        if (playlist && typeof playlist === 'object') {
                                            navigation.navigate('Home', { screen: 'Playlist', params: { playlistId: playlist._id, playlist } });
                                        }
                                    }}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                Tap the ♥ on a playlist to save it here
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 24 }} />
            </ScrollView>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: 'rgba(0,0,0,0.95)',
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        padding: 2,
        backgroundColor: PRIMARY,
        overflow: 'hidden',
    },
    headerAvatarImg: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#000',
    },
    scrollContent: {
        paddingBottom: 16,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: 2,
        marginBottom: 16,
    },
    // Continue Listening
    continueCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        overflow: 'hidden',
    },
    continueGlow: {
        position: 'absolute',
        right: -48,
        top: -48,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(244,37,123,0.12)',
    },
    continueImageWrapper: {
        width: 96,
        height: 96,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
    },
    continueImage: {
        width: '100%',
        height: '100%',
    },
    continuePlayOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    continueInfo: {
        flex: 1,
        gap: 4,
    },
    continueTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    continueAuthor: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 8,
    },
    progressTrack: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressFill: {
        height: '100%',
        backgroundColor: PRIMARY,
        borderRadius: 3,
    },
    continueRemaining: {
        fontSize: 11,
        fontWeight: '700',
        color: PRIMARY,
        letterSpacing: 0.5,
    },
    emptyState: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    emptyText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.3)',
    },
    // Bookmarks
    bookmarksHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewAll: {
        fontSize: 10,
        fontWeight: '700',
        color: PRIMARY,
        letterSpacing: 1,
    },
    bookmarksList: {
        gap: 12,
    },
    bookmarkCard: {
        flexDirection: 'row',
        gap: 14,
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        alignItems: 'flex-start',
    },
    bookmarkCover: {
        width: 56,
        height: 56,
        borderRadius: 10,
        backgroundColor: '#121212',
    },
    bookmarkContent: {
        flex: 1,
        gap: 8,
    },
    bookmarkTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    bookmarkTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    bookmarkQuote: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.35)',
        marginTop: 2,
    },
    bookmarkBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bookmarkMeta: {
        fontSize: 10,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.2)',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    bookmarkAgo: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.2)',
    },
    // FAB
    fab: {
        position: 'absolute',
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
    },
});

export default LibraryScreen;
