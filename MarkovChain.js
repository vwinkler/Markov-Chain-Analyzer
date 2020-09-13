class Transition {
    constructor(sourceStateId, targetStateId, probability) {
        this.sourceStateId = sourceStateId;
        this.targetStateId = targetStateId;
        this.probability = probability;
    }
}

function StateError(message, state) {
    var error = Error.call(this, message);

    this.name = 'StateError';
    this.message = error.message;
    this.stack = error.stack;
    this.state = state;
}

StateError.prototype = Object.create(Error.prototype);
StateError.prototype.constructor = StateError;

function EdgeError(message, sourceState, targetState) {
    var error = Error.call(this, message);

    this.name = 'EdgeError';
    this.message = error.message;
    this.stack = error.stack;
    this.sourceState = sourceState;
    this.targetState = targetState;
}

EdgeError.prototype = Object.create(Error.prototype);
EdgeError.prototype.constructor = EdgeError;

class MarkovChain {
    constructor(numStates, transitions) {
        let triplet = new Triplet(numStates, numStates);
        for (const transition of transitions) {
            triplet.addEntry(transition.probability, transition.sourceStateId, transition.targetStateId);
        }
        this.transitionMatrix = SparseMatrix.fromTriplet(triplet);
    }

    findErrors() {
        return this.findStateErrors().concat(this.findEdgeErrors());
    }

    findStateErrors() {
        let errors = []

        const message = "outward transitions do not add up to one";
        let rowSums = this.transitionMatrix.timesDense(DenseMatrix.ones(this.transitionMatrix.nRows()));
        for (let i = 0; i < this.transitionMatrix.nRows(); i++) {
            if (rowSums.get(i) != 1) {
                errors.push(new StateError(message, i));
            }
        }
        return errors;
    }

    findEdgeErrors() {
        let errors = []

        const message = "transition is not in the range between zero and one";
        let transitionMatrix = this.formTransitionMatrix();
        for (let i = 0; i < transitionMatrix.nRows(); i++) {
            for (let j = 0; j < transitionMatrix.nCols(); j++) {
                let probability = transitionMatrix.get(i, j);
                if (0 > probability || probability > 1) {
                    errors.push(new EdgeError(message, i, j));
                }
            }
        }
        return errors;
    }

    formTransitionMatrix() {
        return this.transitionMatrix.toDense();
    }
}