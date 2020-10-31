class Peer {
    private visited = false;

    public constructor(private readonly hostname: string, private readonly port: number, private readonly timestamp: number) {}
}

export { Peer };
