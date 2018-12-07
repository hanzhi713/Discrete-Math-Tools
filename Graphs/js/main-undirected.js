/**
 * create graph from an adjacency matrix
 * @function
 * @public
 * @param {Object|Array} m
 * The adjacency matrix
 * @return void
 * */
function createFromAM(m) {
    stopAnimation();

    // this must be a square matrix...
    if (m.length !== m[0].length)
        return;

    clearSource();
    let numOfNodes = m.length;
    cy.startBatch();
    // add all nodes
    for (let i = 1; i <= numOfNodes; i++)
        cy.add({
            group: 'nodes',
            data: {id: i},
            position: {
                x: (Math.random() * 250 + 25),
                y: (Math.random() * 250 + 25)
            }
        });

    for (let i = 0; i < numOfNodes; i++)
        for (let j = i; j < numOfNodes; j++)

            // add the correct number of edges connecting this two nodes
            for (let x = 0; x < m[i][j]; x++)
                cy.add({
                    group: 'edges',
                    data: {id: (i + 1) + '-' + (j + 1) + '-' + x, source: i + 1, target: j + 1}
                });
    cy.endBatch();
    cyReLayout();
}
/**
 * create the graph from a weight matrix
 * @function
 * @public
 * @param {Object|Array} m
 * The weight matrix
 * @return void
 * */
function createFromWM(m) {
    stopAnimation();
    if (m.length !== m[0].length) return;
    clearSource();
    let numOfNodes = m.length;
    cy.startBatch();
    for (let i = 1; i <= numOfNodes; i++)
        cy.add({
            group: 'nodes',
            data: {id: i},
            position: {
                x: (Math.random() * 250 + 25),
                y: (Math.random() * 250 + 25)
            }
        });

    for (let i = 0; i < numOfNodes; i++)
        for (let j = i; j < numOfNodes; j++)
            if (m[i][j] > 0)
                cy.add({
                    group: 'edges',
                    data: {id: (i + 1) + '-' + (j + 1) + '-0', source: i + 1, target: j + 1, weight: m[i][j]}
                });
    cy.endBatch();
    cyReLayout();
}
/**
 * generate a random graph
 * @function
 * @public
 * @return void
 * */
function generateGraph() {
    stopAnimation();
    clearCyStyle();
    let simple = document.getElementById('simple').checked;
    let weighted = document.getElementById('weighted').checked;
    let numOfNodes = parseInt(prompt("Please enter the number of nodes", "6"));
    let matrix = new Array(numOfNodes);
    for (let i = 0; i < matrix.length; i++)
        matrix[i] = new Array(numOfNodes);
    if (simple) {
        let pConnected = parseFloat(prompt("Please specify the propability that two nodes are connected.\nRange: 0 to 1", "0.5"));
        if (weighted) {
            let weightRange = prompt("Please specify the weight range.\nExample: 1-5 represents range from 1 to 5.\n Lower limit must be greater than 0.", "1-4");
            let temp = weightRange.split('-');
            let lower = parseInt(temp[0]) > 0 ? parseInt(temp[0]) : 1;
            let range = parseInt(temp[1]) >= lower ? parseInt(temp[1]) - lower + 1 : lower + 4;
            for (let i = 0; i < numOfNodes; i++)
                for (let j = i + 1; j < numOfNodes; j++) {
                    if (Math.random() < pConnected)
                        matrix[i][j] = Math.floor(Math.random() * range + lower);
                    else
                        matrix[i][j] = 0;
                }
            createFromWM(matrix);
        }
        else {
            for (let i = 0; i < numOfNodes; i++)
                for (let j = i + 1; j < numOfNodes; j++) {
                    if (Math.random() < pConnected)
                        matrix[i][j] = 1;
                    else
                        matrix[i][j] = 0;
                }
            createFromAM(matrix);
        }
    }
    else {
        let nMultiple = parseInt(prompt("Please specify the max number of edges connecting two nodes.\nRange: 2 to infinity", "2"));
        let pMultiple = parseFloat(prompt("Please specify the the probability of having multiple edges", "0.25"));
        for (let i = 0; i < numOfNodes; i++) {
            for (let j = i; j < numOfNodes; j++) {
                if (i === j) {
                    if (Math.random() < pMultiple / 2)
                        matrix[i][j] = Math.floor((Math.random() * nMultiple + 1) / 2);
                }
                else {
                    if (Math.random() < pMultiple)
                        matrix[i][j] = Math.floor(Math.random() * nMultiple + 1);
                    else {
                        if (Math.random() > (1 / nMultiple))
                            matrix[i][j] = 1;
                        else
                            matrix[i][j] = 0;
                    }
                }
            }

        }
        createFromAM(matrix);
    }
}
/**
 * Generate a complete graph of n vertices by first generating its corresponding adjacency matrix
 * @function
 * @public
 * @return void
 * */
