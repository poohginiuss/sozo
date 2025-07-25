import React, { useState } from "react";
import { Dimensions, TextInput, View, Modal, ScrollView, StatusBar, TouchableOpacity, Image, Text, StyleSheet, ImageBackground, Platform, KeyboardAvoidingView, Linking, ActivityIndicator, Alert } from "react-native";
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Sizes } from "../../../constants/styles";
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Switch } from 'react-native-paper';
import { Slider } from '@miblanchard/react-native-slider';
import { useNavigation } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../../services/authService";
import * as WebBrowser from 'expo-web-browser';
import * as Network from 'expo-network';

const { width } = Dimensions.get('window');

const SettingsScreen = () => {

    const navigation = useNavigation();
    const { user, signOut, updateEmail, deleteAccount } = useAuth();

    const [state, setState] = useState({
        email: user.email || 'music@gmail.com',
        password: '••••••••••',
        sleepTime: false,
        musicQuality: 80,
        darkMode: false,
        facebookConnection: true,
        twitterConnection: false,
        instagramConnection: true,
        showEmailDialog: false,
        editableEmail: user.email || 'music@gmail.com',
        showPasswordDialog: false,
        oldPassword: null,
        newPassord: null,
        confirmPassword: null,
        showLogoutDialog: false,
        isUpdatingEmail: false,
        isUpdatingPassword: false,
        showDeleteAccountDialog: false,
        showDeleteConfirmationDialog: false,
        deleteAccountPassword: '',
        deleteConfirmationText: '',
        isDeletingAccount: false,
    })

    const updateState = (data) => setState((state) => ({ ...state, ...data }))

    const {
        email,
        password,
        sleepTime,
        musicQuality,
        darkMode,
        facebookConnection,
        twitterConnection,
        instagramConnection,
        showEmailDialog,
        editableEmail,
        showPasswordDialog,
        oldPassword,
        newPassord,
        confirmPassword,
        showLogoutDialog,
        isUpdatingEmail,
        isUpdatingPassword,
        showDeleteAccountDialog,
        showDeleteConfirmationDialog,
        deleteAccountPassword,
        deleteConfirmationText,
        isDeletingAccount,
    } = state;

    const styles = StyleSheet.create({
        headerWrapStyle: {
            flexDirection: 'row',
            alignItems: 'center',
            marginHorizontal: Sizes.fixPadding * 2.0,
            marginTop: Sizes.fixPadding,
            marginBottom: Sizes.fixPadding * 2.0,
        },
        backButtonStyle: {
            width: 28,
            height: 28,
            alignItems: 'center',
            justifyContent: 'center',
        },
        songProcessSliderWrapStyle: {
            flex: 1,
            alignItems: 'stretch',
            justifyContent: 'center',
            marginTop: Sizes.fixPadding - 5.0,
        },
        dialogWrapStyle: {
            backgroundColor: Colors.whiteColor,
            alignItems: 'center',
            paddingHorizontal: Sizes.fixPadding * 2.0,
            paddingBottom: Sizes.fixPadding * 2.0,
            borderRadius: Sizes.fixPadding
        },
        cancelButtonStyle: {
            flex: 0.50,
            backgroundColor: '#E2E2E2',
            borderRadius: Sizes.fixPadding - 5.0,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: Sizes.fixPadding,
            marginRight: Sizes.fixPadding + 5.0,
        },
        okButtonStyle: {
            flex: 0.50,
            borderRadius: Sizes.fixPadding - 5.0,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: Sizes.fixPadding + 5.0
        },
        okButtonGradientStyle: {
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            width: '100%',
            borderRadius: Sizes.fixPadding - 5.0,
        },
        textFieldStyle: {
            ...Fonts.blackColor13Medium,
            paddingBottom: Sizes.fixPadding - 2.0,
            borderBottomColor: Colors.grayColor,
            borderBottomWidth: 0.70,
        },
        commonRowStyle: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: Sizes.fixPadding
        },
        socialIconsContainer: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            paddingVertical: Sizes.fixPadding,
        },
        socialIconButton: {
            padding: Sizes.fixPadding,
            borderRadius: 50,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
        }
    });

    const handleEmailUpdate = async () => {
        if (!editableEmail || editableEmail === email) {
            updateState({ showEmailDialog: false });
            return;
        }

        updateState({ isUpdatingEmail: true });

        try {
            // When updating email, send current email and a placeholder password
            const result = await authService.updateCredentials(email, editableEmail, null);
            
            if (result.success) {
                updateState({ 
                    showEmailDialog: false, 
                    email: editableEmail,
                    isUpdatingEmail: false 
                });
                await updateEmail(editableEmail);
                Alert.alert('Success', 'Email updated successfully!');
            } else {
                Alert.alert('Error', result.error);
                updateState({ isUpdatingEmail: false });
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
            updateState({ isUpdatingEmail: false });
        }
    };

    const handlePasswordUpdate = async () => {
        if (!newPassord || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all password fields');
            return;
        }

        if (newPassord !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        updateState({ isUpdatingPassword: true });

        try {
            // When updating password, send current email and new password
            const result = await authService.updateCredentials(email, null, newPassord);
            
            if (result.success) {
                updateState({
                    showPasswordDialog: false,
                    oldPassword: null,
                    newPassord: null,
                    confirmPassword: null,
                    isUpdatingPassword: false
                });
                Alert.alert('Success', 'Password updated successfully!');
            } else {
                Alert.alert('Error', result.error);
                updateState({ isUpdatingPassword: false });
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
            updateState({ isUpdatingPassword: false });
        }
    };

    const handleDeleteAccount = async () => {
        if (!deleteAccountPassword) {
            Alert.alert('Error', 'Please enter your password to delete your account');
            return;
        }

        if (deleteConfirmationText !== 'DELETE') {
            Alert.alert('Error', 'Please type "DELETE" to confirm account deletion');
            return;
        }

        // Check network connectivity
        const networkState = await Network.getNetworkStateAsync();
        if (!networkState.isConnected) {
            Alert.alert('No Internet Connection', 'Please check your internet connection and try again.');
            return;
        }

        updateState({ isDeletingAccount: true });

        try {
            const result = await authService.deleteAccount(email, deleteAccountPassword);
            
            if (result.success) {
                updateState({
                    showDeleteAccountDialog: false,
                    showDeleteConfirmationDialog: false,
                    deleteAccountPassword: '',
                    deleteConfirmationText: '',
                    isDeletingAccount: false
                });
                
                // Clear all user data using context method
                await deleteAccount();
                
                Alert.alert(
                    'Account Deleted',
                    'Your account has been successfully deleted. All your data has been permanently removed.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Navigate to sign in screen
                                navigation.navigate('auth/signinScreen');
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Error', result.error || 'Failed to delete account. Please try again.');
                updateState({ isDeletingAccount: false });
            }
        } catch (error) {
            console.error('Delete account error:', error);
            Alert.alert('Error', 'An unexpected error occurred while deleting your account. Please try again.');
            updateState({ isDeletingAccount: false });
        }
    };

    // Add debounce state for logout and delete
    const [logoutPressed, setLogoutPressed] = useState(false);
    const [deletePressed, setDeletePressed] = useState(false);

    return (
        <LinearGradient
            start={{ x: 1, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            colors={[
                'rgb(60, 65, 66)',
                'rgb(60, 65, 66)'
            ]}
            style={{ flex: 1 }}
        >
            <StatusBar translucent backgroundColor='transparent' barStyle={'light-content'} />
            <View style={{ flex: 1 }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingTop: 100.0,
                        paddingBottom: Sizes.fixPadding * 10.0, // Increased padding for bottom player
                    }}
                >
                    {header()}
                    {userAccountInfo()}
                    {divider()}
                    {connectionsInfo()}
                    {divider()}
                    {legalInfo()}
                    {divider()}
                    {logoutText()}
                </ScrollView>
            </View>
            {editEmailDialog()}
            {editPasswordDialog()}
            {logoutDialog()}
            {deleteAccountDialog()}
            {deleteConfirmationDialog()}
        </LinearGradient>
    )

    function logoutDialog() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={showLogoutDialog}
                onRequestClose={() => {
                    updateState({ showLogoutDialog: false })
                }}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                        updateState({ showLogoutDialog: false });
                    }}
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                    <View style={{ justifyContent: "center", flex: 1 }}>
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => { }}
                            style={{ width: '80%', alignSelf: 'center' }}
                        >
                            <View style={styles.dialogWrapStyle}>
                                <Text style={{
                                    textAlign: 'center',
                                    ...Fonts.blackColor18Bold,
                                    paddingTop: Sizes.fixPadding * 2.0,
                                }}>
                                    Are you sure want to Logout?
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Sizes.fixPadding * 2.0 }}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => updateState({ showLogoutDialog: false })}
                                        style={styles.cancelButtonStyle}
                                    >
                                        <Text style={{ ...Fonts.blackColor15Bold }}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={async () => {
                                            updateState({ showLogoutDialog: false })
                                            await signOut();
                                            navigation.push('auth/signinScreen');
                                        }}
                                        style={styles.okButtonStyle}
                                    >
                                        <LinearGradient
                                            start={{ x: 1, y: 0 }}
                                            end={{ x: 0, y: 0 }}
                                            colors={[
                                                'rgba(255, 124, 0,1)',
                                                'rgba(41, 10, 89, 0.9)',
                                            ]}
                                            style={styles.okButtonGradientStyle}
                                        >
                                            <Text style={{ ...Fonts.whiteColor15Bold }}>
                                                Logout
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        )
    }

    function editPasswordDialog() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={showPasswordDialog}
                onRequestClose={() => {
                    updateState({ showPasswordDialog: false })
                }}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                        updateState({ showPasswordDialog: false });
                    }}
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                    <KeyboardAvoidingView
                        behavior="padding"
                        style={{ justifyContent: "center", flex: 1 }}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => { }}
                            style={{ width: '80%', alignSelf: 'center' }}
                        >
                            <View style={styles.dialogWrapStyle}>
                                <Text style={{
                                    ...Fonts.blackColor18Bold,
                                    paddingVertical: Sizes.fixPadding * 2.0,
                                }}>
                                    Change Your Password
                                </Text>
                                <View style={{ width: '100%' }}>
                                    <TextInput
                                        secureTextEntry={true}
                                        placeholder="Old Password"
                                        placeholderTextColor={Colors.grayColor}
                                        selectionColor={Colors.primaryColor}
                                        value={oldPassword}
                                        onChangeText={(value) => updateState({ oldPassword: value })}
                                        style={[styles.textFieldStyle, { color: Colors.blackColor }]}
                                        numberOfLines={1}
                                        editable={!isUpdatingPassword}
                                    />
                                </View>
                                <View style={{ width: '100%' }}>
                                    <TextInput
                                        secureTextEntry={true}
                                        selectionColor={Colors.primaryColor}
                                        placeholder="New Password"
                                        placeholderTextColor={Colors.grayColor}
                                        value={newPassord}
                                        onChangeText={(value) => updateState({ newPassord: value })}
                                        style={[{ marginVertical: Sizes.fixPadding }, styles.textFieldStyle, { color: Colors.blackColor }]}
                                        numberOfLines={1}
                                        editable={!isUpdatingPassword}
                                    />
                                </View>
                                <View style={{ width: '100%' }}>
                                    <TextInput
                                        secureTextEntry={true}
                                        selectionColor={Colors.primaryColor}
                                        placeholder="Confirm New Password"
                                        placeholderTextColor={Colors.grayColor}
                                        value={confirmPassword}
                                        onChangeText={(value) => updateState({ confirmPassword: value })}
                                        style={[styles.textFieldStyle, { color: Colors.blackColor }]}
                                        numberOfLines={1}
                                        editable={!isUpdatingPassword}
                                    />
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Sizes.fixPadding * 2.0 }}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => updateState({
                                            showPasswordDialog: false,
                                            oldPassword: null, newPassord: null, confirmPassword: null
                                        })}
                                        style={[styles.cancelButtonStyle, isUpdatingPassword && { opacity: 0.5 }]}
                                        disabled={isUpdatingPassword}
                                    >
                                        <Text style={{ ...Fonts.blackColor15Bold }}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={handlePasswordUpdate}
                                        style={[styles.okButtonStyle, isUpdatingPassword && { opacity: 0.7 }]}
                                        disabled={isUpdatingPassword}
                                    >
                                        <LinearGradient
                                            start={{ x: 1, y: 0 }}
                                            end={{ x: 0, y: 0 }}
                                            colors={[
                                                'rgba(255, 124, 0,1)',
                                                'rgba(41, 10, 89, 0.9)',
                                            ]}
                                            style={styles.okButtonGradientStyle}
                                        >
                                            {isUpdatingPassword ? (
                                                <ActivityIndicator size="small" color={Colors.whiteColor} />
                                            ) : (
                                                <Text style={{ ...Fonts.whiteColor15Bold }}>
                                                    Update
                                                </Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </TouchableOpacity>
            </Modal>
        )
    }

    function editEmailDialog() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={showEmailDialog}
                onRequestClose={() => {
                    updateState({ showEmailDialog: false })
                }}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                        updateState({ showEmailDialog: false });
                    }}
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                    <KeyboardAvoidingView
                        behavior="padding"
                        style={{ justifyContent: "center", flex: 1 }}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => { }}
                            style={{ alignSelf: 'center', width: '80%', }}
                        >
                            <View style={styles.dialogWrapStyle}>
                                <Text style={{
                                    ...Fonts.blackColor18Bold,
                                    paddingVertical: Sizes.fixPadding * 2.0,
                                }}>
                                    Change Email
                                </Text>
                                <View style={{ width: '100%' }}>
                                    <TextInput
                                        selectionColor={Colors.primaryColor}
                                        value={editableEmail}
                                        onChangeText={(value) => updateState({ editableEmail: value })}
                                        style={[styles.textFieldStyle, { color: Colors.blackColor }]}
                                        numberOfLines={1}
                                        editable={!isUpdatingEmail}
                                    />
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Sizes.fixPadding * 2.0 }}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => updateState({ showEmailDialog: false, editableEmail: email })}
                                        style={[styles.cancelButtonStyle, isUpdatingEmail && { opacity: 0.5 }]}
                                        disabled={isUpdatingEmail}
                                    >
                                        <Text style={{ ...Fonts.blackColor15Bold }}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={handleEmailUpdate}
                                        style={[styles.okButtonStyle, isUpdatingEmail && { opacity: 0.7 }]}
                                        disabled={isUpdatingEmail}
                                    >
                                        <LinearGradient
                                            start={{ x: 1, y: 0 }}
                                            end={{ x: 0, y: 0 }}
                                            colors={[
                                                'rgba(255, 124, 0,1)',
                                                'rgba(41, 10, 89, 0.9)',
                                            ]}
                                            style={styles.okButtonGradientStyle}
                                        >
                                            {isUpdatingEmail ? (
                                                <ActivityIndicator size="small" color={Colors.whiteColor} />
                                            ) : (
                                                <Text style={{ ...Fonts.whiteColor15Bold }}>
                                                    Update
                                                </Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </TouchableOpacity>
            </Modal>
        )
    }

    function logoutText() {
        return (
            <View style={{ marginTop: Sizes.fixPadding * 2.0, marginBottom: Sizes.fixPadding * 2.0 }}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                        marginBottom: Sizes.fixPadding * 2.0,
                        marginHorizontal: Sizes.fixPadding * 2.0,
                        paddingVertical: Sizes.fixPadding + 2,
                        borderRadius: 8,
                        backgroundColor: '#fff',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#FF9800',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        elevation: 2,
                    }}
                    disabled={logoutPressed}
                    onPress={() => {
                        if (logoutPressed) return;
                        setLogoutPressed(true);
                        updateState({ showLogoutDialog: true });
                        setTimeout(() => setLogoutPressed(false), 1000);
                    }}
                    accessibilityLabel="Logout"
                    accessibilityHint="Sign out of your account"
                >
                    <MaterialIcons name="logout" size={20} color="#FF9800" style={{ marginRight: 8 }} />
                    <Text style={{ ...Fonts.redColor14SemiBold, color: '#FF9800' }}>
                        Logout
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                        marginHorizontal: Sizes.fixPadding * 2.0,
                        paddingVertical: Sizes.fixPadding + 2,
                        borderRadius: 8,
                        backgroundColor: '#FFF5F5',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#FF4444',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        elevation: 2,
                    }}
                    disabled={deletePressed}
                    onPress={() => {
                        if (deletePressed) return;
                        setDeletePressed(true);
                        updateState({ showDeleteAccountDialog: true });
                        setTimeout(() => setDeletePressed(false), 1000);
                    }}
                    accessibilityLabel="Delete Account"
                    accessibilityHint="Permanently delete your account and all associated data."
                >
                    <MaterialIcons name="delete-forever" size={20} color="#FF4444" style={{ marginRight: 8 }} />
                    <Text style={{ ...Fonts.redColor14SemiBold, color: '#FF4444', textDecorationLine: 'underline' }}>
                        Delete Account
                    </Text>
                </TouchableOpacity>
            </View>
        )
    }

    function connectionsInfo() {
        return (
          <View style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}>
            <Text style={{ ...Fonts.whiteColor15Bold, marginBottom: Sizes.fixPadding }}>
              CONNECTIONS
            </Text>
      
            <View style={styles.socialIconsContainer}>
              {/* Facebook */}
              <TouchableOpacity
                style={styles.socialIconButton}
                onPress={() => WebBrowser.openBrowserAsync('https://www.facebook.com/SozoRadioNC/')}>
                <FontAwesome name="facebook" size={24} color="#3b5998" />
              </TouchableOpacity>
      
              {/* Instagram */}
              <TouchableOpacity
                style={styles.socialIconButton}
                onPress={() => WebBrowser.openBrowserAsync('https://www.instagram.com/sozoradio/')}>
                <FontAwesome name="instagram" size={24} color="#C13584" />
              </TouchableOpacity>
      
              {/* Website 
              <TouchableOpacity
                style={styles.socialIconButton}
                onPress={() => WebBrowser.openBrowserAsync('https://www.sozoradio.org/')}>
                <Ionicons name="earth" size={24} color="#4CAF50" />
              </TouchableOpacity>
              */}
      
              {/* Call */}
              <TouchableOpacity
                style={styles.socialIconButton}
                onPress={() => Linking.openURL('tel:+12527587355')}>
                <Ionicons name="call" size={24} color="#0A84FF" />
              </TouchableOpacity>
      
              {/* Email */}
              <TouchableOpacity
                style={styles.socialIconButton}
                onPress={() => Linking.openURL('mailto:info@sozoradio.org')}>
                <Ionicons name="mail" size={24} color="#EA4335" />
              </TouchableOpacity>
            </View>
          </View>
        );
      }      

    function legalInfo() {
        return (
            <View style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}>
                <Text style={{ ...Fonts.whiteColor15Bold }}>
                    LEGAL
                </Text>
            
                <TouchableOpacity
                    onPress={() => WebBrowser.openBrowserAsync('https://www.sozoradio.org/privacy-policy')}
                    style={{ marginTop: Sizes.fixPadding }}
                >
                    <Text style={{ ...Fonts.grayColor13SemiBold }}>
                        Privacy Policy
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => WebBrowser.openBrowserAsync('https://www.sozoradio.org/terms-of-service')}
                    style={{ marginTop: Sizes.fixPadding }}
                >
                    <Text style={{ ...Fonts.grayColor13SemiBold }}>
                        Terms of Service
                    </Text>
                </TouchableOpacity>

                {/* Removed duplicate Delete Account button from legal section */}
            </View>
        );
    }
          

    function darkModeInfo() {
        return (
            <View style={styles.commonRowStyle}>
                <Text style={{ flex: 1, ...Fonts.whiteColor14SemiBold }}>
                    Dark Mode
                </Text>
                <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 20,
                }}>
                    <Switch
                        trackColor={{ true: Colors.grayColor, false: Colors.grayColor }}
                        style={{ transform: [{ scale: Platform.OS == 'ios' ? 0.5 : 0.8 }], }}
                        color='#D81B60'
                        value={darkMode}
                        onValueChange={() => updateState({ darkMode: !darkMode })}
                        thumbColor={darkMode ? '#D81B60' : Colors.whiteColor}
                    />
                </View>
            </View>
        )
    }

    function playBackInfo() {
        return (
            <View style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}>
                <Text style={{ ...Fonts.whiteColor15Bold }}>
                    PLAYBACK
                </Text>
                {sleepTimeInfo()}
                {musicQualityInfo()}
            </View>
        )
    }

    function musicQualityInfo() {
        return (
            <>
                <View style={styles.commonRowStyle}>
                    <Text style={{ flex: 1, ...Fonts.whiteColor14SemiBold }}>
                        Music Quality
                    </Text>
                    <Text style={{ ...Fonts.grayColor12SemiBold }}>
                        HIGH
                    </Text>
                </View>
                <View style={styles.songProcessSliderWrapStyle}>
                    <Slider
                        value={musicQuality}
                        onValueChange={(value) => updateState({ musicQuality: value })}
                        maximumValue={100}
                        minimumValue={0}
                        containerStyle={{ height: 12.0 }}
                        minimumTrackTintColor={Colors.primaryColor}
                        maximumTrackTintColor={Colors.secondaryColor}
                        thumbTintColor={Colors.secondaryColor}
                        trackStyle={{ height: 3.0, }}
                        thumbStyle={{ height: 15, width: 15, backgroundColor: Colors.primaryColor }}
                    />
                </View>
            </>
        )
    }

    function sleepTimeInfo() {
        return (
            <View style={styles.commonRowStyle}>
                <Text style={{ flex: 1, ...Fonts.whiteColor14SemiBold }}>
                    Sleep Time
                </Text>
                <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 20,
                }}>
                    <Switch
                        trackColor={{ true: Colors.grayColor, false: Colors.grayColor }}
                        style={{ transform: [{ scale: Platform.OS == 'ios' ? 0.5 : 0.8 }] }}
                        color='#D81B60'
                        value={sleepTime}
                        onValueChange={() => updateState({ sleepTime: !sleepTime })}
                        thumbColor={sleepTime ? '#D81B60' : Colors.whiteColor}
                    />
                </View>
            </View>
        )
    }

    function divider() {
        return (
            <View
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    height: 1.0,
                    marginHorizontal: Sizes.fixPadding * 2.0,
                    marginVertical: Sizes.fixPadding + 5.0,
                }}
            />
        )
    }

    function userAccountInfo() {
        return (
            <View style={{ marginHorizontal: Sizes.fixPadding * 2.0, }}>
                <Text style={{ marginVertical: Sizes.fixPadding, ...Fonts.whiteColor15Bold }}>
                    USER ACCOUNT
                </Text>
                <View style={{ marginBottom: Sizes.fixPadding - 5.0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ ...Fonts.whiteColor13SemiBold }}>
                        {email}
                    </Text>
                    <Text
                        onPress={() => updateState({ showEmailDialog: true })}
                        style={{ ...Fonts.grayColor12SemiBold }}
                    >
                        EDIT
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ ...Fonts.whiteColor13SemiBold }}>
                        {password}
                    </Text>
                    <Text
                        onPress={() => updateState({ showPasswordDialog: true })}
                        style={{ ...Fonts.grayColor12SemiBold }}
                    >
                        EDIT
                    </Text>
                </View>
            </View>
        )
    }

    function header() {
        return (
            <View style={styles.headerWrapStyle}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.goBack()}
                    style={styles.backButtonStyle}
                >
                    <MaterialIcons
                        name="keyboard-arrow-left"
                        size={28}
                        color={Colors.whiteColor}
                    />
                </TouchableOpacity>
                <Text style={{ ...Fonts.whiteColor18Bold, flex: 1, textAlign: 'center', marginRight: 28 }}>
                    Settings
                </Text>
            </View>
        )
    }

    function deleteAccountDialog() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={showDeleteAccountDialog}
                onRequestClose={() => {
                    updateState({ showDeleteAccountDialog: false, deleteAccountPassword: '' })
                }}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                        updateState({ showDeleteAccountDialog: false, deleteAccountPassword: '' });
                    }}
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                    <KeyboardAvoidingView
                        behavior="padding"
                        style={{ justifyContent: "center", flex: 1 }}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => { }}
                            style={{ width: '80%', alignSelf: 'center' }}
                        >
                            <View style={styles.dialogWrapStyle}>
                                <View style={{ alignSelf: 'center' }}>
                                    <MaterialIcons name="warning" size={40} color="#FF6B6B" />
                                </View>
                                <Text style={{
                                    textAlign: 'center',
                                    ...Fonts.blackColor18Bold,
                                    paddingTop: Sizes.fixPadding,
                                    marginBottom: Sizes.fixPadding
                                }}>
                                    Delete Account
                                </Text>
                                <Text style={{
                                    textAlign: 'center',
                                    ...Fonts.blackColor14Medium,
                                    marginBottom: Sizes.fixPadding * 2.0,
                                    lineHeight: 20
                                }}>
                                    This action cannot be undone. All your data will be permanently deleted from our servers.
                                    {'\n\n'}
                                    By deleting your account, you will lose:
                                    {'\n'}• All your saved preferences and settings
                                    {'\n'}• Your subscription (if applicable)
                                    {'\n'}• Access to all associated services
                                </Text>
                                <Text style={{
                                    textAlign: 'left',
                                    ...Fonts.blackColor14Medium,
                                    marginBottom: Sizes.fixPadding - 5.0
                                }}>
                                    Enter your password to continue:
                                </Text>
                                <TextInput
                                    value={deleteAccountPassword}
                                    onChangeText={(text) => updateState({ deleteAccountPassword: text })}
                                    placeholder="Enter your password"
                                    placeholderTextColor={Colors.grayColor}
                                    style={[styles.textFieldStyle, { 
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        paddingHorizontal: Sizes.fixPadding,
                                        paddingVertical: Sizes.fixPadding - 2.0,
                                        borderRadius: 5,
                                        borderWidth: 1,
                                        borderColor: Colors.grayColor,
                                        borderBottomWidth: 1
                                    }]}
                                    secureTextEntry={true}
                                    autoCapitalize="none"
                                    accessibilityLabel="Password"
                                    accessibilityHint="Enter your password to confirm account deletion"
                                    autoFocus={true}
                                />
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Sizes.fixPadding * 2.0 }}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => updateState({ showDeleteAccountDialog: false, deleteAccountPassword: '' })}
                                        style={styles.cancelButtonStyle}
                                    >
                                        <Text style={{ ...Fonts.blackColor15Bold }}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            updateState({ showDeleteAccountDialog: false, showDeleteConfirmationDialog: true });
                                        }}
                                        style={[styles.okButtonStyle, { backgroundColor: '#FF6B6B' }]}
                                    >
                                        <Text style={{ ...Fonts.whiteColor15Bold }}>
                                            Continue
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </TouchableOpacity>
            </Modal>
        )
    }

    function deleteConfirmationDialog() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={showDeleteConfirmationDialog}
                onRequestClose={() => {
                    updateState({ showDeleteConfirmationDialog: false, deleteAccountPassword: '', deleteConfirmationText: '' })
                }}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                        updateState({ showDeleteConfirmationDialog: false, deleteAccountPassword: '', deleteConfirmationText: '' });
                    }}
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                    <View style={{ justifyContent: "center", flex: 1 }}>
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => { }}
                            style={{ width: '80%', alignSelf: 'center' }}
                        >
                            <View style={styles.dialogWrapStyle}>
                                <View style={{ alignSelf: 'center' }}>
                                    <MaterialIcons name="delete-forever" size={50} color="#FF4444" />
                                </View>
                                <Text style={{
                                    textAlign: 'center',
                                    ...Fonts.blackColor18Bold,
                                    paddingTop: Sizes.fixPadding,
                                    marginBottom: Sizes.fixPadding
                                }}>
                                    Final Confirmation
                                </Text>
                                <Text style={{
                                    textAlign: 'center',
                                    ...Fonts.blackColor14Medium,
                                    marginBottom: Sizes.fixPadding,
                                    lineHeight: 20
                                }}>
                                    Are you absolutely sure you want to delete your account?
                                </Text>
                                <View style={{
                                    backgroundColor: '#FFF5F5',
                                    borderColor: '#FF4444',
                                    borderWidth: 1,
                                    borderRadius: 8,
                                    padding: Sizes.fixPadding,
                                    marginBottom: Sizes.fixPadding * 2.0
                                }}>
                                    <Text style={{
                                        textAlign: 'center',
                                        ...Fonts.redColor12Medium,
                                        lineHeight: 18,
                                        fontWeight: 'bold'
                                    }}>
                                        ⚠️ WARNING ⚠️
                                        {'\n\n'}
                                        • All your personal data will be permanently deleted
                                        {'\n'}
                                        • Your subscription will be cancelled
                                        {'\n'}
                                        • This action cannot be reversed
                                        {'\n'}
                                        • You will lose access to all services
                                    </Text>
                                </View>
                                <Text style={{
                                    textAlign: 'left',
                                    ...Fonts.blackColor14Medium,
                                    marginBottom: Sizes.fixPadding - 5.0
                                }}>
                                    Type "DELETE" to confirm:
                                </Text>
                                <TextInput
                                    value={deleteConfirmationText}
                                    onChangeText={(text) => updateState({ deleteConfirmationText: text })}
                                    placeholder="Type DELETE to confirm"
                                    placeholderTextColor={Colors.grayColor}
                                    style={[styles.textFieldStyle, { 
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        paddingHorizontal: Sizes.fixPadding,
                                        paddingVertical: Sizes.fixPadding - 2.0,
                                        borderRadius: 5,
                                        borderWidth: 1,
                                        borderColor: Colors.grayColor,
                                        borderBottomWidth: 1,
                                        marginBottom: Sizes.fixPadding
                                    }]}
                                    autoCapitalize="characters"
                                    accessibilityLabel="Confirmation text"
                                    accessibilityHint="Type DELETE to confirm account deletion"
                                />
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Sizes.fixPadding }}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => updateState({ showDeleteConfirmationDialog: false, deleteAccountPassword: '', deleteConfirmationText: '' })}
                                        style={styles.cancelButtonStyle}
                                    >
                                        <Text style={{ ...Fonts.blackColor15Bold }}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={handleDeleteAccount}
                                        style={[
                                            styles.okButtonStyle, 
                                            { 
                                                backgroundColor: deleteConfirmationText === 'DELETE' ? '#FF4444' : '#CCCCCC'
                                            }
                                        ]}
                                        disabled={isDeletingAccount || deleteConfirmationText !== 'DELETE'}
                                    >
                                        {isDeletingAccount ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Text style={{ 
                                                ...Fonts.whiteColor15Bold,
                                                color: deleteConfirmationText === 'DELETE' ? '#FFFFFF' : '#999999'
                                            }}>
                                                Delete Forever
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        )
    }
}

export default SettingsScreen;