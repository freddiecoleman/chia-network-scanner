import { log } from './log';
import { MessageChannel } from './MessageChannel';
import { NetworkId, ProtocolVersion } from './options';
import { Peer } from './peer';
import { decodeMessage, encodeMessage, ProtocolMessageTypes } from './encoder';

interface PeerConnectionOptions {
    networkId: NetworkId;
    protocolVersion: ProtocolVersion;
    softwareVersion: string;
    nodeType: number;
    hostname: string;
    port: number;
    connectionTimeout: number;
    cert: Buffer;
    key: Buffer;
}

class PeerConnection {
    private readonly messageChannel: MessageChannel;
    private readonly messageHandlers: Map<number, Function> = new Map();

    public constructor({
        networkId,
        protocolVersion,
        softwareVersion,
        nodeType,
        hostname,
        port,
        connectionTimeout,
        cert,
        key
    }: PeerConnectionOptions) {
        this.messageChannel = new MessageChannel({
            networkId,
            protocolVersion,
            softwareVersion,
            nodeType,
            hostname,
            port,
            connectionTimeout,
            onMessage: data => this.onMessage(data),
            cert,
            key
        });
    }

    public async connect(): Promise<void> {
        return this.messageChannel.connect();
    }

    /**
     * Chia application level handshake required before using the peer protocol.
     */
    public async handshake(): Promise<this> {
        const { hostname, port, connectionTimeout, networkId, protocolVersion, softwareVersion, nodeType } = this.messageChannel;

        return new Promise(async(resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`${hostname}:${port} did not respond to handshake within ${(connectionTimeout / 1000).toFixed(2)} seconds. Bailing.`)), connectionTimeout);

            // Handle handshake response messages
            const handshakeResponse = [
                this.expectMessage(ProtocolMessageTypes.handshake),
                this.expectMessage(ProtocolMessageTypes.handshake_ack)
            ];

            const networkIdBuffer = Buffer.alloc(32);

            networkIdBuffer.write(networkId);

            // Initiate handshake
            this.sendMessage(ProtocolMessageTypes.handshake, {
                network_id: networkIdBuffer,
                protocol_version: protocolVersion,
                software_version: softwareVersion,
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
            this.sendMessage(ProtocolMessageTypes.handshake_ack, {});

            // We can now use the peer protocol
            resolve(this);
        });
    }

    public sendMessage(messageType: number, data: any) {
        const message = encodeMessage(messageType, data);

        log.info(`Sending ${messageType} message`);

        this.messageChannel.sendMessage(message);
    }

    /**
     * Get the peers of this peer.
     */
    public getPeers(): Promise<Peer[]> {
        const { hostname, port, connectionTimeout } = this.messageChannel;

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`${hostname}${port} did not respond after ${(connectionTimeout / 1000).toFixed(2)} seconds. Bailing.`)), connectionTimeout);
    
            this.addMessageHandler(ProtocolMessageTypes.respond_peers, (respondPeers: any) => {
                clearTimeout(timeout);

                resolve(respondPeers.peer_list);
            });
    
            this.sendMessage(ProtocolMessageTypes.request_peers, {});
        });
    }

    public close(): void {
        return this.messageChannel.close();
    }

    private addMessageHandler(messageType: number, handler: Function) {
        log.debug(`Adding message handler for ${messageType} messages`);

        this.messageHandlers.set(messageType, handler);
    }

    private onMessage(data: Buffer): void {
        try {
            const messageType = data[0];
            const message = decodeMessage(data);
            const handler = this.messageHandlers.get(messageType);

            log.debug(`Succesfully decoded ${messageType}`);

            if (handler) {
                return handler(message.d);
            }

            log.warn(`No handler for ${messageType} message. Discarding it.`);
        } catch (err) {
            // Anybody could send any old rubbish down the wire and we don't want that to crash our process
            log.error(err, 'Error handling inbound message');
            log.warn(`Hex of message that could not be decoded: ${data.toString('hex')}`);
        }
    }

    /**
     * Expects a message of a messageType to be received within a timeout.
     *
     * @param messageType expected
     */
    private expectMessage(messageType: number): Promise<void> {
        const { hostname, port, connectionTimeout } = this.messageChannel;

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`${hostname}:${port} did not receive ${messageType} message within ${(connectionTimeout / 1000).toFixed(2)} seconds. Bailing.`)), connectionTimeout);
        
            this.addMessageHandler(messageType, () => {
                clearTimeout(timeout);
                resolve();
            });
        });
    }
}

export { PeerConnection };
