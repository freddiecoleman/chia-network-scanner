import { decodeMessage } from '../encoder';
import { encodeMessage } from '../encoder';
import { decodeString, encodeString } from '../encoder';

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
                `"0100000007746573746e657400000006302e302e323900000006312e30726332e44c01"`
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
    });
});
