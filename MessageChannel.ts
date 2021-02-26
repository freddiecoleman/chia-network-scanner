import WebSocket from 'ws';
import { log } from './log';

interface MessageChannelOptions {
    networkId: string;
    protocolVersion: string;
    softwareVersion: string;
    nodeType: number;
    hostname: string;
    port: number;
    cert: Buffer;
    key: Buffer;
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
    public readonly networkId: string;
    public readonly protocolVersion: string;
    public readonly softwareVersion: string;
    public readonly nodeType: number;
    public readonly cert: Buffer;
    public readonly key: Buffer;

    public constructor({
        networkId,
        protocolVersion,
        softwareVersion,
        nodeType,
        hostname,
        port,
        onMessage,
        connectionTimeout,
        cert,
        key
    }: MessageChannelOptions) {
        this.networkId = networkId;
        this.protocolVersion = protocolVersion;
        this.softwareVersion = softwareVersion;
        this.nodeType = nodeType;
        this.hostname = hostname;
        this.port = port;
        this.onMessage = onMessage;
        this.connectionTimeout = connectionTimeout;
        this.cert = cert;
        this.key = key;
    }

    public async connect(): Promise<void> {
        return new Promise(resolve => {
            log.info(`Attempting websocket connection to wss://${this.hostname}:${this.port}/ws`);

            const ipv6 = this.hostname.includes(':');
            const url = ipv6 ?
                `wss://[${this.hostname}]:${this.port}/ws` :
                `wss://${this.hostname}:${this.port}/ws`;

            this.ws = new WebSocket(url, {
                rejectUnauthorized: false,
                cert: this.cert,
                key: this.key
            });
            this.ws.on('message', (data: Buffer): void => this.messageHandler(data));
            this.ws.on('error', (err: Error): void => this.onClose(err));
            this.ws.on('close', (_, reason) => this.onClose(new Error(reason)));
            this.ws.on('open', () => {
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

        // Buffer is big enough to contain the length
        if (this.inboundDataBuffer.byteLength >= 5) {
            const messageType = data[0];
            const messageLength = data.readUInt32BE(1);
            const messageReady = data.byteLength === messageLength + 6;
            const bufferOverflow = data.byteLength > messageLength + 6;

            if (messageReady) {
                this.onMessage(this.inboundDataBuffer);

                this.inboundDataBuffer = Buffer.from([]);
            } else if (bufferOverflow) {
                // Very basic protection against badly developed or malicious peers
                // Depending on what they are doing this could happen many times in a row but should eventually recover
                this.inboundDataBuffer = Buffer.from([]);
            }
        }
    }

    private onConnected(): void {
        log.info(`Established websocket connection to Chia node ${this.hostname}:${this.port}`);
    }

    private onClose(err?: Error): void {
        log.info(err || {}, 'Connection closed')
    }
}

export {
    MessageChannel,
    Message
};
