type NetworkId = 'testnet' | 'mainnet'; // There will eventually be 3 networks
type ProtocolVersion = '0.0.18'; // For now we will only support one protocol at a time and try to keep up to date

/**
 * Connection options for connecting to a full Chia node with the peer protocol.
 */
interface NodeOptions {
    hostname: string;
    port: number;
}

/**
 * Network and protocol version to connect with.
 */
interface NetworkOptions {
    networkId: NetworkId;
    protocolVersion: ProtocolVersion;
    connectionTimeout: number; // Time within which a peer much respond to peer protocol handshake before bailing
}

/**
 * Details for this peer as it connects to the Chia network.
 */
interface PeerOptions {
    // 32 bytes
    nodeId: Buffer;
    nodeType: number;
}

/**
 * Required configuration for using the Chia Network Scanner.
 */
interface NetworkScannerOptions {
    node: NodeOptions;
    network: NetworkOptions;
    peer: PeerOptions;
}

// Todo: use zod to parse options and ensure valid values
const parseOptions = (options: NetworkScannerOptions) => {

};

export { NetworkScannerOptions };
