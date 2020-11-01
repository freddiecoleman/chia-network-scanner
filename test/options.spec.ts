import { parseOptions } from '../options'

describe('options parser', () => {
    it('rejects nodeId that is not 32 characters in length', () => {
        expect(() =>
            parseOptions({
                network: {
                    networkId: 'testnet',
                    protocolVersion: '0.0.18',
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
            })
        ).toThrowErrorMatchingInlineSnapshot(`
            "1 validation issue(s)

              Issue #0: too_small at peer.nodeId
              Should be at least 32 characters
            "
        `)
    })
})
