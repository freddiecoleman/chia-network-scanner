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
}

export { Peer };
