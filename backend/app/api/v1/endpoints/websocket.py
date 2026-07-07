from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket import manager

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time cache invalidation signaling.
    """
    await manager.connect(websocket)
    try:
        while True:
            # We keep the connection alive by waiting for any incoming data from client,
            # though clients normally only listen to events broadcast from the server.
            data = await websocket.receive_text()
            # Echo or heartbeat back
            await websocket.send_text(f"heartbeat: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket connection error on client socket: {e}")
        manager.disconnect(websocket)
