import { Peer } from './peer';
import { log } from './log';

const ProtocolMessageTypes = {
    handshake: 1,
    handshake_ack: 2,
    request_peers: 40,
    respond_peers: 41
};

interface Handshake {
    network_id: string;
    protocol_version: string;
    software_version: string;
    server_port: number;
    node_type: number;
}

const encodeHandshake = (handshake: Handshake): Buffer => {
    const { network_id, protocol_version, software_version, server_port, node_type } = handshake;

    const serverPortBuffer = Buffer.alloc(2);

    serverPortBuffer.writeUInt16BE(server_port);

    const message = Buffer.concat([
        encodeString(network_id),
        encodeString(protocol_version),
        encodeString(software_version),
        serverPortBuffer,
        Buffer.from([node_type]),
        // todo: add capabilities here, a new thing! https://github.com/Chia-Network/chia-blockchain/blob/main/src/protocols/shared_protocol.py#L30
        // for now just wacking some dummy ones on and seeing what happens
        Buffer.from('0000000100010000000131', 'hex')
    ]);

    const messageLengthBuffer = Buffer.alloc(4);

    messageLengthBuffer.writeUInt32BE(message.length);

    return Buffer.concat([
        Buffer.from([ProtocolMessageTypes.handshake]),
        Buffer.from([0]), // Doing this to signal that id is not present
        messageLengthBuffer,
        // message id apparently optional - maybe sometinh here is missing..? - at least need to be able to decode it right...?
        message,
    ]);
};

const encodeRespondPeers = (respondPeers: { peer_list: Peer[] }) => {
    const { peer_list } = respondPeers;

    const peerListSizeBuffer = Buffer.alloc(4);

    peerListSizeBuffer.writeUIntBE(peer_list.length, 0, 4);

    const peers = peer_list.reduce((accum, { hostname, port, timestamp }) => {
        const portBuffer = Buffer.alloc(2);

        portBuffer.writeUInt16BE(port);

        const timestampBuffer = Buffer.alloc(8);

        timestampBuffer.writeBigUInt64BE(BigInt(timestamp));

        return Buffer.concat([
            accum,
            encodeString(hostname),
            portBuffer,
            timestampBuffer
        ]);

    }, Buffer.alloc(0));

    const message = Buffer.concat([
        peerListSizeBuffer,
        peers
    ]);

    const messageLengthBuffer = Buffer.alloc(4);

    messageLengthBuffer.writeUInt32BE(message.length);

    return Buffer.concat([
        Buffer.from([ProtocolMessageTypes.respond_peers]),
        Buffer.from([0]), // Doing this to signal that id is not present
        messageLengthBuffer,
        message,
    ]);
};

const encodeMessage = (messageType: number, data: any): Buffer => {
    // Messages that only have a type and don't contain any data
    if (messageType === ProtocolMessageTypes.handshake_ack || messageType === ProtocolMessageTypes.request_peers) {
        const messageLengthBuffer = Buffer.alloc(4);

        messageLengthBuffer.writeUInt32BE(0);
        
        const message = Buffer.concat([
            Buffer.from([messageType]),
            Buffer.from([0]), // Doing this to signal that id is not present
            messageLengthBuffer,
        ]);

        log.info(`Encoded ${messageType} ${message.toString('hex')}`);

        return message;
    }

    if (messageType === ProtocolMessageTypes.handshake) {
        const message = encodeHandshake(data as Handshake);

        log.info(`Encoded handshake ${message.toString('hex')}`);

        return message;
    }

    if (messageType === ProtocolMessageTypes.respond_peers) {
        const message = encodeRespondPeers(data as { peer_list: Peer[] });

        log.info(`Encoded respond peers ${message.toString('hex')}`);

        return message;
    }

    throw new Error(`Could not encode message of type ${messageType}`);
};

const decodeHandshake = (message: Buffer) => {
    let currentPos = 0;

    const network_id = decodeString(message.slice(currentPos));

    currentPos += 4 + network_id.length;

    const protocol_version = decodeString(message.slice(currentPos));

    currentPos +=  4 + protocol_version.length;

    const software_version = decodeString(message.slice(currentPos));

    currentPos += 4 + software_version.length;

    const server_port = message.readUInt16BE(currentPos);

    currentPos += 2;

    const node_type = message[currentPos];

    // Todo: there is also capabilities but it's not needed for now so not implementing it on decode

    return {
        network_id,
        protocol_version,
        software_version,
        server_port,
        node_type
    };
};

const decodeRespondPeers = (message: Buffer) => {
    let currentPos = 0;

    const peer_list = [];

    const peer_list_size = message.readUIntBE(currentPos, 4);

    currentPos += 4;

    for (let i = 0; i < peer_list_size; i++) {
        const hostname = decodeString(message.slice(currentPos));

        currentPos += 4 + hostname.length;

        const port = message.readUInt16BE(currentPos);

        currentPos += 2;

        const timestamp = Number(message.readBigUInt64BE(currentPos));

        currentPos += 8;

        peer_list.push(
            new Peer({
                hostname,
                port,
                timestamp
            })
        );
    }

    return { peer_list };
}

const decodeMessage = (data: Buffer): any => {
    let currentPos = 0;

    const messageType = data[currentPos];

    currentPos++;

    const isIdPresent = data[currentPos];

    currentPos++

    if (isIdPresent) {
        // Id is present so we need to read another 16 bytes for now
        // Not actually reading it for now as not planning on using it...
        // could maybe use it later on....
        currentPos += 2;
    }

    const messageLength = data.readUInt32BE(currentPos);

    currentPos += 4;

    const message = data.slice(currentPos, currentPos + messageLength);

    if (messageType === ProtocolMessageTypes.handshake_ack || messageType === ProtocolMessageTypes.request_peers) {
        return {};
    }

    if (messageType === ProtocolMessageTypes.handshake) {
        return decodeHandshake(message);
    }

    if (messageType === ProtocolMessageTypes.respond_peers) {
        return decodeRespondPeers(message);
    }

    log.warn(`Could not decode message of type ${messageType}`);

    return null;
};

// https://github.com/Chia-Network/chia-blockchain/blob/main/src/util/streamable.py#L206
const decodeString = (buffer: Buffer): string => {
    const str_size_bytes = buffer.readUIntBE(0, 4);

    if (str_size_bytes === 0) {
        throw new Error('EOF while decoding string size');
    }

    const stringBuffer = buffer.slice(4, 4 + str_size_bytes);
    const result = stringBuffer.toString('utf-8');

    if (!result) {
        throw new Error('EOF while decoding string');
    }

    return result;
};

// https://github.com/Chia-Network/chia-blockchain/blob/main/src/util/streamable.py#L206
const encodeString = (str: string): Buffer => {
    const str_size_bytes = str.length;
    const strBuffer = Buffer.alloc(4 + str_size_bytes);

    // Encode length of string in first 4 bytes
    strBuffer.writeIntBE(str_size_bytes, 0, 4);

    // Encode the actual string
    strBuffer.write(str, 4, 'utf-8');

    return strBuffer;
};

export {
    encodeMessage,
    decodeMessage,
    encodeString,
    decodeString,
    ProtocolMessageTypes
};
