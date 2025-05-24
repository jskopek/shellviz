import struct

import asyncio

async def send_websocket_message(writer, message):
    """
    Takes a StreamWriter instance initiated from an `aynscio.start_server` request and sends a WebSocket message with the provided `message` content
    Silently ignores errors due to disconnects.
    """
    try:
        message_bytes = message.encode()
        length = len(message_bytes)

        # Build the WebSocket frame header
        if length <= 125:
            header = struct.pack("B", 0x81) + struct.pack("B", length)
        elif length <= 65535:
            header = struct.pack("B", 0x81) + struct.pack("!BH", 126, length)
        else:
            header = struct.pack("B", 0x81) + struct.pack("!BQ", 127, length)

        writer.write(header + message_bytes)
        await writer.drain()
    except (ConnectionResetError, BrokenPipeError, asyncio.CancelledError, asyncio.IncompleteReadError, GeneratorExit):
        # Silently ignore disconnects and cancellations
        pass
    except Exception as e:
        # Optionally log unexpected errors
        pass



async def receive_websocket_message(reader, timeout=30):
    """
    Receives a websocket message from the reader, with a timeout and robust disconnect handling.
    Returns None on disconnect or timeout.
    """
    try:
        # Read the frame header
        data = await asyncio.wait_for(reader.readexactly(2), timeout=timeout)
        if not data:
            return None

        first_byte, second_byte = data
        fin = first_byte & 0b10000000
        opcode = first_byte & 0b00001111

        # Handle different frame types
        if opcode == 0x8:  # Close frame
            return None # [WebSocket] Received close frame"
        elif opcode == 0x9:  # Ping frame
            # Read and discard ping payload
            is_masked = second_byte & 0b10000000
            payload_length = second_byte & 0b01111111
            if payload_length == 126:
                length_data = await asyncio.wait_for(reader.readexactly(2), timeout=timeout)
                payload_length = struct.unpack("!H", length_data)[0]
            elif payload_length == 127:
                length_data = await asyncio.wait_for(reader.readexactly(8), timeout=timeout)
                payload_length = struct.unpack("!Q", length_data)[0]
            if is_masked:
                await asyncio.wait_for(reader.readexactly(4), timeout=timeout)  # masking key
            if payload_length > 0:
                await asyncio.wait_for(reader.readexactly(payload_length), timeout=timeout)  # payload
            return ""  # Return empty string to continue loop
        elif opcode == 0xA:  # Pong frame
            # Read and discard pong payload
            is_masked = second_byte & 0b10000000
            payload_length = second_byte & 0b01111111
            if payload_length == 126:
                length_data = await asyncio.wait_for(reader.readexactly(2), timeout=timeout)
                payload_length = struct.unpack("!H", length_data)[0]
            elif payload_length == 127:
                length_data = await asyncio.wait_for(reader.readexactly(8), timeout=timeout)
                payload_length = struct.unpack("!Q", length_data)[0]
            if is_masked:
                await asyncio.wait_for(reader.readexactly(4), timeout=timeout)  # masking key
            if payload_length > 0:
                await asyncio.wait_for(reader.readexactly(payload_length), timeout=timeout)  # payload
            return ""  # Return empty string to continue loop
        elif opcode not in [0x1, 0x2]:  # Not text (0x1) or binary (0x2) frame
            return "" # [WebSocket] Received unsupported frame type"

        # Masking and payload length
        is_masked = second_byte & 0b10000000
        payload_length = second_byte & 0b01111111

        if payload_length == 126:
            length_data = await asyncio.wait_for(reader.readexactly(2), timeout=timeout)
            payload_length = struct.unpack("!H", length_data)[0]
        elif payload_length == 127:
            length_data = await asyncio.wait_for(reader.readexactly(8), timeout=timeout)
            payload_length = struct.unpack("!Q", length_data)[0]

        # Read masking key if present
        masking_key = None
        if is_masked:
            masking_key = await asyncio.wait_for(reader.readexactly(4), timeout=timeout)

        # Read the payload
        if payload_length > 0:
            payload_data = await asyncio.wait_for(reader.readexactly(payload_length), timeout=timeout)
            if is_masked and masking_key:
                payload_data = bytes(b ^ masking_key[i % 4] for i, b in enumerate(payload_data))
            return payload_data.decode('utf-8')
        else:
            return ""
            
    except (asyncio.TimeoutError, asyncio.IncompleteReadError, ConnectionResetError, BrokenPipeError, asyncio.CancelledError, GeneratorExit):
        # Silently ignore disconnects/timeouts
        return None
    except Exception as e:
        # Optionally log unexpected errors
        pass # [WebSocket] Unexpected error receiving websocket message"
        return None



async def perform_websocket_handshake(reader, writer):
    
    # Check if this is a BufferedStreamReader (it should be, from handle_connection)
    if hasattr(reader, '_buffer'):
        # For BufferedStreamReader, we need to read all available data
        headers_bytes = reader._buffer
        # Check if we already have the complete headers
        if b'\r\n\r\n' not in headers_bytes:
            # Read additional data if needed
            while b'\r\n\r\n' not in headers_bytes:
                chunk = await reader.read(1024)
                if not chunk:
                    break
                headers_bytes += chunk
                if len(headers_bytes) > 32 * 1024:
                    raise ValueError('WebSocket handshake headers too large')
        # Clear the buffer since we've consumed the handshake data
        reader._buffer = b''
    else:
        # For regular StreamReader
        headers_bytes = b''
        while b'\r\n\r\n' not in headers_bytes:
            chunk = await reader.read(1024)
            if not chunk:
                break
            headers_bytes += chunk
            if len(headers_bytes) > 32 * 1024:
                raise ValueError('WebSocket handshake headers too large')
    
    headers_text = headers_bytes.decode(errors='replace')
    headers = headers_text.split("\r\n")


    # Extract the Sec-WebSocket-Key header
    for header in headers:
        if header.startswith("Sec-WebSocket-Key: "):
            websocket_key = header.split(": ")[1].strip()
            break
    else:
        raise ValueError("No Sec-WebSocket-Key header in handshake request")

    # Generate the response key (the magic string is a WebSocket protocol requirement)
    accept_key = generate_websocket_accept_key(websocket_key)

    response = (
        f"HTTP/1.1 101 Switching Protocols\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Accept: {accept_key}\r\n\r\n"
    )
    writer.write(response.encode())
    await writer.drain()


def generate_websocket_accept_key(key):
    import hashlib
    import base64

    magic_string = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
    accept_key = base64.b64encode(hashlib.sha1((key + magic_string).encode()).digest()).decode()
    return accept_key
