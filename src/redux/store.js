import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import playerReducer from './slices/playerSlice';
import playlistReducer from './slices/playlistSlice';
import playHistoryReducer from './slices/playHistorySlice';
import bookmarkReducer from './slices/bookmarkSlice';

export const store = configureStore({
    reducer: {
        user: userReducer,
        player: playerReducer,
        playlist: playlistReducer,
        playHistory: playHistoryReducer,
        bookmarks: bookmarkReducer,
    },
});