function Kn() {
    stopAnimation();
    clearSource();
    let numOfNodes = parseInt(prompt("Please enter the number of vertices", "5"));
    let weightRange = prompt("Please specify the weight range.\nLeave this blank if you want an unweighted graph.\nExample: 1-5 represents range from 1 to 5.\nLower limit must be greater than 0.", "");
    let matrix = new Array(numOfNodes);
    if (weightRange.length > 0) {
        let temp = weightRange.split('-');
        let lower = parseInt(temp[0]) > 0 ? parseInt(temp[0]) : 1;
        let range = parseInt(temp[1]) > lower ? parseInt(temp[1]) - lower + 1 : lower + 4;

        // fill in the half above the major diagonal (exclude major diagonal) with random weights in the give range
        for (let i = 0; i < numOfNodes; i++) {
            matrix[i] = new Array(numOfNodes);
            for (let j = i + 1; j < numOfNodes; j++)
                matrix[i][j] = parseInt(Math.random() * range + lower);
        }
        createFromWM(matrix);
    }
    else {

        // fill in the half above the major diagonal (exclude major diagonal) with 1
        for (let i = 0; i < numOfNodes; i++) {
            matrix[i] = new Array(numOfNodes);
            for (let j = i + 1; j < numOfNodes; j++)
                matrix[i][j] = 1;
        }
        createFromAM(matrix);
    }
}

/**
 * generate a complete bipartile graph by first generating its adjacency matrix
 * @function
 * @public
 * @return void
 * */
function Kn_n() {
    stopAnimation();
    let n = prompt("Please enter n,n.\nExample: 3,3 represents K3,3", "3,3");
    n = n.split(',');
    let n1 = parseInt(n[0]);
    let n2 = parseInt(n[1]);
    let numOfNodes = n1 + n2;
    let matrix = new Array(numOfNodes);
    for (let i = 0; i < numOfNodes; i++)
        matrix[i] = new Array(numOfNodes);

    let weightRange = prompt("Please specify the weight range.\nLeave this blank if you want an unweighted graph.\nExample: 1-5 represents range from 1 to 5.\nLower limit must be greater than 0.", "");
    if (weightRange.length > 0) {
        let temp = weightRange.split('-');
        let lower = parseInt(temp[0]) > 0 ? parseInt(temp[0]) : 1;

        // upper bound must be greater than the lower bound...
        let range = parseInt(temp[1]) > lower ? parseInt(temp[1]) : lower + 4;

        // I think you can understand this
        for (let i = 0; i < n1; i++)
            for (let j = n1; j < numOfNodes; j++)
                matrix[i][j] = parseInt(Math.random() * range + lower);
        createFromWM(matrix);
    }
    else {
        for (let i = 0; i < n1; i++)
            for (let j = n1; j < numOfNodes; j++)
                matrix[i][j] = 1;
        createFromAM(matrix);
    }
}

/**
 * Breadth first search is implemented in the library
 * @function
 * @public
 * @return void
 * */
function breadthFirstSearch() {
    stopAnimation();
    let root = getCyStartNode("Please enter the id of the starting node", "1");
    if (root === undefined)
        return;
    clearCyStyle();
    cy.elements(":grabbable").unselect();
    let path = cy.elements(":grabbable").bfs(root).path;
    clearResult();
    let pathList = new LinkedList();
    path.select();
    ca.add(path);
    path.forEach((ele) => {
        pathList.add(ele);
    });
    caReLayout();
    pathList.traverse(animation.checked, true);
}
/**
 * DFS implemented in the library
 * @function
 * @public
 * @return void
 * */
function depthFirstSearch() {
    stopAnimation();
    let root = getCyStartNode("Please enter the id of the starting node", "1");
    if (root === undefined)
        return;
    clearCyStyle();
    cy.elements(":grabbable").unselect();
    let path = cy.elements(":grabbable").dfs(root).path;
    clearResult();
    let pathList = new LinkedList();
    path.select();
    ca.add(path);
    path.forEach((ele) => {
        pathList.add(ele);
    });
    caReLayout();
    pathList.traverse(animation.checked, true);
}
/**
 * Kruskal is implemented in the library
 * @function
 * @public
 * @return void
 * */
function performKruskal() {
    stopAnimation();
    clearCyStyle();
    cy.elements(":grabbable").unselect();
    let spanningTree = cy.elements(":grabbable").kruskal(getWeight);
    clearResult();
    ca.add(spanningTree);
    spanningTree.select();
    caReLayout();
    let pathList = new LinkedList();
    spanningTree.forEach((ele) => {
        if (ele.isEdge()) {
            pathList.add(ele);
            if (pathList.search((e) => {
                    return e.data('id') === ele.source().data('id');
                }) === null) {
                pathList.add(ele.source());
            }
            if (pathList.search((e) => {
                    return e.data('id') === ele.target().data('id');
                }) === null) {
                pathList.add(ele.target());
            }
        }
    });
    pathList.traverse(animation.checked, false);
}
/**
 * Dijkstra is implemented in the library
 * @function
 * @public
 * @return void
 * */
function performDijkstra() {
    stopAnimation();
    let nodes = cy.nodes(':selected');
    let path;
    if (nodes.length >= 2) {
        path = cy.elements(":grabbable").dijkstra(nodes[0], getWeight).pathTo(nodes[1]);
    }
    else {
        let p = prompt("Please enter the id of source and target nodes, src-tg.\nExample: 1-2", "");
        let pt = p.split('-');
        path = cy.elements(":grabbable").dijkstra('#' + pt[0], getWeight).pathTo('#' + pt[1]);
    }
    let pathList = new LinkedList();
    path.forEach((ele) => {
        pathList.add(ele);
    });
    clearCyStyle();
    clearResult();
    ca.add(path);
    caReLayout();
    path.select();
    pathList.traverse(animation.checked, true);
}
/**
 * a detailed implementation of Dijkstra's algorithm, showing every step
 * @function
 * @public
 * @return void
 * */
