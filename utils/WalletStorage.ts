import * as SecureStore from 'expo-secure-store';

const KEY = 'my_app_wallets_v1';

export const getStoredWallets = async () => {
  try {
    const json = await SecureStore.getItemAsync(KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error(e); 
    return [];
  }
};

export const saveNewWallet = async (walletData : any, name : any, pin : any) => {
  const existing = await getStoredWallets();
  const newWallet = {
    id: Date.now().toString(),
    name: name || `Wallet ${existing.length + 1}`,
    address: walletData.address,
    privateKey: walletData.privateKey,
    mnemonic: walletData.mnemonic,
    pin: pin
  };
  
  await SecureStore.setItemAsync(KEY, JSON.stringify([...existing, newWallet]));
  return newWallet;
};
