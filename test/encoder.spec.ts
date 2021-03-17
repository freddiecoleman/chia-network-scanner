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
                network_id: 'testnet9',
                protocol_version: '0.0.32',
                software_version: '0.2.10.dev1',
                server_port: 58444,
                node_type: 1
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
                `"01000000003300000008746573746e65743900000006302e302e33320000000b302e322e31302e64657631e44c010000000100010000000131"`
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
            const encodedHandshake = Buffer.from('01000000003300000008746573746e65743900000006302e302e33320000000b302e322e31302e64657631e44c010000000100010000000131', 'hex');
            const decodedHandshake = decodeMessage(encodedHandshake);

            // latest rc9 - 01000000003300000008746573746e65743900000006302e302e33320000000b302e322e31302e64657631e44c010000000100010000000131
            // 01 00 00000033 00000008746573746e65743900000006302e302e33320000000b302e322e31302e64657631e44c010000000100010000000131

            // 01 - message type

            // id is optional - For Optionals, there is a one byte prefix, 1 iff object is present, 0 iff not.
            // 00 - optional and not present! 

            // 00000033 ?? - length of rest of message... 51 in decimal - i have manually confirmed that there are 51 bytes remaining to the end of the hex

            // Full message containing handshake - 00000008746573746e65743900000006302e302e33320000000b302e322e31302e64657631e44c010000000100010000000131

            // 00000008 746573746e657439 00000006 302e302e3332 0000000b 302e322e31302e64657631 e44c 01 0000000100010000000131

            // 00000008 - length of network id string 8 in decimal

            // 746573746e657439 - the string testnet9

            // 00000006 - length of protocol_version  6 in decimal

            // 302e302e3332 - protocol version = 0.0.32

            // 0000000b - length of software version 11 in decimal

            // 302e322e31302e64657631 - software version = 0.2.10.dev1

            // e44c - server port 58444

            // 01 - node type = full node

            // 00000001 - length of list of capabilities

            // 00010000000131 - capabilities ??

            expect(decodedHandshake).toEqual({
                network_id: 'testnet9',
                protocol_version: '0.0.32',
                software_version: '0.2.10.dev1',
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
