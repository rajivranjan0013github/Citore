import React, { useMemo } from 'react';
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

const PRIMARY = '#ff1a8c';
const { width } = Dimensions.get('window');
const GRID_GAP = 16;
const CARD_WIDTH = (width - 16 * 2 - GRID_GAP) / 2;

// --- Icons ---
const ChevronLeft = () => (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="white">
        <Path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </Svg>
);
const SearchIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)">
        <Path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </Svg>
);
const StarIcon = () => (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
    </Svg>
);

// --- Grid Card ---
const GridCard = ({ item }) => {
    const navigation = useNavigation();
    const coverUri = item.images?.[0] || 'https://via.placeholder.com/300';
    return (
        <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Playlist', { playlistId: item._id, playlist: item })}
        >
            <View style={styles.gridCoverContainer}>
                <Image source={{ uri: coverUri }} style={styles.gridCover} />
                <View style={styles.ratingBadge}>
                    <StarIcon />
                    <Text style={styles.ratingText}>4.8</Text>
                </View>
            </View>
            <View style={styles.gridInfo}>
                <Text style={styles.gridTitle} numberOfLines={1}>
                    {item.title}
                </Text>
                <Text style={styles.gridAuthor} numberOfLines={1}>
                    {item.author}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const ViewPlaylistsScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute();

    const categoryTitle = route.params?.title || 'Playlists';
    const playlists = route.params?.playlists || [];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}>
                    <ChevronLeft />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {categoryTitle}
                </Text>
                <TouchableOpacity style={styles.searchBtn}>
                    <SearchIcon />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>

                {playlists.length === 0 ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.4)' }}>No playlists found.</Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {playlists.map(item => (
                            <GridCard key={item._id} item={item} />
                        ))}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginLeft: 8,
    },
    searchBtn: {
        padding: 8,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 32,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GRID_GAP,
    },
    // Grid Card
    gridCard: {
        width: CARD_WIDTH,
        gap: 12,
    },
    gridCoverContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    gridCover: {
        width: '100%',
        height: '100%',
    },
    ratingBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    gridInfo: {
        gap: 2,
    },
    gridTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    gridAuthor: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
    },
});

export default ViewPlaylistsScreen;
