import cbor from 'cbor';
import { Peer } from './peer';
import { log } from './log';
import { Message } from './MessageChannel';

const decodePeer = (peer: Buffer): Peer => {
    const length = peer.readUIntBE(0, 4);
    const hostname = peer.slice(4, length + 4).toString();
    const port = peer.readUIntBE(length + 4, 2);
    const timestamp = parseInt(peer.readBigUInt64BE(length + 6).toString(), 10);

    return new Peer({
        hostname,
        port,
        timestamp
    });
};

const encodeMessage = (func: string, data: any): Buffer => {
    const message = cbor.encode({
        f: func,
        d: data
    }) as Buffer;

    const length = Buffer
        .alloc(4)
        .fill(0);

    length.writeUIntBE(message.byteLength, 0, 4);

    return Buffer.concat([
        length,
        message
    ]);
};

const decodeMessage = (data: Buffer): Message => {
    const length = data.readUIntBE(0, 4);
    const cborMessage = data.slice(4, 4 + length);

    try {
        const message = cbor.decode(cborMessage);

        return message;
    } catch (err) {
        log.warn(`Failed to decode cbor with expected length of ${length} but actual length of ${data.byteLength - 4}`);

        throw err;
    }
};

export {
    decodePeer,
    encodeMessage,
    decodeMessage
};
