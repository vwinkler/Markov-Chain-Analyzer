function load() {
    fitCanvas();

    let graph = new Graph("canvasid");
    let nodeA = graph.node(100, 100, 20, "A");
    let nodeB = graph.node(200, 100, 20, "B");
    nodeA.connect(nodeB);
}

function fitCanvas() {
    let canvas = document.getElementById('canvasid');
    let rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}