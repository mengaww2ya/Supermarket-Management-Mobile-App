import { View, Text, ScrollView } from 'react-native';
import React from 'react';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function MessagesList({ messages, currentUser, ScrollViewRef }) {
    return (
        <ScrollView 
            ref={ScrollViewRef} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 10 }}
        >
            {messages.map((message, index) => {
                const isCurrentUser = currentUser?.uid === message?.uid;

                return (
                    <View 
                        key={index} 
                        className="flex-row items-center mb-3" 
                        style={{ justifyContent: isCurrentUser ? 'flex-end' : 'flex-start' }}
                    >
                        <View 
                            style={{ 
                                maxWidth: wp(70), // Adjust width dynamically
                                alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                            }}
                            className={`p-3 px-4 rounded-2xl border ${isCurrentUser ? 'bg-white border-neutral-200' : 'bg-indigo-100 border-indigo-200'}`}
                        >
                            <Text style={{ fontSize: hp(1.9) }}>
                                {message?.text}
                            </Text>
                        </View>
                    </View>
                );
            })}
        </ScrollView>
    );
}