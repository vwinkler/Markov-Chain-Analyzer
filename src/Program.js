class Program {

    constructor(graph) {
        this.graph = graph;
        this.controlsUI = new ControlsUI(graph);
        this.errorsUI = new ErrorsUI();
        this.analysisUI = new AnalysisUI();
    }

    update() {
        this.controlsUI.displayControls();

        let graphToArrangedGraphConverter = new GraphToArrangedGraphConverter(this.graph);
        let arrangedGraph = graphToArrangedGraphConverter.convert();
        let nodeNames = arrangedGraph.nodes;
        let transitions = this.convertEdgesToTransitions(arrangedGraph);

        let markovChain = new MarkovChain(arrangedGraph.numTransientNodes, arrangedGraph.numAbsorbingNodes, transitions);
        this.errorsUI.displayErrors(markovChain, nodeNames);
        this.analysisUI.displayAnalysis(markovChain, nodeNames);

        MathJax.typeset();
    }

    convertEdgesToTransitions(arrangedGraph) {
        let transitions = [];
        for (const edge of arrangedGraph.edges) {
            transitions.push(new Transition(edge.sourceId, edge.targetId, edge.label));
        }
        return transitions;
    }
}