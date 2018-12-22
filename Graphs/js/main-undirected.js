/* global _, addEdge, addEdgeBetweenSelected, addEdgeBwt, addNode, addOneNode, animation_check, animationFlag: true, auto_refresh, ca, CaLayout, callToAlgorithms, caReLayout, changeLayout, clearCaStyle, clearCyStyle, clearResult, clearSource, copiedEles, copy, cy, CyLayout, cyReLayout, drawOn, duplicateEdge, duration, getAM, getAllNodes, getCaTarget, getCyStartNode, getTarget, getWeight, getWM, hideDuration, hideResult, hideWeight, initCircularMenu, initConventionalMenu, initializeCytoscapeObjects, layoutName, LinkedList, LinkedListNode, math, matrixToString, paste, readAM, readWM, reLayout, removeEdge, removeNode, removeSelected, perform_button, selectAllOfTheSameType, snapToGrid, stopAnimation, maxWeightMatching */

'use strict';

/**
 * the factorial function
 * @public
 * @function
 * @param {number} n
 * @return {number}
 * */
function f(n) {
    return n <= 1 ? 1 : n * f(n - 1);
}
/**
 * check whether the graph is connected by performing breadth first search
 * @function
 * @public
 * @return {boolean}
 * */
function isConnected() {
    const { path } = cy.elements(':grabbable').bfs(getAllNodes(cy)[0]);
    return path.nodes().length === cy.nodes(':grabbable').length;
}
/**
 * create graph from an adjacency matrix
 * @function
 * @public
 * @param {Array<Array<number>>} m
 * The adjacency matrix
 * @return {void}
 * */
function createFromAM(m) {
    stopAnimation();

    // this must be a square matrix...
    if (m.length !== m[0].length) return;

    clearSource();
    const numOfNodes = m.length;
    cy.startBatch();
    // add all nodes
    for (let i = 1; i <= numOfNodes; i++)
        cy.add({
            group: 'nodes',
            data: {
                id: i
            },
            position: {
                x: Math.random() * 300 + 25,
                y: Math.random() * 300 + 25
            }
        });

    for (let i = 0; i < numOfNodes; i++)
        for (let j = i; j < numOfNodes; j++)
            // add the correct number of edges connecting this two nodes
            for (let x = 0; x < m[i][j]; x++)
                cy.add({
                    group: 'edges',
                    data: {
                        id: `${i + 1}-${j + 1}-${x}`,
                        source: i + 1,
                        target: j + 1
                    }
                });
    cy.endBatch();
    cyReLayout();
}
/**
 * create the graph from a weight matrix
 * @function
 * @public
 * @param {Array<Array<number>>} m
 * The weight matrix
 * @return {void}
 * */
function createFromWM(m) {
    stopAnimation();
    if (m.length !== m[0].length) return;
    clearSource();
    const numOfNodes = m.length;
    cy.startBatch();
    for (let i = 1; i <= numOfNodes; i++)
        cy.add({
            group: 'nodes',
            data: {
                id: i
            },
            position: {
                x: Math.random() * 300 + 25,
                y: Math.random() * 300 + 25
            }
        });

    for (let i = 0; i < numOfNodes; i++)
        for (let j = i; j < numOfNodes; j++)
            if (m[i][j] > 0)
                cy.add({
                    group: 'edges',
                    data: {
                        id: `${i + 1}-${j + 1}-0`,
                        source: i + 1,
                        target: j + 1,
                        weight: m[i][j]
                    }
                });
    cy.endBatch();
    cyReLayout();
}
/**
 * generate a random graph
 * @function
 * @public
 * @return {void}
 * */
function generateGraph() {
    stopAnimation();
    clearCyStyle();
    const simple = document.getElementById('simple').checked;
    const weighted = document.getElementById('weighted').checked;
    const numOfNodes = parseInt(prompt('Please enter the number of nodes', '6'));
    const matrix = new Array(numOfNodes);
    for (let i = 0; i < matrix.length; i++) matrix[i] = new Array(numOfNodes);
    if (simple) {
        const pConnected = parseFloat(
            prompt(
                'Please specify the propability that two nodes are connected.\nRange: 0 to 1',
                '0.5'
            )
        );
        if (weighted) {
            const weightRange = prompt(
                'Please specify the weight range.\nExample: 1-5 represents range from 1 to 5.\n Lower limit must be greater than 0.',
                '1-4'
            );
            const temp = weightRange.split('-');
            const lower = parseInt(temp[0]) > 0 ? parseInt(temp[0]) : 1;
            const range = parseInt(temp[1]) >= lower ? parseInt(temp[1]) - lower + 1 : lower + 4;
            for (let i = 0; i < numOfNodes; i++)
                for (let j = i + 1; j < numOfNodes; j++) {
                    if (Math.random() < pConnected)
                        matrix[i][j] = Math.floor(Math.random() * range + lower);
                    else matrix[i][j] = 0;
                }
            createFromWM(matrix);
        } else {
            for (let i = 0; i < numOfNodes; i++)
                for (let j = i + 1; j < numOfNodes; j++) {
                    if (Math.random() < pConnected) matrix[i][j] = 1;
                    else matrix[i][j] = 0;
                }
            createFromAM(matrix);
        }
    } else {
        const nMultiple = parseInt(
            prompt(
                'Please specify the max number of edges connecting two nodes.\nRange: 2 to infinity',
                '2'
            )
        );
        const pMultiple = parseFloat(
            prompt('Please specify the the probability of having multiple edges', '0.25')
        );
        for (let i = 0; i < numOfNodes; i++) {
            for (let j = i; j < numOfNodes; j++) {
                if (i === j) {
                    if (Math.random() < pMultiple / 2)
                        matrix[i][j] = Math.floor((Math.random() * nMultiple + 1) / 2);
                } else if (Math.random() < pMultiple)
                    matrix[i][j] = Math.floor(Math.random() * nMultiple + 1);
                else if (Math.random() > 1 / nMultiple) matrix[i][j] = 1;
                else matrix[i][j] = 0;
            }
        }
        createFromAM(matrix);
    }
}
/**
 * Generate a complete graph of n vertices by first generating its corresponding adjacency matrix
 * @function
 * @public
 * @return {void}
 * */
