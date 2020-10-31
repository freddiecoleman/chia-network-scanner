import * as async from 'async';
import { log } from './log';
import { NetworkScannerOptions, parseOptions } from './options';
import { Peer } from './peer';
import { PeerConnection } from './PeerConnection';

class ChiaNetworkScanner {
    private readonly queue = async.queue(this.processPeer, this.options.concurrency);
    private peers = new Map<string, Peer>();

    public constructor(private readonly options: NetworkScannerOptions) {
        this.options = parseOptions(options);
    }

    /**
     * Peers are added to an async queue and a simple graph traversal of the network is performed.
     */
    public async scan(): Promise<Peer[]> {
        const { node } = this.options;

        // Reset peers from any previous scans
        this.peers = new Map<string, Peer>();

        // The network scan is started from our own Chia node
        this.queue.push(new Peer({
            hostname: node.hostname,
            port: node.port,
            timestamp: Math.floor(Date.now() / 1000)
        }));

        await this.queue.drain();
        
        return [
            ...this.peers.values()
        ];
    }

    /**
     * Finds peers of a peer.
     */
    private async processPeer(peer: Peer, callback: async.ErrorCallback): Promise<void> {
        const { connectionTimeout, network, peer: peerOptions } = this.options;
        const peerHash = peer.hash();

        if (!this.peers.has(peerHash)) {
            this.peers.set(peerHash, peer);
        }

        // We only visit each peer once
        if (peer.visited) {
            return callback();
        }

        // Set to visited immediately to prevent async processing of the same peer
        peer.visit();

        // Opens a TCP connection with the peer we are processing
        const peerConnection = new PeerConnection({
            networkId: network.networkId,
            protocolVersion: network.protocolVersion,
            nodeId: peerOptions.nodeId,
            nodeType: peerOptions.nodeType,
            hostname: peer.hostname,
            port: peer.port,
            connectionTimeout
        });

        // Performs application level handshake with peer
        await peerConnection.handshake();

        const peers = await peerConnection.getPeers();

        // Enqueue peers of peer for async processing
        this.queue.push(peers);

        try {
            // Close TCP connection
            await peerConnection.close();
        } catch (err) {
            log.err(err);
        } finally {
            callback();
        }
    }
}

export { ChiaNetworkScanner };
