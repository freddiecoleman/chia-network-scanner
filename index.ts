import { NetworkScannerOptions, parseOptions } from './options';


class ChiaNetworkScanner {
    public constructor(private readonly options: NetworkScannerOptions) {
        this.options = parseOptions(options);
    }
}

export { ChiaNetworkScanner };
