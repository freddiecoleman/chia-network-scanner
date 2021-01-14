import cbor from 'cbor';
import { Peer } from './peer';
import { log } from './log';
import { Message } from './MessageChannel';

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

const encodeMessage = (func: string, data: any): Buffer => {
    const message = cbor.encode({
        f: func,
        d: data,
        i: Buffer.from('test') // Todo: temporarily doing this to see if it fixes the current error
    }) as Buffer;

    return message;
};

const decodeMessage = (cborMessage: Buffer): Message => {
    try {
        const message = cbor.decode(cborMessage);

        return message;
    } catch (err) {
        log.warn('Failed to decode cbor');

        throw err;
    }
};

export {
    decodePeer,
    encodeMessage,
    decodeMessage
};
