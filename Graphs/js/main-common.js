/* global cytoscape */

'use strict';

/**
 * @author Hanzhi Zhou (Tom)
 * */

/**
 * Hide the weighted checkbox
 * @param {HTMLInputElement} isSimple
 * @return {void}
 * */
function hideWeight(isSimple) {
    const a = $('#weighted');
    if (isSimple.checked) {
        a.show(500);
        $('#wlabel').show(500);
    } else {
        a.hide(500);
        $('#wlabel').hide(500);
    }
}
/**
 * Hide the animation duration input box
 * @param {HTMLInputElement} cb
 * @return {void}
 */
function hideDuration(cb) {
    const d = $('#label-duration');
    if (cb.checked) d.show(400);
    else d.hide(400);
}
/**
 * Call the corresponding algorithm
 * @return {void}
 * */
function callToAlgorithms() {
    const algo = document.getElementById('algorithms');
    eval(algo.options[algo.selectedIndex].value);
}
/**
 * @param {string} div_name
 * @return {cytoscape.Core}
 * */
function initializeCytoscapeObjects(div_name) {
    const c = cytoscape({
        container: document.getElementById(div_name),
        style: defaultStyle
    });
    c.on('select', event => {
        event.target.style({
            'background-color': 'green',
            'line-color': 'green'
        });
    });
    c.on('unselect', event => {
        event.target.style({
            'background-color': '#666',
            'line-color': '#ccc'
        });
    });
    return c;
}
/**
 * The cytoscape instance of the source
 * @type {cytoscape.Core}
 * */
const cy = initializeCytoscapeObjects('cy');
/**
 * The cytoscape instance of the result
 * @type {cytoscape.Core}
 * */
const ca = initializeCytoscapeObjects('ca');
/**
 * @type {string}
 * */
let layoutName = 'circle';
/**
 * @type {cytoscape.Layouts}
 * */
let CyLayout;
/**
 * @type {cytoscape.Layouts}
 * */
let CaLayout;
/**
 * @type {boolean}
 * */
let animationFlag = true;
/**
 * Copied elements
 * @type {cytoscape.Collection}
 * */
let copiedEles;
/**
 * @type {boolean}
 * */
let drawOn = false;
/**
 * auto_refresh checkbox
 * @type {HTMLInputElement}
 * */
const auto_refresh = document.getElementById('autorefresh');
/**
 * the animation checkbox
 * @type {HTMLInputElement}
 * */
const animation_check = document.getElementById('animation');
/**
 * animation duration
 * @type {HTMLInputElement}
 * */
const duration = document.getElementById('duration');

let edgeHandles;

/**
 * @param {HTMLButtonElement} btn
 */
function enableDrawing(btn) {
    if (drawOn) {
        btn.innerHTML = 'Enable drawing';
        edgeHandles.disable();
    } else {
        btn.innerHTML = 'Disable drawing';
        edgeHandles.enable();
        auto_refresh.checked = false;
    }
    drawOn = !drawOn;
}
/**
 * @param {cytoscape.Core} c
 * @return {cytoscape.NodeCollection}
 */
function getAllNodes(c) {
    return c.nodes();
}
/**
 * Stop animation and set animation flag to false
 * @return {void}
 * */
function stopAnimation() {
    cy.elements().stop();
    ca.elements().stop();
    animationFlag = false;
}
/**
 * restore the default style of cy elements
 * @return {void}
 * */
function clearCyStyle() {
    cy.elements().removeStyle();
    cy.style()
        .resetToDefault()
        .fromJson(defaultStyle)
        .update();
    cy.$(':selected').select();
}
/**
 * @return {void}
 * */
function clearCaStyle() {
    ca.elements().removeStyle();
    ca.style()
        .resetToDefault()
        .fromJson(defaultStyle)
        .update();
    ca.$(':selected').select();
}
/**
 * @param {cytoscape.Collection} eles
 * @return {void}
 * */
function copy(eles) {
    copiedEles = eles;
}
/**
 * @param {cytoscape.Singular} ele
 * @return {void}
 * */
