/* global _, addEdge, addEdgeBetweenSelected, addEdgeBwt, addNode, addOneNode, animation_check, animationFlag: true, auto_refresh, ca, CaLayout, callToAlgorithms, caReLayout, changeLayout, clearCaStyle, clearCyStyle, clearResult, clearSource, copiedEles, copy, cy, CyLayout, cyReLayout, drawOn, duplicateEdge, duration, getAM, getAllNodes, getCaTarget, getCyStartNode, getTarget, getWeight, getWM, hideDuration, hideResult, hideWeight, initCircularMenu, initConventionalMenu, initializeCytoscapeObjects, layoutName, LinkedList, LinkedListNode, math, matrixToString, paste, readAM, readWM, reLayout, removeEdge, removeNode, removeSelected, perform_button, selectAllOfTheSameType, snapToGrid, stopAnimation */

'use strict';

const processDiv = document.getElementById('process');

hideResult(document.getElementById('hide_result'));
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
        for (let j = 0; j < numOfNodes; j++)
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
        for (let j = 0; j < numOfNodes; j++)
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
                for (let j = 0; j < numOfNodes; j++) {
                    if (i !== j) {
                        if (Math.random() < pConnected)
                            matrix[i][j] = Math.floor(Math.random() * range + lower);
                        else matrix[i][j] = 0;
                    }
                }
            createFromWM(matrix);
        } else {
            for (let i = 0; i < numOfNodes; i++)
                for (let j = 0; j < numOfNodes; j++) {
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
            for (let j = 0; j < numOfNodes; j++) {
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
            for (let j = 0; j < numOfNodes; j++)
                if (i !== j) matrix[i][j] = parseInt(Math.random() * range + lower);
        }
        createFromWM(matrix);
    } else {
        // fill in the half above the major diagonal (exclude major diagonal) with 1
        for (let i = 0; i < numOfNodes; i++) {
            matrix[i] = new Array(numOfNodes);
            for (let j = 0; j < numOfNodes; j++) if (i !== j) matrix[i][j] = 1;
        }
        createFromAM(matrix);
    }
}

// /**
//  * generate a complete bipartile graph by first generating its adjacency matrix
//  * @function
//  * @public
//  * @return {void}
//  * */
// function Kn_n() {
//     stopAnimation();
//     let n = prompt("Please enter n,n.\nExample: 3,3 represents K3,3", "3,3");
//     n = n.split(',');
//     let n1 = parseInt(n[0]);
//     let n2 = parseInt(n[1]);
//     let numOfNodes = n1 + n2;
//     let matrix = new Array(numOfNodes);
//     for (let i = 0; i < numOfNodes; i++)
//         matrix[i] = new Array(numOfNodes);

//     let weightRange = prompt("Please specify the weight range.\nLeave this blank if you want an unweighted graph.\nExample: 1-5 represents range from 1 to 5.\nLower limit must be greater than 0.", "");
//     if (weightRange.length > 0) {
//         let temp = weightRange.split('-');
//         let lower = parseInt(temp[0]) > 0 ? parseInt(temp[0]) : 1;

//         // upper bound must be greater than the lower bound...
//         let range = parseInt(temp[1]) > lower ? parseInt(temp[1]) : lower + 4;

//         // I think you can understand this
//         for (let i = 0; i < n1; i++)
//             for (let j = n1; j < numOfNodes; j++)
//                 matrix[i][j] = parseInt(Math.random() * range + lower);
//         createFromWM(matrix);
//     }
//     else {
//         for (let i = 0; i < n1; i++)
//             for (let j = n1; j < numOfNodes; j++)
//                 matrix[i][j] = 1;
//         createFromAM(matrix);
//     }
// }

/**
 * @public
 * @function
 * @param {string} prompt_text
 * @param {string} default_value
 * @return {cytoscape.NodeSingular|undefined} The first node (selected or entered)
 * */
