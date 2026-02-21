import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser, setUserData } from '../redux/slices/userSlice';
import Svg, { Path } from 'react-native-svg';

const LANGUAGES = [
    { id: 'english', label: 'English' },
    { id: 'hindi', label: 'Hindi' },
    { id: 'bangla', label: 'Bangla' },
];

const EditLanguageScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { userData } = useSelector(state => state.user);
    const [selected, setSelected] = useState(userData?.language || null);
    const [isSaving, setIsSaving] = useState(false);

    // Sync state if userData loads after initial mount
    useEffect(() => {
        if (userData?.language && !selected) {
            setSelected(userData.language);
        }
    }, [userData?.language]);

    const handleSave = async () => {
        const userId = userData?.id || userData?._id;
        if (!userId) {
            Alert.alert('Error', 'User ID not found');
            return;
        }

        if (!selected) {
            Alert.alert('Error', 'Please select a language');
            return;
        }

        setIsSaving(true);
        try {
            const resultAction = await dispatch(updateUser({ userId, userData: { language: selected } }));

            if (updateUser.fulfilled.match(resultAction)) {
                // Update local state to reflect immediately
                dispatch(setUserData({ ...userData, language: selected }));
                Alert.alert('Success', 'Language updated successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                const errorMsg = resultAction.payload || 'Failed to update language';
                Alert.alert('Error', errorMsg);
            }
        } catch (e) {
            console.warn('Failed to save language', e);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setIsSaving(false);
        }
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
                    <View style={{ width: 40 }} />
                </View>
            </View>

            {/* Main Content */}
            <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollInner}
                showsVerticalScrollIndicator={false}>
                <View style={styles.headingGroup}>
                    <Text style={styles.heading}>
                        Select audio <Text style={styles.headingAccent}>language</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        Choose your preferred language for audiobooks.
                    </Text>
                </View>

                {/* Options */}
                <View style={styles.optionsGroup}>
                    {LANGUAGES.map(l => {
                        const isSelected = selected === l.id;
                        return (
                            <TouchableOpacity
                                key={l.id}
                                activeOpacity={0.8}
                                onPress={() => setSelected(l.id)}
                                style={[
                                    styles.optionCard,
                                    isSelected && styles.optionCardSelected,
                                ]}>
                                <Text
                                    style={[
                                        styles.optionLabel,
                                        isSelected && styles.optionLabelSelected,
                                    ]}>
                                    {l.label}
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
                    style={[styles.nextButton, isSaving && { opacity: 0.7 }]}
                    activeOpacity={0.85}
                    onPress={handleSave}
                    disabled={isSaving}>
                    {isSaving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.nextButtonText}>Save Changes</Text>
                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
                                <Path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                            </Svg>
                        </>
                    )}
                </TouchableOpacity>
                <Text style={styles.footerHint}>
                    You can change this anytime from your profile settings.
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

export default EditLanguageScreen;
