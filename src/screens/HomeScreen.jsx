import React, { useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    StatusBar,
    Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Svg, { Path, Circle } from 'react-native-svg';
import { fetchPlaylists } from '../redux/slices/playlistSlice';
import { fetchPlayHistory, selectContinueListening } from '../redux/slices/playHistorySlice';

const defaultAvatar = require('../assets/default_avatar.png');

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const BOOK_SIZE = 128;

// --- Icon components ---

const PlayIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="white">
        <Path d="M8 5v14l11-7z" />
    </Svg>
);

const BookmarkIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="white">
        <Path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
    </Svg>
);

const StarIcon = ({ size = 10 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#ff1a8c">
        <Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </Svg>
);

const InfoIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="white">
        <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </Svg>
);

const CrownIcon = ({ size = 16, color = '#FFD700' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <Path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.55 18.55 20 18 20H6C5.45 20 5 19.55 5 19V18H19V19Z" />
    </Svg>
);

const PlayTriangle = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="#000">
        <Path d="M8 5v14l11-7z" />
    </Svg>
);

// --- Greeting helper ---
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
};

// --- Components ---
const DiscoverCard = ({ item }) => {
    const navigation = useNavigation();
    const coverUri = item.images?.[0] || 'https://via.placeholder.com/600x800';
    return (
        <View style={styles.discoverCard}>
            <Image source={{ uri: coverUri }} style={styles.discoverImage} />
            <View style={styles.discoverGradient} />
            <View style={styles.discoverContent}>
                <View
                    style={[
                        styles.badge,
                        styles.badgePrimary,
                    ]}>
                    <Text style={styles.badgeText}>{item.category || 'Featured'}</Text>
                </View>
                <Text style={styles.discoverTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.discoverAuthor} numberOfLines={1}>{item.author}</Text>
                <View style={styles.discoverButtons}>
                    <TouchableOpacity
                        style={styles.playButton}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('Playlist', { playlistId: item._id, playlist: item })}
                    >
                        <PlayIcon />
                        <Text style={styles.playButtonText}>Play Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bookmarkButton} activeOpacity={0.8}>
                        <BookmarkIcon />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const BookCard = ({ book, showPlayOverlay }) => {
    const navigation = useNavigation();
    const coverUri = book.images?.[0] || 'https://via.placeholder.com/300';
    return (
        <TouchableOpacity
            style={styles.bookCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Playlist', { playlistId: book._id, playlist: book })}
        >
            <View style={styles.bookCoverContainer}>
                <Image source={{ uri: coverUri }} style={styles.bookCover} />
                {showPlayOverlay && (
                    <View style={styles.playOverlay}>
                        <View style={styles.playOverlayCircle}>
                            <PlayTriangle />
                        </View>
                    </View>
                )}
                <View style={styles.ratingBadge}>
                    <StarIcon size={10} />
                    <Text style={styles.ratingText}>4.8</Text>
                </View>
            </View>
            <Text style={styles.bookTitle} numberOfLines={2}>
                {book.title}
            </Text>
            <Text style={styles.bookAuthor} numberOfLines={1}>
                {book.author}
            </Text>
        </TouchableOpacity>
    );
};

const SectionHeader = ({ title, onPress }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity onPress={onPress}>
            <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
    </View>
);

const BookRow = ({ books, showPlayOverlay }) => (
    <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bookRow}>
        {books.map(book => (
            <BookCard key={book._id} book={book} showPlayOverlay={showPlayOverlay} />
        ))}
    </ScrollView>
);

// --- Skeleton shimmer ---
const SkeletonBox = ({ w, h, r = 8, mt = 0 }) => {
    const anim = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ]),
        ).start();
    }, [anim]);
    return (
        <Animated.View
            style={{
                width: w,
                height: h,
                borderRadius: r,
                backgroundColor: 'rgba(255,255,255,0.08)',
                marginTop: mt,
                opacity: anim,
            }}
        />
    );
};

