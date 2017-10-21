'use strict';
/**
 * @function
 * @public
 * @param {object} c
 * @return void
 * */
function hideResult(c) {
    let cy_div = $('#cy');
    let ca_div = $('#ca_tab');
    if (c.checked) {
        ca_div.hide(300, () => {
            cy_div.animate({width: '1170px'}, 500, () => {
                cyReLayout();
            });
        });
    }
    else {
        cy_div.animate({width: '580px'}, 300, () => {
            ca_div.show(500, () => {
                reLayout();
            })
        });
    }
}
/**
 * @function
 * @private
 * @param {object} isSimple
 * @return void
 * */
function hideWeight(isSimple) {
    let a = $('#weighted');
    if (isSimple.checked) {
        a.show(500);
        $('#wlabel').show(500);
    } else {
        a.hide(500);
        $('#wlabel').hide(500);
    }
}
/**
 * @public
 * @function
 * @param {object} cb
 * @return void
 */
function hideDuration(cb) {
    let d = $('#label-duration');
    if (cb.checked)
        d.show(400);
    else
        d.hide(400);
}
/**
 * @public
 * @function
 * @return void
 * */
function callToAlgorithms() {
    let algo = document.getElementById('algorithms');
    eval(algo.options[algo.selectedIndex].value);
}
/**
 * @author Hanzhi Zhou (Tom)
 * */
/**
 * The cytoscape instance of the source
 * @type {object}
 * */
let cy;
/**
 * The cytoscape instance of the result
 * @type {object}
 * */
let ca;
/**
 * default node style
 * @const
 * @type {JSON}
 * */
const defaultNodeStyle = {
    'background-color': '#666',
    'label': 'data(id)',
    'height': '25px',
    'width': '25px',
    'font-size': '20px',

};
/**
 * default edge style
 * @const
 * @type {JSON}
 * */
const defaultEdgeStyle = {
    'width': 2,
    'line-color': '#888',
    'curve-style': 'bezier',
    'label': (edge) => {
        return isNaN(edge.data('weight')) ? '' : edge.data('weight');
    },
    'color': 'red',
    'font-size': '20px',
    'target-arrow-color': '#910c95',
    'target-arrow-fill': 'filled',
    'target-arrow-scale': '15',
    'target-arrow-shape': 'triangle'
};
/**
 * @type {string}
 * */
let layoutname = "spread";
/**
 * @type {object}
 * */
let CyLayout;
/**
 * @type {object}
 * */
let CaLayout;
/**
 * @type {boolean}
 * */
let animationFlag = true;
/**
 * Copied elements
 * @type {object}
 * */
let copiedEles;
/**
 * @type {boolean}
 * */
let drawOn = false;
/**
 * weight_input text box
 * @const
 * @type {object}
 * */
const weight_input = document.getElementById('weight');
/**
 * matrix_input text box
 * @const
 * @type {object}
 * */
const matrix_input = document.getElementById('matrix_input');
/**
 * auto_refresh checkbox
 * @const
 * @type {object}
 * */
const auto_refresh = document.getElementById('autorefresh');
/**
 * "perform animation" button
 * @const
 * @type {object}
 * */
const perform_button = document.getElementById('perform');
/**
 * the animation checkbox
 * @const
 * @type {object}
 * */
const animation = document.getElementById('animation');
/**
 * animation duration
 * @const
 * @type {object}
 * */
const duration = document.getElementById('duration');
/**
 * process div
 * @const
 * @type {object}
 * */
const processDiv = document.getElementById('process');

// initialization function
$(() => {
    cy = initializeCytoscapeObjects("cy");
    ca = initializeCytoscapeObjects("ca");
    clearCyStyle();
    clearCaStyle();
    initCircularMenu(cy);

    cy.graphml({layoutBy: 'circle'});
    ca.graphml({layoutBy: 'circle'});

    cy.edgehandles({
        preview: true, // whether to show added edges preview before releasing selection
        stackOrder: 4, // Controls stack order of edgehandles canvas element by setting it's z-index
        handleSize: 10, // the size of the edge handle put on nodes
        handleHitThreshold: 6, // a threshold for hit detection that makes it easier to grab the handle
        handleIcon: false, // an image to put on the handle
        handleColor: '#ff0000', // the colour of the handle and the line drawn from it
        handleLineType: 'ghost', // can be 'ghost' for real edge, 'straight' for a straight line, or 'draw' for a draw-as-you-go line
        handleLineWidth: 3, // width of handle line in pixels
        handleOutlineColor: '#000000', // the colour of the handle outline
        handleOutlineWidth: 0, // the width of the handle outline in pixels
        handleNodes: 'node', // selector/filter function for whether edges can be made from a given node
        handlePosition: 'middle top', // sets the position of the handle in the format of "X-AXIS Y-AXIS" such as "left top", "middle top"
        hoverDelay: 100, // time spend over a target node before it is considered a target selection
        cxt: false, // whether cxt events trigger edgehandles (useful on touch)
        enabled: true, // whether to start the plugin in the enabled state
        toggleOffOnLeave: false, // whether an edge is cancelled by leaving a node (true), or whether you need to go over again to cancel (false; allows multiple edges in one pass)
        edgeType: (sourceNode, targetNode) => {
            // can return 'flat' for flat edges between nodes or 'node' for intermediate node between them
            // returning null/undefined means an edge can't be added between the two nodes
            return 'flat';
        },
        loopAllowed: (node) => {
            // for the specified node, return whether edges from itself to itself are allowed
            return true;
        },
        nodeLoopOffset: -50, // offset for edgeType: 'node' loops
        nodeParams: (sourceNode, targetNode) => {
            // for edges between the specified source and target
            // return element object to be passed to cy.add() for intermediary node
            return {};
        },
        edgeParams: (sourceNode, targetNode, i) => {
            // for edges between the specified source and target
            // return element object to be passed to cy.add() for edge
            // NB: i indicates edge index in case of edgeType: 'node'
            let id_pre = sourceNode.data('id') + '-' + targetNode.data('id') + '-';
            let x = 0;
            while (cy.$id(id_pre + x).length !== 0)
                x += 1;
            return {
                data: {
                    id: id_pre + x,
                    source: sourceNode.data('id'),
                    target: targetNode.data('id'),
                    weight: parseInt(weight_input.value)
                }
            };
        },
        start: (sourceNode) => {
            // fired when edgehandles interaction starts (drag on handle)
        },
        complete: (sourceNode, targetNodes, addedEntities) => {
            // fired when edgehandles is done and entities are added
            if (auto_refresh.checked)
                cyReLayout();
            addedEntities.forEach((ele) => {
                if (ele.isEdge()) {
                    ele.animate({
                        style: {lineColor: 'red', width: 6},
                        duration: 100
                    }).animate({
                        style: {lineColor: '#ccc', width: 2},
                        duration: 500
                    });
                }
            });
        },
        stop: (sourceNode) => {
            // fired when edgehandles interaction is stopped (either complete with added edges or incomplete)
        },
        cancel: (sourceNode, renderedPosition, invalidTarget) => {
            // fired when edgehandles are cancelled ( incomplete - nothing has been added ) - renderedPosition is where the edgehandle was released, invalidTarget is
            // a collection on which the handle was released, but which for other reasons (loopAllowed | edgeType) is an invalid target
        }
    });

    //add key bindings
    document.addEventListener("keydown", (e) => {
        e = e || event;
        let which = e.which || e.keyCode || e.charCode;

        if (e.altKey) {
            // alt + c
            if (which == 67)
                addEdgeBetweenSelected();

            // alt + a
            else if (which == 65)
                addNode(true, null);

            // alt + f
            else if (which == 70)
                reLayout();

            // alt + s
            else if (which == 83)
                clearSource();

            // alt + r
            else if (which == 82)
                clearResult();

        }
        else if (e.ctrlKey) {
            // ctrl + c
            if (which == 67)
                copy(cy.$(':selected'));

            // ctrl + v
            else if (which == 86)
                paste();

            // ctrl + s
            else if (which == 83)
                stopAnimation();

            // ctrl + a
            else if (which == 65)
                cy.elements().select();

            // ctrl + r
            else if (which == 82)
                clearCaStyle();

            // ctrl + f
            else if (which == 70)
                clearCyStyle();
        }
        // the delete key
        else {
            if (which == 46)
                removeSelected();
        }
    });
    reLayout();
    hideResult(document.getElementById('hide_result'));
});
/**
 * restore the default style of cy elements
 * @function
 * @public
 * @return void
 * */
function clearCyStyle() {
    cy.elements().removeStyle();
    processDiv.innerHTML = '';
    cy.style().resetToDefault().selector('node').style(defaultNodeStyle).selector('edge').style(defaultEdgeStyle).update();
    cy.$(':selected').select();
}
/**
 * @function
 * @public
 * @return void
 * */
function clearCaStyle() {
    ca.elements().removeStyle();
    ca.style().resetToDefault().selector('node').style(defaultNodeStyle).selector('edge').style(defaultEdgeStyle).update();
    ca.$(':selected').select();
}
/**
 * @function
 * @public
 * @param {object} eles
 * @return void
 * */
function copy(eles) {
    copiedEles = eles;
}

/**
 * paste the copied elements
 * @function
 * @public
 * @return void
 * */
function paste() {
    if (copiedEles === undefined)
        return;
    let idMap = {};
    cy.elements().unselect();
    copiedEles.forEach((ele) => {
        if (ele.isNode()) {
            let addedNode = addOneNode(false, {
                x: ele.position('x') + 25,
                y: ele.position('y') + 25
            });
            addedNode.select();
            idMap[ele.data('id')] = addedNode.data('id');
        }
    });
    copiedEles.forEach((ele) => {
        if (ele.isEdge()) {
            if (idMap[ele.data('source')] !== undefined && idMap[ele.data('target')] !== undefined)
                addEdgeBwt(idMap[ele.data('source')], idMap[ele.data('target')], ele.data('weight')).select();
        }
    });
}

/**
 * @function
 * @param {string} div_name
 * @public
 * @return {object}
 * */
function initializeCytoscapeObjects(div_name) {
    let c = cytoscape({
        container: document.getElementById(div_name)
    });
    c.on('select', (event) => {
        event.target.style({'background-color': 'green', 'line-color': 'green'});
    });
    c.on('unselect', (event) => {
        event.target.style({'background-color': '#666', 'line-color': '#ccc'});
    });
    c.panzoom({
        zoomDelay: 20,
        zoomFactor: 0.02,
        panSpeed: 5,
        panDistance: 1,
        fitPadding: 20,
        animateOnFit: true,
        fitAnimationDuration: 500
    });
    c.snapToGrid();
    c.snapToGrid('snapOff');
    c.snapToGrid('gridOff');
    return c;
}