function myDijkstra() {
    /**
     * @function
     * @private
     * @param {object} node
     * @callback
     * @param {function} callback
     * the function to execute after completion of animation
     * @return void
     * */
    function animateNode(node, callback) {
        if (node !== undefined && node.length > 0)
            node.animate({
                style: {backgroundColor: '#f185dc', width: '30px', height: '30px'},
                duration: Math.round(+duration.value * 0.1),
                queue: true
            }).animate({
                style: {backgroundColor: '#de4400', width: '20px', height: '20px'},
                duration: Math.round(+duration.value * 0.4),
                queue: true,
                complete: callback
            });
        else
            callback();
    }

    /**
     * @function
     * @private
     * @param {object} edge
     * @callback
     * @param {function} callback
     * the function to execute after completion of animation
     * @return void
     * */
    function animateEdge(edge, callback) {
        if (edge !== undefined && edge.length > 0)
            edge.animate({
                style: {lineColor: '#f185dc', width: '6'},
                duration: Math.round(+duration.value * 0.2),
                queue: true
            }).animate({
                style: {lineColor: '#de4400', width: '3'},
                duration: Math.round(+duration.value * 0.8),
                queue: true,
                complete: callback
            });
        else
            callback();
    }

    /**
     * @function
     * @private
     * @param {object} node
     * @callback
     * @param {function} callback
     * the function to execute after completion of animation
     * @return void
     * */
    function animateLabel(node, callback) {
        if (node !== undefined && node.length > 0)
            node.animate({
                style: {textBackgroundColor: 'yellow', textBackgroundOpacity: 1},
                duration: Math.round(+duration.value * 0.4),
                queue: true
            }).delay(+duration.value * 0.2).animate({
                style: {textBackgroundColor: 'yellow', textBackgroundOpacity: 0},
                duration: Math.round(+duration.value * 0.4),
                queue: true,
                complete: callback
            });
        else
            callback();
    }

    /**
     * @function
     * @private
     * @param {object} current
     * @return void
     * */
    function traceBack(current) {
        // animate current node
        current.animate({
            style: {backgroundColor: '#eae90f', width: '30px', height: '30px'},
            duration: Math.round(+duration.value * 0.15),
            queue: true
        }).animate({
            style: {backgroundColor: 'green', width: '20px', height: '20px'},
            duration: Math.round(+duration.value * 0.6),
            queue: true,
            complete: () => {
                if (!animationFlag)
                    return;
                // select the current node
                current.select();

                // acquire the previous node
                let previous = current.data('previous');

                // if we haven't reached the starting node
                if (previous !== undefined) {
                    previous = ns.$id(previous);

                    // get the edge connecting these two nodes and animate it
                    let e = previous.edgesWith(current);
                    e.animate({
                        style: {lineColor: '#eae90f', width: '6'},
                        duration: Math.round(+duration.value * 0.2),
                        queue: true
                    }).animate({
                        style: {lineColor: 'green', width: '3'},
                        duration: Math.round(+duration.value * 0.8),
                        queue: true,

                        // when the animation completes:
                        // select the edge and keep tracing backward
                        complete: () => {
                            if (animationFlag){
                                e.select();
                                traceBack(previous);
                            }
                        }
                    });
                }
                else {
                    clearResult();
                    ca.add(cy.$(':selected'));
                    caReLayout();
                    ns.removeData('previous');
                }
            }
        });
    }

    /**
     * @function
     * @private
     * @param {object} currentNode
     * current node with a permanent label
     * @param {object} edges
     * all edges connect to n
     * @param {int} i
     * the index of the edge that we're up to
     * @return void
     * */
    function addNextLabel(currentNode, edges, i) {
        // get the value of the permanent label
        let weight = currentNode.data('permanent');

        // if the index is out of bound, then...
        if (i >= edges.length) {

            // get the minimum among all nodes with temporary labels but without permanent labels
            // the node with this minimal label will be assigned with a permanent label
            let minW = Infinity;
            let nextPermanent;
            ns.forEach((node) => {
                let tempLabels = node.data('temporary');
                if (tempLabels.length > 0 && node.data('permanent') === undefined) {
                    if (tempLabels[tempLabels.length - 1] < minW || (tempLabels[tempLabels.length - 1] === minW && node.data('id') === target.data('id'))) {
                        minW = tempLabels[tempLabels.length - 1];
                        nextPermanent = node;
                    }
                }
            });

            // callbacks... and callbacks...
            // animate this node...
            animateNode(nextPermanent, () => {
                if (!animationFlag)
                    return;
                // assign a permanent label to this node
                nextPermanent.data('permanent', minW);
                nextPermanent.style({
                    textBorderOpacity: 1,
                    textBorderWidth: '1px',
                    textBorderStyle: 'dashed',
                    textBorderColor: 'green'
                });

                // connect this node with the previous node with a permanent label
                let edgeBetween = nextPermanent.edgesWith(cy.$id(nextPermanent.data('previous')));

                // animate the edge
                animateEdge(edgeBetween, () => {
                    if (!animationFlag)
                        return;

                    // if the target node haven't got a permanent label
                    if (target.data('permanent') === undefined)

                    // continue to label...
                        addNextLabel(nextPermanent, nextPermanent.connectedEdges(), 0);

                    // else: now we can trace the walk, back from the target to the start
                    else {
                        traceBack(nextPermanent);
                    }
                });
            });
        }
        else {
            // the current edge
            let edge = edges[i];

            // get the weight of the target node
            let node = getTarget(currentNode, edge);
            let nodeWeight = getWeight(edge) + weight;

            // if the target node is not yet permanently labeled
            if (node.data('permanent') === undefined) {

                // animate this edge
                animateEdge(edge, () => {
                    if (!animationFlag)
                        return;

                    // if the target node doesn't have a temporary label,
                    // or the new weight is lower than the current label
                    // update the label
                    let tempLabels = node.data('temporary').concat();
                    if (tempLabels.length === 0 || tempLabels[tempLabels.length - 1] > nodeWeight) {
                        animateNode(node, () => {
                            if (!animationFlag)
                                return;
                            tempLabels.push(nodeWeight);
                            node.data('temporary', tempLabels);
                            node.data('previous', currentNode.data('id'));
                        });
                        animateLabel(node, () => {
                            if (!animationFlag)
                                return;

                            node.style({backgroundColor: '', width: '', height: ''});
                            edge.removeStyle();

                            // keep labelling...
                            addNextLabel(currentNode, edges, i + 1);
                        });
                    }
                    else {
                        edge.removeStyle();
                        addNextLabel(currentNode, edges, i + 1);
                    }
                });
            }
            // skip this node if it has got a permanent label
            else {
                addNextLabel(currentNode, edges, i + 1);
            }
        }
    }

    if (!isConnected()) {
        alert("This graph is not connected!");
        return;
    }
    let root;
    let target;
    let ns = getAllNodes(cy);
    let temp = cy.nodes(':selected');
    if (temp.length >= 2) {
        root = temp[0];
        target = temp[1];
    }
    else {
        temp = prompt("Please enter the id of source and target nodes, src-tg.\nExample: 1-2", "");
        let p = temp.split('-');
        root = cy.$id(p[0]);
        target = cy.$id(p[1]);
        if (root.length <= 0 || target.length <= 0)
            return;
    }
    clearCyStyle();

    // set all labels to undefined
    ns.data('temporary', []);
    ns.removeData('permanent');
    ns.removeData('previous');

    // set the label function
    // format: "id|temporary labels|permanent label"
    cy.style().selector('node').style({
        label: (n) => {
            let temporary = n.data('temporary');
            let l = temporary.length - 1;
            let tempLabels = '';
            if (l > -1) {
                tempLabels += '|';
                for (let i = 0; i < l; i++)
                    tempLabels += temporary[i] + '>';
                tempLabels += temporary[l];
            }
            return n.data('id') + tempLabels + (isNaN(n.data('permanent')) ? '' : '|' + n.data('permanent'));
        }
    });

    // give the starting node a permanent label
    let currentNode = root;
    currentNode.data('permanent', 0);
    currentNode.data('temporary', [0]);

    if (animation.checked) {
        currentNode.style({
            textBorderOpacity: 1,
            textBorderWidth: '1px',
            textBorderStyle: 'dashed',
            textBorderColor: 'green'
        });
        animationFlag = true;

        // start the whole algorithm
        animateNode(currentNode, () => {
            addNextLabel(currentNode, currentNode.connectedEdges(), 0);
        });
    }

    // same story as the above, but without animation
    // looks nicer, no awful callbacks
    else {
        while (target.data('permanent') === undefined) {
            let edges = currentNode.connectedEdges();
            let weight = currentNode.data('permanent');
            edges.forEach((edge) => {
                let node = getTarget(currentNode, edge);
                let nodeWeight = getWeight(edge) + weight;
                if (node.data('permanent') === undefined) {
                    let tempLabels = node.data('temporary').concat();
                    if (tempLabels.length === 0 || tempLabels[tempLabels.length - 1] > nodeWeight) {
                        tempLabels.push(nodeWeight);
                        node.data('temporary', tempLabels);
                        node.data('previous', currentNode.data('id'));
                    }
                }
            });
            let minW = Infinity;
            let nextPermanent;
            ns.forEach((node) => {
                let tempLabels = node.data('temporary');
                if (tempLabels.length > 0 && node.data('permanent') === undefined) {
                    if (tempLabels[tempLabels.length - 1] < minW || (tempLabels[tempLabels.length - 1] === minW && node.data('id') === target.data('id'))) {
                        minW = tempLabels[tempLabels.length - 1];
                        nextPermanent = node;
                    }
                }
            });
            nextPermanent.data('permanent', minW);
            nextPermanent.style({
                textBorderOpacity: 1,
                textBorderWidth: '1px',
                textBorderStyle: 'dashed',
                textBorderColor: 'green'
            });
            currentNode = nextPermanent;
        }
        cy.startBatch();
        let previous = currentNode.data('previous');
        while (previous !== undefined) {
            currentNode.select();
            currentNode.edgesWith(cy.$id(previous)).select();
            currentNode = cy.$id(previous);
            previous = currentNode.data('previous');
        }
        currentNode.select();
        cy.endBatch();
        clearResult();
        ca.add(cy.$(':selected'));
        caReLayout();
        ns.removeData('previous');
    }
}
/**
 * @function
 * @public
 * @return void
 * */
