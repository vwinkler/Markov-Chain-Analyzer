var graph;
var nodeNames = [];

function load() {
    fitCanvas();

    graph = new Graph("canvasid");
    graph.setDirectional();


    let nodeA = graph.node(100, 100, 20, "A");
    let nodeB = graph.node(200, 100, 20, "B");
    let nodeC = graph.node(200, 200, 20, "C");
    nodeA.directional(nodeB, 0.2);
    nodeA.directional(nodeA, 0.8);
    nodeB.directional(nodeC, 1.0);
    nodeC.directional(nodeC, 1.0);

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
        let node = graph.getNodeById(id);
        nodeNames[nodeTranslation[node.id]] = node.text;
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

function makeErrorPositionMessage(error) {
    let errorPositionMessage = "";
    if (error instanceof StateError) {
        errorPositionMessage = "Error in state '" + nodeNames[error.state] + "'";
    } else if (error instanceof EdgeError) {
        errorPositionMessage = "Error in transition '" + nodeNames[error.sourceState]
            + "' -> '" + nodeNames[error.targetState] + "'";
    } else {
        errorPositionMessage = "Error";
    }
    return errorPositionMessage;
}

function displayErrors(markovChain) {
    let errors = markovChain.findErrors();
    let errorHtml = "";
    for (const error of errors) {
        errorHtml += "<p>" + makeErrorPositionMessage(error) + ": " + error.message + "</p>";
    }
    if(errors.length == 0) {
        errorHtml = "no errors";
    }
    document.getElementById("errorList").innerHTML = errorHtml;
}

function updateAnalysis() {
    let markovChain = translateMarkovChain();
    displayErrors(markovChain);

    let transitionMatrix = markovChain.formTransitionMatrix();
    let tex = turnMatrixToLatex(transitionMatrix);
    document.getElementById("transitionMatrix").innerHTML = tex;

    MathJax.typeset();
}