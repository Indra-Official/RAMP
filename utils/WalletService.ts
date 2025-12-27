import 'react-native-get-random-values';

import { Wallet } from 'ethers';

export const createWallet = () => {
  const newWallet: any = Wallet.createRandom();

  return {
    address: newWallet.address,        
    privateKey: newWallet.privateKey,  
    mnemonic: newWallet.mnemonic.phrase
  };
};
