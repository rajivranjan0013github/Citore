import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    FlatList,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../redux/slices/userSlice';
import Svg, { Path } from 'react-native-svg';

const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const MIN_AGE = 18;
const MAX_AGE = 80;
const DEFAULT_AGE = 25;

const ages = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i);

const AgeScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const userData = useSelector(state => state.user.userData);
    const [selectedAge, setSelectedAge] = useState(DEFAULT_AGE);
    const flatListRef = useRef(null);

    const getItemLayout = (_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
    });

    const onMomentumScrollEnd = useCallback((event) => {
        const y = event.nativeEvent.contentOffset.y;
        const index = Math.round(y / ITEM_HEIGHT);
        const age = ages[Math.min(Math.max(index, 0), ages.length - 1)];
        setSelectedAge(age);
    }, []);

    const renderAge = ({ item }) => {
        const isSelected = item === selectedAge;
        const diff = Math.abs(item - selectedAge);
        let opacity = 1;
        let scale = 1;
        let fontSize = 28;

        if (diff === 0) {
            opacity = 1;
            scale = 1.1;
            fontSize = 48;
        } else if (diff === 1) {
            opacity = 0.6;
            fontSize = 28;
        } else if (diff === 2) {
            opacity = 0.35;
            scale = 0.95;
        } else {
            opacity = 0.15;
            scale = 0.85;
        }

        return (
            <View
                style={[
                    styles.ageItem,
                    { opacity, transform: [{ scale }] },
                ]}>
                <Text
                    style={[
                        styles.ageText,
                        { fontSize },
                        isSelected && styles.ageTextSelected,
                    ]}>
                    {item}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Background Glows */}
            <View style={styles.glowTop} />
            <View style={styles.glowBottom} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <View style={styles.navRow}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}>
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="white">
                            <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                        </Svg>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('NotificationPermission')}>
                        <Text style={styles.skipBtn}>Skip</Text>
                    </TouchableOpacity>
                </View>

            </View>

            {/* Title */}
            <View style={styles.titleSection}>
                <Text style={styles.heading}>
                    How old <Text style={styles.headingAccent}>are you?</Text>
                </Text>
                <Text style={styles.subtitle}>
                    This helps us personalize your audiobook recommendations.
                </Text>
            </View>

            {/* Wheel Picker */}
            <View style={styles.pickerContainer}>
                <View style={styles.wheelWrapper}>
                    {/* Selection Highlight */}
                    <View style={styles.selectionHighlight} pointerEvents="none" />

                    <FlatList
                        ref={flatListRef}
                        data={ages}
                        keyExtractor={item => item.toString()}
                        renderItem={renderAge}
                        getItemLayout={getItemLayout}
                        showsVerticalScrollIndicator={false}
                        snapToInterval={ITEM_HEIGHT}
                        snapToAlignment="start"
                        decelerationRate="fast"
                        disableIntervalMomentum={true}
                        scrollEventThrottle={16}
                        onMomentumScrollEnd={onMomentumScrollEnd}
                        initialScrollIndex={Math.max(0, (selectedAge || DEFAULT_AGE) - MIN_AGE)}
                        style={styles.flatList}
                        initialNumToRender={15}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        contentContainerStyle={{
                            paddingTop: ITEM_HEIGHT * 2,
                            paddingBottom: ITEM_HEIGHT * 2,
                        }}
                    />
                </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity
                    style={styles.nextButton}
                    activeOpacity={0.85}
                    onPress={async () => {
                        const userId = userData?.id || userData?._id;
                        if (selectedAge && userId) {
                            try {
                                await dispatch(updateUser({ userId, userData: { age: selectedAge } }));
                            } catch (e) {
                                console.warn('Failed to save age', e);
                            }
                        }
                        navigation.navigate('NotificationPermission');
                    }}>
                    <Text style={styles.nextButtonText}>Continue</Text>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
                        <Path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                    </Svg>
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
    glowTop: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 384,
        height: 384,
        borderRadius: 192,
        backgroundColor: 'rgba(244,37,123,0.07)',
        transform: [{ translateX: 100 }, { translateY: -100 }],
    },
    glowBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 256,
        height: 256,
        borderRadius: 128,
        backgroundColor: 'rgba(244,37,123,0.04)',
        transform: [{ translateX: -60 }, { translateY: 60 }],
    },
    header: {
        paddingHorizontal: 24,
        zIndex: 10,
    },
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#121212',
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipBtn: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.4)',
    },
    titleSection: {
        paddingHorizontal: 32,
        marginTop: 32,
    },
    heading: {
        fontSize: 34,
        fontWeight: '700',
        color: '#fff',
        lineHeight: 42,
        marginBottom: 12,
    },
    headingAccent: {
        color: '#f4257b',
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '500',
    },
    pickerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheelWrapper: {
        height: PICKER_HEIGHT,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    selectionHighlight: {
        position: 'absolute',
        width: '85%',
        height: ITEM_HEIGHT,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(244,37,123,0.3)',
        backgroundColor: 'rgba(244,37,123,0.05)',
        borderRadius: 12,
    },
    flatList: {
        flex: 1,
        width: '100%',
    },
    ageItem: {
        height: ITEM_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ageText: {
        fontWeight: '500',
        color: 'rgba(255,255,255,0.5)',
    },
    ageTextSelected: {
        color: '#f4257b',
        fontWeight: '700',
    },
    maskTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'transparent',
    },
    maskBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'transparent',
    },
    footer: {
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    nextButton: {
        width: '100%',
        backgroundColor: '#f4257b',
        paddingVertical: 18,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default AgeScreen;
