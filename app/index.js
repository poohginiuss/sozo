import React, { useEffect } from "react";
import { View, StatusBar } from "react-native";
import { Image } from 'expo-image';
import { useNavigation } from "expo-router";
import { useAuth } from "./context/AuthContext";

const SplashScreen = () => {
    const navigation = useNavigation();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        // Wait for auth state to be checked
        if (!isLoading) {
            const timer = setTimeout(() => {
                if (user.isAuthenticated) {
                    navigation.push('(tabs)');
                } else {
                    navigation.push('auth/signinScreen');
                }
            }, 2000);
            return () => {
                clearTimeout(timer);
            }
        }
    }, [navigation, user.isAuthenticated, isLoading])

    return (
        <View style={{ 
            flex: 1, 
            backgroundColor: '#ffffff',
            alignItems: 'center', 
            justifyContent: 'center' 
        }}>
            <StatusBar backgroundColor="#ffffff" barStyle={'dark-content'} />
            <Image
                source={require('../assets/images/sozo-logo.png')}
                style={{ 
                    height: 200, 
                    width: 200,
                }}
                contentFit="contain"
                cachePolicy="memory-disk"
                priority="high"
            />
        </View>
    )
}

export default SplashScreen;