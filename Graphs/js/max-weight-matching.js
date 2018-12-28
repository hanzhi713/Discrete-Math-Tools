/**
 * Max weight matching algorithm adapted from NetworkX's source code
 * @param {number[][]} weightMatrix
 * @param {boolean} maxcardinality
 * @returns {Array<[number, number]>} Array of pair of node indices
 */
function maxWeightMatching(weightMatrix, maxcardinality) {
    /**
     * Dummy value which is different from any node
     */
    const NoNode = -1;

    /**        
    * Representation of a non-trivial blossom or sub-blossom.

    * b.childs is an ordered list of b's sub-blossoms, starting with
    * the base and going round the blossom.

    * b.edges is the list of b's connecting edges, such that
    * b.edges[i] = (v, w) where v is a vertex in b.childs[i]
    * and w is a vertex in b.childs[wrap(i+1)].

    * If b is a top-level S-blossom,
    * b.mybestedges is a list of least-slack edges to neighbouring
    * S-blossoms, or None if no such list has been computed yet.
    * This is used for efficient computation of delta3.
    */
    class Blossom {
        constructor() {
            /**
             * @type {Array<number|Blossom>}
             */
            this.childs = [];
            /**
             * @type {Array<[number, number]>}
             */
            this.edges = [];
            /**
             * @type {Array<[number, number]>}
             */
            this.mybestedges = undefined;
        }

        /**
         * Generate the blossom's leaf vertices.
         * @yields {number}
         */
        *leaves() {
            for (const t of this.childs) {
                if (t instanceof Blossom) {
                    for (const v of t.leaves()) yield v;
                } else yield t;
            }
        }
    }
    if (weightMatrix.length === 0) return;

    // Get a list of vertices.
    const gnodes = weightMatrix[0].map((x, i) => i);

    // Find the maximum edge weight.
    const maxweight = Math.max(...weightMatrix.map(arr => Math.max(...arr)));
    const allinteger = weightMatrix.every(arr => arr.every(x => Number.isInteger(x)));

    /**
     * If v is a matched vertex, mate[v] is its partner vertex.
     * If v is a single vertex, v does not occur as a key in mate.
     * Initially all vertices are single; updated during augmentation.
     * @type {Map<number, number>}
     */
    const mate = new Map();

    /**
     * If b is a top-level blossom,
     * label.get(b) is None if b is unlabeled (free),
     *                 1 if b is an S-blossom,
     *                 2 if b is a T-blossom.
     * The label of a vertex is found by looking at the label of its top-level
     * containing blossom.
     * If v is a vertex inside a T-blossom, label[v] is 2 iff v is reachable
     * from an S-vertex outside the blossom.
     * Labels are assigned during a stage and reset after each augmentation.
     * @type {Map<number|Blossom, number>}
     */
    const label = new Map();

    /**
     * If b is a labeled top-level blossom,
     * labeledge[b] = (v, w) is the edge through which b obtained its label
     * such that w is a vertex in b, or None if b's base vertex is single.
     * If w is a vertex inside a T-blossom and label[w] == 2,
     * labeledge[w] = (v, w) is an edge through which w is reachable from
     * outside the blossom.
     * @type {Map<number|Blossom, [number, number]>}
     */
    const labeledge = new Map();

    /**
     * If v is a vertex, inblossom[v] is the top-level blossom to which v
     * belongs.
     * If v is a top-level vertex, inblossom[v] == v since v is itself
     * a (trivial) top-level blossom.
     * Initially all vertices are top-level trivial blossoms.
     * @type {Map<number, number|Blossom>}
     */
    const inblossom = new Map(gnodes.map(x => [x, x]));

    /**
     * If b is a sub-blossom,
     * blossomparent[b] is its immediate parent (sub-)blossom.
     * If b is a top-level blossom, blossomparent[b] is None.
     * @type {Map<number|Blossom, Blossom|null>}
     */
    const blossomparent = new Map(gnodes.map(x => [x, null]));

    /**
     * If b is a (sub-)blossom,
     * blossombase[b] is its base VERTEX (i.e. recursive sub-blossom).
     * @type {Map<number|Blossom, number>}
     */
    const blossombase = new Map(gnodes.map(x => [x, x]));

    /**
     * If w is a free vertex (or an unreached vertex inside a T-blossom),
     * bestedge[w] = (v, w) is the least-slack edge from an S-vertex,
     * or None if there is no such edge.
     * If b is a (possibly trivial) top-level S-blossom,
     * bestedge[b] = (v, w) is the least-slack edge to a different S-blossom
     * (v inside b), or None if there is no such edge.
     * This is used for efficient computation of delta2 and delta3.
     * @type {Map<number|Blossom, [number, number]>}
     */
    const bestedge = new Map();
    /**
     * If v is a vertex,
     * dualvar[v] = 2 * u(v) where u(v) is the v's variable in the dual
     * optimization problem (if all edge weights are integers, multiplication
     * by two ensures that all values remain integers throughout the algorithm).
     * Initially, u(v) = maxweight / 2.
     * @type {Map<number, number>}
     */
    const dualvar = new Map(gnodes.map(x => [x, maxweight]));

    /**
     * If b is a non-trivial blossom,
     * blossomdual[b] = z(b) where z(b) is b's variable in the dual
     * optimization problem.
     * @type {Map<Blossom, number>}
     */
    const blossomdual = new Map();

    /**
     * If(v, w) in allowedge or(w, v) in allowedg, then the edge
     * (v, w) is known to have zero slack in the optimization problem;
     * otherwise the edge may or may not have zero slack.
     * @type {Map<string, boolean>}
     */
    const allowedge = new Map();

    /**
     * @type {number[]}
     * Queue of newly discovered S - vertices.
     */
    let queue = [];

    /**
     * Return 2 * slack of edge (v, w) (does not work inside blossoms).
     * @param {number} v
     * @param {number} w
     * @return {number}
     */
    function slack(v, w) {
        return dualvar.get(v) + dualvar.get(w) - 2 * weightMatrix[v][w];
    }

    /**
     * @param {number} v
     * @return {number[]}
     */
    function neighbours(v) {
        const vs = [];
        weightMatrix[v].map((x, i) => {
            if (x > 0) vs.push(i);
            return undefined;
        });
        return vs;
    }

    function assertTrue(a) {
        if (!a) throw new Error();
    }

    /**
     * is null or undefined
     * @param {Map<any, any>} m
     * @returns {boolean}
     */
    function nu(m, k) {
        const v = m.get(k);
        return v === undefined || v === null;
    }

    /**
     * Assign label t to the top-level blossom containing vertex w,
     * coming through an edge from vertex v.
     * @param {number} w
     * @param {number} t
     * @param {number} v
     */
    function assignLabel(w, t, v) {
        const b = inblossom.get(w);
        assertTrue(nu(label, w) && nu(label, b));
        label.set(w, t);
        label.set(b, t);
        if (v !== null) {
            labeledge.set(w, [v, w]);
            labeledge.set(b, [v, w]);
        } else {
            labeledge.set(w, null);
            labeledge.set(b, null);
        }
        bestedge.set(w, null);
        bestedge.set(b, null);
        if (t === 1) {
            // b became an S-vertex/blossom; add it(s vertices) to the queue.
            if (b instanceof Blossom) queue.push(...b.leaves());
            else queue.push(b);
        } else if (t === 2) {
            // b became a T-vertex/blossom; assign label S to its mate.
            // (If b is a non-trivial blossom, its base is the only vertex
            // with an external mate.)
            const base = blossombase.get(b);
            assignLabel(mate.get(base), 1, base);
        }
    }

    /**
     * Trace back from vertices v and w to discover either a new blossom
     * or an augmenting path. Return the base vertex of the new blossom,
     * or NoNode if an augmenting path was found.
     * @param {number} v
     * @param {number} w
     * @return {number}
     */
    function scanBlossom(v, w) {
        const path = [];
        let base = NoNode;
        while (v !== NoNode) {
            // Look for a breadcrumb in v's blossom or put a new breadcrumb.
            let b = inblossom.get(v);
            if (label.get(b) & 4) {
                base = blossombase.get(b);
                break;
            }
            assertTrue(label.get(b) === 1);
            path.push(b);
            label.set(b, 5);
            // Trace one step back.
            if (labeledge.get(b) === null) {
                // The base of blossom b is single; stop tracing this path.
                assertTrue(!mate.has(blossombase.get(b)));
                v = NoNode;
            } else {
                assertTrue(labeledge.get(b)[0] === mate.get(blossombase.get(b)));
                [v] = labeledge.get(b);
                b = inblossom.get(v);
                assertTrue(label.get(b) === 2);
                // b is a T-blossom; trace one more step back.
                [v] = labeledge.get(b);
            }
            // Swap v and w so that we alternate between both paths.
            if (w !== NoNode) [v, w] = [w, v];
        }
        // Remove breadcrumbs.
        for (const b of path) {
            label.set(b, 1);
        }
        return base;
    }

    /**
     * Construct a new blossom with given base, through S-vertices v and w.
     * Label the new blossom as S; set its dual variable to zero;
     * relabel its T-vertices to S and add them to the queue.
     * @param {number} base
     * @param {number} v
     * @param {number} w
     */
    function addBlossom(base, v, w) {
        const bb = inblossom.get(base);
        let bv = inblossom.get(v);
        let bw = inblossom.get(w);
        // Create blossom
        const b = new Blossom();
        blossombase.set(b, base);
        blossomparent.set(b, null);
        blossomparent.set(bb, b);
        // Make list of sub-blossoms and their interconnecting edge endpoints.
        const path = [];
        const edgs = [[v, w]];
        b.childs = path;
        b.edges = edgs;
        while (bv !== bb) {
            blossomparent.set(bv, b);
            path.push(bv);
            edgs.push(labeledge.get(bv));
            assertTrue(
                label.get(bv) === 2 ||
                    (label.get(bv) === 1 && labeledge.get(bv)[0] === mate.get(blossombase.get(bv)))
            );
            // Trace one step back
            [v] = labeledge.get(bv);
            bv = inblossom.get(v);
        }
        // Add base sub-blossom; reverse lists.
        path.push(bb);
        path.reverse();
        edgs.reverse();
        // Trace back from w to base.
        while (bw !== bb) {
            blossomparent.set(bw, b);
            path.push(bw);
            edgs.push([labeledge.get(bw)[1], labeledge.get(bw)[0]]);
            assertTrue(
                label.get(bw) === 2 ||
                    (label.get(bw) === 1 && labeledge.get(bw)[0] === mate.get(blossombase.get(bw)))
            );
            // Trace one step back
            [w] = labeledge.get(bw);
            bw = inblossom.get(w);
        }
        // Set label to S
        assertTrue(label.get(bb) === 1);
        label.set(b, 1);
        labeledge.set(b, labeledge.get(bb));
        // Set dual variable to zero.
        blossomdual.set(b, 0);
        // Relabel vertices
        for (const i of b.leaves()) {
            if (label.get(inblossom.get(i)) === 2) {
                // This T-vertex now turns into an S-vertex because it becomes
                // part of an S-blossom; add it to the queue.
                queue.push(i);
            }
            inblossom.set(i, b);
        }
        // Compute b.mybestedges.
        /**
         * @type {Map<number, [number, number]>}
         */
        const bestedgeto = new Map();
        for (const bv of path) {
            let nblist = [];
            if (bv instanceof Blossom) {
                if (bv.mybestedges !== undefined) {
                    // Walk this subblossom's least-slack edges.
                    nblist = bv.mybestedges;
                    // The sub-blossom won't need this data again.
                    bv.mybestedges = undefined;
                } else {
                    for (const i of bv.leaves()) {
                        for (const j of neighbours(i)) if (j !== i) nblist.push([i, j]);
                    }
                }
            } else {
                for (const j of neighbours(bv)) {
                    if (bv !== j) nblist.push([bv, j]);
                }
            }
            for (const k of nblist) {
                let [i, j] = k;
                if (inblossom.get(j) === b) [i, j] = [j, i];
                const bj = inblossom.get(j);
                if (
                    bj !== b &&
                    label.get(bj) === 1 &&
                    (!bestedgeto.has(bj) || slack(i, j) < slack(...bestedgeto.get(bj)))
                ) {
                    bestedgeto.set(bj, k);
                }
            }
            // Forget about least-slack edge of the subblossom.
            bestedge.set(bv, null);
        }
        b.mybestedges = [...bestedgeto.values()];
        // Select bestedge[b].
        let mybestedge;
        let mybestslack;
        bestedge.set(b, null);
        for (const k of b.mybestedges) {
            const kslack = slack(...k);
            if (mybestedge === undefined || kslack < mybestslack) {
                mybestedge = k;
                mybestslack = kslack;
            }
        }
        bestedge.set(b, mybestedge);
    }

    /**
     * Expand the given top-level blossom.
     * @param {Blossom} b
     * @param {boolean} endstage
     */
    function expandBlossom(b, endstage) {
        // Convert sub-blossoms into top-level blossoms.
        for (const s of b.childs) {
            blossomparent.set(s, null);
            if (s instanceof Blossom) {
                if (endstage && blossomdual.get(s) === 0) {
                    // Recursively expand this sub-blossom.
                    expandBlossom(s, endstage);
                } else {
                    for (const v of s.leaves()) inblossom.set(v, s);
                }
            } else inblossom.set(s, s);
        }
        // If we expand a T-blossom during a stage, its sub-blossoms must be
        // relabeled.
        if (!endstage && label.get(b) === 2) {
            // Start at the sub-blossom through which the expanding
            // blossom obtained its label, and relabel sub-blossoms untili
            // we reach the base.
            // Figure out through which sub-blossom the expanding blossom
            // obtained its label initially.
            const entrychild = inblossom.get(labeledge.get(b)[1]);
            // Decide in which direction we will go round the blossom.
            let j = b.childs.indexOf(entrychild);
            let jstep;
            if (j & 1) {
                // Start index is odd; go forward and wrap.
                j -= b.childs.length;
                jstep = 1;
                // Start index is even; go backward.
            } else jstep = -1;
            // Move along the blossom until we get to the base.
            let [v, w] = labeledge.get(b);
            const len = b.edges.length;
            while (j !== 0) {
                // Relabel the T-sub-blossom
                let p;
                let q;
                if (jstep === 1) [p, q] = b.edges[j < 0 ? len + j : j];
                else [q, p] = b.edges[j - 1 < 0 ? len + j - 1 : j - 1];
                label.set(w, null);
                label.set(q, null);
                assignLabel(w, 2, v);
                // Step to the next S-sub-blossom and note its forward edge.
                allowedge.set([p, q].toString(), true);
                allowedge.set([q, p].toString(), true);
                j += jstep;
                if (jstep === 1) [v, w] = b.edges[j < 0 ? len + j : j];
                else [w, v] = b.edges[j - 1 < 0 ? len + j - 1 : j - 1];
                // Step to the next T-sub-blossom.
                allowedge.set([v, w].toString(), true);
                allowedge.set([w, v].toString(), true);
                j += jstep;
            }
            // Relabel the base T-sub-blossom WITHOUT stepping through to
            // its mate (so don't call assignLabel).
            const bw = b.childs[j < 0 ? len + j : j];
            label.set(w, 2);
            label.set(bw, 2);
            labeledge.set(w, [v, w]);
            labeledge.set(bw, [v, w]);
            bestedge.set(bw, null);
            // Continue along the blossom until we get back to entrychild.
            j += jstep;
            while (b.childs[j < 0 ? len + j : j] !== entrychild) {
                // Examine the vertices of the sub-blossom to see whether
                // it is reachable from a neighbouring S-vertex outside the
                // expanding blossom.
                const bv = b.childs[j < 0 ? len + j : j];
                if (label.get(bv) === 1) {
                    // This sub-blossom just got label S through one of its
                    // neighbours; leave it be.
                    j += jstep;
                    continue;
                }
                if (bv instanceof Blossom) {
                    for (const i of bv.leaves()) if (label.get(i)) break;
                } else v = bv;
                // If the sub-blossom contains a reachable vertex, assign
                // label T to the sub-blossom.
                if (label.get(v)) {
                    assertTrue(label.get(v) === 2);
                    assertTrue(inblossom.get(v) === bv);
                    label.set(v, null);
                    label.set(mate.get(blossombase.get(bv)), null);
                    assignLabel(v, 2, labeledge.get(v)[0]);
                }
                j += jstep;
            }
        }
        label.delete(b);
        labeledge.delete(b);
        bestedge.delete(b);
        blossomparent.delete(b);
        blossombase.delete(b);
        blossomdual.delete(b);
    }

    /**
     *
     * Swap matched/unmatched edges over an alternating path through blossom b
     * between vertex v and the base vertex. Keep blossom bookkeeping
     * consistent.
     * @param {Blossom} b
     * @param {number|Blossom} v
     */
    function augmentBlossom(b, v) {
        // Bubble up through the blossom tree from vertex v to an immediate
        // sub-blossom of b.
        let t = v;
        while (blossomparent.get(t) !== b) t = blossomparent.get(t);
        // Recursively deal with the first sub-blossom.
        if (t instanceof Blossom) augmentBlossom(t, v);
        // Decide in which direction we will go round the blossom.
        const i = b.childs.indexOf(t);
        let j = i;
        let jstep;
        if (i & 1) {
            // Start index is odd; go forward and wrap.
            j -= b.childs.length;
            jstep = 1;
        }
        // Start index is even; go backward.
        else jstep = -1;
        const len = b.edges.length;
        // Move along the blossom until we get to the base.
        while (j !== 0) {
            // Step to the next sub-blossom and augment it recursively.
            j += jstep;
            t = b.childs[j < 0 ? len + j : j];
            let w;
            let x;
            if (jstep === 1) [w, x] = b.edges[j < 0 ? len + j : j];
            else [x, w] = b.edges[j - 1 < 0 ? len + j - 1 : j - 1];

            if (t instanceof Blossom) augmentBlossom(t, w);
            // Step to the next sub-blossom and augment it recursively.
            j += jstep;
            t = b.childs[j < 0 ? len + j : j];
            if (t instanceof Blossom) augmentBlossom(t, x);
            // Match the edge connecting those sub-blossoms.
            mate.set(w, x);
            mate.set(x, w);
        }
        // Rotate the list of sub-blossoms to put the new base at the front.
        b.childs = b.childs.slice(i).concat(b.childs.slice(0, i));
        b.edges = b.edges.slice(i).concat(b.edges.slice(0, i));
        blossombase.set(b, blossombase.get(b.childs[0]));
        assertTrue(blossombase.get(b) === v);
    }

    /**
     * Swap matched/unmatched edges over an alternating path between two
     * single vertices. The augmenting path runs through S-vertices v and w.
     * @param {number} v
     * @param {number} w
     */
    function augmentMatching(v, w) {
        for (let [s, j] of [[v, w], [w, v]]) {
            // Match vertex s to vertex j. Then trace back from s
            // until we find a single vertex, swapping matched and unmatched
            // edges as we go.
            while (true) {
                const bs = inblossom.get(s);
                assertTrue(label.get(bs) === 1);
                assertTrue(
                    (labeledge.get(bs) === null && !mate.has(blossombase.get(bs))) ||
                        labeledge.get(bs)[0] === mate.get(blossombase.get(bs))
                );
                // Augment through the S-blossom from s to base.
                if (bs instanceof Blossom) augmentBlossom(bs, s);
                // Update mate[s]
                mate.set(s, j);
                // Trace one step back.
                if (labeledge.get(bs) === null)
                    // Reached single vertex; stop.
                    break;
                const t = labeledge.get(bs)[0];
                const bt = inblossom.get(t);
                assertTrue(label.get(bt) === 2);
                // Trace one more step back.
                [s, j] = labeledge.get(bt);
                // Augment through the T-blossom from j to base.
                assertTrue(blossombase.get(bt) === t);
                if (bt instanceof Blossom) augmentBlossom(bt, j);
                // Update mate[j]
                mate.set(j, s);
            }
        }
    }

    /**
     * Verify that the optimum solution has been reached.
     */
    function verifyOptimum() {
        let vdualoffset;
        if (maxcardinality)
            // Vertices may have negative dual;
            // find a constant non-negative number to add to all vertex duals.
            vdualoffset = Math.max(0, -Math.min(...dualvar.values()));
        else vdualoffset = 0;
        // 0. all dual variables are non-negative
        assertTrue(Math.min(...dualvar.values()) + vdualoffset >= 0);
        assertTrue(blossomdual.size === 0 || Math.min(...blossomdual.values()) >= 0);
        // 0. all edges have non-negative slack and
        // 1. all matched edges have zero slack;
        const edges = [];
        for (let i = 0; i < weightMatrix.length; i++) {
            for (let j = i + 1; j < weightMatrix[i].length; j++) {
                const wt = weightMatrix[i][j];
                if (wt !== 0) {
                    edges.push([i, j, wt]);
                }
            }
        }
        for (const [i, j, wt] of edges) {
            if (i === j) continue; // ignore self-loops
            let s = dualvar.get(i) + dualvar.get(j) - 2 * wt;
            const iblossoms = [i];
            const jblossoms = [j];
            while (blossomparent.get(iblossoms[iblossoms.length - 1]) !== null)
                iblossoms.push(blossomparent.get(iblossoms[iblossoms.length - 1]));
            while (blossomparent.get(jblossoms[jblossoms.length - 1]) !== null)
                jblossoms.push(blossomparent.get(jblossoms[jblossoms.length - 1]));
            iblossoms.reverse();
            jblossoms.reverse();
            const len = Math.min(iblossoms.length, jblossoms.length);
            for (let x = 0; x < len; x++) {
                const [bi, bj] = [iblossoms[x], jblossoms[x]];
                if (bi !== bj) break;
                s += 2 * blossomdual.get(bi);
            }
            assertTrue(s >= 0);
            if (mate.get(i) === j || mate.get(j) === i) {
                assertTrue(mate.get(i) === j && mate.get(j) === i);
                assertTrue(s === 0);
            }
        }
        // 2. all single vertices have zero dual value;
        for (const v of gnodes) assertTrue(mate.has(v) || dualvar.get(v) + vdualoffset === 0);
        // 3. all blossoms with positive dual value are full.
        for (const b of blossomdual.keys())
            if (blossomdual.get(b) > 0) {
                assertTrue(b.edges.length % 2 === 1);
                for (let x = 1; x < b.edges.length; x += 2) {
                    const [i, j] = b.edges[x];
                    assertTrue(mate.get(i) === j && mate.get(j) === i);
                }
            }
        // Ok.
    }

    // Main loop: continue until no further improvement is possible.
    while (true) {
        // Each iteration of this loop is a "stage".
        // A stage finds an augmenting path and uses that to improve
        // the matching.

        // Remove labels from top-level blossoms/vertices.
        label.clear();
        labeledge.clear();

        // Forget all about least-slack edges.
        bestedge.clear();
        for (const b of blossomdual.keys()) b.mybestedges = undefined;

        // Loss of labeling means that we can not be sure that currently
        // allowable edges remain allowable throughout this stage.
        allowedge.clear();

        // Make queue empty.
        queue = [];

        // Label single blossoms/vertices with S and put them in the queue.
        for (const v of gnodes) {
            if (!mate.has(v) && nu(label, inblossom.get(v))) assignLabel(v, 1, null);
        }

        // Loop until we succeed in augmenting the matching.
        let augmented = 0;
        while (true) {
            // Each iteration of this loop is a "substage".
            // A substage tries to find an augmenting path;
            // if found, the path is used to improve the matching and
            // the stage ends. If there is no augmenting path, the
            // primal-dual method is used to pump some slack out of
            // the dual variables.

            // Continue labeling until all vertices which are reachable
            // through an alternating path have got a label.
            while (queue.length > 0 && !augmented) {
                // Take an S vertex from the queue.
                const v = queue.pop();
                assertTrue(label.get(inblossom.get(v)) === 1);

                let kslack;

                // Scan its neighbours:
                for (const w of neighbours(v)) {
                    if (w === v) continue; // ignore self-loops
                    // w is a neighbour to v
                    const bv = inblossom.get(v);
                    const bw = inblossom.get(w);
                    if (bv === bw)
                        // this edge is internal to a blossom; ignore it
                        continue;
                    if (!allowedge.has([v, w].toString())) {
                        kslack = slack(v, w);
                        if (kslack <= 0) {
                            // edge k has zero slack => it is allowable
                            allowedge.set([v, w].toString(), true);
                            allowedge.set([w, v].toString(), true);
                        }
                    }
                    if (allowedge.has([v, w].toString())) {
                        if (nu(label, bw))
                            // (C1) w is a free vertex;
                            // label w with T and label its mate with S (R12).
                            assignLabel(w, 2, v);
                        else if (label.get(bw) === 1) {
                            // (C2) w is an S-vertex (not in the same blossom);
                            // follow back-links to discover either an
                            // augmenting path or a new blossom.
                            const base = scanBlossom(v, w);
                            if (base !== NoNode)
                                // Found a new blossom; add it to the blossom
                                // bookkeeping and turn it into an S-blossom.
                                addBlossom(base, v, w);
                            else {
                                // Found an augmenting path; augment the
                                // matching and end this stage.
                                augmentMatching(v, w);
                                augmented = 1;
                                break;
                            }
                        } else if (nu(label, w)) {
                            // w is inside a T-blossom, but w itself has not
                            // yet been reached from outside the blossom;
                            // mark it as reached (we need this to relabel
                            // during T-blossom expansion).
                            assertTrue(label.get(bw) === 2);
                            label.set(w, 2);
                            labeledge.set(w, [v, w]);
                        }
                    } else if (label.get(bw) === 1) {
                        // keep track of the least-slack non-allowable edge to
                        // a different S-blossom.
                        if (nu(bestedge, bv) || kslack < slack(...bestedge.get(bv)))
                            bestedge.set(bv, [v, w]);
                    } else if (nu(label, w)) {
                        // w is a free vertex (or an unreached vertex inside
                        // a T-blossom) but we can not reach it yet;
                        // keep track of the least-slack edge that reaches w.
                        if (nu(bestedge, w) || kslack < slack(...bestedge.get(w)))
                            bestedge.set(w, [v, w]);
                    }
                }
            }

            if (augmented) break;

            // There is no augmenting path under these constraints;
            // compute delta and reduce slack in the optimization problem.
            // (Note that our vertex dual variables, edge slacks and delta's
            // are pre-multiplied by two.)
            let deltatype = -1;
            let delta;
            let deltaedge;
            let deltablossom;

            // Compute delta1: the minimum value of any vertex dual.
            if (!maxcardinality) {
                deltatype = 1;
                delta = Math.min(...dualvar.values());
            }

            // Compute delta2: the minimum slack on any edge between
            // an S-vertex and a free vertex.
            for (const v of gnodes) {
                if (nu(label, inblossom.get(v)) && !nu(bestedge, v)) {
                    const d = slack(...bestedge.get(v));
                    if (deltatype === -1 || d < delta) {
                        delta = d;
                        deltatype = 2;
                        deltaedge = bestedge.get(v);
                    }
                }
            }

            // Compute delta3: half the minimum slack on any edge between
            // a pair of S-blossoms.
            for (const b of blossomparent.keys()) {
                if (blossomparent.get(b) === null && label.get(b) === 1 && !nu(bestedge, b)) {
                    const kslack = slack(...bestedge.get(b));
                    if (allinteger) assertTrue(kslack % 2 === 0);
                    const d = kslack / 2;
                    if (deltatype === -1 || d < delta) {
                        delta = d;
                        deltatype = 3;
                        deltaedge = bestedge.get(b);
                    }
                }
            }

            // Compute delta4: minimum z variable of any T-blossom.
            for (const b of blossomdual.keys()) {
                if (
                    blossomparent.get(b) === null &&
                    label.get(b) === 2 &&
                    (deltatype === -1 || blossomdual.get(b) < delta)
                ) {
                    delta = blossomdual.get(b);
                    deltatype = 4;
                    deltablossom = b;
                }
            }

            if (deltatype === -1) {
                // No further improvement possible; max-cardinality optimum
                // reached. Do a final delta update to make the optimum
                // verifyable.
                assertTrue(maxcardinality);
                deltatype = 1;
                delta = Math.max(0, Math.min(...dualvar.values()));
            }

            // Update dual variables according to delta.
            for (const v of gnodes) {
                if (label.get(inblossom.get(v)) === 1)
                    // S-vertex: 2*u = 2*u - 2*delta
                    dualvar.set(v, dualvar.get(v) - delta);
                else if (label.get(inblossom.get(v)) === 2)
                    // T-vertex: 2*u = 2*u + 2*delta
                    dualvar.set(v, dualvar.get(v) + delta);
            }
            for (const b of blossomdual.keys()) {
                if (blossomparent.get(b) === null) {
                    if (label.get(b) === 1)
                        // top-level S-blossom: z = z + 2*delta
                        blossomdual.set(b, blossomdual.get(b) + delta);
                    else if (label.get(b) === 2)
                        // top-level T-blossom: z = z - 2*delta
                        blossomdual.set(b, blossomdual.get(b) - delta);
                }
            }

            // Take action at the point where minimum delta occurred.
            if (deltatype === 1)
                // No further improvement possible; optimum reached.
                break;
            else if (deltatype === 2) {
                // Use the least-slack edge to continue the search.
                const [v, w] = deltaedge;
                assertTrue(label.get(inblossom.get(v)) === 1);
                allowedge.set([v, w].toString(), true);
                allowedge.set([w, v].toString(), true);
                queue.push(v);
            } else if (deltatype === 3) {
                // Use the least-slack edge to continue the search.
                const [v, w] = deltaedge;
                allowedge.set([v, w].toString(), true);
                allowedge.set([w, v].toString(), true);
                assertTrue(label.get(inblossom.get(v)) === 1);
                queue.push(v);
            } else if (deltatype === 4)
                // Expand the least-z blossom.
                expandBlossom(deltablossom, false);
        }

        // End of a this substage.

        // Paranoia check that the matching is symmetric.
        for (const v of mate.keys()) {
            assertTrue(mate.get(mate.get(v)) === v);
        }

        // Stop when no more augmenting path can be found.
        if (!augmented) break;

        // End of a stage; expand all S-blossoms which have zero dual.
        const blossomkeys = [];
        for (const b of blossomdual.keys()) {
            blossomkeys.push(b);
        }

        for (const b of blossomkeys) {
            if (!blossomdual.has(b)) continue; // already expanded
            if (blossomparent.get(b) === null && label.get(b) === 1 && blossomdual.get(b) === 0)
                expandBlossom(b, true);
        }
    }

    if (allinteger) verifyOptimum();

    const matchings = {};
    const results = [];
    for (const [k, v] of mate) {
        if (!([v, k].toString() in matchings)) {
            matchings[[k, v]] = 1;
            results.push([k, v]);
        }
    }
    return results;
}
