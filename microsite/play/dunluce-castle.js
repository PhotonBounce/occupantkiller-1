window.DunluceCastle = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 17080;
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

    function addToScene(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function placeAt(mesh, x, y, z) {
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function buildSeaStackCliff() {
        var layer1 = makeMesh(new THREE.BoxGeometry(30, 20, 25), 0x3A4040);
        placeAt(layer1, 0, 10, 0);
        addToScene(layer1);

        var layer2 = makeMesh(new THREE.BoxGeometry(25, 15, 20), 0x3A4040);
        placeAt(layer2, 0, 22, 0);
        addToScene(layer2);

        var layer3 = makeMesh(new THREE.BoxGeometry(20, 12, 18), 0x3A4040);
        placeAt(layer3, 0, 33, 0);
        addToScene(layer3);

        var protrusions = [
            { x: -8, y: 40, z: -6 },
            { x: 6, y: 41, z: 5 },
            { x: -4, y: 42, z: 7 },
            { x: 9, y: 39, z: -3 },
            { x: 2, y: 43, z: -8 },
            { x: -7, y: 40, z: 4 },
            { x: 5, y: 41, z: -7 },
            { x: -2, y: 42, z: 6 }
        ];

        for (var i = 0; i < protrusions.length; i++) {
            var p = protrusions[i];
            var prot = makeMesh(new THREE.BoxGeometry(4, 6, 3), 0x404848);
            placeAt(prot, p.x, p.y, p.z);
            addToScene(prot);
        }
    }

    function buildMainCastleRuin() {
        var wall1 = makeMesh(new THREE.BoxGeometry(2, 18, 20), 0x8B7355);
        placeAt(wall1, -10, 48, 0);
        addToScene(wall1);

        var wall2 = makeMesh(new THREE.BoxGeometry(20, 18, 2), 0x8B7355);
        placeAt(wall2, 0, 48, -10);
        addToScene(wall2);

        var wall3 = makeMesh(new THREE.BoxGeometry(2, 14, 16), 0x8B7355);
        placeAt(wall3, 10, 46, 2);
        addToScene(wall3);

        var tower1 = makeMesh(new THREE.CylinderGeometry(5, 5, 22, 8), 0x7A6545);
        placeAt(tower1, -12, 50, -12);
        addToScene(tower1);

        var tower2 = makeMesh(new THREE.CylinderGeometry(5, 5, 22, 8), 0x7A6545);
        placeAt(tower2, 12, 50, -12);
        addToScene(tower2);

        var stub1 = makeMesh(new THREE.BoxGeometry(2, 8, 10), 0x8B7355);
        placeAt(stub1, -5, 43, 8);
        stub1.rotation.y = 0.3;
        addToScene(stub1);

        var stub2 = makeMesh(new THREE.BoxGeometry(2, 8, 10), 0x8B7355);
        placeAt(stub2, 8, 42, 6);
        stub2.rotation.y = -0.2;
        addToScene(stub2);
    }

    function buildScottishGatehouse() {
        var gatehouse = makeMesh(new THREE.BoxGeometry(12, 20, 10), 0x8B7355);
        placeAt(gatehouse, 18, 49, -8);
        addToScene(gatehouse);

        var doorInset = makeMesh(new THREE.BoxGeometry(6, 10, 2), 0x1A1A1A);
        placeAt(doorInset, 18, 44, -3.5);
        addToScene(doorInset);

        var corbelsPerSide = 5;
        for (var c = 0; c < corbelsPerSide; c++) {
            var corbLeft = makeMesh(new THREE.BoxGeometry(2, 1, 2), 0x7A6A55);
            placeAt(corbLeft, 12.5, 40 + c * 3, -8 + c * 2);
            addToScene(corbLeft);

            var corbRight = makeMesh(new THREE.BoxGeometry(2, 1, 2), 0x7A6A55);
            placeAt(corbRight, 23.5, 40 + c * 3, -8 + c * 2);
            addToScene(corbRight);
        }
    }

    function buildCaveBelow() {
        var cave = makeMesh(new THREE.BoxGeometry(12, 6, 20), 0x1A1A1A);
        placeAt(cave, 0, 4, 0);
        addToScene(cave);

        var caveMouth = makeMesh(new THREE.BoxGeometry(14, 8, 2), 0x3A3A3A);
        placeAt(caveMouth, 0, 5, 10);
        addToScene(caveMouth);
    }

    function buildNorthTowerRuin() {
        var smallCliff = makeMesh(new THREE.BoxGeometry(15, 8, 12), 0x3A4040);
        placeAt(smallCliff, -30, 16, 0);
        addToScene(smallCliff);

        var northTower = makeMesh(new THREE.CylinderGeometry(5, 5, 20, 8), 0x7A6545);
        placeAt(northTower, -30, 30, 0);
        addToScene(northTower);
    }

    function buildRopeBridge() {
        var bridge = makeMesh(new THREE.BoxGeometry(4, 1, 20), 0xD4C5A9);
        placeAt(bridge, -18, 38, 0);
        addToScene(bridge);

        var railLeft = makeMesh(new THREE.BoxGeometry(0.3, 0.3, 20), 0x4A2C0A);
        placeAt(railLeft, -20, 41, 0);
        addToScene(railLeft);

        var railRight = makeMesh(new THREE.BoxGeometry(0.3, 0.3, 20), 0x4A2C0A);
        placeAt(railRight, -16, 41, 0);
        addToScene(railRight);
    }

    function buildAntrimCoastCliffs() {
        var cliffData = [
            { x: -40, y: 12, z: 20, w: 20, h: 25, d: 10 },
            { x: -55, y: 11, z: 35, w: 18, h: 22, d: 10 },
            { x: -70, y: 10, z: 50, w: 16, h: 20, d: 10 },
            { x: -85, y: 9, z: 65, w: 14, h: 18, d: 10 }
        ];

        for (var i = 0; i < cliffData.length; i++) {
            var cd = cliffData[i];
            var cliffMesh = makeMesh(new THREE.BoxGeometry(cd.w, cd.h, cd.d), 0x3A4A5A);
            placeAt(cliffMesh, cd.x, cd.y, cd.z);
            addToScene(cliffMesh);
        }

        var seaPositions = [
            { x: 0, z: 30 },
            { x: 20, z: 45 },
            { x: -20, z: 45 },
            { x: 10, z: 60 },
            { x: -10, z: 60 }
        ];

        for (var j = 0; j < seaPositions.length; j++) {
            var sp = seaPositions[j];
            var seaMesh = makeMesh(new THREE.BoxGeometry(30, 0.5, 15), 0x1A3A6A);
            placeAt(seaMesh, sp.x, 0.25, sp.z);
            addToScene(seaMesh);
        }
    }

    function buildSouvenirRuins() {
        var barbican = makeMesh(new THREE.BoxGeometry(8, 14, 8), 0x7A6545);
        placeAt(barbican, 22, 46, 5);
        addToScene(barbican);

        var beerCellar = makeMesh(new THREE.BoxGeometry(6, 6, 10), 0x8B7355);
        placeAt(beerCellar, 5, 40, 10);
        addToScene(beerCellar);

        var hall1 = makeMesh(new THREE.BoxGeometry(1, 2, 20), 0xC0B080);
        placeAt(hall1, -10, 39, 5);
        addToScene(hall1);

        var hall2 = makeMesh(new THREE.BoxGeometry(1, 2, 20), 0xC0B080);
        placeAt(hall2, 10, 39, 5);
        addToScene(hall2);

        var hall3 = makeMesh(new THREE.BoxGeometry(1, 2, 20), 0xC0B080);
        placeAt(hall3, 0, 39, -5);
        hall3.rotation.y = Math.PI / 2;
        addToScene(hall3);

        var hall4 = makeMesh(new THREE.BoxGeometry(1, 2, 20), 0xC0B080);
        placeAt(hall4, 0, 39, 15);
        hall4.rotation.y = Math.PI / 2;
        addToScene(hall4);
    }

    function build() {
        buildSeaStackCliff();
        buildMainCastleRuin();
        buildScottishGatehouse();
        buildCaveBelow();
        buildNorthTowerRuin();
        buildRopeBridge();
        buildAntrimCoastCliffs();
        buildSouvenirRuins();
    }

    function update(delta) {
        // static environment, no per-frame update needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
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