function prim() {
    stopAnimation();
    clearCyStyle();
    let root = getCyStartNode("Please enter the id of the starting node", "1");
    if (root === undefined)
        root = getAllNodes(cy)[0];
    cy.elements(":grabbable").unselect();
    root.select();
    /**
     * @function
     * @private
     * @return object
     * Get the edge of minimal weight connected to the selected nodes
     * */
    let getMinimalEdge = () => {
        let nodes = cy.nodes(":selected");
        let minWeight = Infinity;
        let minEdge;
        for (let i = 0; i < nodes.length; i++) {

            // get all unused edges connected to this node
            let edges = nodes[i].connectedEdges(":unselected");
            for (let j = 0; j < edges.length; j++) {

                // its target node must not be in the tree
                if (!getTarget(nodes[i], edges[j]).selected()) {
                    let w = getWeight(edges[j]);
                    if (w < minWeight) {
                        minWeight = w;
                        minEdge = edges[j];
                    }
                }
            }
        }
        return minEdge;
    };
    let tree = new LinkedList();

    //starting from a given node
    tree.add(root);

    // if there're still nodes that are not in the tree
    while (cy.nodes(":unselected").length > 0) {

        // Get the edge of minimal weight connected to the current tree
        let edge = getMinimalEdge();
        edge.select();

        // add this edge to the tree
        tree.add(edge);

        // add its target node to the tree
        if (edge.target().selected()) {
            edge.source().select();
            tree.add(edge.source());
        }
        else {
            edge.target().select();
            tree.add(edge.target());
        }
    }
    clearResult();
    ca.add(cy.$(":selected"));
    caReLayout();
    tree.traverse(animation.checked, true);
}
/**
 * @function
 * @public
 * @param {object} root
 * @return {Array}
 * */
