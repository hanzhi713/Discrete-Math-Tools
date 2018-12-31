function heldKarp(){
    stopAnimation();
    const root = getCyStartNode('Please enter the id of the starting node', '1');
    clearCyStyle();
    cy.elements(':grabbable').select();
    if (!isComplete()) return alert('This graph is not complete! Please set the possibility that two nodes are connected to 1.');
    const nodes = cy.nodes(':selected');
    cy.elements(':grabbable').unselect();
    
    //construct weight matrix
    let wm = new Array(nodes.length);

    for(let i = 0; i < nodes.length; i++){
        wm[i] = new Array(nodes.length);
        wm[i][i] = 0;
        for(let j = 0; j < nodes.length; j++){
            if(i === j) continue;
            wm[i][j] = getWeight(nodes[i].edgesWith(nodes[j]));
        }
    }
    
    heldKarpHelp(wm, root);

}

/**
 * 
 * @param {number[]} wm weight matrix
 * @param {number} x starting point
 */
function heldKarpHelp(wm, x) {
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
    const pathList = new LinkedList();

    minArr.array.forEach(element => {
        pathList.add(nodes[element]);
    });

    pathList.traverse();

    return { distance: min, arr: minArr };
}

/**
 *
 * @param {number} x current node
 * @param {number} rt starting node
 * @param {number[]} nums nodes to connect
 * @param {number[]} wm distance matrix; wm(ij) represents distance from i to j
 * @param {number[]} memo memo(ij) represents min distance between nodes i j
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

        const pathList = new LinkedList();

        minArr.array.forEach(element => {
            pathList.add(nodes[element]);
        });

        pathList.traverse();

        return { distance: Math.min(...dist), arr: minArr };
    }
}

function isComplete() {
    let n = cy.nodes.length;
    return (n * (n - 1)) / 2 === cy.edges.length;
}
