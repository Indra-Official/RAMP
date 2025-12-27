import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
  useColorScheme
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { Wallet } from 'ethers';
import { useWallet } from '../context/WalletContext'; // Ensure this path is correct

// --- UTILITY FUNCTIONS (Internal) ---
const STORAGE_KEY = 'my_app_wallets_v1';

const getStoredWallets = async () => {
  try {
    const json = await SecureStore.getItemAsync(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) { return []; }
};

const saveNewWallet = async (walletData: any, name: string, pin: string) => {
  const existing = await getStoredWallets();
  const newWallet = {
    id: Date.now().toString(),
    name: name || `Wallet ${existing.length + 1}`,
    address: walletData.address,
    privateKey: walletData.privateKey,
    mnemonic: walletData.mnemonic,
    pin: pin
  };
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify([...existing, newWallet]));
  return newWallet;
};

const createEthersWallet = () => {
  const w = Wallet.createRandom();
  return { address: w.address, privateKey: w.privateKey, mnemonic: w.mnemonic?.phrase };
};

// --- MAIN COMPONENT ---
export default function AuthScreen() {
  const { unlockWallet } = useWallet(); // Get context function
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = {
    bg: isDark ? '#000' : '#F2F2F7',
    card: isDark ? '#1C1C1E' : '#FFF',
    text: isDark ? '#FFF' : '#000',
    subText: isDark ? '#8E8E93' : '#666',
    border: isDark ? '#38383A' : '#E5E5EA'
  };

  const statusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;

  const [activeTab, setActiveTab] = useState<'login' | 'create'>('login');
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Login State
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [loginPin, setLoginPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  // Create State
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [createdWallet, setCreatedWallet] = useState<any>(null); // To show mnemonic

  // Load wallets on mount and tab switch
  useEffect(() => {
    if (activeTab === 'login') loadWallets();
  }, [activeTab]);

  const loadWallets = async () => {
    setLoading(true);
    const list = await getStoredWallets();
    setWallets(list);
    setLoading(false);
  };

  // --- ACTIONS ---

  const handleLoginAttempt = (wallet: any) => {
    setSelectedWallet(wallet);
    setLoginPin('');
    setShowPinModal(true);
  };

  const verifyLoginPin = () => {
    if (loginPin === selectedWallet.pin) {
      setShowPinModal(false);
      unlockWallet(selectedWallet); // Set global context
      router.replace('/home'); // GO TO APP
    } else {
      Alert.alert("Error", "Incorrect PIN");
      setLoginPin('');
    }
  };

  const handleCreate = async () => {
    if (newPin.length < 4) return Alert.alert("Error", "PIN must be 4 digits");
    setLoading(true);
    setTimeout(async () => {
      try {
        const w = createEthersWallet();
        await saveNewWallet(w, newName, newPin);
        setCreatedWallet(w); // Show success screen
        setLoading(false);
      } catch (e) {
        Alert.alert("Error", "Failed to create wallet");
        setLoading(false);
      }
    }, 100);
  };

  const finishCreation = () => {
    setCreatedWallet(null);
    setNewName('');
    setNewPin('');
    setActiveTab('login'); // Switch back to login list
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={{ height: statusBarHeight }} />
      {/* 1. TOP TABS */}
      <View style={styles.tabContainer}>
        <Pressable 
          onPress={() => setActiveTab('login')} 
          style={[styles.tab, activeTab === 'login' && styles.activeTab]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'login' ? '#fff' : theme.text }]}>My Wallets</Text>
        </Pressable>
        <Pressable 
          onPress={() => setActiveTab('create')} 
          style={[styles.tab, activeTab === 'create' && styles.activeTab]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'create' ? '#fff' : theme.text }]}>Create New</Text>
        </Pressable>
      </View>

      {/* 2. LOGIN LIST VIEW */}
      {activeTab === 'login' && (
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 50}} />
          ) : wallets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{color: theme.subText, fontSize: 16}}>No wallets found.</Text>
              <Text style={{color: theme.subText, fontSize: 14, marginTop: 8}}>Go to "Create New" tab.</Text>
            </View>
          ) : (
            <FlatList
              data={wallets}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingBottom: 50 }}
              renderItem={({ item }) => (
                <Pressable 
                  style={[styles.card, { backgroundColor: theme.card }]} 
                  onPress={() => handleLoginAttempt(item)}
                >
                  <View style={styles.avatar}>
                    <Text style={{fontSize: 20, fontWeight:'bold', color:'#555'}}>{item.name.charAt(0)}</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name}</Text>
                    <Text style={{ color: theme.subText, fontSize: 12, fontFamily: 'monospace' }}>
                      {item.address.substring(0, 8)}...{item.address.substring(38)}
                    </Text>
                  </View>
                  <Text style={{fontSize: 24, color: theme.subText}}>›</Text>
                </Pressable>
              )}
            />
          )}
        </View>
      )}

      {/* 3. CREATE FORM VIEW */}
      {activeTab === 'create' && (
        <View style={styles.content}>
          {!createdWallet ? (
            <View style={{ padding: 20 }}>
              <Text style={[styles.label, {color: theme.subText}]}>Wallet Name</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="Main Account"
                placeholderTextColor={theme.subText}
                value={newName}
                onChangeText={setNewName}
              />

              <Text style={[styles.label, {color: theme.subText}]}>Set 4-Digit PIN</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="1234"
                placeholderTextColor={theme.subText}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                value={newPin}
                onChangeText={setNewPin}
              />

              <Pressable style={styles.btnMain} onPress={handleCreate}>
                {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnText}>Generate Wallet</Text>}
              </Pressable>
            </View>
          ) : (
            <View style={{ padding: 20, alignItems:'center' }}>
              <Text style={{fontSize: 22, fontWeight:'bold', color:'#34C759', marginBottom:10}}>Success!</Text>
              <Text style={{color: theme.text, textAlign:'center', marginBottom:20}}>
                Write down these 12 words. You will never see them again.
              </Text>
              
              <View style={{backgroundColor: theme.card, padding: 20, borderRadius: 12, width:'100%', marginBottom: 30}}>
                <Text style={{color: theme.text, fontSize: 16, lineHeight: 24, textAlign:'center'}}>
                  {createdWallet.mnemonic}
                </Text>
              </View>

              <Pressable style={styles.btnMain} onPress={finishCreation}>
                <Text style={styles.btnText}>I Saved It. Continue.</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* 4. PIN MODAL (For Login) */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Enter PIN</Text>
            <Text style={{ color: theme.subText, marginBottom: 20 }}>Unlock {selectedWallet?.name}</Text>

            <TextInput
              style={[styles.pinInput, { color: theme.text, borderColor: theme.border }]}
              value={loginPin}
              onChangeText={setLoginPin}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              autoFocus
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width:'100%' }}>
              <Pressable onPress={() => setShowPinModal(false)} style={{padding: 15}}>
                <Text style={{color: theme.subText, fontSize: 16}}>Cancel</Text>
              </Pressable>
              <Pressable onPress={verifyLoginPin} style={{padding: 15}}>
                <Text style={{color: '#007AFF', fontWeight:'bold', fontSize: 16}}>Unlock</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContainer: {
    flexDirection: 'row', margin: 16, backgroundColor: 'rgba(120,120,128,0.12)', 
    borderRadius: 8, padding: 2
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: '#007AFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },
  tabText: { fontWeight: '600', fontSize: 14 },
  content: { flex: 1 },
  
  // List
  emptyState: { alignItems:'center', marginTop: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 16, 
    marginBottom: 12, borderRadius: 12, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:4
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor:'#E1E1E6', 
    justifyContent:'center', alignItems:'center', marginRight: 16
  },
  cardTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },

  // Form
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16, textTransform:'uppercase' },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 16 },
  btnMain: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems:'center', marginTop: 30 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', padding: 24, borderRadius: 16, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  pinInput: { 
    fontSize: 28, fontWeight: 'bold', letterSpacing: 8, textAlign: 'center', 
    borderBottomWidth: 2, width: 120, marginBottom: 30 
  }
});
