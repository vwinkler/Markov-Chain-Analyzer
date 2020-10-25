class AnalysisUI {
    displayAnalysis(markovChain, nodeNames) {
        this.markovChain = markovChain;
        this.nodeNames = nodeNames;
        this.displayTransitionMatrix();
        this.displayTransientStateTransitionMatrixEquation();
        this.displayTransientStateToAbsorbingStateTransitionMatrixEquation();
        this.displayFundamentalMatrix();
        this.displayExpectedStepsVector();
        this.displayProbableAbsorbersMatrix();
        this.markovChain = null;
        this.nodeNames = null;
    }

    displayTransitionMatrix() {
        let html;
        try {
            html = this.generateTransitionMatrixEquation();
        } catch (e) {
            console.log(e);
            html = "<p class='message error'>unknown ERROR</p>";
        }
        document.getElementById("transitionMatrix").innerHTML = html;
    }

    generateTransitionMatrixEquation() {
        let transitionMatrix;
        let matrix = this.markovChain.formTransitionMatrix();
        let labels = this.nodeNames.copyWithin(0, matrix.nCols());
        transitionMatrix = "\\begin{equation*}";
        transitionMatrix += turnLabeledMatrixToLatex(matrix, labels, labels, "P\\ \\colon = ");
        transitionMatrix += "\\end{equation*}";
        return transitionMatrix;
    }

    displayTransientStateTransitionMatrixEquation() {
        let html;
        try {
            html = this.generateTransientStateTransitionMatrixEquation();
        } catch (e) {
            console.log(e);
            html = "<p class='message error'>unknown ERROR</p>";
        }
        document.getElementById("transientStateTransitionMatrixEquation").innerHTML = html;
    }

    generateTransientStateTransitionMatrixEquation() {
        let transitionMatrix;
        let matrix = this.markovChain.formTransientStateTransitionMatrix();
        let transientStateLabels = this.nodeNames.slice(0, this.markovChain.numTransientStates);
        let absorbingStateLabels = this.nodeNames.slice(this.markovChain.numTransientStates, this.markovChain.numStates);
        transitionMatrix = "\\begin{equation*}";
        transitionMatrix += turnLabeledMatrixToLatex(matrix, transientStateLabels, transientStateLabels, "Q\\ \\colon = ");
        transitionMatrix += "\\end{equation*}";
        return transitionMatrix;
    }

    displayTransientStateToAbsorbingStateTransitionMatrixEquation() {
        let html;
        try {
            html = this.generateTransientStateToAbsorbingStateTransitionMatrixEquation();
        } catch (e) {
            console.log(e);
            html = "<p class='message error'>unknown ERROR</p>";
        }
        document.getElementById("transientStateToAbsorbingStateTransitionMatrixEquation").innerHTML = html;
    }

    generateTransientStateToAbsorbingStateTransitionMatrixEquation() {
        let transitionMatrix;
        let matrix = this.markovChain.formTransientStateToAbsorbingStateTransitionMatrix();
        let transientStateLabels = this.nodeNames.slice(0, this.markovChain.numTransientStates);
        let absorbingStateLabels = this.nodeNames.slice(this.markovChain.numTransientStates, this.markovChain.numStates);
        transitionMatrix = "\\begin{equation*}";
        transitionMatrix += turnLabeledMatrixToLatex(matrix, transientStateLabels, absorbingStateLabels, "R\\ \\colon = ");
        transitionMatrix += "\\end{equation*}";
        return transitionMatrix;
    }

    displayFundamentalMatrix() {
        let html;
        try {
            html = "$$N\\ \\colon = (I - Q)^{-1} = " + turnMatrixToLatex(this.markovChain.formInverseFundamentalMatrix()) + "^{-1}$$";
        } catch (e) {
            console.log(e);
            html = "<p class='message error'>unknown ERROR</p>";
        }
        document.getElementById("fundamentalMatrix").innerHTML = html;
    }

    displayExpectedStepsVector() {
        let html;
        if (this.markovChain.isAbsorbing) {
            try {
                let matrix = this.markovChain.formExpectedNumberOfStepsByStartStateMatrix();
                let labels = this.nodeNames.slice(0, this.markovChain.numTransientStates);
                let oneVector = "\\begin{pmatrix}" + "1\\\\ ".repeat(this.markovChain.numTransientStates) + "\\end{pmatrix}";
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

    displayProbableAbsorbersMatrix() {
        let html;
        if (this.markovChain.isAbsorbing) {
            try {
                let matrix = this.markovChain.formAbsorbingStateProbabilityMatrix();
                let transientStateLabels = this.nodeNames.slice(0, this.markovChain.numTransientStates);
                let absorbingStateLabels = this.nodeNames.slice(this.markovChain.numTransientStates, this.markovChain.numStates);
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
}