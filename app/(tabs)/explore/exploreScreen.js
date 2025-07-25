import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Dimensions, ImageBackground, ScrollView, StatusBar, FlatList, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from 'expo-image';
import { Colors, Fonts, Sizes, } from "../../../constants/styles";
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useNavigation, router } from "expo-router";
import sozoWhiteLogo from '../../../assets/images/sozo-white.png';
import worshipLogo from '../../../assets/images/worship_anywhere.png';
import bibleInAYearLogo from '../../../assets/images/BibleInAYear-logo.png';
import { useStream } from '../../context/StreamContext';
import * as WebBrowser from 'expo-web-browser';

const { width } = Dimensions.get('window');

const mockNowPlaying = {
    image: require('../../../assets/images/sozo-logo.png'),
    title: 'Song Title',
    artist: 'Artist Name',
    isPlaying: false,
};

const ExploreScreen = React.memo(() => {

    const navigation = useNavigation();
    const { 
        recentTracks, 
        loading: streamLoading, 
        streamData, 
        isPlaying, 
        togglePlayPause,
        onDemandShows,
        loadingOnDemand
    } = useStream();

    const [state, setState] = useState({
        devotionalData: [], // Add devotional data to state
        loadingDevotional: true, // Add loading state
        bibleReadingData: [], // Add bible reading RSS data to state
        loadingBibleReading: true, // Add loading state for bible reading
    })

    const updateState = useCallback((data) => setState((state) => ({ ...state, ...data })), []);

    const {
        devotionalData,
        loadingDevotional,
        bibleReadingData,
        loadingBibleReading,
    } = state;

    // Helper function to extract text from rich text nodes
    const extractTextFromNodes = useCallback((nodes) => {
        let text = '';
        
        const processNode = (node) => {
            if (node.type === 'TEXT' && node.textData && node.textData.text) {
                let nodeText = node.textData.text;
                
                // Handle text decorations (bold, italic, etc.)
                if (node.textData.decorations && Array.isArray(node.textData.decorations)) {
                    const hasBold = node.textData.decorations.some(decoration => decoration.type === 'BOLD');
                    const hasItalic = node.textData.decorations.some(decoration => decoration.type === 'ITALIC');
                    const hasUnderline = node.textData.decorations.some(decoration => decoration.type === 'UNDERLINE');
                    
                    if (hasBold) {
                        nodeText = `**${nodeText}**`;
                    }
                    if (hasItalic) {
                        nodeText = `*${nodeText}*`;
                    }
                    if (hasUnderline) {
                        nodeText = `_${nodeText}_`;
                    }
                }
                
                text += nodeText;
            } else if (node.type === 'text' && node.textData && node.textData.text) {
                text += node.textData.text;
            } else if (node.type === 'paragraph' || node.type === 'PARAGRAPH') {
                if (node.nodes && Array.isArray(node.nodes)) {
                    node.nodes.forEach(processNode);
                }
                text += '\n\n'; // Add paragraph breaks
            } else if (node.type === 'heading' || node.type === 'HEADING') {
                text += '\n## '; // Add heading formatting
                if (node.nodes && Array.isArray(node.nodes)) {
                    node.nodes.forEach(processNode);
                }
                text += '\n\n';
            } else if (node.type === 'bulleted-list' || node.type === 'BULLETED_LIST') {
                if (node.nodes && Array.isArray(node.nodes)) {
                    node.nodes.forEach(listItem => {
                        text += '• ';
                        if (listItem.nodes && Array.isArray(listItem.nodes)) {
                            listItem.nodes.forEach(processNode);
                        }
                        text += '\n';
                    });
                }
                text += '\n';
            } else if (node.nodes && Array.isArray(node.nodes)) {
                // Process child nodes
                node.nodes.forEach(processNode);
            }
        };
        
        if (Array.isArray(nodes)) {
            nodes.forEach(processNode);
        } else if (nodes && nodes.nodes) {
            // Handle case where nodes is wrapped in another object
            processNode(nodes);
        }
        
        return text.trim();
    }, []);

    // Add useEffect to fetch devotional data on component mount
    useEffect(() => {
        fetchDevotionalData();
        fetchBibleReadingData();
    }, [fetchDevotionalData, fetchBibleReadingData]);

    // Add function to fetch and parse devotional data
    const fetchDevotionalData = useCallback(async () => {
        try {
            const response = await fetch('https://www.sozoradio.org/_functions/items', {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch devotional data');
            }
            
            const data = await response.json();
            
            // Parse the data and extract required fields - get the most recent 7 items
            const parsedDevotional = data.items?.slice(0, 7).map(item => {
                // Parse image URL
                let imageUrl = '';
                if (item.image && item.image.includes('wix:image://v1/')) {
                    const filePath = item.image.split('wix:image://v1/')[1].split('#')[0].split('/')[0];
                    imageUrl = `https://static.wixstatic.com/media/${filePath}`;
                } else if (item.image) {
                    imageUrl = item.image;
                }
                
                // Only return items that have both title and image from database
                if (!item.title || !imageUrl) {
                    return null;
                }
                
                // Extract devotion text - handle rich text format
                let devotionText = '';
                if (item.devotionText && item.devotionText.nodes) {
                    // This is a rich text format, extract text from nodes
                    devotionText = extractTextFromNodes(item.devotionText.nodes);
                } else if (item['devotion-text']) {
                    if (typeof item['devotion-text'] === 'string') {
                        devotionText = item['devotion-text'];
                    } else if (item['devotion-text'].nodes) {
                        devotionText = extractTextFromNodes(item['devotion-text'].nodes);
                    }
                } else if (item.devotionText && typeof item.devotionText === 'string') {
                    devotionText = item.devotionText;
                }

                // Format the date with day of week
                let formattedDate = '';
                let dayOfWeek = '';
                if (item.date) {
                    try {
                        const date = new Date(item.date);
                        if (!isNaN(date.getTime())) {
                            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            dayOfWeek = days[date.getDay()];
                            formattedDate = `${dayOfWeek}, ${months[date.getMonth()]} ${date.getDate()}`;
                        }
                    } catch (error) {
                        console.error('Error parsing devotional date:', error);
                    }
                }
                
                return {
                    id: item.id || Math.random().toString(),
                    title: item.title,
                    url: item['link-items-title'] ? `https://www.sozoradio.org${item['link-items-title']}` : '',
                    image: imageUrl,
                    devotionText: devotionText,
                    date: formattedDate,
                    dayOfWeek: dayOfWeek,
                };
            }).filter(Boolean) || []; // Remove null items
            
            updateState({ 
                devotionalData: parsedDevotional,
                loadingDevotional: false 
            });
            
        } catch (error) {
            console.error('Error fetching devotional data:', error);
            // Add fallback with mock data to ensure the app doesn't break
            const fallbackData = [{
                id: 'fallback-1',
                title: 'Daily Devotional',
                image: require('../../../assets/images/sozo-logo.png'),
                devotionText: 'Welcome to your daily devotional. Take time to reflect on God\'s goodness today.',
                url: '',
                date: '',
                dayOfWeek: ''
            }];
            updateState({ 
                devotionalData: fallbackData,
                loadingDevotional: false 
            });
        }
    }, [extractTextFromNodes, updateState]);

    // Add function to fetch and parse Bible reading RSS data
    const fetchBibleReadingData = useCallback(async () => {
        try {
            const response = await fetch('https://www.sozoradio.org/_functions/DailyBibleReadings', {
            headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error('Failed to fetch Bible reading data');

            const data = await response.json();
            
            // Sort by date (most recent first) with better date handling
            const sortedItems = data.items.sort((a, b) => {
                // Handle different date formats and ensure proper parsing
                const dateA = new Date(a.date + 'T00:00:00'); // Add time to ensure proper parsing
                const dateB = new Date(b.date + 'T00:00:00');
                
                // If dates are invalid, use string comparison as fallback
                if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                    return b.date.localeCompare(a.date);
                }
                
                return dateB.getTime() - dateA.getTime(); // Most recent first
            });
            
            const bibleReadings = sortedItems.slice(0, 7).map(item => {
                // Parse the date and get day of week
                let dayOfWeek = '';
                let formattedDate = item.date || '';
                
                if (item.date) {
                    try {
                        // Try different date parsing approaches
                        let date = new Date(item.date + 'T00:00:00');
                        
                        // If that fails, try without time
                        if (isNaN(date.getTime())) {
                            date = new Date(item.date);
                        }
                        
                        // If still invalid, try parsing manually
                        if (isNaN(date.getTime())) {
                            const parts = item.date.split('-');
                            if (parts.length === 3) {
                                date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                            }
                        }
                        
                        if (!isNaN(date.getTime())) {
                            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            dayOfWeek = days[date.getDay()];
                            
                            // Format the date nicely (e.g., "Jan 15" instead of full date)
                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            formattedDate = `${months[date.getMonth()]} ${date.getDate()}`;
                        }
                    } catch (error) {
                        console.error('Error parsing date:', error);
                        // Keep original date if parsing fails
                        formattedDate = item.date;
                    }
                }

                return {
                    id: item._id,
                    title: item.title || item.date || 'Daily Reading',
                    link: item['link-daily-bible-readings-title']
                        ? `https://www.sozoradio.org${item['link-daily-bible-readings-title']}` : '',
                    image: bibleInAYearLogo,
                    date: formattedDate,
                    dayOfWeek: dayOfWeek,
                    bibleText: typeof item.bibleText === 'string' ? item.bibleText : 
                        (item.bibleText && item.bibleText.nodes ? extractTextFromNodes(item.bibleText.nodes) : item.bibleText),
                    fullDate: item.date, // Keep original date for sorting reference
                };
            });

            updateState({
            bibleReadingData: bibleReadings,
            loadingBibleReading: false
            });
        } catch (error) {
            console.error('Error fetching Bible reading data:', error);
            updateState({
            bibleReadingData: [],
            loadingBibleReading: false
            });
        }
    }, [updateState]);


    return (
        <LinearGradient
            start={{ x: 1, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            colors={[
                '#5829af',
                '#5829af',
                'rgb(60, 65, 66)'
            ]}
            locations={[0, 0.08, 0.08]} // hard stop at 18%
            style={{ flex: 1 }}
        >
            <StatusBar translucent backgroundColor='transparent' barStyle={'light-content'} />
            <View style={{ flex: 1 }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingTop: 100.0,
                        paddingBottom: Sizes.fixPadding * 10.0 // Increased padding for bottom player
                    }}
                >
                    {/* Logo overlay at top left */}
                    <View style={{ position: 'absolute', top: 45, left: 5, zIndex: 200 }}>
                        <Image
                            source={sozoWhiteLogo}
                            style={{ width: 80, height: 80, resizeMode: 'contain' }}
                        />
                    </View>
                    {/* Worship Anywhere logo at top left */}
                    <View style={{ position: 'absolute', top: 15, left: 80, zIndex: 199 }}>
                        <Image
                            source={worshipLogo}
                            style={{ width: 140, height: 140, resizeMode: 'contain' }}
                        />
                    </View>
                    {/* Settings button at top right */}
                    <View style={{ position: 'absolute', top: 60, right: 20, zIndex: 200 }}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => router.push('/(tabs)/settings/settingsScreen')}
                            style={styles.settingsButtonStyle}
                        >
                            <MaterialIcons
                                name="settings"
                                size={28}
                                color={Colors.whiteColor}
                            />
                        </TouchableOpacity>
                    </View>
                    {playerCard()}
                    {header()}
                    {recentlyPlayedInfo()}
                    {todaysInspiration()}
                    {readingInfo()}
                    {devotionalInfo()}
                    {todayPodcast()}
                    {/* {dailyVerse()}
                    {recommendedInfo()}
                    {searchBar()}
                    {popularSongsInfo()}
                    {forYouInfo()}
                    {playListInfo()}
                    {albumsInfo()}
                    {topArtistInfo()} */}
                </ScrollView>
                {/* {cornerImage()} */}
            </View>
        </LinearGradient>
    )

    function playerCard() {
        // Use real stream data if available, otherwise fallback to mock data
        const track = streamData?.track ? {
            image: streamData.track.imageurl,
            title: streamData.track.title || 'Song Title',
            artist: streamData.track.artist || 'Artist Name',
            isPlaying: isPlaying,
        } : {
            image: require('../../../assets/images/sozo-logo.png'),
            title: 'SOZO Radio',
            artist: 'Live Stream',
            isPlaying: isPlaying,
        };

        const cardSize = width - Sizes.fixPadding * 5; // full width minus horizontal margins
        return (
            <View style={styles.playerCardOuterContainer}>
                <View style={[styles.playerCardImageWrapper,{width:cardSize,height:cardSize}]}>
                    <Image
                        source={track.image}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        priority="high"
                        recyclingKey={track.title}
                        transition={200}
                    />
                </View>

                <View style={styles.playerCardOverlay}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.playerCardTitle} numberOfLines={1}>{track.title}</Text>
                            <Text style={styles.playerCardArtist} numberOfLines={1}>{track.artist}</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.playerCardPlayButton} 
                            activeOpacity={.8}
                            onPress={togglePlayPause}
                        >
                            <LinearGradient
                                colors={['#611ec9', '#ab5864']}
                                locations={[0, 0.97]}
                                style={styles.playerCardPlayGradient}
                            >
                                <View style={styles.playerCardPlayInnerCircle}>
                                    <MaterialIcons
                                        name={track.isPlaying ? 'stop' : 'play-arrow'}
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

    function topArtistInfo() {
        // This function is no longer used - all data arrays have been removed
        return null;
    }

    function readingInfo() {
        if (loadingBibleReading) {
            return (
            <View style={{ marginTop: Sizes.fixPadding - 5.0 }}>
                <View style={styles.titleWrapStyle}>
                <Text style={{ ...styles.titleStyle, color: '#fff' }}>
                    One Year Bible Readings
                </Text>
                </View>
                <View style={{ marginHorizontal: Sizes.fixPadding * 2.0, alignItems: 'center', padding: Sizes.fixPadding * 2.0 }}>
                <Text style={{ color: '#fff', ...Fonts.whiteColor12Medium }}>Loading...</Text>
                </View>
            </View>
            );
        }

        // Don't render section if no data
        if (!bibleReadingData || bibleReadingData.length === 0) {
            return null;
        }

        const renderItem = ({ item }) => (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                    const articleData = {
                        id: item.id,
                        title: item.title,
                        image: item.image,
                        bibleText: item.bibleText,
                        url: item.link,
                    };
                    
                    router.push({
                        pathname: '/article/articleScreen',
                        params: {
                            articleData: JSON.stringify(articleData)
                        }
                    });
                }}
                style={{ width: 110, marginRight: Sizes.fixPadding }}
            >
                <Image
                    source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                    style={{
                        width: 110,
                        height: 100,
                        borderRadius: Sizes.fixPadding - 5.0
                    }}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                    priority="normal"
                    recyclingKey={item.id}
                    transition={200}
                />
                {item.dayOfWeek && (
                    <Text style={{
                        marginTop: Sizes.fixPadding - 7.0,
                        color: '#fff',
                        ...Fonts.whiteColor12SemiBold,
                        textAlign: 'center',
                        fontSize: 11,
                        height: 14,
                    }} numberOfLines={1}>
                        {item.dayOfWeek}
                    </Text>
                )}
                <Text style={{
                    marginTop: item.dayOfWeek ? 2 : Sizes.fixPadding - 7.0,
                    color: '#fff',
                    ...Fonts.whiteColor12SemiBold,
                    textAlign: 'center',
                    fontSize: 10,
                    height: 16,
                }} numberOfLines={1}>
                    {item.date}
                </Text>
            </TouchableOpacity>
        );

        return (
            <View style={{ marginTop: Sizes.fixPadding - 5.0, }}>
                <View style={styles.titleWrapStyle}>
                    <Text style={{ ...styles.titleStyle, color: '#fff' }}>
                    One Year Bible Readings
                    </Text>
                    <MaterialIcons
                    name="keyboard-arrow-right"
                    color={'#fff'}
                    size={25}
                    />
                </View>
                <FlatList
                    data={bibleReadingData}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingLeft: Sizes.fixPadding * 2.0,
                        paddingRight: Sizes.fixPadding,
                    }}
                />
            </View>
        )
    }

    function albumsInfo() {
        // This function is no longer used - all data arrays have been removed
        return null;
    }

    function devotionalInfo() {
        if (loadingDevotional) {
            return (
                <View style={{ marginTop: Sizes.fixPadding - 5.0 }}>
                    <View style={styles.titleWrapStyle}>
                        <Text style={{ ...styles.titleStyle, color: '#fff' }}>
                            SOZO TODAY Devotionals
                        </Text>
                    </View>
                    <View style={{ marginHorizontal: Sizes.fixPadding * 2.0, alignItems: 'center', padding: Sizes.fixPadding * 2.0 }}>
                        <Text style={{ color: '#fff', ...Fonts.whiteColor12Medium }}>Loading...</Text>
                    </View>
                </View>
            );
        }

        // Don't render section if no data
        if (!devotionalData || devotionalData.length === 0) {
            return null;
        }

        const renderItem = ({ item }) => (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                    router.push({
                        pathname: '/article/articleScreen',
                        params: {
                            articleData: JSON.stringify({
                                id: item.id,
                                title: item.title,
                                image: item.image,
                                devotionText: item.devotionText,
                                url: item.url,
                            })
                        }
                    });
                }}
                style={{ width: 110, marginRight: Sizes.fixPadding }}
            >
                <Image
                    source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                    style={{
                        width: 110,
                        height: 100,
                        borderRadius: Sizes.fixPadding - 5.0
                    }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    priority="normal"
                    recyclingKey={item.id}
                    transition={200}
                />
                <Text style={{ 
                    marginTop: Sizes.fixPadding - 7.0, 
                    color: '#fff', 
                    ...Fonts.whiteColor12SemiBold,
                    textAlign: 'center',
                    fontSize: 10,
                    lineHeight: 16,
                }} numberOfLines={2}>
                    {item.title}
                </Text>
                {item.date && (
                    <Text style={{
                        color: '#fff',
                        ...Fonts.whiteColor10Medium,
                        textAlign: 'center',
                        fontSize: 9,
                        marginTop: 2,
                        opacity: 0.8,
                    }} numberOfLines={1}>
                        {item.date}
                    </Text>
                )}
            </TouchableOpacity>
        );

        return (
            <View style={{ marginTop: Sizes.fixPadding - 5.0, }}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                        if (devotionalData && devotionalData.length > 0) {
                            const firstItem = devotionalData[0];
                            router.push({
                                pathname: '/article/articleScreen',
                                params: {
                                    articleData: JSON.stringify({
                                        id: firstItem.id,
                                        title: firstItem.title,
                                        image: firstItem.image,
                                        devotionText: firstItem.devotionText,
                                        url: firstItem.url,
                                    })
                                }
                            });
                        } else {
                            router.push('/article/articleScreen');
                        }
                    }}
                    style={styles.titleWrapStyle}
                >
                    <Text style={{ ...styles.titleStyle, color: '#fff' }}>
                        SOZO TODAY Devotionals
                    </Text>
                    <MaterialIcons
                        name="keyboard-arrow-right"
                        color={'#fff'}
                        size={25}
                    />
                </TouchableOpacity>
                <FlatList
                    data={devotionalData}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingLeft: Sizes.fixPadding * 2.0,
                        paddingRight: Sizes.fixPadding,
                    }}
                />
            </View>
        )
    }
    
    function recentlyPlayedInfo() {

        const renderItem = useCallback(({ item }) => (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                    // Handle recently played item click - you can add custom logic here
                }}
                style={{ width: 110, marginRight: Sizes.fixPadding }}
            >
                <Image 
                    key={item.played_at || item.id}
                    source={item.enclosure?.url}
                    style={styles.recentlyPalyedSongImageStyle}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    priority="normal"
                    recyclingKey={item.played_at || item.id}
                    transition={200}
                />
                <Text style={{ 
                    marginTop: Sizes.fixPadding - 7.0, 
                    color: '#fff', 
                    ...Fonts.whiteColor12SemiBold,
                    lineHeight: 16,
                }} numberOfLines={2}>
                    {item.songTitle || item.albumName || 'Unknown Song'}
                </Text>
                <Text style={{ 
                    color: '#fff', 
                    ...Fonts.whiteColor10Medium,
                    marginTop: 2,
                }} numberOfLines={1}>
                    {item.artist || 'Unknown Artist'}
                </Text>
            </TouchableOpacity>
        ), []);

        // Memoize the display data to prevent unnecessary re-renders
        const displayData = useMemo(() => {
            return recentTracks && recentTracks.length > 0 ? recentTracks.slice(0, 6) : [];
        }, [recentTracks]);

        return (
            <View style={{ marginTop: Sizes.fixPadding + 1.0, }}>
                <View style={styles.titleWrapStyle}>
                    <Text style={{ ...styles.titleStyle, color: '#fff' }}>
                        Recently Played
                    </Text>
                    <MaterialIcons
                        name="keyboard-arrow-right"
                        color={'#fff'}
                        size={25}
                    />
                </View>
                {streamLoading ? (
                    <View style={{ marginHorizontal: Sizes.fixPadding * 2.0, alignItems: 'center', padding: Sizes.fixPadding * 2.0 }}>
                        <Text style={{ color: '#fff', ...Fonts.whiteColor12SemiBold }}>Loading recent tracks...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={displayData}
                        keyExtractor={(item, index) => item.played_at || `recent-${index}`}
                        renderItem={renderItem}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingLeft: Sizes.fixPadding * 2.0,
                            paddingRight: Sizes.fixPadding,
                        }}
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={6}
                        windowSize={10}
                    />
                )}
            </View>
        )
    }

    function popularSongsInfo() {
        // This function is no longer used - all data arrays have been removed
        return null;
    }

    function todayPodcast() {
        if (loadingOnDemand) {
            return (
                <View>
                    <View style={styles.titleWrapStyle}>
                        <Text style={{ ...styles.titleStyle, color: '#fff' }}>
                            The SOZO TODAY Morning Show
                        </Text>
                        <MaterialIcons
                            name="keyboard-arrow-right"
                            color={'#fff'}
                            size={25}
                        />
                    </View>
                    <View style={{ marginHorizontal: Sizes.fixPadding * 2.0, alignItems: 'center', padding: Sizes.fixPadding * 2.0 }}>
                        <Text style={{ color: '#fff', ...Fonts.whiteColor12Medium }}>Loading shows...</Text>
                    </View>
                </View>
            );
        }

        const renderItem = ({ item }) => (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                    // Navigate to Now Playing screen with show data
                    router.push({
                        pathname: '/nowPlaying/nowPlayingScreen',
                        params: { 
                            showData: JSON.stringify({
                                type: 'onDemandShow',
                                ...item
                            })
                        }
                    });
                }}
            >
                <ImageBackground
                    source={item.image ? { uri: item.image } : require('../../../assets/images/sozo-logo.png')}
                    style={{ width: 180.0, height: 140.0, marginRight: Sizes.fixPadding }}
                    borderRadius={Sizes.fixPadding - 5.0}
                >
                    <LinearGradient
                        start={{ x: 1, y: 0.2 }}
                        end={{ x: 1, y: 1 }}
                        colors={['rgba(255, 124, 0,0.7)', 'rgba(41, 10, 89, 0.7)']}
                        style={{ 
                            flex: 1, 
                            borderRadius: Sizes.fixPadding - 5.0,
                            padding: Sizes.fixPadding - 2.0,
                            justifyContent: 'space-between'
                        }}
                    >
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text style={{ 
                                color: '#fff', 
                                ...Fonts.whiteColor12SemiBold,
                                fontSize: 11,
                                textAlign: 'center'
                            }} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <Text style={{ 
                                color: '#fff', 
                                ...Fonts.whiteColor10Medium,
                                fontSize: 9,
                                textAlign: 'center',
                                marginTop: 2
                            }} numberOfLines={1}>
                                {item.artist}
                            </Text>
                        </View>
                        
                        {/* Play button only */}
                        <View style={{ 
                            flexDirection: 'row', 
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingTop: Sizes.fixPadding / 2
                        }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    borderRadius: 15,
                                    padding: 5,
                            }}
                            onPress={() => {
                                router.push({
                                    pathname: '/nowPlaying/nowPlayingScreen',
                                    params: { 
                                        showData: JSON.stringify({
                                            type: 'onDemandShow',
                                            ...item
                                        })
                                    }
                                });
                            }}
                        >
                            <MaterialIcons name="play-arrow" size={20} color="#000" />
                        </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </TouchableOpacity>
        );

        return (
            <View style={{ marginTop: Sizes.fixPadding - 5.0 }}>
                <View style={styles.titleWrapStyle}>
                    <Text style={{ ...styles.titleStyle, color: '#fff' }}>
                        The SOZO TODAY Morning Show
                    </Text>
                    <MaterialIcons
                        name="keyboard-arrow-right"
                        color={'#fff'}
                        size={25}
                    />
                </View>
                <FlatList
                    data={onDemandShows.slice(0, 5)} // Show first 5 items
                    keyExtractor={(item) => `${item.id}`}
                    renderItem={renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingLeft: Sizes.fixPadding * 2.0 }}
                />
            </View>
        )
    }

    function dailyVerse() {
        // This function is no longer used - all data arrays have been removed
        return null;
    }

    function recommendedInfo() {
        // This function is no longer used - all data arrays have been removed
        return null;
    }

    function searchBar() {
        // This function is no longer used - search functionality has been removed
        return null;
    }

    function cornerImage() {
        // This function is no longer used - corner image has been removed
        return null;
    }

    function header() {
        return (
            <View style={styles.headerWrapStyle}>
                <MaskedView>
                    <LinearGradient
                        start={{ x: 1, y: 0.2 }}
                        end={{ x: 1, y: 1 }}
                        colors={['rgba(255, 124, 0,1)', 'rgba(41, 10, 89, 1)']}
                        style={{ flex: 1 }}
                    />
                </MaskedView>
                {}
            </View>
        )
    }

    function todaysInspiration() {
        // Get the most recent item from each section
        const inspirationItems = [];
        
        // Add most recent Bible reading
        if (bibleReadingData && bibleReadingData.length > 0) {
            const bibleItem = bibleReadingData[0];
            inspirationItems.push({
                id: `bible-${bibleItem.id}`,
                title: bibleItem.title,
                subtitle: bibleItem.dayOfWeek ? `${bibleItem.dayOfWeek}, ${bibleItem.date}` : bibleItem.date,
                image: bibleItem.image,
                type: 'bible',
                onPress: () => {
                    router.push({
                        pathname: '/article/articleScreen',
                        params: {
                            articleData: JSON.stringify({
                                id: bibleItem.id,
                                title: bibleItem.title,
                                image: bibleItem.image,
                                bibleText: bibleItem.bibleText,
                                url: bibleItem.link,
                            })
                        }
                    });
                }
            });
        }
        
        // Add most recent devotional
        if (devotionalData && devotionalData.length > 0) {
            const devotionalItem = devotionalData[0];
            inspirationItems.push({
                id: `devotional-${devotionalItem.id}`,
                title: 'SOZO TODAY Devotionals',
                subtitle: devotionalItem.title,
                image: devotionalItem.image,
                type: 'devotional',
                onPress: () => {
                    router.push({
                        pathname: '/article/articleScreen',
                        params: {
                            articleData: JSON.stringify({
                                id: devotionalItem.id,
                                title: devotionalItem.title,
                                image: devotionalItem.image,
                                devotionText: devotionalItem.devotionText,
                                url: devotionalItem.url,
                            })
                        }
                    });
                }
            });
        }
        
        // Add most recent morning show
        if (onDemandShows && onDemandShows.length > 0) {
            const showItem = onDemandShows[0];
            inspirationItems.push({
                id: `show-${showItem.id}`,
                title: showItem.title,
                subtitle: 'Morning Show',
                image: showItem.image,
                type: 'show',
                onPress: () => {
                    router.push({
                        pathname: '/nowPlaying/nowPlayingScreen',
                        params: { 
                            showData: JSON.stringify({
                                type: 'onDemandShow',
                                ...showItem
                            })
                        }
                    });
                }
            });
        }
        
        // Don't render if no items or still loading
        if (inspirationItems.length === 0 || loadingBibleReading || loadingDevotional || loadingOnDemand) {
            return null;
        }

        // Always show 3 items, fill with empty placeholders if less than 3
        const displayItems = [...inspirationItems];
        while (displayItems.length < 3) {
            displayItems.push({ id: `placeholder-${displayItems.length}`, placeholder: true });
        }

        // Calculate dynamic width to ensure all 3 cards are equal
        const containerPadding = Sizes.fixPadding * 3.0; // total horizontal padding
        const itemWidth = (width - containerPadding) / 3;

        const renderItem = ({ item }, idx) => {
            if (item.placeholder) {
                return (
                    <View style={{
                        width: itemWidth,
                        opacity: 0,
                        height: 140,
                    }} />
                );
            }
            return (
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={item.onPress}
                    style={{
                        width: itemWidth,
                        alignItems: 'center',
                    }}
                >
                    <Image
                        source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                        style={{
                            width: itemWidth * 0.9, // Slightly smaller than container to avoid overflow
                            height: 100,
                            borderRadius: Sizes.fixPadding - 5.0,
                        }}
                        contentFit={item.type === 'bible' ? 'contain' : 'cover'}
                        cachePolicy="memory-disk"
                        priority="normal"
                        recyclingKey={item.id}
                        transition={200}
                    />
                    <Text style={{ 
                        marginTop: Sizes.fixPadding - 7.0, 
                        color: '#fff', 
                        ...Fonts.whiteColor12SemiBold,
                        textAlign: 'center',
                        fontSize: 10,
                        height: 32,
                        lineHeight: 16,
                        width: itemWidth * 0.9,
                    }} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={{ 
                        color: '#fff', 
                        ...Fonts.whiteColor10Medium,
                        fontSize: 9,
                        height: 14,
                        marginTop: 2,
                        opacity: 0.8,
                        textAlign: 'center',
                        width: itemWidth * 0.9,
                    }} numberOfLines={1}>
                        {item.subtitle}
                    </Text>
                </TouchableOpacity>
            );
        };
        
        return (
            <View style={{ marginTop: Sizes.fixPadding - 5.0 }}>
                <View style={styles.titleWrapStyle}>
                    <Text style={{ ...styles.titleStyle, color: '#fff' }}>
                        Today's Inspiration
                    </Text>
                    <MaterialIcons
                        name="keyboard-arrow-right"
                        color={'#fff'}
                        size={25}
                    />
                </View>
                <View style={{
                    flexDirection: 'row',
                    paddingHorizontal: Sizes.fixPadding * 1.5,
                    justifyContent: 'space-between',
                }}>
                    {displayItems.map((item, idx) => (
                        <React.Fragment key={item.id}>
                            {renderItem({ item }, idx)}
                        </React.Fragment>
                    ))}
                </View>
            </View>
        );
    }
})

