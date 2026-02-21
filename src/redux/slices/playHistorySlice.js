import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_BASE } from '../../utils/api';

// Fetch all play history for a user
export const fetchPlayHistory = createAsyncThunk(
    'playHistory/fetchPlayHistory',
    async (userId, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/api/play-history/${userId}`);
            const data = await res.json();
            if (!res.ok || !data?.success) {
                return rejectWithValue(data?.error || 'Failed to fetch play history');
            }
            return data.data;
        } catch (err) {
            return rejectWithValue(err?.message || 'Network error');
        }
    }
);

// Fetch history for a specific playlist
export const fetchPlaylistHistory = createAsyncThunk(
    'playHistory/fetchPlaylistHistory',
    async ({ userId, playlistId }, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/api/play-history/${userId}/${playlistId}`);
            const data = await res.json();
            if (!res.ok || !data?.success) {
                return rejectWithValue(data?.error || 'Failed to fetch playlist history');
            }
            return data.data;
        } catch (err) {
            return rejectWithValue(err?.message || 'Network error');
        }
    }
);

// Sync play history to backend (called on pause, track change, app background)
export const syncPlayHistory = createAsyncThunk(
    'playHistory/syncPlayHistory',
    async (historyData, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/api/play-history/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(historyData),
            });
            const data = await res.json();
            if (!res.ok || !data?.success) {
                return rejectWithValue(data?.error || 'Failed to sync play history');
            }
            return data.data;
        } catch (err) {
            return rejectWithValue(err?.message || 'Network error');
        }
    }
);

const initialState = {
    history: [],          // all user play history records
    currentHistory: null, // history for the currently viewed playlist
    status: 'idle',
    error: null,
};

const playHistorySlice = createSlice({
    name: 'playHistory',
    initialState,
    reducers: {
        clearPlayHistory(state) {
            state.history = [];
            state.currentHistory = null;
            state.status = 'idle';
            state.error = null;
        },
        // Update local state without API call (for MMKV-backed local saves)
        updateLocalHistory(state, action) {
            state.currentHistory = {
                ...state.currentHistory,
                ...action.payload,
            };
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchPlayHistory
            .addCase(fetchPlayHistory.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchPlayHistory.fulfilled, (state, action) => {
                state.status = 'idle';
                state.history = action.payload || [];
            })
            .addCase(fetchPlayHistory.rejected, (state, action) => {
                state.status = 'idle';
                state.error = action.payload;
            })
            // fetchPlaylistHistory
            .addCase(fetchPlaylistHistory.fulfilled, (state, action) => {
                state.currentHistory = action.payload || null;
            })
            // syncPlayHistory
            .addCase(syncPlayHistory.fulfilled, (state, action) => {
                state.currentHistory = action.payload || null;
                // Update in the history array, but preserve the populated playlistId
                if (action.payload) {
                    const syncedId = action.payload.playlistId?._id || action.payload.playlistId;
                    const idx = state.history.findIndex(
                        h => (h.playlistId?._id || h.playlistId) === syncedId
                    );
                    if (idx >= 0) {
                        // Merge updated fields but keep the populated playlistId object
                        const existing = state.history[idx];
                        state.history[idx] = {
                            ...action.payload,
                            playlistId: existing.playlistId, // preserve populated data
                        };
                    } else {
                        state.history.unshift(action.payload);
                    }
                }
            });
    },
});

// Selectors
export const selectContinueListening = (state) =>
    state.playHistory.history.filter(h => !h.isCompleted);

export const { clearPlayHistory, updateLocalHistory } = playHistorySlice.actions;
export default playHistorySlice.reducer;
