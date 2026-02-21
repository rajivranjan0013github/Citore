import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_BASE } from '../../utils/api';

// Fetch full user profile from server
export const getUser = createAsyncThunk(
    'user/getUser',
    async (userId, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/api/users/${userId}`);
            const data = await res.json();

            if (!res.ok || data?.error) {
                return rejectWithValue(data?.error || 'User not found');
            }
            return data;
        } catch (err) {
            return rejectWithValue(err?.message || 'Network error');
        }
    }
);

// Update user data on server
export const updateUser = createAsyncThunk(
    'user/updateUser',
    async ({ userId, userData }, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/api/users/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: userData }),
            });
            const data = await res.json();

            if (!res.ok || data?.error) {
                return rejectWithValue(data?.error || 'Failed to update user');
            }
            return data;
        } catch (err) {
            return rejectWithValue(err?.message || 'Network error');
        }
    }
);

// Delete user account from server
export const deleteUser = createAsyncThunk(
    'user/deleteUser',
    async (userId, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/api/users/${userId}`, {
                method: 'DELETE',
            });
            const data = await res.json();

            if (!res.ok || data?.error) {
                return rejectWithValue(data?.error || 'Failed to delete user');
            }
            return data;
        } catch (err) {
            return rejectWithValue(err?.message || 'Network error');
        }
    }
);

const initialState = {
    userData: null,
    customerInfo: null,
    isPremium: false,
    status: 'idle',
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUserData(state, action) {
            state.userData = action.payload;
        },
        setCustomerInfo(state, action) {
            state.customerInfo = action.payload;
            // Also update isPremium based on entitlements
            const activeEntitlements = action.payload?.entitlements?.active || {};
            state.isPremium = Object.keys(activeEntitlements).length > 0;
        },
        clearUserData(state) {
            state.userData = null;
            state.customerInfo = null;
            state.isPremium = false;
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(getUser.fulfilled, (state, action) => {
                state.status = 'idle';
                // Only update if we haven't logged out in the meantime
                if (state.userData) {
                    state.userData = action.payload || null;
                }
            })
            .addCase(getUser.rejected, (state, action) => {
                state.status = 'idle';
                state.error = action.payload;
            })
            .addCase(updateUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.status = 'idle';
                // Only update if we haven't logged out in the meantime
                if (state.userData) {
                    state.userData = action.payload || null;
                }
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.status = 'idle';
                state.error = action.payload;
            })
            .addCase(deleteUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(deleteUser.fulfilled, (state) => {
                state.status = 'idle';
                state.userData = null;
                state.customerInfo = null;
                state.isPremium = false;
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.status = 'idle';
                state.error = action.payload;
            });
    },
});

export const { setUserData, clearUserData, setCustomerInfo } = userSlice.actions;
export default userSlice.reducer;
