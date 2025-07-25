import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ScrollView, StatusBar, TouchableOpacity, View, StyleSheet, Text, Dimensions } from "react-native";
import { Image } from 'expo-image';
import { Colors, Fonts, Sizes } from "../../constants/styles";
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { MaterialIcons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import { useNavigation, useLocalSearchParams } from "expo-router";
import { useStream } from '../context/StreamContext';

const { width } = Dimensions.get('window');

const MOCK_RECENT_TRACKS = [
    {
        title: "Title 1",
        enclosure: { url: "https://example.com/oceans.jpg" },
        artist: "Artist 1",
        songTitle: "Title 1"
    },
    {
        title: "Title 2",
        enclosure: { url: "https://example.com/how-great.jpg" },
        artist: "Artist 2",
        songTitle: "Title 2"
    },
    {
        title: "Title 3",
        enclosure: { url: "https://example.com/graves.jpg" },
        artist: "Artist 3",
        songTitle: "Title 3"
    },
    {
        title: "Title 4",
        enclosure: { url: "https://example.com/promises.jpg" },
        artist: "Artist 4",
        songTitle: "Title 4"
    }
];

const NowPlayingScreen = React.memo(() => {
    const navigation = useNavigation();
    const params = useLocalSearchParams();
    
    // Consolidate all useStream calls at the top level
    const { 
        streamData, 
        recentTracks,
        isPlaying, 
        togglePlayPause,
        currentShow,
        isPlayingOnDemand,
        playOnDemandShow,
        toggleOnDemandPlayPause,
        playbackPosition, 
        playbackDuration, 
        seekToPosition
    } = useStream();

    const [state, setState] = useState({
        songRunningInPercentage: 60,
        currentSongInFavorite: true,
        showData: null,
    })

    // Parse show data from params
    useEffect(() => {
        if (params.showData) {
            try {
                const parsedShowData = JSON.parse(params.showData);
                setState(prevState => ({
                    ...prevState,
                    showData: parsedShowData
                }));
            } catch (error) {
                console.error('Error parsing show data:', error);
            }
        }
    }, [params.showData]);

    const updateState = useCallback((data) => setState((state) => ({ ...state, ...data })), []);

    const {
        songRunningInPercentage,
        currentSongInFavorite,
        showData,
    } = state;

    return (
        <LinearGradient
            start={{ x: 1, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            colors={[
                '#5829af',
                '#5829af',
                'rgb(60, 65, 66)'
            ]}
            locations={[0, 0.08, 0.08]} // hard stop at 8%
            style={{ flex: 1 }}
        >
            <StatusBar translucent backgroundColor='transparent' barStyle={'light-content'} />
            <View style={{ flex: 1 }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: 100.0, paddingBottom: Sizes.fixPadding * 2.0 }}
                >
                    {header()}
                    {songInfo()}
                    {nextOnTheLists()}
                </ScrollView>
                {/* {cornerImage()} */}
            </View>
        </LinearGradient>
    )

    function nextOnTheLists() {
        return (
            <View>
                <Text style={{ marginTop: Sizes.fixPadding + 5.0, marginBottom: Sizes.fixPadding + 5.0, marginHorizontal: Sizes.fixPadding * 2.0, ...Fonts.blackColor15Bold, color: Colors.whiteColor }}>
                    
                </Text>
                <View style={{ marginHorizontal: Sizes.fixPadding * 2.0, padding: Sizes.fixPadding * 2.0, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: Sizes.fixPadding, minHeight: 100 }}>
                    <Text style={{ ...Fonts.grayColor12Medium, color: Colors.whiteColor }}>
                        {showData && showData.lyrics ? showData.lyrics : 'Start each morning with a short devotional and podcast episode, beautifully aligned with that day\'s Bible reading.'}
                    </Text>
                </View>
            </View>
        )
    }

    function songInfo() {
        return (
            <View>
                {playerCard()}
                {showData && progressBar()}
                {/* {songNameWithPoster()}
                {songTimeInfo()}
                {songProcessSlider()}
                {favoriteShuffleAndRepeatInfo()}
                {lyricsTextWithIcon()}
                {songPlayInfo()} */}
            </View>
        )
    }

    function progressBar() {
        // Always show progress bar for on-demand shows, even if duration is not available yet
        if (!showData) {
            return null;
        }

        const progressPercentage = playbackDuration > 0 ? (playbackPosition / playbackDuration) * 100 : 0;
        
        const formatTime = (milliseconds) => {
            if (!milliseconds || milliseconds === 0) return "0:00";
            const minutes = Math.floor(milliseconds / 60000);
            const seconds = Math.floor((milliseconds % 60000) / 1000);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        const handleSliderChange = async (value) => {
            if (playbackDuration > 0) {
                const newPosition = (value[0] / 100) * playbackDuration;
                await seekToPosition(newPosition);
            }
        };

        return (
            <View style={styles.progressBarContainer}>
                <View style={styles.timeInfoWrapStyle}>
                    <Text style={{ ...Fonts.whiteColor10Medium, color: Colors.whiteColor }}>
                        {formatTime(playbackPosition)}
                    </Text>
                    <Text style={{ ...Fonts.whiteColor10Medium, color: Colors.whiteColor }}>
                        {formatTime(playbackDuration)}
                    </Text>
                </View>
                <View style={styles.progressSliderWrapStyle}>
                    <Slider
                        value={[progressPercentage]}
                        onValueChange={handleSliderChange}
                        maximumValue={100}
                        minimumValue={0}
                        containerStyle={{ height: 30.0 }}
                        minimumTrackTintColor={'rgba(255, 124, 0, 1)'}
                        maximumTrackTintColor={'rgba(255, 255, 255, 0.3)'}
                        thumbTintColor={'rgba(255, 124, 0, 1)'}
                        trackStyle={{ height: 6.0, borderRadius: 3.0 }}
                        thumbStyle={{ 
                            height: 20, 
                            width: 20, 
                            backgroundColor: 'rgba(255, 124, 0, 1)',
                            borderRadius: 10,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 3,
                            elevation: 4,
                        }}
                        disabled={playbackDuration === 0}
                    />
                </View>
            </View>
        );
    }

    function lyricsTextWithIcon() {
        return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons
                    name="keyboard-arrow-up"
                    size={20}
                    color={Colors.blackColor}
                />
                <Text style={{ ...Fonts.grayColor10SemiBold }}>
                    LYRICS
                </Text>
            </View>
        )
    }

    function favoriteShuffleAndRepeatInfo() {
        return (
            <View style={styles.favoriteShuffleAndRepeatInfoWrapStyle}>
                <MaterialIcons
                    name="repeat"
                    size={20}
                    color="black"
                />
                <TouchableOpacity
                    activeOpacity={0.9}
                    style={{ width: 20, marginHorizontal: Sizes.fixPadding * 4.0, }}
                    onPress={() => {
                        updateState({ currentSongInFavorite: !currentSongInFavorite })
                    }}
                >
                    {
                        currentSongInFavorite
                            ?
                            <MaskedView
                                style={{ flex: 1, flexDirection: 'row', height: 18 }}
                                maskElement={
                                    <View
                                        style={{
                                            backgroundColor: 'transparent',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}>
                                        <MaterialIcons
                                            name="favorite"
                                            size={18}
                                            color="white"
                                        />
                                    </View>
                                }>
                                <LinearGradient
                                    colors={[Colors.secondaryColor, Colors.primaryColor]}
                                    style={{ flex: 1 }}
                                />
                            </MaskedView>
                            :
                            <MaterialIcons
                                name="favorite-border"
                                size={18}
                                color='rgba(255, 124, 0,1)'
                            />
                    }
                </TouchableOpacity>
                <MaterialIcons
                    name="shuffle"
                    size={20}
                    color="black"
                />
            </View>
        )
    }

    function songPlayInfo() {
        return (
            <View style={styles.songPlayInfoWrapStyle}>
                <MaterialIcons
                    name="replay-10"
                    size={25}
                    style={{ marginRight: Sizes.fixPadding * 2.0 }}
                    color="black"
                />
                <View style={styles.forwardBackwardButtonWrapStyle}>
                    <MaterialIcons
                        name="arrow-left"
                        size={30}
                        color="black"
                    />
                </View>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={togglePlayPause}
                >
                    <LinearGradient
                        start={{ x: 0, y: 0.1 }}
                        end={{ x: 0, y: 1 }}
                        colors={[
                            'rgba(255, 124, 0,1)',
                            'rgba(41, 10, 89, 0.9)',
                        ]}
                        style={styles.pausePlayButtonWrapStyle}
                    >
                        <MaterialIcons
                            name={isPlaying ? "stop" : 'play-arrow'}
                            color={Colors.whiteColor}
                            size={25}
                        />
                    </LinearGradient>
                </TouchableOpacity>
                <View style={styles.forwardBackwardButtonWrapStyle}>
                    <MaterialIcons
                        name="arrow-right"
                        size={30}
                        color="black"
                    />
                </View>
                <MaterialIcons
                    name="forward-10"
                    size={25}
                    color="black"
                    style={{ marginLeft: Sizes.fixPadding * 2.0 }}
                />
            </View>
        )
    }
    function playerCard() {
        // Use show data if available, otherwise use stream data
        const displayData = showData ? {
            imageurl: showData.image,
            title: showData.title,
            artist: showData.artist || 'SOZO Radio'
        } : streamData?.track;

        const cardSize = width - Sizes.fixPadding * 5; // full width minus horizontal margins
        
        // Determine if we're currently playing this specific show
        const isCurrentShowPlaying = showData && currentShow && currentShow.id === showData.id && isPlayingOnDemand;
        const shouldShowPlayingState = showData ? isCurrentShowPlaying : isPlaying;

        const handlePlayPause = async () => {
            if (showData) {
                // If we have show data, handle on-demand playback
                if (currentShow && currentShow.id === showData.id) {
                    // If this show is current, toggle its playback
                    await toggleOnDemandPlayPause();
                } else {
                    // If this is a different show or no show is playing, start this show
                    await playOnDemandShow(showData);
                }
            } else {
                // If no show data, handle live stream playback
                await togglePlayPause();
            }
        };
        
        return (
            <View style={styles.playerCardOuterContainer}>
                <View style={[styles.playerCardImageWrapper, {width: cardSize, height: cardSize * 0.8}]}>
                    <Image
                        key={displayData?.title || 'default'}
                        source={
                            displayData?.imageurl 
                                ? (typeof displayData.imageurl === 'string' ? { uri: displayData.imageurl } : displayData.imageurl)
                                : require('../../assets/images/sozo-logo.png')
                        }
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        priority="high"
                        recyclingKey={displayData?.title || 'default'}
                        transition={200}
                    />
                </View>

                <View style={styles.playerCardOverlay}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.playerCardTitle} numberOfLines={1}>
                                {displayData?.title || 'Loading…'}
                            </Text>
                            <Text style={styles.playerCardArtist} numberOfLines={1}>
                                {displayData?.artist || 'Loading…'}
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.playerCardPlayButton} 
                            activeOpacity={.8}
                            onPress={handlePlayPause}
                        >
                            <LinearGradient
                                colors={['#611ec9', '#ab5864']}
                                locations={[0, 0.97]}
                                style={styles.playerCardPlayGradient}
                            >
                                <View style={styles.playerCardPlayInnerCircle}>
                                    <MaterialIcons
                                        name={shouldShowPlayingState ? 'stop' : 'play-arrow'}
                                        size={45}
                                        color={'#000'}
                                    />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }      

    function songNameWithPoster() {
        return (
            <View style={{ alignItems: 'center' }}>
                <Image
                    source={
                        streamData?.track?.imageurl 
                            ? (typeof streamData.track.imageurl === 'string' ? { uri: streamData.track.imageurl } : streamData.track.imageurl)
                            : require('../../assets/images/sozo-logo.png')
                    }
                    style={{
                        marginVertical: Sizes.fixPadding,
                        width: 190.0,
                        height: 210.0,
                        borderRadius: Sizes.fixPadding - 5.0
                    }}
                />
                <Text style={{ ...Fonts.blackColor14Bold }}>
                    {streamData?.track?.title || 'Loading...'}
                </Text>
                <Text style={{ ...Fonts.grayColor10Medium }}>
                    {streamData?.track?.artist || 'Loading...'}
                </Text>
            </View>
        )
    }

    function songProcessSlider() {
        return (
            <View style={styles.songProcessSliderWrapStyle}>
                <Slider
                    value={songRunningInPercentage}
                    onValueChange={(value) => updateState({ songRunningInPercentage: value })}
                    maximumValue={100}
                    minimumValue={0}
                    containerStyle={{ height: 12.0 }}
                    minimumTrackTintColor={Colors.primaryColor}
                    maximumTrackTintColor={Colors.secondaryColor}
                    thumbTintColor={Colors.secondaryColor}
                    trackStyle={{ height: 4.5, }}
                    thumbStyle={{ height: 15, width: 15, backgroundColor: Colors.primaryColor }}
                />
            </View>
        )

    }

    function songTimeInfo() {
        return (
            <View style={styles.songTimeInfoWrapStyle}>
                <Text style={{ ...Fonts.grayColor10Medium }}>
                    2:20
                </Text>
                <Text style={{ ...Fonts.grayColor10Medium }}>
                    3:58
                </Text>
            </View>
        )
    }

    function header() {
        return (
            <View style={styles.headerWrapStyle}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('(tabs)', { screen: 'exploreScreen' })}
                    style={{ width: 30.0, }}
                >
                    <MaterialIcons
                        name="arrow-back"
                        size={30}
                        color={Colors.whiteColor}
                    />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ ...Fonts.boldShow, color: Colors.whiteColor }}>
                        {showData ? 'The SOZO TODAY Morning Show' : 'The SOZO TODAY Morning Show'}
                    </Text>
                </View>
            </View>
        )
    }

    function cornerImage() {
        return (
            <Image
                source={require('../../assets/images/corner-design.png')}
                style={styles.cornerImageStyle}
            />
        )
    }
})

