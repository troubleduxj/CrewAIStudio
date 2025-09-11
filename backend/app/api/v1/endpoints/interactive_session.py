import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger
from app.services.interactive_session_service import run_simple_agent

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection established.")
    try:
        while True:
            raw_data = await websocket.receive_text()
            logger.info(f"Received message: {raw_data}")

            try:
                payload = json.loads(raw_data)
                message = payload.get("message")
                model = payload.get("model")
            except json.JSONDecodeError:
                # Handle cases where the message is not a valid JSON
                message = raw_data
                model = None

            if not message:
                logger.warning("Received an empty message. Skipping.")
                continue

            # Run the agent with the received data and stream the output
            await run_simple_agent(message, model, websocket)

    except WebSocketDisconnect:
        logger.info("WebSocket connection closed.")
    except Exception as e:
        logger.error(f"An error occurred in WebSocket: {e}")
        # Attempt to send an error message to the client before closing
        try:
            await websocket.send_text(f"Error: {e}")
        except Exception:
            pass
        await websocket.close(code=1011)
