class UrlToGraphConverter {
    constructor(url, canvasid) {
        this.url = url;
        this.graph = new Graph(canvasid);
        this.graph.setDirectional();
        this.nodes = [];
    }

    makeGraph() {
        let params = this.url.searchParams;
        if (params.has("v") && params.has("e")) {
            this.generateGraphFromParameters(params);
        } else {
            this.generateDefaultGraph();
        }
        return this.graph;
    }

    generateDefaultGraph() {
        let nodeA = this.graph.node(100, 100, 20, "A");
        let nodeC = this.graph.node(200, 200, 20, "C");
        let nodeB = this.graph.node(200, 100, 20, "B");
        nodeA.directional(nodeB, 0.2);
        nodeA.directional(nodeA, 0.8);
        nodeB.directional(nodeC, 1.0);
        nodeC.directional(nodeC, 1.0);
    }

    generateGraphFromParameters(params) {
        this.collectNodes(params);
        this.collectEdges(params);
    }

    collectNodes(params) {
        for (const nodeString of params.get("v").split(",")) {
            this.addNodeFromString(nodeString);
        }
    }

    addNodeFromString(nodeString) {
        let nodeConfig = nodeString.split(":");
        if (nodeConfig.length == 4) {
            let [name, xString, yString, radiusString] = nodeConfig;
            let x = parseFloat(xString);
            let y = parseFloat(yString);
            if (!isNaN(x) && !isNaN(y)) {
                this.nodes.push(this.graph.node(x, y, parseFloat(radiusString), name));
            }
        }
    }

    collectEdges(params) {
        for (const edgeString of params.get("e").split(",")) {
            this.addEdgeFromString(edgeString);
        }
    }

    addEdgeFromString(edgeString) {
        let edgeConfig = edgeString.split(":");
        if (edgeConfig.length == 3) {
            let [sourceString, targetString, weightString] = edgeConfig;
            let source = parseInt(sourceString);
            let target = parseInt(targetString);
            if (this.hasNode(sourceString) && this.hasNode(targetString) && !isNaN(source) && !isNaN(target)) {
                this.nodes[source].directional(this.nodes[target], parseFloat(weightString));
            }
        }
    }

    hasNode(sourceString) {
        return sourceString < this.nodes.length;
    }
}