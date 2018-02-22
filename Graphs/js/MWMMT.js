//Minimal weight matching multi-thread
//Use in worker
var onmessage = function (message) {
    var data = message.data;

    var weightMatrix = data.weightMatrix;
    var start = data.start;
    var end = data.end;
    var eles = data.eles;

    var len = weightMatrix.length;
    var matchedNumber = len - len % 2;
    var minPairing = [];
    var minWeight = Infinity;

    /**
     * @function
     * @private
     * @param {Array} eles
     * @param {Array} matches
     * @param {int} weight
     * @param {int} i
     * @return void
     * */
    function matching(eles, matches, weight, i) {
        var tempWeight, tempEles;
        if (i === matchedNumber) {
            minPairing = matches.concat();
            minWeight = weight;
        }
        else {
            for (var x = 0; x < len; x++) {
                for (var y = x + 1; y < len; y++) {
                    if (eles[x] === -1 || eles[y] === -1 || weightMatrix[x][y] === 0)
                        continue;
                    tempWeight = weight + weightMatrix[x][y];
                    if (tempWeight >= minWeight)
                        continue;
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

    var matches = new Array(len);
    var tempWeight, tempEles;
    for (var x = start; x < end; x++)
        for (var y = x + 1; y < len; y++) {
            if (weightMatrix[x][y] === 0)
                continue;
            tempWeight = weightMatrix[x][y];
            if (tempWeight >= minWeight)
                continue;
            matches[0] = x;
            matches[1] = y;
            tempEles = eles.concat();
            tempEles[x] = -1;
            tempEles[y] = -1;
            matching(tempEles, matches, tempWeight, 2);
        }
    postMessage({minPairing: minPairing, minWeight: minWeight});
};
