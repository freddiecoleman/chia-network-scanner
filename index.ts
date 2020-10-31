import { NetworkScannerOptions, parseOptions } from './options';
import { Peer } from './peer';

class ChiaNetworkScanner {
    public constructor(private readonly options: NetworkScannerOptions) {
        this.options = parseOptions(options);
    }

    public scan(): Peer[] {
        return [];
    }
}

export { ChiaNetworkScanner };
