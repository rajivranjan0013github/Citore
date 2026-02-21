import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    currentTrack: null,
    isPlayerReady: false,
};

const playerSlice = createSlice({
    name: 'player',
    initialState,
    reducers: {
        setCurrentTrack(state, action) {
            state.currentTrack = action.payload;
        },
        setPlayerReady(state, action) {
            state.isPlayerReady = action.payload;
        },
    },
});

export const { setCurrentTrack, setPlayerReady } = playerSlice.actions;
export default playerSlice.reducer;

