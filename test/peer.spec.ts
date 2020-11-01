import { Peer } from '../peer';

describe('peer', () => {
    it('starts not visited', () => {
        const peer = new Peer({
            hostname: 'chia.net',
            port: 22,
            timestamp: 0,
        });

        expect(peer.visited).toBeFalsy();
    });

    it('is visited', () => {
        const peer = new Peer({
            hostname: 'chia.net',
            port: 22,
            timestamp: 0,
        });

        peer.visit();

        expect(peer.visited).toBeTruthy();
    });

    it('generates a sha1 hash', () => {
        const peer = new Peer({
            hostname: 'chia.net',
            port: 22,
            timestamp: 0,
        });

        expect(peer.hash()).toMatchInlineSnapshot(
            `"18054e05eafa0236f244de42f8bd0df1aed2bb2f"`
        );
    });

    it('does not include timestamp in the hash', () => {
        const peer1 = new Peer({
            hostname: 'chia.net',
            port: 22,
            timestamp: 999,
        });

        const peer2 = new Peer({
            hostname: 'chia.net',
            port: 22,
            timestamp: 123,
        });

        expect(peer1.hash()).toEqual(peer2.hash());
    });
});
