import io, { Socket } from 'socket.io-client';
import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
} from 'react-native-webrtc';

// --- Interfaces ---
interface ChatMessage {
    id: string;
    text: string;
    sender: string;
    timestamp: string;
}

interface PeerConnectionState {
    pc: RTCPeerConnection;
    dc: any | null; // Data Channel
}

// --- Configuration ---
const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

const LOG_TAG = '[WebRTC 1:1]';

// --- Module State ---
let socket: any;
const activePeers = new Map<string, PeerConnectionState>();

// UI Callbacks
let onMessageReceived: ((msg: ChatMessage) => void) | null = null;

// ============================================================================
// 1. TURN ON (4 Arguments)
// ============================================================================
export const turnOnWebRTC = (
    url: string,
    onConnect: (myId: string) => void,        // Arg 2: Called when connected
    onDisconnect: () => void,                 // Arg 3: Called when disconnected
    onUserListUpdate: (users: any[]) => void  // Arg 4: Called when users change
) => {
    if (socket?.connected) {
        console.log(`${LOG_TAG} Socket already connected. Skipping init.`);
        return;
    }

    if (socket) cleanUpSocket();

    console.log(`${LOG_TAG} Connecting to ${url}...`);
    
    socket = io(url, { 
        transports: ["websocket"], 
        forceNew: true,
        reconnectionAttempts: 5
    });

    // --- A. Connection Events ---
    socket.on("connect", () => {
        console.log(`${LOG_TAG} Connected. My ID: ${socket.id}`);
        onConnect(socket.id);
    });

    socket.on("disconnect", (reason: string) => {
        console.warn(`${LOG_TAG} Disconnected: ${reason}`);
        onDisconnect(); // <--- Trigger the disconnect callback
        
        // Optional: Clean up peers on disconnect to avoid stale state
        // activePeers.forEach(p => p.pc.close());
        // activePeers.clear();
    });

    socket.on("connect_error", (err: any) => {
        console.error(`${LOG_TAG} Connection Error:`, err);
        onDisconnect(); 
    });

    // --- B. User List Event ---
    socket.on("users-list", (users: any[]) => {
        console.log(`${LOG_TAG} Active Users Updated: ${users.length} users`);
        onUserListUpdate(users); // <--- Trigger the user list callback
    });

    // --- C. WebRTC Signaling Events ---
    setupSignalingListeners();
};

// ============================================================================
// 2. CONNECT TO USER (Initiator)
// ============================================================================
export const connectToUser = async (targetUserId: string) => {
    if (activePeers.has(targetUserId)) {
        console.log(`${LOG_TAG} Already connected to ${targetUserId}`);
        return; 
    }

    console.log(`${LOG_TAG} Initiating Private Chat with ${targetUserId}`);
    
    const pc = new RTCPeerConnection(configuration);
    const dc = pc.createDataChannel("private-chat", { ordered: true });
    
    setupDataChannel(dc, targetUserId);
    activePeers.set(targetUserId, { pc, dc });
    setupPcListeners(pc, targetUserId);

    try {
        const offer = await pc.createOffer({});
        await pc.setLocalDescription(offer);

        socket.emit("offer", {
            target: targetUserId,
            from: socket.id,
            offer: offer
        });
    } catch (e) {
        console.error(`${LOG_TAG} Failed to create offer:`, e);
    }
};

// ============================================================================
// 3. SEND MESSAGE
// ============================================================================
export const sendPrivateMessage = (targetUserId: string, text: string) => {
    const peer = activePeers.get(targetUserId);

    if (!peer || !peer.dc || peer.dc.readyState !== 'open') {
        console.warn(`${LOG_TAG} Cannot send. Channel not open for ${targetUserId}`);
        return null;
    }

    const msg: ChatMessage = {
        id: Date.now().toString(),
        text,
        sender: socket.id,
        timestamp: new Date().toISOString(),
    };

    try {
        peer.dc.send(JSON.stringify(msg));
        return msg;
    } catch (e) {
        console.error(`${LOG_TAG} Send failed:`, e);
        return null;
    }
};

// ============================================================================
// 4. CLEANUP (Turn Off)
// ============================================================================
export const turnOffWebRTC = () => {
    console.log(`${LOG_TAG} Shutting down WebRTC Service...`);

    activePeers.forEach((peer, userId) => {
        console.log(`${LOG_TAG} Closing connection with ${userId}`);
        try {
            if (peer.dc) peer.dc.close();
            if (peer.pc) peer.pc.close();
        } catch (e) { console.warn("Error closing peer", e); }
    });
    activePeers.clear();

    cleanUpSocket();
    onMessageReceived = null;
};

const cleanUpSocket = () => {
    if (socket) {
        socket.disconnect();
        socket.removeAllListeners();
        socket = null;
    }
};

// ============================================================================
// 5. LISTENERS
// ============================================================================
export const setOnMessageListener = (fn: (msg: ChatMessage) => void) => {
    onMessageReceived = fn;
};

// ============================================================================
// INTERNAL HELPERS
// ============================================================================
const setupSignalingListeners = () => {
    // Offer
    socket.on("offer", async (data: any) => {
        const { offer, from } = data;
        console.log(`${LOG_TAG} Incoming Call (Offer) from ${from}`);
        await handleIncomingCall(from, offer);
    });

    // Answer
    socket.on("answer", async (data: any) => {
        const { answer, from } = data;
        const peer = activePeers.get(from);
        if (peer?.pc) {
            try {
                await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (e) { console.error("Error setting answer", e); }
        }
    });

    // ICE
    socket.on("ice-candidate", async (data: any) => {
        const { candidate, from } = data;
        const peer = activePeers.get(from);
        if (peer?.pc) {
            try {
                await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) { console.error("Error adding ICE", e); }
        }
    });
};

const handleIncomingCall = async (callerId: string, offer: any) => {
    if (activePeers.has(callerId)) {
        // Clean up existing stale connection if calling again
        const old = activePeers.get(callerId);
        old?.pc.close();
        activePeers.delete(callerId);
    }

    const pc = new RTCPeerConnection(configuration);
    activePeers.set(callerId, { pc, dc: null }); // Receiver waits for DataChannel
    setupPcListeners(pc, callerId);

    // Incoming Data Channel
    (pc as any).ondatachannel = (event: any) => {
        console.log(`${LOG_TAG} Received Data Channel from ${callerId}`);
        const peer = activePeers.get(callerId);
        if (peer) peer.dc = event.channel;
        setupDataChannel(event.channel, callerId);
    };

    try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answer", {
            target: callerId,
            from: socket.id,
            answer: answer
        });
    } catch (e) {
        console.error("Incoming call failed", e);
    }
};

const setupPcListeners = (pc: RTCPeerConnection, targetId: string) => {
    (pc as any).onicecandidate = (event: any) => {
        if (event.candidate) {
            socket.emit("ice-candidate", {
                target: targetId,
                from: socket.id,
                candidate: event.candidate
            });
        }
    };
    
    (pc as any).onconnectionstatechange = () => {
        // Optional: Handle 'failed' or 'disconnected' states here
    };
};

const setupDataChannel = (dc: any, userId: string) => {
    dc.onopen = () => console.log(`${LOG_TAG} Channel OPEN with ${userId}`);
    dc.onmessage = (event: any) => {
        try {
            const msg = JSON.parse(event.data);
            if (onMessageReceived) onMessageReceived(msg);
        } catch (e) { console.error("Msg parse error", e); }
    };
};
