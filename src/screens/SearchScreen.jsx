import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { API_BASE } from '../utils/api';

const SearchSvg = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="rgba(255,255,255,0.35)">
        <Path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </Svg>
);

const ClearSvg = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)">
        <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </Svg>
);

// Audiobook-relevant categories with color accents
const CATEGORIES = [
    { label: 'Sci-Fi', color: '#ff6b6b' },
    { label: 'Mystery', color: '#c084fc' },
    { label: 'Self-Help', color: '#fbbf24' },
    { label: 'Romance', color: '#f472b6' },
    { label: 'Fantasy', color: '#60a5fa' },
    { label: 'Thriller', color: '#fb923c' },
    { label: 'Biography', color: '#a78bfa' },
    { label: 'Horror', color: '#ff6b6b' },
    { label: 'Drama', color: '#60a5fa' },
    { label: 'Spirituality', color: '#c084fc' },
    { label: 'Young Adult', color: '#f472b6' },
    { label: 'Motivation', color: '#fbbf24' },
    { label: 'Relationships', color: '#f472b6' },
    { label: 'Science', color: '#60a5fa' },
    { label: 'Short Stories', color: '#a78bfa' },
    { label: 'Suspense', color: '#ff6b6b' },
    { label: 'Travel', color: '#34d399' },
];

const SearchScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const debounceRef = useRef(null);

    // ---- API helpers ----
    const fetchSearch = useCallback(async (searchQuery) => {
        try {
            setLoading(true);
            const res = await fetch(
                `${API_BASE}/api/playlist/search?q=${encodeURIComponent(searchQuery)}`,
            );
            const json = await res.json();
            setResults(json.success ? json.data : []);
            setSearched(true);
        } catch (e) {
            console.warn('[Search] fetch error:', e);
            setResults([]);
            setSearched(true);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchByCategory = useCallback(async (category) => {
        try {
            setLoading(true);
            const res = await fetch(
                `${API_BASE}/api/playlist/search?category=${encodeURIComponent(category)}`,
            );
            const json = await res.json();
            setResults(json.success ? json.data : []);
            setSearched(true);
        } catch (e) {
            console.warn('[Search] category fetch error:', e);
            setResults([]);
            setSearched(true);
        } finally {
            setLoading(false);
        }
    }, []);

    // ---- Debounced text search ----
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!query.trim()) {
            setResults([]);
            setSearched(false);
            setActiveCategory(null);
            return;
        }

        setActiveCategory(null);
        debounceRef.current = setTimeout(() => {
            fetchSearch(query.trim());
        }, 500);

        return () => clearTimeout(debounceRef.current);
    }, [query, fetchSearch]);

    // ---- Category tap ----
    const handleCategoryPress = (label) => {
        setQuery('');
        setActiveCategory(label);
        fetchByCategory(label);
    };

    // ---- Clear search ----
    const handleClear = () => {
        setQuery('');
        setResults([]);
        setSearched(false);
        setActiveCategory(null);
    };

    // Filter category chips when typing
    const filteredCategories = query.trim()
        ? CATEGORIES.filter(c =>
            c.label.toLowerCase().includes(query.toLowerCase()),
        )
        : CATEGORIES;

    // ---- Result card ----
    const renderResult = (item) => (
        <TouchableOpacity
            key={item._id}
            style={styles.resultCard}
            activeOpacity={0.7}
            onPress={() =>
                navigation.navigate('Playlist', {
                    playlistId: item._id,
                    playlist: item,
                })
            }>
            {item.images && item.images.length > 0 ? (
                <Image source={{ uri: item.images[0] }} style={styles.resultImage} />
            ) : (
                <View style={[styles.resultImage, styles.resultImagePlaceholder]}>
                    <Text style={styles.placeholderEmoji}>🎧</Text>
                </View>
            )}
            <View style={styles.resultInfo}>
                <Text style={styles.resultTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                {item.author ? (
                    <Text style={styles.resultAuthor} numberOfLines={1}>
                        {item.author}
                    </Text>
                ) : null}
                {item.category ? (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </View>
                ) : null}
            </View>
        </TouchableOpacity>
    );

    const showResults = searched || activeCategory;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={[styles.headerArea, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.headerTitle}>Discover</Text>
                {/* Search Bar */}
                <View style={styles.searchBar}>
                    <SearchSvg />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by title or category"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        value={query}
                        onChangeText={setQuery}
                        autoCorrect={false}
                        returnKeyType="search"
                    />
                    {(query.length > 0 || activeCategory) && (
                        <TouchableOpacity onPress={handleClear} hitSlop={8}>
                            <ClearSvg />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled">

                {/* Category Chips */}
                {!activeCategory && !query.trim() && (
                    <>
                        <Text style={styles.heading}>Browse Categories</Text>
                        <View style={styles.tagsContainer}>
                            {filteredCategories.map((cat, i) => (
                                <TouchableOpacity
                                    key={cat.label + i}
                                    style={styles.tag}
                                    activeOpacity={0.7}
                                    onPress={() => handleCategoryPress(cat.label)}>
                                    <Text style={[styles.tagText, { color: cat.color }]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                {/* Active category header */}
                {activeCategory && !query.trim() && (
                    <View style={styles.activeCategoryHeader}>
                        <Text style={styles.heading}>{activeCategory}</Text>
                        <TouchableOpacity onPress={handleClear}>
                            <Text style={styles.clearText}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Loading */}
                {loading && (
                    <ActivityIndicator
                        size="large"
                        color="#c084fc"
                        style={styles.loader}
                    />
                )}

                {/* Results */}
                {!loading && showResults && results.length > 0 && (
                    <View style={styles.resultsList}>
                        {results.map(renderResult)}
                    </View>
                )}

                {/* Empty state */}
                {!loading && showResults && results.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🔍</Text>
                        <Text style={styles.emptyText}>No results found</Text>
                        <Text style={styles.emptySubtext}>
                            Try a different keyword or category
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    headerArea: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.5,
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#1a1a1a',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        padding: 0,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    heading: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginTop: 24,
        marginBottom: 20,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    tag: {
        backgroundColor: '#1c1c1e',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    tagText: {
        fontSize: 14,
        fontWeight: '500',
    },
    // ── Active Category Header ──
    activeCategoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    clearText: {
        fontSize: 14,
        color: '#c084fc',
        fontWeight: '600',
    },
    // ── Results ──
    resultsList: {
        marginTop: 8,
        gap: 12,
    },
    resultCard: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    resultImage: {
        width: 90,
        height: 90,
    },
    resultImagePlaceholder: {
        backgroundColor: '#2a2a2a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderEmoji: {
        fontSize: 28,
    },
    resultInfo: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    resultAuthor: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 6,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(192,132,252,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    categoryBadgeText: {
        fontSize: 11,
        color: '#c084fc',
        fontWeight: '500',
    },
    // ── Loading / Empty ──
    loader: {
        marginTop: 40,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyEmoji: {
        fontSize: 40,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
    },
});

export default SearchScreen;
