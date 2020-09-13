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
    constructor(numTransientStates, numAbsorbingStates, transitions) {
        let numStates = numTransientStates + numAbsorbingStates;
        let triplet = new Triplet(numStates, numStates);
        let foundTransientStates = new Set();
        for (const transition of transitions) {
            let message = "";
            if (transition.sourceStateId < 0 || numStates <= transition.sourceStateId) {
                message = "invalid source state";
            } else if (transition.targetStateId < 0 || numStates <= transition.targetStateId) {
                message = "unknown target state";
            } else if (numTransientStates <= transition.sourceStateId) {
                if (transition.targetStateId != transition.sourceStateId) {
                    message = "invalid transition out of absorbing state";
                }
            }
            if (message != "") {
                throw new EdgeError(message, transition.sourceStateId, transition.targetStateId);
            }

            if (transition.targetStateId != transition.sourceStateId) {
                foundTransientStates.add(transition.sourceStateId);
            }

            if (transition.sourceStateId < numTransientStates) {
                triplet.addEntry(transition.probability, transition.sourceStateId, transition.targetStateId);
            }
        }

        for (let i = 0; i < numTransientStates; i++) {
            if (!foundTransientStates.has(i)) {
                throw new StateError("invalid transient state without out transition", i);
            }
        }

        for (let i = 0; i < numAbsorbingStates; i++) {
            triplet.addEntry(1.0, i + numTransientStates, i + numTransientStates);
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