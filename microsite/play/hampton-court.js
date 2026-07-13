window.HamptonCourt = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 16720;
    var OFFSET_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function addObj(mesh) {
        objects.push(mesh);
        scene.add(mesh);
        return mesh;
    }

    function buildGatehouse() {
        // Main gatehouse body 20w x 8d x 28h
        addObj(makeBox(20, 28, 8, 0xCC5500, 0, 14, 0));

        // Twin octagonal turrets r=4 h=32
        addObj(makeCyl(4, 4, 32, 8, 0xBB4400, -12, 16, 0));
        addObj(makeCyl(4, 4, 32, 8, 0xBB4400, 12, 16, 0));

        // Terracotta roundels on facade - 4 medallions
        addObj(makeCyl(2, 2, 0.5, 16, 0xE8A050, -6, 22, -4.3));
        addObj(makeCyl(2, 2, 0.5, 16, 0xE8A050, 6, 22, -4.3));
        addObj(makeCyl(2, 2, 0.5, 16, 0xE8A050, -6, 10, -4.3));
        addObj(makeCyl(2, 2, 0.5, 16, 0xE8A050, 6, 10, -4.3));

        // Large arch inset 8w x 14h (dark inset box)
        addObj(makeBox(8, 14, 0.6, 0x221100, 0, 7, -4.3));
    }

    function buildBaseCourtWalls() {
        // 4 walls: 2 long (50x14x2) and 2 short (2x14x50) red brick
        // North wall
        addObj(makeBox(50, 14, 2, 0xBB4400, 0, 7, -30));
        // South wall
        addObj(makeBox(50, 14, 2, 0xBB4400, 0, 7, 30));
        // West wall
        addObj(makeBox(2, 14, 50, 0xBB4400, -25, 7, 0));
        // East wall
        addObj(makeBox(2, 14, 50, 0xBB4400, 25, 7, 0));

        // 12 decorative chimney stacks across roofline
        var chimneyPositions = [
            [-20, -30], [-10, -30], [0, -30], [10, -30],
            [-20, 30], [-10, 30], [0, 30], [10, 30],
            [-25, -15], [-25, 0], [-25, 15],
            [25, 0]
        ];
        var i;
        for (i = 0; i < chimneyPositions.length; i++) {
            var cx = chimneyPositions[i][0];
            var cz = chimneyPositions[i][1];
            // Chimney cylinder
            addObj(makeCyl(1.5, 1.5, 8, 8, 0xCC5500, cx, 18, cz));
            // 4 spiral fins on each chimney as BoxGeometry
            addObj(makeBox(0.4, 6, 3.5, 0xCC5500, cx, 18, cz));
            addObj(makeBox(3.5, 6, 0.4, 0xCC5500, cx, 18, cz));
        }
    }

    function buildClockCourt() {
        // Anne Boleyn gate 14w x 8d x 22h
        addObj(makeBox(14, 22, 8, 0xCC5500, 0, 11, 60));

        // Astronomical clock face
        addObj(makeCyl(4, 4, 0.5, 32, 0xFFD700, 0, 22, 56.3));

        // 8 tiny dial marks on clock face
        var j;
        for (j = 0; j < 8; j++) {
            var angle = (j / 8) * Math.PI * 2;
            var mx = Math.sin(angle) * 3;
            var mz = Math.cos(angle) * 3;
            addObj(makeBox(0.5, 1, 0.3, 0x333300, mx, 22, 56 + mz));
        }

        // Cobblestone courtyard quad 30x0.5x30
        addObj(makeBox(30, 0.5, 30, 0xC0B0A0, 0, 0, 60));
    }

    function buildGreatHall() {
        // Hammer-beam hall 28w x 16d x 20h
        addObj(makeBox(28, 20, 16, 0xCC5500, 0, 10, 110));

        // Oriel window east end
        addObj(makeBox(10, 14, 1, 0x87CEEB, 15, 10, 110));
        // Oriel window west end
        addObj(makeBox(10, 14, 1, 0x87CEEB, -15, 10, 110));

        // Hammer-beam roof apex 30x4x3 dark timber
        addObj(makeBox(30, 4, 3, 0x4A2C0A, 0, 22, 110));
    }

    function buildRoyalChapel() {
        // Tudor chapel body 20w x 12d x 22h
        addObj(makeBox(20, 22, 12, 0xCC5500, 0, 11, 160));

        // Fan-vault tower 6x6x24
        addObj(makeBox(6, 24, 6, 0xCC5500, 0, 12, 155));

        // Gilded vane at apex ConeGeometry r=0.5 h=4
        addObj(makeCone(0.5, 4, 8, 0xFFD700, 0, 28, 155));

        // 3 tall stained glass windows 3x14x0.5 deep blue
        addObj(makeBox(3, 14, 0.5, 0x1B5C9A, -6, 11, 154.3));
        addObj(makeBox(3, 14, 0.5, 0x1B5C9A, 0, 11, 154.3));
        addObj(makeBox(3, 14, 0.5, 0x1B5C9A, 6, 11, 154.3));
    }

    function buildMaze() {
        var mazeBaseX = 40;
        var mazeBaseZ = 80;

        // 8 hedge walls forming L and T-shaped maze passages
        // Horizontal walls (20x4x1.5)
        addObj(makeBox(20, 4, 1.5, 0x1A5A1A, mazeBaseX, 2, mazeBaseZ));
        addObj(makeBox(20, 4, 1.5, 0x1A5A1A, mazeBaseX, 2, mazeBaseZ + 15));
        addObj(makeBox(20, 4, 1.5, 0x1A5A1A, mazeBaseX, 2, mazeBaseZ + 30));
        addObj(makeBox(20, 4, 1.5, 0x1A5A1A, mazeBaseX, 2, mazeBaseZ - 15));

        // Vertical walls (1.5x4x20)
        addObj(makeBox(1.5, 4, 20, 0x1A5A1A, mazeBaseX - 10, 2, mazeBaseZ + 7));
        addObj(makeBox(1.5, 4, 20, 0x1A5A1A, mazeBaseX + 10, 2, mazeBaseZ + 7));
        addObj(makeBox(1.5, 4, 20, 0x1A5A1A, mazeBaseX - 5, 2, mazeBaseZ + 22));
        addObj(makeBox(1.5, 4, 20, 0x1A5A1A, mazeBaseX + 5, 2, mazeBaseZ - 7));
    }

    function buildFountainGarden() {
        var gardenX = -50;
        var gardenZ = 80;

        // 6 topiary cones r=3 h=8
        var tPos = [
            [-10, -12], [10, -12],
            [-10, 0], [10, 0],
            [-10, 12], [10, 12]
        ];
        var k;
        for (k = 0; k < tPos.length; k++) {
            addObj(makeCone(3, 8, 8, 0x1A4A1A, gardenX + tPos[k][0], 4, gardenZ + tPos[k][1]));
        }

        // Central fountain basin CylinderGeometry r=6 h=1
        addObj(makeCyl(6, 6, 1, 16, 0x888888, gardenX, 0.5, gardenZ));

        // Water jet CylinderGeometry r=0.6 h=8
        addObj(makeCyl(0.6, 0.6, 8, 8, 0x87CEEB, gardenX, 4.5, gardenZ));

        // 4 gravel paths BoxGeometry 3x0.3x20
        addObj(makeBox(3, 0.3, 20, 0xD0C0A0, gardenX, 0.15, gardenZ - 15));
        addObj(makeBox(3, 0.3, 20, 0xD0C0A0, gardenX, 0.15, gardenZ + 15));
        addObj(makeBox(20, 0.3, 3, 0xD0C0A0, gardenX - 15, 0.15, gardenZ));
        addObj(makeBox(20, 0.3, 3, 0xD0C0A0, gardenX + 15, 0.15, gardenZ));
    }

    function buildRiverFrontage() {
        var riverZ = -60;

        // Thames water 80x0.5x20
        addObj(makeBox(80, 0.5, 20, 0x1A4A7A, 0, -0.25, riverZ));

        // Riverside terrace 50x1x8
        addObj(makeBox(50, 1, 8, 0xD4C5A9, 0, 0.5, riverZ + 14));

        // 3 royal barges 4x2x16 navy
        addObj(makeBox(4, 2, 16, 0x1C3A6B, -20, 1, riverZ));
        addObj(makeBox(4, 2, 16, 0x1C3A6B, 0, 1, riverZ));
        addObj(makeBox(4, 2, 16, 0x1C3A6B, 20, 1, riverZ));

        // Gilded bows 2x2x3 gold on each barge
        addObj(makeBox(2, 2, 3, 0xFFD700, -20, 2, riverZ - 9));
        addObj(makeBox(2, 2, 3, 0xFFD700, 0, 2, riverZ - 9));
        addObj(makeBox(2, 2, 3, 0xFFD700, 20, 2, riverZ - 9));
    }

    function build() {
        buildGatehouse();
        buildBaseCourtWalls();
        buildClockCourt();
        buildGreatHall();
        buildRoyalChapel();
        buildMaze();
        buildFountainGarden();
        buildRiverFrontage();
    }

    function update(delta) {
        // No per-frame animation required
        void delta;
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
