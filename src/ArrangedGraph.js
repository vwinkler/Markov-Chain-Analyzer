class Edge {
    constructor(sourceId, targetId, label) {
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.label = label;
    }
}

class ArrangedGraph {
    constructor(nodes, numTransientNodes, edges) {
        this.nodes = nodes;
        this.numTransientNodes = numTransientNodes;
        this.edges = edges;
    }

    get numAbsorbingNodes() {
        return this.numNodes - this.numTransientNodes;
    }

    get numNodes() {
        return this.nodes.length;
    }
}