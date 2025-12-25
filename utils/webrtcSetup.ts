import { useEffect, useRef, useState, useCallback } from 'react';
import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import io, { Socket } from 'socket.io-client';

interface WebRTCMessage {
  message: string;
}

export const useWebRTCChat = (socket: Socket, roomId: string) => {
  const [messages, setMessages] = useState<WebRTCMessage[]>([]);
  const pc = useRef<RTCPeerConnection | null>(null);
  const dc = useRef<any>(null);

  useEffect(() => {
    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.current.ondatachannel = (event: any) => {
      dc.current = event.channel;
      dc.current.onopen = () => console.log('Chat ready');
      dc.current.onmessage = (event: any) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
          setMessages(prev => [...prev, { message: data.message }]);
        }
      };
    };

    try {
      dc.current = pc.current.createDataChannel('chat');
      dc.current.onopen = () => console.log('Chat ready');
      dc.current.onmessage = (event: any) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
          setMessages(prev => [...prev, { message: data.message }]);
        }
      };
    } catch (e) {
      console.log('Data channel create error:', e);
    }

    socket.emit('join', roomId);

    socket.on('offer', async (offer: any) => {
      if (!pc.current) return;
      await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      socket.emit('answer', answer);
    });

    socket.on('answer', async (answer: any) => {
      if (!pc.current) return;
      await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async (candidate: any) => {
      if (!pc.current) return;
      try {
        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.log('ICE add error:', e);
      }
    });

    const handleIceCandidate = (event: any) => {
      if (event.candidate && pc.current) {
        socket.emit('ice-candidate', event.candidate);
      }
    };
    
    pc.current.addEventListener('icecandidate', handleIceCandidate);

    pc.current.createOffer().then(async (offer) => {
      await pc.current?.setLocalDescription(offer);
      socket.emit('offer', offer);
    }).catch(console.error);

    return () => {
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      pc.current?.removeEventListener('icecandidate', handleIceCandidate);
      pc.current?.close();
    };
  }, [socket, roomId]);

  const sendMessage = useCallback((msg: string) => {
    if (dc.current?.readyState === 'open') {
      dc.current.send(JSON.stringify({ type: 'chat', message: msg }));
    }
  }, []);

  return { messages, sendMessage };
};
