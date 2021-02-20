import fs from 'fs';
import WebSocket from 'ws';
import { log } from './log';
import { NetworkId, ProtocolVersion } from './options';

interface MessageChannelOptions {
    networkId: NetworkId;
    protocolVersion: ProtocolVersion;
    softwareVersion: string;
    nodeId: string;
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
    public readonly networkId: NetworkId;
    public readonly protocolVersion: ProtocolVersion;
    public readonly softwareVersion: string;
    public readonly nodeId: Buffer;
    public readonly nodeType: number;
    public readonly cert: Buffer;
    public readonly key: Buffer;

    public constructor({
        networkId,
        protocolVersion,
        softwareVersion,
        nodeId,
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
        this.nodeId = Buffer.from(nodeId);
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

            this.ws = new WebSocket(`wss://${this.hostname}:${this.port}/ws`, {
                rejectUnauthorized: false,
                cert: this.cert,
                key: this.key
            });
            this.ws.on('message', (data: Buffer): void => this.messageHandler(data));
            this.ws.on('error', (err: Error): void => this.onClose(err));
            this.ws.on('close', () => this.onClose());
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
