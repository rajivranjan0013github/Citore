import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Modal,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser, deleteUser, clearUserData } from '../redux/slices/userSlice';
import TrackPlayer from 'react-native-track-player';
import { storage } from '../utils/storage';

const defaultAvatar = require('../assets/default_avatar.png');

const PRIMARY = '#f4257b';
const DANGER = '#ff4d4d';

// --- Icons ---
const ChevronLeft = () => (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </Svg>
);
const EditCamIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="white">
        <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </Svg>
);
const ExpandMore = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
    </Svg>
);
const DeleteIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={DANGER}>
        <Path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z" />
    </Svg>
);



const GENDERS = ['Male', 'Female', 'Other'];

const EditProfileScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const { userData } = useSelector((state) => state.user);

    const [name, setName] = useState(userData?.name || '');
    const [gender, setGender] = useState(userData?.gender || 'Male');
    const [age, setAge] = useState(userData?.age?.toString() || '');
    const [showGenderPicker, setShowGenderPicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        const userId = userData?.id || userData?._id;
        if (!userId) {
            Alert.alert('Error', 'User ID not found');
            return;
        }

        setIsSaving(true);
        try {
            const resultAction = await dispatch(updateUser({
                userId,
                userData: {
                    name,
                    gender,
                    age: parseInt(age, 10) || 0,
                }
            }));

            if (updateUser.fulfilled.match(resultAction)) {
                Alert.alert('Success', 'Profile updated successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                const errorMsg = resultAction.payload || 'Failed to update profile';
                Alert.alert('Error', errorMsg);
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action is permanent and cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const userId = userData?.id || userData?._id;
                        if (!userId) return;

                        try {
                            const resultAction = await dispatch(deleteUser(userId));
                            if (deleteUser.fulfilled.match(resultAction)) {
                                // Stop any playing audio
                                await TrackPlayer.reset();

                                // Clear whole storage in frontend
                                await storage.clear();

                                // Clear playback cache
                                try {
                                    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                                    await AsyncStorage.removeItem('lastPlayedTrack');
                                } catch (e) { }

                                // Wipe Redux state
                                dispatch(clearUserData());

                                // Navigation will happen automatically as user becomes null
                            } else {
                                Alert.alert('Error', resultAction.payload || 'Failed to delete account');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'An unexpected error occurred');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}>
                    <ChevronLeft />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 48 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled">
                    {/* Avatar */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={userData?.profilePic ? { uri: userData.profilePic } : defaultAvatar}
                                style={styles.avatarImage}
                            />
                            <TouchableOpacity style={styles.editAvatarBtn} activeOpacity={0.8}>
                                <EditCamIcon />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Form */}
                    <View style={styles.formSection}>
                        {/* Name */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>FULL NAME</Text>
                            <TextInput
                                style={styles.textInput}
                                value={name}
                                onChangeText={setName}
                                placeholderTextColor="rgba(255,255,255,0.15)"
                                placeholder="Enter your name"
                            />
                        </View>

                        {/* Gender */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>GENDER</Text>
                            <TouchableOpacity
                                style={styles.selectInput}
                                activeOpacity={0.7}
                                onPress={() => setShowGenderPicker(true)}>
                                <Text style={styles.selectText}>{gender}</Text>
                                <ExpandMore />
                            </TouchableOpacity>

                            <Modal
                                visible={showGenderPicker}
                                transparent
                                animationType="fade"
                                onRequestClose={() => setShowGenderPicker(false)}>
                                <TouchableWithoutFeedback onPress={() => setShowGenderPicker(false)}>
                                    <View style={styles.modalOverlay}>
                                        <View style={styles.modalContent}>
                                            <View style={styles.modalHeader}>
                                                <Text style={styles.modalTitle}>Select Gender</Text>
                                                <View style={styles.modalHeaderBar} />
                                            </View>
                                            {GENDERS.map((g) => (
                                                <TouchableOpacity
                                                    key={g}
                                                    style={[
                                                        styles.pickerOption,
                                                        gender === g && styles.pickerOptionSelected,
                                                    ]}
                                                    onPress={() => {
                                                        setGender(g);
                                                        setShowGenderPicker(false);
                                                    }}>
                                                    <View style={[
                                                        styles.selectedCircle,
                                                        gender !== g && styles.unselectedCircle
                                                    ]}>
                                                        {gender === g && <View style={styles.selectedInner} />}
                                                    </View>
                                                    <Text
                                                        style={[
                                                            styles.pickerOptionText,
                                                            gender === g && styles.pickerOptionTextSelected,
                                                        ]}>
                                                        {g}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </TouchableWithoutFeedback>
                            </Modal>
                        </View>

                        {/* Age */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>AGE</Text>
                            <TextInput
                                style={styles.textInput}
                                value={age}
                                onChangeText={setAge}
                                keyboardType="number-pad"
                                placeholderTextColor="rgba(255,255,255,0.15)"
                                placeholder="Enter your age"
                            />
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                        activeOpacity={0.85}
                        onPress={handleSave}
                        disabled={isSaving}>
                        {isSaving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>

                    {/* Danger Zone */}
                    <View style={styles.dangerSection}>
                        <Text style={styles.dangerLabel}>DANGER ZONE</Text>
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            activeOpacity={0.7}
                            onPress={handleDeleteAccount}>
                            <Text style={styles.deleteBtnText}>Delete Account</Text>
                            <DeleteIcon />
                        </TouchableOpacity>
                        <Text style={styles.dangerDisclaimer}>
                            This action is permanent and will remove all your data, including
                            purchased audiobooks and listening history.
                        </Text>
                    </View>

                    <View style={{ height: 32 }} />
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: 'rgba(0,0,0,0.85)',
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.2,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    // Avatar
    avatarSection: {
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 40,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarImage: {
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 2,
        borderColor: 'rgba(244,37,123,0.25)',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#000',
        elevation: 8,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    // Form
    formSection: {
        gap: 24,
    },
    fieldGroup: {
        gap: 8,
    },
    fieldLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(244,37,123,0.6)',
        letterSpacing: 2,
        paddingLeft: 4,
    },
    textInput: {
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: 'rgba(244,37,123,0.3)',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#fff',
    },
    selectInput: {
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: 'rgba(244,37,123,0.3)',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectText: {
        fontSize: 16,
        color: '#fff',
    },
    pickerDropdown: {
        backgroundColor: '#121212',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(244,37,123,0.2)',
        overflow: 'hidden',
        marginTop: 4,
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
    },
    pickerOptionSelected: {
        backgroundColor: 'rgba(244,37,123,0.08)',
    },
    pickerOptionText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    pickerOptionTextSelected: {
        color: PRIMARY,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#121212',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderColor: 'rgba(244,37,123,0.2)',
    },
    modalHeader: {
        alignItems: 'center',
        paddingVertical: 12,
        marginBottom: 8,
    },
    modalHeaderBar: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        position: 'absolute',
        top: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginTop: 20,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    optionEmoji: {
        fontSize: 22,
    },
    selectedCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unselectedCircle: {
        borderColor: 'rgba(255,255,255,0.2)',
    },
    selectedInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: PRIMARY,
    },
    // Save
    saveBtn: {
        backgroundColor: PRIMARY,
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 32,
        elevation: 8,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    // Danger
    dangerSection: {
        marginTop: 48,
        paddingTop: 32,
        borderTopWidth: 1,
        borderTopColor: 'rgba(244,37,123,0.08)',
    },
    dangerLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: 2,
        marginBottom: 16,
        paddingLeft: 4,
    },
    deleteBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,77,77,0.25)',
        backgroundColor: 'rgba(255,77,77,0.04)',
    },
    deleteBtnText: {
        fontSize: 15,
        fontWeight: '500',
        color: DANGER,
    },
    dangerDisclaimer: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.2)',
        lineHeight: 15,
        marginTop: 12,
        paddingHorizontal: 4,
    },
});

export default EditProfileScreen;