function localMinimalWeightCycle(root) {
    let minWeight = Infinity;
    let path, lastEdge, current_node, weight, d, distance;

    cy.startBatch();
    // Traverse the edges connected to this root node
    root.connectedEdges().forEach((edge) => {

        // Select an edge and get its weight and the node which it connected to
        current_node = getTarget(root, edge);
        weight = getWeight(edge);

        // Remove it
        cy.remove(edge);

        // Find the minimal weight connector connecting these two nodes
        // If found, then a cycle is established after adding the edge back
        // Dijkstra method:
        d = cy.elements(":grabbable").dijkstra(root, getWeight);
        distance = d.distanceTo(current_node) + weight;

        // Find the minimal weight cycle starting from root node
        if (distance < minWeight) {
            minWeight = distance;
            path = d.pathTo(current_node);
            lastEdge = edge;
        }
        cy.add(edge);
    });
    cy.endBatch();
    return [minWeight, path, lastEdge];
}

/**
 * Find the minimal weight cycle, either local or global
 * @function
 * @public
 * @return void
 * */
function minimalWeightCycle() {
    stopAnimation();
    let root = getCyStartNode("Please enter id of the starting node.\nIf you want apply this algorithm too all nodes and get the best one, leave it blank", "");
    let results;
    clearCyStyle();
    cy.elements(":grabbable").unselect();
    // the global minimal weight cycle
    if (root === undefined) {
        // Find the global minimal weight cycle
        let globalMinWeight = Infinity;
        let globalPath;
        let globalE;

        // Traverse every node, finding the minimal weight cycle starting from each node
        // thus finding the minimal one from these local minimal cycles
        getAllNodes(cy).forEach((root) => {
            results = localMinimalWeightCycle(root);
            if (results[0] < globalMinWeight) {
                globalMinWeight = results[0];

                // Record the path
                globalPath = results[1];
                globalE = results[2];
            }
        });
        clearResult();

        // select the cycle
        globalPath.select();
        globalE.select();
        ca.add(globalPath);
        ca.add(globalE);
    }
    // The local one
    else {
        results = localMinimalWeightCycle(root);
        clearResult();
        results[1].select();
        results[2].select();
        ca.add(results[1]);
        ca.add(results[2]);
    }
    caReLayout();
}
/**
 * The global nearest neighbor algorithm
 * find that of minimal weight by performing the algorithm on every node
 * @function
 * @public
 * @return void
 * */
