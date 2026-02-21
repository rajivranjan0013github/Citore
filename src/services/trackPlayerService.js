import TrackPlayer from 'react-native-track-player';

/**
 * Background playback service for react-native-track-player.
 * Handles remote control events (lock screen, notification shade).
 */
export async function PlaybackService() {
    TrackPlayer.addEventListener('remote-play', () => TrackPlayer.play());
    TrackPlayer.addEventListener('remote-pause', () => TrackPlayer.pause());
    TrackPlayer.addEventListener('remote-stop', () => TrackPlayer.reset());
    TrackPlayer.addEventListener('remote-next', () => TrackPlayer.skipToNext());
    TrackPlayer.addEventListener('remote-previous', () => TrackPlayer.skipToPrevious());
    TrackPlayer.addEventListener('remote-seek', (event) => TrackPlayer.seekTo(event.position));
    TrackPlayer.addEventListener('remote-jump-forward', async (event) => {
        const position = (await TrackPlayer.getProgress()).position;
        await TrackPlayer.seekTo(position + event.interval);
    });
    TrackPlayer.addEventListener('remote-jump-backward', async (event) => {
        const position = (await TrackPlayer.getProgress()).position;
        await TrackPlayer.seekTo(Math.max(0, position - event.interval));
    });
}
