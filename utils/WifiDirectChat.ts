// src/utils/WifiDirectService.ts
import { 
  initialize, 
  startDiscoveringPeers, 
  stopDiscoveringPeers,
  connect, 
  createGroup, 
  removeGroup, 
  subscribeOnConnectionInfoUpdates,
  subscribeOnPeersUpdates
} from 'react-native-wifi-p2p';
import { PermissionsAndroid, Platform } from 'react-native';
import TcpSocket from 'react-native-tcp-socket';

const PORT = 6000;
const DELIMITER = "\n";

// --- STATE ---
let serverSocket: TcpSocket.Server | null = null;
let clientSocket: TcpSocket.Socket | null = null;
let connectedSockets: TcpSocket.Socket[] = [];
let peersSubscription: any = null;
let connectionSubscription: any = null;

// --- TYPES ---
type MessageCallback = (msg: any) => void;
type StatusCallback = (status: string) => void;

// --- 1. SETUP ---
export const turnOnWifiDirect = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
        const perms = [
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES
        ];
        const granted = await PermissionsAndroid.requestMultiple(perms);
        
        // Strict check safe for all Android versions
        if (granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn("Location permission denied");
            return false;
        }
    }
    await initialize();
    return true;
  } catch (e) {
    console.error("Init Failed:", e);
    return false;
  }
};

export const turnOffWifiDirect = async () => {
  try {
    if (peersSubscription) { peersSubscription.remove(); peersSubscription = null; }
    if (connectionSubscription) { connectionSubscription.remove(); connectionSubscription = null; }

    if (serverSocket) { serverSocket.close(); serverSocket = null; }
    if (clientSocket) { clientSocket.destroy(); clientSocket = null; }
    connectedSockets = [];

    await stopDiscoveringPeers().catch(() => {});
    await removeGroup().catch(() => {});
    console.log("WiFi Direct Stopped");
  } catch (e) { console.error("Cleanup Error:", e); }
};

// --- 2. DISCOVERY ---
export const startScan = async (onPeersFound: (devices: any[]) => void) => {
    try {
        await startDiscoveringPeers();
        peersSubscription = subscribeOnPeersUpdates(({ devices }: { devices: any[] }) => {
            onPeersFound(devices);
        });
    } catch (e) { console.error("Scan Failed:", e); }
};

// --- 3. CONNECTION ---
export const connectToDevice = async (address: string) => {
    try { await connect(address); } catch (e) { console.error("Connect Failed:", e); }
};

export const hostSession = async () => {
    try { await createGroup(); } catch (e) { console.error("Host Failed:", e); }
};

// --- 4. SOCKET MANAGEMENT ---
export const listenForConnection = (onMessage: MessageCallback, onStatusChange: StatusCallback) => {
    if (connectionSubscription) return;

    connectionSubscription = subscribeOnConnectionInfoUpdates((info) => {
        console.log("P2P Update:", info);
        
        if (info.groupFormed && info.isGroupOwner) {
            onStatusChange("hosting");
            startTcpServer(onMessage);
        } else if (info.groupFormed && !info.isGroupOwner) {
            // FIX for TS(2367) & TS(2345): Handle mixed types safely
            const ownerAddr = info.groupOwnerAddress;
            let hostIp: string | null = null;

            if (typeof ownerAddr === 'string') {
                hostIp = ownerAddr;
            } else if (typeof ownerAddr === 'object' && ownerAddr !== null) {
                // Cast to 'any' momentarily to access property safely if types are outdated
                hostIp = (ownerAddr as any).hostAddress;
            }

            // Only connect if we have a valid IP
            if (hostIp && hostIp !== 'null') {
                onStatusChange("connecting_socket");
                startTcpClient(hostIp, onMessage, () => onStatusChange("connected"));
            }
        }
    });
};

const startTcpServer = (onMessage: MessageCallback) => {
    if (serverSocket) return;
    
    serverSocket = TcpSocket.createServer((socket) => {
        connectedSockets.push(socket);
        socket.on('data', (data) => {
            const chunks = data.toString().split(DELIMITER);
            chunks.forEach((chunk: string) => { // FIX TS(7006)
                if(!chunk) return;
                try {
                    const msg = JSON.parse(chunk);
                    onMessage(msg);
                    connectedSockets.forEach(s => {
                        if(s !== socket) s.write(JSON.stringify(msg) + DELIMITER);
                    });
                } catch(e){}
            });
        });
        socket.on('close', () => { connectedSockets = connectedSockets.filter(s => s !== socket); });
    });
    serverSocket.listen({ port: PORT, host: '0.0.0.0' });
};

const startTcpClient = (hostIp: string, onMessage: MessageCallback, onConnected: () => void) => {
    if (clientSocket) return;
    
    clientSocket = TcpSocket.createConnection({ port: PORT, host: hostIp }, () => {
        onConnected();
    });

    clientSocket.on('data', (data) => {
        const chunks = data.toString().split(DELIMITER);
        chunks.forEach((chunk: string) => { // FIX TS(7006)
             if(!chunk) return;
             try { onMessage(JSON.parse(chunk)); } catch(e){}
        });
    });
};

// --- 5. SEND ---
export const sendWifiMessage = (text: string) => {
    const msg = {
        id: Date.now().toString(),
        message: text,
        sender: 'You',
        time: new Date().toLocaleTimeString()
    };
    const payload = JSON.stringify(msg) + DELIMITER;

    if (clientSocket) {
        clientSocket.write(payload);
    } else if (serverSocket) {
        connectedSockets.forEach(s => s.write(payload));
    } else { return null; }
    
    return msg;
};
