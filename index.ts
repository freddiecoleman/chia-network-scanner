import fs from 'fs';
import * as async from 'async';
import { log } from './log';
import { NetworkScannerOptions, parseOptions } from './options';
import { Peer } from './peer';
import { PeerConnection } from './PeerConnection';

class ChiaNetworkScanner {
    private readonly queue = async.queue(this.processPeer.bind(this), this.options.concurrency);
    private peers = new Map<string, Peer>();
    private scanInProgress = false;

    public constructor(private readonly options: NetworkScannerOptions) {
        this.options = parseOptions(options);
    }

    /**
     * The scan is started from the full node provided in the options.
     */
    public async scan(): Promise<Peer[]> {
        if (this.scanInProgress) {
            throw new Error('Only one scan be be performed at a time');
        }

        log.info('Starting scan of Chia Network');

        // Prevents caller from executing async scan more than once at a time
        this.scanInProgress = true;

        const { startNodes } = this.options;

        // Reset peers from any previous scans
        this.peers = new Map<string, Peer>();

        // The network scan is started from passed in start nodes
        startNodes.forEach(node => {
            this.queue.push(new Peer({
                hostname: node.hostname,
                port: node.port,
                timestamp: Math.floor(Date.now() / 1000)
            }), (e) => { console.log(`fin ${node.hostname}:${node.port}`, e); });
        });

        await this.queue.drain();

        // Async network scan has finished, another could now be performed
        this.scanInProgress = false;
        
        return [
            ...this.peers.values()
        ];
    }

    /**
     * Peers are added to the async queue and a graph traversal of the network is performed.
     * 
     * The concurrency parameter passed in the constructor specifies how many of these are executed concurrently via the event loop.
     */
    private async processPeer(proposedPeer: Peer): Promise<void> {
        const peerLogger = log.child({
            ...proposedPeer
        });

        const ipv6 = proposedPeer.hostname.includes(':');

        // Only scan ipv4 because ipv6 nodes can appear with both their ipv4 address and their ipv6 address
        if (ipv6) {
            return;
        }

        const { connectionTimeout, network, peer: peerOptions, certPath, keyPath } = this.options;
        const peerHash = proposedPeer.hash();

        if (!this.peers.has(peerHash)) {
            peerLogger.debug('First time seeing peer');

            this.peers.set(peerHash, proposedPeer);
        }

        // Ensures we get the visited value of peer from previous traversal
        const peer = this.peers.get(peerHash) as Peer;

        // We only visit each peer once
        if (peer.visited) {
            peerLogger.debug('Skipping already visited peer');

            if (proposedPeer.timestamp > peer.timestamp) {
                log.debug(`Updating visited peer ${proposedPeer.hostname}:${proposedPeer.port} to more recent timestamp`);

                this.peers.set(peerHash, proposedPeer);
            }

            return;
        }

        peerLogger.info('Visiting peer');

        // Set to visited immediately to prevent async processing of the same peer
        peer.visit();

        // Opens a websocket connection with the peer we are processing
        const peerConnection = new PeerConnection({
            networkId: network.networkId,
            protocolVersion: network.protocolVersion,
            softwareVersion: network.softwareVersion,
            nodeType: peerOptions.nodeType,
            hostname: peer.hostname,
            port: peer.port,
            connectionTimeout,
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath)
        });

        peerLogger.info('Establishing websocket connection');

        try {
             // Establish websocket connection
            await peerConnection.connect();

            peerLogger.info('Websocket connection established');

            // Performs application level handshake with peer
            await peerConnection.handshake();

            const peers = await peerConnection.getPeers();

            // Enqueue peers of peer for async processing
            this.queue.push(peers);

            // Close websocket connection
            await peerConnection.close();
        } catch (err) {
            log.error(err);
        }
    }
}

export { ChiaNetworkScanner };
