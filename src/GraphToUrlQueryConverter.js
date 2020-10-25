class GraphToUrlQueryConverter {
    constructor(graph) {
        this.graph = graph;
        this.searchParams = new URLSearchParams();
        this.nodeTranslation = null;
    }

    makeQuery() {
        this.searchParams = new URLSearchParams();
        this.translateNodes();
        this.searchParams.append("v", this.stringifyNodes());
        this.searchParams.append("e", this.stringifyEdges());
        return this.searchParams;
    }

    translateNodes() {
        this.nodeTranslation = {};
        let currentId = 0;
        for (const id in this.graph.objs) {
            this.nodeTranslation[id] = currentId++;
        }
    }

    stringifyNodes() {
        let nodeStrings = [];
        for (const id in this.graph.objs) {
            let graphNode = this.graph.getNodeById(id);
            let name = graphNode.text;
            let x = graphNode.x;
            let y = graphNode.y;
            let radius = graphNode.r;
            let nodeString = "" + name + GraphUrlQuerySpecifics.parameterSeparator
                + x + GraphUrlQuerySpecifics.parameterSeparator
                + y + GraphUrlQuerySpecifics.parameterSeparator
                + radius;
            nodeStrings.push(nodeString);
        }
        return nodeStrings.join(GraphUrlQuerySpecifics.elementSeparator);
    }

    stringifyEdges() {
        let edgeStrings = []
        for (const edgeId in this.graph.edges) {
            let edge = this.graph.edges[edgeId];
            let sourceId = this.nodeTranslation[edge.startNodeid];
            let targetId = this.nodeTranslation[edge.endNodeid];
            let edgeString = "" + sourceId + GraphUrlQuerySpecifics.parameterSeparator
                + targetId + GraphUrlQuerySpecifics.parameterSeparator
                + edge.weight;
            edgeStrings.push(edgeString);
        }
        return edgeStrings.join(GraphUrlQuerySpecifics.elementSeparator);
    }
}