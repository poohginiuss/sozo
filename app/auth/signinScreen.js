import React, { useState, useCallback } from "react";
import { BackHandler, View, StatusBar, TouchableOpacity, TextInput, Text, ScrollView, Image, StyleSheet, Linking, Alert, ActivityIndicator } from "react-native";
import { Colors, Fonts, Sizes, CommonStyles } from "../../constants/styles";
import { MaterialIcons, MaterialCommunityIcons, } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { authService } from "../../services/authService";
import { useAuth } from "../context/AuthContext";
import * as WebBrowser from 'expo-web-browser';

const SigninScreen = () => {

    const navigation = useNavigation();
    const { signIn } = useAuth();

    const backAction = () => {
        backClickCount == 1 ? BackHandler.exitApp() : _spring();
        return true;
    };

    useFocusEffect(
        useCallback(() => {
            BackHandler.addEventListener("hardwareBackPress", backAction);
            return () => {
                BackHandler.removeEventListener("hardwareBackPress", backAction);
            };
        }, [backAction])
    );

    function _spring() {
        updateState({ backClickCount: 1 });
        setTimeout(() => {
            updateState({ backClickCount: 0 })
        }, 1000)
    }

    const [state, setState] = useState({
        showPassword: false,
        email: null,
        password: null,
        backClickCount: 0,
        isLoading: false,
    });

    const updateState = (data) => setState((state) => ({ ...state, ...data }));

    const {
        showPassword,
        email,
        password,
        backClickCount,
        isLoading,
    } = state;

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        updateState({ isLoading: true });

        try {
            const result = await authService.signIn(email, password);
            
            if (result.success) {
                // Store user data in context
                await signIn(email);
                
                // Navigate directly without success popup
                navigation.push('(tabs)');
            } else {
                // Authentication failed - show specific error message
                Alert.alert(
                    'Sign In Failed', 
                    result.error || 'Invalid email or password. Please check your credentials and try again.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Unexpected sign in error:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            updateState({ isLoading: false });
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: Colors.backColor }}>
            <StatusBar translucent={true} backgroundColor={'transparent'} barStyle={'light-content'} />
            <View style={{ flex: 1 }}>
                <ScrollView
                    automaticallyAdjustKeyboardInsets={true}
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'center',
                        paddingTop: 60
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {signinInfo()}
                </ScrollView>
            </View>
            {
                backClickCount == 1
                    ?
                    <View style={styles.animatedView}>
                        <Text style={{ ...Fonts.whiteColor12Medium }}>
                            Press Back Once Again to Exit
                        </Text>
                    </View>
                    :
                    null
            }
        </View>
    )

    function signinInfo() {
        return (
            <View>
                <Image
                    source={require('../../assets/images/sozo-logo.png')}
                    style={styles.logoStyle}
                    resizeMode="contain"
                />
                <MaskedView
                    style={{ flex: 1, height: 35, }}
                    maskElement={
                        <Text style={{ textAlign: 'center', ...Fonts.bold30, }}>
                            SIGN IN
                        </Text>
                    }
                >
                    <LinearGradient
                        start={{ x: 1, y: 0.2 }}
                        end={{ x: 1, y: 1 }}
                        colors={['rgba(255, 124, 0,1)', 'rgba(41, 10, 89, 1)']}
                        style={{ flex: 1 }}
                    />
                </MaskedView>
                {emailTextField()}
                {passwordTextField()}
                {signinButton()}
                {footerText()}
                {/* {orIndicator()}
                {socialMediaOptions()} */}
            </View>
        )
    }

    function signinButton() {
        return (
            <TouchableOpacity
                style={[styles.signinButtonStyle, isLoading && styles.disabledButton]}
                activeOpacity={0.9}
                onPress={handleSignIn}
                disabled={isLoading}
            >
                <LinearGradient
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 0 }}
                    colors={[
                        'rgba(255, 124, 0,1)',
                        'rgba(41, 10, 89, 0.9)',
                    ]}
                    style={styles.signinButtonGradientStyle}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={Colors.whiteColor} />
                    ) : (
                        <Text style={{ ...Fonts.whiteColor18Bold }}>
                            SIGN IN
                        </Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        )
    }

    function passwordTextField() {
        return (
            <View style={styles.passwordTextFieldWrapstyle}>
                <View style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center'
                }}>
                    <MaterialIcons
                        name="lock-open"
                        size={20}
                        color={Colors.grayColor}
                    />
                    <TextInput
                        value={password}
                        onChangeText={(text) => updateState({ password: text })}
                        secureTextEntry={showPassword}
                        selectionColor={Colors.grayColor}
                        placeholder='Password'
                        placeholderTextColor={Colors.grayColor}
                        numberOfLines={1}
                        style={{
                            padding:0,
                            flex: 1,
                            ...Fonts.blackColor13Bold,
                            marginLeft: Sizes.fixPadding,
                        }}
                    />

                </View>
                <MaterialCommunityIcons
                    name={showPassword ? 'eye-outline' : "eye-off-outline"}
                    color={Colors.grayColor}
                    size={20}
                    onPress={() => updateState({ showPassword: !showPassword })}
                />
            </View>
        )
    }

    function emailTextField() {
        return (
          <View style={styles.emailTextFieldWrapStyle}>
            <MaterialIcons name="email" color={Colors.grayColor} size={20} />
            <TextInput
              value={email}
              onChangeText={(text) => updateState({ email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              selectionColor={Colors.grayColor}
              placeholder="Email"
              placeholderTextColor={Colors.grayColor}
              style={{
                padding: 0,
                marginLeft: Sizes.fixPadding,
                flex: 1,
                ...Fonts.blackColor14Bold,
              }}
            />
          </View>
        );
      }      

    function footerText() {
        return (
            <View style={styles.footerTextContainer}>
                <Text style={styles.footerText}>
                    Sign up for an account or learn more at SOZOradio.org
                </Text>
            </View>
        )
    }
}

const styles = StyleSheet.create({
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
    emailTextFieldWrapStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.whiteColor,
        elevation: 2.0,
        borderRadius: Sizes.fixPadding - 5.0,
        paddingVertical: Sizes.fixPadding + 1.0,
        marginTop: Sizes.fixPadding * 2.5,
        marginBottom: Sizes.fixPadding,
        paddingHorizontal: Sizes.fixPadding + 5.0,
        marginHorizontal: Sizes.fixPadding * 2.0,
        ...CommonStyles.shadow
    },
    passwordTextFieldWrapstyle: {
        marginVertical: Sizes.fixPadding,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.whiteColor,
        elevation: 2.0,
        paddingVertical: Sizes.fixPadding + 1.0,
        paddingHorizontal: Sizes.fixPadding + 5.0,
        marginHorizontal: Sizes.fixPadding * 2.0,
        borderRadius: Sizes.fixPadding - 5.0,
        ...CommonStyles.shadow
    },
    orWrapStyle: {
        justifyContent: 'space-evenly',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Sizes.fixPadding + 5.0,
        marginBottom: Sizes.fixPadding,
        marginHorizontal: Sizes.fixPadding * 2.0,
    },
    socialMediaIconsStyle: {
        width: 32.0,
        height: 32.0,
        borderRadius: 16.0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    socialMediaIconsWrapStyle: {
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center'
    },
    signinButtonGradientStyle: {
        paddingVertical: Sizes.fixPadding + 3.0,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Sizes.fixPadding - 5.0
    },
    signinButtonStyle: {
        justifyContent: 'center',
        marginTop: Sizes.fixPadding * 2.5,
        marginHorizontal: Sizes.fixPadding * 2.0,
        borderRadius: Sizes.fixPadding - 5.0
    },
    logoStyle: {
        width: 200,
        height: 200,
        alignSelf: 'center',
        marginBottom: Sizes.fixPadding * 2,
    },
    disabledButton: {
        opacity: 0.7,
    },
    footerTextContainer: {
        marginTop: Sizes.fixPadding * 2,
        marginHorizontal: Sizes.fixPadding * 2.0,
        alignItems: 'center',
    },
    footerText: {
        textAlign: 'center',
        ...Fonts.grayColor14Medium,
        lineHeight: 20,
    },
    linkText: {
        color: Colors.primaryColor,
        textDecorationLine: 'underline',
    },
})

export default SigninScreen;