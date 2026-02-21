import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_BASE } from '../../utils/api';

// Fetch all playlists from the server
export const fetchPlaylists = createAsyncThunk(
    'playlist/fetchPlaylists',
    async (_, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/api/playlist`);
            const data = await res.json();

            if (!res.ok || !data?.success) {
                return rejectWithValue(data?.error || 'Failed to fetch playlists');
            }
            return data.data; // The array of playlists from backend response API format
        } catch (err) {
            return rejectWithValue(err?.message || 'Network error');
        }
    }
);

const initialState = {
    playlists: [],
    status: 'idle',
    error: null,
};

const playlistSlice = createSlice({
    name: 'playlist',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPlaylists.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchPlaylists.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.playlists = action.payload;
            })
            .addCase(fetchPlaylists.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export default playlistSlice.reducer;
