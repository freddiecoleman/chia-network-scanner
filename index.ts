import * as async from 'async';
import { NetworkScannerOptions, parseOptions } from './options';
import { Peer } from './peer';

class ChiaNetworkScanner {
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

        return [];
    }

    /**
     * Finds peers of a peer.
     */
    private processPeer(peer: Peer, callback: async.ErrorCallback) {

        callback();
    }
}

export { ChiaNetworkScanner };