function selectAllOfTheSameType(ele) {
    cy.elements().unselect();
    if (ele.isNode()) getAllNodes(cy).select();
    else if (ele.isEdge()) cy.edges().select();
}
/**
 * @param {boolean} random
 * @param {{x: number, y:number}} position
 * @return {cytoscape.NodeSingular} the added node
 * */
function addOneNode(random, position) {
    let v = 1;
    while (cy.$id(`${v}`).length !== 0) v += 1;
    if (random)
        return cy.add({
            group: 'nodes',
            data: {
                id: v.toString()
            },
            position: {
                x: Math.floor(Math.random() * 500 + 25),
                y: Math.floor(Math.random() * 500 + 25)
            }
        });

    if (position === null)
        return cy.add({
            group: 'nodes',
            data: {
                id: v.toString()
            }
        });
    return cy.add({
        group: 'nodes',
        data: {
            id: v.toString()
        },
        position
    });
}
/**
 * @param {cytoscape.EdgeSingular} edge
 * @return {number} weight
 * */
function getWeight(edge) {
    const weight = edge.data('weight');
    return isNaN(weight) ? 1 : weight;
}
/**
 * Rerun the layout for the graph and recalculate its total weight
 * @return {void}
 * */
function cyReLayout() {
    let totalWeight = 0;
    for (let i = 0; i < cy.edges().length; i++) totalWeight += getWeight(cy.edges()[i]);
    document.getElementById('cy_weight').innerHTML = totalWeight.toString();
    if (CyLayout !== undefined) CyLayout.stop();
    if (layoutName !== '') {
        CyLayout = cy.layout(layoutOptions[layoutName]);
        CyLayout.run();
    }
}
/**
 * Rerun the layout for the graph and recalculate its total weight
 * @return {void}
 * */
function caReLayout() {
    let totalWeight = 0;
    for (let i = 0; i < ca.edges().length; i++) totalWeight += getWeight(ca.edges()[i]);
    document.getElementById('ca_weight').innerHTML = totalWeight.toString();
    if (CaLayout !== undefined) CaLayout.stop();
    if (layoutName !== '') {
        CaLayout = ca.layout(layoutOptions[layoutName]);
        CaLayout.run();
    }
}
/**
 * @return {void}
 * */
function reLayout() {
    cyReLayout();
    caReLayout();
}

/**
 * Hide the result canvas
 * @param {HTMLInputElement} c
 * @return {void}
 * */
function hideResult(c) {
    const cy_div = $('#cy');
    const ca_div = $('#ca_tab');
    if (c.checked) {
        ca_div.hide(300, () => {
            cy_div.animate(
                {
                    width: '1170px'
                },
                500,
                () => {
                    cyReLayout();
                }
            );
        });
    } else {
        cy_div.animate(
            {
                width: '580px'
            },
            300,
            () => {
                ca_div.show(500, () => {
                    reLayout();
                });
            }
        );
    }
}
/**
 * @param {boolean} random
 * @param {{x: number, y: number}} position
 * @return {void}
 * */
function addNode(random, position) {
    stopAnimation();
    let num = parseInt(document.getElementById('nid').value);
    num = isNaN(num) ? 1 : num < 1 ? 1 : num;
    for (let i = 0; i < num; i++) addOneNode(random, position);
    if (auto_refresh.checked) cyReLayout();
}
/**
 * @return {void}
 * */
function addEdge() {
    stopAnimation();
    const w = +document.getElementById('weight').value;
    const src_tg = document.getElementById('src_tg');
    const [n1, n2, count] = src_tg.value.split('-');
    let num = count === undefined ? 1 : isNaN(+count) ? 1 : +count;
    if (num < 1) num = 1;
    let v = 0;
    const id_pre = `${n1}-${n2}-`;
    for (let i = 0; i < num; i++) {
        while (cy.$id(id_pre + v).length !== 0) v += 1;
        cy.add({
            group: 'edges',
            data: {
                id: id_pre + v,
                source: n1,
                target: n2,
                weight: w
            }
        });
    }
    if (auto_refresh.checked) cyReLayout();
}
/**
 * @param {cytoscape.Core} c
 * @param {boolean} flag
 * @return {void}
 * */
