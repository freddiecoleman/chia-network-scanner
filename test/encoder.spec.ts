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
                network_id: 'testnet',
                protocol_version: '0.0.29',
                software_version: '1.0rc2',
                server_port: 58444,
                node_type: 1,
            });

            expect(encodedHandshake.toString('hex')).toMatchInlineSnapshot(
                `"01746573746e657400000006302e302e323900000006312e30726332e44c01"`
            );
        });

        it('encodes handshake_ack message', () => {
            const encodedHandshakeAck = encodeMessage(2, {});

            expect(encodedHandshakeAck.toString('hex')).toMatchInlineSnapshot(
                `"02"`
            );
        });

        it('encodes request_peers message', () => {
            const encodedRequestPeers = encodeMessage(40, {});

            expect(encodedRequestPeers.toString('hex')).toMatchInlineSnapshot(
                `"28"`
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
                `"2900000003000000096c6f63616c686f7374e44c00000000000030390000000d73756d6f2e636869612e6e6574e44c000000000098967f000000093132372e302e302e32e44c00000000000f1206"`
            );
        });
    });

    describe('decodeMessages', () => {
        it('decodes handshake message', () => {
            const encodedHandshake = encodeMessage(1, {
                network_id: 'testnet',
                protocol_version: '0.0.29',
                software_version: '1.0rc2',
                server_port: 58444,
                node_type: 1,
            });
            const decodedHandshake = decodeMessage(encodedHandshake);

            expect(decodedHandshake).toEqual({
                network_id: 'testnet',
                protocol_version: '0.0.29',
                software_version: '1.0rc2',
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
