import * as z from 'zod';

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
    // Time within which a peer much respond to peer protocol handshake before bailing in ms.
    connectionTimeout: number;
}

/**
 * Details for this peer as it connects to the Chia network.
 */
interface PeerOptions {
    nodeId: string;
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

const nodeOptionsSchema = z.object({
    hostname: z.string(),
    port: z
        .number()
        .min(0)
        .max(65535)
});

const networkOptionsSchema = z.object({
    networkId: z.union([
        z.literal('testnet'),
        z.literal('mainnet')
    ]),
    protocolVersion: z.literal('0.0.18'),
    connectionTimeout: z
        .number()
        .min(250)
        .max(30000)
});

const peerOptionsSchema = z.object({
    nodeId: z
        .string()
        .min(32)
        .max(32),
    nodeType: z.number() // Todo: improve validation of this
});

const networkScannerOptionsSchema = z.object({
    node: nodeOptionsSchema,
    network: networkOptionsSchema,
    peer: peerOptionsSchema
});

const parseOptions = (options: NetworkScannerOptions): NetworkScannerOptions => networkScannerOptionsSchema.parse(options);

export {
    NetworkScannerOptions,
    parseOptions
};