function snapToGrid(c, flag) {
    if (flag) {
        c.snapToGrid('snapOn');
        c.snapToGrid('gridOn');
    } else {
        c.snapToGrid('snapOff');
        c.snapToGrid('gridOff');
    }
}
/**
 * @param {number} idx
 * @return {void}
 * */
function changeLayout(idx) {
    const name = document.getElementById('layout').options[idx].value;
    if (name === 'snapToGrid') {
        snapToGrid(cy, true);
        snapToGrid(ca, true);
        layoutName = '';
    } else {
        snapToGrid(cy, false);
        snapToGrid(ca, false);
        layoutName = name;
    }
    reLayout();
}
/**
 * @return {void}
 * */
function removeNode() {
    stopAnimation();
    const n_id = document.getElementById('nodeid');
    const v = n_id.value;
    const ids = v.split(',');
    if (ids.length === 1) {
        const range = v.split('-');
        if (range.length === 1) cy.remove(getAllNodes(cy).$id(v));
        else {
            const lower = parseInt(range[0]);
            const upper = parseInt(range[1]);
            for (let i = lower; i <= upper; i++) cy.remove(cy.$id(i));
        }
    } else {
        for (let i = 0; i < ids.length; i++) cy.remove(cy.$id(ids[i]));
    }
    n_id.value = '';
    if (auto_refresh.checked) cyReLayout();
}
/**
 * @return {void}
 * */
function removeEdge() {
    stopAnimation();
    const v = document.getElementById('r_src_tg').value;
    const n = v.split('-');
    if (n[1] === undefined) return;
    const l = n[2] === undefined ? 1 : parseInt(n[2]);
    const eles = cy.edges(`[id ^='${n[0]}-${n[1]}-']`).union(cy.edges(`[id ^='${n[1]}-${n[0]}-']`));
    const numToRemove = l > eles.length ? eles.length : l;
    for (let i = 0; i < numToRemove; i++) cy.remove(eles[i]);
    if (auto_refresh.checked) cyReLayout();
}
/**
 * @param {cytoscape.EdgeSingular} edge
 * @param {cytoscape.Core} c
 * @return {cytoscape.EdgeSingular}
 * */
function duplicateEdge(edge, c) {
    const [source, target] = edge.id().split('-');
    let last = 0;

    // make sure that the id of an edge is not duplicated
    while (c.$id(`${source}-${target}-${last}`).length !== 0) last += 1;

    return c.add({
        group: 'edges',
        data: {
            id: `${source}-${target}-${last}`,
            source,
            target,
            weight: edge.data('weight')
        }
    });
}
/**
 * @return {void}
 * */
function removeSelected() {
    stopAnimation();
    cy.remove(cy.$(':selected'));
    if (auto_refresh.checked) cyReLayout();
}
/**
 * @param {string} src
 * @param {string} tg
 * @param {number} w
 * @return {cytoscape.EdgeSingular} the edge added
 * */
function addEdgeBwt(src, tg, w) {
    const id_pre = `${src}-${tg}-`;
    let x = 0;
    while (cy.$id(id_pre + x).length !== 0) x += 1;
    return cy.add({
        group: 'edges',
        data: {
            id: id_pre + x,
            source: src,
            target: tg,
            weight: w
        }
    });
}
/**
 * @return {void}
 * */
function addEdgeBetweenSelected() {
    stopAnimation();
    const nodes = cy.nodes(':selected');
    const weight = parseInt(document.getElementById('weight').value);
    const x = nodes.length;
    if (x > 1)
        for (let i = 0; i < nodes.length; i++)
            for (let j = i + 1; j < nodes.length; j++)
                addEdgeBwt(nodes[i].data('id'), nodes[j].data('id'), weight);
    else if (x === 1 && document.getElementById('simple').checked)
        addEdgeBwt(nodes[0].data('id'), nodes[0].data('id'), weight);
    if (auto_refresh.checked) cyReLayout();
}
/**
 * paste the copied elements
 * @return {void}
 * */
