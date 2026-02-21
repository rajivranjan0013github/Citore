// Auth Storage - Persistent authentication state using AsyncStorage
import { storage } from './storage';

// Re-export the shared storage instance
export { storage };

// Storage keys
const KEYS = {
    USER: 'auth_user',
    IS_AUTHENTICATED: 'auth_is_authenticated',
};

/**
 * Get current user from storage
 */
export const getUser = async () => {
    try {
        const userStr = await storage.getString(KEYS.USER);
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error getting user from storage:', error);
        return null;
    }
};

/**
 * Save user to storage and mark as authenticated
 */
export const saveUser = async (user) => {
    try {
        await storage.set(KEYS.USER, JSON.stringify(user));
        await storage.set(KEYS.IS_AUTHENTICATED, 'true');
    } catch (error) {
        console.error('Error saving user to storage:', error);
    }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
    try {
        return (await storage.getBoolean(KEYS.IS_AUTHENTICATED)) === true;
    } catch (error) {
        return false;
    }
};

/**
 * Update user data in storage
 */
export const updateUser = async (updates) => {
    try {
        const currentUser = await getUser();
        if (currentUser) {
            const updatedUser = { ...currentUser, ...updates };
            await storage.set(KEYS.USER, JSON.stringify(updatedUser));
            return updatedUser;
        }
        return null;
    } catch (error) {
        console.error('Error updating user:', error);
        return null;
    }
};

/**
 * Clear all auth data (logout)
 */
export const clearAuth = async () => {
    try {
        await storage.delete(KEYS.USER);
        await storage.delete(KEYS.IS_AUTHENTICATED);
    } catch (error) {
        console.error('Error clearing auth:', error);
    }
};

export default {
    storage,
    getUser,
    saveUser,
    isAuthenticated,
    updateUser,
    clearAuth,
};
