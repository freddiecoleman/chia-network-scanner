import tls from 'tls';
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

const TCP_CLOSE_TIMEOUT = 5000;

class MessageChannel {
    private readonly onMessage: (message: Buffer) => void;
    private readonly tlsClient: tls.TLSSocket;
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
        this.tlsClient = tls.connect(port, hostname, { rejectUnauthorized: false });

        this.tlsClient.on('data', (data: Buffer) => {
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
        });

        this.tlsClient.on('close', () => this.onClose());
        this.tlsClient.on('error', err => this.onClose(err));
        this.tlsClient.on('secureConnect', () => this.onConnected());
    }

    public sendMessage(message: Buffer): void {
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
