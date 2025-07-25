// StreamContext.js
import React, {
    createContext,
    useContext,
    useState,
    useRef,
    useEffect,
  } from 'react';
  import {
    useAudioPlayer,
    useAudioPlayerStatus,
  } from 'expo-audio';
  import { AppState } from 'react-native';
  
  /* ──────────────── context & hook ──────────────── */
  const StreamContext = createContext(null);
  export const useStream = () => useContext(StreamContext);
  
  /* ──────────────── provider ──────────────── */
  export function StreamProvider({ children }) {
    
    /* state */
    const [streamData, setStreamData]   = useState(null);
    const [recentTracks, setRecent]     = useState(null);
    const [onDemandShows, setOnDemandShows] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [loadingOnDemand, setLoadingOnDemand] = useState(true);
    const [error, setError]             = useState(null);
    const [currentShow, setCurrentShow] = useState(null);
    const [playbackPosition, setPlaybackPosition] = useState(0);
    const [playbackDuration, setPlaybackDuration] = useState(0);

    /* Audio players using expo-audio hooks */
    const liveStreamPlayer = useAudioPlayer('https://stream.casthost.net/listen/joel_jones/radio.mp3');
    const onDemandPlayer = useAudioPlayer();

    /* Audio player status */
    const liveStreamStatus = useAudioPlayerStatus(liveStreamPlayer);
    const onDemandStatus = useAudioPlayerStatus(onDemandPlayer);

    /* Derived state from audio status with safety checks */
    const isPlaying = liveStreamStatus?.playing || false;
    const isPlayingOnDemand = onDemandStatus?.playing || false;

    /* refs */
    const reconnectAttempts = useRef(0);
    const MAX_RECONNECTS    = 5;
  
    /* ─────────────── data fetch helpers ─────────────── */
    const fetchStreamData = async () => {
      try {
        const r = await fetch(
          'https://stream.casthost.net/api/nowplaying/4'
        );
        const j = await r.json();
        
        // Map AzuraCast API response to our data structure
        if (j?.now_playing?.song) {
          const { song: nowPlaying, played_at } = j.now_playing;

          /* 1️⃣ Primary art field */
          let artUrl = nowPlaying.art ?? null;

          /* 2️⃣ Fallback: first item in song_history */
          if (!artUrl && Array.isArray(j.song_history) && j.song_history.length) {
            artUrl = j.song_history[0]?.song?.art ?? null;
          }

          /* 3️⃣ Fallback: station-level generic artwork */
          if (!artUrl && j.station?.shortcode) {
            artUrl = `https://stream.casthost.net/api/station/${j.station.shortcode}/art`;
          }

          /* 4️⃣ Final fallback: default SOZO logo */
          if (!artUrl) {
            artUrl = 'https://static.wixstatic.com/media/sozo-logo.png'; // or use local asset
          }

          /* Final: encode URI if present */
          const safeArtUrl = artUrl ? encodeURI(artUrl) : null;

          const mappedData = {
            track: {
              title:   nowPlaying.title   ?? 'Unknown Title',
              artist:  nowPlaying.artist  ?? 'Unknown Artist',
              album:   nowPlaying.album   ?? '',
              imageurl: safeArtUrl,
              genre:   nowPlaying.genre   ?? '',
              text:    nowPlaying.text    ?? `${nowPlaying.artist} - ${nowPlaying.title}`,
              played_at,
            },
            station:    j.station,
            listeners:  j.listeners,
            elapsed:    j.now_playing.elapsed   ?? 0,
            remaining:  j.now_playing.remaining ?? 0,
            duration:   j.now_playing.duration  ?? 0,
          };

          // Only update if the data has actually changed
          setStreamData(prevData => {
            if (!prevData || 
                prevData.track.title !== mappedData.track.title ||
                prevData.track.artist !== mappedData.track.artist ||
                prevData.track.played_at !== mappedData.track.played_at) {
              return mappedData;
            }
            return prevData;
          });
        }

        setError(null);
      } catch (e) {
        setError(e.message);
      }
    };
  
    const fetchRecentTracks = async () => {
      try {
        const r = await fetch(
          'https://stream.casthost.net/api/nowplaying/4'
        );
        const j = await r.json();
        
        // Map song_history to recent tracks format
        if (j.song_history) {
          const mappedTracks = j.song_history.map(item => ({
            title: item.song.text || `${item.song.artist} - ${item.song.title}`,
            songTitle: item.song.title || 'Unknown Title',
            artist: item.song.artist || 'Unknown Artist',
            album: item.song.album || '',
            enclosure: { url: item.song.art || null },
            played_at: item.played_at,
            duration: item.duration,
            playlist: item.playlist || ''
          }));
          
          // Only update if the data has actually changed
          setRecent(prevTracks => {
            if (!prevTracks || 
                prevTracks.length !== mappedTracks.length ||
                prevTracks[0]?.played_at !== mappedTracks[0]?.played_at) {
              return mappedTracks;
            }
            return prevTracks;
          });
        }
        setError(null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
  
    const fetchOnDemandShows = async () => {
        try {
            setLoadingOnDemand(true);
            const response = await fetch('https://stream.casthost.net/api/station/4/ondemand');
            
            if (!response.ok) {
                throw new Error('Failed to fetch on-demand shows');
            }
            
            const data = await response.json();
            
            // Map the API response to our format
            const mappedShows = data.map(item => ({
                id: item.track_id,
                title: item.media.title || 'Unknown Title',
                artist: item.media.artist || 'Unknown Artist',
                album: item.media.album || '',
                image: item.media.art || null,
                text: item.media.text || `${item.media.artist} - ${item.media.title}`,
                genre: item.media.genre || '',
                lyrics: item.media.lyrics || '', // Add lyrics field
                downloadUrl: `https://stream.casthost.net${item.download_url}`,
                track_id: item.track_id,
            }));
            
            setOnDemandShows(mappedShows);
            setError(null);
        } catch (e) {
            console.error('Error fetching on-demand shows:', e);
            setError(e.message);
            // Fallback to empty array on error
            setOnDemandShows([]);
        } finally {
            setLoadingOnDemand(false);
        }
    };
  
    /* ─────────────── polling ─────────────── */
    useEffect(() => {
      let intervalId;
      
      const pull = async () => {
        try {
          // Only fetch stream data and recent tracks frequently
          await Promise.all([
            fetchStreamData(), 
            fetchRecentTracks()
          ]);
        } catch (error) {
          console.error('Polling error:', error);
        }
      };
      
      const pullOnDemand = async () => {
        try {
          // Fetch on-demand shows less frequently
          await fetchOnDemandShows();
        } catch (error) {
          console.error('On-demand polling error:', error);
        }
      };
      
      // Initial load
      pull();
      pullOnDemand();
      
      // Set up intervals
      intervalId = setInterval(pull, 5000); // 5 seconds for stream data
      const onDemandIntervalId = setInterval(pullOnDemand, 300000); // 5 minutes for on-demand shows
      
      return () => {
        clearInterval(intervalId);
        clearInterval(onDemandIntervalId);
      };
    }, []);

    /* ─────────────── position tracking ─────────────── */
    useEffect(() => {
      if (isPlayingOnDemand && onDemandStatus) {
        setPlaybackPosition(onDemandStatus.currentTime || 0);
        setPlaybackDuration(onDemandStatus.duration || 0);
      }
    }, [isPlayingOnDemand, onDemandStatus?.currentTime, onDemandStatus?.duration]);

    /* ─────────────── on-demand track end handler ─────────────── */
    useEffect(() => {
      if (onDemandStatus?.didJustFinish) {
        setCurrentShow(null);
        setPlaybackPosition(0);
        setPlaybackDuration(0);
      }
    }, [onDemandStatus?.didJustFinish]);
  
    /* ─────────────── error handling ─────────────── */
    useEffect(() => {
      if (liveStreamStatus?.error) {
        console.error('Live stream error:', liveStreamStatus.error);
        setError(liveStreamStatus.error.message || 'Live stream error');
        handleStreamError();
      }
    }, [liveStreamStatus?.error]);

    useEffect(() => {
      if (onDemandStatus?.error) {
        console.error('On-demand stream error:', onDemandStatus.error);
        setError(onDemandStatus.error.message || 'On-demand stream error');
      }
    }, [onDemandStatus?.error]);

    /* ─────────────── AppState resume handler ─────────────── */
    useEffect(() => {
      const sub = AppState.addEventListener('change', async state => {
        if (state === 'active' && isPlaying) {
          try {
            // Resume playback if it was interrupted
            if (!liveStreamStatus?.isPlaying) {
              liveStreamPlayer.play();
            }
          } catch (e) {
            console.error('Resume error:', e);
          }
        }
      });
      return () => sub.remove();
    }, [isPlaying, liveStreamPlayer, liveStreamStatus?.isPlaying]);
  
    /* ─────────────── core audio helpers ─────────────── */
    function handleStreamError() {
      reconnectStream();
    }
  
    async function reconnectStream() {
      if (reconnectAttempts.current >= MAX_RECONNECTS) {
        reconnectAttempts.current = 0;
        return;
      }
      reconnectAttempts.current += 1;
      try {
        // With expo-audio, we just need to create a new player if there's an error
        // The player will automatically retry, so we just reset our error state
        setError(null);
        reconnectAttempts.current = 0;
      } catch {
        const delay = Math.min(
          1000 * 2 ** reconnectAttempts.current,
          30_000
        );
        setTimeout(reconnectStream, delay);
      }
    }
  
  /* toggle play / stop for live stream */
  async function togglePlayPause() {
    try {
      console.log('togglePlayPause called, current isPlaying:', isPlaying, 'isPlayingOnDemand:', isPlayingOnDemand);
      
      // Stop on-demand if playing
      if (isPlayingOnDemand) {
        console.log('Stopping on-demand playbook');
        onDemandPlayer.pause();
        setCurrentShow(null);
      }

      // Toggle live stream
      if (isPlaying) {
        console.log('STOPPING live stream - pausing playback');
        // For live streams, pause effectively stops and disconnects
        liveStreamPlayer.pause();
      } else {
        console.log('STARTING live stream - forcing fresh connection to live position');
        // For live streams, we need to force a fresh connection to get current live position
        // Use replace() method to force a completely fresh connection
        liveStreamPlayer.replace('https://stream.casthost.net/listen/joel_jones/radio.mp3');
        liveStreamPlayer.play();
      }
      
      console.log('togglePlayPause completed successfully');
    } catch (e) {
      console.error('Toggle error:', e);
      setError(e.message);
    }
  }    /* play on-demand show */
    async function playOnDemandShow(show) {
        try {
            console.log('Playing on-demand show:', show.title, 'URL:', show.downloadUrl);
            
            // Stop live stream if playing
            if (isPlaying) {
                console.log('Stopping live stream for on-demand playback');
                liveStreamPlayer.pause();
            }

            // For expo-audio, we need to use replace() to set a new source
            console.log('Setting on-demand source and playing...');
            onDemandPlayer.replace(show.downloadUrl);
            await onDemandPlayer.play();
            
            setCurrentShow(show);
            console.log('On-demand show started successfully');
        } catch (e) {
            console.error('On-demand play error:', e);
            setError(e.message);
        }
    }

    /* seek to position in on-demand track */
    async function seekToPosition(positionMillis) {
        try {
            if (currentShow && onDemandPlayer) {
                onDemandPlayer.seekTo(positionMillis); // expo-audio uses milliseconds
            }
        } catch (e) {
            console.error('Seek error:', e);
            setError(e.message);
        }
    }
  
    /* toggle on-demand show play/pause */
    async function toggleOnDemandPlayPause() {
        try {
            if (!currentShow) {
                console.log('No current show to toggle');
                return;
            }
            
            console.log('Toggling on-demand playback, currently playing on-demand:', isPlayingOnDemand);
            
            // Stop live stream if playing before resuming on-demand
            if (isPlaying) {
                console.log('Stopping live stream for on-demand toggle');
                liveStreamPlayer.pause();
            }

            // Toggle on-demand playback
            if (isPlayingOnDemand) {
                console.log('Pausing on-demand playback');
                onDemandPlayer.pause();
            } else {
                console.log('Resuming on-demand playback');
                await onDemandPlayer.play();
            }
            
            console.log('On-demand toggle completed successfully');
        } catch (e) {
            console.error('On-demand toggle error:', e);
            setError(e.message);
        }
    }
  
    /* context payload */
    const ctx = {
        streamData,
        recentTracks,
        onDemandShows,
        loading,
        loadingOnDemand,
        error,
        isPlaying,
        togglePlayPause,
        currentShow,
        isPlayingOnDemand,
        playOnDemandShow,
        toggleOnDemandPlayPause,
        playbackPosition,
        playbackDuration,
        seekToPosition,
        refetch: () => Promise.all([
            fetchStreamData(), 
            fetchRecentTracks(), 
            fetchOnDemandShows()
        ]),
    };
  
    return (
      <StreamContext.Provider value={ctx}>{children}</StreamContext.Provider>
    );
  }
  
  export default StreamContext;