function paste() {
    if (copiedEles === undefined) return;
    const idMap = {};
    cy.elements().unselect();
    copiedEles.forEach(ele => {
        if (ele.isNode()) {
            const addedNode = addOneNode(false, {
                x: ele.position('x') + 25,
                y: ele.position('y') + 25
            });
            addedNode.select();
            idMap[ele.data('id')] = addedNode.data('id');
        }
    });
    copiedEles.forEach(ele => {
        if (ele.isEdge()) {
            if (idMap[ele.data('source')] !== undefined && idMap[ele.data('target')] !== undefined)
                addEdgeBwt(
                    idMap[ele.data('source')],
                    idMap[ele.data('target')],
                    ele.data('weight')
                ).select();
        }
    });
}
/**
 * given a node and the edge connected to it, get the other node
 * @param {cytoscape.NodeSingular} node
 * @param {cytoscape.EdgeSingular} edge
 * @param {cytoscape.Core} c
 * @return {cytoscape.NodeSingular} the target node
 * */
function getTarget(node, edge, c = cy) {
    let targetNode;
    if (edge.data('source') === node.data('id')) targetNode = c.$id(edge.data('target'));
    else targetNode = c.$id(edge.data('source'));
    return targetNode;
}
/**
 * @return {void}
 * */
function clearSource() {
    stopAnimation();
    cy.remove(cy.elements());
    document.getElementById('cy_weight').innerHTML = '';
}
/**
 * @return {void}
 * */
function clearResult() {
    stopAnimation();
    ca.remove(ca.elements());
    document.getElementById('ca_weight').innerHTML = '';
    document.getElementById('path').innerHTML = '';
}
/**
 * @return {void}
 * */
function readAM() {
    clearCyStyle();
    createFromAM(eval(document.getElementById('matrix_input').value));
}
/**
 * @return {void}
 * */
function readWM() {
    clearCyStyle();
    createFromWM(eval(document.getElementById('matrix_input').value));
}

/**
 * @param {string} prompt_text
 * @param {string} default_value
 * @return {cytoscape.NodeSingular|undefined} The first node (selected or entered)
 * */
function getCyStartNode(prompt_text, default_value) {
    let root = cy.nodes(':selected');
    if (root.length <= 0) {
        root = cy.$id(prompt(prompt_text, default_value));
        if (root.length > 0) return root[0];
    } else return root[0];
    return undefined;
}
/**
 * @param {boolean} dir whether this is for a directed graph or not
 * @return {boolean}
 */
function isComplete(dir) {
    const n = getAllNodes(cy).length;
    return (n * (n - 1)) / (dir ? 1 : 2) === cy.edges().length;
}
/**
 * Convert a two dimensional matrix to string
 * @param {number[][]} m
 * @return {string}
 * */
function matrixToString(m) {
    let s = `[[${m[0].toString()}],\n`;
    for (let i = 1; i < m.length - 1; i++) s += ` [${m[i].toString()}],\n`;
    s += ` [${m[m.length - 1].toString()}]]`;
    return s;
}
/**
 * Get the adjacency matrix
 * @param {cytoscape.Core} c The Cytoscape object
 * @param {boolean} output
 * @param {boolean} [directed=false]
 * @return {[number[][], Object<string, number>]}
 * a 2D-array and a mapping from node id in cytoscape to node index in matrix
 * */