function nearestNeighbor() {
    stopAnimation();
    let root = getCyStartNode("Please enter id of the starting node.\nIf you want apply this algorithm too all nodes and get the best one, leave it blank", "");
    clearCyStyle();
    cy.elements(":grabbable").unselect();
    let results;
    if (root === undefined) {
        let minWeight = Infinity;
        let minElements;
        let minPath;
        cy.startBatch();
        getAllNodes(cy).forEach((currentNode) => {
            results = nearestNeighborAlgorithm(currentNode);
            let sumWeight = results[0];
            if (sumWeight <= minWeight) {
                minElements = cy.$(':selected');
                minWeight = sumWeight;
                minPath = results[1];
            }
            cy.elements(":grabbable").unselect();
        });
        clearResult();
        ca.add(minElements);
        minElements.select();
        cy.endBatch();
        minPath.traverse(animation.checked, true);
    }
    else {
        results = nearestNeighborAlgorithm(root);
        clearResult();
        ca.add(cy.$(':selected'));
        results[1].traverse(animation.checked, true);
    }
    caReLayout();
}
/**
 * The nearest neighbor algorithm starting from a given node
 * @function
 * @public
 * @param {object} root
 * @return {Array}
 * */
function nearestNeighborAlgorithm(root) {
    let currentNode = root;
    cy.startBatch();
    /**
     * @function
     * @private
     * @param {object} node
     * @return {object} the edge of minimal weight connected to this node
     * */
    let getMinimalEdge = (node) => {
        let minWeight = Infinity;
        let edge = undefined;

        // Traverse all the adjacent edges whose target node is not selected and find the minimal weight one
        node.connectedEdges().forEach((e) => {
            // Skip this edge if its target node have been already visited
            if (!getTarget(node, e).selected()) {
                let weight = getWeight(e);
                if (weight < minWeight) {
                    minWeight = weight;
                    edge = e;
                }
            }
        });
        return edge;
    };

    // Iteratively select the edge of minimal weight and the node which it connects
    let edge = getMinimalEdge(currentNode);
    let totalWeight = 0;
    let numOfNodes = 1;
    let path = new LinkedList();
    path.add(currentNode);
    currentNode.select();

    // Doing until the number of connected unselected edges of the destination node is 0
    // which means we are stuck or we have visited all nodes
    while (edge !== undefined) {
        numOfNodes += 1;
        totalWeight += getWeight(edge);
        currentNode = getTarget(currentNode, edge);
        path.add(edge);
        path.add(currentNode);
        edge.select();
        currentNode.select();
        edge = getMinimalEdge(currentNode);
    }

    // get the edge connecting the last node and the first node
    // Such edge must exist if the graph is complete
    let lastEdge = cy.edges("[id ^='" + root.data('id') + '-' + currentNode.data('id') + "-']")
        .union(cy.edges("[id ^='" + currentNode.data('id') + '-' + root.data('id') + "-']"));

    // if it does not exist
    // apply a very high weight to this solution
    // in case other solution might be complete (therefore better than this one)
    if (lastEdge.length === 0)
        totalWeight += Math.pow(2, 32);
    else {
        lastEdge[0].select();
        path.add(lastEdge[0]);
    }
    path.add(root);
    cy.endBatch();
    // If not all nodes are visited, give this solution a very high weight
    return [totalWeight + (getAllNodes(cy).length - numOfNodes) * Math.pow(2, 32), path];
}
/**
 * check whether the graph is connected by performing breadth first search
 * @function
 * @public
 * @return boolean
 * */
function isConnected() {
    let path = cy.elements(":grabbable").bfs(getAllNodes(cy)[0]).path;
    return path.nodes().length === cy.nodes(":grabbable").length;
}

/**
 * @see traceEulerianCycle()
 * @function
 * @public
 * @return void
 * */
function eulerianCycle() {

    // first check if this graph is connected
    stopAnimation();
    if (!isConnected())
        return alert('This graph is not connected');

    // then check whether there're none or two vertices of odd degree
    let numOfOddDegrees = 0;
    getAllNodes(cy).forEach((ele) => {
        if (ele.degree() % 2 !== 0)
            numOfOddDegrees += 1;
    });

    // stop if the conditions for Eulerian/semi-Eulerian graphs are not satisfied.
    if (numOfOddDegrees !== 0 && numOfOddDegrees !== 2)
        return alert('This graph is neither Eulerian nor semi-Eulerian');
    cy.elements(":grabbable").unselect();
    clearResult();
    ca.add(cy.elements(":grabbable"));
    caReLayout();

    // starting Eulerian Cycle from node 1
    traceEulerianCycle(getAllNodes(ca)[0], ca);
}
/**
 * Find an Eulerian cycle/trail in an Eulerian/semi-Eulerian graph, by Hierholzer's algorithm
 * @public
 * @function
 * the starting node
 * @param {object} start
 * the cytoscape object
 * @param {object} c
 * @return void
 * */
