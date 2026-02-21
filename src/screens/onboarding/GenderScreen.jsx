import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../redux/slices/userSlice';
import Svg, { Path } from 'react-native-svg';

const GENDERS = [
    { id: 'male', label: 'Male' },
    { id: 'female', label: 'Female' },
    { id: 'other', label: 'Other' },
];

const GenderScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const userData = useSelector(state => state.user.userData);
    const [selected, setSelected] = useState(null);

    const handleContinue = async () => {
        const userId = userData?.id || userData?._id;
        if (selected && userId) {
            try {
                await dispatch(updateUser({ userId, userData: { gender: selected } }));
            } catch (e) {
                console.warn('Failed to save gender', e);
            }
        }
        navigation.navigate('Age');
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
                    <TouchableOpacity onPress={() => navigation.navigate('Age')}>
                        <Text style={styles.skipHeaderBtn}>Skip</Text>
                    </TouchableOpacity>
                </View>

            </View>

            {/* Main Content */}
            <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollInner}
                showsVerticalScrollIndicator={false}>
                <View style={styles.headingGroup}>
                    <Text style={styles.heading}>
                        Select your <Text style={styles.headingAccent}>gender</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        This helps us personalize your audiobook recommendations and voice
                        preferences.
                    </Text>
                </View>

                {/* Options */}
                <View style={styles.optionsGroup}>
                    {GENDERS.map(g => {
                        const isSelected = selected === g.id;
                        return (
                            <TouchableOpacity
                                key={g.id}
                                activeOpacity={0.8}
                                onPress={() => setSelected(g.id)}
                                style={[
                                    styles.optionCard,
                                    isSelected && styles.optionCardSelected,
                                ]}>
                                <Text
                                    style={[
                                        styles.optionLabel,
                                        isSelected && styles.optionLabelSelected,
                                    ]}>
                                    {g.label}
                                </Text>
                                <View
                                    style={[
                                        styles.radio,
                                        isSelected && styles.radioSelected,
                                    ]}>
                                    {isSelected && (
                                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="white">
                                            <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </Svg>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity
                    style={styles.nextButton}
                    activeOpacity={0.85}
                    onPress={handleContinue}>
                    <Text style={styles.nextButtonText}>Next Step</Text>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
                        <Path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                    </Svg>
                </TouchableOpacity>
                <Text style={styles.footerHint}>
                    You can change this anytime in settings.
                </Text>
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
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(244,37,123,0.12)',
        transform: [{ translateX: 60 }, { translateY: -60 }],
    },
    glowBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 320,
        height: 320,
        borderRadius: 160,
        backgroundColor: 'rgba(80,0,80,0.15)',
        transform: [{ translateX: -60 }, { translateY: 80 }],
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
    skipHeaderBtn: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.4)',
    },
    scrollContent: {
        flex: 1,
    },
    scrollInner: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 24,
    },
    headingGroup: {
        marginBottom: 32,
    },
    heading: {
        fontSize: 30,
        fontWeight: '700',
        color: '#fff',
        lineHeight: 38,
        marginBottom: 12,
    },
    headingAccent: {
        color: '#f4257b',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
        lineHeight: 20,
    },
    optionsGroup: {
        flex: 1,
        justifyContent: 'center',
        gap: 14,
        paddingBottom: 40,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        borderRadius: 16,
        backgroundColor: '#121212',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionCardSelected: {
        borderColor: '#f4257b',
        backgroundColor: 'rgba(244,37,123,0.08)',
    },
    optionLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
    },
    optionLabelSelected: {
        color: '#fff',
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: '#f4257b',
        backgroundColor: '#f4257b',
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 12,
        alignItems: 'center',
        zIndex: 20,
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
        fontWeight: '700',
    },
    footerHint: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
        marginTop: 14,
    },
});

export default GenderScreen;
