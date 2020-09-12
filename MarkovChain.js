class Transition {
    constructor(sourceStateId, targetStateId, probability) {
        this.sourceStateId = sourceStateId;
        this.targetStateId = targetStateId;
        this.probability = probability;
    }
}

class MarkovChain {
    constructor(numStates, transitions) {
        let triplet = new Triplet(numStates, numStates);
        for (const transition of transitions) {
            triplet.addEntry(transition.probability, transition.sourceStateId, transition.targetStateId);
        }
        this.transitionMatrix = SparseMatrix.fromTriplet(triplet);
    }

    formTransitionMatrix() {
        return this.transitionMatrix.toDense();
    }
}