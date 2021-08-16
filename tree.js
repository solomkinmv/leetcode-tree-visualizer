class Visualizer {
    constructor() {
        let c = document.getElementById("canvas");
        c.setAttribute("style", "width: 1500px; height: 1000px;");
        c.width = 3000;
        c.height = 2000;
        this.ctx = c.getContext("2d");
        this.ctx.font = '16px arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.clearRect(0, 0, c.width, c.height);
    }

    drawNode(node) {
        let {x, y} = node.position
        this.ctx.beginPath();
        this.ctx.arc(x, y, node.radius, 0, 2 * Math.PI)
        this.ctx.stroke()
        this.ctx.fillText(node.value, x, y)
    }

    drawNodeLink(parent, child) {
        let {x: x1, y: y1} = parent.position
        let {x: x2, y: y2} = child.position;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1 + parent.radius);
        this.ctx.lineTo(x2, y2 - child.radius)
        this.ctx.stroke();
    }
}

class Node {
    constructor(value) {
        this.value = value
        this.left = null;
        this.right = null;
        this.position = {x: 0, y: 0}
        this.radius = 20
    }
}

class Tree {
    constructor(visualizer) {
        this.root = null;
        this.startPosition = {x: 800, y: 44}
        this.axisX = 350
        this.axisY = 80
        this.visualizer = visualizer;
    }

    build(chunks) {
        this.root = new Node(chunks[0]);
        this.root.position =  this.startPosition;
        let nodes = [this.root];
        // todo: support null-nodes
        for (let i = 1, pi = 0; i < chunks.length; i += 2, pi++) {
            let parent = nodes[pi];
            console.log(parent);
            console.log(chunks[i]);
            if (chunks[i] !== "null") {
                let leftNode = new Node(chunks[i]);
                leftNode.position = this.calculatePosition(parent.position, true);
                parent.left = leftNode;
                nodes.push(leftNode);
            }
            if (i + 1 === chunks.length || chunks[i + 1] === "null") continue;
            let rightNode = new Node(chunks[i + 1]);
            rightNode.position = this.calculatePosition(parent.position, false);
            parent.right = rightNode;
            nodes.push(rightNode);
        }
    }

    calculatePosition({x, y}, left = false) {
        return {x: left ? x - this.axisX + y : x + this.axisX - y, y: y + this.axisY}
    }

    bfs() {
        let queue = []

        queue.push(this.root)

        while (queue.length !== 0) {
            let node = queue.shift()
            console.log(node);
            this.visualizer.drawNode(node)

            if (node.left) {
                this.visualizer.drawNodeLink(node, node.left)
                queue.push(node.left)
            }
            if (node.right) {
                this.visualizer.drawNodeLink(node, node.right)
                queue.push(node.right)
            }
        }
    }
}

let input = document.getElementById("input1");
input.oninput = function (event) {
    parseInput(event.target.value)
}

function parseInput(value) {
    if (value[0] !== "[" || value[value.length - 1] !== "]") {
        console.log("Incorrect input")
        return;
    }
    // todo: add more validation
    let chunks = value.slice(1, -1).split(",").map(v => v.trim());
    console.log(chunks);
    let tree = new Tree(new Visualizer());
    tree.build(chunks);
    tree.bfs();
}

parseInput("[1,2,null,4,5,6]")