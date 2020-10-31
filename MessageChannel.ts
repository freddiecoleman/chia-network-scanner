import tls from 'tls';
import cbor from 'cbor';
import { log } from './log';
import { NetworkId, ProtocolVersion } from './options';

interface MessageChannelOptions {
    networkId: NetworkId;
    protocolVersion: ProtocolVersion;
    nodeId: string;
    nodeType: number;
    hostname: string;
    port: number;
    onMessage: (data: Buffer, messageChannel: MessageChannel) => void;
    connectionTimeout: number;
}

const TCP_CLOSE_TIMEOUT = 5000;

class MessageChannel {
    private readonly networkId: NetworkId;
    private readonly protocolVersion: ProtocolVersion;
    private readonly nodeId: Buffer;
    private readonly nodeType: number;
    private readonly hostname: string;
    private readonly port: number;
    private readonly onMessage: (data: Buffer, messageChannel: MessageChannel) => void;
    private readonly connectionTimeout: number;
    private readonly tlsClient: tls.TLSSocket;
    private readonly messageHandlers: Map<string, Function> = new Map();
    private inboundDataBuffer: Buffer = Buffer.from([]);

    public constructor({
        networkId,
        protocolVersion,
        nodeId,
        nodeType,
        hostname,
        port,
        onMessage,
        connectionTimeout
    }: MessageChannelOptions) {
        this.networkId = networkId;
        this.protocolVersion = protocolVersion;
        this.nodeId = Buffer.from(nodeId);
        this.nodeType = nodeType;
        this.hostname = hostname;
        this.port = port;
        this.onMessage = onMessage;
        this.connectionTimeout = connectionTimeout;
        this.tlsClient = tls.connect(port, hostname, { rejectUnauthorized: false });

        this.tlsClient.on('data', (data: Buffer) => {
            this.inboundDataBuffer = Buffer.concat([this.inboundDataBuffer, data]);

            const length = this.inboundDataBuffer.readUIntBE(0, 4);
            const messageStreamed = this.inboundDataBuffer.byteLength - 4 === length;
            const bufferOverflow = this.inboundDataBuffer.byteLength - 4 > length;

            if (messageStreamed) {
                this.onMessage(this.inboundDataBuffer, this);

                this.inboundDataBuffer = Buffer.from([]);
            } else if (bufferOverflow) {
                // Very basic protection against badly developed or malicious peers
                // Depending on what they are doing this could happen many times in a row but should eventually recover
                this.inboundDataBuffer = Buffer.from([]);
            }
        });

        this.tlsClient.on('close', () => this.onClose());
        this.tlsClient.on('error', err => this.onClose(err));
        this.tlsClient.on('secureConnect', () => this.onConnected());

        this.addMessageHandler('ping', (ping: { nonce: Buffer }) => {
            // No-op is fine for now
        });
        this.addMessageHandler('pong', (pong: { nonce: Buffer }) => {
            // No-op is fine for now
        });
    }

    /**
     * Expects a message to be received within a timeout.
     *
     * @param message expected
     */
    private expectMessage(message: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`${this.hostname}:${this.port} did not receive ${message} within ${(this.connectionTimeout / 1000).toFixed(2)} seconds. Bailing.`)), this.connectionTimeout);
        
            this.addMessageHandler(message, () => {
                clearTimeout(timeout);
                resolve();
            });
        });
    }

    /**
     * Chia application level handshake required before using the peer protocol.
     */
    public async handshake(): Promise<this> {
        return new Promise(async(resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`${this.hostname}:${this.port} did not respond to handshake within ${(this.connectionTimeout / 1000).toFixed(2)} seconds. Bailing.`)), this.connectionTimeout);

            // Handle handshake response messages
            const handshakeResponse = [
                this.expectMessage('handshake'),
                this.expectMessage('handshake_ack')
            ];

            // Initiate handshake
            this.sendMessage('handshake', {
                network_id: this.networkId,
                version: this.protocolVersion,
                node_id: this.nodeId,
                server_port: 8444,
                node_type: this.nodeType
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

        this.tlsClient.write(message);
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`Connection did not close within ${(TCP_CLOSE_TIMEOUT / 1000).toFixed(2)} seconds`)), TCP_CLOSE_TIMEOUT);

            this.tlsClient.end(() => {
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

    private addMessageHandler(messageType: string, handler: Function) {
        log.info(`Adding message handler for ${messageType} messages`);

        this.messageHandlers.set(messageType, handler);
    }

    private onConnected(): void {
        log.info(`Established TCP connection to Chia node ${this.hostname}:${this.port}`);
    }

    private onClose(err?: Error): void {
        log.info(err || {}, 'Connection closed')
    }
}

export { MessageChannel };
