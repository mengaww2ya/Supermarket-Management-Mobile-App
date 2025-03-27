import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import React from 'react'
const ios = Platform.OS === 'ios';
export default function CustomKeyboardAvoidingView({ children, inChat }) {
    let kevconfig = {};
    let scrollViewConfig = {};
    if (inChat) {
        kevconfig = { keyboardVerticalOffset: 90 };
        scrollViewConfig = { contentContainerStyle: { flex: 1 } };
    }
    return (
        <KeyboardAvoidingView behavior={ios ? 'padding' : 'height'}
            style={{ flex: 1 }}
            {...kevconfig}
        >
            <ScrollView
                style={{ flex: 1 }}
                bounces={false}
                showsHorizontalScrollIndicator={false}
               {...scrollViewConfig}
            >
                {
                    children
                }
            </ScrollView>
        </KeyboardAvoidingView>
  )
}