function traceEulerianCycle(start, c) {
    // establish a linked list and add first node into it
    let currentNode = start;
    let path = new LinkedList();
    path.add(currentNode);

    // get the unselected edges which are connected to this node
    let connectedEdges = currentNode.connectedEdges(':unselected');
    let nextJourney = undefined;
    while (true) {

        // if there are unvisited edges connecting to this node
        while (connectedEdges.length > 0) {

            // select the first one
            let edge = connectedEdges[0];
            edge.select();
            path.add(edge);

            // select its source node (equivalently, the last target node)
            currentNode.select();
            currentNode = getCaTarget(currentNode, edge);

            // get the unselected edges which are connected to the target node
            connectedEdges = currentNode.connectedEdges(':unselected');
            path.add(currentNode);
        }

        // if the above while loop breaks, that means we have returned to the starting point
        // Note: the conditions of an Eulerian/semi-Eulerian graph ensure that we will not be stuck

        // select the last node
        currentNode.select();

        // add the next half tour to the linked list
        if (nextJourney !== undefined)
            path.addNode(nextJourney);

        // if there are still edges which remain unselected
        if (c.edges(':unselected').length !== 0) {

            // find the node which still have unselected edges connected to it
            let node = path.search((element) => {
                if (element.isNode()) {
                    if (element.connectedEdges(':unselected').length > 0)
                        return true;
                }
            });

            // break the journey (note: the next half of the journey journey will be added back later)
            nextJourney = node.next;
            currentNode = node.cargo;
            node.next = null;

            // start a new tour from this break point
            connectedEdges = currentNode.connectedEdges(':unselected');
        }

        // if all edges are visited, exit the loop
        else
            break;
    }
    c.elements().unselect();
    path.traverse(animation.checked, true);
}
/**
 * the factorial function
 * @public
 * @function
 * @param {int} n
 * @return {int}
 * */
function f(n) {
    return (n <= 1) ? 1 : n * f(n - 1);
}
/**
 * @function
 * @public
 * @return void
 * */
function minimalWeightMatching() {
    stopAnimation();
    clearCyStyle();
    cy.elements(":grabbable").unselect();

    // precondition: the graph is connected
    if (!isConnected())
        return alert("Graph not connected!");

    let len = getAllNodes(cy).length;
    if (len > 14)
        if (!confirm("Warning! This graph has " + len + " nodes, at most " + (f(len) / (f(len / 2) * Math.pow(2, len / 2))) + " iterations are needed and it might take a long time！"))
            return;
    clearResult();
    /**
     * @function
     * @private
     * @param {Array} minPairing
     * @return void
     * */
    function displayPairings(minPairing) {
        /**
         * @function
         * @private
         * @param {object} node1
         * @param {object} node2
         * @return {object}
         * */
        function getCyEdge(node1, node2) {
            let e = cy.$id(node1.data('id') + '-' + node2.data('id') + '-0');
            return e.length === 0 ? cy.$id(node2.data('id') + '-' + node1.data('id') + '-0') : e;
        }

        let nodes = getAllNodes(cy);
        for (let i = 0; i < minPairing.length; i += 2) {
            let n1 = nodes[minPairing[i]];
            if (minPairing[i + 1] === undefined)
                break;
            let n2 = nodes[minPairing[i + 1]];
            let e = getCyEdge(n1, n2);
            ca.add(n1);
            ca.add(n2);
            ca.add(e);
            n1.select();
            n2.select();
            e.select();
        }
        caReLayout();
    }

    let weightMatrix = getWM(cy, false);
    minimalWeightMatchingMultiThread(weightMatrix, 4, displayPairings);
}
/**
 * @param {Array} weightMatrix
 * @param {int} numOfThreads
 * @param {function} callback
 * The callback function to be executed after completion of all threads
 * @return void
 * */
function minimalWeightMatchingMultiThread(weightMatrix, numOfThreads, callback) {
    // generator is used to merge the results from each worker
    function*join() {
        while (true) {
            yield null;
            let flag = workerFlags[0];
            for (let i = 1; i < numOfThreads; i++)
                flag = flag && workerFlags[i];
            if (flag === true)
                break;
        }
        let minWeight = Infinity;
        let minPairing = [];
        for (let i = 0; i < numOfThreads; i++)
            if (minWeights[i] < minWeight) {
                minWeight = minWeights[i];
                minPairing = minPairings[i];
            }
        perform_button.disabled = false;
        callback(minPairing);
    }

    let joiner = join();
    let workerFlags = new Array(numOfThreads);
    let minWeights = new Array(numOfThreads);
    let minPairings = new Array(numOfThreads);
    let portion = Math.floor(weightMatrix.length / numOfThreads);
    let eles = _.range(0, weightMatrix.length);
    perform_button.disabled = true;

    // distribute the workload to a number of independent threads
    for (let i = 0; i < numOfThreads; i++) {
        workerFlags[i] = false;
        minWeights[i] = Infinity;
        const x = i;
        const worker = new Worker("js/MWMMT.min.js");
        worker.onmessage = (message) => {
            console.log(x + " is ready");
            minWeights[x] = message.data.minWeight;
            minPairings[x] = message.data.minPairing;
            workerFlags[x] = true;
            joiner.next();
            worker.terminate();
        };
        if (i === numOfThreads - 1)
            worker.postMessage({
                weightMatrix: weightMatrix,
                eles: eles,
                start: x * portion,
                end: weightMatrix.length
            });
        else
            worker.postMessage({
                weightMatrix: weightMatrix,
                eles: eles,
                start: x * portion,
                end: (x + 1) * portion
            });
        worker.onerror = (err) => {
            console.log(err.message);
        };
    }
}

/**
 * solve the Chinese postman problem
 * @function
 * @public
 * @return void
 * */
