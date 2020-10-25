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

function solveLinearEquationSystem(A, b) {
    return A.lu().solveSquare(b);
}

function solveLinearEquationSystems(A, B) {
    let lu = A.lu();
    let X = DenseMatrix.zeros(A.nCols(), 0);
    for (let i = 0; i < B.nCols(); i++) {
        let b = B.subMatrix(0, B.nRows(), i, i + 1).toDense();
        let x = lu.solveSquare(b);
        X = X.hcat(x);
    }
    return X;
}

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
        this.numAbsorbingStates = numAbsorbingStates;
        this.isAbsorbing = this.calcIsAbsorbing();
    }

    get numTransientStates() {
        return this.numStates - this.numAbsorbingStates;
    }

    get numStates() {
        return this.transitionMatrix.nCols();
    }

    get transientStateTransitionMatrix() {
        return this.transitionMatrix.subMatrix(0, this.numTransientStates, 0, this.numTransientStates);
    }

    get transientStateToAbsorbingStateTransitionMatrix() {
        return this.transitionMatrix.subMatrix(0, this.numTransientStates, this.numTransientStates, this.numStates);
    }

    get inverseFundamentelMatrix() {
        return SparseMatrix.identity(this.numTransientStates, this.numTransientStates).minus(this.transientStateTransitionMatrix);
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

    calcIsAbsorbing() {
        let markovChain = this;
        let transitionMatrix = this.formTransitionMatrix();
        let visitedStates = new Set();

        let visit = function(state) {
            if(!visitedStates.has(state)) {
                visitedStates.add(state);
                for (let j = 0; j < markovChain.numTransientStates; j++) {
                    if (transitionMatrix.get(j, state) > 0) {
                        visit(j);
                    }
                }
            }
        }

        for (let absorbingState = this.numTransientStates; absorbingState < this.numStates; absorbingState++) {
            visit(absorbingState);
        }

        return visitedStates.size == this.numStates;
    }

    formTransitionMatrix() {
        return this.transitionMatrix.toDense();
    }

    formTransientStateTransitionMatrix() {
        return this.transientStateTransitionMatrix.toDense()
    }

    formTransientStateToAbsorbingStateTransitionMatrix() {
        return this.transientStateToAbsorbingStateTransitionMatrix.toDense();
    }

    formInverseFundamentalMatrix() {
        return this.inverseFundamentelMatrix.toDense();
    }

    formExpectedNumberOfStepsByStartStateMatrix() {
        if (this.numAbsorbingStates == 0) {
            return DenseMatrix.ones(this.numTransientStates).timesReal(Infinity);
        } else {
            let A = this.inverseFundamentelMatrix;
            let b = DenseMatrix.ones(this.numTransientStates);
            return solveLinearEquationSystem(A, b);
        }
    }

    formAbsorbingStateProbabilityMatrix() {
        let A = this.inverseFundamentelMatrix;
        let B = this.transientStateToAbsorbingStateTransitionMatrix;
        return solveLinearEquationSystems(A, B);
    }
}