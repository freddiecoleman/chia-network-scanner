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
                network_id: Buffer.from(
                    'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
                    'hex'
                ),
                protocol_version: '0.0.29',
                software_version: '0.2.2',
                server_port: 58444,
                node_type: 1,
            });

            // 01 - message type
            // 00000036 - length of the rest of the message, ignoring the 00 at the end... must be part of how streamable works
            // d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35 = network_id = testnet
            // 00000006 = length of protocol version (6)
            // 302e302e3239 = protocol version = 0.0.29
            // 00000005 = length of software version (5)
            // 302e322e32 = software version - 0.2.2
            // e44c = port = 58444
            // 01 = node type = full node
            // 0 = ???? must be to signal the end of the message
            expect(encodedHandshake.toString('hex')).toMatchInlineSnapshot(
                `"0100000036d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab3500000006302e302e323900000005302e322e32e44c0100"`
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
                `"290000004d00000003000000096c6f63616c686f7374e44c00000000000030390000000d73756d6f2e636869612e6e6574e44c000000000098967f000000093132372e302e302e32e44c00000000000f120600"`
            );
        });
    });

    describe('decodeMessages', () => {
        it('decodes handshake message', () => {
            const encodedHandshake = encodeMessage(1, {
                network_id: Buffer.from(
                    'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
                    'hex'
                ),
                protocol_version: '0.0.29',
                software_version: '0.2.2',
                server_port: 58444,
                node_type: 1,
            });
            const decodedHandshake = decodeMessage(encodedHandshake);

            expect(decodedHandshake).toEqual({
                network_id: Buffer.from(
                    'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
                    'hex'
                ),
                protocol_version: '0.0.29',
                software_version: '0.2.2',
                server_port: 58444,
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