function CPP() {
    stopAnimation();
    clearCyStyle();
    cy.elements(":grabbable").unselect();

    // get the collection of odd nodes
    getAllNodes(cy).forEach((ele) => {
        if (ele.degree() % 2 !== 0)
            ele.select();
    });
    let nodes = cy.nodes(":selected");
    let n = nodes.length;
    if (n > 14)
        if (!confirm("Warning! This graph has " + n + " nodes of odd degree, at most " + (f(n) / (f(n / 2) * Math.pow(2, n / 2))) + " iterations are needed and it might take a long time！"))
            return;

    // get the weight matrix of these nodes (the subgraph consisting only the nodes of odd degree)
    let weightMatrix = new Array(n);
    let paths = new Array(n);
    for (let x = 0; x < n; x++) {
        paths[x] = cy.elements(":grabbable").dijkstra(nodes[x], getWeight);
        weightMatrix[x] = new Array(n);
        for (let y = x + 1; y < n; y++)
            weightMatrix[x][y] = paths[x].distanceTo(nodes[y]);
    }

    // get the minimal weight perfect matching
    minimalWeightMatchingMultiThread(weightMatrix, 4, displayResult);

    // the callback function used to show the result on the result canvas
    function displayResult(minPairing) {
        clearResult();
        ca.add(cy.elements(":grabbable"));
        let addedEdges = undefined;

        // Once the minimal weight perfect matching is found,
        // duplicated these edges, so the graph becomes Eulerian
        for (let x = 0; x < minPairing.length; x += 2) {
            paths[minPairing[x]].pathTo(nodes[minPairing[x + 1]]).forEach((ele) => {
                if (ele.isEdge()) {
                    ele.select();
                    let duplicatedEdge = duplicateEdge(ele, ca);
                    if (addedEdges === undefined)
                        addedEdges = duplicatedEdge;
                    else
                        addedEdges = addedEdges.union(duplicatedEdge);
                }
            });
        }
        caReLayout();
        ca.elements(":grabbable").unselect();

        // Eulerian Cycle. See function traceEulerianCycle
        // starting the Eulerian Cycle from the first node
        traceEulerianCycle(getAllNodes(ca)[0], ca);
    }

}
/**
 * find the maximal lower bound for TSP by performing the vertex deletion algorithm on every node
 * @function
 * @public
 * @return void
 * */
function TSPGlobalLowerBound() {
    stopAnimation();
    let root = getCyStartNode("Please enter id of the starting node.\nIf you want apply this algorithm too all nodes and get the highest lower bound, leave it blank", "");
    let results;
    clearCyStyle();
    cy.elements(":grabbable").unselect();
    if (root === undefined) {
        let maxWeight = 0;
        let maxResults, maxRoot, sumWeight;
        getAllNodes(cy).forEach((currentNode) => {

            // Find the maximal lower bound...
            results = TSPLowerBound(currentNode);
            sumWeight = results[0];
            if (sumWeight > maxWeight) {

                // record the weight, results, and the node deleted
                maxWeight = sumWeight;
                maxResults = results;
                maxRoot = currentNode;
            }
        });
        clearResult();

        // select the node, the two deleted edges, and the minimal spanning tree
        maxResults[3].nodes().style({backgroundColor: '#eba300'});
        maxResults[3].edges().style({lineColor: '#eba300'});
        maxResults[2].select();
        maxResults[1].select();

        //Order must be correct...
        ca.add(maxResults[3]);
        ca.elements(":grabbable").select();
        ca.add(maxRoot);
        ca.add(maxResults[2]);
        ca.add(maxResults[1]);
        caReLayout();
    }

    // the lower bound at a given starting node
    else {
        results = TSPLowerBound(root);
        clearResult();
        results[3].nodes().style({backgroundColor: '#eba300'});
        results[3].edges().style({lineColor: '#eba300'});
        results[2].select();
        results[1].select();
        ca.add(results[3]);
        ca.elements(":grabbable").select();
        ca.add(root);
        ca.add(results[2]);
        ca.add(results[1]);
        caReLayout();
    }
}
/**
 * Get the lower bound for the travelling salesman problem by vertex deletion algorithm
 * @function
 * @public
 * @param {object} root
 * @return {Array}
 * */
function TSPLowerBound(root) {
    cy.startBatch();
    // starting from a given node
    // find two connected edges of minimal weight, record the sum of their weight
    let edges = root.connectedEdges().sort((e1, e2) => {
        return getWeight(e1) - getWeight(e2);
    });
    let weight = getWeight(edges[0]) + getWeight(edges[1]);

    // remove this node and all its adjacent edges
    cy.remove(root);

    // find the minimal spanning tree of the remaining graph by kruskal
    let spanningTree = cy.elements(":grabbable").kruskal(getWeight);

    // calculate the total weight of this tree
    spanningTree.edges().forEach((edge) => {
        weight += getWeight(edge);
    });

    // add back the removed stuffs
    cy.add(root);
    cy.add(edges);
    cy.endBatch();
    return [weight, edges[0], edges[1], spanningTree];
}
/**
 * generate graphml from the graph
 * @function
 * @public
 * @param {Object} c
 * @return void
 * */
function getGraphML(c) {
    matrix_input.value = c.graphml();
}

/**
 * convert the graphml to cytoscape graphs
 * it's not working very well and is therefore temporarily disabled
 * @function
 * @public
 * @return void
 * */
function readGraphML() {
    clearSource();
    cy.graphml(matrix_input.value);
    cyReLayout();
}