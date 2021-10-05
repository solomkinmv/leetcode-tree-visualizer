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
        let width = this.getInnerWidth(node);
        this.ctx.fillText(node.valueActual, x, y)
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
        return this.ctx.measureText(node.valueActual).width;
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
    constructor(valueActual, valueExpected) {
        this.valueActual = valueActual
        this.valueExpected = valueExpected;
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

    build(chunksActual, chunksExpected) {
        this.root = new Node(chunksActual[0]); // todo: handle zero length
        let actualNodes = [this.root];
        for (let i = 1, api = 0; i < chunksActual.length; i += 2, api++) {
            // actual
            let parent = actualNodes[api];
            if (chunksActual[i] !== "null") {
                let leftNode = new Node(chunksActual[i]);
                parent.left = leftNode;
                actualNodes.push(leftNode);
            }
            if (i + 1 === chunksActual.length || chunksActual[i + 1] === "null") continue;
            let rightNode = new Node(chunksActual[i + 1]);
            parent.right = rightNode;
            actualNodes.push(rightNode);
        }

        this.root.valueExpected = chunksExpected[0]; // todo: handle zero length
        let expectedNodes = [this.root];
        for (let i = 1, pi = 0; i < chunksExpected.length; i+= 2, pi++) {
            let parent = expectedNodes[pi];
            if (chunksExpected[i] !== "null") {
                let leftNode = parent.left;
                if (leftNode) {
                    leftNode.valueExpected = chunksExpected[i];
                } else {
                    leftNode = new Node(null, chunksExpected[i]);
                    parent.left = leftNode;
                }
                expectedNodes.push(leftNode);
            }
            if (i + 1 === chunksExpected.length || chunksExpected[i + 1] === "null") continue;
            let rightNode = parent.right;
            if (rightNode) {
                rightNode.valueExpected = chunksExpected[i + 1];
            } else {
                rightNode = new Node(null, chunksExpected[i + 1]);
                parent.right = rightNode;
            }
            expectedNodes.push(rightNode);
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
            console.log("leaf " + node.valueActual + " h shift " + horizontalShift);
            node.position.x = Math.max((hToRightmostX[h] || 0) + horizontalShift  + node.radius / 2);
        } else if (left && right) {
            console.log("link " + node.valueActual);
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

let inputActual = document.getElementById("input-actual");
let inputExpected = document.getElementById("input-expected");
inputActual.oninput = refresh;
inputExpected.oninput = refresh;

function refresh(event) {
    displayTree(parseInput(inputActual.value), parseInput(inputExpected.value));
}

function parseInput(stringValue) {
    if (!stringValue || stringValue[0] !== "[" || stringValue[stringValue.length - 1] !== "]") {
        console.log("Incorrect input " + stringValue)
        return;
    }
    // todo: add more validation
    return stringValue.slice(1, -1).split(",").map(v => v.trim()).filter(s => s.length > 0);
}

function displayTree(inputChunksActual, inputChunksExpected) {
    if (inputChunksActual.length === 0 && inputChunksExpected.length === 0) {
        console.log("Nothing to draw"); // todo: clear canvas
        return;
    }
    let tree = new Tree(new Visualizer());
    tree.build(inputChunksActual, inputChunksExpected);
    tree.bfs();
}

function displayRawTree(stringValueActual, stringValueExpected) {
    displayTree(parseInput(stringValueActual), parseInput(stringValueExpected));
}

// displayRawTree("[1,2,null,4,5,6]");
// displayRawTree("[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]");
// displayRawTree("[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]");
// displayRawTree("[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]");
// displayRawTree("[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]");
// displayRawTree("[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,null,19]");
// displayRawTree("[1,2,3,4,5,6,7]");
// displayRawTree("[1,2,3,4,5,null,7]");
// displayRawTree("[1,2,3,4,5,null,7,null,null,null,null,8]");
// displayRawTree("[1,2,3,4,5,6,7,null,null,10]");
// displayRawTree("[1,2,null,4,null,6]");
// displayRawTree("[1,2,3,4,5,null,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,null,null,23]");
// displayRawTree("[1,2,3,4,5,null,7,8,9,10,11,12,13,14,15,null,17,18,19,20,21,22,null,null,23]");
// displayRawTree("[1,null,3]");
// displayRawTree("[1,null,3,4]");
// displayRawTree("[1,null,3,4,5]");
// displayRawTree("[1]");
// displayRawTree("[]")
// displayRawTree("[1,2,3,4,5,6,7,8,9,10,11,12,null,14,15,16,17,18,19,20,21,22,23,24,null,15,null,28,29,30,31,null,null,2,3,4,5,null,6,7,5,4,null,6,null,null,null,5,4,null,null,5,null,null,null,null,null,null,null,5,null,null,null,null,null,null,5,null,null,null,null,null,null,null,4,null,5,null,5,null,null,4,3,null,223214124125122321412412512232141241251,123,123456,1234567]");
// displayRawTree("[1,2,3,4,555555,6,7]");
displayRawTree("[1,null,3,5]", "[2,3,null,4]")