function Kn() {
    stopAnimation();
    clearSource();
    const numOfNodes = parseInt(prompt('Please enter the number of vertices', '5'));
    const weightRange = prompt(
        'Please specify the weight range.\nLeave this blank if you want an unweighted graph.\nExample: 1-5 represents range from 1 to 5.\nLower limit must be greater than 0.',
        ''
    );
    const matrix = new Array(numOfNodes);
    if (weightRange.length > 0) {
        const temp = weightRange.split('-');
        const lower = parseInt(temp[0]) > 0 ? parseInt(temp[0]) : 1;
        const range = parseInt(temp[1]) > lower ? parseInt(temp[1]) - lower + 1 : lower + 4;

        // fill in the half above the major diagonal (exclude major diagonal) with random weights in the give range
        for (let i = 0; i < numOfNodes; i++) {
            matrix[i] = new Array(numOfNodes);
            for (let j = i + 1; j < numOfNodes; j++)
                matrix[i][j] = parseInt(Math.random() * range + lower);
        }
        createFromWM(matrix);
    } else {
        // fill in the half above the major diagonal (exclude major diagonal) with 1
        for (let i = 0; i < numOfNodes; i++) {
            matrix[i] = new Array(numOfNodes);
            for (let j = i + 1; j < numOfNodes; j++) matrix[i][j] = 1;
        }
        createFromAM(matrix);
    }
}

/**
 * generate a complete bipartile graph by first generating its adjacency matrix
 * @function
 * @public
 * @return {void}
 * */
function Kn_n() {
    stopAnimation();
    let n = prompt('Please enter n,n.\nExample: 3,3 represents K3,3', '3,3');
    n = n.split(',');
    const n1 = parseInt(n[0]);
    const n2 = parseInt(n[1]);
    const numOfNodes = n1 + n2;
    const matrix = new Array(numOfNodes);
    for (let i = 0; i < numOfNodes; i++) matrix[i] = new Array(numOfNodes);

    const weightRange = prompt(
        'Please specify the weight range.\nLeave this blank if you want an unweighted graph.\nExample: 1-5 represents range from 1 to 5.\nLower limit must be greater than 0.',
        ''
    );
    if (weightRange.length > 0) {
        const temp = weightRange.split('-');
        const lower = parseInt(temp[0]) > 0 ? parseInt(temp[0]) : 1;

        // upper bound must be greater than the lower bound...
        const range = parseInt(temp[1]) > lower ? parseInt(temp[1]) : lower + 4;

        // I think you can understand this
        for (let i = 0; i < n1; i++)
            for (let j = n1; j < numOfNodes; j++)
                matrix[i][j] = parseInt(Math.random() * range + lower);
        createFromWM(matrix);
    } else {
        for (let i = 0; i < n1; i++) for (let j = n1; j < numOfNodes; j++) matrix[i][j] = 1;
        createFromAM(matrix);
    }
}

/**
 * Breadth first search is implemented in the library
 * @function
 * @public
 * @return {void}
 * */
function breadthFirstSearch() {
    stopAnimation();
    const root = getCyStartNode('Please enter the id of the starting node', '1');
    if (root === undefined) return;
    clearCyStyle();
    cy.elements(':grabbable').unselect();
    const { path } = cy.elements(':grabbable').bfs(root);
    clearResult();
    const pathList = new LinkedList();
    path.select();
    ca.add(path);
    path.forEach(ele => {
        pathList.add(ele);
    });
    caReLayout();
    pathList.traverse(animation_check.checked, true);
}
/**
 * DFS implemented in the library
 * @function
 * @public
 * @return {void}
 * */
