class Program {

    constructor(graph) {
        this.graph = graph;
        this.controlsUI = new ControlsUI(graph);
        this.errorsUI = new ErrorsUI();
        this.analysisUI = new AnalysisUI();
    }

    update() {
        this.processCurrentGraph();
        this.display();
    }

    processCurrentGraph() {
        let graphToArrangedGraphConverter = new GraphToArrangedGraphConverter(this.graph);
        let arrangedGraph = graphToArrangedGraphConverter.convert();
        this.nodeNames = arrangedGraph.nodes;
        let transitions = this.convertEdgesToTransitions(arrangedGraph);
        this.markovChain = new MarkovChain(arrangedGraph.numTransientNodes, arrangedGraph.numAbsorbingNodes, transitions);
    }

    convertEdgesToTransitions(arrangedGraph) {
        let transitions = [];
        for (const edge of arrangedGraph.edges) {
            transitions.push(new Transition(edge.sourceId, edge.targetId, edge.label));
        }
        return transitions;
    }

    display() {
        this.controlsUI.displayControls();
        this.errorsUI.displayErrors(this.markovChain, this.nodeNames);
        this.analysisUI.displayAnalysis(this.markovChain, this.nodeNames);
        this.handleTexInHtml();
    }

    handleTexInHtml() {
        MathJax.typeset();
    }
}