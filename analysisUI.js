function displayAnalysis(markovChain, nodeNames) {
    displayTransitionMatrix(markovChain, nodeNames);
    displayTransientStateTransitionMatrixEquation(markovChain, nodeNames);
    displayTransientStateToAbsorbingStateTransitionMatrixEquation(markovChain, nodeNames);
    displayFundamentalMatrix(markovChain);
    displayExpectedStepsVector(markovChain, nodeNames);
    displayProbableAbsorbersMatrix(markovChain, nodeNames);
}

function displayTransitionMatrix(markovChain, nodeNames) {
    let html;
    try {
        html = generateTransitionMatrixEquation(markovChain, nodeNames);
    } catch (e) {
        console.log(e);
        html = "<p class='message error'>unknown ERROR</p>";
    }
    document.getElementById("transitionMatrix").innerHTML = html;
}

function generateTransitionMatrixEquation(markovChain, nodeNames) {
    let transitionMatrix;
    let matrix = markovChain.formTransitionMatrix();
    let labels = nodeNames.copyWithin(0, matrix.nCols());
    transitionMatrix = "\\begin{equation*}";
    transitionMatrix += turnLabeledMatrixToLatex(matrix, labels, labels, "P\\ \\colon = ");
    transitionMatrix += "\\end{equation*}";
    return transitionMatrix;
}

function displayTransientStateTransitionMatrixEquation(markovChain, nodeNames) {
    let html;
    try {
        html = generateTransientStateTransitionMatrixEquation(markovChain, nodeNames);
    } catch (e) {
        console.log(e);
        html = "<p class='message error'>unknown ERROR</p>";
    }
    document.getElementById("transientStateTransitionMatrixEquation").innerHTML = html;
}

function generateTransientStateTransitionMatrixEquation(markovChain, nodeNames) {
    let transitionMatrix;
    let matrix = markovChain.formTransientStateTransitionMatrix();
    let transientStateLabels = nodeNames.slice(0, markovChain.numTransientStates);
    let absorbingStateLabels = nodeNames.slice(markovChain.numTransientStates, markovChain.numStates);
    transitionMatrix = "\\begin{equation*}";
    transitionMatrix += turnLabeledMatrixToLatex(matrix, transientStateLabels, transientStateLabels, "Q\\ \\colon = ");
    transitionMatrix += "\\end{equation*}";
    return transitionMatrix;
}

function displayTransientStateToAbsorbingStateTransitionMatrixEquation(markovChain, nodeNames) {
    let html;
    try {
        html = generateTransientStateToAbsorbingStateTransitionMatrixEquation(markovChain, nodeNames);
    } catch (e) {
        console.log(e);
        html = "<p class='message error'>unknown ERROR</p>";
    }
    document.getElementById("transientStateToAbsorbingStateTransitionMatrixEquation").innerHTML = html;
}

function generateTransientStateToAbsorbingStateTransitionMatrixEquation(markovChain, nodeNames) {
    let transitionMatrix;
    let matrix = markovChain.formTransientStateToAbsorbingStateTransitionMatrix();
    let transientStateLabels = nodeNames.slice(0, markovChain.numTransientStates);
    let absorbingStateLabels = nodeNames.slice(markovChain.numTransientStates, markovChain.numStates);
    transitionMatrix = "\\begin{equation*}";
    transitionMatrix += turnLabeledMatrixToLatex(matrix, transientStateLabels, absorbingStateLabels, "R\\ \\colon = ");
    transitionMatrix += "\\end{equation*}";
    return transitionMatrix;
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

function displayExpectedStepsVector(markovChain, nodeNames) {
    let html;
    if (markovChain.isAbsorbing) {
        try {
            let matrix = markovChain.formExpectedNumberOfStepsByStartStateMatrix();
            let labels = nodeNames.slice(0, markovChain.numTransientStates);
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

function displayProbableAbsorbersMatrix(markovChain, nodeNames) {
    let html;
    if (markovChain.isAbsorbing) {
        try {
            let matrix = markovChain.formAbsorbingStateProbabilityMatrix();
            let transientStateLabels = nodeNames.slice(0, markovChain.numTransientStates);
            let absorbingStateLabels = nodeNames.slice(markovChain.numTransientStates, markovChain.numStates);
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