function getAM(c, output, directed = false) {
    const nodes = getAllNodes(c);
    const numOfNodes = nodes.length;
    const matrix = new Array(numOfNodes);
    const id_index = {};
    for (let i = 0; i < numOfNodes; i++) {
        matrix[i] = new Array(numOfNodes);

        // match the id of nodes with the index, an continuous integer
        // in case where the some of the nodes are deleted
        id_index[nodes[i].data('id')] = i;
        for (let j = 0; j < numOfNodes; j++) matrix[i][j] = 0;
    }

    // record the number of edges
    // matrix[i][j] denotes the number of edges connecting node i and node j
    c.edges().forEach(ele => {
        const i = id_index[ele.data('source')];
        const j = id_index[ele.data('target')];
        matrix[i][j] += 1;
        if (!directed) {
            matrix[j][i] += 1;
        }
    });
    if (output) document.getElementById('matrix_input').value = matrixToString(matrix);
    return [matrix, id_index];
}
/**
 * get the weight matrix
 * @param {cytoscape.Core} c The Cytoscape object
 * @param {boolean} output
 * @param {boolean} [directed=false]
 * @return {[number[][], Object<string, number>]}
 * a 2D-array and a mapping from node id in cytoscape to node index in matrix
 * */
function getWM(c, output, directed = false) {
    const nodes = getAllNodes(c);
    const numOfNodes = nodes.length;
    const matrix = new Array(numOfNodes);
    const id_index = {};
    for (let i = 0; i < numOfNodes; i++) {
        matrix[i] = new Array(numOfNodes);
        id_index[nodes[i].data('id')] = i;
        for (let j = 0; j < numOfNodes; j++) matrix[i][j] = 0;
    }
    c.edges().forEach(ele => {
        const i = id_index[ele.data('source')];
        const j = id_index[ele.data('target')];
        const w = getWeight(ele);
        if (matrix[i][j] === 0) matrix[i][j] = w;
        else if (w < matrix[i][j]) matrix[i][j] = w;

        if (!directed) matrix[j][i] = matrix[i][j];
    });
    if (output) document.getElementById('matrix_input').value = matrixToString(matrix);
    return [matrix, id_index];
}
class LinkedListNode {
    /**
     * @param {any} cargo
     * @param {LinkedListNode} next
     */
    constructor(cargo, next) {
        this.cargo = cargo;
        this.next = next;
    }
}
class LinkedList {
    constructor() {
        /**
         * @public
         * @type {LinkedListNode}
         * */
        this.head = null;
        this.length = 0;
    }

    /**
     * Get the last node of the linked list
     * @return {LinkedListNode}
     * */
    getTail() {
        let currentNode = this.head;
        while (currentNode.next !== null) currentNode = currentNode.next;
        return currentNode;
    }

    /**
     * add a cargo
     * @param {*} cargo
     * */
    add(cargo) {
        if (this.length === 0) this.head = new LinkedListNode(cargo, null);
        else this.getTail().next = new LinkedListNode(cargo, null);
        this.length += 1;
    }

    /**
     * add a node
     * @param {LinkedListNode} node
     * */
    addNode(node) {
        if (this.length === 0) this.head = node;
        else this.getTail().next = node;
        this.length += 1;
    }

    /**
     * search a specific node using user defined function
     * @param {function} func
     * @return {LinkedListNode}
     * */
    search(func) {
        let currentNode = this.head;
        while (currentNode !== null) {
            if (func(currentNode.cargo)) return currentNode;
            currentNode = currentNode.next;
        }
        return null;
    }

