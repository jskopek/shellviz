import struct

async def send_websocket_message(writer, message):
    """
    Takes a StreamWriter instance initiated from an `aynscio.start_server` request and sends a WebSocket message with the provided `message` content
    """
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


async def receive_websocket_message(reader):
    # Read the frame header
    data = await reader.readexactly(2)
    if not data:
        return None

    first_byte, second_byte = data
    fin = first_byte & 0b10000000
    opcode = first_byte & 0b00001111

    if opcode == 0x8:
        return None  # Close frame

    # Masking and payload length
    is_masked = second_byte & 0b10000000
    payload_length = second_byte & 0b01111111

    if payload_length == 126:
        payload_length = struct.unpack("!H", await reader.readexactly(2))[0]
    elif payload_length == 127:
        payload_length = struct.unpack("!Q", await reader.readexactly(8))[0]

    # Read masking key if present
    if is_masked:
        masking_key = await reader.readexactly(4)

    # Read the payload
    payload_data = await reader.readexactly(payload_length)
    if is_masked:
        payload_data = bytes(b ^ masking_key[i % 4] for i, b in enumerate(payload_data))

    return payload_data.decode()


async def perform_websocket_handshake(reader, writer):
    # Read the client's HTTP headers for the WebSocket handshake
    headers = await reader.read(1024)
    headers = headers.decode().split("\r\n")
    
    # Extract the Sec-WebSocket-Key header
    for header in headers:
        if header.startswith("Sec-WebSocket-Key: "):
            websocket_key = header.split(": ")[1].strip()
            break
    else:
        raise ValueError("No Sec-WebSocket-Key header in handshake request")

    # Generate the response key (the magic string is a WebSocket protocol requirement)
    accept_key = generate_websocket_accept_key(websocket_key)

    # Send the WebSocket handshake response headers
    writer.write(
        f"HTTP/1.1 101 Switching Protocols\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Accept: {accept_key}\r\n\r\n".encode()
    )
    await writer.drain()


def generate_websocket_accept_key(key):
    import hashlib
    import base64

    magic_string = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
    accept_key = base64.b64encode(hashlib.sha1((key + magic_string).encode()).digest()).decode()
    return accept_key
