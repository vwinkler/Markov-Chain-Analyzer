class ErrorsUI {
    constructor() {
    }

    displayErrors(markovChain, nodeNames) {
        let errors = markovChain.findErrors();
        let errorHtml = "";
        for (const error of errors) {
            errorHtml += "<p class='message error'>" + makeErrorPositionMessage(error, nodeNames) + ": " + error.message + "</p>";
        }
        if (errors.length == 0) {
            errorHtml = "<p class='message info'>no errors</p>";
        }
        document.getElementById("errorList").innerHTML = errorHtml;
    }

    makeErrorPositionMessage(error, nodeNames) {
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
}