    /**
     * traverse the linked list, with visualizations on the graph,
     * assuming each cargo is either a node or an edge
     * @param {boolean} animate
     * whether or not to animate
     * @param {boolean} trace
     * whether or not to record the path
     * */
    traverse(animate, trace) {
        let currentNode = this.head;
        let counter = 0;
        if (trace) {
            let path_string = '';
            while (currentNode !== null) {
                const currentElement = currentNode.cargo;
                if (currentElement.isNode())
                    path_string += `<span class="normal" id="n${counter}">${currentElement.data(
                        'id'
                    )}</span>`;
                else path_string += `<span class="normal" id="n${counter}"> → </span>`;
                counter += 1;
                currentNode = currentNode.next;
            }
            document.getElementById('path').innerHTML = path_string;
        }
        if (animate) {
            animationFlag = true;
            currentNode = this.head;
            counter = 1;
            /**
             * animate nodes and edges by the order of addition into the linekd list
             * @private
             * @param {LinkedListNode} node
             * */
            const animation = node => {
                if (node.cargo.isNode()) {
                    node.cargo
                        .animate({
                            style: {
                                backgroundColor: '#00f1f1',
                                width: '30px',
                                height: '30px'
                            },
                            duration: Math.round(+duration.value * 0.1)
                        })
                        .animate({
                            style: {
                                backgroundColor: '#de4400',
                                width: '20px',
                                height: '20px'
                            },
                            duration: Math.round(+duration.value * 0.4),
                            complete: () => {
                                // if the global flag is set to false
                                // stop the animation
                                if (!animationFlag) return;

                                // animate next node if it exists
                                if (node.next !== null) {
                                    if (trace) {
                                        // update the tracer
                                        // track the animation by applying additional CSS to elements
                                        document.getElementById(`n${counter}`).className =
                                            'current';
                                        document.getElementById(`n${counter - 1}`).className =
                                            'normal';
                                        counter += 1;
                                    }
                                    animation(node.next);
                                }
                            }
                        });
                } else {
                    node.cargo
                        .animate({
                            style: {
                                lineColor: '#00f1f1',
                                width: '6'
                            },
                            duration: Math.round(+duration.value * 0.2)
                        })
                        .animate({
                            style: {
                                lineColor: '#de4400',
                                width: '3'
                            },
                            duration: Math.round(+duration.value * 0.8),
                            complete: () => {
                                // if the global flag is set to false
                                // stop the animation
                                if (!animationFlag) return;

                                // animate next node if it exists
                                if (node.next !== null) {
                                    // update the tracer
                                    if (trace) {
                                        document.getElementById(`n${counter}`).className =
                                            'current';
                                        document.getElementById(`n${counter - 1}`).className =
                                            'normal';
                                        counter += 1;
                                    }
                                    animation(node.next);
                                }
                            }
                        });
                }
            };
            if (trace) document.getElementById('n0').className = 'current';
            animation(currentNode);
        }
    }
}

/**
 * initialize the conventional right-click menu
 * @param {cytoscape.Core} c
 * @return {void}
 * */
function initConventionalMenu(c) {
    c.contextMenus({
        menuItems: [
            {
                id: 'remove',
                content: 'remove',
                tooltipText: 'remove this element only',
                selector: 'node, edge',
                onClickFunction: event => {
                    const target = event.target || event.cyTarget;
                    target.remove();
                }
            },
            {
                id: 'duplicate-edge',
                content: 'duplicate edge',
                tooltipText: 'duplicate this edge',
                selector: 'edge',
                onClickFunction: event => {
                    duplicateEdge(event.target, cy);
                }
            },
            {
                id: 'change-weight',
                content: 'change weight',
                tooltipText: 'set a new weight for this edge',
                selector: 'edge',
                onClickFunction: event => {
                    const weight = parseInt(prompt('Please enter a weight for this edge.', '1'));
                    if (!isNaN(weight)) event.target.data('weight', weight);
                    else event.target.data('weight', '');
                }
            },
            {
                id: 'add-node',
                content: 'add node',
                tooltipText: 'add node',
                coreAsWell: true,
                onClickFunction: event => {
                    const pos = event.position || event.cyPosition;
                    addNode(false, {
                        x: pos.x,
                        y: pos.y
                    });
                }
            },
            {
                id: 'add-edge',
                content: 'add edge',
                tooltipText: 'add edge(s) between selected nodes',
                selector: 'node',
                onClickFunction: event => {
                    addEdgeBetweenSelected();
                }
            },
            {
                id: 'remove-selected',
                content: 'remove selected',
                tooltipText: 'remove selected elements',
                selector: 'node, edge',
                coreAsWell: true,
                onClickFunction: event => {
                    removeSelected();
                },
                hasTrailingDivider: true
            },
            {
                id: 'select-all-nodes',
                content: 'select all nodes',
                tooltipText: 'select all nodes',
                selector: 'node',
                onClickFunction: event => {
                    selectAllOfTheSameType(event.target || event.cyTarget);
                },
                hasTrailingDivider: true
            },
            {
                id: 'select-all-edges',
                content: 'select all edges',
                tooltipText: 'select all edges',
                selector: 'edge',
                onClickFunction: event => {
                    selectAllOfTheSameType(event.target || event.cyTarget);
                },
                hasTrailingDivider: true
            },
            {
                id: 'bfs',
                content: 'start BFS',
                tooltipText: 'start breadth first search at this node',
                selector: 'node',
                onClickFunction: event => {
                    cy.elements().unselect();
                    const tg = event.target || event.cyTarget;
                    tg.select();
                    breadthFirstSearch();
                }
            },
            {
                id: 'dfs',
                content: 'start DFS',
                tooltipText: 'start depth first search at this node',
                selector: 'node',
                onClickFunction: event => {
                    cy.elements().unselect();
                    const tg = event.target || event.cyTarget;
                    tg.select();
                    depthFirstSearch();
                }
            }
        ]
    });
}
/**
 * @param {cytoscape.Core} c
 * @return {void}
 * */