// --- Main Screen ---
const HomeScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const { playlists, status, error } = useSelector((state) => state.playlist);
    const { userData: user, isPremium } = useSelector((state) => state.user);

    // Fetch play history for continue listening
    const continueListeningHistory = useSelector(selectContinueListening);

    useEffect(() => {
        dispatch(fetchPlaylists());
        if (user?.id) {
            dispatch(fetchPlayHistory(user.id));
        }
    }, [dispatch, user?.id]);

    // Continue listening playlists (from play history, populated with playlist data)
    const continueListening = useMemo(() => {
        return continueListeningHistory
            .filter(h => h.playlistId && typeof h.playlistId === 'object')
            .map(h => h.playlistId);
    }, [continueListeningHistory]);

    // Categorized playlists
    const discoverPlaylists = useMemo(() => playlists.slice(0, 3), [playlists]);
    const selfHelp = useMemo(() => playlists.filter(p => (p.category || '').toLowerCase().includes('self-help') || (p.category || '').toLowerCase().includes('growth')), [playlists]);
    const motivational = useMemo(() => playlists.filter(p => (p.category || '').toLowerCase().includes('motivational')), [playlists]);
    const romance = useMemo(() => playlists.filter(p => (p.category || '').toLowerCase().includes('romance')), [playlists]);
    const horror = useMemo(() => playlists.filter(p => (p.category || '').toLowerCase().includes('horror') || (p.category || '').toLowerCase().includes('suspense')), [playlists]);
    const fantasy = useMemo(() => playlists.filter(p => (p.category || '').toLowerCase().includes('fantasy') || (p.category || '').toLowerCase().includes('science fiction')), [playlists]);
    const mythology = useMemo(() => playlists.filter(p => (p.category || '').toLowerCase().includes('mythology')), [playlists]);
    const devotional = useMemo(() => playlists.filter(p => (p.category || '').toLowerCase().includes('devotional') || (p.category || '').toLowerCase().includes('spiritual')), [playlists]);

    if (status === 'loading' && playlists.length === 0) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <View>
                        <Text style={styles.greeting}>{getGreeting()}</Text>
                        <View style={styles.nameRow}>
                            <Text style={styles.userName}>{user?.name || 'Alex Johnson'}</Text>
                            {isPremium && (
                                <View style={styles.crownBadge}>
                                    <CrownIcon />
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
                            <Image
                                source={user?.profilePic ? { uri: user.profilePic } : defaultAvatar}
                                style={styles.avatarImage}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Discover skeleton */}
                    <View style={{ paddingLeft: 24, paddingBottom: 24 }}>
                        <SkeletonBox w={CARD_WIDTH} h={CARD_WIDTH * (4 / 3)} r={16} />
                    </View>
                    {/* Section skeleton × 3 */}
                    {[1, 2, 3].map(i => (
                        <View key={i}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 14, marginTop: 8 }}>
                                <SkeletonBox w={120} h={18} r={4} />
                                <SkeletonBox w={50} h={14} r={4} />
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bookRow}>
                                {[1, 2, 3, 4].map(j => (
                                    <View key={j} style={{ width: BOOK_SIZE }}>
                                        <SkeletonBox w={BOOK_SIZE} h={BOOK_SIZE} r={12} />
                                        <SkeletonBox w={BOOK_SIZE * 0.8} h={14} r={4} mt={8} />
                                        <SkeletonBox w={BOOK_SIZE * 0.5} h={12} r={4} mt={4} />
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View>
                    <Text style={styles.greeting}>{getGreeting()}</Text>
                    <View style={styles.nameRow}>
                        <Text style={styles.userName}>{user?.name || 'Alex Johnson'}</Text>
                        {isPremium && (
                            <View style={styles.crownBadge}>
                                <CrownIcon />
                            </View>
                        )}
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
                        <Image
                            source={user?.profilePic ? { uri: user.profilePic } : defaultAvatar}
                            style={styles.avatarImage}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>

                {playlists.length === 0 && (
                    <View style={{ padding: 24, alignItems: 'center' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>No playlists found.</Text>
                    </View>
                )}

                {/* Discover Section */}
                {discoverPlaylists.length > 0 && (
                    <>
                        {/* <Text style={styles.discoverHeading}>Discover</Text> */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={CARD_WIDTH + 24}
                            decelerationRate="fast"
                            contentContainerStyle={styles.discoverRow}>
                            {discoverPlaylists.map(card => (
                                <DiscoverCard key={card._id} item={card} />
                            ))}
                        </ScrollView>
                    </>
                )}


                {/* Growth & Self-Help */}
                {selfHelp.length > 0 && (
                    <>
                        <SectionHeader title="Growth & Self-Help" onPress={() => navigation.navigate('ViewPlaylists', { title: 'Growth & Self-Help', playlists: selfHelp })} />
                        <BookRow books={selfHelp} />
                    </>
                )}

                {/* Motivational */}
                {motivational.length > 0 && (
                    <>
                        <SectionHeader title="Motivational" onPress={() => navigation.navigate('ViewPlaylists', { title: 'Motivational', playlists: motivational })} />
                        <BookRow books={motivational} />
                    </>
                )}

                {/* Romance */}
                {romance.length > 0 && (
                    <>
                        <SectionHeader title="Romance" onPress={() => navigation.navigate('ViewPlaylists', { title: 'Romance', playlists: romance })} />
                        <BookRow books={romance} />
                    </>
                )}

                {/* Horror & Suspense */}
                {horror.length > 0 && (
                    <>
                        <SectionHeader title="Horror & Suspense" onPress={() => navigation.navigate('ViewPlaylists', { title: 'Horror & Suspense', playlists: horror })} />
                        <BookRow books={horror} />
                    </>
                )}

                {/* Fantasy & Science Fiction */}
                {fantasy.length > 0 && (
                    <>
                        <SectionHeader title="Fantasy & Science Fiction" onPress={() => navigation.navigate('ViewPlaylists', { title: 'Fantasy & Science Fiction', playlists: fantasy })} />
                        <BookRow books={fantasy} />
                    </>
                )}

                {/* Mythology */}
                {mythology.length > 0 && (
                    <>
                        <SectionHeader title="Mythology" onPress={() => navigation.navigate('ViewPlaylists', { title: 'Mythology', playlists: mythology })} />
                        <BookRow books={mythology} />
                    </>
                )}

                {/* Devotional / Spiritual */}
                {devotional.length > 0 && (
                    <>
                        <SectionHeader title="Devotional / Spiritual" onPress={() => navigation.navigate('ViewPlaylists', { title: 'Devotional / Spiritual', playlists: devotional })} />
                        <BookRow books={devotional} />
                    </>
                )}

                {/* Fallback: Recent Playlists */}
                {playlists.length > 0 && selfHelp.length === 0 && motivational.length === 0 && romance.length === 0 && horror.length === 0 && fantasy.length === 0 && mythology.length === 0 && devotional.length === 0 && (
                    <>
                        <SectionHeader title="Recent Playlists" onPress={() => navigation.navigate('ViewPlaylists', { title: 'Recent Playlists', playlists })} />
                        <BookRow books={playlists} />
                    </>
                )}

                {/* Bottom spacer for tab bar */}
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
        paddingBottom: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    greeting: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ff1a8c',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 2,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    crownBadge: {
        marginTop: -2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,26,140,0.4)',
        backgroundColor: '#121212',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 16,
    },
    // Discover
    discoverHeading: {
        fontSize: 26,
        fontWeight: '700',
        color: '#fff',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    discoverRow: {
        paddingLeft: 24,
        paddingRight: 8,
        gap: 24,
        paddingBottom: 24,
    },
    discoverCard: {
        width: CARD_WIDTH,
        aspectRatio: 3 / 4,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    discoverImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    discoverGradient: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        // Simulating gradient with multiple layers
        borderRadius: 16,
    },
    discoverImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    discoverGradient: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        // Simulating gradient with multiple layers
        borderRadius: 16,
    },
    discoverContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    badgePrimary: {
        backgroundColor: '#ff1a8c',
    },
    badgeGlass: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    discoverTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    discoverAuthor: {
        fontSize: 17,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 16,
    },
    discoverButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    playButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#ff1a8c',
        paddingVertical: 14,
        borderRadius: 14,
    },
    playButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    bookmarkButton: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 14,
        borderRadius: 14,
    },
    detailsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 14,
        borderRadius: 14,
    },
    detailsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Section
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 14,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ff1a8c',
    },
    // Book row
    bookRow: {
        paddingLeft: 24,
        paddingRight: 8,
        gap: 16,
        paddingBottom: 20,
    },
    bookCard: {
        width: BOOK_SIZE,
    },
    bookCoverContainer: {
        width: BOOK_SIZE,
        height: BOOK_SIZE,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#121212',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 8,
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    playOverlayCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookCover: {
        width: '100%',
        height: '100%',
    },
    ratingBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    bookTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        lineHeight: 18,
        marginBottom: 2,
    },
    bookAuthor: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
});

export default HomeScreen;
