import * as async from 'async';
import { NetworkScannerOptions, parseOptions } from './options';
import { Peer } from './peer';

class ChiaNetworkScanner {
    private peers = new Map<string, Peer>();

    public constructor(private readonly options: NetworkScannerOptions) {
        this.options = parseOptions(options);
    }

    /**
     * Peers are added to an async queue and a simple graph traversal of the network is performed.
     */
    public scan(): Peer[] {
        const { node } = this.options;
        const queue = async.queue(this.processPeer, this.options.concurrency);

        // The network scan is started from our own Chia node
        queue.push(new Peer({
            hostname: node.hostname,
            port: node.port,
            timestamp: Math.floor(Date.now() / 1000)
        }));

        // Reset peers from any previous scans
        this.peers = new Map<string, Peer>();

        return [];
    }

    /**
     * Finds peers of a peer.
     */
    private processPeer(peer: Peer, callback: async.ErrorCallback): void {
        const peerHash = peer.hash();

        if (!this.peers.has(peerHash)) {
            this.peers.set(peerHash, peer);
        }

        // We only visit each peer once
        if (peer.hasBeenVisited()) {
            return callback();
        }

        // Set to visited immediately to prevent async processing of the same peer
        peer.visit();

        // Todo: Establish TCP connection

        // Todo: Perform application level handshake

        // Todo: Request peers

        // Todo: Close TCP connection

        callback();
    }
}

export { ChiaNetworkScanner };
