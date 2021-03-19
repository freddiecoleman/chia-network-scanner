import { decodeMessage } from '../encoder';
import { encodeMessage } from '../encoder';
import { decodeString, encodeString } from '../encoder';
import { Peer } from '../peer';

describe('encoder', () => {
    describe('encodeString', () => {
        it('encodes a string', () => {
            const encodedString = encodeString('Chia Network');

            expect(encodedString.toString('hex')).toMatchInlineSnapshot(
                `"0000000c43686961204e6574776f726b"`
            );
        });

        it('decodes a string', () => {
            const encodedString = encodeString('Chia Network');
            const decodedString = decodeString(encodedString);

            expect(decodedString).toEqual('Chia Network');
        });
    });

    describe('encodeMessage', () => {
        it('encodes handshake message', () => {
            const encodedHandshake = encodeMessage(1, {
                network_id: 'mainnet',
                protocol_version: '0.0.32',
                software_version: '1.0.1',
                server_port: 8444,
                node_type: 1,
            });

            // 01 00 0000002c 000000076d61696e6e657400000006302e302e333200000005312e302e3120fc010000000100010000000131

            // 01 - message type

            // 00 - optional and not present

            // 0000002c - length of message - 44

            // handshake message 00000007 6d61696e6e6574 00000006 302e302e3332 00000005 312e302e31 20fc 01 00000001 00010000000131

            // length of network id = 7

            // 6d61696e6e6574 - network id = mainnet

            // 00000006 - length of protocol version - 6

            // 302e302e3332 - protocol version = 0.0.32

            // 00000005 length of software version - 5

            // 312e302e31 -software version = 1.0.1

            // 20fc - port - port = 8444

            // 01 - node type = full node

            // 00000001 - length of list of capabilities = 1

            // 00010000000131 dunno lol

            expect(encodedHandshake.toString('hex')).toMatchInlineSnapshot(
                `"01000000002c000000076d61696e6e657400000006302e302e333200000005312e302e3120fc010000000100010000000131"`
            );
        });

        it('encodes handshake_ack message', () => {
            const encodedHandshakeAck = encodeMessage(2, {});

            expect(encodedHandshakeAck.toString('hex')).toMatchInlineSnapshot(
                `"020000000000"`
            );
        });

        it('encodes request_peers message', () => {
            const encodedRequestPeers = encodeMessage(40, {});

            expect(encodedRequestPeers.toString('hex')).toMatchInlineSnapshot(
                `"280000000000"`
            );
        });

        it('encodes respond_peers message', () => {
            const encodedRespondPeers = encodeMessage(41, {
                peer_list: [
                    new Peer({
                        hostname: 'localhost',
                        port: 58444,
                        timestamp: 12345,
                    }),
                    new Peer({
                        hostname: 'sumo.chia.net',
                        port: 58444,
                        timestamp: 9999999,
                    }),
                    new Peer({
                        hostname: '127.0.0.2',
                        port: 58444,
                        timestamp: 987654,
                    }),
                ],
            });

            expect(encodedRespondPeers.toString('hex')).toMatchInlineSnapshot(
                `"29000000004d00000003000000096c6f63616c686f7374e44c00000000000030390000000d73756d6f2e636869612e6e6574e44c000000000098967f000000093132372e302e302e32e44c00000000000f1206"`
            );
        });
    });

    describe('decodeMessages', () => {
        it('decodes handshake message', () => {
            const encodedHandshake = Buffer.from('01000000002c000000076d61696e6e657400000006302e302e333200000005312e302e3120fc010000000100010000000131', 'hex');
            const decodedHandshake = decodeMessage(encodedHandshake);

            // 01 00 0000002c 000000076d61696e6e657400000006302e302e333200000005312e302e3120fc010000000100010000000131

            // 01 - message type

            // 00 - optional and not present

            // 0000002c - length of message - 44

            // handshake message 00000007 6d61696e6e6574 00000006 302e302e3332 00000005 312e302e31 20fc 01 00000001 00010000000131

            // length of network id = 7

            // 6d61696e6e6574 - network id = mainnet

            // 00000006 - length of protocol version - 6

            // 302e302e3332 - protocol version = 0.0.32

            // 00000005 length of software version - 5

            // 312e302e31 -software version = 1.0.1

            // 20fc - port - port = 8444

            // 01 - node type = full node

            // 00000001 - length of list of capabilities = 1

            // 00010000000131 dunno lol

            expect(decodedHandshake).toEqual({
                network_id: 'mainnet',
                protocol_version: '0.0.32',
                software_version: '1.0.1',
                server_port: 8444,
                node_type: 1,
            });
        });

        it('decodes handshake_ack message', () => {
            const encodedHandshakeAck = encodeMessage(2, {});
            const decodedHandshakeAck = decodeMessage(encodedHandshakeAck);

            expect(decodedHandshakeAck).toEqual({});
        });

        it('decodes request_peers message', () => {
            const encodedRequestPeers = encodeMessage(40, {});
            const decodedRequestPeers = decodeMessage(encodedRequestPeers);

            expect(decodedRequestPeers).toEqual({});
        });

        it('decodes respond_peers message', () => {
            const encodedRespondPeers = encodeMessage(41, {
                peer_list: [
                    new Peer({
                        hostname: 'localhost',
                        port: 58444,
                        timestamp: 12345,
                    }),
                    new Peer({
                        hostname: 'sumo.chia.net',
                        port: 58444,
                        timestamp: 9999999,
                    }),
                    new Peer({
                        hostname: '127.0.0.2',
                        port: 58444,
                        timestamp: 987654,
                    }),
                ],
            });
            const decodedRespondPeers = decodeMessage(encodedRespondPeers);

            expect(decodedRespondPeers).toMatchInlineSnapshot(`
                Object {
                  "peer_list": Array [
                    Peer {
                      "hostname": "localhost",
                      "port": 58444,
                      "timestamp": 12345,
                      "visited": false,
                    },
                    Peer {
                      "hostname": "sumo.chia.net",
                      "port": 58444,
                      "timestamp": 9999999,
                      "visited": false,
                    },
                    Peer {
                      "hostname": "127.0.0.2",
                      "port": 58444,
                      "timestamp": 987654,
                      "visited": false,
                    },
                  ],
                }
            `);
        });
    });
});