/**
 * @function
 * @param {object} ele
 * @public
 * @return void
 * */
function selectAllOfTheSameType(ele) {
    cy.elements().unselect();
    if (ele.isNode())
        cy.nodes().select();
    else if (ele.isEdge())
        cy.edges().select();
}

/**
 * initialize the conventional right-click menu
 * @function
 * @param {object} c
 * @public
 * @return void
 * */
function initConventionalMenu(c) {
    c.contextMenus({
        menuItems: [
            {
                id: 'remove',
                content: 'remove',
                tooltipText: 'remove this element only',
                selector: 'node, edge',
                onClickFunction: (event) => {
                    let target = event.target || event.cyTarget;
                    target.remove();
                }
            },
            {
                id: 'duplicate-edge',
                content: 'duplicate edge',
                tooltipText: 'duplicate this edge',
                selector: 'edge',
                onClickFunction: (event) => {
                    duplicateEdge(event.target, cy);
                }
            },
            {
                id: 'change-weight',
                content: 'change weight',
                tooltipText: 'set a new weight for this edge',
                selector: 'edge',
                onClickFunction: (event) => {
                    let weight = parseInt(prompt('Please enter a weight for this edge.', '1'));
                    if (!isNaN(weight))
                        event.target.data('weight', weight);
                    else
                        event.target.data('weight', '');
                }
            },
            {
                id: 'add-node',
                content: 'add node',
                tooltipText: 'add node',
                coreAsWell: true,
                onClickFunction: (event) => {
                    let pos = event.position || event.cyPosition;
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
                onClickFunction: (event) => {
                    addEdgeBetweenSelected();
                }
            },
            {
                id: 'remove-selected',
                content: 'remove selected',
                tooltipText: 'remove selected elements',
                selector: 'node, edge',
                coreAsWell: true,
                onClickFunction: (event) => {
                    removeSelected();
                },
                hasTrailingDivider: true
            },
            {
                id: 'select-all-nodes',
                content: 'select all nodes',
                tooltipText: 'select all nodes',
                selector: 'node',
                onClickFunction: (event) => {
                    selectAllOfTheSameType(event.target || event.cyTarget);
                },
                hasTrailingDivider: true
            },
            {
                id: 'select-all-edges',
                content: 'select all edges',
                tooltipText: 'select all edges',
                selector: 'edge',
                onClickFunction: (event) => {
                    selectAllOfTheSameType(event.target || event.cyTarget);
                },
                hasTrailingDivider: true
            },
            {
                id: 'bfs',
                content: 'start BFS',
                tooltipText: 'start breadth first search at this node',
                selector: 'node',
                onClickFunction: (event) => {
                    cy.elements().unselect();
                    let tg = event.target || event.cyTarget;
                    tg.select();
                    breadthFirstSearch();
                }
            },
            {
                id: 'dfs',
                content: 'start DFS',
                tooltipText: 'start depth first search at this node',
                selector: 'node',
                onClickFunction: (event) => {
                    cy.elements().unselect();
                    let tg = event.target || event.cyTarget;
                    tg.select();
                    depthFirstSearch();
                }
            }
        ]
    });
}
/**
 * @function
 * @param {object} c
 * @public
 * @return void
 * */
function initCircularMenu(c) {
    c.cxtmenu({
        menuRadius: 75,
        activePadding: 10,
        selector: 'node',
        commands: [
            {
                content: '<i class="fa fa-road fa-2x" aria-hidden="true"></i>',
                select: (ele) => {
                    ele.select();
                    addEdgeBetweenSelected();
                }
            },
            {
                content: '<i class="fa fa-trash fa-2x" aria-hidden="true"></i>',
                select: (ele) => {
                    cy.remove(ele);
                    if (auto_refresh.checked)
                        cyReLayout();
                }
            },
            {
                content: 'BFS',
                select: (ele) => {
                    cy.elements().unselect();
                    ele.select();
                    breadthFirstSearch();
                }
            },
            {
                content: 'DFS',
                select: (ele) => {
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
                select: (ele) => {
                    cy.remove(ele);
                    if (auto_refresh.checked)
                        cyReLayout();
                }
            },
            {
                content: '<i class="fa fa-plus fa-2x" aria-hidden="true"></i>',
                select: (ele) => {
                    duplicateEdge(ele, cy);
                }
            },
            {
                content: '<i class="fa fa-tag fa-2x" aria-hidden="true"></i>',
                select: (ele) => {
                    let weight = parseInt(prompt("Please enter a weight for this edge.", "1"));
                    if (!isNaN(weight))
                        ele.data('weight', weight);
                    else
                        ele.data('weight', '');
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
                    cy.remove(cy.elements(':selected'))
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
            },
            {
                content: '<i class="fa fa-external-link fa-2x" aria-hidden="true"></i>',
                select: () => {
                    if (drawOn)
                        c.edgehandles('drawoff');
                    else
                        c.edgehandles('drawon');
                    drawOn = !drawOn;
                }
            }
        ]
    });
}

/**
 * @function
 * @param {boolean} random
 * @param {object} position
 * @public
 * @return void
 * */
function addNode(random, position) {
    stopAnimation();
    let t = document.getElementById('nid');
    let num = parseInt(t.value);
    num = isNaN(num) ? 1 : num < 1 ? 1 : num;
    for (let i = 0; i < num; i++)
        addOneNode(random, position);
    if (auto_refresh.checked)
        cyReLayout();
}

/**
 * @function
 * @param {boolean} random
 * @param {object} position
 * @public
 * @return {object} the added node
 * */
function addOneNode(random, position) {
    let v = 1;
    while (cy.$id(v + '').length !== 0)
        v += 1;
    if (random)
        return cy.add({
            group: 'nodes',
            data: {id: v},
            position: {
                x: parseInt(Math.random() * 500 + 25), y: parseInt(Math.random() * 500 + 25)
            }
        });
    else {
        if (position === null)
            return cy.add({
                group: 'nodes',
                data: {id: v}
            });
        else
            return cy.add({
                group: 'nodes',
                data: {id: v},
                position: position
            });
    }
}
/**
 * @function
 * @public
 * @return void
 * */
function addEdge() {
    stopAnimation();
    let src_tg = document.getElementById('src_tg');
    let s = src_tg.value;
    let ns = s.split('-');
    let n1 = ns[0];
    let n2 = ns[1];
    let num = ns[2] === undefined ? 1 : (isNaN(parseInt(ns[2])) ? 1 : parseInt(ns[2]));
    if (num < 1) num = 1;
    let v = 0;
    let id_pre = n1 + '-' + n2 + '-';
    for (let i = 0; i < num; i++) {
        while (cy.$id(id_pre + v).length !== 0)
            v += 1;
        cy.add({
            group: 'edges',
            data: {
                id: id_pre + v,
                source: n1,
                target: n2,
                weight: parseInt(weight_input.value)
            }
        });
    }
    if (auto_refresh.checked)
        cyReLayout();
}
/**
 * @function
 * @public
 * @param {object} c
 * @param {boolean} flag
 * @return void
 * */
function snapToGrid(c, flag) {
    if (flag) {
        c.snapToGrid('snapOn');
        c.snapToGrid('gridOn');
    }
    else {
        c.snapToGrid('snapOff');
        c.snapToGrid('gridOff');
    }
}
/**
 * @function
 * @public
 * @param {int} idx
 * @return void
 * */
function changeLayout(idx) {
    let name = document.getElementById('layout').options[idx].value;
    if (name === 'snapToGrid') {
        snapToGrid(cy, true);
        snapToGrid(ca, true);
        layoutname = '';
    }
    else {
        snapToGrid(cy, false);
        snapToGrid(ca, false);
        layoutname = name;
    }
    reLayout();
}
/**
 * @function
 * @public
 * @return void
 * */
function reLayout() {
    cyReLayout();
    caReLayout();
}
/**
 * Rerun the layout for the graph and recalculate its total weight
 * @function
 * @public
 * @return void
 * */
function cyReLayout() {
    let totalWeight = 0;
    for (let i = 0; i < cy.edges().length; i++)
        totalWeight += getWeight(cy.edges()[i]);
    document.getElementById('cy_weight').innerHTML = totalWeight.toString();
    if (CyLayout !== undefined)
        CyLayout.stop();
    if (layoutname === '')
        return;
    CyLayout = cy.layout(layout_options[layoutname]);
    CyLayout.run();
}
/**
 * Rerun the layout for the graph and recalculate its total weight
 * @function
 * @public
 * @return void
 * */
function caReLayout() {
    let totalWeight = 0;
    for (let i = 0; i < ca.edges().length; i++)
        totalWeight += getWeight(ca.edges()[i]);
    document.getElementById('ca_weight').innerHTML = totalWeight.toString();
    if (CaLayout !== undefined)
        CaLayout.stop();
    if (layoutname === '')
        return;
    CaLayout = ca.layout(layout_options[layoutname]);
    CaLayout.run();
}
/**
 * @function
 * @public
 * @return void
 * */
function removeNode() {
    stopAnimation();
    let n_id = document.getElementById('nodeid');
    let v = n_id.value;
    let ids = v.split(',');
    if (ids.length === 1) {
        let range = v.split('-');
        if (range.length === 1)
            cy.remove(cy.nodes().$id(v));
        else {
            let lower = parseInt(range[0]);
            let upper = parseInt(range[1]);
            for (let v = lower; v <= upper; v++)
                cy.remove(cy.$id(v));
        }
    }
    else {
        for (let v = 0; v < ids.length; v++)
            cy.remove(cy.$id(parseInt(ids[v])));
    }
    n_id.value = "";
    if (auto_refresh.checked)
        cyReLayout();
}
/**
 * @function
 * @public
 * @return void
 * */
function removeEdge() {
    stopAnimation();
    let rid = document.getElementById('r_src_tg');
    let v = rid.value;
    let n = v.split('-');
    if (n[1] === undefined) return;
    let l = n[2] === undefined ? 1 : parseInt(n[2]);
    let eles = cy.edges("[id ^='" + n[0] + '-' + n[1] + "-']");
    let numToRemove = l > eles.length ? eles.length : l;
    for (let i = 0; i < numToRemove; i++)
        cy.remove(eles[i]);
    if (auto_refresh.checked)
        cyReLayout();
}
/**
 * @public
 * @function
 * @param {object} edge
 * @param {object} c
 * @return {object}
 * */
function duplicateEdge(edge, c) {
    let temp = edge.data('id').split('-');
    let last = 0;

    // make sure that the id of an edge is not duplicated
    while (c.$id(temp[0] + '-' + temp[1] + '-' + last).length !== 0)
        last += 1;

    return c.add({
        group: 'edges',
        data: {
            id: temp[0] + '-' + temp[1] + '-' + last,
            source: temp[0],
            target: temp[1],
            weight: edge.data('weight')
        }
    });
}
/**
 * @function
 * @public
 * @return void
 * */
function removeSelected() {
    stopAnimation();
    cy.remove(cy.$(':selected'));
    if (auto_refresh.checked)
        cyReLayout();
}
/**
 * @function
 * @public
 * @return void
 * */
function addEdgeBetweenSelected() {
    stopAnimation();
    let nodes = cy.nodes(':selected');
    let weight = parseInt(weight_input.value);
    let x = nodes.length;
    if (x > 1)
        for (let i = 0; i < nodes.length; i++)
            for (let j = i + 1; j < nodes.length; j++)
                addEdgeBwt(nodes[i].data('id'), nodes[j].data('id'), weight);
    else if (x === 1)
        addEdgeBwt(nodes[0].data('id'), nodes[0].data('id'), weight);
    if (auto_refresh.checked)
        cyReLayout();
}
/**
 * @function
 * @public
 * @param {string} src
 * @param {string} tg
 * @param {int} w
 * @return {object} the edge added
 * */
function addEdgeBwt(src, tg, w) {
    let id_pre = src + '-' + tg + '-';
    let x = 0;
    while (cy.$id(id_pre + x).length !== 0)
        x += 1;
    return cy.add({group: 'edges', data: {id: id_pre + x, source: src, target: tg, weight: w}});
}
/**
 * @function
 * @public
 * @param {object} edge
 * @return {int} weight
 * */
function getWeight(edge) {
    let weight = edge.data('weight');
    return isNaN(weight) ? 1 : weight;
}
/**
 * given a node and the edge connected to it,
 * get the other node
 * @function
 * @public
 * @param {object} node
 * @param {object} edge
 * @return {object} the target node
 * */
function getTarget(node, edge) {
    let targetNode;
    if (edge.data('source') === node.data('id'))
        targetNode = cy.$id(edge.data('target'));
    else
        targetNode = cy.$id(edge.data('source'));
    return targetNode;
}
/**
 * @function
 * @public
 * @param {object} node
 * @param {object} edge
 * @return {object} the target node
 * */
function getCaTarget(node, edge) {
    let targetNode;
    if (edge.data('source') === node.data('id'))
        targetNode = ca.$id(edge.data('target'));
    else
        targetNode = ca.$id(edge.data('source'));
    return targetNode;
}
/**
 * @function
 * @public
 * @return void
 * */
function clearSource() {
    stopAnimation();
    cy.remove(cy.elements());
    document.getElementById('cy_weight').innerHTML = '';
}
/**
 * @function
 * @public
 * @return void
 * */
function clearResult() {
    stopAnimation();
    ca.remove(ca.elements());
    document.getElementById('ca_weight').innerHTML = '';
    document.getElementById('path').innerHTML = '';
}
/**
 * @function
 * @public
 * @return void
 * */
function stopAnimation() {
    cy.elements().stop();
    ca.elements().stop();
    animationFlag = false;
}
/**
 * @function
 * @public
 * @return void
 * */
function readAM() {
    clearCyStyle();
    createFromAM(eval(matrix_input.value));
}
/**
 * @function
 * @public
 * @return void
 * */
function readWM() {
    clearCyStyle();
    createFromWM(eval(matrix_input.value));
}
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
    if (layoutname === '')
        for (let i = 1; i <= numOfNodes; i++)
            cy.add({
                group: 'nodes',
                data: {id: i},
                position: {
                    x: (Math.random() * 250 + 25),
                    y: (Math.random() * 250 + 25)
                }
            });
    else
        for (let i = 1; i <= numOfNodes; i++)
            cy.add({
                group: 'nodes',
                data: {id: i}
            });

    for (let i = 0; i < numOfNodes; i++)
        for (let j = 0; j < numOfNodes; j++)

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
    if (layoutname === '')
        for (let i = 1; i <= numOfNodes; i++)
            cy.add({
                group: 'nodes',
                data: {id: i},
                position: {
                    x: (Math.random() * 250 + 25),
                    y: (Math.random() * 250 + 25)
                }
            });
    else
        for (let i = 1; i <= numOfNodes; i++)
            cy.add({
                group: 'nodes',
                data: {id: i}
            });
    for (let i = 0; i < numOfNodes; i++)
        for (let j = 0; j < numOfNodes; j++)
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
        let pConnected = parseFloat(prompt("Please specify the propability that two nodes are connected.\nRange: 0 to 1", "0.25"));
        if (weighted) {
            let weightRange = prompt("Please specify the weight range.\nExample: 1-5 represents range from 1 to 5.\n Lower limit must be greater than 0.", "1-4");
            let temp = weightRange.split('-');
            let lower = parseInt(temp[0]) > 0 ? parseInt(temp[0]) : 1;
            let range = parseInt(temp[1]) >= lower ? parseInt(temp[1]) - lower + 1 : lower + 4;
            for (let i = 0; i < numOfNodes; i++)
                for (let j = 0; j < numOfNodes; j++) {
                    if (i !== j) {
                        if (Math.random() < pConnected)
                            matrix[i][j] = Math.floor(Math.random() * range + lower);
                        else
                            matrix[i][j] = 0;
                    }
                }
            createFromWM(matrix);
        }
        else {
            for (let i = 0; i < numOfNodes; i++)
                for (let j = 0; j < numOfNodes; j++) {
                    if (i !== j) {
                        if (Math.random() < pConnected)
                            matrix[i][j] = 1;
                        else
                            matrix[i][j] = 0;
                    }
                }
            createFromAM(matrix);
        }
    }
    else {
        let nMultiple = parseInt(prompt("Please specify the max number of edges connecting two nodes.\nRange: 2 to infinity", "2"));
        let pMultiple = parseFloat(prompt("Please specify the the probability of having multiple edges", "0.25"));
        for (let i = 0; i < numOfNodes; i++) {
            for (let j = 0; j < numOfNodes; j++) {
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
            for (let j = 0; j < numOfNodes; j++)
                if (i !== j)
                    matrix[i][j] = parseInt(Math.random() * range + lower);
        }
        createFromWM(matrix);
    }
    else {

        // fill in the half above the major diagonal (exclude major diagonal) with 1
        for (let i = 0; i < numOfNodes; i++) {
            matrix[i] = new Array(numOfNodes);
            for (let j = 0; j < numOfNodes; j++)
                if (i !== j)
                    matrix[i][j] = 1;
        }
        createFromAM(matrix);
    }
}

// /**
//  * generate a complete bipartile graph by first generating its adjacency matrix
//  * @function
//  * @public
//  * @return void
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
//
//     let weightRange = prompt("Please specify the weight range.\nLeave this blank if you want an unweighted graph.\nExample: 1-5 represents range from 1 to 5.\nLower limit must be greater than 0.", "");
//     if (weightRange.length > 0) {
//         let temp = weightRange.split('-');
//         let lower = parseInt(temp[0]) > 0 ? parseInt(temp[0]) : 1;
//
//         // upper bound must be greater than the lower bound...
//         let range = parseInt(temp[1]) > lower ? parseInt(temp[1]) : lower + 4;
//
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
 * @return {object|undefined} The first node (selected or entered)
 * */
function getCyStartNode(prompt_text, default_value) {
    let root = cy.nodes(':selected');
    if (root.length <= 0) {
        root = cy.$id(prompt(prompt_text, default_value));
        if (root.length <= 0)
            return undefined;
    }
    else
        root = root[0];
    return root;
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
    cy.elements().unselect();
    let path = cy.elements().bfs({root: root, directed: true}).path;
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
    cy.elements().unselect();
    let path = cy.elements().dfs({root: root, directed: true}).path;
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
// /**
//  * Kruskal is implemented in the library
//  * @function
//  * @public
//  * @return void
//  * */
// function performKruskal() {
//     stopAnimation();
//     clearCyStyle();
//     cy.elements().unselect();
//     let spanningTree = cy.elements().kruskal(getWeight);
//     clearResult();
//     ca.add(spanningTree);
//     spanningTree.select();
//     caReLayout();
//     let pathList = new LinkedList();
//     spanningTree.forEach((ele)=> {
//         if (ele.isEdge()) {
//             pathList.add(ele);
//             if (pathList.search((e) => {
//                     return e.data('id') === ele.source().data('id');
//                 }) === null) {
//                 pathList.add(ele.source());
//             }
//             if (pathList.search((e) => {
//                     return e.data('id') === ele.target().data('id');
//                 }) === null) {
//                 pathList.add(ele.target());
//             }
//         }
//     });
//     pathList.traverse(animation.checked, false);
// }
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
        path = cy.elements().dijkstra({
            root: nodes[0],
            weight: getWeight,
            directed: true
        }).pathTo(nodes[1]);
    }
    else {
        let p = prompt("Please enter the id of source and target nodes, src-tg.\nExample: 1-2", "");
        let pt = p.split('-');
        path = cy.elements().dijkstra('#' + pt[0], getWeight, true).pathTo('#' + pt[1]);
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
 * convert a RGB array to a hexadecimal string
 * @public
 * @function
 * @param {Array} color
 * @return string
 * */
function colorRGB2Hex(color) {
    let r = color[0];
    let g = color[1];
    let b = color[2];
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Jet colormap from Matlab
 * */
const jetMap = [[0, 0, 143], [0, 0, 159], [0, 0, 175], [0, 0, 191], [0, 0, 207], [0, 0, 223], [0, 0, 239], [0, 0, 255], [0, 16, 255], [0, 32, 255], [0, 48, 255], [0, 64, 255], [0, 80, 255], [0, 96, 255], [0, 112, 255], [0, 128, 255], [0, 143, 255], [0, 159, 255], [0, 175, 255], [0, 191, 255], [0, 207, 255], [0, 223, 255], [0, 239, 255], [0, 255, 255], [16, 255, 239], [32, 255, 223], [48, 255, 207], [64, 255, 191], [80, 255, 175], [96, 255, 159], [112, 255, 143], [128, 255, 128], [143, 255, 112], [159, 255, 96], [175, 255, 80], [191, 255, 64], [207, 255, 48], [223, 255, 32], [239, 255, 16], [255, 255, 0], [255, 239, 0], [255, 223, 0], [255, 207, 0], [255, 191, 0], [255, 175, 0], [255, 159, 0], [255, 143, 0], [255, 128, 0], [255, 112, 0], [255, 96, 0], [255, 80, 0], [255, 64, 0], [255, 48, 0], [255, 32, 0], [255, 16, 0], [255, 0, 0], [239, 0, 0], [223, 0, 0], [207, 0, 0], [191, 0, 0], [175, 0, 0], [159, 0, 0], [143, 0, 0], [128, 0, 0]];
const jetMapHex = ['#00008f', '#00009f', '#0000af', '#0000bf', '#0000cf', '#0000df', '#0000ef', '#0000ff', '#0010ff', '#0020ff', '#0030ff', '#0040ff', '#0050ff', '#0060ff', '#0070ff', '#0080ff', '#008fff', '#009fff', '#00afff', '#00bfff', '#00cfff', '#00dfff', '#00efff', '#00ffff', '#10ffef', '#20ffdf', '#30ffcf', '#40ffbf', '#50ffaf', '#60ff9f', '#70ff8f', '#80ff80', '#8fff70', '#9fff60', '#afff50', '#bfff40', '#cfff30', '#dfff20', '#efff10', '#ffff00', '#ffef00', '#ffdf00', '#ffcf00', '#ffbf00', '#ffaf00', '#ff9f00', '#ff8f00', '#ff8000', '#ff7000', '#ff6000', '#ff5000', '#ff4000', '#ff3000', '#ff2000', '#ff1000', '#ff0000', '#ef0000', '#df0000', '#cf0000', '#bf0000', '#af0000', '#9f0000', '#8f0000', '#800000'];
/**
 * perform page rank
 * @public
 * @function
 * @return void
 * */
function pageRank() {
    const len = cy.nodes().length;
    const basicSize = 250;
    const delSize = 15;
    let rank = cy.elements().pageRank({
        dampingFactor: 0.85,
        precision: 1e-4
    });
    let ranks = new Array(cy.nodes().length);
    cy.nodes().forEach((n) => {
        ranks.push(rank.rank(n));
    });
    let min = _.min(ranks);
    let max = _.max(ranks);
    let rg = max - min;
    cy.nodes().forEach((n) => {
        let r = rank.rank(n);
        let size = Math.round((basicSize + delSize * len) * r);
        n.animate({
            style: {
                width: size + 'px',
                height: size + 'px',
                backgroundColor: jetMapHex[Math.floor((r - min) / rg * 63)]
            },
            duration: 1000
        });
        n.style({
            fontSize: 13 + Math.floor(Math.pow(size, 0.33)) + 'px',
            label: n => `${n.data('id')}\n${(rank * 100).toFixed(2)}%`,
            textWrap: 'wrap',
            textValign: 'top',
        })
    });
}
/**
 * perform detailed page rank
 * @public
 * @function
 * @return void
 * */
function myPageRank() {
    /**
     * @type {Number} damping factor d
     * */
    const dpFactor = 0.85;
    /**
     * @type {Number} minimal difference ε
     * */
    const minimalDifference = 1e-4;
    const nodes = cy.nodes();
    const len = nodes.length;
    const outEdgeStats = new Array(len);
    /**
     * @type {Array} adjacency matrix
     * */
    const adjacencyMatrix = getAM(cy, false);
    /**
     * @type {int} basic size of nodes in pixels
     * */
    const basicSize = 250;
    const delSize = 15;

    /**
     * @type {Number} (1 - d) / N
     * */
    const tailNumber = (1 - dpFactor) / len;
    const animationDuration = Math.round(+duration.value);
    const normalizeInMiddle = false;

    /**
     * @type {int} no-animation calculation method
     * 1 -> iterative
     * 2 -> matrix-iterative
     * 3 -> algebraic
     * */
    const NACM = 2;
    animationFlag = true;

    nodes.forEach((n, i) => {
        outEdgeStats[i] = n.outgoers('edge').length;
    });

    // initial rankings
    let ranks = new Array(len);
    for (let i = 0; i < len; i++)
        ranks[i] = 1 / len;

    /**
     * find the maximum and minimum anomg the vector of ranks
     * @param {Array} ranks
     * @return Array
     * */
    function findMinAndMax(ranks) {
        let min = Infinity;
        let max = 0;
        for (let i = 0; i < len; i++) {
            if (ranks[i] < min)
                min = ranks[i];
            if (ranks[i] > max)
                max = ranks[i];
        }
        return [min, max];
    }

    /**
     * @param {int} size
     * @param {string} color
     * @return Object
     * */
    function getAnimationStyle(size, color) {
        return {
            width: size + 'px',
            height: size + 'px',
            backgroundColor: color
        };
    }

    /**
     * @param {int} size
     * @param {Number} rank
     * @return Object
     * */
    function getLabelStyle(size, rank) {
        let fs = 13 + Math.floor(Math.pow(size, 0.33));
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
            fontSize: fs + 'px',
            label: n => `${n.data('id')}\n${(rank * 100).toFixed(2)}%`,
            textWrap: 'wrap',
            textValign: 'top',
        }
    }

    /**
     * @param {Array} ranks
     * @param {int} duration
     * @param {function} callback
     * */
    function animateNodes(ranks, duration, callback = () => {
    }) {
        let [min, max] = findMinAndMax(ranks);
        min -= 0.00001;
        let range = max - min;
        nodes.forEach((n, i) => {
            let r = ranks[i];
            let size = Math.round((basicSize + delSize * len) * r);
            n.animate({
                style: getAnimationStyle(size, jetMapHex[Math.floor((r - min) / range * 63)]),
                duration: duration,
                complete: callback
            });
            n.style(getLabelStyle(size, r));
        });
    }

    /**
     * @param {int} i index of current node
     * @param {Array} cRanks current PR
     * @param {Array} pRanks previous PR
     * @param {int} t iteration index
     * */
    function call(t, i, cRanks, pRanks) {
        cy.edges().removeStyle();
        processDiv.innerHTML = `Iteration ${t}, Calculating PR for node ${i + 1}`;
        let del = 0;
        let edges = undefined;
        for (let j = 0; j < len; j++) {
            if (i !== j) {

                // if outbounds from node j to i exist
                if (adjacencyMatrix[j][i] > 0) {

                    // calculate the transferred page rank
                    // += PR(j) / L(p_j)
                    let tpr = pRanks[j] * adjacencyMatrix[j][i] / outEdgeStats[j];
                    del += tpr;

                    // get the outbound edge of node j (pointing to node i)
                    let es = cy.$('[id^="' + nodes[j].data('id') + '-' + nodes[i].data('id') + '-' + '"]');
                    es.data('tpr', (tpr * 100).toFixed(1) + '%');

                    // collect these edges
                    edges = (edges === undefined ? es : edges.union(es));
                }
            }
        }
        if (edges !== undefined) {
            // show the transferred weight on the edge
            edges.style({
                textRotation : 'autorotate',
                label: e => e.data('tpr'),
                fontSize: '16px',
                color: '#c20b00',
                fontWeight : 'bold'
            });
            // animate this edge
            edges.animate({
                style: {lineColor: '#00e3ff', width: '6'},
                duration: Math.round(animationDuration * 0.8),
            }).animate({
                style: {lineColor: '#ccc', width: '2'},
                duration: Math.round(animationDuration * 0.2),
            });
        }
        if (animationFlag) {

            // calculate the new PR value for node i
            let r = del * dpFactor + tailNumber;
            cRanks[i] = r;

            // find min and max in current rank vector
            let [min, max] = findMinAndMax(cRanks);

            // reduce min a little to avoid division by 0
            min -= 0.0001;

            // calculate the range of PR value for mapping colors
            let rg = max - min;
            let size = Math.round((basicSize + delSize * len) * r);

            // animate this node (show its size increase/decrease)
            setTimeout(() => {
                nodes[i].style(getLabelStyle(size, r));
                nodes[i].animate({
                    style: getAnimationStyle(size, jetMapHex[Math.floor((r - min) / rg * 63)]),
                    duration: animationDuration,
                    complete: () => {
                        if (animationFlag) {
                            i += 1;

                            // continue to calculate PR value of next nodes if current iteration not finished
                            if (i < len) {
                                call(t, i, cRanks, pRanks);
                            }
                            // go to next iteration
                            else {
                                // normalize PR right after each iteration
                                if (normalizeInMiddle) {
                                    processDiv.innerHTML = 'Normalizing PR values...';
                                    cy.edges().removeStyle();
                                    cRanks = normalize(cRanks);
                                    animateNodes(cRanks, animationDuration, () => {
                                        cy.elements().stop();
                                        setTimeout(() => {
                                            // continue to iterate if not converged
                                            if (math.norm(math.subtract(pRanks, cRanks)) > minimalDifference)
                                                call(t + 1, 0, cRanks, cRanks.concat());
                                            else {
                                                processDiv.innerHTML = 'Done!';
                                            }
                                        }, 10);
                                    });
                                }
                                // normalize PR values after completion
                                else {
                                    if (math.norm(math.subtract(pRanks, cRanks)) > minimalDifference)
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
                        }
                    }
                }, 10);
            })
        }
    }

    /**
     * @param {Array|Object} v
     * @return Array|Object
     * */
    function normalize(v) {
        let sum = math.sum(v);
        return v.map(val => val / sum);
    }

    if (animation.checked) {
        nodes.forEach((n, i) => {
            let r = 1 / len;
            let size = Math.round((basicSize + delSize * len) * r);
            n.style(getLabelStyle(size, r));
            n.animate({
                style: getAnimationStyle(size, colorRGB2Hex([128, 255, 128])),
                duration: animationDuration,
                complete: () => {
                    if (i === len - 1)
                        call(1, 0, ranks, ranks.concat());
                }
            });
        });
    }
    else {
        /**
         * Iterative implementation
         * */
        if (NACM === 1) {
            let pRanks; // previous ranks
            do {
                pRanks = ranks;
                let newRanks = ranks.concat();
                for (let i = 0; i < len; i++) {
                    let sum = 0;
                    for (let j = 0; j < len; j++)
                        if (i !== j && adjacencyMatrix[j][i] > 0)
                            sum += ranks[j] * adjacencyMatrix[j][i] / outEdgeStats[j];
                    newRanks[i] = sum * dpFactor + tailNumber;
                }
                if (normalizeInMiddle)
                    ranks = normalize(newRanks);
                else
                    ranks = newRanks;
            }
            while (math.norm(math.subtract(ranks, pRanks)) > minimalDifference);
            if (!normalizeInMiddle) ranks = normalize(ranks);
        }
        /**
         * Matrix implementation
         * */
        else if (NACM === 2) {
            let rankVector = math.multiply(math.ones(len), 1 / len);
            let outMatrix = math.zeros(len, len);
            for (let i = 0; i < len; i++)
                for (let j = 0; j < len; j++)
                    if (adjacencyMatrix[i][j] > 0)
                        outMatrix = math.subset(outMatrix, math.index(i, j), 1 / outEdgeStats[i]);
            let pRankVector;
            do {
                pRankVector = math.clone(rankVector);
                rankVector = math.add(math.multiply(math.multiply(rankVector, outMatrix), dpFactor), tailNumber);
            }
            while (math.norm(math.subtract(rankVector, pRankVector)) > minimalDifference);
            ranks = normalize(rankVector.toArray());
        }
        /**
         * Algebraic implementation
         * This one does not yield correct result
         * */
        else if (NACM === 3) {
            let outMatrix = math.zeros(len, len);
            for (let i = 0; i < len; i++)
                for (let j = 0; j < len; j++)
                    if (adjacencyMatrix[i][j] > 0)
                        outMatrix = math.subset(outMatrix, math.index(i, j), 1 / outEdgeStats[i]);
            // let K = math.diag(math.matrix(outEdgeStats));
            // let outMatrix = math.transpose(math.multiply(math.inv(K), math.matrix(adjacencyMatrix)));
            // console.log(outMatrix);
            ranks = normalize(math.multiply(math.inv(math.subtract(math.eye(len, len), math.multiply(dpFactor, outMatrix))), math.multiply(math.ones(len), tailNumber)).toArray());
        }
        animateNodes(ranks, 1000);
    }
}

// /**
//  * a detailed implementation of Dijkstra's algorithm, showing every step
//  * @function
//  * @public
//  * @return void
//  * */
// function myDijkstra() {
//     /**
//      * @function
//      * @private
//      * @param {object} node
//      * @callback
//      * @param {function} callback
//      * the function to execute after completion of animation
//      * @return void
//      * */
//     function animateNode(node, callback) {
//         if (node !== undefined && node.length > 0)
//             node.animate({
//                 style: {backgroundColor: '#f185dc', width: '30px', height: '30px'},
//                 duration: Math.round(+duration.value * 0.1),
//                 queue: true
//             }).animate({
//                 style: {backgroundColor: '#de4400', width: '20px', height: '20px'},
//                 duration: Math.round(+duration.value * 0.4),
//                 queue: true,
//                 complete: callback
//             });
//         else
//             callback();
//     }
//
//     /**
//      * @function
//      * @private
//      * @param {object} edge
//      * @callback
//      * @param {function} callback
//      * the function to execute after completion of animation
//      * @return void
//      * */
//     function animateEdge(edge, callback) {
//         if (edge !== undefined && edge.length > 0)
//             edge.animate({
//                 style: {lineColor: '#f185dc', width: '6'},
//                 duration: Math.round(+duration.value * 0.2),
//                 queue: true
//             }).animate({
//                 style: {lineColor: '#de4400', width: '3'},
//                 duration: Math.round(+duration.value * 0.8),
//                 queue: true,
//                 complete: callback
//             });
//         else
//             callback();
//     }
//
//     /**
//      * @function
//      * @private
//      * @param {object} node
//      * @callback
//      * @param {function} callback
//      * the function to execute after completion of animation
//      * @return void
//      * */
//     function animateLabel(node, callback) {
//         if (node !== undefined && node.length > 0)
//             node.animate({
//                 style: {textBackgroundColor: 'yellow', textBackgroundOpacity: 1},
//                 duration: Math.round(+duration.value * 0.4),
//                 queue: true
//             }).delay(+duration.value * 0.2).animate({
//                 style: {textBackgroundColor: 'yellow', textBackgroundOpacity: 0},
//                 duration: Math.round(+duration.value * 0.4),
//                 queue: true,
//                 complete: callback
//             });
//         else
//             callback();
//     }
//
//     /**
//      * @function
//      * @private
//      * @param {object} current
//      * @return void
//      * */
//     function traceBack(current) {
//         // animate current node
//         current.animate({
//             style: {backgroundColor: '#eae90f', width: '30px', height: '30px'},
//             duration: Math.round(+duration.value * 0.15),
//             queue: true
//         }).animate({
//             style: {backgroundColor: 'green', width: '20px', height: '20px'},
//             duration: Math.round(+duration.value * 0.6),
//             queue: true,
//             complete: ()=> {
//                 // select the current node
//                 current.select();
//
//                 // acquire the previous node
//                 let previous = current.data('previous');
//
//                 // if we haven't reached the starting node
//                 if (previous !== undefined) {
//                     previous = ns.$id(previous);
//
//                     // get the edge connecting these two nodes and animate it
//                     let e = previous.edgesWith(current);
//                     e.animate({
//                         style: {lineColor: '#eae90f', width: '6'},
//                         duration: Math.round(+duration.value * 0.2),
//                         queue: true
//                     }).animate({
//                         style: {lineColor: 'green', width: '3'},
//                         duration: Math.round(+duration.value * 0.8),
//                         queue: true,
//
//                         // when the animation completes:
//                         // select the edge and keep tracing backward
//                         complete: ()=> {
//                             e.select();
//                             traceBack(previous);
//                         }
//                     });
//                 }
//                 else {
//                     clearResult();
//                     ca.add(cy.$(':selected'));
//                     caReLayout();
//                     ns.removeData('previous');
//                 }
//             }
//         });
//     }
//
//     /**
//      * @function
//      * @private
//      * @param {object} currentNode
//      * current node with a permanent label
//      * @param {object} edges
//      * all edges connect to n
//      * @param {int} i
//      * the index of the edge that we're up to
//      * @return void
//      * */
//     function addNextLabel(currentNode, edges, i) {
//         // get the value of the permanent label
//         let weight = currentNode.data('permanent');
//
//         // if the index is out of bound, then...
//         if (i >= edges.length) {
//
//             // get the minimum among all nodes with temporary labels but without permanent labels
//             // the node with this minimal label will be assigned with a permanent label
//             let minW = Infinity;
//             let nextPermanent;
//             ns.forEach((node)=> {
//                 let tempLabels = node.data('temporary');
//                 if (tempLabels.length > 0 && node.data('permanent') === undefined) {
//                     if (tempLabels[tempLabels.length - 1] < minW || (tempLabels[tempLabels.length - 1] === minW && node.data('id') === target.data('id'))) {
//                         minW = tempLabels[tempLabels.length - 1];
//                         nextPermanent = node;
//                     }
//                 }
//             });
//
//             // callbacks... and callbacks...
//             // animate this node...
//             animateNode(nextPermanent, ()=> {
//
//                 // assign a permanent label to this node
//                 nextPermanent.data('permanent', minW);
//                 nextPermanent.style({
//                     textBorderOpacity: 1,
//                     textBorderWidth: '1px',
//                     textBorderStyle: 'dashed',
//                     textBorderColor: 'green'
//                 });
//
//                 // connect this node with the previous node with a permanent label
//                 let edgeBetween = nextPermanent.edgesWith(cy.$id(nextPermanent.data('previous')));
//
//                 // animate the edge
//                 animateEdge(edgeBetween, ()=> {
//
//                     // if the target node haven't got a permanent label
//                     if (target.data('permanent') === undefined)
//
//                     // continue to label...
//                         addNextLabel(nextPermanent, nextPermanent.connectedEdges(), 0);
//
//                     // else: now we can trace the walk, back from the target to the start
//                     else {
//                         traceBack(nextPermanent);
//                     }
//                 });
//             });
//         }
//         else {
//             // the current edge
//             let edge = edges[i];
//
//             // get the weight of the target node
//             let node = getTarget(currentNode, edge);
//             let nodeWeight = getWeight(edge) + weight;
//
//             // if the target node is not yet permanently labeled
//             if (node.data('permanent') === undefined) {
//
//                 // animate this edge
//                 animateEdge(edge, ()=> {
//
//                     // if the target node doesn't have a temporary label,
//                     // or the new weight is lower than the current label
//                     // update the label
//                     let tempLabels = node.data('temporary').concat();
//                     if (tempLabels.length === 0 || tempLabels[tempLabels.length - 1] > nodeWeight) {
//                         animateNode(node, ()=> {
//                             tempLabels.push(nodeWeight);
//                             node.data('temporary', tempLabels);
//                             node.data('previous', currentNode.data('id'));
//                         });
//                         animateLabel(node, ()=> {
//                             node.style({backgroundColor: '', width: '', height: ''});
//                             edge.removeStyle();
//
//                             // keep labelling...
//                             addNextLabel(currentNode, edges, i + 1);
//
//                         });
//                     }
//                     else {
//                         edge.removeStyle();
//                         addNextLabel(currentNode, edges, i + 1);
//                     }
//                 });
//             }
//             // skip this node if it has got a permanent label
//             else {
//                 addNextLabel(currentNode, edges, i + 1);
//             }
//         }
//     }
//
//     if (!isConnected()) {
//         alert("This graph is not connected!");
//         return;
//     }
//     let root;
//     let target;
//     let ns = cy.nodes();
//     let temp = cy.nodes(':selected');
//     if (temp.length >= 2) {
//         root = temp[0];
//         target = temp[1];
//     }
//     else {
//         temp = prompt("Please enter the id of source and target nodes, src-tg.\nExample: 1-2", "");
//         let p = temp.split('-');
//         root = cy.$id(p[0]);
//         target = cy.$id(p[1]);
//         if (root.length <= 0 || target.length <= 0)
//             return;
//     }
//     clearCyStyle();
//
//     // set all labels to undefined
//     ns.data('temporary', []);
//     ns.removeData('permanent');
//     ns.removeData('previous');
//
//     // set the label function
//     // format: "id|temporary labels|permanent label"
//     cy.style().selector('node').style({
//         label: (n)=> {
//             let temporary = n.data('temporary');
//             let l = temporary.length - 1;
//             let tempLabels = '';
//             if (l > -1) {
//                 tempLabels += '|';
//                 for (let i = 0; i < l; i++)
//                     tempLabels += temporary[i] + '>';
//                 tempLabels += temporary[l];
//             }
//             return n.data('id') + tempLabels + (isNaN(n.data('permanent')) ? '' : '|' + n.data('permanent'));
//         }
//     });
//
//     // give the starting node a permanent label
//     let currentNode = root;
//     currentNode.data('permanent', 0);
//     currentNode.data('temporary', [0]);
//
//     if (animation.checked) {
//         currentNode.style({
//             textBorderOpacity: 1,
//             textBorderWidth: '1px',
//             textBorderStyle: 'dashed',
//             textBorderColor: 'green'
//         });
//         // start the whole algorithm
//         animateNode(currentNode, ()=> {
//             addNextLabel(currentNode, currentNode.connectedEdges(), 0);
//         });
//     }
//     // same story as the above, but without animation
//     // looks nicer, no awful callbacks
//     else {
//         while (target.data('permanent') === undefined) {
//             let edges = currentNode.connectedEdges();
//             let weight = currentNode.data('permanent');
//             edges.forEach((edge)=> {
//                 let node = getTarget(currentNode, edge);
//                 let nodeWeight = getWeight(edge) + weight;
//                 if (node.data('permanent') === undefined) {
//                     let tempLabels = node.data('temporary').concat();
//                     if (tempLabels.length === 0 || tempLabels[tempLabels.length - 1] > nodeWeight) {
//                         tempLabels.push(nodeWeight);
//                         node.data('temporary', tempLabels);
//                         node.data('previous', currentNode.data('id'));
//                     }
//                 }
//             });
//             let minW = Infinity;
//             let nextPermanent;
//             ns.forEach((node)=> {
//                 let tempLabels = node.data('temporary');
//                 if (tempLabels.length > 0 && node.data('permanent') === undefined) {
//                     if (tempLabels[tempLabels.length - 1] < minW || (tempLabels[tempLabels.length - 1] === minW && node.data('id') === target.data('id'))) {
//                         minW = tempLabels[tempLabels.length - 1];
//                         nextPermanent = node;
//                     }
//                 }
//             });
//             nextPermanent.data('permanent', minW);
//             nextPermanent.style({
//                 textBorderOpacity: 1,
//                 textBorderWidth: '1px',
//                 textBorderStyle: 'dashed',
//                 textBorderColor: 'green'
//             });
//             currentNode = nextPermanent;
//         }
//         cy.startBatch();
//         let previous = currentNode.data('previous');
//         while (previous !== undefined) {
//             currentNode.select();
//             currentNode.edgesWith(cy.$id(previous)).select();
//             currentNode = cy.$id(previous);
//             previous = currentNode.data('previous');
//         }
//         currentNode.select();
//         cy.endBatch();
//         clearResult();
//         ca.add(cy.$(':selected'));
//         caReLayout();
//         ns.removeData('previous');
//     }
// }
// /**
//  * @function
//  * @public
//  * @return void
//  * */
// function prim() {
//     stopAnimation();
//     clearCyStyle();
//     let root = getCyStartNode("Please enter the id of the starting node", "1");
//     if (root === undefined)
//         root = cy.nodes()[0];
//     cy.elements().unselect();
//     root.select();
//     /**
//      * @function
//      * @private
//      * @return object
//      * Get the edge of minimal weight connected to the selected nodes
//      * */
//     let getMinimalEdge = ()=> {
//         let nodes = cy.nodes(":selected");
//         let minWeight = Infinity;
//         let minEdge;
//         for (let i = 0; i < nodes.length; i++) {
//
//             // get all unused edges connected to this node
//             let edges = nodes[i].connectedEdges(":unselected");
//             for (let j = 0; j < edges.length; j++) {
//
//                 // its target node must not be in the tree
//                 if (!getTarget(nodes[i], edges[j]).selected()) {
//                     let w = getWeight(edges[j]);
//                     if (w < minWeight) {
//                         minWeight = w;
//                         minEdge = edges[j];
//                     }
//                 }
//             }
//         }
//         return minEdge;
//     };
//     let tree = new LinkedList();
//
//     //starting from a given node
//     tree.add(root);
//
//     // if there're still nodes that are not in the tree
//     while (cy.nodes(":unselected").length > 0) {
//
//         // Get the edge of minimal weight connected to the current tree
//         let edge = getMinimalEdge();
//         edge.select();
//
//         // add this edge to the tree
//         tree.add(edge);
//
//         // add its target node to the tree
//         if (edge.target().selected()) {
//             edge.source().select();
//             tree.add(edge.source());
//         }
//         else {
//             edge.target().select();
//             tree.add(edge.target());
//         }
//     }
//     clearResult();
//     ca.add(cy.$(":selected"));
//     caReLayout();
//     tree.traverse(animation.checked, true);
// }
// /**
//  * @function
//  * @public
//  * @param {object} root
//  * @return {Array}
//  * */
// function localMinimalWeightCycle(root) {
//     let minWeight = Infinity;
//     let path, lastEdge, current_node, weight, d, distance;
//
//     cy.startBatch();
//     // Traverse the edges connected to this root node
//     root.connectedEdges().forEach((edge)=> {
//
//         // Select an edge and get its weight and the node which it connected to
//         current_node = getTarget(root, edge);
//         weight = getWeight(edge);
//
//         // Remove it
//         cy.remove(edge);
//
//         // Find the minimal weight connector connecting these two nodes
//         // If found, then a cycle is established after adding the edge back
//         // Dijkstra method:
//         d = cy.elements().dijkstra(root, getWeight);
//         distance = d.distanceTo(current_node) + weight;
//
//         // Find the minimal weight cycle starting from root node
//         if (distance < minWeight) {
//             minWeight = distance;
//             path = d.pathTo(current_node);
//             lastEdge = edge;
//         }
//         cy.add(edge);
//     });
//     cy.endBatch();
//     return [minWeight, path, lastEdge];
// }
//
// /**
//  * Find the minimal weight cycle, either local or global
//  * @function
//  * @public
//  * @return void
//  * */
// function minimalWeightCycle() {
//     stopAnimation();
//     let root = getCyStartNode("Please enter id of the starting node.\nIf you want apply this algorithm too all nodes and get the best one, leave it blank", "");
//     let results;
//     clearCyStyle();
//     cy.elements().unselect();
//     // the global minimal weight cycle
//     if (root === undefined) {
//         // Find the global minimal weight cycle
//         let globalMinWeight = Infinity;
//         let globalPath;
//         let globalE;
//
//         // Traverse every node, finding the minimal weight cycle starting from each node
//         // thus finding the minimal one from these local minimal cycles
//         cy.nodes().forEach((root)=> {
//             results = localMinimalWeightCycle(root);
//             if (results[0] < globalMinWeight) {
//                 globalMinWeight = results[0];
//
//                 // Record the path
//                 globalPath = results[1];
//                 globalE = results[2];
//             }
//         });
//         clearResult();
//
//         // select the cycle
//         globalPath.select();
//         globalE.select();
//         ca.add(globalPath);
//         ca.add(globalE);
//     }
//     // The local one
//     else {
//         results = localMinimalWeightCycle(root);
//         clearResult();
//         results[1].select();
//         results[2].select();
//         ca.add(results[1]);
//         ca.add(results[2]);
//     }
//     caReLayout();
// }
// /**
//  * The global nearest neighbor algorithm
//  * find that of minimal weight by performing the algorithm on every node
//  * @function
//  * @public
//  * @return void
//  * */
// function nearestNeighbor() {
//     stopAnimation();
//     let root = getCyStartNode("Please enter id of the starting node.\nIf you want apply this algorithm too all nodes and get the best one, leave it blank", "");
//     clearCyStyle();
//     cy.elements().unselect();
//     let results;
//     if (root === undefined) {
//         let minWeight = Infinity;
//         let minElements;
//         let minPath;
//         cy.startBatch();
//         cy.nodes().forEach((currentNode)=> {
//             results = nearestNeighborAlgorithm(currentNode);
//             let sumWeight = results[0];
//             if (sumWeight <= minWeight) {
//                 minElements = cy.$(':selected');
//                 minWeight = sumWeight;
//                 minPath = results[1];
//             }
//             cy.elements().unselect();
//         });
//         clearResult();
//         ca.add(minElements);
//         minElements.select();
//         cy.endBatch();
//         minPath.traverse(animation.checked, true);
//     }
//     else {
//         results = nearestNeighborAlgorithm(root);
//         clearResult();
//         ca.add(cy.$(':selected'));
//         results[1].traverse(animation.checked, true);
//     }
//     caReLayout();
// }
// /**
//  * The nearest neighbor algorithm starting from a given node
//  * @function
//  * @public
//  * @param {object} root
//  * @return {Array}
//  * */
// function nearestNeighborAlgorithm(root) {
//     let currentNode = root;
//     cy.startBatch();
//     /**
//      * @function
//      * @private
//      * @param {object} node
//      * @return {object} the edge of minimal weight connected to this node
//      * */
//     let getMinimalEdge = (node)=> {
//         let minWeight = Infinity;
//         let edge = undefined;
//
//         // Traverse all the adjacent edges whose target node is not selected and find the minimal weight one
//         node.connectedEdges().forEach((e)=> {
//             // Skip this edge if its target node have been already visited
//             if (!getTarget(node, e).selected()) {
//                 let weight = getWeight(e);
//                 if (weight < minWeight) {
//                     minWeight = weight;
//                     edge = e;
//                 }
//             }
//         });
//         return edge;
//     };
//
//     // Iteratively select the edge of minimal weight and the node which it connects
//     let edge = getMinimalEdge(currentNode);
//     let totalWeight = 0;
//     let numOfNodes = 1;
//     let path = new LinkedList();
//     path.add(currentNode);
//     currentNode.select();
//
//     // Doing until the number of connected unselected edges of the destination node is 0
//     // which means we are stuck or we have visited all nodes
//     while (edge !== undefined) {
//         numOfNodes += 1;
//         totalWeight += getWeight(edge);
//         currentNode = getTarget(currentNode, edge);
//         path.add(edge);
//         path.add(currentNode);
//         edge.select();
//         currentNode.select();
//         edge = getMinimalEdge(currentNode);
//     }
//
//     // get the edge connecting the last node and the first node
//     // Such edge must exist if the graph is complete
//     let lastEdge = cy.edges("[id ^='" + root.data('id') + '-' + currentNode.data('id') + "-']")
//         .union(cy.edges("[id ^='" + currentNode.data('id') + '-' + root.data('id') + "-']"));
//
//     // if it does not exist
//     // apply a very high weight to this solution
//     // in case other solution might be complete (therefore better than this one)
//     if (lastEdge.length === 0)
//         totalWeight += Math.pow(2, 32);
//     else {
//         lastEdge[0].select();
//         path.add(lastEdge[0]);
//     }
//     path.add(root);
//     cy.endBatch();
//     // If not all nodes are visited, give this solution a very high weight
//     return [totalWeight + (cy.nodes().length - numOfNodes) * Math.pow(2, 32), path];
// }
// /**
//  * check whether the graph is connected by performing breadth first search
//  * @function
//  * @public
//  * @return boolean
//  * */
// function isConnected() {
//     let path = cy.elements().bfs(cy.nodes()[0]).path;
//     return path.nodes().length === cy.nodes().length;
// }
/**
 * @typedef LinkedListNode
 * @type {object}
 * @property cargo
 * @property {LinkedListNode} next
 * */
/**
 * js implementation of a single linked list
 * @typedef LinkedList
 * @type {object}
 * @property {LinkedListNode} head
 * @property {int} length
 * @property {function} getTail
 * @property {function} add
 * @property {function} addNode
 * @property {function} traverse
 * */

class LinkedListNode {
    constructor(cargo, next) {
        /**
         * @public
         * */
        this.cargo = cargo;
        /**
         * @public
         * @type {LinkedListNode}
         * */
        this.next = next;
    }
}
class LinkedList {
    constructor() {
        /**
         * @type {LinkedListNode}
         * @public
         * */
        this.head = null;
        /**
         * @type {int}
         * @public
         * */
        this.length = 0;
    }

    /**
     * Get the last node of the linked list
     * @public
     * @function
     * */
    getTail() {
        let currentNode = this.head;
        while (currentNode.next !== null)
            currentNode = currentNode.next;
        return currentNode;
    }

    /**
     * @public
     * @function
     * @param cargo
     * add a cargo
     * */
    add(cargo) {
        if (this.length === 0)
            this.head = new LinkedListNode(cargo, null);
        else
            this.getTail().next = new LinkedListNode(cargo, null);
        this.length += 1;
    }

    /**
     * add a node
     * @function
     * @param {LinkedListNode} node
     * @public
     * */
    addNode(node) {
        if (this.length === 0)
            this.head = node;
        else
            this.getTail().next = node;
        this.length += 1;
    }

    /**
     * search a specific node using user defined function
     * @public
     * @function
     * @param {function} func
     * */
    search(func) {
        let currentNode = this.head;
        while (currentNode !== null) {
            if (func(currentNode.cargo))
                return currentNode;
            currentNode = currentNode.next;
        }
        return null;
    }

    /**
     * traverse the linked list, with visualizations on the graph,
     * assuming each cargo is either a node or an edge
     * @public
     * @function
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
                let currentElement = currentNode.cargo;
                if (currentElement.isNode())
                    path_string += '<span class="normal" id="n' + counter + '">' + currentElement.data('id') + '</span>';
                else
                    path_string += '<span class="normal" id="n' + counter + '"> → </span>';
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
             * @function
             * @private
             * @param {LinkedListNode} node
             * */
            let animation = (node) => {
                if (node.cargo.isNode()) {
                    node.cargo.animate({
                        style: {backgroundColor: '#00f1f1', width: '30px', height: '30px'},
                        duration: Math.round(+duration.value * 0.1)
                    }).animate({
                        style: {backgroundColor: '#de4400', width: '20px', height: '20px'},
                        duration: Math.round(+duration.value * 0.4),
                        complete: () => {

                            // if the global flag is set to false
                            // stop the animation
                            if (!animationFlag)
                                return;

                            // animate next node if it exists
                            if (node.next !== null) {
                                if (trace) {
                                    // update the tracer
                                    // track the animation by applying additional CSS to elements
                                    document.getElementById('n' + counter).className = 'current';
                                    document.getElementById('n' + (counter - 1)).className = 'normal';
                                    counter += 1;
                                }
                                animation(node.next);
                            }
                        }
                    });
                }
                else {
                    node.cargo.animate({
                        style: {lineColor: '#00f1f1', width: '6'},
                        duration: Math.round(+duration.value * 0.2)
                    }).animate({
                        style: {lineColor: '#de4400', width: '3'},
                        duration: Math.round(+duration.value * 0.8),
                        complete: () => {

                            // if the global flag is set to false
                            // stop the animation
                            if (!animationFlag)
                                return;

                            // animate next node if it exists
                            if (node.next !== null) {

                                // update the tracer
                                if (trace) {
                                    document.getElementById('n' + counter).className = 'current';
                                    document.getElementById('n' + (counter - 1)).className = 'normal';
                                    counter += 1;
                                }
                                animation(node.next);
                            }
                        }
                    });
                }
            };
            if (trace)
                document.getElementById('n0').className = 'current';
            animation(currentNode);
        }
    }
}
// /**
//  * @see traceEulerianCycle()
//  * @function
//  * @public
//  * @return void
//  * */
// function eulerianCycle() {
//
//     // first check if this graph is connected
//     stopAnimation();
//     if (!isConnected())
//         return alert('This graph is not connected');
//
//     // then check whether there're none or two vertices of odd degree
//     let numOfOddDegrees = 0;
//     cy.nodes().forEach((ele)=> {
//         if (ele.degree() % 2 !== 0)
//             numOfOddDegrees += 1;
//     });
//
//     // stop if the conditions for Eulerian/semi-Eulerian graphs are not satisfied.
//     if (numOfOddDegrees !== 0 && numOfOddDegrees !== 2)
//         return alert('This graph is neither Eulerian nor semi-Eulerian');
//     cy.elements().unselect();
//     clearResult();
//     ca.add(cy.elements());
//     caReLayout();
//
//     // starting Eulerian Cycle from node 1
//     traceEulerianCycle(ca.nodes()[0], ca);
// }
// /**
//  * Find an Eulerian cycle/trail in an Eulerian/semi-Eulerian graph, by Hierholzer's algorithm
//  * @public
//  * @function
//  * the starting node
//  * @param {object} start
//  * the cytoscape object
//  * @param {object} c
//  * @return void
//  * */
// function traceEulerianCycle(start, c) {
//     // establish a linked list and add first node into it
//     let currentNode = start;
//     let path = new LinkedList();
//     path.add(currentNode);
//
//     // get the unselected edges which are connected to this node
//     let connectedEdges = currentNode.connectedEdges(':unselected');
//     let nextJourney = undefined;
//     while (true) {
//
//         // if there are unvisited edges connecting to this node
//         while (connectedEdges.length > 0) {
//
//             // select the first one
//             let edge = connectedEdges[0];
//             edge.select();
//             path.add(edge);
//
//             // select its source node (equivalently, the last target node)
//             currentNode.select();
//             currentNode = getCaTarget(currentNode, edge);
//
//             // get the unselected edges which are connected to the target node
//             connectedEdges = currentNode.connectedEdges(':unselected');
//             path.add(currentNode);
//         }
//
//         // if the above while loop breaks, that means we have returned to the starting point
//         // Note: the conditions of an Eulerian/semi-Eulerian graph ensure that we will not be stuck
//
//         // select the last node
//         currentNode.select();
//
//         // add the next half tour to the linked list
//         if (nextJourney !== undefined)
//             path.addNode(nextJourney);
//
//         // if there are still edges which remain unselected
//         if (c.edges(':unselected').length !== 0) {
//
//             // find the node which still have unselected edges connected to it
//             let node = path.search((element)=> {
//                 if (element.isNode()) {
//                     if (element.connectedEdges(':unselected').length > 0)
//                         return true;
//                 }
//             });
//
//             // break the journey (node: the next half of the journey journey will be added back later)
//             nextJourney = node.next;
//             currentNode = node.cargo;
//             node.next = null;
//
//             // start a new tour from this break point
//             connectedEdges = currentNode.connectedEdges(':unselected');
//         }
//
//         // if all edges are visited, exit the loop
//         else
//             break;
//     }
//     c.elements().unselect();
//     path.traverse(animation.checked, true);
// }
// /**
//  * the factorial function
//  * @public
//  * @function
//  * @param {int} n
//  * @return {int}
//  * */
// function f(n) {
//     return (n <= 1) ? 1 : n * f(n - 1);
// }
// /**
//  * @function
//  * @public
//  * @return void
//  * */
// function minimalWeightMatching() {
//     stopAnimation();
//     clearCyStyle();
//     cy.elements().unselect();
//     // precondition: the graph is connected
//     if (!isConnected())
//         return alert("Graph not connected!");
//
//     let len = cy.nodes().length;
//     if (len > 14)
//         if (!confirm("Warning! This graph has " + len + " nodes, at most " + (f(len) / (f(len / 2) * Math.pow(2, len / 2))) + " iterations are needed and it might take a long time！"))
//             return;
//     clearResult();
//     /**
//      * @function
//      * @private
//      * @param {Array} minPairing
//      * @return void
//      * */
//     function displayPairings(minPairing) {
//         /**
//          * @function
//          * @private
//          * @param {object} node1
//          * @param {object} node2
//          * @return {object}
//          * */
//         function getCyEdge(node1, node2) {
//             let e = cy.$id(node1.data('id') + '-' + node2.data('id') + '-0');
//             return e.length === 0 ? cy.$id(node2.data('id') + '-' + node1.data('id') + '-0') : e;
//         }
//
//         let nodes = cy.nodes();
//         for (let i = 0; i < minPairing.length; i += 2) {
//             let n1 = nodes[minPairing[i]];
//             if (minPairing[i + 1] === undefined)
//                 break;
//             let n2 = nodes[minPairing[i + 1]];
//             let e = getCyEdge(n1, n2);
//             ca.add(n1);
//             ca.add(n2);
//             ca.add(e);
//             n1.select();
//             n2.select();
//             e.select();
//         }
//         caReLayout();
//     }
//
//     let weightMatrix = getWM(cy, false);
//     minimalWeightMatchingMultiThread(weightMatrix, 4, displayPairings);
// }
// /**
//  * @param {Array} weightMatrix
//  * @param {int} numOfThreads
//  * @param {function} callback
//  * The callback function to be executed after completion of all threads
//  * @return void
//  * */
// function minimalWeightMatchingMultiThread(weightMatrix, numOfThreads, callback) {
//     // generator is used to merge the results from each thread
//     function*join() {
//         while (true) {
//             yield null;
//             let flag = workerFlags[0];
//             for (let i = 1; i < numOfThreads; i++)
//                 flag = flag && workerFlags[i];
//             if (flag === true)
//                 break;
//         }
//         let minWeight = Infinity;
//         let minPairing = [];
//         for (let i = 0; i < numOfThreads; i++)
//             if (minWeights[i] < minWeight) {
//                 minWeight = minWeights[i];
//                 minPairing = minPairings[i]
//             }
//         perform_button.disabled = false;
//         callback(minPairing);
//     }
//
//     let joiner = join();
//     let workerFlags = new Array(numOfThreads);
//     let minWeights = new Array(numOfThreads);
//     let minPairings = new Array(numOfThreads);
//     let portion = Math.floor(weightMatrix.length / numOfThreads);
//     let eles = _.range(0, weightMatrix.length);
//     perform_button.disabled = true;
//
//     // distribute the workload to a number of independent threads
//     for (let i = 0; i < numOfThreads; i++) {
//         workerFlags[i] = false;
//         minWeights[i] = Infinity;
//         const x = i;
//         const worker = new Worker("js/MWMMT.min.js");
//         worker.onmessage = (message)=> {
//             console.log(x + " is ready");
//             minWeights[x] = message.data.minWeight;
//             minPairings[x] = message.data.minPairing;
//             workerFlags[x] = true;
//             joiner.next();
//             worker.terminate();
//         };
//         if (i === numOfThreads - 1)
//             worker.postMessage({
//                 weightMatrix: weightMatrix,
//                 eles: eles,
//                 start: x * portion,
//                 end: weightMatrix.length
//             });
//         else
//             worker.postMessage({
//                 weightMatrix: weightMatrix,
//                 eles: eles,
//                 start: x * portion,
//                 end: (x + 1) * portion
//             });
//         worker.onerror = (err)=> {
//             console.log(err.message);
//         };
//     }
// }
//
// /**
//  * solve the Chinese postman problem
//  * @function
//  * @public
//  * @return void
//  * */
// function CPP() {
//     stopAnimation();
//     clearCyStyle();
//     cy.elements().unselect();
//     // get the collection of odd nodes
//     cy.nodes().forEach((ele)=> {
//         if (ele.degree() % 2 !== 0)
//             ele.select();
//     });
//     let nodes = cy.nodes(":selected");
//     let n = nodes.length;
//     if (n > 14)
//         if (!confirm("Warning! This graph has " + n + " nodes of odd degree, at most " + (f(n) / (f(n / 2) * Math.pow(2, n / 2))) + " iterations are needed and it might take a long time！"))
//             return;
//
//     // get the weight matrix of these nodes (a subgraph)
//     let weightMatrix = new Array(n);
//     let paths = new Array(n);
//     for (let x = 0; x < n; x++) {
//         paths[x] = cy.elements().dijkstra(nodes[x], getWeight);
//         weightMatrix[x] = new Array(n);
//         for (let y = x + 1; y < n; y++)
//             weightMatrix[x][y] = paths[x].distanceTo(nodes[y]);
//     }
//     // get the minimal weight perfect matching
//     minimalWeightMatchingMultiThread(weightMatrix, 4, displayResult);
//
//     function displayResult(minPairing) {
//         clearResult();
//         ca.add(cy.elements());
//         let addedEdges = undefined;
//
//         // Once the minimal weight perfect matching is found,
//         // duplicated these edges, so the graph becomes Eulerian
//         for (let x = 0; x < minPairing.length; x += 2) {
//             paths[minPairing[x]].pathTo(nodes[minPairing[x + 1]]).forEach((ele)=> {
//                 if (ele.isEdge()) {
//                     ele.select();
//                     let duplicatedEdge = duplicateEdge(ele, ca);
//                     if (addedEdges === undefined)
//                         addedEdges = duplicatedEdge;
//                     else
//                         addedEdges = addedEdges.union(duplicatedEdge);
//                 }
//             });
//         }
//         caReLayout();
//         ca.elements().unselect();
//
//         // Eulerian Cycle. See function traceEulerianCycle
//         // starting the Eulerian Cycle from the first node
//         traceEulerianCycle(ca.nodes()[0], ca);
//     }
//
// }
// /**
//  * find the maximal lower bound for TSP by performing the vertex deletion algorithm on every node
//  * @function
//  * @public
//  * @return void
//  * */
// function TSPGlobalLowerBound() {
//     stopAnimation();
//     let root = getCyStartNode("Please enter id of the starting node.\nIf you want apply this algorithm too all nodes and get the highest lower bound, leave it blank", "");
//     let results;
//     clearCyStyle();
//     cy.elements().unselect();
//     if (root === undefined) {
//         let maxWeight = 0;
//         let maxResults, maxRoot, sumWeight;
//         cy.nodes().forEach((currentNode)=> {
//
//             // Find the maximal lower bound...
//             results = TSPLowerBound(currentNode);
//             sumWeight = results[0];
//             if (sumWeight > maxWeight) {
//
//                 // record the weight, results, and the node deleted
//                 maxWeight = sumWeight;
//                 maxResults = results;
//                 maxRoot = currentNode;
//             }
//         });
//         clearResult();
//
//         // select the node, the two deleted edges, and the minimal spanning tree
//         maxResults[3].nodes().style({backgroundColor: '#eba300'});
//         maxResults[3].edges().style({lineColor: '#eba300'});
//         maxResults[2].select();
//         maxResults[1].select();
//
//         //Order must be correct...
//         ca.add(maxResults[3]);
//         ca.elements().select();
//         ca.add(maxRoot);
//         ca.add(maxResults[2]);
//         ca.add(maxResults[1]);
//         caReLayout();
//     }
//
//     // the lower bound at a given starting node
//     else {
//         results = TSPLowerBound(root);
//         clearResult();
//         results[3].nodes().style({backgroundColor: '#eba300'});
//         results[3].edges().style({lineColor: '#eba300'});
//         results[2].select();
//         results[1].select();
//         ca.add(results[3]);
//         ca.elements().select();
//         ca.add(root);
//         ca.add(results[2]);
//         ca.add(results[1]);
//         caReLayout();
//     }
// }
// /**
//  * Get the lower bound for the travelling salesman problem by vertex deletion algorithm
//  * @function
//  * @public
//  * @param {object} root
//  * @return {Array}
//  * */
// function TSPLowerBound(root) {
//     cy.startBatch();
//     // starting from a given node
//     // find two connected edges of minimal weight, record the sum of their weight
//     let edges = root.connectedEdges().sort((e1, e2)=> {
//         return getWeight(e1) - getWeight(e2);
//     });
//     let weight = getWeight(edges[0]) + getWeight(edges[1]);
//
//     // remove this node and all its adjacent edges
//     cy.remove(root);
//
//     // find the minimal spanning tree of the remaining graph by kruskal
//     let spanningTree = cy.elements().kruskal(getWeight);
//
//     // calculate the total weight of this tree
//     spanningTree.edges().forEach((edge)=> {
//         weight += getWeight(edge);
//     });
//
//     // add back the removed stuffs
//     cy.add(root);
//     cy.add(edges);
//     cy.endBatch();
//     return [weight, edges[0], edges[1], spanningTree];
// }
/**
 * Get the adjacency matrix
 * @function
 * @public
 * @param {object} c The Cytoscape object
 * @param {boolean} output
 * @return {Array}
 * */
function getAM(c, output) {
    let i, j;
    let nodes = c.nodes();
    let numOfNodes = nodes.length;
    let matrix = new Array(numOfNodes);
    let id_index = {};
    for (i = 0; i < numOfNodes; i++) {
        matrix[i] = new Array(numOfNodes);

        // match the id of nodes with the index, an continuous integer
        // in case where the some of the nodes are deleted
        id_index[nodes[i].data('id')] = i;
        for (j = 0; j < numOfNodes; j++)
            matrix[i][j] = 0;
    }

    // record the number of edges
    // matrix[i][j] denotes the number of edges connecting node i and node j
    c.edges().forEach((ele) => {
        i = id_index[ele.data('source')];
        j = id_index[ele.data('target')];
        matrix[i][j] += 1;
    });
    if (output)
        matrix_input.value = matrixToString(matrix);
    return matrix;
}
/**
 * get the weight matrix
 * @function
 * @public
 * @param {object} c The Cytoscape object
 * @param {boolean} output
 * @return {Array}
 * */
function getWM(c, output) {
    let i, j, w;
    let nodes = c.nodes();
    let numOfNodes = nodes.length;
    let matrix = new Array(numOfNodes);
    let id_index = {};
    for (i = 0; i < numOfNodes; i++) {
        matrix[i] = new Array(numOfNodes);
        id_index[nodes[i].data('id')] = i;
        for (j = 0; j < numOfNodes; j++)
            matrix[i][j] = 0;
    }
    c.edges().forEach((ele) => {
        i = id_index[ele.data('source')];
        j = id_index[ele.data('target')];
        w = getWeight(ele);
        if (matrix[i][j] === 0)
            matrix[i][j] = w;
        else {
            if (w < matrix[i][j])
                matrix[i][j] = w;
        }
    });
    if (output)
        matrix_input.value = matrixToString(matrix);
    return matrix;
}
/**
 * Concert a two dimensional matrix to string
 * @function
 * @public
 * @param {Array} m
 * @return {string}
 * */
function matrixToString(m) {
    let s = '[[' + m[0].toString() + '],\n';
    for (let i = 1; i < m.length - 1; i++)
        s += ' [' + m[i].toString() + '],\n';
    s += ' [' + m[m.length - 1].toString() + ']]';
    return s;
}

// /**
//  * generate graphml from the graph
//  * @function
//  * @public
//  * @param {Object} c
//  * @return void
//  * */
// function getGraphML(c) {
//     matrix_input.value = c.graphml();
// }
//
// /**
//  * convert the graphml to cytoscape graphs
//  * it's not working very well and is therefore temporarily disabled
//  * @function
//  * @public
//  * @return void
//  * */
// function readGraphML() {
//     clearSource();
//     cy.graphml(matrix_input.value);
//     cyReLayout();
// }