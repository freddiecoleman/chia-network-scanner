import { decodeMessage, encodeMessage } from '../encoder';

describe('encoder', () => {
    describe('encodeMessage', () => {
        it('encodes a message', () => {
            const encodedMessage = encodeMessage('give_monies_please', {
                amount: 1000000,
            });

            expect(encodedMessage.toString('hex')).toMatchInlineSnapshot(
                `"00000025a2616672676976655f6d6f6e6965735f706c656173656164a166616d6f756e741a000f4240"`
            );
        });
    });

    describe('decodeMessage', () => {
        it('decodes a message', () => {
            const decodedMessage = decodeMessage(
                Buffer.from(
                    '00000025a2616672676976655f6d6f6e6965735f706c656173656164a166616d6f756e741a000f4240',
                    'hex'
                )
            );

            expect(decodedMessage).toMatchInlineSnapshot(`
                Object {
                  "d": Object {
                    "amount": 1000000,
                  },
                  "f": "give_monies_please",
                }
            `);
        });
    });
});
