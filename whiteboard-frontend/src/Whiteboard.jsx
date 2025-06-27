import { useRef, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export default function Whiteboard() {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const stompClient = useRef(null);
  const roomId = 'room123';

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    // Connect to WebSocket
    console.log("creating socket my boii")
    const socket = new SockJS('http://localhost:8080/ws');
    stompClient.current = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log('[STOMP DEBUG]', str), // 👈 Add this
      onConnect: () => {
        console.log('🟢 Connected to WebSocket');
        stompClient.current.subscribe(`/topic/draw/${roomId}`, message => {
          const data = JSON.parse(message.body);
          drawFromRemote(data);
        });
      },
      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame);
      },
      reconnectDelay: 5000 // ⏳ retry if connection fails
    });
    stompClient.current.activate();
  }, []);

  const startDrawing = (e) => {
    isDrawing.current = true;
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);

    sendDrawData(offsetX, offsetY, true);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();

    sendDrawData(offsetX, offsetY, false);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    const ctx = canvasRef.current.getContext('2d');
    ctx.closePath();
  };

  // Send drawing data to backend
  const sendDrawData = (x, y, isNewStroke) => {
    console.log("sending data boii: " + x + " " + y);
    if (stompClient.current && stompClient.current.connected) {
      const message = {
        roomId,
        x,
        y,
        isNewStroke,
      };
      stompClient.current.publish({
        destination: `/app/draw/${roomId}`,
        body: JSON.stringify(message),
      });
    }
  };

  // Draw from other users
  const drawFromRemote = ({ x, y, isNewStroke }) => {
    const ctx = canvasRef.current.getContext('2d');
    if (isNewStroke) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const captureCanvas = () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/png');
    console.log(imageData);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{
          display: 'block',
          backgroundColor: 'white',
          border: '2px solid black',
        }}
      />
      <button
        onClick={captureCanvas}
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          padding: '8px 12px',
          backgroundColor: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Capture
      </button>
    </>
  );
}
