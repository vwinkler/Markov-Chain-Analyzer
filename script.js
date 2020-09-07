function load() {
    fitCanvas();

    let graph = new Graph("canvasid");
    graph.setDirectional();


    let nodeA = graph.node(100, 100, 20, "A");
    let nodeB = graph.node(200, 100, 20, "B");
    let nodeC = graph.node(200, 200, 20, "C");
    nodeA.directional(nodeB);
    nodeA.directional(nodeA);
    nodeB.directional(nodeC);

    let edges = Object.values(graph.edges);
    console.log(typeof edges);
    for(edge of edges) {
        console.log(edge);
    }
}

function fitCanvas() {
    let canvas = document.getElementById('canvasid');
    let rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}