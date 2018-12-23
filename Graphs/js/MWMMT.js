// Minimal weight matching multi-thread
// Use in worker
function onmessage(message) {
    const { data } = message;
    const { weightMatrix, start, end, eles } = data;
    const len = weightMatrix.length;
    const matchedNumber = len - (len % 2);
    let minPairing = [];
    let minWeight = Infinity;

    /**
     * @function
     * @private
     * @param {Array<cytoscape.Collection>} eles
     * @param {Array<int>} matches
     * @param {int} weight
     * @param {int} i
     * @return void
     * */
    function matching(eles, matches, weight, i) {
        let tempWeight;
        let tempEles;
        if (i === matchedNumber) {
            minPairing = matches.concat();
            minWeight = weight;
        } else {
            for (let x = 0; x < len; x++) {
                for (let y = x + 1; y < len; y++) {
                    if (eles[x] !== -1 && eles[y] !== -1 && weightMatrix[x][y] !== 0) {
                        tempWeight = weight + weightMatrix[x][y];
                        if (tempWeight < minWeight) {
                            matches[i] = x;
                            matches[i + 1] = y;
                            tempEles = eles.concat();
                            tempEles[x] = -1;
                            tempEles[y] = -1;
                            matching(tempEles, matches, tempWeight, i + 2);
                        }
                    }
                }
            }
        }
    }

    const matches = new Array(len);
    let tempWeight;
    let tempEles;
    for (let x = start; x < end; x++)
        for (let y = x + 1; y < len; y++) {
            if (weightMatrix[x][y] !== 0) {
                tempWeight = weightMatrix[x][y];
                if (tempWeight < minWeight) {
                    matches[0] = x;
                    matches[1] = y;
                    tempEles = eles.concat();
                    tempEles[x] = -1;
                    tempEles[y] = -1;
                    matching(tempEles, matches, tempWeight, 2);
                }
            }
        }
    postMessage({ minPairing, minWeight });
}
