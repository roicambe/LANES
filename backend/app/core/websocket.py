from typing import List
from fastapi import WebSocket

class ConnectionManager:
    """
    Manages active WebSocket connections for real-time signaling.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """
        Accept and store a new client WebSocket connection.
        """
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket client connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """
        Remove a client WebSocket connection from active list.
        """
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"WebSocket client disconnected. Total active connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """
        Send a JSON message to all currently connected clients.
        Cleans up dead connections automatically.
        """
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Failed to send message to connection: {e}. Scheduling cleanup.")
                dead_connections.append(connection)
        
        # Clean up any stale/broken connections
        for dead in dead_connections:
            self.disconnect(dead)

# Single global instance for import across routes/services
manager = ConnectionManager()
