var graph;
var nodeNames = [];
var numTransientStates = 0;

function load() {
    fitCanvas();
    let urlToGraphConverter = new UrlToGraphConverter(new URL(document.location), "canvasid");
    graph = urlToGraphConverter.makeGraph();
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

function turnLabeledMatrixToLatex(transitionMatrix, rowLabels, columnLabels, precedingTex = "") {
    assert(transitionMatrix.nRows() == rowLabels.length);
    assert(transitionMatrix.nCols() == columnLabels.length);
    let matrixTex = "";
    matrixTex += "\\begin{array}{ccc}";
    matrixTex += "& " + turnLabelsToHorizontalTexArray(columnLabels) + " & \\\\";
    matrixTex += precedingTex +  "&" + turnMatrixToLatex(transitionMatrix) + " & ";
    matrixTex += turnLabelsToVerticalArray(rowLabels);
    matrixTex += "\\end{array}";
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

function generateTransitionMatrixEquation(markovChain) {
    let transitionMatrix;
    let matrix = markovChain.formTransitionMatrix();
    let labels = nodeNames.copyWithin(0, matrix.nCols());
    transitionMatrix = "\\begin{equation*}";
    transitionMatrix += turnLabeledMatrixToLatex(matrix, labels, labels, "P\\ \\colon = ");
    transitionMatrix += "\\end{equation*}";
    return transitionMatrix;
}

function generateTransientStateTransitionMatrixEquation(markovChain) {
    let transitionMatrix;
    let matrix = markovChain.formTransientStateTransitionMatrix();
    let transientStateLabels = nodeNames.slice( 0, markovChain.numTransientStates);
    let absorbingStateLabels = nodeNames.slice( markovChain.numTransientStates, markovChain.numStates);
    transitionMatrix = "\\begin{equation*}";
    transitionMatrix += turnLabeledMatrixToLatex(matrix, transientStateLabels, transientStateLabels, "Q\\ \\colon = ");
    transitionMatrix += "\\end{equation*}";
    return transitionMatrix;
}

function generateTransientStateToAbsorbingStateTransitionMatrixEquation(markovChain) {
    let transitionMatrix;
    let matrix = markovChain.formTransientStateToAbsorbingStateTransitionMatrix();
    let transientStateLabels = nodeNames.slice( 0, markovChain.numTransientStates);
    let absorbingStateLabels = nodeNames.slice( markovChain.numTransientStates, markovChain.numStates);
    transitionMatrix = "\\begin{equation*}";
    transitionMatrix += turnLabeledMatrixToLatex(matrix, transientStateLabels, absorbingStateLabels, "R\\ \\colon = ");
    transitionMatrix += "\\end{equation*}";
    return transitionMatrix;
}

function displayTransitionMatrix(markovChain) {
    let html;
    try {
        html = generateTransitionMatrixEquation(markovChain);
    } catch (e) {
        console.log(e);
        html = "<p class='message error'>unknown ERROR</p>";
    }
    document.getElementById("transitionMatrix").innerHTML = html;
}

function displayTransientStateTransitionMatrixEquation(markovChain) {
    let html;
    try {
        html = generateTransientStateTransitionMatrixEquation(markovChain);
    } catch (e) {
        console.log(e);
        html = "<p class='message error'>unknown ERROR</p>";
    }
    document.getElementById("transientStateTransitionMatrixEquation").innerHTML = html;
}

function displayTransientStateToAbsorbingStateTransitionMatrixEquation(markovChain) {
    let html;
    try {
        html = generateTransientStateToAbsorbingStateTransitionMatrixEquation(markovChain);
    } catch (e) {
        console.log(e);
        html = "<p class='message error'>unknown ERROR</p>";
    }
    document.getElementById("transientStateToAbsorbingStateTransitionMatrixEquation").innerHTML = html;
}

function displayFundamentalMatrix(markovChain) {
    let html;
    try {
        html = "$$N\\ \\colon = (I - Q)^{-1} = " + turnMatrixToLatex(markovChain.formInverseFundamentalMatrix()) + "^{-1}$$";
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
            let matrix = markovChain.formExpectedNumberOfStepsByStartStateMatrix();
            let labels = nodeNames.slice( 0, markovChain.numTransientStates);
            let oneVector = "\\begin{pmatrix}" + "1\\\\ ".repeat(markovChain.numTransientStates) + "\\end{pmatrix}";
            let precedingTex = "t\\ \\colon = N" + oneVector + "= ";
            html = "\\begin{equation*}";
            html += turnLabeledMatrixToLatex(matrix, labels, [""], precedingTex);
            html += "\\end{equation*}";
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
            let matrix = markovChain.formAbsorbingStateProbabilityMatrix();
            let transientStateLabels = nodeNames.slice( 0, markovChain.numTransientStates);
            let absorbingStateLabels = nodeNames.slice( markovChain.numTransientStates, markovChain.numStates);
            html = "\\begin{equation*}";
            html += turnLabeledMatrixToLatex(matrix, transientStateLabels, absorbingStateLabels, "B\\ \\colon = NR = ");
            html += "\\end{equation*}";
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
    displayTransientStateTransitionMatrixEquation(markovChain);
    displayTransientStateToAbsorbingStateTransitionMatrixEquation(markovChain);
    displayFundamentalMatrix(markovChain);
    displayExpectedStepsVector(markovChain);
    displayProbableAbsorbersMatrix(markovChain);

    MathJax.typeset();
}