function depthFirstSearch() {
    stopAnimation();
    const root = getCyStartNode('Please enter the id of the starting node', '1');
    if (root === undefined) return;
    clearCyStyle();
    cy.elements(':grabbable').unselect();
    const { path } = cy.elements(':grabbable').dfs(root);
    clearResult();
    const pathList = new LinkedList();
    path.select();
    ca.add(path);
    path.forEach(ele => {
        pathList.add(ele);
    });
    caReLayout();
    pathList.traverse(animation_check.checked, true);
}
/**
 * Kruskal is implemented in the library
 * @function
 * @public
 * @return {void}
 * */
function performKruskal() {
    stopAnimation();
    clearCyStyle();
    cy.elements(':grabbable').unselect();
    const spanningTree = cy.elements(':grabbable').kruskal(getWeight);
    clearResult();
    ca.add(spanningTree);
    spanningTree.select();
    caReLayout();
    const pathList = new LinkedList();
    spanningTree.forEach(ele => {
        if (ele.isEdge()) {
            pathList.add(ele);
            if (pathList.search(e => e.data('id') === ele.source().data('id')) === null) {
                pathList.add(ele.source());
            }
            if (pathList.search(e => e.data('id') === ele.target().data('id')) === null) {
                pathList.add(ele.target());
            }
        }
    });
    pathList.traverse(animation_check.checked, false);
}
/**
 * Dijkstra is implemented in the library
 * @function
 * @public
 * @return {void}
 * */
function performDijkstra() {
    stopAnimation();
    const nodes = cy.nodes(':selected');
    let path;
    if (nodes.length >= 2) {
        path = cy
            .elements(':grabbable')
            .dijkstra(nodes[0], getWeight)
            .pathTo(nodes[1]);
    } else {
        const p = prompt(
            'Please enter the id of source and target nodes, src-tg.\nExample: 1-2',
            ''
        );
        const pt = p.split('-');
        path = cy
            .elements(':grabbable')
            .dijkstra(`#${pt[0]}`, getWeight)
            .pathTo(`#${pt[1]}`);
    }
    const pathList = new LinkedList();
    path.forEach(ele => {
        pathList.add(ele);
    });
    clearCyStyle();
    clearResult();
    ca.add(path);
    caReLayout();
    path.select();
    pathList.traverse(animation_check.checked, true);
}
/**
 * a detailed implementation of Dijkstra's algorithm, showing every step
 * @function
 * @public
 * @return {void}
 * */
