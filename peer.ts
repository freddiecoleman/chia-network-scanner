import { createHash } from 'crypto';
import { create } from 'domain';

interface PeerOptions {
    hostname: string;
    port: number;
    timestamp: number;
}

class Peer {
    private readonly hostname: string;
    private readonly port: number;
    private readonly timestamp: number;
    private visited = false;

    public constructor(peerOptions: PeerOptions) {
        this.hostname = peerOptions.hostname;
        this.port = peerOptions.port;
        this.timestamp = peerOptions.timestamp;
    }

    public hasBeenVisited(): boolean {
        return this.visited;
    }

    public visit(): void {
        this.visited = true;
    }

    public hash(): string {
        return createHash('sha1')
            .update(`${this.hostname}${this.port}${this.timestamp}`)
            .digest('hex');
    }
}

export { Peer };
