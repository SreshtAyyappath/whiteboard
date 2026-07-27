import { useRef, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import { useParams } from "react-router-dom";
import "./index.css";

export default function Whiteboard() {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const stompClient = useRef(null);
  const {roomId} = useParams();
  const strokes = useRef([]);
  const currentStroke = useRef(null);
  const isSpacePressed = useRef(false);
  const isPanning = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const camera = useRef({ x: 0, y: 0, zoom: 1 });

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

    const handleKeyDown = (e) => {
      if(e.code === 'Space') {
        e.preventDefault();          // <- prevent browser scrolling
        isSpacePressed.current = true;
        console.log("Space pressed, panning enabled");
      }
    };

    const handleKeyUp = (e) => {
      if(e.code === 'Space') {
        e.preventDefault();
        isSpacePressed.current = false;
        console.log("Space released, panning disabled");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Connect to WebSocket using native WebSocket (no SockJS)
    console.log("Creating socket connection")
    
    stompClient.current = new Client({
      brokerURL: 'ws://192.168.1.103:8080/ws', // Direct WebSocket URL
      debug: (str) => console.log('[STOMP DEBUG]', str),
      onConnect: (frame) => {
        console.log('🟢 Connected to WebSocket', frame);
        stompClient.current.subscribe(`/topic/draw/${roomId}`, message => {
          const data = JSON.parse(message.body);
          drawFromRemote(data);
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
      },
      onWebSocketClose: (event) => {
        console.log('WebSocket closed:', event);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.current.activate();

    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp)
    };
  }, []);

  const startDrawing = (e) => {
    if(isSpacePressed.current) {
      console.log("Panning started");
      isPanning.current = true;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      return;
    }

    isDrawing.current = true;


    const { offsetX, offsetY } = e.nativeEvent;
    const worldX = (offsetX + camera.current.x) / camera.current.zoom;
    const worldY = (offsetY + camera.current.y) / camera.current.zoom;
    
    const newStroke = { id: crypto.randomUUID(), points: [{ x: worldX, y: worldY }] };
    currentStroke.current = newStroke;
    strokes.current.push(newStroke);
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    sendDrawData(offsetX, offsetY, true);
  };

  const draw = (e) => {
    if(isPanning.current) {
      console.log("Panning in progress");
      const deltaX = e.clientX - lastMousePosition.current.x;
      const deltaY = e.clientY - lastMousePosition.current.y;
      camera.current.x -= deltaX;
      camera.current.y -= deltaY;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      redrawCanvas();
      return;
    }

    if (!isDrawing.current) return;
    const { offsetX, offsetY } = e.nativeEvent;

    // const newStroke = { id: crypto.randomUUID, points: [{ x: offsetX, y: offsetY }] };
    // currentStroke.current = newStroke;
    // strokes.current.push(newStroke);

    const worldX = (offsetX + camera.current.x) / camera.current.zoom;
    const worldY = (offsetY + camera.current.y) / camera.current.zoom;

    currentStroke.current.points.push({
        x: worldX,
        y: worldY,
    });


    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    sendDrawData(offsetX, offsetY, false);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    isPanning.current = false;
    const ctx = canvasRef.current.getContext('2d');
    // ctx.closePath();
  };

  // Send drawing data to backend
  const sendDrawData = (x, y, isNewStroke) => {
    console.log("Sending Coordinates to Backend: " + x + " " + y);
    if (stompClient.current && stompClient.current.connected) {
      const message = {
        x,
        y,
        isNewStroke,
      };
      stompClient.current.publish({
        destination: `/app/draw/${roomId}`,
        body: JSON.stringify(message),
      });
    } else {
      console.log("STOMP client not connected, cannot send data");
    }
  };

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

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    const { x, y, zoom } = camera.current;

    ctx.translate(-x, -y);
    ctx.scale(zoom, zoom);

    // Draw ALL strokes using world coordinates
    console.log("Strokes: ", strokes.current);
    strokes.current.forEach(stroke => {
      if (stroke.points.length === 0) return;

      ctx.beginPath();

      ctx.moveTo(
        stroke.points[0].x,
        stroke.points[0].y
      );

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(
          stroke.points[i].x,
          stroke.points[i].y
        );
      }
      ctx.stroke();
    });

    ctx.restore();
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
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            display: "block",
            background: "white",
        }}
      />
      <button
        onClick={captureCanvas}
        style={{
          position: 'fixed',
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