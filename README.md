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
        protocolVersion: '0.0.29',
        softwareVersion: '1.0rc2'
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

    // Full node public key
    keyPath: '/root/123.key',

    // Full node public cert
    certPath: '/root/123.crt'
});

const peers = await chiaNetworkScanner.scan();
```

The result of the scan is an array of peer objects that have a `hostname`, `port` and `timestamp`.

## Logs

You will see lots of logs about connections refused and not handling messages that other peers have sent to you. This is fine. Example:

```
{"level":30,"time":1604247342367,"pid":72087,"hostname":"chiaexplorer","msg":"Sending handshake message"}
{"level":30,"time":1604247342406,"pid":72087,"hostname":"chiaexplorer","msg":"Established TCP connection to Chia node 92.29.105.141:8444"}
{"level":30,"time":1604247342442,"pid":72087,"hostname":"chiaexplorer","msg":"Sending handshake_ack message"}
{"level":30,"time":1604247342442,"pid":72087,"hostname":"chiaexplorer","msg":"Sending request_peers message"}
{"level":40,"time":1604247342465,"pid":72087,"hostname":"chiaexplorer","msg":"No handler for new_tip message. Discarding it."}
{"level":40,"time":1604247342482,"pid":72087,"hostname":"chiaexplorer","msg":"No handler for new_tip message. Discarding it."}
{"level":40,"time":1604247342482,"pid":72087,"hostname":"chiaexplorer","msg":"No handler for new_tip message. Discarding it."}
{"level":40,"time":1604247342482,"pid":72087,"hostname":"chiaexplorer","msg":"No handler for request_mempool_transactions message. Discarding it."}
{"level":30,"time":1604247342528,"pid":72087,"hostname":"chiaexplorer","msg":"Connection closed"}
{"level":30,"time":1604247342652,"pid":72087,"hostname":"chiaexplorer","errno":"ECONNREFUSED","code":"ECONNREFUSED","syscall":"connect","address":"2003:db:772e:500:5ce7:935c:aa0b:8834","port":8444,"stack":"Error: connect ECONNREFUSED 2003:db:772e:500:5ce7:935c:aa0b:8834:8444\n    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)","type":"Error","msg":"Connection closed"}
{"level":30,"time":1604247342652,"pid":72087,"hostname":"chiaexplorer","msg":"Connection closed"}
{"level":30,"time":1604247342681,"pid":72087,"hostname":"chiaexplorer","errno":"ENETUNREACH","code":"ENETUNREACH","syscall":"connect","address":"2a01:c23:78b3:2801:4085:7f6f:5cbf:ba5","port":8444,"stack":"Error: connect ENETUNREACH 2a01:c23:78b3:2801:4085:7f6f:5cbf:ba5:8444\n    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)","type":"Error","msg":"Connection closed"}
{"level":30,"time":1604247342682,"pid":72087,"hostname":"chiaexplorer","msg":"Connection closed"}
{"level":30,"time":1604247342698,"pid":72087,"hostname":"chiaexplorer","visited":false,"hostname":"165.227.56.10","port":8444,"timestamp":1602428570,"msg":"Visiting peer"}
{"level":30,"time":1604247342699,"pid":72087,"hostname":"chiaexplorer","msg":"Sending handshake message"}
```

## Contributions welcome

Feel free to contribute with PRs or even by throwing ideas into the issue tab.
