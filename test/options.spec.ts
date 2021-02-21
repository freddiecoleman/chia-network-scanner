import { parseOptions } from '../options';

describe('options parser', () => {
    it('rejects nodeId that is not 32 characters in length', () => {
        expect(() =>
            parseOptions({
                network: {
                    networkId: 'testnet',
                    protocolVersion: '0.0.29',
                    softwareVersion: '1.0rc2'
                },
                node: {
                    hostname: 'chia.net',
                    port: 123,
                },
                peer: {
                    nodeId: '1337-network-scanner',
                    nodeType: 1,
                },
                connectionTimeout: 2500,
                concurrency: 50,
                certPath: '/root/cert.crt',
                keyPath: '/root/key.key'
            })
        ).toThrowErrorMatchingInlineSnapshot(`
            "1 validation issue(s)

              Issue #0: too_small at peer.nodeId
              Should be at least 32 characters
            "
        `);
    });

    it('rejects concurrency greater than 255', () => {
        expect(() =>
            parseOptions({
                network: {
                    networkId: 'testnet',
                    protocolVersion: '0.0.29',
                    softwareVersion: '1.0rc2'
                },
                node: {
                    hostname: 'chia.net',
                    port: 123,
                },
                peer: {
                    nodeId: '1337-network-scanner............',
                    nodeType: 1,
                },
                connectionTimeout: 2500,
                concurrency: 10000,
                certPath: '/root/cert.crt',
                keyPath: '/root/key.key'
            })
        ).toThrowErrorMatchingInlineSnapshot(`
            "1 validation issue(s)

              Issue #0: too_big at concurrency
              Value should be less than or equal to 255
            "
        `);
    });

    it('rejects connection timeout less than 250 ms', () => {
        expect(() =>
            parseOptions({
                network: {
                    networkId: 'testnet',
                    protocolVersion: '0.0.29',
                    softwareVersion: '1.0rc2'
                },
                node: {
                    hostname: 'chia.net',
                    port: 123,
                },
                peer: {
                    nodeId: '1337-network-scanner............',
                    nodeType: 1,
                },
                connectionTimeout: 0,
                concurrency: 100,
                certPath: '/root/cert.crt',
                keyPath: '/root/key.key'
            })
        ).toThrowErrorMatchingInlineSnapshot(`
            "1 validation issue(s)

              Issue #0: too_small at connectionTimeout
              Value should be greater than or equal to 250
            "
        `);
    });

    it('rejects connection timeout greater than 30 seconds', () => {
        expect(() =>
            parseOptions({
                network: {
                    networkId: 'testnet',
                    protocolVersion: '0.0.29',
                    softwareVersion: '1.0rc2'
                },
                node: {
                    hostname: 'chia.net',
                    port: 123,
                },
                peer: {
                    nodeId: '1337-network-scanner............',
                    nodeType: 1,
                },
                connectionTimeout: 60000,
                concurrency: 100,
                certPath: '/root/cert.crt',
                keyPath: '/root/key.key'
            })
        ).toThrowErrorMatchingInlineSnapshot(`
            "1 validation issue(s)

              Issue #0: too_big at connectionTimeout
              Value should be less than or equal to 30000
            "
        `);
    });

    it('rejects port greater than 65535', () => {
        expect(() =>
            parseOptions({
                network: {
                    networkId: 'testnet',
                    protocolVersion: '0.0.29',
                    softwareVersion: '1.0rc2'
                },
                node: {
                    hostname: 'chia.net',
                    port: 9999999,
                },
                peer: {
                    nodeId: '1337-network-scanner............',
                    nodeType: 1,
                },
                connectionTimeout: 5000,
                concurrency: 100,
                certPath: '/root/cert.crt',
                keyPath: '/root/key.key'
            })
        ).toThrowErrorMatchingInlineSnapshot(`
            "1 validation issue(s)

              Issue #0: too_big at node.port
              Value should be less than or equal to 65535
            "
        `);
    });

    it('pases valid options', () => {
        const options = parseOptions({
            network: {
                networkId: 'testnet',
                protocolVersion: '0.0.29',
                softwareVersion: '1.0rc2'
            },
            node: {
                hostname: 'chia.net',
                port: 123,
            },
            peer: {
                nodeId: '1337-network-scanner............',
                nodeType: 1,
            },
            connectionTimeout: 2500,
            concurrency: 50,
            certPath: '/root/cert.crt',
            keyPath: '/root/key.key'
        });

        expect(options).toMatchInlineSnapshot(`
            Object {
              "concurrency": 50,
              "connectionTimeout": 2500,
              "network": Object {
                "networkId": "testnet",
                "protocolVersion": "0.0.29",
              },
              "node": Object {
                "hostname": "chia.net",
                "port": 123,
              },
              "peer": Object {
                "nodeId": "1337-network-scanner............",
                "nodeType": 1,
              },
            }
        `);
    });
});
