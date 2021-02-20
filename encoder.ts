import { Peer } from './peer';
import { log } from './log';
import { Message } from './MessageChannel';

// There will soon be 3 networks.
type NetworkId = 'testnet' | 'mainnet';

// For now we will just try to keep up to date with the latest version. Should be easy as we do not implement the entire protocol.
type ProtocolVersion = '0.0.29';


// TODO: needs to be replaced by new non cbor decoder
const decodePeer = (peer: Buffer): Peer => {
    const hostname = peer.slice(0, 4).toString();
    const port = peer.readUIntBE(4, 2);
    const timestamp = parseInt(peer.readBigUInt64BE(6).toString(), 10);

    return new Peer({
        hostname,
        port,
        timestamp
    });
};

const ProtocolMessageTypes = {
    handshake: 1,
    handshake_ack: 2,
    request_peers: 40,
    respond_peers: 41
};

interface Handshake {
    network_id: NetworkId;
    protocol_version: ProtocolVersion;
    software_version: string;
    server_port: number;
    node_type: number;
}

// TODO: needs to be replaced by non cbor version
// Data must be any as we dont know what we are encoding
const encodeMessage = (messageType: number, data: any): Buffer => {
    if (messageType === ProtocolMessageTypes.handshake) {
        const { network_id, protocol_version, software_version, server_port, node_type } = data as Handshake;

        const serverPortBuffer = Buffer.alloc(2);

        serverPortBuffer.writeUInt16BE(server_port);

        return Buffer.concat([
            Buffer.from([messageType]),
            encodeString(network_id),
            encodeString(protocol_version),
            encodeString(software_version),
            serverPortBuffer,
            Buffer.from([node_type]),
        ]);
    }

    if (messageType === ProtocolMessageTypes.handshake_ack) {
        return Buffer.from([messageType]);
    }

    throw new Error(`Could not encode message of type ${messageType}`);
};

// TODO: needs to be replaced by non cbor version
const decodeMessage = (message: Buffer): any => {
    const messageType = message[0];

    if (messageType === ProtocolMessageTypes.handshake) {
        let currentPos = 1;

        // Extract network_id (bytes32) - this might fail in reality as it might not be treated as string
        // If doesn't work it might be a bug as the length is then required to be 7
        const network_id = decodeString(message.slice(currentPos)); // testnet | mainnet

        currentPos += 4 + network_id.length;

        const protocol_version = decodeString(message.slice(currentPos));

        currentPos +=  4 + protocol_version.length;

        const software_version = decodeString(message.slice(currentPos));

        currentPos += 4 + software_version.length;

        const server_port = message.readUInt16BE(currentPos);

        currentPos += 2;

        const node_type = message[currentPos];

        return {
            network_id,
            protocol_version,
            software_version,
            server_port,
            node_type
        };
    }

    if (messageType === ProtocolMessageTypes.handshake_ack) {
        return {};
    }

    log.warn(`Could not decode message of type ${messageType}`);

    return null;
};


// https://github.com/Chia-Network/chia-blockchain/blob/main/src/util/streamable.py#L206
const decodeString = (buffer: Buffer): string => {
    // Extra length of string from first 4 bytes
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
    decodePeer,
    encodeString,
    decodeString
};
