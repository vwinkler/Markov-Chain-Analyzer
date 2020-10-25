let memoryManager = new EmscriptenMemoryManager();
let program;

function load() {
    fitCanvas();
    let urlToGraphConverter = new UrlToGraphConverter(new URL(document.location), "canvasid");
    program = new Program(urlToGraphConverter.makeGraph());
    program.update();
}

function fitCanvas() {
    let canvas = document.getElementById('canvasid');
    let rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

