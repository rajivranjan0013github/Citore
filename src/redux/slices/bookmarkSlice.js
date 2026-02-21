import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_BASE } from '../../utils/api';

// Fetch all bookmarks for a user
export const fetchBookmarks = createAsyncThunk(
    'bookmarks/fetchBookmarks',
    async (userId, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/api/bookmarks/${userId}`);
            const data = await res.json();
            if (!res.ok || !data?.success) {
                return rejectWithValue(data?.error || 'Failed to fetch bookmarks');
            }
            return data.data;
        } catch (err) {
            return rejectWithValue(err?.message || 'Network error');
        }
    }
);

// Toggle bookmark (add/remove)
export const toggleBookmark = createAsyncThunk(
    'bookmarks/toggleBookmark',
    async ({ userId, playlistId }, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/api/bookmarks/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, playlistId }),
            });
            const data = await res.json();
            if (!res.ok || !data?.success) {
                return rejectWithValue(data?.error || 'Failed to toggle bookmark');
            }
            return { playlistId, bookmarked: data.bookmarked };
        } catch (err) {
            return rejectWithValue(err?.message || 'Network error');
        }
    }
);

// Check if a playlist is bookmarked
export const checkBookmark = createAsyncThunk(
    'bookmarks/checkBookmark',
    async ({ userId, playlistId }, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/api/bookmarks/${userId}/${playlistId}`);
            const data = await res.json();
            if (!res.ok || !data?.success) {
                return rejectWithValue(data?.error || 'Failed to check bookmark');
            }
            return { playlistId, bookmarked: data.bookmarked };
        } catch (err) {
            return rejectWithValue(err?.message || 'Network error');
        }
    }
);

const bookmarkSlice = createSlice({
    name: 'bookmarks',
    initialState: {
        bookmarks: [],       // array of bookmark docs with populated playlistId
        checkedMap: {},      // { playlistId: true/false } for quick lookup
        status: 'idle',
        error: null,
    },
    reducers: {
        clearBookmarks: (state) => {
            state.bookmarks = [];
            state.checkedMap = {};
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchBookmarks
            .addCase(fetchBookmarks.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchBookmarks.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.bookmarks = action.payload || [];
                // Build checked map
                state.checkedMap = {};
                (action.payload || []).forEach(b => {
                    const pid = b.playlistId?._id || b.playlistId;
                    state.checkedMap[pid] = true;
                });
            })
            .addCase(fetchBookmarks.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // toggleBookmark
            .addCase(toggleBookmark.fulfilled, (state, action) => {
                const { playlistId, bookmarked } = action.payload;
                state.checkedMap[playlistId] = bookmarked;
                if (!bookmarked) {
                    state.bookmarks = state.bookmarks.filter(
                        b => (b.playlistId?._id || b.playlistId) !== playlistId
                    );
                }
            })
            // checkBookmark
            .addCase(checkBookmark.fulfilled, (state, action) => {
                const { playlistId, bookmarked } = action.payload;
                state.checkedMap[playlistId] = bookmarked;
            });
    },
});

export const { clearBookmarks } = bookmarkSlice.actions;
export const selectBookmarks = (state) => state.bookmarks.bookmarks;
export const selectIsBookmarked = (playlistId) => (state) => !!state.bookmarks.checkedMap[playlistId];
export default bookmarkSlice.reducer;
