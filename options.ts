import * as z from 'zod';

// There will soon be 3 networks.
type NetworkId = 'testnet' | 'mainnet';

// For now we will just try to keep up to date with the latest version. Should be easy as we do not implement the entire protocol.
type ProtocolVersion = '0.0.29';

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
    softwareVersion: string;
}

/**
 * Details for this peer as it connects to the Chia network.
 */
interface PeerOptions {
    nodeType: number;
}

/**
 * Required configuration for using the Chia Network Scanner.
 */
interface NetworkScannerOptions {
    node: NodeOptions;
    network: NetworkOptions;
    peer: PeerOptions;

    // Time within which a peer much respond to peer protocol handshake before bailing in ms.
    connectionTimeout: number;

    // Number of peers to scan at the same time (bigger is faster but uses more sockets and memory)
    concurrency: number;

    // Path to full node public cert
    certPath: string;

    // Path to full node public key
    keyPath: string;
}

const nodeOptionsSchema = z.object({
    hostname: z.string(),
    port: z
        .number()
        .min(0)
        .max(65535)
});

const networkOptionsSchema = z.object({
    networkId: z
        .string()
        .min(32)
        .max(32),
    protocolVersion: z.literal('0.0.29'),
    softwareVersion: z.string()
});

const peerOptionsSchema = z.object({
    nodeType: z.number() // Todo: improve validation of this
});

const networkScannerOptionsSchema = z.object({
    node: nodeOptionsSchema,
    network: networkOptionsSchema,
    peer: peerOptionsSchema,
    connectionTimeout: z
        .number()
        .min(250)
        .max(30000),
    concurrency: z
        .number()
        .min(1)
        .max(255), // Fairly arbitrary, may want to increase this later ¯\_(ツ)_/¯
    certPath: z.string(),
    keyPath: z.string()
});

const parseOptions = (options: NetworkScannerOptions): NetworkScannerOptions => networkScannerOptionsSchema.parse(options);

export {
    NetworkScannerOptions,
    NetworkId,
    ProtocolVersion,
    parseOptions
};