const styles = StyleSheet.create({
    headerWrapStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Sizes.fixPadding * 2.0,
    },
    titleStyle: {
        marginTop: Sizes.fixPadding - 5.0,
        marginBottom: Sizes.fixPadding,
        ...Fonts.blackColor15Bold,
        color: '#fff' // ensure white text for all section titles
    },
    titleWrapStyle: {
        marginRight: Sizes.fixPadding + 5.0,
        marginLeft: Sizes.fixPadding * 2.0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    recentlyPalyedSongImageStyle: {
        width: 110,
        height: 100,
        borderRadius: Sizes.fixPadding - 5.0,
        marginBottom: 0, // Remove any bottom margin from image
    },
    playerCardOuterContainer: {
        marginHorizontal: Sizes.fixPadding * 2.0,
        marginTop: Sizes.fixPadding * 3.0,
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
        fontSize:16,
        marginBottom: 1.5,
    },
    playerCardArtist: {
        ...Fonts.grayColor13Medium,
        color: Colors.whiteColor,
    },
    playerCardPlayButton: {
        position: 'absolute',
        right: Sizes.fixPadding,
        bottom: Sizes.fixPadding-0,
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
    settingsButtonStyle: {
        width: 45,
        height: 45,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 22.5,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
})

export default ExploreScreen;