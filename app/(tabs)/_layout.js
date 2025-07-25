import { Tabs, useNavigation } from 'expo-router';
import React, { useState, useCallback, useRef, useMemo } from "react";
import { BackHandler, View, Text, TouchableOpacity, StyleSheet, Dimensions, Pressable, Platform } from "react-native";
import { Image } from 'expo-image';
import { Colors, Fonts, Sizes, CommonStyles } from "../../constants/styles";
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from "@react-navigation/native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from 'expo-linear-gradient';
import { useStream } from '../context/StreamContext';

const { width } = Dimensions.get('window');

export default function App() {
  return <TabLayout />;
}

function TabLayout() {

  const backAction = () => {
    backClickCount == 1 ? BackHandler.exitApp() : _spring();
    return true;
  };

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", backAction);
      return () => {
        subscription.remove();
      };
    }, [backAction])
  );

  function _spring() {
    setBackClickCount(1);
    setTimeout(() => {
      setBackClickCount(0);
    }, 1000)
  }

  const navigation = useNavigation();
  const [backClickCount, setBackClickCount] = useState(0);
  const { streamData, isPlaying, togglePlayPause } = useStream();

  // Memoize the current song data to prevent unnecessary re-renders
  const currentSongData = useMemo(() => {
    if (streamData?.track) {
      return {
        image: streamData.track.imageurl,
        artist: streamData.track.artist || 'Loading...',
        title: streamData.track.title || 'Loading...',
        key: streamData.track.played_at || 'default'
      };
    }
    return {
      image: require('../../assets/images/sozo-logo.png'),
      artist: 'Loading...',
      title: 'Loading...',
      key: 'default'
    };
  }, [streamData?.track?.artist, streamData?.track?.title, streamData?.track?.imageurl, streamData?.track?.played_at]);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: 'none', // Hide the tab bar completely
            backgroundColor: Colors.whiteColor,
            height: 60.0,
            paddingTop: Sizes.fixPadding
          },
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarButton: (props) => (
            <Pressable
              {...props}
              android_ripple={{
                color: Colors.whiteColor,
              }}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="explore/exploreScreen"
          options={{
            tabBarIcon: ({ focused }) => tabIcon({ icon: 'home', focused })
          }}
        />
        {/* <Tabs.Screen
          name="trending/trendingScreen"
          options={{
            tabBarIcon: ({ focused }) => tabIcon({ icon: 'local-fire-department', focused })
          }}
        />
        <Tabs.Screen
          name="library/libraryScreen"
          options={{
            tabBarIcon: ({ focused }) => tabIcon({ icon: 'library-music', focused })
          }}
        /> */}
        <Tabs.Screen
          name="settings/settingsScreen"
          options={{
            tabBarIcon: ({ focused }) => tabIcon({ icon: 'settings', focused })
          }}
        />
      </Tabs>
      {currentlyPlayedSong()}
      {exitInfo()}
    </>
  );

  function exitInfo() {
    return (
      backClickCount == 1
        ?
        <View style={styles.animatedView}>
          <Text style={{ ...Fonts.whiteColor12Medium }}>
            Press Back Once Again to Exit
          </Text>
        </View>
        :
        null
    )
  }

  function tabIcon({ icon, focused }) {
    return (
      focused
        ?
        <MaskedView
          style={{ flex: 1, height: 30, flexDirection: 'row', }}
          maskElement={
            <View style={{ justifyContent: 'center', alignItems: 'center', }}>
              <MaterialIcons
                color={'black'}
                size={30}
                name={icon}
              />
            </View>
          }
        >
          <LinearGradient
            start={{ x: 0, y: 0.7 }}
            end={{ x: 0, y: 0 }}
            colors={[Colors.primaryColor, Colors.secondaryColor]}
            style={{ flex: 1 }}
          />
        </MaskedView>
        :
        <MaterialIcons
          color={Colors.blackColor}
          size={30}
          style={{ alignSelf: 'center' }}
          name={icon}
        />
    )
  }

  function currentlyPlayedSong() {
    return (
      <TouchableOpacity
        activeOpacity={1}
        style={styles.currentlyPlayedSongInfoWrapStyle}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <Image
            key={currentSongData.key}
            source={currentSongData.image}
            style={{
              width: 55.0,
              height: 55.0,
              borderRadius: Sizes.fixPadding - 5.0,
              flexShrink: 0,
            }}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            recyclingKey={currentSongData.key}
            transition={200}
          />
          <View style={{ 
            marginLeft: Sizes.fixPadding, 
            flex: 1, 
            minWidth: 0,
            marginRight: Sizes.fixPadding 
          }}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                ...Fonts.whiteColor15Bold,
                fontSize: 14,
              }}
            >
              {currentSongData.title}
            </Text>
            <Text 
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ 
                ...Fonts.whiteColor12Medium,
                fontSize: 12,
              }}
            >
              {currentSongData.artist}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={togglePlayPause}
          style={[styles.pausePlayButtonWrapStyle, { flexShrink: 0 }]}
        >
          <MaterialIcons
            name={isPlaying ? "stop" : 'play-arrow'}
            size={30}
            color="black"
          />
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({ 
  pausePlayButtonWrapStyle: {
    width: 45.0,
    height: 45.0,
    backgroundColor: Colors.whiteColor,
    borderRadius: 22.5,
    borderColor: "#DFDFDF",
    borderWidth: 0.50,
    elevation: 2.0,
    alignItems: 'center',
    justifyContent: 'center',
    ...CommonStyles.shadow
  },
  currentlyPlayedSongInfoWrapStyle: {
    left: 0.0,
    right: 0.0,
    bottom: 0.0, // Move to very bottom of screen
    position: 'absolute',
    zIndex: 100.0,
    backgroundColor: '#5829af',
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#5829af',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: Sizes.fixPadding * 2.0,
    paddingVertical: Sizes.fixPadding, // Add vertical padding for better touch area
    ...CommonStyles.shadow,
    minHeight: 75, // Ensure minimum height
  },
  animatedView: {
    backgroundColor: "#333333",
    position: "absolute",
    bottom: 20,
    alignSelf: 'center',
    borderRadius: Sizes.fixPadding * 2.0,
    paddingHorizontal: Sizes.fixPadding + 5.0,
    paddingVertical: Sizes.fixPadding,
    justifyContent: "center",
    alignItems: "center",
  },
})