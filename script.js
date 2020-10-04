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

    updateAnalysis();
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

function turnNumberToLatex(x) {
    if (x === Infinity) {
        return "\\infty";
    } else if (x === -Infinity) {
        return "-\\infty";
    } else {
        return "" + x;
    }
}

function turnMatrixToLatex(transitionMatrix) {
    let matrixTex = "";
    matrixTex += "\\begin{pmatrix} ";
    for (let s = 0; s < transitionMatrix.nRows(); s++) {
        for (let t = 0; t < transitionMatrix.nCols(); t++) {
            if (t > 0) {
                matrixTex += " & ";
            }
            matrixTex += turnNumberToLatex(roundToDigit(transitionMatrix.get(s, t), 2));
        }
        matrixTex += " \\\\ ";
    }
    matrixTex += " \\end{pmatrix}";
    return matrixTex;
}

function turnLabelsToHorizontalTexArray(columnLabels) {
    let columnLabelsTex = "";
    columnLabelsTex += "\\begin{array}{" + "c".repeat(columnLabels.length) + "}";
    for (let i = 0; i < columnLabels.length - 1; i++) {
        columnLabelsTex += columnLabels[i] + " & ";
    }
    columnLabelsTex += columnLabels[columnLabels.length - 1] + "\\end{array}";
    return columnLabelsTex;
}

function turnLabelsToVerticalArray(rowLabels) {
    let rowLabelsTex = "";
    rowLabelsTex += "\\begin{array}{c} ";
    for (let i = 0; i < rowLabels.length- 1; i++) {
        rowLabelsTex += rowLabels[i] + "\\\\ ";
    }
    rowLabelsTex += rowLabels[rowLabels.length - 1] + "\\end{array}";
    return rowLabelsTex;
}

function turnMatrixToLatexArray(transitionMatrix) {
    let matrixArrayTex = "";
    matrixArrayTex += "\\left(\\begin{array}{}"
    for (let s = 0; s < transitionMatrix.nCols(); s++) {
        for (let t = 0; t < transitionMatrix.nCols(); t++) {
            if (t > 0) {
                matrixArrayTex += " & ";
            }
            matrixArrayTex += turnNumberToLatex(roundToDigit(transitionMatrix.get(s, t), 2));
        }
        matrixArrayTex += " \\\\ ";
    }
    matrixArrayTex += " \\end{array}\\right)";
    return matrixArrayTex;
}

function turnLabeledMatrixToLatex(transitionMatrix, rowLabels, columnLabels) {
    assert(transitionMatrix.nRows() == rowLabels.length);
    assert(transitionMatrix.nCols() == columnLabels.length);
    let matrixTex = "";
    matrixTex += "\\begin{equation*}\\begin{array}{cc}";
    matrixTex += turnLabelsToHorizontalTexArray(columnLabels) + " & \\\\";
    matrixTex += turnMatrixToLatexArray(transitionMatrix) + " & ";
    matrixTex += turnLabelsToVerticalArray(rowLabels);
    matrixTex += "\\end{array}\\end{equation*}";
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
        errorHtml += "<p class='message error'>" + makeErrorPositionMessage(error) + ": " + error.message + "</p>";
    }
    if(errors.length == 0) {
        errorHtml = "<p class='message info'>no errors</p>";
    }
    document.getElementById("errorList").innerHTML = errorHtml;
}

function displayTransitionMatrix(markovChain) {
    let html;
    try {
        let matrix = markovChain.formTransitionMatrix();
        let labels = nodeNames.copyWithin(0, matrix.nCols());
        html = turnLabeledMatrixToLatex(matrix, labels, labels);
    } catch (e) {
        console.log(e);
        html = "<p class='message error'>unknown ERROR</p>";
    }
    document.getElementById("transitionMatrix").innerHTML = html;
}

function displayFundamentalMatrix(markovChain) {
    let html;
    try {
        html = "$$" + turnMatrixToLatex(markovChain.formInverseFundamentalMatrix()) + "^{-1}$$";
    } catch (e) {
        console.log(e);
        html = "<p class='message error'>unknown ERROR</p>";
    }
    document.getElementById("fundamentalMatrix").innerHTML = html;
}

function displayExpectedStepsVector(markovChain) {
    let html;
    if (markovChain.isAbsorbing) {
        try {
            html = turnMatrixToLatex(markovChain.formExpectedNumberOfStepsByStartStateMatrix());
        } catch (e) {
            console.log(e);
            html = "<p class='message error'>unknown ERROR</p>";
        }
    } else {
        html = "<p class='message error'>Markov chain is not absorbing. Some states never reach an absorbing state</p>";
    }
    document.getElementById("expectedStepsVector").innerHTML = html;
}

function displayProbableAbsorbersMatrix(markovChain) {
    let html;
    if (markovChain.isAbsorbing) {
        try {
            html = turnMatrixToLatex(markovChain.formAbsorbingStateProbabilityMatrix());
        } catch (e) {
            console.log(e);
            html = "<p class='message error'>unknown ERROR</p>";
        }
    } else {
        html = "<p class='message error'>Markov chain is not absorbing. Some states never reach an absorbing state</p>";
    }
    document.getElementById("probableAbsorberMatrix").innerHTML = html;
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