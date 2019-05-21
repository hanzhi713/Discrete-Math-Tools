/**
 * @param {boolean} dir whether this is for a directed graph or not
 */
function heldKarp(dir) {
    stopAnimation();

    const [wm, id_index] = getWM(cy, false, dir);
    const nodes = getAllNodes(cy);

    if (!isComplete(dir)) {
        alert(
            'Graph not complete. Please use the Kn button or set the probability that two nodes are connected to 1.'
        );
        return;
    }

    if (nodes.length > 16) {
        if (
            !confirm(
                'Warning: This graph has more than 16 nodes, which may cause excessive running time.'
            )
        )
            return;
    }

    const root = +getCyStartNode('Please enter the id of the start node.\n', '1').id() - 1;

    clearCyStyle();
    cy.elements(':grabbable').unselect();

    const { distance, arr } = heldKarpHelp(wm, root, dir);

    if (!dir) {
        clearResult();
    }

    const minArrInv = arr.concat();

    minArrInv.reverse().unshift(root);

    let path = cy.collection();
    const pathList = new LinkedList();

    for (let i = 0; i < minArrInv.length; i++) {
        path = path.union(nodes[minArrInv[i]]);
        path = path.union(
            nodes[minArrInv[i]].edgesWith(nodes[minArrInv[(i + 1) % minArrInv.length]])[0]
        );
    }

    if (dir) {
        path.forEach(x => {
            pathList.add(x);
        });

        // also add the start node as the last node
        pathList.add(nodes[root]);
    } else {
        ca.add(path.select());

        path.forEach(x => {
            pathList.add(ca.$id(x.id()));
        });

        pathList.add(ca.$id(nodes[root].id()));
    }

    pathList.traverse(animation_check.checked, true);

    if (dir) {
        processDiv.innerHTML = `${minArrInv.reduce((acc, v) => `${acc}${v + 1}→`, '')}
                                ${root + 1}</br>Sum of weight of the shortest path is ${distance}`;
    }
}

/**
 * @param {number[][]} wm weight matrix
 * @param {number} x starting node
 * @param {boolean} dir whether this is for a directed graph or not
 * @return {{ distance: number, arr: number[] }}
 */
function heldKarpHelp(wm, x, dir) {
    const memo = new Map();

    const nums = wm[0].map((_, i) => i);
    nums.splice(x, 1);

    let min = Infinity;
    let minArr;
    for (let i = 0; i < nums.length; i++) {
        const tempNums = nums.concat();
        tempNums.splice(i, 1);
        const [distance, arr] = heldKarpPath(nums[i], x, tempNums, wm, memo);
        const rst = wm[x][nums[i]] + distance;

        if (rst < min) {
            min = rst;
            minArr = arr;
        }
    }

    return { distance: min, arr: minArr };
}

/**
 *
 * @param {number} x starting node for sub-path
 * @param {number} rt starting node for the whole graph
 * @param {number[]} nums nodes in the sub-path
 * @param {number[][]} wm weight matrix; wm(ij) represents distance from i to j
 * @param {Map<string, {distance: number, arr: number[]}>} memo
 * @return {[number, number[]]}
 */
function heldKarpPath(x, rt, nums, wm, memo) {
    if (nums.length === 0) {
        return [wm[x][rt], [x]];
    }
    if (x === undefined) {
        console.log(nums);
    }
    const dist = new Array(nums.length);
    let min = Infinity;
    let minArr;
    for (let i = 0; i < nums.length; i++) {
        const tempNums = nums.concat();
        tempNums.splice(i, 1);
        const key = `${nums[i]},${x},${nums.toString()}`;
        let h;
        if (memo.get(key) !== undefined) {
            h = memo.get(key);
        } else {
            h = heldKarpPath(nums[i], rt, tempNums, wm, memo);
            memo.set(key, h);
        }

        dist[i] = wm[x][nums[i]] + h[0];

        if (dist[i] < min) {
            min = dist[i];
            minArr = h[1].concat();
            minArr.push(x);
        }
    }

    return [Math.min(...dist), minArr];
}
