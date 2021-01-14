import WebSocket from 'ws';
import { log } from './log';
import { NetworkId, ProtocolVersion } from './options';

interface MessageChannelOptions {
    networkId: NetworkId;
    protocolVersion: ProtocolVersion;
    nodeId: string;
    nodeType: number;
    hostname: string;
    port: number;
    onMessage: (message: Buffer) => void;
    connectionTimeout: number;
}

// Todo: proper message types
interface Message {
    f: string;
    d: any;
}

class MessageChannel {
    private readonly onMessage: (message: Buffer) => void;
    private ws: WebSocket | null = null;
    private inboundDataBuffer: Buffer = Buffer.from([]);
    public readonly hostname: string;
    public readonly port: number;
    public readonly connectionTimeout: number;
    public readonly networkId: NetworkId;
    public readonly protocolVersion: ProtocolVersion;
    public readonly nodeId: Buffer;
    public readonly nodeType: number;

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
    }

    public async connect(): Promise<void> {
        return new Promise(resolve => {
            this.ws = new WebSocket(`wss://${this.hostname}:${this.port}`, { rejectUnauthorized: false });
            this.ws.on('message', (data: Buffer): void => this.messageHandler(data));
            this.ws.on('close', () => this.onClose());
            this.ws.on('connection', () => {
                this.onConnected();

                resolve();
            });
        });
    }

    public sendMessage(message: Buffer): void {
        this.ws?.send(message);
    }

    public close(): void {
        this.ws?.close();
    }

    private messageHandler(data: Buffer): void {
        this.inboundDataBuffer = Buffer.concat([this.inboundDataBuffer, data]);

        const length = this.inboundDataBuffer.readUIntBE(0, 4);
        const messageStreamed = this.inboundDataBuffer.byteLength - 4 === length;
        const bufferOverflow = this.inboundDataBuffer.byteLength - 4 > length;

        if (messageStreamed) {
            this.onMessage(this.inboundDataBuffer);

            this.inboundDataBuffer = Buffer.from([]);
        } else if (bufferOverflow) {
            // Very basic protection against badly developed or malicious peers
            // Depending on what they are doing this could happen many times in a row but should eventually recover
            this.inboundDataBuffer = Buffer.from([]);
        }
    }

    private onConnected(): void {
        log.info(`Established TCP connection to Chia node ${this.hostname}:${this.port}`);
    }

    private onClose(err?: Error): void {
        log.info(err || {}, 'Connection closed')
    }
}

export {
    MessageChannel,
    Message
};
