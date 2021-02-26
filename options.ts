import * as z from 'zod';

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
    networkId: string;
    protocolVersion: string;
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
    startNodes: NodeOptions[];
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
        .min(64)
        .max(64),
    protocolVersion: z.string(),
    softwareVersion: z.string()
});

const peerOptionsSchema = z.object({
    nodeType: z.number() // Todo: improve validation of this
});

const networkScannerOptionsSchema = z.object({
    startNodes: z.array(nodeOptionsSchema),
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
    parseOptions
};
