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

        // this.ctx.beginPath();
        // this.ctx.moveTo(0, 0);
        // this.ctx.lineTo(40, 40)
        // this.ctx.stroke()
    }

    drawNode(node) {
        let {x, y} = node.position
        let width = this.getInnerWidth(node);
        this.ctx.fillText(node.value, x, y)
        if (width < 30) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, node.radius, 0, 2 * Math.PI)
            this.ctx.stroke();
        } else {
            let additionalShift = (width - 30) / 2.;
            this.ctx.beginPath();
            this.ctx.arc(x - additionalShift, y, node.radius, Math.PI / 2, Math.PI * 3 / 2);
            this.ctx.lineTo(x + additionalShift, y - node.radius);
            this.ctx.arc(x + additionalShift, y, node.radius, -Math.PI / 2, -Math.PI * 3 / 2);
            this.ctx.lineTo(x - additionalShift, y + node.radius);
            this.ctx.stroke();
        }
    }

    getInnerWidth(node) {
        return this.ctx.measureText(node.value).width;
    }

    getOuterWidth(node) {
        return Math.max(node.radius * 2, this.getInnerWidth(node) + 10);
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
        this.axisY = 80;
        this.visualizer = visualizer;
    }

    build(chunks) {
        this.root = new Node(chunks[0]);
        let nodes = [this.root];
        for (let i = 1, pi = 0; i < chunks.length; i += 2, pi++) {
            let parent = nodes[pi];
            if (chunks[i] !== "null") {
                let leftNode = new Node(chunks[i]);
                parent.left = leftNode;
                nodes.push(leftNode);
            }
            if (i + 1 === chunks.length || chunks[i + 1] === "null") continue;
            let rightNode = new Node(chunks[i + 1]);
            parent.right = rightNode;
            nodes.push(rightNode);
        }

        this.reposition();
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

    reposition() {
        this.traverse(this.root, 0, [], true);
    }

    traverse(node, h, hToRightmostX, leanLeft) {
        if (!node) return;
        hToRightmostX[h] = Math.max(hToRightmostX[h] || 0, (hToRightmostX[h - 1] || 0) + (leanLeft ? - node.radius / 2 : node.radius / 2));
        let left = this.traverse(node.left, h + 1, hToRightmostX, true);
        let right = this.traverse(node.right, h + 1, hToRightmostX, false);
        node.position.y = h * this.axisY + node.radius;
        let horizontalShift = this.visualizer.getOuterWidth(node) / 2;
        if (!left && !right) {
            console.log("leaf " + node.value + " h shift " + horizontalShift);
            node.position.x = Math.max((hToRightmostX[h] || 0) + horizontalShift  + node.radius / 2);
        } else if (left && right) {
            console.log("link " + node.value);
            node.position.x = (node.left.position.x + node.right.position.x) / 2;
        } else if (left && !right) {
            node.position.x = node.left.position.x + node.radius / 2;
            console.log("some left", node);
        } else if (!left && right) {
            node.position.x = hToRightmostX[h] + node.radius + node.radius / 2;
            node.position.x = (node.position.x + right.position.x - node.radius / 2) / 2;
            console.log("some right", node);
        }
        hToRightmostX[h] = node.position.x + horizontalShift;
        return node;
    }
}

let input = document.getElementById("input1");
input.oninput = function (event) {
    parseInput(event.target.value)
}

function parseInput(value) {
    if (value[0] !== "[" || value[value.length - 1] !== "]") {
        console.log("Incorrect input " + value)
        return;
    }
    // todo: add more validation
    let chunks = value.slice(1, -1).split(",").map(v => v.trim()).filter(s => s.length > 0);
    if (chunks.length === 0) {
        console.log("Nothing to draw"); // todo: clear canvas
        return;
    }
    console.log(chunks);
    let tree = new Tree(new Visualizer());
    tree.build(chunks);
    tree.bfs();
}

parseInput("[1,2,null,4,5,6]");
parseInput("[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]");
parseInput("[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]");
parseInput("[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]");
parseInput("[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]");
parseInput("[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,null,19]");
// parseInput("[1,2,3,4,5,6,7]");
// parseInput("[1,2,3,4,5,null,7]");
// parseInput("[1,2,3,4,5,null,7,null,null,null,null,8]");
// parseInput("[1,2,3,4,5,6,7,null,null,10]");
// parseInput("[1,2,null,4,null,6]");
// parseInput("[1,2,3,4,5,null,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,null,null,23]");
// parseInput("[1,2,3,4,5,null,7,8,9,10,11,12,13,14,15,null,17,18,19,20,21,22,null,null,23]");
// parseInput("[1,null,3]");
// parseInput("[1,null,3,4]");
// parseInput("[1,null,3,4,5]");
// parseInput("[1]");
// parseInput("[]")
parseInput("[1,2,3,4,5,6,7,8,9,10,11,12,null,14,15,16,17,18,19,20,21,22,23,24,null,15,null,28,29,30,31,null,null,2,3,4,5,null,6,7,5,4,null,6,null,null,null,5,4,null,null,5,null,null,null,null,null,null,null,5,null,null,null,null,null,null,5,null,null,null,null,null,null,null,4,null,5,null,5,null,null,4,3,null,2232141241251,123,123456,1234567]");
// parseInput("[1,2,3,4,555555,6,7]");