const styles = StyleSheet.create({
    cornerImageStyle: {
        width: '100%',
        height: 170,
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        zIndex: 100
    },
    headerWrapStyle: {
        marginHorizontal: Sizes.fixPadding * 2.0,
        marginTop: Sizes.fixPadding - 40.0,
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center'
    },
    songTimeInfoWrapStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Sizes.fixPadding * 2.0,
        justifyContent: 'space-between',
        marginTop: Sizes.fixPadding + 5.0,
    },
    songProcessSliderWrapStyle: {
        flex: 1,
        marginHorizontal: Sizes.fixPadding * 2.0,
        alignItems: 'stretch',
        justifyContent: 'center'
    },
    forwardBackwardButtonWrapStyle: {
        width: 30.0,
        backgroundColor: Colors.whiteColor,
        height: 30.0,
        borderRadius: 15.0,
        borderColor: "#DFDFDF",
        borderWidth: 0.50,
        elevation: 2.0,
        alignItems: 'center',
        justifyContent: 'center'
    },
    pausePlayButtonWrapStyle: {
        width: 37.0,
        height: 37.0,
        borderRadius: 18.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: Sizes.fixPadding + 2.0
    },
    favoriteShuffleAndRepeatInfoWrapStyle: {
        marginTop: Sizes.fixPadding,
        marginBottom: Sizes.fixPadding - 5.0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    songPlayInfoWrapStyle: {
        marginTop: Sizes.fixPadding + 10.0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextOnTheListInfoWrapStyle: {
        marginBottom: Sizes.fixPadding - 5.0,
        marginHorizontal: Sizes.fixPadding * 2.0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    playerCardOuterContainer: {
        marginHorizontal: Sizes.fixPadding * 2.0,
        marginTop: Sizes.fixPadding * 1.0,
        marginBottom: Sizes.fixPadding * 2.0,
        alignItems: 'center',
    },
    playerCardImageWrapper: {
        borderRadius: Sizes.fixPadding * 1.5,
        overflow: 'hidden',
        marginBottom: Sizes.fixPadding,
    },
    playerCardOverlay: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: Sizes.fixPadding,
        backgroundColor: 'transparent',
        borderRadius: Sizes.fixPadding * 1.5,
        marginTop: -Sizes.fixPadding * 1.5,
        zIndex: 2,
    },
    playerCardTitle: {
        ...Fonts.grayColor13Medium,
        color: Colors.whiteColor,
        ...Fonts.bold18,
        fontSize: 16,
        marginBottom: 1.5,
    },
    playerCardArtist: {
        ...Fonts.grayColor13Medium,
        color: Colors.whiteColor,
    },
    playerCardPlayButton: {
        position: 'absolute',
        right: Sizes.fixPadding,
        bottom: Sizes.fixPadding - 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    playerCardPlayGradient: {
        width: 72,
        height: 72,
        borderRadius: 42,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerCardPlayInnerCircle: {
        width: 62,
        height: 62,
        borderRadius: 28,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressBarContainer: {
        marginHorizontal: Sizes.fixPadding * 2.0,
        marginTop: Sizes.fixPadding * 2.0,
        marginBottom: Sizes.fixPadding * 2.0,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: Sizes.fixPadding,
        padding: Sizes.fixPadding,
    },
    timeInfoWrapStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Sizes.fixPadding,
        justifyContent: 'space-between',
    },
    progressSliderWrapStyle: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
        paddingHorizontal: Sizes.fixPadding / 2,
    },
});

export default NowPlayingScreen;