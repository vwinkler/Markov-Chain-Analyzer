class GraphToArrangedGraphConverter {

    constructor(graph) {
        this.graph = graph;
        this.nodeNames = [];
        this.numTransientStates = 0;
    }

    findTransientNodeIds() {
        let transientNodeIds = new Set();
        for (const edgeId in this.graph.edges) {
            let edge = this.graph.edges[edgeId];

            if (edge.startNodeid != edge.endNodeid && edge.weight != 0) {
                transientNodeIds.add(edge.startNodeid);
            }
        }
        return transientNodeIds;
    }

    translateNodes() {
        let transientNodeIds = this.findTransientNodeIds();
        this.numTransientStates = transientNodeIds.size;
        let currentTransientId = 0;
        let currentAbsorbingId = transientNodeIds.size;
        let nodeTranslation = {};
        for (const id in this.graph.objs) {
            let node = this.graph.getNodeById(id);
            if (transientNodeIds.has(node.id)) {
                nodeTranslation[node.id] = currentTransientId++;
            } else {
                nodeTranslation[node.id] = currentAbsorbingId++;
            }
        }
        return nodeTranslation;
    }

    translateTransitions(nodeTranslation) {
        let transitions = [];
        for (const edgeId in this.graph.edges) {
            let edge = this.graph.edges[edgeId];
            let sourceId = nodeTranslation[edge.startNodeid];
            let targetId = nodeTranslation[edge.endNodeid];
            transitions.push(new Edge(sourceId, targetId, edge.weight));
        }
        return transitions;
    }

    extractNodeNames(nodeTranslation) {
        for (const id in this.graph.objs) {
            let node = this.graph.getNodeById(id);
            this.nodeNames[nodeTranslation[node.id]] = node.text;
        }
    }

    convert() {
        let nodeTranslation = this.translateNodes();
        this.extractNodeNames(nodeTranslation);
        let transitions = this.translateTransitions(nodeTranslation);
        let numStates = Object.keys(nodeTranslation).length;
        return new ArrangedGraph(this.nodeNames, this.numTransientStates, transitions);
    }
}