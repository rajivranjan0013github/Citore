import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
    getString: async (key) => {
        return await AsyncStorage.getItem(key);
    },
    set: async (key, value) => {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        await AsyncStorage.setItem(key, stringValue);
    },
    getBoolean: async (key) => {
        const val = await AsyncStorage.getItem(key);
        return val === 'true';
    },
    delete: async (key) => {
        await AsyncStorage.removeItem(key);
    },
    // Adding standard names as well
    getItem: async (key) => await AsyncStorage.getItem(key),
    setItem: async (key, value) => await AsyncStorage.setItem(key, value),
    removeItem: async (key) => await AsyncStorage.removeItem(key),
    clear: async () => await AsyncStorage.clear(),
};
