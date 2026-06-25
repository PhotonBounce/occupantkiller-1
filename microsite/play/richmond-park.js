window.RichmondPark = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makemesh(geo, mat) {
        var mesh = new THREE.Mesh(geo, mat);
        objects.push(mesh);
        scene.add(mesh);
        return mesh;
    }

    function build() {
        var X = 5840;

        // ── 1. Dense woodland — 30 trees in 3 clusters ──────────────────────
        var darkGreen = new THREE.MeshLambertMaterial({ color: 0x1A4A1A });
        var brownBark  = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });

        // Cluster A — north-west
        var clusterA = [
            [-60, 0, -80], [-50, 0, -95], [-70, 0, -100],
            [-45, 0, -110], [-80, 0, -85], [-65, 0, -70],
            [-55, 0, -120], [-75, 0, -115], [-90, 0, -90],
            [-85, 0, -70]
        ];
        // Cluster B — south-east
        var clusterB = [
            [60, 0, 80], [70, 0, 95], [50, 0, 100],
            [80, 0, 85], [55, 0, 110], [75, 0, 120],
            [65, 0, 70], [90, 0, 90], [45, 0, 75],
            [85, 0, 105]
        ];
        // Cluster C — north-east
        var clusterC = [
            [60, 0, -80], [70, 0, -95], [55, 0, -105],
            [80, 0, -85], [65, 0, -70], [90, 0, -100],
            [45, 0, -90], [75, 0, -110], [85, 0, -75],
            [50, 0, -120]
        ];

        var clusters = [clusterA, clusterB, clusterC];
        for (var ci = 0; ci < clusters.length; ci++) {
            var cluster = clusters[ci];
            for (var ti = 0; ti < cluster.length; ti++) {
                var tx = cluster[ti][0];
                var tz = cluster[ti][2];

                var trunkGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
                var trunk = new THREE.Mesh(trunkGeo, brownBark);
                trunk.position.set(X + tx, 2.5, tz);
                objects.push(trunk);
                scene.add(trunk);

                var canopyGeo = new THREE.SphereGeometry(2.5, 8, 6);
                var canopy = new THREE.Mesh(canopyGeo, darkGreen);
                canopy.position.set(X + tx, 7.5, tz);
                objects.push(canopy);
                scene.add(canopy);
            }
        }

        // ── 2. Pen Ponds — 2 rectangular water features ─────────────────────
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x336699 });

        var pond1Geo = new THREE.BoxGeometry(20, 0.3, 12);
        var pond1 = new THREE.Mesh(pond1Geo, waterMat);
        pond1.position.set(X + 10, 0.15, 20);
        objects.push(pond1);
        scene.add(pond1);

        var pond2Geo = new THREE.BoxGeometry(20, 0.3, 12);
        var pond2 = new THREE.Mesh(pond2Geo, waterMat);
        pond2.position.set(X + 40, 0.15, 20);
        objects.push(pond2);
        scene.add(pond2);

        // ── 3. Deer herd — 12 deer ──────────────────────────────────────────
        var deerMat = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
        var legMat  = new THREE.MeshLambertMaterial({ color: 0x7A4F25 });

        var deerPositions = [
            [0, 0, 0], [5, 0, 3], [-4, 0, 5], [8, 0, -2],
            [-6, 0, -4], [3, 0, 8], [10, 0, 6], [-8, 0, 2],
            [6, 0, -7], [-3, 0, -8], [12, 0, -5], [-10, 0, 9]
        ];

        for (var di = 0; di < deerPositions.length; di++) {
            var dx = deerPositions[di][0];
            var dz = deerPositions[di][2];
            var bx = X - 20 + dx;
            var bz = -30 + dz;

            var bodyGeo = new THREE.BoxGeometry(1.5, 0.8, 0.8);
            var body = new THREE.Mesh(bodyGeo, deerMat);
            body.position.set(bx, 1.5, bz);
            objects.push(body);
            scene.add(body);

            var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            var head = new THREE.Mesh(headGeo, deerMat);
            head.position.set(bx + 0.85, 2.15, bz);
            objects.push(head);
            scene.add(head);

            var legOffsets = [
                [0.4, 0.3], [0.4, -0.3], [-0.4, 0.3], [-0.4, -0.3]
            ];
            for (var li = 0; li < legOffsets.length; li++) {
                var lxOff = legOffsets[li][0];
                var lzOff = legOffsets[li][1];
                var legGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 6);
                var leg = new THREE.Mesh(legGeo, legMat);
                leg.position.set(bx + lxOff, 0.75, bz + lzOff);
                objects.push(leg);
                scene.add(leg);
            }
        }

        // ── 4. Richmond Hill viewpoint terrace wall ──────────────────────────
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0xBBBBAA });

        var wallGeo = new THREE.BoxGeometry(30, 2, 0.5);
        var wall = new THREE.Mesh(wallGeo, stoneMat);
        wall.position.set(X + 0, 1, -50);
        objects.push(wall);
        scene.add(wall);

        // ── 5. White Lodge (Royal Ballet School) ─────────────────────────────
        var whiteMat  = new THREE.MeshLambertMaterial({ color: 0xF8F5EE });
        var roofMat   = new THREE.MeshLambertMaterial({ color: 0xDDDDD0 });

        var lodgeGeo = new THREE.BoxGeometry(25, 8, 15);
        var lodge = new THREE.Mesh(lodgeGeo, whiteMat);
        lodge.position.set(X + 80, 4, -30);
        objects.push(lodge);
        scene.add(lodge);

        // 6 columns
        var colPositions = [-10, -6, -2, 2, 6, 10];
        for (var ki = 0; ki < colPositions.length; ki++) {
            var colGeo = new THREE.CylinderGeometry(0.8, 0.8, 7, 8);
            var col = new THREE.Mesh(colGeo, whiteMat);
            col.position.set(X + 80 + colPositions[ki], 3.5, -22.5);
            objects.push(col);
            scene.add(col);
        }

        // Triangular pediment
        var pedimentGeo = new THREE.BoxGeometry(26, 2, 1);
        var pediment = new THREE.Mesh(pedimentGeo, roofMat);
        pediment.position.set(X + 80, 9, -22.5);
        objects.push(pediment);
        scene.add(pediment);

        // ── 6. Isabella Plantation — 4 low hedge walls ───────────────────────
        var hedgeMat = new THREE.MeshLambertMaterial({ color: 0x2D6A1A });

        var hedgeConfigs = [
            [X - 40, 0.75, 50, 20, 1, 1.5],
            [X - 40, 0.75, 70, 20, 1, 1.5],
            [X - 52, 0.75, 60, 1, 1, 21.5],
            [X - 28, 0.75, 60, 1, 1, 21.5]
        ];
        for (var hi = 0; hi < hedgeConfigs.length; hi++) {
            var hx = hedgeConfigs[hi][0];
            var hy = hedgeConfigs[hi][1];
            var hz = hedgeConfigs[hi][2];
            var hw = hedgeConfigs[hi][3];
            var hh = hedgeConfigs[hi][4];
            var hd = hedgeConfigs[hi][5];
            var hedgeGeo = new THREE.BoxGeometry(hw, hh, hd);
            var hedge = new THREE.Mesh(hedgeGeo, hedgeMat);
            hedge.position.set(hx, hy, hz);
            objects.push(hedge);
            scene.add(hedge);
        }

        // ── 7. Pembroke Lodge — hilltop cafe ─────────────────────────────────
        var creamMat  = new THREE.MeshLambertMaterial({ color: 0xF5F0E0 });

        var pembrokeGeo = new THREE.BoxGeometry(15, 6, 12);
        var pembroke = new THREE.Mesh(pembrokeGeo, creamMat);
        pembroke.position.set(X - 70, 3, -50);
        objects.push(pembroke);
        scene.add(pembroke);

        // Garden terrace — low platform
        var terraceGeo = new THREE.BoxGeometry(18, 0.5, 8);
        var terrace = new THREE.Mesh(terraceGeo, stoneMat);
        terrace.position.set(X - 70, 0.25, -42);
        objects.push(terrace);
        scene.add(terrace);

        // ── 8. Park gates — 2 ornate gate piers ──────────────────────────────
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var coneMat = new THREE.MeshLambertMaterial({ color: 0x777777 });

        var gateSets = [
            [X - 100, 0, 0],
            [X + 100, 0, 0]
        ];
        for (var gi = 0; gi < gateSets.length; gi++) {
            var gx = gateSets[gi][0];
            var gz = gateSets[gi][2];

            var pillar1Geo = new THREE.BoxGeometry(1, 8, 1);
            var pillar1 = new THREE.Mesh(pillar1Geo, gateMat);
            pillar1.position.set(gx - 2, 4, gz);
            objects.push(pillar1);
            scene.add(pillar1);

            var cap1Geo = new THREE.ConeGeometry(0.8, 1.5, 6);
            var cap1 = new THREE.Mesh(cap1Geo, coneMat);
            cap1.position.set(gx - 2, 8.75, gz);
            objects.push(cap1);
            scene.add(cap1);

            var pillar2Geo = new THREE.BoxGeometry(1, 8, 1);
            var pillar2 = new THREE.Mesh(pillar2Geo, gateMat);
            pillar2.position.set(gx + 2, 4, gz);
            objects.push(pillar2);
            scene.add(pillar2);

            var cap2Geo = new THREE.ConeGeometry(0.8, 1.5, 6);
            var cap2 = new THREE.Mesh(cap2Geo, coneMat);
            cap2.position.set(gx + 2, 8.75, gz);
            objects.push(cap2);
            scene.add(cap2);
        }

        // ── 9. Car park — 6 perimeter trees + 4 white bollards ───────────────
        var bollardMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var cpX = X + 50;
        var cpZ = 60;

        var cpTreePositions = [
            [-15, -12], [-5, -12], [5, -12],
            [-15, 12], [-5, 12], [5, 12]
        ];
        for (var pi = 0; pi < cpTreePositions.length; pi++) {
            var ptx = cpTreePositions[pi][0];
            var ptz = cpTreePositions[pi][1];

            var cpTrunkGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
            var cpTrunk = new THREE.Mesh(cpTrunkGeo, brownBark);
            cpTrunk.position.set(cpX + ptx, 2.5, cpZ + ptz);
            objects.push(cpTrunk);
            scene.add(cpTrunk);

            var cpCanopyGeo = new THREE.SphereGeometry(2.5, 8, 6);
            var cpCanopy = new THREE.Mesh(cpCanopyGeo, darkGreen);
            cpCanopy.position.set(cpX + ptx, 7.5, cpZ + ptz);
            objects.push(cpCanopy);
            scene.add(cpCanopy);
        }

        // 4 bollards
        var bollardPositions = [
            [-10, -8], [10, -8], [-10, 8], [10, 8]
        ];
        for (var bi = 0; bi < bollardPositions.length; bi++) {
            var blx = bollardPositions[bi][0];
            var blz = bollardPositions[bi][1];
            var bollardGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 6);
            var bollard = new THREE.Mesh(bollardGeo, bollardMat);
            bollard.position.set(cpX + blx, 0.5, cpZ + blz);
            objects.push(bollard);
            scene.add(bollard);
        }
    }

    function update(delta) { }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
