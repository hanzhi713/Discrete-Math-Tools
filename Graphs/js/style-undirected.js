const defaultStyle = [
    {
        selector: 'node',
        style: {
            'background-color': '#666',
            'label': 'data(id)',
            'height': '25px',
            'width': '25px',
            'font-size': '20px'
        }
    },
    {
        selector: 'edge',
        style: {
            'width': 2,
            'line-color': '#ccc',
            'curve-style': 'bezier',
            'label': (edge) => {
                return isNaN(edge.data('weight')) ? '' : edge.data('weight');
            },
            'color': 'red',
            'font-size': '20px'
        }
    },
    {
        selector: '.eh-handle',
        style: {
            'label': '',
            'background-color': 'red',
            'width': 12,
            'height': 12,
            'shape': 'ellipse',
            'overlay-opacity': 0,
            'border-width': 12, // makes the handle easier to hit
            'border-opacity': 0
        }
    },
    {
        selector: '.eh-hover',
        style: {
            'background-color': 'red'
        }
    },
    {
        selector: '.eh-source',
        style: {
            'border-width': 2,
            'border-color': 'red'
        }
    },
    {
        selector: '.eh-target',
        style: {
            'border-width': 2,
            'border-color': 'red'
        }
    },
    {
        selector: '.eh-preview, .eh-ghost-edge',
        style: {
            'background-color': 'red',
            'line-color': 'red',
            'target-arrow-color': 'red',
            'source-arrow-color': 'red'
        }
    },
    {
        selector: '.eh-ghost-edge.eh-preview-active',
        style: {
            'opacity': 0
        }
    }
];
