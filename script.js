var graph;
var nodeNames = [];

function load() {
    fitCanvas();

    graph = new Graph("canvasid");
    graph.setDirectional();


    let nodeA = graph.node(100, 100, 20, "A");
    let nodeB = graph.node(200, 100, 20, "B");
    let nodeC = graph.node(200, 200, 20, "C");
    nodeA.directional(nodeB, 10);
    nodeA.directional(nodeA, 20);
    nodeB.directional(nodeC, 30);

    graph.setTickCallback(function (g) {
        updateAnalysis();
    });
}

function fitCanvas() {
    let canvas = document.getElementById('canvasid');
    let rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

let memoryManager = new EmscriptenMemoryManager();

function translateNodes() {
    let currentId = 0;
    let nodeTranslation = {};
    for (const id in graph.objs) {
        let node = graph.objs[id];
        nodeTranslation[id] = currentId++;
    }
    return nodeTranslation;
}

function translateTransitions(nodeTranslation) {
    let transitions = [];
    for (const edgeId in graph.edges) {
        let edge = graph.edges[edgeId];
        let sourceId = nodeTranslation[edge.startNodeid];
        let targetId = nodeTranslation[edge.endNodeid];
        transitions.push(new Transition(sourceId, targetId, edge.weight));
    }
    return transitions;
}

function extractNodeNames(nodeTranslation) {
    for (const id in graph.objs) {
        let node = graph.objs[id];
        nodeNames[nodeTranslation[node.id]] = node.name;
    }
}

function translateMarkovChain() {
    let nodeTranslation = translateNodes();
    extractNodeNames(nodeTranslation);
    let transitions = translateTransitions(nodeTranslation);
    return new MarkovChain(Object.keys(nodeTranslation).length, transitions);
}

function turnMatrixToLatex(transitionMatrix) {
    let matrixTex = "";
    matrixTex += "\\begin{pmatrix} ";
    for (let s = 0; s < transitionMatrix.nRows(); s++) {
        for (let t = 0; t < transitionMatrix.nCols(); t++) {
            if (t > 0) {
                matrixTex += " & ";
            }
            matrixTex += transitionMatrix.get(s, t);
        }
        matrixTex += " \\\\ ";
    }
    matrixTex += " \\end{pmatrix}";
    return matrixTex;
}

function updateAnalysis() {
    let markovChain = translateMarkovChain();
    let transitionMatrix = markovChain.formTransitionMatrix();
    let tex = turnMatrixToLatex(transitionMatrix);
    document.getElementById("transitionMatrix").innerHTML = tex;

    MathJax.typeset();
}