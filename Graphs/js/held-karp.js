/**
 * 
 * @param {Array} wm weight matrix
 * @param {Number} x starting point
 */
function heldKarp(wm, x) {
    let n = wm.length;
    var memo = new Array(n);
    for (let i = 0; i < n; i++) {
        memo[i] = new Array(n);
        memo[i].map(j => -1);
    }

    let nums = new Array(n);
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
        let h = heldKarpPath(nums[i], x, tempNums, wm, memo);
        rst[i] = wm[x][nums[i]] + h.distance;

        if (wm[x][nums[i]] + h.distance < min) {
            min = wm[x][nums[i]] + h.distance;
            minArr = h.arr.concat();
            minArr.unshift(x);
        }
    }
    return { distance: min, arr: minArr };
}

/**
 *
 * @param {Number} x current node
 * @param {Number} rt starting node
 * @param {Array} nums nodes to connect
 * @param {Array} wm distance matrix; wm(ij) represents distance from i to j
 * @param {Array} memo memo(ij) represents min distance between nodes i j
 */
function heldKarpPath(x, rt, nums, wm, memo) {
    if (nums.length === 0) {
        return { distance: wm[x][rt], arr: [x] };
    } else {
        let dist = new Array(nums.length);
        let min = Infinity;
        let minArr;
        for (let i = 0; i < nums.length; i++) {
            let tempNums = nums.concat();
            tempNums.splice(i, 1);
            let h = heldKarpPath(nums[i], rt, tempNums, wm, memo);
            dist[i] = wm[x][nums[i]] + h.distance;

            if (dist[i] < min) {
                min = dist[i];
                minArr = h.arr.concat();
                minArr.push(x);
            }
        }

        return { distance: Math.min(...dist), arr: minArr };
    }
}

function isComplete() {
    let n = cy.nodes.length;
    return (n * (n - 1)) / 2 === cy.edges.length;
}