function initCircularMenu(c) {
    c.cxtmenu({
        menuRadius: 75,
        activePadding: 10,
        selector: 'node',
        commands: [
            {
                content: '<i class="fa fa-road fa-2x" aria-hidden="true"></i>',
                select: ele => {
                    ele.select();
                    addEdgeBetweenSelected();
                }
            },
            {
                content: '<i class="fa fa-trash fa-2x" aria-hidden="true"></i>',
                select: ele => {
                    cy.remove(ele);
                    if (auto_refresh.checked) cyReLayout();
                }
            },
            {
                content: 'BFS',
                select: ele => {
                    cy.elements().unselect();
                    ele.select();
                    breadthFirstSearch();
                }
            },
            {
                content: 'DFS',
                select: ele => {
                    cy.elements().unselect();
                    ele.select();
                    depthFirstSearch();
                }
            }
        ]
    });
    c.cxtmenu({
        menuRadius: 75,
        activePadding: 10,
        selector: 'edge',
        commands: [
            {
                content: '<i class="fa fa-trash fa-2x" aria-hidden="true"></i>',
                select: ele => {
                    cy.remove(ele);
                    if (auto_refresh.checked) cyReLayout();
                }
            },
            {
                content: '<i class="fa fa-plus fa-2x" aria-hidden="true"></i>',
                select: ele => {
                    duplicateEdge(ele, cy);
                }
            },
            {
                content: '<i class="fa fa-tag fa-2x" aria-hidden="true"></i>',
                select: ele => {
                    const weight = parseInt(prompt('Please enter a weight for this edge.', '1'));
                    if (!isNaN(weight)) ele.data('weight', weight);
                    else ele.data('weight', '');
                }
            }
        ]
    });
    c.cxtmenu({
        menuRadius: 75,
        activePadding: 10,
        selector: 'core',
        commands: [
            {
                content: '<i class="fa fa-plus fa-2x" aria-hidden="true"></i>',
                select: () => {
                    addNode(false, null);
                }
            },
            {
                content: '<i class="fa fa-trash fa-2x" aria-hidden="true"></i>',
                select: () => {
                    cy.remove(cy.elements(':selected'));
                }
            },
            {
                content: '<i class="fa fa-crosshairs fa-2x" aria-hidden="true"></i>',
                select: () => {
                    cy.elements().select();
                }
            },
            {
                content: '<i class="fa fa-refresh fa-2x" aria-hidden="true"></i>',
                select: () => {
                    reLayout();
                }
            }
        ]
    });
}

