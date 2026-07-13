window.ArundelCastle = (function() {
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

    function mesh(geo, mat) {
        var m = new THREE.Mesh(geo, mat);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function lines(geo, mat) {
        var l = new THREE.LineSegments(geo, mat);
        scene.add(l);
        objects.push(l);
        return l;
    }

    function lambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function build() {
        castle();
        gatehouse();
        cathedral();
        stnicho();
        river();
        town();
        wildfowl();
        park();
        bridge();
    }

    function castle() {
        var stone1 = lambert(0xCC9966);
        var stone2 = lambert(0xBBAA88);
        var ox = 7000;

        // Central keep
        var keep = mesh(new THREE.BoxGeometry(14, 18, 14), stone1);
        keep.position.set(ox + 0, 9, 20);

        // Battlements on top of keep
        var b0 = mesh(new THREE.BoxGeometry(14, 2, 2), stone2);
        b0.position.set(ox + 0, 19, 27);
        var b1 = mesh(new THREE.BoxGeometry(14, 2, 2), stone2);
        b1.position.set(ox + 0, 19, 13);
        var b2 = mesh(new THREE.BoxGeometry(2, 2, 14), stone2);
        b2.position.set(ox + 7, 19, 20);
        var b3 = mesh(new THREE.BoxGeometry(2, 2, 14), stone2);
        b3.position.set(ox - 7, 19, 20);

        // 4 corner towers
        var towerPositions = [
            [ox + 9, 11, 29],
            [ox - 9, 11, 29],
            [ox + 9, 11, 11],
            [ox - 9, 11, 11]
        ];
        for (var i = 0; i < towerPositions.length; i++) {
            var t = mesh(new THREE.CylinderGeometry(4, 4, 22, 10), stone1);
            t.position.set(towerPositions[i][0], towerPositions[i][1], towerPositions[i][2]);
            // Tower cap
            var cap = mesh(new THREE.CylinderGeometry(4, 4, 2, 10), stone2);
            cap.position.set(towerPositions[i][0], towerPositions[i][1] + 12, towerPositions[i][2]);
        }

        // Courtyard walls - N, S, E, W
        var wallN = mesh(new THREE.BoxGeometry(50, 8, 2), stone2);
        wallN.position.set(ox + 0, 4, 55);
        var wallS = mesh(new THREE.BoxGeometry(50, 8, 2), stone2);
        wallS.position.set(ox + 0, 4, -5);
        var wallE = mesh(new THREE.BoxGeometry(2, 8, 60), stone2);
        wallE.position.set(ox + 25, 4, 25);
        var wallW = mesh(new THREE.BoxGeometry(2, 8, 60), stone2);
        wallW.position.set(ox - 25, 4, 25);

        // Wall corner towers
        var wcPositions = [
            [ox + 25, 5, 55],
            [ox - 25, 5, 55],
            [ox + 25, 5, -5],
            [ox - 25, 5, -5]
        ];
        for (var j = 0; j < wcPositions.length; j++) {
            var wt = mesh(new THREE.CylinderGeometry(3, 3, 10, 8), stone1);
            wt.position.set(wcPositions[j][0], wcPositions[j][1], wcPositions[j][2]);
        }
    }

    function gatehouse() {
        var ox = 7000;
        var mat = lambert(0xCC9966);
        var dark = lambert(0xAA8855);

        // Twin gatehouse towers
        var gt1 = mesh(new THREE.BoxGeometry(6, 14, 6), mat);
        gt1.position.set(ox + 8, 7, -5);
        var gt2 = mesh(new THREE.BoxGeometry(6, 14, 6), mat);
        gt2.position.set(ox - 8, 7, -5);

        // Passage between towers
        var pass = mesh(new THREE.BoxGeometry(10, 10, 6), dark);
        pass.position.set(ox + 0, 5, -5);

        // Portcullis arch top
        var arch = mesh(new THREE.BoxGeometry(10, 2, 6), mat);
        arch.position.set(ox + 0, 11, -5);

        // Gate battlements
        var gbt1 = mesh(new THREE.BoxGeometry(6, 2, 6), mat);
        gbt1.position.set(ox + 8, 15, -5);
        var gbt2 = mesh(new THREE.BoxGeometry(6, 2, 6), mat);
        gbt2.position.set(ox - 8, 15, -5);
    }

    function cathedral() {
        var ox = 7000;
        var lime = lambert(0xDDD8C0);
        var dark = lambert(0xCCCAAA);

        // Long nave
        var nave = mesh(new THREE.BoxGeometry(35, 12, 16), lime);
        nave.position.set(ox + 20, 6, -50);

        // Nave roof
        var nroof = mesh(new THREE.BoxGeometry(35, 3, 16), dark);
        nroof.position.set(ox + 20, 13.5, -50);

        // Central tower
        var tower = mesh(new THREE.BoxGeometry(8, 24, 8), lime);
        tower.position.set(ox + 8, 12, -50);

        // Spire on tower
        var spire = mesh(new THREE.ConeGeometry(6, 15, 8), dark);
        spire.position.set(ox + 8, 31.5, -50);

        // Transept N
        var transN = mesh(new THREE.BoxGeometry(14, 11, 10), lime);
        transN.position.set(ox + 8, 5.5, -41);

        // Transept S
        var transS = mesh(new THREE.BoxGeometry(14, 11, 10), lime);
        transS.position.set(ox + 8, 5.5, -59);

        // Apse (east end)
        var apse = mesh(new THREE.BoxGeometry(8, 10, 16), lime);
        apse.position.set(ox + 39, 5, -50);

        // Buttresses along nave
        for (var i = 0; i < 5; i++) {
            var butt = mesh(new THREE.BoxGeometry(2, 10, 3), dark);
            butt.position.set(ox + 14 + i * 6, 5, -42);
            var buttS = mesh(new THREE.BoxGeometry(2, 10, 3), dark);
            buttS.position.set(ox + 14 + i * 6, 5, -58);
        }
    }

    function stnicho() {
        var ox = 7000;
        var flint = lambert(0xBBB8A0);
        var dark = lambert(0xAAA898);

        // Main body
        var body = mesh(new THREE.BoxGeometry(16, 9, 12), flint);
        body.position.set(ox - 30, 4.5, -40);

        // Tower
        var tower = mesh(new THREE.BoxGeometry(5, 14, 5), flint);
        tower.position.set(ox - 40, 7, -40);

        // Spire
        var spire = mesh(new THREE.ConeGeometry(4, 10, 6), dark);
        spire.position.set(ox - 40, 19, -40);

        // Roof
        var roof = mesh(new THREE.BoxGeometry(16, 3, 12), dark);
        roof.position.set(ox - 30, 10.5, -40);
    }

    function river() {
        var ox = 7000;
        var water = lambert(0x4477AA);
        var r = mesh(new THREE.BoxGeometry(60, 0.3, 8), water);
        r.position.set(ox + 0, 0.15, 80);
    }

    function town() {
        var ox = 7000;
        var brick = lambert(0x9B3A2A);
        var stone = lambert(0xCCBBAA);
        var mats = [brick, stone, brick, stone, brick, stone, brick, stone, brick, stone];

        var positions = [
            [ox - 40, 4, 10],
            [ox - 50, 4, 20],
            [ox - 40, 4, 30],
            [ox - 50, 4, 40],
            [ox - 40, 4, 50],
            [ox + 40, 4, 10],
            [ox + 50, 4, 20],
            [ox + 40, 4, 30],
            [ox + 50, 4, 40],
            [ox + 40, 4, 50]
        ];

        for (var i = 0; i < positions.length; i++) {
            var b = mesh(new THREE.BoxGeometry(6, 8, 8), mats[i]);
            b.position.set(positions[i][0], positions[i][1], positions[i][2]);
        }
    }

    function wildfowl() {
        var ox = 7000;
        var reed = lambert(0x8B7A50);
        var wood = lambert(0x6B5A3A);

        // Reed bed structures (low boxes)
        for (var i = 0; i < 4; i++) {
            var rb = mesh(new THREE.BoxGeometry(8, 1, 6), reed);
            rb.position.set(ox - 60 + i * 10, 0.5, 100 + i * 5);
        }

        // Observation hides on stilts
        var hidePositions = [
            [ox - 55, 100],
            [ox - 40, 110],
            [ox - 25, 105]
        ];

        for (var j = 0; j < hidePositions.length; j++) {
            var hx = hidePositions[j][0];
            var hz = hidePositions[j][1];

            // Hide box
            var hide = mesh(new THREE.BoxGeometry(3, 3, 3), wood);
            hide.position.set(hx, 4.5, hz);

            // 4 stilt legs
            var legOffsets = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
            for (var k = 0; k < legOffsets.length; k++) {
                var leg = mesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 6), wood);
                leg.position.set(hx + legOffsets[k][0], 1.5, hz + legOffsets[k][1]);
            }
        }
    }

    function park() {
        var ox = 7000;
        var leaf = lambert(0x2D6A1A);
        var bark = lambert(0x5C3A1A);

        var treePositions = [
            [ox - 15, 60], [ox - 5, 65], [ox + 5, 60], [ox + 15, 65],
            [ox - 20, 70], [ox + 20, 70], [ox - 10, 75], [ox + 10, 75],
            [ox - 22, 45], [ox + 22, 45], [ox - 18, 55], [ox + 18, 55]
        ];

        for (var i = 0; i < treePositions.length; i++) {
            var tx = treePositions[i][0];
            var tz = treePositions[i][1];

            // Trunk
            var trunk = mesh(new THREE.CylinderGeometry(0.7, 0.7, 7, 7), bark);
            trunk.position.set(tx, 3.5, tz);

            // Canopy
            var canopy = mesh(new THREE.SphereGeometry(3, 8, 6), leaf);
            canopy.position.set(tx, 10, tz);
        }
    }

    function bridge() {
        var ox = 7000;
        var stone = lambert(0xBBAA88);
        var dark = lambert(0xAA9977);

        // Bridge deck
        var deck = mesh(new THREE.BoxGeometry(30, 1, 4), stone);
        deck.position.set(ox + 0, 1.5, 80);

        // 3 arch piers
        var pierX = [ox - 9, ox + 0, ox + 9];
        for (var i = 0; i < pierX.length; i++) {
            var pier = mesh(new THREE.BoxGeometry(2, 3, 4), dark);
            pier.position.set(pierX[i], 0, 80);
        }

        // Bridge parapets
        var parN = mesh(new THREE.BoxGeometry(30, 1, 0.5), stone);
        parN.position.set(ox + 0, 2.5, 82);
        var parS = mesh(new THREE.BoxGeometry(30, 1, 0.5), stone);
        parS.position.set(ox + 0, 2.5, 78);
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
