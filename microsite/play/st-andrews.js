window.StAndrews = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 14960;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addObj(mesh);
        return mesh;
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addObj(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addObj(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addObj(mesh);
        return mesh;
    }

    function makeLines(points, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var line = new THREE.LineSegments(geo, mat);
        addObj(line);
        return line;
    }

    function buildGround() {
        makeBox(1200, 1, 1200, 0x7ec850, X_OFFSET, 0, 200);
    }

    function buildCathedral() {
        var cx = X_OFFSET + 80;
        var cz = 0;
        var stoneColor = 0xb0a090;
        var ruinColor = 0x9a8878;

        // Nave floor outline - long rectangle
        makeBox(100, 0.5, 24, 0xc8b89a, cx, 0.25, cz);

        // West twin towers (partial/ruined)
        makeBox(10, 28, 10, stoneColor, cx - 44, 14, cz - 12);
        makeBox(10, 22, 10, ruinColor, cx - 44, 11, cz + 12);

        // Jagged tops for ruined look
        makeBox(3, 4, 3, ruinColor, cx - 44, 30, cz - 12);
        makeBox(3, 3, 3, ruinColor, cx - 47, 29, cz - 12);
        makeBox(3, 2, 3, ruinColor, cx - 41, 23, cz + 12);
        makeBox(3, 3, 3, ruinColor, cx - 44, 24, cz + 12);

        // Nave walls (ruined, partial height)
        makeBox(2, 12, 80, stoneColor, cx - 4, 6, cz - 13);
        makeBox(2, 8, 80, ruinColor, cx - 4, 4, cz + 13);
        makeBox(2, 14, 40, stoneColor, cx + 20, 7, cz - 13);

        // East end - choir remnants
        makeBox(20, 16, 26, stoneColor, cx + 55, 8, cz);
        makeBox(20, 6, 26, ruinColor, cx + 55, 19, cz);

        // Chapter house (south side)
        makeBox(18, 10, 18, stoneColor, cx + 10, 5, cz + 30);
        makeBox(18, 3, 18, ruinColor, cx + 10, 11, cz + 30);

        // Precinct walls
        makeBox(200, 5, 2, stoneColor, cx, 2.5, cz - 60);
        makeBox(200, 5, 2, stoneColor, cx, 2.5, cz + 60);
        makeBox(2, 5, 120, stoneColor, cx - 100, 2.5, cz);
        makeBox(2, 5, 120, stoneColor, cx + 100, 2.5, cz);

        // St Rule's Tower - intact square tower 33m
        makeBox(8, 33, 8, 0xa09080, cx + 90, 16.5, cz + 20);
        // Tower parapet
        makeBox(10, 2, 10, 0xa09080, cx + 90, 33.5, cz + 20);
        // Tower top crenellations
        makeBox(2, 3, 2, 0xa09080, cx + 86, 36, cz + 16);
        makeBox(2, 3, 2, 0xa09080, cx + 94, 36, cz + 16);
        makeBox(2, 3, 2, 0xa09080, cx + 86, 36, cz + 24);
        makeBox(2, 3, 2, 0xa09080, cx + 94, 36, cz + 24);
    }

    function buildCastle() {
        var castleX = X_OFFSET - 120;
        var castleZ = -200;
        var stoneColor = 0x908070;
        var darkStone = 0x706050;

        // Curtain wall - roughly rectangular
        makeBox(60, 8, 2, stoneColor, castleX, 4, castleZ - 25);
        makeBox(60, 8, 2, stoneColor, castleX, 4, castleZ + 25);
        makeBox(2, 8, 50, stoneColor, castleX - 30, 4, castleZ);
        makeBox(2, 8, 50, stoneColor, castleX + 30, 4, castleZ);

        // Fore Tower (main entrance tower)
        makeBox(14, 18, 12, stoneColor, castleX - 22, 9, castleZ - 25);

        // Sea Tower (north/sea side)
        makeBox(12, 16, 12, stoneColor, castleX + 28, 8, castleZ - 20);

        // Kitchen Tower
        makeBox(10, 14, 10, darkStone, castleX + 28, 7, castleZ + 20);

        // Moat - represented as darker depression strip
        makeBox(70, 0.5, 8, 0x404830, castleX, 0, castleZ - 30);

        // Bottle dungeon - dark pit (cylindrical bottle shape underground)
        makeCyl(3, 5, 10, 8, 0x302820, castleX - 5, -5, castleZ);
        // Narrow neck of bottle dungeon
        makeCyl(1, 1, 4, 8, 0x302820, castleX - 5, 0, castleZ);

        // Sea mine (bottle-shaped underground prison) - similar but offset
        makeCyl(4, 6, 12, 8, 0x2a2218, castleX + 8, -6, castleZ + 5);
        makeCyl(1.5, 1.5, 4, 8, 0x2a2218, castleX + 8, -1, castleZ + 5);

        // Cliff headland - rocky promontory
        makeBox(80, 6, 30, 0x706858, castleX, -2, castleZ - 40);
        makeBox(60, 4, 20, 0x605848, castleX + 10, -3, castleZ - 55);
    }

    function buildOldCourse() {
        var golfX = X_OFFSET - 300;
        var golfZ = 200;
        var greenColor = 0x4a9c3a;
        var fairwayColor = 0x5aac4a;
        var sandColor = 0xe8d870;
        var stoneColor = 0xb0a090;

        // Fairways - long strips
        makeBox(400, 0.3, 40, fairwayColor, golfX - 100, 0.15, golfZ);
        makeBox(300, 0.3, 35, fairwayColor, golfX - 250, 0.15, golfZ + 60);

        // 18th green
        makeBox(30, 0.4, 30, greenColor, golfX + 80, 0.2, golfZ);

        // Swilcan Bridge - stone arch bridge over Swilcan Burn
        // Bridge deck
        makeBox(8, 1.5, 4, stoneColor, golfX + 60, 0.75, golfZ);
        // Bridge arch sides
        makeBox(1, 2, 4, stoneColor, golfX + 56, 0.5, golfZ);
        makeBox(1, 2, 4, stoneColor, golfX + 64, 0.5, golfZ);
        // Arch top curve approximated with sphere
        makeSphere(2, 8, 4, stoneColor, golfX + 60, 0.5, golfZ);

        // Swilcan Burn (stream)
        makeBox(2, 0.3, 80, 0x4488aa, golfX + 60, 0.1, golfZ);

        // Royal & Ancient Clubhouse
        // Main building
        makeBox(40, 14, 20, 0xd4c4a8, golfX + 100, 7, golfZ - 60);
        // Central bay
        makeBox(10, 18, 22, 0xc8b898, golfX + 100, 9, golfZ - 60);
        // Roof
        makeBox(42, 4, 22, 0x908070, golfX + 100, 15, golfZ - 60);
        // Central gable
        makeCone(6, 8, 4, 0x908070, golfX + 100, 22, golfZ - 60);
        // Chimneys
        makeCyl(0.8, 0.8, 4, 6, 0x707060, golfX + 88, 18, golfZ - 60);
        makeCyl(0.8, 0.8, 4, 6, 0x707060, golfX + 112, 18, golfZ - 60);

        // First tee marker
        makeBox(1, 2, 1, 0xffffff, golfX - 200, 1, golfZ);

        // Bunkers (sand traps)
        makeBox(12, 0.3, 8, sandColor, golfX + 40, 0.15, golfZ - 15);
        makeBox(8, 0.3, 6, sandColor, golfX - 20, 0.15, golfZ + 20);
        makeBox(10, 0.3, 7, sandColor, golfX - 80, 0.15, golfZ - 18);
        makeBox(15, 0.3, 10, sandColor, golfX + 10, 0.15, golfZ + 25);
        makeBox(8, 0.3, 8, sandColor, golfX - 140, 0.15, golfZ - 10);
        makeBox(10, 0.3, 8, sandColor, golfX - 180, 0.15, golfZ + 15);

        // The Valley of Sin (hollow before 18th green)
        makeBox(20, 0.3, 20, 0x3a8c2a, golfX + 60, -0.5, golfZ);

        // Pin/flag on 18th
        makeCyl(0.15, 0.15, 6, 6, 0xffffff, golfX + 80, 3, golfZ + 5);
        makeBox(3, 1.5, 0.1, 0xff0000, golfX + 81.5, 6, golfZ + 5);
    }

    function buildUniversity() {
        var uniX = X_OFFSET + 50;
        var uniZ = 150;
        var stoneColor = 0xc8b898;
        var darkStone = 0xa89878;

        // St Salvator's Chapel - Gothic with tower and crown spire
        // Main chapel nave
        makeBox(14, 16, 40, stoneColor, uniX, 8, uniZ);
        // Side aisles
        makeBox(6, 10, 40, darkStone, uniX - 10, 5, uniZ);
        makeBox(6, 10, 40, darkStone, uniX + 10, 5, uniZ);
        // Tower base
        makeBox(12, 30, 12, stoneColor, uniX - 16, 15, uniZ - 22);
        // Tower upper stage
        makeBox(10, 8, 10, darkStone, uniX - 16, 33, uniZ - 22);
        // Crown spire - cone on top
        makeCone(5, 16, 4, darkStone, uniX - 16, 44, uniZ - 22);
        // Gothic windows (decorative boxes)
        makeBox(2, 6, 0.5, 0x8899aa, uniX, 10, uniZ - 20.5);
        makeBox(2, 6, 0.5, 0x8899aa, uniX, 10, uniZ + 20.5);
        makeBox(1.5, 5, 0.5, 0x8899aa, uniX, 10, uniZ - 10.5);
        // Buttresses
        makeBox(2, 12, 4, stoneColor, uniX - 7, 6, uniZ - 18);
        makeBox(2, 12, 4, stoneColor, uniX + 7, 6, uniZ - 18);
        makeBox(2, 12, 4, stoneColor, uniX - 7, 6, uniZ + 18);
        makeBox(2, 12, 4, stoneColor, uniX + 7, 6, uniZ + 18);

        // St Mary's College - quadrangle
        makeBox(60, 12, 3, stoneColor, uniX + 80, 6, uniZ - 30);
        makeBox(60, 12, 3, stoneColor, uniX + 80, 6, uniZ + 30);
        makeBox(3, 12, 60, stoneColor, uniX + 50, 6, uniZ);
        makeBox(3, 12, 60, stoneColor, uniX + 110, 6, uniZ);
        // Gateway tower
        makeBox(8, 18, 8, darkStone, uniX + 80, 9, uniZ - 30);
        // Hawthorn tree in quad
        makeCyl(0.5, 0.5, 8, 6, 0x6b4226, uniX + 80, 4, uniZ);
        makeSphere(5, 8, 6, 0x2d6e2d, uniX + 80, 10, uniZ);

        // Bute Medical Building
        makeBox(50, 16, 20, 0xd0c0a0, uniX - 60, 8, uniZ + 80);
        makeBox(50, 3, 22, 0xb0a080, uniX - 60, 17, uniZ + 80);
        // Entrance portico
        makeBox(14, 12, 6, 0xc0b090, uniX - 60, 6, uniZ + 69);
        // Pediment
        makeCone(8, 5, 4, 0xb0a080, uniX - 60, 15, uniZ + 69);

        // Students in red gowns (cylinder bodies + sphere heads)
        var studentPositions = [
            [uniX - 5, uniZ - 30],
            [uniX + 5, uniZ - 30],
            [uniX + 15, uniZ - 30],
            [uniX + 85, uniZ],
            [uniX + 90, uniZ + 10],
            [uniX - 55, uniZ + 75],
            [uniX - 45, uniZ + 75]
        ];
        for (var i = 0; i < studentPositions.length; i++) {
            var sx = studentPositions[i][0];
            var sz = studentPositions[i][1];
            makeCyl(0.4, 0.4, 2.4, 6, 0xcc2200, sx, 1.2, sz);
            makeSphere(0.4, 6, 6, 0xf4c090, sx, 2.8, sz);
        }
    }

    function buildEastSands() {
        var beachX = X_OFFSET + 180;
        var beachZ = -100;
        var sandColor = 0xe8d878;
        var seaColor = 0x2266aa;
        var woodColor = 0x8b6a3e;

        // Sandy beach strip
        makeBox(200, 0.5, 60, sandColor, beachX, 0.25, beachZ);

        // Sea/water
        makeBox(300, 0.3, 80, seaColor, beachX, -0.1, beachZ - 70);

        // Harbour wall
        makeBox(60, 4, 4, 0x908070, beachX - 60, 2, beachZ - 28);
        makeBox(4, 4, 40, 0x908070, beachX - 90, 2, beachZ - 10);

        // Fishing boats - simple box hulls with cylinder masts
        makeBox(10, 2, 4, woodColor, beachX - 70, 1, beachZ - 25);
        makeCyl(0.2, 0.2, 8, 6, woodColor, beachX - 70, 5, beachZ - 25);
        makeBox(10, 2, 4, 0x4466aa, beachX - 55, 1, beachZ - 22);
        makeCyl(0.2, 0.2, 7, 6, woodColor, beachX - 55, 4.5, beachZ - 22);
        makeBox(8, 1.5, 3, 0xcc4422, beachX - 80, 1, beachZ - 20);
        makeCyl(0.2, 0.2, 6, 6, woodColor, beachX - 80, 4, beachZ - 20);

        // Castle headland promontory (rocky cliff seen from beach)
        makeBox(50, 8, 20, 0x706050, beachX - 200, 4, beachZ - 50);
        makeBox(40, 10, 15, 0x605040, beachX - 190, 5, beachZ - 60);
        makeBox(30, 12, 10, 0x504030, beachX - 185, 6, beachZ - 68);
    }

    function buildStreets() {
        var streetX = X_OFFSET;
        var stoneColor = 0xc0b0a0;
        var roofColor = 0x706060;
        var lightStone = 0xd4c8b8;

        // North Street - long straight street
        makeBox(400, 0.2, 12, 0x888880, streetX, 0.1, 100);

        // South Street
        makeBox(400, 0.2, 12, 0x888880, streetX, 0.1, 160);

        // Terraced buildings along North Street (both sides)
        var northBuildingConfigs = [
            [-160, 100 - 20, 60, 10, 20],
            [-80, 100 - 20, 50, 9, 18],
            [0, 100 - 20, 60, 11, 20],
            [80, 100 - 20, 55, 10, 19],
            [160, 100 - 20, 50, 9, 18],
            [-160, 100 + 20, 60, 10, 20],
            [-80, 100 + 20, 50, 9, 18],
            [0, 100 + 20, 60, 11, 20],
            [80, 100 + 20, 55, 10, 19],
            [160, 100 + 20, 50, 9, 18]
        ];
        for (var i = 0; i < northBuildingConfigs.length; i++) {
            var cfg = northBuildingConfigs[i];
            makeBox(cfg[2], cfg[3], 16, lightStone, streetX + cfg[0], cfg[3] / 2, cfg[1]);
            makeBox(cfg[2] + 2, 2, 18, roofColor, streetX + cfg[0], cfg[3] + 1, cfg[1]);
        }

        // South Street buildings
        var southBuildingConfigs = [
            [-150, 160 - 20, 55, 10, 20],
            [-70, 160 - 20, 65, 11, 22],
            [20, 160 - 20, 50, 9, 18],
            [100, 160 - 20, 60, 10, 20],
            [-150, 160 + 20, 55, 10, 20],
            [-70, 160 + 20, 65, 11, 22],
            [20, 160 + 20, 50, 9, 18],
            [100, 160 + 20, 60, 10, 20]
        ];
        for (var j = 0; j < southBuildingConfigs.length; j++) {
            var scfg = southBuildingConfigs[j];
            makeBox(scfg[2], scfg[3], 16, stoneColor, streetX + scfg[0], scfg[3] / 2, scfg[1]);
            makeBox(scfg[2] + 2, 2, 18, roofColor, streetX + scfg[0], scfg[3] + 1, scfg[1]);
        }

        // Market Street cross-street
        makeBox(12, 0.2, 60, 0x888880, streetX + 0, 0.1, 130);

        // Church Square area - wider open space
        makeBox(40, 0.2, 40, 0x999990, streetX + 40, 0.1, 130);

        // Town church / Holy Trinity - central landmark
        makeBox(24, 14, 36, stoneColor, streetX + 40, 7, 130);
        makeBox(10, 24, 10, stoneColor, streetX + 28, 12, 118);
        makeCone(5, 10, 4, roofColor, streetX + 28, 26, 118);

        // Cafe fronts (small awning boxes)
        makeBox(8, 1, 3, 0xdd4444, streetX - 100, 10.5, 100 - 21.5);
        makeBox(8, 1, 3, 0x4488dd, streetX - 30, 10.5, 100 - 21.5);
        makeBox(8, 1, 3, 0x44aa44, streetX + 50, 9.5, 100 - 20.5);
    }

    function build() {
        buildGround();
        buildCathedral();
        buildCastle();
        buildOldCourse();
        buildUniversity();
        buildEastSands();
        buildStreets();
    }

    function update(delta) {
    }

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
