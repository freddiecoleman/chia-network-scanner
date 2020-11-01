# Chia Network Scanner

Performs an asyncronous scan of the Chia network.

Rather than implementing a full node it communicates with another full node and requests it's peers - from there a graph traversal of the network is performed.

This powers the node count charts of [Chia Explorer](https://www.chiaexplorer.com).

## Usage

This can be installed as a module using npm:

```bash
npm install chia-network-scanner
```

Here is an example of how to scan the Chia Network:

```javascript
import { ChiaNetworkScanner } from 'chia-network-scanner';

const chiaNetworkScanner = new ChiaNetworkScanner({
    // The network to scan and protocol to use
    network: {
        networkId: 'testnet',
        protocolVersion: '0.0.18',
    },

    // The first node to scan, you don't have to use localhost but it works if you are running a Chia node locally
    node: {
        hostname: 'localhost',
        port: 8444,
    },

    // Identifies this peer on the network
    peer: {
        nodeId: '1337-network-scanner............', // must be 32 characters long
        nodeType: 1,
    },

    // Used to timeout on various operations such as handshake
    connectionTimeout: 2500,

    // Number of peers to scan concurrently. Bigger is faster but uses more sockets and memory :)
    concurrency: 50,
});

const peers = await chiaNetworkScanner.scan();
```

