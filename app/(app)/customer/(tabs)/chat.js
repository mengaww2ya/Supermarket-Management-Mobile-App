import { View, StatusBar, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/authContext';
import { auth, usersRef, db } from '../../../../firebase/firebaseConfig';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import ChatList from '../../../components/ChatList';
import Loading from '../../../components/Loading';
import { query, where, getDocs, onSnapshot, collection, orderBy } from 'firebase/firestore';
import HomeHeader from '../../../components/HomeHeader';
export default function Home () {
  const { user } = useAuth(auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  useEffect(() => {
    if (user?.uid) {
      fetchUsers();
    }
  }, [user?.uid]);

  useEffect(() => {
    if (searchText) {
      filterUsersBySearch(searchText);
    } else {
      setFilteredUsers(users);
    }
  }, [searchText, users]);

  const fetchUsers = async () => {
    setLoading(true); // Set loading state before fetching
    const q = query(usersRef, where('uid', '!=', user?.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let data = [];
      querySnapshot.forEach((doc) => data.push({ ...doc.data() }));
      setUsers(data);
      setFilteredUsers(data); // Initialize filtered users with all users
      setLoading(false); // Stop loading after data is received
    });

    return () => unsubscribe(); // Cleanup on unmount
  };

  const filterUsersBySearch = (text) => {
    const filtered = users.filter((user) => {
      return (
        user.fullName.toLowerCase().includes(text.toLowerCase()) ||
        user.email.toLowerCase().includes(text.toLowerCase())
      );
    });
    setFilteredUsers(filtered);
  };

  return (
    <View className="flex-1 justify-center">
      <StatusBar style="light" />
      {loading ? (
        <View className="flex items-center" style={{ top: hp(30) }}>
          <Loading size={hp(2)} />
        </View>
      ) : (
          <>
      <HomeHeader title={"Chat"}/>

          <TextInput
            style={{
              height: hp(6),
              borderWidth: 1,
              borderColor: 'lightgray',
              borderRadius: 8,
              marginHorizontal: 15,
              paddingLeft: 15,
              fontSize: 16,
              marginBottom: 10,
            }}
            placeholder="Search for users"
            value={searchText}
            onChangeText={setSearchText}
          />
          <ChatList currentUser={user} users={filteredUsers} />
        </>
      )}
    </View>
  );
};

