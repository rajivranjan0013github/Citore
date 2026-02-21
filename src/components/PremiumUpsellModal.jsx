import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

const CrownIcon = () => (
    <View style={styles.iconContainer}>
        <Svg width="60" height="60" viewBox="0 0 24 24" fill="none">
            <Path
                d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z"
                stroke="#ff1493"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="#ff1493"
            />
            <Path
                d="M5 18H19V20H5V18Z"
                fill="#ff1493"
            />
        </Svg>
    </View>
);

const PremiumUpsellModal = ({ visible, onClose, onSubscribe }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.glow} />

                    <CrownIcon />

                    <Text style={styles.title}>Gold Content Available</Text>
                    <Text style={styles.description}>
                        Unlock all chapters and listen to the full story by subscribing to Citore Gold!
                    </Text>

                    <TouchableOpacity
                        style={styles.subscribeBtn}
                        onPress={onSubscribe}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.subscribeBtnText}>Subscribe Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.maybeLaterBtn}
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.maybeLaterText}>Maybe Later</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: width * 0.85,
        backgroundColor: '#1A1A1A',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 20, 147, 0.3)',
        position: 'relative',
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        top: -50,
        width: 200,
        height: 200,
        backgroundColor: 'rgba(255, 20, 147, 0.1)',
        borderRadius: 100,
    },
    iconContainer: {
        marginBottom: 20,
        backgroundColor: 'rgba(255, 20, 147, 0.1)',
        padding: 15,
        borderRadius: 50,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    subscribeBtn: {
        width: '100%',
        backgroundColor: '#ff1493',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#ff1493',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    subscribeBtnText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
    },
    maybeLaterBtn: {
        paddingVertical: 12,
    },
    maybeLaterText: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '600',
    },
});

export default PremiumUpsellModal;
