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
            });
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
        hoverDelay: 150, // time spent hovering over a target node before it is considered selected
        handleNodes: 'node', // selector/filter function for whether edges can be made from a given node
        snap: false, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
        snapThreshold: 50, // the target node must be less than or equal to this many pixels away from the cursor/finger
        snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
        noEdgeEventsInDraw: false, // set events:no to edges during draws, prevents mouseouts on compounds
        disableBrowserGestures: true, // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
        handlePosition: function( node ){
          return 'middle top'; // sets the position of the handle in the format of "X-AXIS Y-AXIS" such as "left top", "middle top"
        },
        handleInDrawMode: false, // whether to show the handle in draw mode
        edgeType: function( sourceNode, targetNode ){
          // can return 'flat' for flat edges between nodes or 'node' for intermediate node between them
          // returning null/undefined means an edge can't be added between the two nodes
          return 'flat';
        },
        loopAllowed: function( node ){
          // for the specified node, return whether edges from itself to itself are allowed
          return true;
        },
        nodeLoopOffset: -50, // offset for edgeType: 'node' loops
        nodeParams: function( sourceNode, targetNode ){
          // for edges between the specified source and target
          // return element object to be passed to cy.add() for intermediary node
          return {};
        },
        ghostEdgeParams: function(){
          // return element object to be passed to cy.add() for the ghost edge
          // (default classes are always added for you)
          return {};
        },
        show: function( sourceNode ){
          // fired when handle is shown
        },
        hide: function( sourceNode ){
          // fired when the handle is hidden
        },
        start: function( sourceNode ){
          // fired when edgehandles interaction starts (drag on handle)
        },
        complete: function( sourceNode, targetNode, addedEles ){
          // fired when edgehandles is done and elements are added
        },
        stop: function( sourceNode ){
          // fired when edgehandles interaction is stopped (either complete with added edges or incomplete)
        },
        cancel: function( sourceNode, cancelledTargets ){
          // fired when edgehandles are cancelled (incomplete gesture)
        },
        hoverover: function( sourceNode, targetNode ){
          // fired when a target is hovered
        },
        hoverout: function( sourceNode, targetNode ){
          // fired when a target isn't hovered anymore
        },
        previewon: function( sourceNode, targetNode, previewEles ){
          // fired when preview is shown
        },
        previewoff: function( sourceNode, targetNode, previewEles ){
          // fired when preview is hidden
        },
        drawon: function(){
          // fired when draw mode enabled
        },
        drawoff: function(){
          // fired when draw mode disabled
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
        complete: (sourceNode, targetNodes, addedEntities) => {
            // fired when edgehandles is done and entities are added
            if (auto_refresh.checked)
                cyReLayout();
            addedEntities.forEach((ele) => {
                if (ele.isEdge()) {
                    ele.animate({
                        style: {lineColor: 'red', width: 5},
                        duration: 100
                    }).animate({
                        style: {lineColor: '#ccc', width: 2},
                        duration: 500
                    });
                }
            });
        },
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
});
/**
 * restore the default style of cy elements
 * @function
 * @public
 * @return void
 * */
function clearCyStyle() {
    cy.elements().removeStyle();
    cy.style().resetToDefault().fromJson(defaultStyle).update();
    cy.$(':selected').select();
}
/**
 * @function
 * @public
 * @return void
 * */
function clearCaStyle() {
    ca.elements().removeStyle();
    ca.style().resetToDefault().fromJson(defaultStyle).update();
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
        container: document.getElementById(div_name),
        style: defaultStyle
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
    CyLayout.on('layoutstop', (e)=>{
        cy.edges().hide();
        cy.edges().show();
    });
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
    CaLayout.on('layoutstop', (e)=>{
        cy.edges().hide();
        cy.edges().show();
    });
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
    let eles = cy.edges("[id ^='" + n[0] + '-' + n[1] + "-']").union(cy.edges("[id ^='" + n[1] + '-' + n[0] + "-']"));
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
        if (i !== j)
            matrix[j][i] += 1;
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
        matrix[j][i] = matrix[i][j];
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
