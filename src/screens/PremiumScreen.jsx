import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Image,
    Dimensions,
    Animated,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Purchases from 'react-native-purchases';
import { setCustomerInfo, updateUser } from '../redux/slices/userSlice';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

const PRIMARY = '#f4257b';
const { width } = Dimensions.get('window');
const HERO_IMAGE_HEIGHT = 260;

// --- Icons ---
const CloseIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="white">
        <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </Svg>
);
const CheckCircle = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={PRIMARY}>
        <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </Svg>
);
const ErrorIcon = () => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="#F44336">
        <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </Svg>
);

const StarIcon = ({ size = 24, color = PRIMARY }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </Svg>
);

const BENEFITS = [
    'Unlimited access to all playlists',
    'Unlimited downloads',
    'High-fidelity audio',
];

const PlanSkeleton = () => {
    const pulseAnim = React.useRef(new Animated.Value(0.3)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles.skeletonCard, { opacity: pulseAnim }]}>
            <View style={styles.planRow}>
                <View flex={1}>
                    <View style={styles.skeletonTitle} />
                    <View style={styles.skeletonDetail} />
                </View>
                <View style={styles.skeletonPrice} />
            </View>
        </Animated.View>
    );
};

const PremiumScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { userData, customerInfo, isPremium } = useSelector((state) => state.user);
    const [selected, setSelected] = useState(null); // package id
    const [offerings, setOfferings] = useState(null);
    const [loadingOfferings, setLoadingOfferings] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);

    // Toast state
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const toastAnim = React.useRef(new Animated.Value(0)).current;

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        Animated.spring(toastAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 40,
            friction: 7
        }).start();

        setTimeout(() => {
            Animated.timing(toastAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }).start(() => setToast({ visible: false, message: '', type: 'success' }));
        }, 4000);
    };

    useEffect(() => {
        fetchOfferings();
    }, []);

    const fetchOfferings = async () => {
        try {
            setLoadingOfferings(true);
            const o = await Purchases.getOfferings();
            if (o.current && o.current.availablePackages.length > 0) {
                setOfferings(o.current.availablePackages);
                // Set default selection to monthly if available, otherwise first offering
                const monthly = o.current.availablePackages.find(p => p.packageType === 'MONTHLY');
                setSelected(monthly ? monthly.identifier : o.current.availablePackages[0].identifier);
            }
        } catch (e) {
            console.error('Error fetching offerings:', e);
        } finally {
            setLoadingOfferings(false);
        }
    };

    const handlePurchase = async () => {
        if (!selected) return;

        try {
            setIsPurchasing(true);

            // Refetch offerings to get fresh native objects before purchase
            const o = await Purchases.getOfferings();

            let pkg = o.current?.availablePackages?.find(p => p.identifier === selected);

            if (!pkg) {
                for (const offeringName in o.all) {
                    const found = o.all[offeringName].availablePackages.find(p => p.identifier === selected);
                    if (found) {
                        pkg = found;
                        break;
                    }
                }
            }

            if (!pkg) {
                showToast('The selected plan is no longer available. Please refresh.', 'error');
                return;
            }

            console.log('[PremiumScreen] Attempting purchase for package:', pkg.identifier, 'Product:', pkg.product.identifier);

            const { customerInfo: updatedCustomerInfo } = await Purchases.purchasePackage(pkg);
            dispatch(setCustomerInfo(updatedCustomerInfo));
            syncPremiumStatus(updatedCustomerInfo);

            showToast('Purchase successful! Welcome to Gold Membership.', 'success');
        } catch (e) {
            console.error('[PremiumScreen] Purchase Error:', e);
            if (!e.userCancelled) {
                const errorMsg = e.message || 'Unknown purchase error';
                showToast(errorMsg, 'error');
            }
        } finally {
            setIsPurchasing(false);
        }
    };

    const restorePurchases = async () => {
        try {
            setIsPurchasing(true);
            const updatedCustomerInfo = await Purchases.restorePurchases();
            dispatch(setCustomerInfo(updatedCustomerInfo));
            syncPremiumStatus(updatedCustomerInfo);
            showToast('Purchases successfully restored!', 'success');
        } catch (e) {
            showToast('Error restoring purchases: ' + e.message, 'error');
        } finally {
            setIsPurchasing(false);
        }
    };

    const syncPremiumStatus = async (info) => {
        const uid = userData?.id || userData?._id;
        if (!uid) return;

        const activeEntitlements = info?.entitlements?.active || {};
        const hasPremium = Object.keys(activeEntitlements).length > 0;

        // Find the most recent plan and expiry
        const activeList = Object.values(activeEntitlements);
        let expiryDate = null;
        let planId = null;

        if (hasPremium) {
            const maxDate = activeList.reduce((acc, e) => {
                const d = e.expirationDate ? new Date(e.expirationDate) : null;
                if (!d) return acc;
                if (!acc) return d;
                return d > acc ? d : acc;
            }, null);
            expiryDate = maxDate ? maxDate.toISOString() : null;
            planId = activeList[0]?.productIdentifier || null;
        }

        try {
            await dispatch(updateUser({
                userId: uid,
                userData: {
                    isPremium: hasPremium,
                    premiumExpiresAt: expiryDate,
                    premiumPlan: planId
                }
            })).unwrap();
        } catch (err) {
            console.warn('Failed to sync premium status with backend:', err);
        }
    };

    const getExpiryDate = () => {
        // Source 1: customerInfo (RevenueCat Local State - Most Reliable)
        const activeEntitlements = customerInfo?.entitlements?.active || {};
        const activeList = Object.values(activeEntitlements);

        if (activeList.length > 0) {
            const maxDate = activeList.reduce((acc, e) => {
                const d = e.expirationDate ? new Date(e.expirationDate) : null;
                if (!d) return acc;
                if (!acc) return d;
                return d > acc ? d : acc;
            }, null);

            if (maxDate) {
                return maxDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });
            }
        }

        // Source 2: userData (Backend State - Fallback)
        if (userData?.premiumExpiresAt) {
            return new Date(userData.premiumExpiresAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        }

        return null;
    };

    const formatDummyPrice = (product) => {
        try {
            const doublePrice = product.price * 2;
            // Extract currency symbol/prefix/suffix by removing the number
            // and then replacing the number in the original string
            const doubleStr = doublePrice.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            });
            return product.priceString.replace(/[0-9]+([.,][0-9]+)?/, doubleStr);
        } catch (e) {
            return '';
        }
    };

    const cleanTitle = (title) => {
        if (!title) return '';
        // Remove common Google Play suffix patterns like "(App Name)" or "(Unreviewed)"
        return title.replace(/\s*\(.*\)$/, '').trim();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Top glow */}
            <View style={styles.topGlow} />
            {/* Bottom glow */}
            <View style={styles.bottomGlow} />


            {/* Hero Image in Background */}
            <View style={styles.heroSection}>
                <Image
                    source={require('../assets/premium-girl.png')}
                    style={styles.heroImage}
                    resizeMode="cover"
                />

                {/* Gradient Blending Overlay */}
                <View style={StyleSheet.absoluteFill}>
                    <Svg height={HERO_IMAGE_HEIGHT} width={width}>
                        <Defs>
                            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="black" stopOpacity="1" />
                                <Stop offset="0.2" stopColor="black" stopOpacity="0" />
                                <Stop offset="0.8" stopColor="black" stopOpacity="0" />
                                <Stop offset="1" stopColor="black" stopOpacity="1" />
                            </LinearGradient>
                        </Defs>
                        <Rect x="0" y="0" width={width} height={HERO_IMAGE_HEIGHT} fill="url(#grad)" />
                    </Svg>
                </View>
            </View>

            {/* Floating Close Button */}
            <TouchableOpacity
                style={[styles.closeBtnOverlay, { top: insets.top + 12 }]}
                onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}>
                <CloseIcon />
            </TouchableOpacity>

            <View style={styles.mainContent}>
                {/* Grouped Content Area */}
                <View style={styles.groupedContent}>
                    <View style={styles.textGroup}>
                        <Text style={styles.heroTitle}>Gold Membership</Text>
                        <Text style={styles.heroSub}>
                            Unlock the ultimate listening experience.
                        </Text>
                    </View>

                    {/* Benefits */}
                    <View style={styles.benefitsList}>
                        {BENEFITS.map((b, i) => (
                            <View key={i} style={styles.benefitRow}>
                                <View style={styles.benefitIconCircle}>
                                    <CheckCircle />
                                </View>
                                <Text style={styles.benefitText}>{b}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Plans / Active Subscription */}
                    <View style={styles.plansSection}>
                        {isPremium ? (
                            <View style={styles.activeSubCard}>
                                <View style={styles.activeSubHeader}>
                                    <View style={styles.activeIconBadge}>
                                        <StarIcon size={24} color="#fff" />
                                    </View>
                                    <View>
                                        <Text style={styles.activeSubLabel}>ACTIVE PLAN</Text>
                                        <Text style={styles.activeSubTitle}>Gold Membership</Text>
                                    </View>
                                </View>
                                <View style={styles.activeSubDivider} />
                                <View style={styles.activeSubRow}>
                                    <Text style={styles.activeSubKey}>Expires on:</Text>
                                    <Text style={styles.activeSubValue}>
                                        {getExpiryDate() || 'Never'}
                                    </Text>
                                </View>
                                <View style={styles.activeSubRow}>
                                    <Text style={styles.activeSubKey}>Status:</Text>
                                    <Text style={[styles.activeSubValue, { color: '#4CAF50' }]}>Active</Text>
                                </View>
                            </View>
                        ) : (
                            <>
                                {loadingOfferings && (
                                    <View style={{ gap: 18 }}>
                                        <PlanSkeleton />
                                        <PlanSkeleton />
                                    </View>
                                )}
                                {!loadingOfferings && offerings && offerings.map((pkg) => (
                                    <TouchableOpacity
                                        key={pkg.identifier}
                                        style={[
                                            styles.planCard,
                                            selected === pkg.identifier && styles.planCardSelected,
                                        ]}
                                        activeOpacity={0.85}
                                        onPress={() => setSelected(pkg.identifier)}>
                                        {pkg.packageType === 'MONTHLY' && (
                                            <View style={styles.bestBadge}>
                                                <Text style={styles.bestBadgeText}>BEST VALUE</Text>
                                            </View>
                                        )}
                                        <View style={styles.planRow}>
                                            <View flex={1}>
                                                <Text style={styles.planName}>{cleanTitle(pkg.product.title)}</Text>
                                                <Text style={styles.planDetail}>{pkg.product.description}</Text>
                                            </View>
                                            <View style={styles.planPriceCol}>
                                                <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
                                                <Text style={styles.planOldPrice}>{formatDummyPrice(pkg.product)}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                                {!loadingOfferings && !offerings && (
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                                        No subscription plans available at the moment.
                                    </Text>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 6 }]}>
                {isPremium ? (
                    <View style={styles.premiumManageBox}>
                        <Text style={styles.manageText}>
                            You're currently a Gold Member. You can manage or cancel your subscription through your App Store or Play Store settings.
                        </Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.ctaButton, (!selected || isPurchasing || loadingOfferings) && { opacity: 0.5 }]}
                        activeOpacity={0.85}
                        onPress={handlePurchase}
                        disabled={!selected || isPurchasing || loadingOfferings}
                    >
                        {isPurchasing ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.ctaText}>
                                Subscribe now
                            </Text>
                        )}
                    </TouchableOpacity>
                )}
                <Text style={styles.disclaimer}>
                    {isPremium ? (
                        'Thank you for being a premium member!'
                    ) : (
                        <>
                            Cancel anytime. By continuing, you agree to our{' '}
                            <Text
                                style={{ textDecorationLine: 'underline' }}
                                onPress={() => Linking.openURL('https://ayushk9799.github.io/CitorePolicy/terms-of-service.html')}
                            >
                                Terms of Service
                            </Text>
                            .
                        </>
                    )}
                </Text>
                <View style={styles.linksRow}>
                    <TouchableOpacity onPress={restorePurchases} disabled={isPurchasing || loadingOfferings}>
                        <Text style={styles.linkText}>RESTORE PURCHASE</Text>
                    </TouchableOpacity>
                    <Text style={styles.linkDivider}>|</Text>
                    <TouchableOpacity onPress={() => Linking.openURL('https://ayushk9799.github.io/CitorePolicy/terms-of-service.html')}>
                        <Text style={styles.linkText}>TERMS</Text>
                    </TouchableOpacity>
                    <Text style={styles.linkDivider}>|</Text>
                    <TouchableOpacity onPress={() => Linking.openURL('https://ayushk9799.github.io/CitorePolicy/privacy-policy.html')}>
                        <Text style={styles.linkText}>PRIVACY</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Custom Toast Notification */}
            {toast.visible && (
                <Animated.View style={[
                    styles.toastContainer,
                    {
                        opacity: toastAnim,
                        transform: [{
                            translateY: toastAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [100, 0]
                            })
                        }],
                        bottom: insets.bottom + 20
                    }
                ]}>
                    <View style={styles.toastContent}>
                        {toast.type === 'success' ? <CheckCircle /> : <ErrorIcon />}
                        <Text style={styles.toastText}>{toast.message}</Text>
                    </View>
                </Animated.View>
            )}
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
        height: '50%',
        backgroundColor: 'rgba(244,37,123,0.06)',
        borderBottomLeftRadius: 999,
        borderBottomRightRadius: 999,
    },
    bottomGlow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 256,
        backgroundColor: 'rgba(244,37,123,0.04)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingHorizontal: 24,
        paddingBottom: 8,
        zIndex: 10,
    },
    closeBtnOverlay: {
        position: 'absolute',
        left: 24,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
    },
    mainContent: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    // Hero
    heroSection: {
        position: 'absolute',
        top: 0,
        width: width,
        height: HERO_IMAGE_HEIGHT,
        zIndex: 0,
    },
    heroImage: {
        width: width,
        height: HERO_IMAGE_HEIGHT,
    },
    groupedContent: {
        paddingBottom: 20,
        backgroundColor: 'transparent',
    },
    textGroup: {
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 24,
    },
    heroTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
        marginBottom: 4,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    heroSub: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    // Benefits
    benefitsList: {
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 24,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    benefitIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(244,37,123,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    benefitText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#fff',
    },
    // Plans
    plansSection: {
        paddingHorizontal: 24,
        gap: 18,
        marginBottom: 12,
    },
    planCard: {
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'visible',
    },
    planCardSelected: {
        borderColor: PRIMARY,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    bestBadge: {
        position: 'absolute',
        top: -10,
        right: 16,
        backgroundColor: PRIMARY,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    bestBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.8,
    },
    planRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    planName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    planDetail: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
    },
    planPriceCol: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    planOldPrice: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        textDecorationLine: 'line-through',
        marginTop: 2,
    },
    planPrice: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    planSave: {
        fontSize: 10,
        fontWeight: '700',
        color: PRIMARY,
        marginTop: 2,
    },
    // Footer
    footer: {
        paddingHorizontal: 24,
        paddingTop: 0,
        zIndex: 10,
    },
    ctaButton: {
        backgroundColor: PRIMARY,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 12,
        elevation: 6,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    ctaText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    disclaimer: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.35)',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 18,
    },
    linksRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    linkText: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.45)',
        letterSpacing: 1.5,
    },
    linkDivider: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.15)',
    },
    // Active Subscription Details
    activeSubCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(244,37,123,0.3)',
        marginTop: 10,
    },
    activeSubHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    activeIconBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeSubLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: PRIMARY,
        letterSpacing: 1.5,
    },
    activeSubTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        marginTop: 2,
    },
    activeSubDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 20,
    },
    activeSubRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    activeSubKey: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
    },
    activeSubValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    premiumManageBox: {
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    manageText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        lineHeight: 20,
    },
    // Skeleton Styles
    skeletonCard: {
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    skeletonTitle: {
        width: '60%',
        height: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        marginBottom: 8,
    },
    skeletonDetail: {
        width: '80%',
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 4,
    },
    skeletonPrice: {
        width: 60,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
    },
    // Toast Styles
    toastContainer: {
        position: 'absolute',
        left: 20,
        right: 20,
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 999,
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toastText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
});

export default PremiumScreen;
