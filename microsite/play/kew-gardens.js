window.KewGardens = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 16760;
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

    function buildPalmHouse() {
        var baseX = OFFSET_X + 0;
        var baseZ = OFFSET_Z + 0;

        // Base terrace
        var terraceGeo = new THREE.BoxGeometry(40, 2, 20);
        var terrace = makeMesh(terraceGeo, 0xD4C5A9);
        terrace.position.set(baseX, 1, baseZ);
        addToScene(terrace);

        // Main central cylinder (glass)
        var mainGeo = new THREE.CylinderGeometry(14, 14, 20, 16);
        var mainHouse = makeMesh(mainGeo, 0x87CEEB);
        mainHouse.position.set(baseX, 12, baseZ);
        addToScene(mainHouse);

        // Left wing cylinder
        var leftWingGeo = new THREE.CylinderGeometry(8, 8, 12, 16);
        var leftWing = makeMesh(leftWingGeo, 0x87CEEB);
        leftWing.position.set(baseX - 22, 8, baseZ);
        addToScene(leftWing);

        // Right wing cylinder
        var rightWingGeo = new THREE.CylinderGeometry(8, 8, 12, 16);
        var rightWing = makeMesh(rightWingGeo, 0x87CEEB);
        rightWing.position.set(baseX + 22, 8, baseZ);
        addToScene(rightWing);

        // Iron frame strips around perimeter — 20 BoxGeometry
        var i;
        for (i = 0; i < 20; i++) {
            var angle = (i / 20) * Math.PI * 2;
            var stripGeo = new THREE.BoxGeometry(0.3, 20, 0.3);
            var strip = makeMesh(stripGeo, 0x555555);
            strip.position.set(
                baseX + Math.cos(angle) * 14,
                12,
                baseZ + Math.sin(angle) * 14
            );
            addToScene(strip);
        }
    }

    function buildTemperateHouse() {
        var baseX = OFFSET_X + 80;
        var baseZ = OFFSET_Z + 0;

        // Main building box
        var mainGeo = new THREE.BoxGeometry(50, 20, 20);
        var mainBuilding = makeMesh(mainGeo, 0x87CEEB);
        mainBuilding.position.set(baseX, 10, baseZ);
        addToScene(mainBuilding);

        // Left octagonal wing
        var leftWingGeo = new THREE.CylinderGeometry(10, 10, 18, 8);
        var leftWing = makeMesh(leftWingGeo, 0x87CEEB);
        leftWing.position.set(baseX - 35, 9, baseZ);
        addToScene(leftWing);

        // Right octagonal wing
        var rightWingGeo = new THREE.CylinderGeometry(10, 10, 18, 8);
        var rightWing = makeMesh(rightWingGeo, 0x87CEEB);
        rightWing.position.set(baseX + 35, 9, baseZ);
        addToScene(rightWing);

        // Metal frame grid strips on facade
        var j;
        for (j = 0; j < 6; j++) {
            // Vertical strips
            var vstripGeo = new THREE.BoxGeometry(0.5, 18, 0.5);
            var vstrip = makeMesh(vstripGeo, 0x666666);
            vstrip.position.set(baseX - 20 + j * 8, 10, baseZ + 10);
            addToScene(vstrip);

            // Horizontal strips
            var hstripGeo = new THREE.BoxGeometry(50, 0.5, 0.5);
            var hstrip = makeMesh(hstripGeo, 0x666666);
            hstrip.position.set(baseX, 3 + j * 3, baseZ + 10);
            addToScene(hstrip);
        }
    }

    function buildPagoda() {
        var baseX = OFFSET_X + 160;
        var baseZ = OFFSET_Z + 0;

        // Red base cylinder
        var baseGeo = new THREE.CylinderGeometry(8, 8, 8, 8);
        var base = makeMesh(baseGeo, 0xCC5500);
        base.position.set(baseX, 4, baseZ);
        addToScene(base);

        // 9 stacked stories above base
        var k;
        var yPos = 8;
        var radius = 8;
        for (k = 0; k < 9; k++) {
            radius = radius - 0.6;
            var storyGeo = new THREE.CylinderGeometry(radius, radius, 5, 8);
            var story = makeMesh(storyGeo, 0xCC5500);
            story.position.set(baseX, yPos + 2.5, baseZ);
            addToScene(story);

            // 4 eave extensions at 45deg on 4 sides
            var eaveAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
            var e;
            for (e = 0; e < 4; e++) {
                var eaveGeo = new THREE.BoxGeometry(2, 0.5, 12);
                var eave = makeMesh(eaveGeo, 0xCC5500);
                var eaveAngle = eaveAngles[e];
                eave.position.set(
                    baseX + Math.sin(eaveAngle) * radius,
                    yPos + 5,
                    baseZ + Math.cos(eaveAngle) * radius
                );
                eave.rotation.y = eaveAngle;
                addToScene(eave);
            }

            yPos = yPos + 5;
        }

        // Golden finial cone at apex
        var finialGeo = new THREE.ConeGeometry(1, 4, 8);
        var finial = makeMesh(finialGeo, 0xFFD700);
        finial.position.set(baseX, yPos + 2, baseZ);
        addToScene(finial);
    }

    function buildTreetopWalkway() {
        var baseX = OFFSET_X + 240;
        var baseZ = OFFSET_Z + 0;

        // 5 column supports
        var c;
        for (c = 0; c < 5; c++) {
            var colGeo = new THREE.CylinderGeometry(1, 1, 18, 8);
            var col = makeMesh(colGeo, 0x888888);
            col.position.set(baseX + c * 15, 9, baseZ);
            addToScene(col);
        }

        // Walkway deck
        var deckGeo = new THREE.BoxGeometry(2, 0.5, 60);
        var deck = makeMesh(deckGeo, 0xC0C0C0);
        deck.position.set(baseX + 30, 15, baseZ);
        addToScene(deck);

        // Left handrail
        var railLeftGeo = new THREE.BoxGeometry(0.3, 0.3, 60);
        var railLeft = makeMesh(railLeftGeo, 0x777777);
        railLeft.position.set(baseX + 30, 15.4, baseZ - 1);
        addToScene(railLeft);

        // Right handrail
        var railRightGeo = new THREE.BoxGeometry(0.3, 0.3, 60);
        var railRight = makeMesh(railRightGeo, 0x777777);
        railRight.position.set(baseX + 30, 15.4, baseZ + 1);
        addToScene(railRight);
    }

    function buildGiantRedwood() {
        var baseX = OFFSET_X - 60;
        var baseZ = OFFSET_Z + 40;

        // Trunk
        var trunkGeo = new THREE.CylinderGeometry(4, 4, 40, 8);
        var trunk = makeMesh(trunkGeo, 0x8B4513);
        trunk.position.set(baseX, 20, baseZ);
        addToScene(trunk);

        // 5 canopy layers
        var radii = [12, 10, 9, 8, 7];
        var heights = [28, 33, 38, 42, 46];
        var n;
        for (n = 0; n < 5; n++) {
            var canopyGeo = new THREE.SphereGeometry(radii[n], 8, 8);
            var canopy = makeMesh(canopyGeo, 0x1A6B00);
            canopy.position.set(baseX, heights[n], baseZ);
            addToScene(canopy);
        }
    }

    function buildWoodlandArea() {
        var baseX = OFFSET_X - 60;
        var baseZ = OFFSET_Z - 40;

        var treePositions = [
            [-10, -10], [5, -5], [20, -15], [-5, 15], [15, 10],
            [30, -5], [-20, 5], [10, 20], [25, 15], [-15, -20],
            [0, 30], [35, 5], [-25, 15], [20, -25], [40, 20]
        ];

        var t;
        for (t = 0; t < 15; t++) {
            var tx = baseX + treePositions[t][0];
            var tz = baseZ + treePositions[t][1];

            var trunkGeo = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
            var trunk = makeMesh(trunkGeo, 0x4A2C0A);
            trunk.position.set(tx, 6, tz);
            addToScene(trunk);

            var canopyGeo = new THREE.SphereGeometry(8, 8, 8);
            var canopy = makeMesh(canopyGeo, 0x228B22);
            canopy.position.set(tx, 16, tz);
            addToScene(canopy);
        }

        // 4 log seats
        var seatPositions = [
            [8, 0], [-8, 8], [18, -8], [-2, -12]
        ];
        var s;
        for (s = 0; s < 4; s++) {
            var seatGeo = new THREE.BoxGeometry(4, 1, 1);
            var seat = makeMesh(seatGeo, 0x4A2C0A);
            seat.position.set(
                baseX + seatPositions[s][0],
                0.5,
                baseZ + seatPositions[s][1]
            );
            addToScene(seat);
        }
    }

    function buildKewPalace() {
        var baseX = OFFSET_X - 120;
        var baseZ = OFFSET_Z + 0;

        // Main palace box
        var palaceGeo = new THREE.BoxGeometry(16, 16, 10);
        var palace = makeMesh(palaceGeo, 0xCC5500);
        palace.position.set(baseX, 8, baseZ);
        addToScene(palace);

        // Dutch gable front
        var gableFrontGeo = new THREE.BoxGeometry(3, 8, 1);
        var gableFront = makeMesh(gableFrontGeo, 0xCC5500);
        gableFront.position.set(baseX, 19, baseZ - 5);
        addToScene(gableFront);

        // Dutch gable back
        var gableBackGeo = new THREE.BoxGeometry(3, 8, 1);
        var gableBack = makeMesh(gableBackGeo, 0xCC5500);
        gableBack.position.set(baseX, 19, baseZ + 5);
        addToScene(gableBack);

        // 8 window frames
        var windowData = [
            [-5, 5, -5.1], [0, 5, -5.1], [5, 5, -5.1],
            [-5, 10, -5.1], [0, 10, -5.1], [5, 10, -5.1],
            [-5, 5, 5.1], [5, 5, 5.1]
        ];
        var w;
        for (w = 0; w < 8; w++) {
            // Window frame
            var frameGeo = new THREE.BoxGeometry(2, 3, 0.3);
            var frame = makeMesh(frameGeo, 0xF5F5F5);
            frame.position.set(
                baseX + windowData[w][0],
                windowData[w][1],
                baseZ + windowData[w][2]
            );
            addToScene(frame);

            // Window pane inset
            var paneGeo = new THREE.BoxGeometry(1.6, 2.6, 0.15);
            var pane = makeMesh(paneGeo, 0x87CEEB);
            pane.position.set(
                baseX + windowData[w][0],
                windowData[w][1],
                baseZ + windowData[w][2] + (windowData[w][2] < 0 ? -0.15 : 0.15)
            );
            addToScene(pane);
        }

        // Formal garden
        var gardenGeo = new THREE.BoxGeometry(30, 0.5, 20);
        var garden = makeMesh(gardenGeo, 0x3A8A3A);
        garden.position.set(baseX - 23, 0.25, baseZ);
        addToScene(garden);
    }

    function buildWaterlilyHouse() {
        var baseX = OFFSET_X + 0;
        var baseZ = OFFSET_Z - 80;

        // Circular cylinder walls
        var wallsGeo = new THREE.CylinderGeometry(12, 12, 10, 12);
        var walls = makeMesh(wallsGeo, 0x87CEEB);
        walls.position.set(baseX, 5, baseZ);
        addToScene(walls);

        // Dome at top
        var domeGeo = new THREE.SphereGeometry(12, 12, 8);
        var dome = makeMesh(domeGeo, 0x87CEEB);
        dome.position.set(baseX, 10, baseZ);
        addToScene(dome);

        // Central pool
        var poolGeo = new THREE.CylinderGeometry(8, 8, 1, 12);
        var pool = makeMesh(poolGeo, 0x1B6CA8);
        pool.position.set(baseX, 0.5, baseZ);
        addToScene(pool);

        // 6 internal support columns
        var p;
        for (p = 0; p < 6; p++) {
            var colAngle = (p / 6) * Math.PI * 2;
            var colGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
            var col = makeMesh(colGeo, 0xC0C0C0);
            col.position.set(
                baseX + Math.cos(colAngle) * 9,
                4,
                baseZ + Math.sin(colAngle) * 9
            );
            addToScene(col);
        }
    }

    function build() {
        buildPalmHouse();
        buildTemperateHouse();
        buildPagoda();
        buildTreetopWalkway();
        buildGiantRedwood();
        buildWoodlandArea();
        buildKewPalace();
        buildWaterlilyHouse();
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
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
