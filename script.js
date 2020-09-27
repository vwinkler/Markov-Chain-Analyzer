var graph;
var nodeNames = [];
var numTransientStates = 0;

function load() {
    fitCanvas();

    graph = new Graph("canvasid");
    graph.setDirectional();


    let nodeA = graph.node(100, 100, 20, "A");
    let nodeC = graph.node(200, 200, 20, "C");
    let nodeB = graph.node(200, 100, 20, "B");
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

function findTransientNodeIds() {
    let transientNodeIds = new Set();
    for (const edgeId in graph.edges) {
        let edge = graph.edges[edgeId];

        if (edge.startNodeid != edge.endNodeid && edge.weight != 0) {
            transientNodeIds.add(edge.startNodeid);
        }
    }
    return transientNodeIds;
}

function translateNodes() {
    let transientNodeIds = findTransientNodeIds();
    numTransientStates = transientNodeIds.size;
    let currentTransientId = 0;
    let currentAbsorbingId = transientNodeIds.size;
    let nodeTranslation = {};
    for (const id in graph.objs) {
        let node = graph.getNodeById(id);
        if(transientNodeIds.has(node.id)) {
            nodeTranslation[node.id] = currentTransientId++;
        } else {
            nodeTranslation[node.id] = currentAbsorbingId++;
        }
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
    let numStates = Object.keys(nodeTranslation).length;
    return new MarkovChain(numTransientStates, numStates - numTransientStates, transitions);
}

function roundToDigit(val, digit) {
    let digitFactor = Math.pow(10, digit);
    return Math.round((val + Number.EPSILON) * digitFactor) / digitFactor;
}

function turnMatrixToLatex(transitionMatrix) {
    let matrixTex = "";
    matrixTex += "\\begin{pmatrix} ";
    for (let s = 0; s < transitionMatrix.nRows(); s++) {
        for (let t = 0; t < transitionMatrix.nCols(); t++) {
            if (t > 0) {
                matrixTex += " & ";
            }
            matrixTex += roundToDigit(transitionMatrix.get(s, t), 2);
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

function displayTransitionMatrix(markovChain) {
    document.getElementById("transitionMatrix").innerHTML = turnMatrixToLatex(markovChain.formTransitionMatrix());
}

function displayFundamentalMatrix(markovChain) {
    document.getElementById("fundamentalMatrix").innerHTML = "$$" + turnMatrixToLatex(markovChain.formInverseFundamentalMatrix()) + "^{-1}$$";
}

function displayExpectedStepsVector(markovChain) {
    document.getElementById("expectedStepsVector").innerHTML = turnMatrixToLatex(markovChain.formExpectedNumberOfStepsByStartStateMatrix());
}

function displayProbableAbsorbersMatrix(markovChain) {
    document.getElementById("probableAbsorberMatrix").innerHTML = turnMatrixToLatex(markovChain.formAbsorbingStateProbabilityMatrix());
}

function updateAnalysis() {
    let markovChain = translateMarkovChain();
    displayErrors(markovChain);

    displayTransitionMatrix(markovChain);
    displayFundamentalMatrix(markovChain);
    displayExpectedStepsVector(markovChain);
    displayProbableAbsorbersMatrix(markovChain);

    MathJax.typeset();
}