function ShowHide(tar, sender) {
    var target = $('#' + tar);
    sender = $(sender);
    if (sender.text().charAt(0) === "◢") {
        target.hide(500);
        sender.text("▶" + sender.text().substring(1));
    }
    else {
        target.show(500);
        sender.text("◢" + sender.text().substring(1));
    }
}
var layout_options = {
    'random': {name: 'random'},
    'grid': {name: 'grid'},
    'breadthfirst': {name: 'breadthfirst'},
    'cola': {
        name: 'cola',
        fit: false,
        infinite: true
    },
    'cose-bilkent': {
        name: 'cose-bilkent',
        // Called on `layoutready`
        ready: function () {
        },
        // Called on `layoutstop`
        stop: function () {
        },
        // number of ticks per frame; higher is faster but more jerky
        refresh: 30,
        // Whether to fit the network view after when done
        fit: true,
        // Padding on fit
        padding: 10,
        // Whether to enable incremental mode
        randomize: true,
        // Node repulsion (non overlapping) multiplier
        nodeRepulsion: 5000,
        // Ideal edge (non nested) length
        idealEdgeLength: 75,
        // Divisor to compute edge forces
        edgeElasticity: 0.45,
        // Nesting factor (multiplier) to compute ideal edge length for nested edges
        nestingFactor: 0.1,
        // Gravity force (constant)
        gravity: 0.25,
        // Maximum number of iterations to perform
        numIter: 3000,
        // For enabling tiling
        tile: true,
        // Type of layout animation. The option set is {'during', 'end', false}
        animate: 'end',
        // Represents the amount of the vertical space to put between the zero degree members during the tiling operation(can also be a function)
        tilingPaddingVertical: 10,
        // Represents the amount of the horizontal space to put between the zero degree members during the tiling operation(can also be a function)
        tilingPaddingHorizontal: 10,
        // Gravity range (constant) for compounds
        gravityRangeCompound: 1.5,
        // Gravity force (constant) for compounds
        gravityCompound: 1.0,
        // Gravity range (constant)
        gravityRange: 3.8,
        // Initial cooling factor for incremental layout
        initialEnergyOnIncremental: 0.8
    },
    'circle': {name: 'circle'},
    'spread': {
        name: 'spread',
        randomize: true
    }
};