// initialization function
$(() => {
    clearCyStyle();
    clearCaStyle();
    initCircularMenu(cy);

    edgeHandles = cy.edgehandles({
        preview: true, // whether to show added edges preview before releasing selection
        hoverDelay: 150, // time spent hovering over a target node before it is considered selected
        handleNodes: 'node', // selector/filter function for whether edges can be made from a given node
        snap: false, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
        snapThreshold: 50, // the target node must be less than or equal to this many pixels away from the cursor/finger
        snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
        noEdgeEventsInDraw: false, // set events:no to edges during draws, prevents mouseouts on compounds
        disableBrowserGestures: true, // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
        handlePosition(node) {
            return 'middle top'; // sets the position of the handle in the format of "X-AXIS Y-AXIS" such as "left top", "middle top"
        },
        handleInDrawMode: false, // whether to show the handle in draw mode
        edgeType(sourceNode, targetNode) {
            // can return 'flat' for flat edges between nodes or 'node' for intermediate node between them
            // returning null/undefined means an edge can't be added between the two nodes
            return 'flat';
        },
        loopAllowed(node) {
            // for the specified node, return whether edges from itself to itself are allowed
            return true;
        },
        /**
         * @param {cytoscape.NodeSingular} sourceNode
         * @param {cytoscape.NodeSingular} targetNode
         * @param {number} i
         */
        edgeParams: (sourceNode, targetNode, i) => {
            // for edges between the specified source and target
            // return element object to be passed to cy.add() for edge
            // NB: i indicates edge index in case of edgeType: 'node'
            const id_pre = `${sourceNode.data('id')}-${targetNode.data('id')}-`;
            const temp = document.getElementById('weight').value;

            let x = 0;
            while (cy.$id(id_pre + x).length !== 0) x += 1;
            const data = {
                data: {
                    id: id_pre + x,
                    source: sourceNode.data('id'),
                    target: targetNode.data('id')
                }
            };
            if (temp) {
                data.weight = +temp;
            }
            return data;
        },
        /**
         * @param {cytoscape.NodeSingular} sourceNode
         * @param {cytoscape.NodeCollection} targetNodes
         * @param {cytoscape.Collection} addedEntities
         */
        complete: (sourceNode, targetNodes, addedEntities) => {
            // fired when edgehandles is done and entities are added
            if (auto_refresh.checked) cyReLayout();
            addedEntities.forEach(ele => {
                if (ele.isEdge()) {
                    ele.animate({
                        style: {
                            lineColor: 'red',
                            width: 5
                        },
                        duration: 100
                    }).animate({
                        style: {
                            lineColor: '#ccc',
                            width: 2
                        },
                        duration: 500
                    });
                }
            });
        }
    });
    edgeHandles.disable();

    const panzoomOptions = {
        zoomDelay: 20,
        zoomFactor: 0.02,
        panSpeed: 5,
        panDistance: 1,
        fitPadding: 20,
        animateOnFit: true,
        fitAnimationDuration: 500
    };

    cy.panzoom(panzoomOptions);
    ca.panzoom(panzoomOptions);
    cy.snapToGrid();
    cy.snapToGrid('snapOff');
    cy.snapToGrid('gridOff');
    ca.snapToGrid();
    ca.snapToGrid('snapOff');
    ca.snapToGrid('gridOff');

    // add key bindings
    document.addEventListener('keydown', e => {
        e = e || event;
        const which = e.which || e.keyCode || e.charCode;

        if (e.altKey) {
            // alt + c
            if (which == 67) addEdgeBetweenSelected();
            // alt + a
            else if (which == 65) addNode(true, null);
            // alt + f
            else if (which == 70) reLayout();
            // alt + s
            else if (which == 83) clearSource();
            // alt + r
            else if (which == 82) clearResult();
        } else if (e.ctrlKey) {
            // ctrl + c
            if (which == 67) copy(cy.$(':selected'));
            // ctrl + v
            else if (which == 86) paste();
            // ctrl + s
            else if (which == 83) stopAnimation();
            // ctrl + a
            else if (which == 65) cy.elements().select();
            // ctrl + r
            else if (which == 82) clearCaStyle();
            // ctrl + f
            else if (which == 70) clearCyStyle();
        }
        // the delete key
        else if (which == 46) removeSelected();
    });
    reLayout();
});
