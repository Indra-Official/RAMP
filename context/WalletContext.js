import React, { createContext, useState, useContext } from 'react';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [activeWallet, setActiveWallet] = useState(null);

  const unlockWallet = (wallet) => {
    console.log("Wallet Unlocked:", wallet.address);
    setActiveWallet(wallet);
  };

  const logout = () => {
    setActiveWallet(null);
  };

  return (
    <WalletContext.Provider value={{ activeWallet, unlockWallet, logout }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
