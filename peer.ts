import { createHash } from 'crypto';
import { create } from 'domain';

interface PeerOptions {
    hostname: string;
    port: number;
    timestamp: number;
}

class Peer {
    public readonly hostname: string;
    public readonly port: number;
    public readonly timestamp: number;
    public visited = false;

    public constructor(peerOptions: PeerOptions) {
        this.hostname = peerOptions.hostname;
        this.port = peerOptions.port;
        this.timestamp = peerOptions.timestamp;
    }

    public visit(): void {
        this.visited = true;
    }

    public hash(): string {
        return createHash('sha1')
            // Timestamp is not included as the same peer may be reported with a different timestamp
            .update(`${this.hostname}${this.port}`)
            .digest('hex');
    }
}

export { Peer };
