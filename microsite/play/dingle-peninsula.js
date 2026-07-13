window.DinglePeninsula = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 17560;
    var OFFSET_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        return mesh;
    }

    function placeAt(mesh, x, y, z) {
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildMountBrandon() {
        var peak = makeMesh(new THREE.BoxGeometry(40, 42, 22), 0x5A5A6A);
        placeAt(peak, -200, 21, -150);

        var cloud1 = makeMesh(new THREE.SphereGeometry(12, 8, 6), 0xDDDDDD);
        placeAt(cloud1, -200, 42, -150);

        var cloud2 = makeMesh(new THREE.SphereGeometry(9, 8, 6), 0xDDDDDD);
        placeAt(cloud2, -188, 40, -148);

        var cloud3 = makeMesh(new THREE.SphereGeometry(10, 8, 6), 0xDDDDDD);
        placeAt(cloud3, -212, 38, -152);

        var path = makeMesh(new THREE.BoxGeometry(2, 0.3, 30), 0xD4C5A9);
        placeAt(path, -210, 5, -160);
    }

    function buildGallarusOratory() {
        var walls = makeMesh(new THREE.BoxGeometry(8, 5, 8), 0x8B7355);
        placeAt(walls, -100, 2.5, -50);

        var roof = makeMesh(new THREE.BoxGeometry(9, 4, 6), 0x7A6545);
        placeAt(roof, -100, 7, -50);

        var doorway = makeMesh(new THREE.BoxGeometry(1.5, 2, 0.5), 0x333222);
        placeAt(doorway, -104, 1, -50);

        var wallNorth = makeMesh(new THREE.BoxGeometry(1, 3, 20), 0x888878);
        placeAt(wallNorth, -108, 1.5, -50);

        var wallSouth = makeMesh(new THREE.BoxGeometry(1, 3, 20), 0x888878);
        placeAt(wallSouth, -92, 1.5, -50);

        var wallEast = makeMesh(new THREE.BoxGeometry(20, 3, 1), 0x888878);
        placeAt(wallEast, -100, 1.5, -40);

        var wallWest = makeMesh(new THREE.BoxGeometry(20, 3, 1), 0x888878);
        placeAt(wallWest, -100, 1.5, -60);
    }

    function buildDunbegFort() {
        var wallLong = makeMesh(new THREE.BoxGeometry(2, 8, 30), 0x8B7355);
        placeAt(wallLong, -50, 4, 50);

        var wallShort = makeMesh(new THREE.BoxGeometry(30, 8, 2), 0x8B7355);
        placeAt(wallShort, -35, 4, 65);

        var fortlet = makeMesh(new THREE.BoxGeometry(12, 6, 8), 0x7A6545);
        placeAt(fortlet, -45, 3, 55);

        var sea = makeMesh(new THREE.BoxGeometry(30, 0.5, 15), 0x1A3A6A);
        placeAt(sea, -40, -0.2, 80);
    }

    function buildDingleTown() {
        var shopColors = [
            0x2266CC, 0xCC3333, 0x22AA44, 0xFFCC00,
            0xCC6600, 0xAA22AA, 0x22CCCC, 0xFF6699
        ];
        var i;
        for (i = 0; i < 8; i++) {
            var shop = makeMesh(new THREE.BoxGeometry(8, 10, 6), shopColors[i]);
            placeAt(shop, 0 + i * 9, 5, 0);
        }

        var quay = makeMesh(new THREE.BoxGeometry(30, 2, 8), 0x888888);
        placeAt(quay, 36, 1, 10);

        var trawlerColors = [0x1C3A6B, 0xFF4400, 0x2244AA, 0x1C3A6B, 0xFF4400];
        for (i = 0; i < 5; i++) {
            var trawler = makeMesh(new THREE.BoxGeometry(4, 3, 12), trawlerColors[i]);
            placeAt(trawler, 22 + i * 6, 2.5, 18);
        }
    }

    function buildBeehiveHuts() {
        var i;
        for (i = 0; i < 5; i++) {
            var hut = makeMesh(new THREE.SphereGeometry(3.5, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0x888878);
            placeAt(hut, -150 + i * 10, 3.5, 20);

            var door = makeMesh(new THREE.BoxGeometry(1, 2, 1.5), 0x222211);
            placeAt(door, -150 + i * 10, 1, 23.5);
        }

        var enclosureN = makeMesh(new THREE.BoxGeometry(1, 4, 25), 0x888878);
        placeAt(enclosureN, -175, 2, 20);

        var enclosureS = makeMesh(new THREE.BoxGeometry(1, 4, 25), 0x888878);
        placeAt(enclosureS, -105, 2, 20);

        var enclosureW = makeMesh(new THREE.BoxGeometry(25, 4, 1), 0x888878);
        placeAt(enclosureW, -140, 2, 8);

        var enclosureE = makeMesh(new THREE.BoxGeometry(25, 4, 1), 0x888878);
        placeAt(enclosureE, -140, 2, 32);
    }

    function buildSleaHead() {
        var cliff1 = makeMesh(new THREE.BoxGeometry(20, 20, 12), 0x3A4050);
        placeAt(cliff1, -250, 10, 100);

        var cliff2 = makeMesh(new THREE.BoxGeometry(18, 25, 10), 0x3A4050);
        placeAt(cliff2, -270, 12.5, 90);

        var cliff3 = makeMesh(new THREE.BoxGeometry(22, 18, 14), 0x3A4050);
        placeAt(cliff3, -230, 9, 110);

        var ocean1 = makeMesh(new THREE.BoxGeometry(25, 0.5, 18), 0x1A3A6A);
        placeAt(ocean1, -255, -0.2, 125);

        var ocean2 = makeMesh(new THREE.BoxGeometry(25, 0.5, 18), 0x1A3A6A);
        placeAt(ocean2, -280, -0.2, 115);

        var ocean3 = makeMesh(new THREE.BoxGeometry(25, 0.5, 18), 0x1A3A6A);
        placeAt(ocean3, -235, -0.2, 135);

        var ocean4 = makeMesh(new THREE.BoxGeometry(25, 0.5, 18), 0x1A3A6A);
        placeAt(ocean4, -260, -0.2, 145);

        var ocean5 = makeMesh(new THREE.BoxGeometry(25, 0.5, 18), 0x1A3A6A);
        placeAt(ocean5, -240, -0.2, 105);

        var islandSizes = [
            [10, 8, 10],
            [15, 12, 14],
            [20, 15, 16],
            [12, 10, 12]
        ];
        var i;
        for (i = 0; i < 4; i++) {
            var sz = islandSizes[i];
            var island = makeMesh(new THREE.BoxGeometry(sz[0], sz[1], sz[2]), 0x3A3530);
            placeAt(island, -260 + i * 18, sz[1] / 2, -60);
        }
    }

    function buildBlasketIslands() {
        var greatBlasket = makeMesh(new THREE.BoxGeometry(40, 15, 20), 0x4A5A4A);
        placeAt(greatBlasket, -260, 7.5, -80);

        var i;
        for (i = 0; i < 6; i++) {
            var cottage = makeMesh(new THREE.BoxGeometry(4, 3, 4), 0xD4C5A9);
            placeAt(cottage, -270 + i * 6, 18.5, -80);
        }

        var seaCrossing = makeMesh(new THREE.BoxGeometry(50, 0.5, 15), 0x1A3A6A);
        placeAt(seaCrossing, -255, -0.2, -55);
    }

    function buildFungie() {
        var body = makeMesh(new THREE.SphereGeometry(1.5, 8, 6), 0x3A3A6A);
        placeAt(body, 40, 1.5, 15);

        var flipperL = makeMesh(new THREE.BoxGeometry(0.5, 2, 3), 0x3A3A6A);
        placeAt(flipperL, 38.5, 1, 15);

        var flipperR = makeMesh(new THREE.BoxGeometry(0.5, 2, 3), 0x3A3A6A);
        placeAt(flipperR, 41.5, 1, 15);

        var dorsal = makeMesh(new THREE.BoxGeometry(0.5, 3, 2), 0x3A3A6A);
        placeAt(dorsal, 40, 3.5, 15);

        var snout = makeMesh(new THREE.BoxGeometry(1, 1, 3), 0x3A3A6A);
        placeAt(snout, 40, 1.5, 17.5);
    }

    function build() {
        buildMountBrandon();
        buildGallarusOratory();
        buildDunbegFort();
        buildDingleTown();
        buildBeehiveHuts();
        buildSleaHead();
        buildBlasketIslands();
        buildFungie();
    }

    function update(delta) {
        // static environment — no per-frame updates needed
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
        }
        objects = [];
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
