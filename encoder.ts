import { Peer } from './peer';
import { log } from './log';

// There will soon be 3 networks.
type NetworkId = 'testnet' | 'mainnet';

// For now we will just try to keep up to date with the latest version. Should be easy as we do not implement the entire protocol.
type ProtocolVersion = '0.0.29';

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
    // Messages that only have a type and don't contain any data
    if (messageType === ProtocolMessageTypes.handshake_ack || messageType === ProtocolMessageTypes.request_peers) {
        return Buffer.from([messageType]);
    }

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

    if (messageType === ProtocolMessageTypes.respond_peers) {
        const { peer_list } = data as { peer_list: Peer[] };

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

        return Buffer.concat([
            Buffer.from([messageType]),
            Buffer.concat([
                peerListSizeBuffer,
                peers
            ])
        ]);
    }

    throw new Error(`Could not encode message of type ${messageType}`);
};

// TODO: needs to be replaced by non cbor version
const decodeMessage = (message: Buffer): any => {
    const messageType = message[0];

    if (messageType === ProtocolMessageTypes.handshake_ack || messageType === ProtocolMessageTypes.request_peers) {
        return {};
    }

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

    if (messageType === ProtocolMessageTypes.respond_peers) {
        const peer_list = [];
        let currentPos = 1;

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
    decodeString
};