function myDijkstra() {
    if (!isConnected()) {
        alert('This graph is not connected!');
        return;
    }
    let root;
    let target;
    const ns = getAllNodes(cy);
    let temp = cy.nodes(':selected');
    if (temp.length >= 2) {
        [root, target] = [temp[0], temp[1]];
    } else {
        temp = prompt('Please enter the id of source and target nodes, src-tg.\nExample: 1-2', '');
        const p = temp.split('-');
        root = cy.$id(p[0]);
        target = cy.$id(p[1]);
        if (root.length <= 0 || target.length <= 0) return;
    }
    clearCyStyle();

    // set all labels to undefined
    ns.data('temporary', []);
    ns.removeData('permanent');
    ns.removeData('previous');

    // set the label function
    // format: "id|temporary labels|permanent label"
    cy.style()
        .selector('node')
        .style({
            label: n => {
                const temporary = n.data('temporary');
                const l = temporary.length - 1;
                let tempLabels = '';
                if (l > -1) {
                    tempLabels += '|';
                    for (let i = 0; i < l; i++) tempLabels += `${temporary[i]}>`;
                    tempLabels += temporary[l];
                }
                return (
                    n.data('id') +
                    tempLabels +
                    (isNaN(n.data('permanent')) ? '' : `|${n.data('permanent')}`)
                );
            }
        });

    // give the starting node a permanent label
    let currentNode = root;
    currentNode.data('permanent', 0);
    currentNode.data('temporary', [0]);

    /**
     * @function
     * @private
     * @param {cytoscape.NodeSingular} node
     * @callback
     * @param {Function} callback
     * the function to execute after completion of animation
     * @return {void}
     * */
    function animateNode(node, callback) {
        if (node !== undefined && node.length > 0)
            node.animate({
                style: {
                    backgroundColor: '#f185dc',
                    width: '30px',
                    height: '30px'
                },
                duration: Math.round(+duration.value * 0.1),
                queue: true
            }).animate({
                style: {
                    backgroundColor: '#de4400',
                    width: '20px',
                    height: '20px'
                },
                duration: Math.round(+duration.value * 0.4),
                queue: true,
                complete: callback
            });
        else callback();
    }

    /**
     * @function
     * @private
     * @param {cytoscape.EdgeSingular} edge
     * @callback
     * @param {Function} callback
     * the function to execute after completion of animation
     * @return {void}
     * */
    function animateEdge(edge, callback) {
        if (edge !== undefined && edge.length > 0)
            edge.animate({
                style: {
                    lineColor: '#f185dc',
                    width: '6'
                },
                duration: Math.round(+duration.value * 0.2),
                queue: true
            }).animate({
                style: {
                    lineColor: '#de4400',
                    width: '3'
                },
                duration: Math.round(+duration.value * 0.8),
                queue: true,
                complete: callback
            });
        else callback();
    }

    /**
     * @function
     * @private
     * @param {cytoscape.NodeSingular} node
     * @callback
     * @param {Function} callback
     * the function to execute after completion of animation
     * @return {void}
     * */
    function animateLabel(node, callback) {
        if (node !== undefined && node.length > 0)
            node.animate({
                style: {
                    textBackgroundColor: 'yellow',
                    textBackgroundOpacity: 1
                },
                duration: Math.round(+duration.value * 0.4),
                queue: true
            })
                .delay(+duration.value * 0.2)
                .animate({
                    style: {
                        textBackgroundColor: 'yellow',
                        textBackgroundOpacity: 0
                    },
                    duration: Math.round(+duration.value * 0.4),
                    queue: true,
                    complete: callback
                });
        else callback();
    }

    /**
     * @function
     * @private
     * @param {cytoscape.NodeSingular} current
     * @return {void}
     * */
    function traceBack(current) {
        // animate current node
        current
            .animate({
                style: {
                    backgroundColor: '#eae90f',
                    width: '30px',
                    height: '30px'
                },
                duration: Math.round(+duration.value * 0.15),
                queue: true
            })
            .animate({
                style: {
                    backgroundColor: 'green',
                    width: '20px',
                    height: '20px'
                },
                duration: Math.round(+duration.value * 0.6),
                queue: true,
                complete: () => {
                    if (!animationFlag) return;
                    // select the current node
                    current.select();

                    // acquire the previous node
                    let previous = current.data('previous');

                    // if we haven't reached the starting node
                    if (previous !== undefined) {
                        previous = ns.$id(previous);

                        // get the edge connecting these two nodes and animate it
                        const e = previous.edgesWith(current);
                        e.animate({
                            style: {
                                lineColor: '#eae90f',
                                width: '6'
                            },
                            duration: Math.round(+duration.value * 0.2),
                            queue: true
                        }).animate({
                            style: {
                                lineColor: 'green',
                                width: '3'
                            },
                            duration: Math.round(+duration.value * 0.8),
                            queue: true,

                            // when the animation completes:
                            // select the edge and keep tracing backward
                            complete: () => {
                                if (animationFlag) {
                                    e.select();
                                    traceBack(previous);
                                }
                            }
                        });
                    } else {
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
     * @param {cytoscape.NodeSingular} currentNode
     * current node with a permanent label
     * @param {cytoscape.EdgeCollection} edges
     * all edges connect to n
     * @param {number} i
     * the index of the edge that we're up to
     * @return {void}
     * */
    function addNextLabel(currentNode, edges, i) {
        // get the value of the permanent label
        const weight = currentNode.data('permanent');

        // if the index is out of bound, then...
        if (i >= edges.length) {
            // get the minimum among all nodes with temporary labels but without permanent labels
            // the node with this minimal label will be assigned with a permanent label
            let minW = Infinity;
            let nextPermanent;
            ns.forEach(node => {
                const tempLabels = node.data('temporary');
                if (tempLabels.length > 0 && node.data('permanent') === undefined) {
                    if (
                        tempLabels[tempLabels.length - 1] < minW ||
                        (tempLabels[tempLabels.length - 1] === minW &&
                            node.data('id') === target.data('id'))
                    ) {
                        minW = tempLabels[tempLabels.length - 1];
                        nextPermanent = node;
                    }
                }
            });

            // callbacks... and callbacks...
            // animate this node...
            animateNode(nextPermanent, () => {
                if (!animationFlag) return;
                // assign a permanent label to this node
                nextPermanent.data('permanent', minW);
                nextPermanent.style({
                    textBorderOpacity: 1,
                    textBorderWidth: '1px',
                    textBorderStyle: 'dashed',
                    textBorderColor: 'green'
                });

                // connect this node with the previous node with a permanent label
                const edgeBetween = nextPermanent.edgesWith(cy.$id(nextPermanent.data('previous')));

                // animate the edge
                animateEdge(edgeBetween, () => {
                    if (!animationFlag) return;

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
        } else {
            // the current edge
            const edge = edges[i];

            // get the weight of the target node
            const node = getTarget(currentNode, edge);
            const nodeWeight = getWeight(edge) + weight;

            // if the target node is not yet permanently labeled
            if (node.data('permanent') === undefined) {
                // animate this edge
                animateEdge(edge, () => {
                    if (!animationFlag) return;

                    // if the target node doesn't have a temporary label,
                    // or the new weight is lower than the current label
                    // update the label
                    const tempLabels = node.data('temporary').concat();
                    if (tempLabels.length === 0 || tempLabels[tempLabels.length - 1] > nodeWeight) {
                        animateNode(node, () => {
                            if (!animationFlag) return;
                            tempLabels.push(nodeWeight);
                            node.data('temporary', tempLabels);
                            node.data('previous', currentNode.data('id'));
                        });
                        animateLabel(node, () => {
                            if (!animationFlag) return;

                            node.style({
                                backgroundColor: '',
                                width: '',
                                height: ''
                            });
                            edge.removeStyle();

                            // keep labelling...
                            addNextLabel(currentNode, edges, i + 1);
                        });
                    } else {
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

    if (animation_check.checked) {
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
            const edges = currentNode.connectedEdges();
            const weight = currentNode.data('permanent');
            for (let i = 0; i < edges.length; i++) {
                const edge = edges[i];
                const node = getTarget(currentNode, edge);
                const nodeWeight = getWeight(edge) + weight;
                if (node.data('permanent') === undefined) {
                    const tempLabels = node.data('temporary').concat();
                    if (tempLabels.length === 0 || tempLabels[tempLabels.length - 1] > nodeWeight) {
                        tempLabels.push(nodeWeight);
                        node.data('temporary', tempLabels);
                        node.data('previous', currentNode.data('id'));
                    }
                }
            }
            let minW = Infinity;
            let nextPermanent;

            for (let i = 0; i < ns.length; i++) {
                const node = ns[i];
                const tempLabels = node.data('temporary');
                if (tempLabels.length > 0 && node.data('permanent') === undefined) {
                    if (
                        tempLabels[tempLabels.length - 1] < minW ||
                        (tempLabels[tempLabels.length - 1] === minW &&
                            node.data('id') === target.data('id'))
                    ) {
                        minW = tempLabels[tempLabels.length - 1];
                        nextPermanent = node;
                    }
                }
            }

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
 * @return {void}
 * */
function prim() {
    stopAnimation();
    clearCyStyle();
    let root = getCyStartNode('Please enter the id of the starting node', '1');
    if (root === undefined) root = getAllNodes(cy)[0];
    cy.elements(':grabbable').unselect();
    root.select();
    /**
     * @function
     * @private
     * @return object
     * Get the edge of minimal weight connected to the selected nodes
     * */
    const getMinimalEdge = () => {
        const nodes = cy.nodes(':selected');
        let minWeight = Infinity;
        let minEdge;
        for (let i = 0; i < nodes.length; i++) {
            // get all unused edges connected to this node
            const edges = nodes[i].connectedEdges(':unselected');
            for (let j = 0; j < edges.length; j++) {
                // its target node must not be in the tree
                if (!getTarget(nodes[i], edges[j]).selected()) {
                    const w = getWeight(edges[j]);
                    if (w < minWeight) {
                        minWeight = w;
                        minEdge = edges[j];
                    }
                }
            }
        }
        return minEdge;
    };
    const tree = new LinkedList();

    // starting from a given node
    tree.add(root);

    // if there're still nodes that are not in the tree
    while (cy.nodes(':unselected').length > 0) {
        // Get the edge of minimal weight connected to the current tree
        const edge = getMinimalEdge();
        edge.select();

        // add this edge to the tree
        tree.add(edge);

        // add its target node to the tree
        if (edge.target().selected()) {
            edge.source().select();
            tree.add(edge.source());
        } else {
            edge.target().select();
            tree.add(edge.target());
        }
    }
    clearResult();
    ca.add(cy.$(':selected'));
    caReLayout();
    tree.traverse(animation_check.checked, true);
}
/**
 * @function
 * @public
 * @param {cytoscape.NodeSingular} root
 * @return {[number, cytoscape.Collection, cytoscape.EdgeSingular]}
 * */
function localMinimalWeightCycle(root) {
    let minWeight = Infinity;
    let path;
    let lastEdge;

    cy.startBatch();
    // Traverse the edges connected to this root node
    root.connectedEdges().forEach(edge => {
        // Select an edge and get its weight and the node which it connected to
        const current_node = getTarget(root, edge);
        const weight = getWeight(edge);

        // Remove it
        cy.remove(edge);

        // Find the minimal weight connector connecting these two nodes
        // If found, then a cycle is established after adding the edge back
        // Dijkstra method:
        const d = cy.elements(':grabbable').dijkstra(root, getWeight);
        const distance = d.distanceTo(current_node) + weight;

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
 * @return {void}
 * */
function minimalWeightCycle() {
    stopAnimation();
    const root = getCyStartNode(
        'Please enter id of the starting node.\nIf you want apply this algorithm too all nodes and get the best one, leave it blank',
        ''
    );
    clearCyStyle();
    cy.elements(':grabbable').unselect();
    // the global minimal weight cycle
    if (root === undefined) {
        // Find the global minimal weight cycle
        let globalMinWeight = Infinity;
        let globalPath;
        let globalE;

        // Traverse every node, finding the minimal weight cycle starting from each node
        // thus finding the minimal one from these local minimal cycles
        getAllNodes(cy).forEach(startNode => {
            const results = localMinimalWeightCycle(startNode);
            if (results[0] < globalMinWeight) {
                [globalMinWeight, globalPath, globalE] = results;
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
        const results = localMinimalWeightCycle(root);
        clearResult();
        results[1].select();
        results[2].select();
        ca.add(results[1]);
        ca.add(results[2]);
    }
    caReLayout();
}
/**
 * The nearest neighbor algorithm starting from a given node
 * @function
 * @public
 * @param {cytoscape.NodeSingular} root
 * @return {[number, LinkedList]}
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
    const getMinimalEdge = node => {
        let minWeight = Infinity;
        let edge;

        // Traverse all the adjacent edges whose target node is not selected and find the minimal weight one
        node.connectedEdges().forEach(e => {
            // Skip this edge if its target node have been already visited
            if (!getTarget(node, e).selected()) {
                const weight = getWeight(e);
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
    const path = new LinkedList();
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
    const lastEdge = cy
        .edges(`[id ^='${root.data('id')}-${currentNode.data('id')}-']`)
        .union(cy.edges(`[id ^='${currentNode.data('id')}-${root.data('id')}-']`));

    // if it does not exist
    // apply a very high weight to this solution
    // in case other solution might be complete (therefore better than this one)
    if (lastEdge.length === 0) totalWeight += 2 ** 32;
    else {
        lastEdge[0].select();
        path.add(lastEdge[0]);
    }
    path.add(root);
    cy.endBatch();
    // If not all nodes are visited, give this solution a very high weight
    return [totalWeight + (getAllNodes(cy).length - numOfNodes) * 2 ** 32, path];
}
/**
 * The global nearest neighbor algorithm
 * find that of minimal weight by performing the algorithm on every node
 * @function
 * @public
 * @return {void}
 * */
function nearestNeighbor() {
    stopAnimation();
    const root = getCyStartNode(
        'Please enter id of the starting node.\nIf you want apply this algorithm too all nodes and get the best one, leave it blank',
        ''
    );
    clearCyStyle();
    cy.elements(':grabbable').unselect();
    let results;
    if (root === undefined) {
        let minWeight = Infinity;
        let minElements;
        let minPath;
        cy.startBatch();
        getAllNodes(cy).forEach(currentNode => {
            results = nearestNeighborAlgorithm(currentNode);
            const sumWeight = results[0];
            if (sumWeight <= minWeight) {
                minElements = cy.$(':selected');
                minWeight = sumWeight;
                minPath = results[1];
            }
            cy.elements(':grabbable').unselect();
        });
        clearResult();
        ca.add(minElements);
        minElements.select();
        cy.endBatch();
        minPath.traverse(animation_check.checked, true);
    } else {
        results = nearestNeighborAlgorithm(root);
        clearResult();
        ca.add(cy.$(':selected'));
        results[1].traverse(animation_check.checked, true);
    }
    caReLayout();
}
/**
 * Find an Eulerian cycle/trail in an Eulerian/semi-Eulerian graph, by Hierholzer's algorithm
 * @public
 * @function
 * the starting node
 * @param {cytoscape.NodeSingular} start
 * the cytoscape object
 * @param {cytoscape.Core} c
 * @return {void}
 * */
function traceEulerianCycle(start, c) {
    // establish a linked list and add first node into it
    let currentNode = start;
    const path = new LinkedList();
    path.add(currentNode);

    // get the unselected edges which are connected to this node
    let connectedEdges = currentNode.connectedEdges(':unselected');
    let nextJourney;

    /**
     * @param {cytoscape.Singular} ele
     * @return {boolean}
     */
    function hasUnselEdges(ele) {
        return ele.isNode() && ele.connectedEdges(':unselected').length > 0;
    }

    while (true) {
        // if there are unvisited edges connecting to this node
        while (connectedEdges.length > 0) {
            // select the first one
            const edge = connectedEdges[0];
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
        if (nextJourney !== undefined) path.addNode(nextJourney);

        // if there are still edges which remain unselected
        if (c.edges(':unselected').length !== 0) {
            // find the node which still have unselected edges connected to it
            const node = path.search(hasUnselEdges);

            // break the journey (note: the next half of the journey journey will be added back later)
            nextJourney = node.next;
            currentNode = node.cargo;
            node.next = null;

            // start a new tour from this break point
            connectedEdges = currentNode.connectedEdges(':unselected');
        }

        // if all edges are visited, exit the loop
        else break;
    }
    c.elements().unselect();
    path.traverse(animation_check.checked, true);
}

/**
 * @see traceEulerianCycle()
 * @function
 * @public
 * @return {void}
 * */
function eulerianCycle() {
    // first check if this graph is connected
    stopAnimation();
    if (!isConnected()) return alert('This graph is not connected');

    // then check whether there're none or two vertices of odd degree
    let numOfOddDegrees = 0;
    const nodesOfOddDegrees = [];
    getAllNodes(cy).forEach(ele => {
        if (ele.degree() % 2 !== 0) {
            numOfOddDegrees += 1;
            nodesOfOddDegrees.push(ele);
        }
    });

    // stop if the conditions for Eulerian/semi-Eulerian graphs are not satisfied.
    if (numOfOddDegrees !== 0 && numOfOddDegrees !== 2)
        alert('This graph is neither Eulerian nor semi-Eulerian');
    else {
        cy.elements(':grabbable').unselect();
        clearResult();
        ca.add(cy.elements(':grabbable'));
        caReLayout();

        if (numOfOddDegrees === 0) {
            // starting Eulerian Cycle from node 1
            traceEulerianCycle(getAllNodes(ca)[0], ca);
        } else {
            const caNodes = ca.nodes(':grabbable');
            let oddNode;
            for (let i = 0; i < caNodes.length; i++) {
                if (caNodes[i].degree() % 2 !== 0) {
                    oddNode = caNodes[i];
                    break;
                }
            }
            traceEulerianCycle(oddNode, ca);
        }
    }
}
/**
 * @param {Array<Array<number>>} weightMatrix
 * @param {number} numOfThreads
 * @param {Function} callback
 * The callback function to be executed after completion of all threads
 * @return {void}
 * */
function minimalWeightMatchingMultiThread(weightMatrix, numOfThreads, callback) {
    // generator is used to merge the results from each worker
    function* join() {
        while (true) {
            yield null;
            let flag = workerFlags[0];
            for (let i = 1; i < numOfThreads; i++) flag = flag && workerFlags[i];
            if (flag === true) break;
        }
        let minWeight = Infinity;
        let minPairing = [];
        for (let i = 0; i < numOfThreads; i++)
            if (minWeights[i] < minWeight) {
                minWeight = minWeights[i];
                minPairing = minPairings[i];
            }
        document.getElementById('perform').disabled = false;
        callback(minPairing);
    }

    const joiner = join();
    let workerFlags = new Array(numOfThreads);
    let minWeights = new Array(numOfThreads);
    let minPairings = new Array(numOfThreads);
    const portion = Math.floor(weightMatrix.length / numOfThreads);
    const eles = _.range(0, weightMatrix.length);
    document.getElementById('perform').disabled = true;

    // distribute the workload to a number of independent threads
    for (let i = 0; i < numOfThreads; i++) {
        workerFlags[i] = false;
        minWeights[i] = Infinity;
        const x = i;
        const worker = new Worker('js/MWMMT.js');
        worker.onmessage = message => {
            console.log(`${x} is ready`);
            minWeights[x] = message.data.minWeight;
            minPairings[x] = message.data.minPairing;
            workerFlags[x] = true;
            joiner.next();
            worker.terminate();
        };
        if (i === numOfThreads - 1)
            worker.postMessage({
                weightMatrix,
                eles,
                start: x * portion,
                end: weightMatrix.length
            });
        else
            worker.postMessage({
                weightMatrix,
                eles,
                start: x * portion,
                end: (x + 1) * portion
            });
        worker.onerror = err => {
            console.log(err.message);
        };
    }
}
/**
 * @function
 * @public
 * @return {void}
 */
function pathTreeFlower() {
    stopAnimation();
    clearCyStyle();
    cy.elements().unselect();

    let [weightMatrix, id_index] = getWM(cy, false, false);

    const maxCardinality = confirm('Max cardinality?');
    const minWeightMatching = confirm('Minimum weight matching?');

    if (minWeightMatching) {
        let maxWeight = -Infinity;
        for (let i = 0; i < weightMatrix.length; i++) {
            for (let j = 0; j < weightMatrix.length; j++) {
                const wt = weightMatrix[i][j];
                if (wt > maxWeight) maxWeight = wt;
            }
        }
        maxWeight += 1;
        weightMatrix = weightMatrix.map(arr => arr.map(x => (x === 0 ? 0 : maxWeight - x)));
    }

    const pairing = maxWeightMatching(weightMatrix, maxCardinality);

    /**
     * @param {number} idx
     * @return {string}
     */
    function findNodeID(idx) {
        for (const key in id_index) {
            if (id_index[key] == idx) {
                return key;
            }
        }
        return '';
    }

    cy.startBatch();
    for (const [n1, n2] of pairing) {
        const id1 = findNodeID(n1);
        const id2 = findNodeID(n2);
        cy.$id(id1).select();
        cy.$id(id2).select();
        let edge = cy.$id(`${id1}-${id2}-0`);
        if (edge.length === 0) edge = cy.$id(`${id2}-${id1}-0`);
        edge.select();
    }
    cy.endBatch();

    clearResult();
    ca.add(cy.elements(':selected'));
    caReLayout();
}

/**
 * solve the Chinese postman problem
 * @function
 * @public
 * @return {void}
 * */
function CPP() {
    stopAnimation();
    clearCyStyle();
    cy.elements(':grabbable').unselect();

    if (!isConnected()) return alert('This graph is not connected!');

    // get the collection of odd nodes
    getAllNodes(cy).forEach(ele => {
        if (ele.degree() % 2 !== 0) ele.select();
    });
    const nodes = cy.nodes(':selected');
    const n = nodes.length;

    // get the weight matrix of these nodes (the subgraph consisting only the nodes of odd degree)
    /**
     * @type {number[][]}
     */
    let weightMatrix = new Array(n);
    /**
     * @type {Array<cytoscape.SearchDijkstraResult>}
     */
    const paths = new Array(n);
    for (let x = 0; x < n; x++) {
        paths[x] = cy.elements(':grabbable').dijkstra(nodes[x], getWeight);
        weightMatrix[x] = new Array(n);
        for (let y = x + 1; y < n; y++) weightMatrix[x][y] = paths[x].distanceTo(nodes[y]);
    }

    let maxWeight = -Infinity;
    for (let i = 0; i < weightMatrix.length; i++) {
        for (let j = 0; j < weightMatrix.length; j++) {
            const wt = weightMatrix[i][j];
            if (wt > maxWeight) maxWeight = wt;
        }
    }
    maxWeight += 1;
    weightMatrix = weightMatrix.map(arr => arr.map(x => (x === 0 ? 0 : maxWeight - x)));

    /**
     * the callback function used to show the result on the result canvas
     * @param {Array<[number, number]>} minPairing
     */
    function displayResult(minPairing) {
        clearResult();
        ca.add(cy.elements(':grabbable'));
        let addedEdges;

        // Once the minimal weight perfect matching is found,
        // duplicated these edges, so the graph becomes Eulerian
        /**
         * @param {cytoscape.Singular} ele
         */
        function dupEdges(ele) {
            if (ele.isEdge()) {
                ele.select();
                const duplicatedEdge = duplicateEdge(ele, ca);
                if (addedEdges === undefined) addedEdges = duplicatedEdge;
                else addedEdges = addedEdges.union(duplicatedEdge);
            }
        }

        for (const [n1, n2] of minPairing) {
            paths[n1].pathTo(nodes[n2]).forEach(dupEdges);
        }
        caReLayout();
        ca.elements(':grabbable').unselect();

        // Eulerian Cycle. See function traceEulerianCycle
        // starting the Eulerian Cycle from the first node
        traceEulerianCycle(getAllNodes(ca)[0], ca);
    }

    // get the minimal weight perfect matching
    displayResult(maxWeightMatching(weightMatrix, true));
}
/**
 * Get the lower bound for the travelling salesman problem by vertex deletion algorithm
 * @function
 * @public
 * @param {cytoscape.NodeSingular} root
 * @returns {[number, cytoscape.EdgeSingular, cytoscape.EdgeSingular, cytoscape.Collection]}
 * */
function TSPLowerBound(root) {
    cy.startBatch();
    // starting from a given node
    // find two connected edges of minimal weight, record the sum of their weight
    const edges = root.connectedEdges().sort((e1, e2) => getWeight(e1) - getWeight(e2));
    let weight = getWeight(edges[0]) + getWeight(edges[1]);

    // remove this node and all its adjacent edges
    cy.remove(root);

    // find the minimal spanning tree of the remaining graph by kruskal
    const spanningTree = cy.elements(':grabbable').kruskal(getWeight);

    // calculate the total weight of this tree
    spanningTree.edges().forEach(edge => {
        weight += getWeight(edge);
    });

    // add back the removed stuffs
    cy.add(root);
    cy.add(edges);
    cy.endBatch();
    return [weight, edges[0], edges[1], spanningTree];
}
/**
 * find the maximal lower bound for TSP by performing the vertex deletion algorithm on every node
 * @function
 * @public
 * @return {void}
 * */
function TSPGlobalLowerBound() {
    stopAnimation();
    const root = getCyStartNode(
        'Please enter id of the starting node.\nIf you want apply this algorithm too all nodes and get the highest lower bound, leave it blank',
        ''
    );
    let results;
    clearCyStyle();
    cy.elements(':grabbable').unselect();
    if (root === undefined) {
        let maxWeight = 0;
        let maxResults;
        let maxRoot;
        let sumWeight;
        getAllNodes(cy).forEach(currentNode => {
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
        maxResults[3].nodes().style({
            backgroundColor: '#eba300'
        });
        maxResults[3].edges().style({
            lineColor: '#eba300'
        });
        maxResults[2].select();
        maxResults[1].select();

        // Order must be correct...
        ca.add(maxResults[3]);
        ca.elements(':grabbable').select();
        ca.add(maxRoot);
        ca.add(maxResults[2]);
        ca.add(maxResults[1]);
        caReLayout();
    }

    // the lower bound at a given starting node
    else {
        results = TSPLowerBound(root);
        clearResult();
        results[3].nodes().style({
            backgroundColor: '#eba300'
        });
        results[3].edges().style({
            lineColor: '#eba300'
        });
        results[2].select();
        results[1].select();
        ca.add(results[3]);
        ca.elements(':grabbable').select();
        ca.add(root);
        ca.add(results[2]);
        ca.add(results[1]);
        caReLayout();
    }
}