function getCyStartNode(prompt_text, default_value) {
    let root = cy.nodes(':selected');
    if (root.length <= 0) {
        root = cy.$id(prompt(prompt_text, default_value));
        if (root.length <= 0) return undefined;
    } else root = root[0];
    return root;
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
    const { path } = cy.elements(':grabbable').bfs({
        root,
        directed: true
    });
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
    const { path } = cy.elements(':grabbable').dfs({
        root,
        directed: true
    });
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
            .dijkstra({
                root: nodes[0],
                weight: getWeight,
                directed: true
            })
            .pathTo(nodes[1]);
    } else {
        const p = prompt(
            'Please enter the id of source and target nodes, src-tg.\nExample: 1-2',
            ''
        );
        const pt = p.split('-');
        path = cy
            .elements(':grabbable')
            .dijkstra(`#${pt[0]}`, getWeight, true)
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
 * convert a RGB array to a hexadecimal string
 * @public
 * @function
 * @param {[number, number, number]} color
 * @return {string}
 * */
function colorRGB2Hex(color) {
    const r = color[0];
    const g = color[1];
    const b = color[2];
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Jet colormap from Matlab
 * */
const jetMap = [
    [0, 0, 143],
    [0, 0, 159],
    [0, 0, 175],
    [0, 0, 191],
    [0, 0, 207],
    [0, 0, 223],
    [0, 0, 239],
    [0, 0, 255],
    [0, 16, 255],
    [0, 32, 255],
    [0, 48, 255],
    [0, 64, 255],
    [0, 80, 255],
    [0, 96, 255],
    [0, 112, 255],
    [0, 128, 255],
    [0, 143, 255],
    [0, 159, 255],
    [0, 175, 255],
    [0, 191, 255],
    [0, 207, 255],
    [0, 223, 255],
    [0, 239, 255],
    [0, 255, 255],
    [16, 255, 239],
    [32, 255, 223],
    [48, 255, 207],
    [64, 255, 191],
    [80, 255, 175],
    [96, 255, 159],
    [112, 255, 143],
    [128, 255, 128],
    [143, 255, 112],
    [159, 255, 96],
    [175, 255, 80],
    [191, 255, 64],
    [207, 255, 48],
    [223, 255, 32],
    [239, 255, 16],
    [255, 255, 0],
    [255, 239, 0],
    [255, 223, 0],
    [255, 207, 0],
    [255, 191, 0],
    [255, 175, 0],
    [255, 159, 0],
    [255, 143, 0],
    [255, 128, 0],
    [255, 112, 0],
    [255, 96, 0],
    [255, 80, 0],
    [255, 64, 0],
    [255, 48, 0],
    [255, 32, 0],
    [255, 16, 0],
    [255, 0, 0],
    [239, 0, 0],
    [223, 0, 0],
    [207, 0, 0],
    [191, 0, 0],
    [175, 0, 0],
    [159, 0, 0],
    [143, 0, 0],
    [128, 0, 0]
];
const jetMapHex = [
    '#00008f',
    '#00009f',
    '#0000af',
    '#0000bf',
    '#0000cf',
    '#0000df',
    '#0000ef',
    '#0000ff',
    '#0010ff',
    '#0020ff',
    '#0030ff',
    '#0040ff',
    '#0050ff',
    '#0060ff',
    '#0070ff',
    '#0080ff',
    '#008fff',
    '#009fff',
    '#00afff',
    '#00bfff',
    '#00cfff',
    '#00dfff',
    '#00efff',
    '#00ffff',
    '#10ffef',
    '#20ffdf',
    '#30ffcf',
    '#40ffbf',
    '#50ffaf',
    '#60ff9f',
    '#70ff8f',
    '#80ff80',
    '#8fff70',
    '#9fff60',
    '#afff50',
    '#bfff40',
    '#cfff30',
    '#dfff20',
    '#efff10',
    '#ffff00',
    '#ffef00',
    '#ffdf00',
    '#ffcf00',
    '#ffbf00',
    '#ffaf00',
    '#ff9f00',
    '#ff8f00',
    '#ff8000',
    '#ff7000',
    '#ff6000',
    '#ff5000',
    '#ff4000',
    '#ff3000',
    '#ff2000',
    '#ff1000',
    '#ff0000',
    '#ef0000',
    '#df0000',
    '#cf0000',
    '#bf0000',
    '#af0000',
    '#9f0000',
    '#8f0000',
    '#800000'
];

/**
 * perform page rank
 * @public
 * @function
 * @return {void}
 * */
function pageRank() {
    const len = cy.nodes().length;
    const basicSize = 250;
    const delSize = 15;
    const rank = cy.elements(':grabbable').pageRank({
        dampingFactor: 0.85,
        precision: 1e-4
    });
    const ranks = new Array(cy.nodes().length);
    cy.nodes().forEach(n => {
        ranks.push(rank.rank(n));
    });
    const min = _.min(ranks);
    const max = _.max(ranks);
    const rg = max - min;
    cy.nodes().forEach(n => {
        const r = rank.rank(n);
        const size = Math.round((basicSize + delSize * len) * r);
        n.animate({
            style: {
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: jetMapHex[Math.floor(((r - min) / rg) * 63)]
            },
            duration: 1000
        });
        n.style({
            fontSize: `${13 + Math.floor(size ** 0.33)}px`,
            label: node => `${node.data('id')}\n${(r * 100).toFixed(2)}%`,
            textWrap: 'wrap',
            textValign: 'top'
        });
    });
}

/**
 * perform detailed page rank
 * @public
 * @function
 * @return {void}
 * */
function myPageRank() {
    // damping factor d
    const dpFactor = 0.85;
    // minimal difference ε
    const minimalDifference = 1e-4;
    const nodes = getAllNodes(cy);
    const len = nodes.length;
    /**
     * @type {Array<number>}
     */
    const outEdgeStats = new Array(len);
    const [adjacencyMatrix] = getAM(cy, false, true);
    /**
     * @type {number} basic size of nodes in pixels
     * */
    const basicSize = 250;
    const delSize = 15;

    // (1 - d) / N
    const tailNumber = (1 - dpFactor) / len;
    const animationDuration = Math.round(+duration.value);
    const normalizeInMiddle = true;

    /**
     * @type {number} no-animation calculation method
     * 1 -> iterative
     * 2 -> matrix-iterative
     * 3 -> algebraic
     * */
    const NACM = 2;
    animationFlag = true;

    nodes.forEach((n, i) => {
        outEdgeStats[i] = n.outgoers('edge').length;
    });

    /**
     * initial rankings
     * @type {Array<number>}
     */
    let ranks = new Array(len);
    for (let i = 0; i < len; i++) ranks[i] = 1 / len;

    /**
     * find the maximum and minimum anomg the vector of ranks
     * @param {Array<number>} rks
     * @return {Array<number>}
     * */
    function findMinAndMax(rks) {
        let min = Infinity;
        let max = 0;
        for (let i = 0; i < len; i++) {
            if (ranks[i] < min) min = rks[i];
            if (ranks[i] > max) max = rks[i];
        }
        return [min, max];
    }

    /**
     * @param {number} size
     * @param {string} color
     * @return {Object}
     * */
    function getAnimationStyle(size, color) {
        return {
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color
        };
    }

    /**
     * @param {number} size
     * @param {number} rank
     * @return {Object}
     * */
    function getLabelStyle(size, rank) {
        const fs = 13 + Math.floor(size ** 0.33);
        // let s = Math.ceil(size * 0.5 / fs);
        // let wp = '\n';
        // for (let i = 0; i < s; i++)
        //     wp += '\n';
        // return {
        //     fontSize: fs + 'px',
        //     label: (n) => {
        //         return (rank * 100).toFixed(2) + '%' + wp + n.data('id')
        //     },
        //     textWrap: 'wrap',
        //     textValign: 'center',
        //     textMarginY: -(s - 1) * fs
        // };
        return {
            fontSize: `${fs}px`,
            label: n => `${n.data('id')}\n${(rank * 100).toFixed(2)}%`,
            textWrap: 'wrap',
            textValign: 'top'
        };
    }

    /**
     * @param {Array<number>} ranks
     * @param {number} duration
     * @param {Function} callback
     * */
    function animateNodes(ranks, duration, callback = () => {}) {
        let [min, max] = findMinAndMax(ranks);
        min -= 0.00001;
        const range = max - min;
        nodes.forEach((n, i) => {
            const r = ranks[i];
            const size = Math.round((basicSize + delSize * len) * r);
            n.animate({
                style: getAnimationStyle(size, jetMapHex[Math.floor(((r - min) / range) * 63)]),
                duration,
                complete: callback
            });
            n.style(getLabelStyle(size, r));
        });
    }

    /**
     * @param {Array<number>} v
     * @return {Array<number>}
     * */
    function normalize(v) {
        const sum = math.sum(v);
        return v.map(val => val / sum);
    }

    /**
     * @param {number} i index of current node
     * @param {Array<number>} cRanks current PR
     * @param {Array<number>} pRanks previous PR
     * @param {number} t iteration index
     * */
    function call(t, i, cRanks, pRanks) {
        cy.edges().removeStyle();
        cy.edges()
            .hide()
            .show();
        processDiv.innerHTML = `Iteration ${t}, Calculating PR for node ${i + 1}`;
        let del = 0;
        let edges;
        for (let j = 0; j < len; j++) {
            if (i !== j) {
                // if outbounds from node j to i exist
                if (adjacencyMatrix[j][i] > 0) {
                    // calculate the transferred page rank
                    // += PR(j) / L(p_j)
                    const tpr = (pRanks[j] * adjacencyMatrix[j][i]) / outEdgeStats[j];
                    del += tpr;

                    // get the outbound edge of node j (pointing to node i)
                    const es = cy.$(`[id^="${nodes[j].data('id')}-${nodes[i].data('id')}-"]`);
                    es.data('tpr', `${(tpr * 100).toFixed(1)}%`);

                    // collect these edges
                    edges = edges === undefined ? es : edges.union(es);
                }
            }
        }
        if (edges !== undefined) {
            // show the transferred weight on the edge
            edges.style({
                textRotation: 'autorotate',
                label: e => e.data('tpr'),
                fontSize: '16px',
                color: '#c20b00',
                fontWeight: 'bold'
            });
            // animate this edge
            edges
                .animate({
                    style: {
                        lineColor: '#00e3ff',
                        width: '6'
                    },
                    duration: Math.round(animationDuration * 0.8)
                })
                .animate({
                    style: {
                        lineColor: '#ccc',
                        width: '2'
                    },
                    duration: Math.round(animationDuration * 0.2)
                });
        }
        if (animationFlag) {
            // calculate the new PR value for node i
            const r = del * dpFactor + tailNumber;
            cRanks[i] = r;

            // find min and max in current rank vector
            let [min, max] = findMinAndMax(cRanks);

            // reduce min a little to avoid division by 0
            min -= 0.0001;

            // calculate the range of PR value for mapping colors
            const rg = max - min;
            const size = Math.round((basicSize + delSize * len) * r);

            // animate this node (show its size increase/decrease)
            setTimeout(() => {
                nodes[i].style(getLabelStyle(size, r));
                nodes[i].animate({
                    style: getAnimationStyle(size, jetMapHex[Math.floor(((r - min) / rg) * 63)]),
                    duration: animationDuration,
                    complete: () => {
                        if (animationFlag) {
                            i += 1;

                            // continue to calculate PR value of next nodes if current iteration not finished
                            if (i < len) {
                                call(t, i, cRanks, pRanks);
                            }
                            // go to next iteration
                            // normalize PR right after each iteration
                            else if (normalizeInMiddle) {
                                processDiv.innerHTML = 'Normalizing PR values...';
                                cy.edges().removeStyle();
                                cRanks = normalize(cRanks);
                                animateNodes(cRanks, animationDuration, () => {
                                    cy.elements(':grabbable').stop();
                                    setTimeout(() => {
                                        // continue to iterate if not converged
                                        if (
                                            math.norm(math.subtract(pRanks, cRanks)) >
                                            minimalDifference
                                        )
                                            call(t + 1, 0, cRanks, cRanks.concat());
                                        else {
                                            processDiv.innerHTML = 'Done!';
                                        }
                                    }, 10);
                                });
                            }
                            // normalize PR values after completion
                            else if (math.norm(math.subtract(pRanks, cRanks)) > minimalDifference)
                                call(t + 1, 0, cRanks, cRanks.concat());
                            else {
                                processDiv.innerHTML = 'Normalizing PR values...';
                                animateNodes(normalize(cRanks), animationDuration, () => {
                                    processDiv.innerHTML = 'Done!';
                                    cy.edges().removeStyle();
                                });
                            }
                        }
                    }
                });
            }, 10);
        }
    }

    if (animation_check.checked) {
        nodes.forEach((n, i) => {
            const r = 1 / len;
            const size = Math.round((basicSize + delSize * len) * r);
            n.style(getLabelStyle(size, r));
            n.animate({
                style: getAnimationStyle(size, colorRGB2Hex([128, 255, 128])),
                duration: animationDuration,
                complete: () => {
                    if (i === len - 1) call(1, 0, ranks, ranks.concat());
                }
            });
        });
    } else {
        /**
         * Iterative implementation
         * */
        if (NACM === 1) {
            let pRanks; // previous ranks
            do {
                pRanks = ranks;
                const newRanks = ranks.concat();
                for (let i = 0; i < len; i++) {
                    let sum = 0;
                    for (let j = 0; j < len; j++)
                        if (i !== j && adjacencyMatrix[j][i] > 0)
                            sum += (ranks[j] * adjacencyMatrix[j][i]) / outEdgeStats[j];
                    newRanks[i] = sum * dpFactor + tailNumber;
                }
                if (normalizeInMiddle) ranks = normalize(newRanks);
                else ranks = newRanks;
            } while (math.norm(math.subtract(ranks, pRanks)) > minimalDifference);
            if (!normalizeInMiddle) ranks = normalize(ranks);
        } else if (NACM === 2) {
            /**
             * Matrix implementation
             * */
            let rankVector = math.multiply(math.ones(len), 1 / len);
            let outMatrix = math.zeros(len, len);
            for (let i = 0; i < len; i++)
                for (let j = 0; j < len; j++)
                    if (adjacencyMatrix[i][j] > 0)
                        outMatrix = math.subset(outMatrix, math.index(i, j), 1 / outEdgeStats[i]);
            let pRankVector;
            do {
                pRankVector = math.clone(rankVector);
                rankVector = math.add(
                    math.multiply(math.multiply(rankVector, outMatrix), dpFactor),
                    tailNumber
                );
            } while (math.norm(math.subtract(rankVector, pRankVector)) > minimalDifference);
            ranks = normalize(rankVector.toArray());
        } else if (NACM === 3) {
            /**
             * Algebraic implementation
             * This one does not yield correct result
             * */
            let outMatrix = math.zeros(len, len);
            for (let i = 0; i < len; i++)
                for (let j = 0; j < len; j++)
                    if (adjacencyMatrix[i][j] > 0)
                        outMatrix = math.subset(outMatrix, math.index(i, j), 1 / outEdgeStats[i]);
            // let K = math.diag(math.matrix(outEdgeStats));
            // let outMatrix = math.transpose(math.multiply(math.inv(K), math.matrix(adjacencyMatrix)));
            // console.log(outMatrix);
            ranks = normalize(
                math
                    .multiply(
                        math.inv(
                            math.subtract(math.eye(len, len), math.multiply(dpFactor, outMatrix))
                        ),
                        math.multiply(math.ones(len), tailNumber)
                    )
                    .toArray()
            );
        }
        animateNodes(ranks, 1000);
    }
}
