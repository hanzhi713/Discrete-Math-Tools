/**
 *
 * @param {boolean} dir whether this is for a directed graph or not
 */
function heldKarp(dir) {
    stopAnimation();

    const [wm, id_index] = getWM(cy, false, dir);

    if (!isComplete(dir)) {
        alert('Graph not complete. Please set the probability that two nodes are connected to 1.');
        return;
    }

    const root = +getCyStartNode('Please enter the id of the start node.\n', '1').id() - 1;

    clearCyStyle();

    if (!dir) {
        clearCaStyle();
        ca.remove(':grabbable');
        ca.add(cy.elements(':grabbable'));
    }

    cy.elements(':grabbable').unselect();
    heldKarpHelp(wm, root, dir);
}

/**
 *
 * @param {number[][]} wm weight matrix
 * @param {number} x starting node
 * @param {boolean} dir whether this is for a directed graph or not
 */
function heldKarpHelp(wm, x, dir) {
    let n = wm.length;
    var memo = new Map();

    const nums = new Array(n);
    for (let i = 0; i < n; i++) {
        nums[i] = i;
    }
    nums.splice(x, 1);

    let rst = new Array(n - 1);
    let min = Infinity;
    let minArr;

    for (let i = 0; i < nums.length; i++) {
        let tempNums = nums.concat();
        tempNums.splice(i, 1);
        let h = heldKarpPath(nums[i], x, tempNums, wm, memo, dir);
        rst[i] = wm[x][nums[i]] + h.distance;

        if (wm[x][nums[i]] + h.distance < min) {
            min = wm[x][nums[i]] + h.distance;
            minArr = h.arr.concat();
        }
    }

    const minArrInv = minArr.concat();

    minArrInv.reverse().unshift(x);

    let pathList = new LinkedList();
    let nodes = getAllNodes(cy);

    for (let i = 0; i < minArrInv.length; i++) {
        pathList.add(nodes[minArrInv[i]]);
        if (dir) {
            pathList.add(
                nodes[minArrInv[i]].edgesTo(nodes[minArrInv[(i + 1) % minArrInv.length]])[0]
            );
        } else {
            pathList.add(
                nodes[minArrInv[i]].edgesWith(nodes[minArrInv[(i + 1) % minArrInv.length]])[0]
            );
        }
    }

    clearCyStyle();

    if (dir) {
        let val = '';
        for (let i = 0; i < minArrInv.length; i++) {
            val += minArrInv[i] + 1 + '→';
        }
        val += x + 1 + '</br>';
        val += 'Sum of weight of the shortest path is ' + min;
        processDiv.innerHTML = val;
    } else {
        document.getElementById('ca_weight').innerHTML = min;
    }

    pathList.traverse(animation_check.checked, true);
    return { distance: min, arr: minArr };
}

/**
 *
 * @param {number} x starting node for sub-path
 * @param {number} rt starting node for the whole graph
 * @param {number[]} nums nodes in the sub-path
 * @param {number[][]} wm weight matrix; wm(ij) represents distance from i to j
 * @param {Map<string, {distance: number, arr: number[]}>} memo
 * @param {boolean} dir whether this is for a directed graph or not
 */
function heldKarpPath(x, rt, nums, wm, memo, dir) {
    nodes = getAllNodes(cy);
    cy.elements(':grabbable').unselect();
    if (nums.length === 0) {
        return { distance: wm[x][rt], arr: [x] };
    } else {
        let dist = new Array(nums.length);
        let min = Infinity;
        let minArr;
        for (let i = 0; i < nums.length; i++) {
            let tempNums = nums.concat();
            tempNums.splice(i, 1);
            let key = { from: nums[i], to: x, through: nums };
            let h;
            let keyStr = $.map(key, function(val) {
                return val;
            }).toString();
            if (memo.get(keyStr) !== undefined) {
                h = memo.get(keyStr);
            } else {
                h = heldKarpPath(nums[i], rt, tempNums, wm, memo, dir);
                memo.set(keyStr, h);
            }

            dist[i] = wm[x][nums[i]] + h.distance;

            if (dist[i] < min) {
                min = dist[i];
                minArr = h.arr.concat();
                minArr.push(x);
            }
        }

        if (!dir) {
            const minArrInv = minArr.concat();

            clearCaStyle();
            let pathList = new LinkedList();
            let nodes = getAllNodes(ca);

            for (let i = 0; i < minArrInv.length; i++) {
                pathList.add(nodes[minArrInv[i]]);
                pathList.add(
                    nodes[minArrInv[i]].edgesWith(nodes[minArrInv[(i + 1) % minArrInv.length]])[0]
                );
                //changed code
            }

            pathList.traverse(animation_check.checked, false);
        }

        return { distance: Math.min(...dist), arr: minArr };
    }
}

/**
 *
 * @param {boolean} dir whether this is for a directed graph or not
 */
function isComplete(dir) {
    let n = getAllNodes(cy).length;
    return (n * (n - 1)) / (dir ? 1 : 2) === cy.edges(':grabbable').length;
}
