import cbor from 'cbor';
import { log } from './log';
import { MessageChannel, Message } from './MessageChannel';
import { NetworkId, ProtocolVersion } from './options';
import { Peer } from './peer';

interface PeerConnectionOptions {
    networkId: NetworkId;
    protocolVersion: ProtocolVersion;
    nodeId: string;
    nodeType: number;
    hostname: string;
    port: number;
    connectionTimeout: number;
}


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

class PeerConnection {
    private readonly messageChannel: MessageChannel;
    private readonly messageHandlers: Map<string, Function> = new Map();

    public constructor({
        networkId,
        protocolVersion,
        nodeId,
        nodeType,
        hostname,
        port,
        connectionTimeout
    }: PeerConnectionOptions) {
        this.messageChannel = new MessageChannel({
            networkId,
            protocolVersion,
            nodeId,
            nodeType,
            hostname,
            port,
            connectionTimeout,
            onMessage: data => this.onMessage(data)
        });

        this.addMessageHandler('ping', (ping: { nonce: Buffer }) => {
            // No-op is fine for now
        });
        this.addMessageHandler('pong', (pong: { nonce: Buffer }) => {
            // No-op is fine for now
        });
    }

    /**
     * Chia application level handshake required before using the peer protocol.
     */
    public async handshake(): Promise<this> {
        const { hostname, port, connectionTimeout, networkId, protocolVersion, nodeId, nodeType } = this.messageChannel;

        return new Promise(async(resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`${hostname}:${port} did not respond to handshake within ${(connectionTimeout / 1000).toFixed(2)} seconds. Bailing.`)), connectionTimeout);

            // Handle handshake response messages
            const handshakeResponse = [
                this.expectMessage('handshake'),
                this.expectMessage('handshake_ack')
            ];

            // Initiate handshake
            this.sendMessage('handshake', {
                network_id: networkId,
                version: protocolVersion,
                node_id: nodeId,
                server_port: 8444,
                node_type: nodeType
            });

            try {
                // Wait for handshake response
                await Promise.all(handshakeResponse);
            } catch (err) {
                return reject(err);
            }

            // Handshake completed within timeout
            clearTimeout(timeout);

            // Acknowledge receipt of handshake from peer
            this.sendMessage('handshake_ack', {});

            // We can now use the peer protocol
            resolve(this);
        });
    }

    public sendMessage(messageType: string, data: any) {
        const message = this.encodeMessage(messageType, data);

        log.info(`Sending ${messageType} message`);

        this.messageChannel.sendMessage(message);
    }

    /**
     * Get the peers of this peer.
     */
    public getPeers(): Promise<Peer[]> {
        const { hostname, port, connectionTimeout, networkId, protocolVersion, nodeId, nodeType } = this.messageChannel;

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`${hostname}${port} did not respond after ${(connectionTimeout / 1000).toFixed(2)} seconds. Bailing.`)), connectionTimeout);
    
            this.addMessageHandler('respond_peers_full_node', (respondPeers: any) => {
                const peers = respondPeers.peer_list.map((encodedPeer: Buffer) => decodePeer(encodedPeer));
    
                clearTimeout(timeout);

                resolve(peers);
            });
    
            log.info('Requesting peers');
    
            this.sendMessage('request_peers', {});
        });
    }

    public close(): Promise<void> {
        return this.messageChannel.close();
    }

    private addMessageHandler(messageType: string, handler: Function) {
        log.info(`Adding message handler for ${messageType} messages`);

        this.messageHandlers.set(messageType, handler);
    }

    private onMessage(data: Buffer): void {
        try {
            const message = this.decodeMessage(data);
            const messageType = message.f;
            const handler = this.messageHandlers.get(messageType);

            log.info(`Succesfully decoded ${messageType}`);

            if (handler) {
                return handler(message.d);
            }

            log.info(`No handler for ${messageType} message. Discarding it.`);
        } catch (err) {
            // Anybody could send any old rubbish down the wire and we don't want that to crash our process
            log.error(err, 'Error handling inbound message');
            log.info(`Hex of message that could not be decoded: ${data.toString('hex')}`);
        }
    }

    /**
     * Expects a message to be received within a timeout.
     *
     * @param message expected
     */
    private expectMessage(message: string): Promise<void> {
        const { hostname, port, connectionTimeout } = this.messageChannel;

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`${hostname}:${port} did not receive ${message} within ${(connectionTimeout / 1000).toFixed(2)} seconds. Bailing.`)), connectionTimeout);
        
            this.addMessageHandler(message, () => {
                clearTimeout(timeout);
                resolve();
            });
        });
    }

    private encodeMessage(func: string, data: any): Buffer {
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
    }

    private decodeMessage(data: Buffer): Message {
        const length = data.readUIntBE(0, 4);
        const cborMessage = data.slice(4, 4 + length);
    
        try {
            const message = cbor.decode(cborMessage);
    
            return message;
        } catch (err) {
            log.warn(`Failed to decode cbor with expected length of ${length} but actual length of ${data.byteLength - 4}`);
    
            throw err;
        }
    }
}

export { PeerConnection };
