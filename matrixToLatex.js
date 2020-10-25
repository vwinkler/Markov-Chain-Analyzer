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

function turnLabelsToVerticalArray(rowLabels) {
    let rowLabelsTex = "";
    rowLabelsTex += "\\begin{array}{c} ";
    for (let i = 0; i < rowLabels.length- 1; i++) {
        rowLabelsTex += rowLabels[i] + "\\\\ ";
    }
    rowLabelsTex += rowLabels[rowLabels.length - 1] + "\\end{array}";
    return rowLabelsTex;
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