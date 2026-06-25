window.CambridgeKings = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 16000;
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

    function buildChapelNave() {
        var geo = new THREE.BoxGeometry(60, 30, 20);
        var mesh = makeMesh(geo, 0xF5F0DC);
        mesh.position.set(OFFSET_X + 0, 15, OFFSET_Z + 0);
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildButtressTowers() {
        var positions = [
            [-28, 10], [-28, -5], [-28, -20],
            [28, 10], [28, -5], [28, -20],
            [-18, 10], [-18, -20],
            [18, 10], [18, -20],
            [-8, 10], [8, 10]
        ];
        var i;
        for (i = 0; i < positions.length; i++) {
            var px = positions[i][0];
            var pz = positions[i][1];
            var cylGeo = new THREE.CylinderGeometry(3, 3, 36, 8);
            var cylMesh = makeMesh(cylGeo, 0xEDE5CC);
            cylMesh.position.set(OFFSET_X + px, 18, OFFSET_Z + pz);
            scene.add(cylMesh);
            objects.push(cylMesh);
            var coneGeo = new THREE.ConeGeometry(3, 8, 8);
            var coneMesh = makeMesh(coneGeo, 0xDDD5BE);
            coneMesh.position.set(OFFSET_X + px, 40, OFFSET_Z + pz);
            scene.add(coneMesh);
            objects.push(coneMesh);
        }
    }

    function buildWestFront() {
        var facadeGeo = new THREE.BoxGeometry(22, 35, 5);
        var facade = makeMesh(facadeGeo, 0xF0EAD6);
        facade.position.set(OFFSET_X + 0, 17.5, OFFSET_Z + 12.5);
        scene.add(facade);
        objects.push(facade);

        var towerLeftGeo = new THREE.BoxGeometry(5, 40, 5);
        var towerLeft = makeMesh(towerLeftGeo, 0xF0EAD6);
        towerLeft.position.set(OFFSET_X - 13.5, 20, OFFSET_Z + 12.5);
        scene.add(towerLeft);
        objects.push(towerLeft);

        var towerRightGeo = new THREE.BoxGeometry(5, 40, 5);
        var towerRight = makeMesh(towerRightGeo, 0xF0EAD6);
        towerRight.position.set(OFFSET_X + 13.5, 20, OFFSET_Z + 12.5);
        scene.add(towerRight);
        objects.push(towerRight);

        var windowOffsets = [-7, 0, 7];
        var j;
        for (j = 0; j < windowOffsets.length; j++) {
            var winGeo = new THREE.BoxGeometry(6, 20, 0.5);
            var winMesh = makeMesh(winGeo, 0x87CEEB);
            winMesh.position.set(OFFSET_X + windowOffsets[j], 20, OFFSET_Z + 15.1);
            scene.add(winMesh);
            objects.push(winMesh);
        }
    }

    function buildGateTower() {
        var towerGeo = new THREE.BoxGeometry(10, 24, 8);
        var tower = makeMesh(towerGeo, 0xE8E0CC);
        tower.position.set(OFFSET_X + 0, 12, OFFSET_Z + 25);
        scene.add(tower);
        objects.push(tower);

        var archGeo = new THREE.BoxGeometry(5, 10, 8.1);
        var archMesh = makeMesh(archGeo, 0x222222);
        archMesh.position.set(OFFSET_X + 0, 5, OFFSET_Z + 25);
        scene.add(archMesh);
        objects.push(archMesh);

        var heraldLeft = new THREE.BoxGeometry(3, 4, 0.5);
        var heraldLeftMesh = makeMesh(heraldLeft, 0x8B0000);
        heraldLeftMesh.position.set(OFFSET_X - 3.5, 14, OFFSET_Z + 21.1);
        scene.add(heraldLeftMesh);
        objects.push(heraldLeftMesh);

        var heraldRight = new THREE.BoxGeometry(3, 4, 0.5);
        var heraldRightMesh = makeMesh(heraldRight, 0x8B0000);
        heraldRightMesh.position.set(OFFSET_X + 3.5, 14, OFFSET_Z + 21.1);
        scene.add(heraldRightMesh);
        objects.push(heraldRightMesh);
    }

    function buildTheBacks() {
        var lawnOffsets = [-35, 0, 35];
        var k;
        for (k = 0; k < lawnOffsets.length; k++) {
            var lawnGeo = new THREE.BoxGeometry(20, 0.5, 30);
            var lawnMesh = makeMesh(lawnGeo, 0x2D7A2D);
            lawnMesh.position.set(OFFSET_X + lawnOffsets[k], 0.25, OFFSET_Z - 50);
            scene.add(lawnMesh);
            objects.push(lawnMesh);
        }

        var willowPositions = [
            [OFFSET_X - 30, OFFSET_Z - 45],
            [OFFSET_X + 0, OFFSET_Z - 55],
            [OFFSET_X + 30, OFFSET_Z - 48]
        ];
        var w;
        for (w = 0; w < willowPositions.length; w++) {
            var wx = willowPositions[w][0];
            var wz = willowPositions[w][1];
            var trunkGeo = new THREE.CylinderGeometry(1, 1, 12, 8);
            var trunkMesh = makeMesh(trunkGeo, 0x5C3317);
            trunkMesh.position.set(wx, 6, wz);
            scene.add(trunkMesh);
            objects.push(trunkMesh);

            var canopyOffsets = [
                [0, 12, 0],
                [-3, 10, 2],
                [3, 10, -2]
            ];
            var c;
            for (c = 0; c < canopyOffsets.length; c++) {
                var sphereGeo = new THREE.SphereGeometry(7, 8, 8);
                var sphereMesh = makeMesh(sphereGeo, 0x3A7A3A);
                sphereMesh.position.set(
                    wx + canopyOffsets[c][0],
                    canopyOffsets[c][1],
                    wz + canopyOffsets[c][2]
                );
                scene.add(sphereMesh);
                objects.push(sphereMesh);
            }
        }
    }

    function buildPuntingScene() {
        var riverOffsets = [0, 20, 40];
        var r;
        for (r = 0; r < riverOffsets.length; r++) {
            var riverGeo = new THREE.BoxGeometry(20, 0.3, 10);
            var riverMesh = makeMesh(riverGeo, 0x1B6CA8);
            riverMesh.position.set(OFFSET_X - 45 + riverOffsets[r], 0.15, OFFSET_Z - 60);
            scene.add(riverMesh);
            objects.push(riverMesh);
        }

        var puntGeo = new THREE.BoxGeometry(2, 1, 12);
        var punt = makeMesh(puntGeo, 0x8B6914);
        punt.position.set(OFFSET_X - 35, 0.8, OFFSET_Z - 60);
        scene.add(punt);
        objects.push(punt);

        var poleGeo = new THREE.BoxGeometry(0.3, 18, 0.3);
        var pole = makeMesh(poleGeo, 0x4A2C0A);
        pole.position.set(OFFSET_X - 34, 9.5, OFFSET_Z - 56);
        scene.add(pole);
        objects.push(pole);
    }

    function buildClareBridge() {
        var pierLeftGeo = new THREE.BoxGeometry(3, 8, 3);
        var pierLeft = makeMesh(pierLeftGeo, 0xD4C5A9);
        pierLeft.position.set(OFFSET_X - 12, 4, OFFSET_Z - 62);
        scene.add(pierLeft);
        objects.push(pierLeft);

        var pierRightGeo = new THREE.BoxGeometry(3, 8, 3);
        var pierRight = makeMesh(pierRightGeo, 0xD4C5A9);
        pierRight.position.set(OFFSET_X + 8, 4, OFFSET_Z - 62);
        scene.add(pierRight);
        objects.push(pierRight);

        var deckGeo = new THREE.BoxGeometry(20, 1, 5);
        var deck = makeMesh(deckGeo, 0xD4C5A9);
        deck.position.set(OFFSET_X - 2, 8.5, OFFSET_Z - 62);
        scene.add(deck);
        objects.push(deck);

        var ballCount = 14;
        var ballSpacing = 20 / (ballCount - 1);
        var b;
        for (b = 0; b < ballCount; b++) {
            var ballGeo = new THREE.SphereGeometry(0.8, 8, 8);
            var ball = makeMesh(ballGeo, 0xE0D5C0);
            ball.position.set(
                OFFSET_X - 12 + b * ballSpacing,
                9.5,
                OFFSET_Z - 64.5
            );
            scene.add(ball);
            objects.push(ball);
        }
    }

    function buildSenateHouse() {
        var bodyGeo = new THREE.BoxGeometry(30, 18, 15);
        var body = makeMesh(bodyGeo, 0xF5EFE0);
        body.position.set(OFFSET_X + 60, 9, OFFSET_Z + 0);
        scene.add(body);
        objects.push(body);

        var pilasterOffsets = [-13, -9, -5, -1, 3, 7, 11, 15];
        var p;
        for (p = 0; p < pilasterOffsets.length; p++) {
            var pilasterGeo = new THREE.BoxGeometry(1, 16, 1);
            var pilaster = makeMesh(pilasterGeo, 0xEAE4D0);
            pilaster.position.set(OFFSET_X + 60 + pilasterOffsets[p], 9, OFFSET_Z + 7.6);
            scene.add(pilaster);
            objects.push(pilaster);
        }

        var pedimentGeo = new THREE.BoxGeometry(32, 6, 3);
        var pediment = makeMesh(pedimentGeo, 0xF5EFE0);
        pediment.position.set(OFFSET_X + 60, 21, OFFSET_Z + 0);
        scene.add(pediment);
        objects.push(pediment);
    }

    function build() {
        buildChapelNave();
        buildButtressTowers();
        buildWestFront();
        buildGateTower();
        buildTheBacks();
        buildPuntingScene();
        buildClareBridge();
        buildSenateHouse();
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
