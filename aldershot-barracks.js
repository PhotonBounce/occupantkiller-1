window.AldershotBarracks = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 12880;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMaterial(color, options) {
        var opts = options || {};
        opts.color = color;
        return new THREE.MeshLambertMaterial(opts);
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function buildBarracksBlock(bx, bz, width, length) {
        // Main body — red brick
        addMesh(makeBox(width, 12, length, 0x8B2500, bx, 6, bz));
        // Roof — dark grey slate
        addMesh(makeBox(width + 1, 2, length + 1, 0x444444, bx, 13, bz));
        // Ground floor arched windows row (simulated as darker panels)
        var numWin = Math.floor(length / 6);
        for (var i = 0; i < numWin; i++) {
            var wz = bz - length / 2 + 3 + i * 6;
            addMesh(makeBox(0.4, 2.5, 1.8, 0x222244, bx - width / 2, 3, wz));
            addMesh(makeBox(0.4, 2.5, 1.8, 0x222244, bx + width / 2, 3, wz));
        }
        // First floor windows
        for (var j = 0; j < numWin; j++) {
            var wz2 = bz - length / 2 + 3 + j * 6;
            addMesh(makeBox(0.4, 2, 1.6, 0x333355, bx - width / 2, 7.5, wz2));
            addMesh(makeBox(0.4, 2, 1.6, 0x333355, bx + width / 2, 7.5, wz2));
        }
        // Second floor windows
        for (var k = 0; k < numWin; k++) {
            var wz3 = bz - length / 2 + 3 + k * 6;
            addMesh(makeBox(0.4, 2, 1.4, 0x333355, bx - width / 2, 11, wz3));
            addMesh(makeBox(0.4, 2, 1.4, 0x333355, bx + width / 2, 11, wz3));
        }
    }

    function buildClockTower(bx, bz) {
        // Base block
        addMesh(makeBox(10, 14, 10, 0x8B2500, bx, 7, bz));
        // Tower shaft
        addMesh(makeBox(6, 20, 6, 0x8B2500, bx, 21, bz));
        // Clock faces (lighter panels)
        addMesh(makeBox(0.5, 3, 3, 0xCCCCCC, bx - 3, 26, bz));
        addMesh(makeBox(0.5, 3, 3, 0xCCCCCC, bx + 3, 26, bz));
        addMesh(makeBox(3, 3, 0.5, 0xCCCCCC, bx, 26, bz - 3));
        addMesh(makeBox(3, 3, 0.5, 0xCCCCCC, bx, 26, bz + 3));
        // Roof pyramid
        addMesh(makeCone(4, 8, 4, 0x333333, bx, 35, bz));
        // Finial
        addMesh(makeCylinder(0.2, 0.2, 4, 6, 0x888800, bx, 41, bz));
    }

    function buildDrillHall(bx, bz) {
        // Large drill hall — Victorian iron and brick
        addMesh(makeBox(40, 10, 70, 0x9B3500, bx, 5, bz));
        // Barrel roof ridge
        addMesh(makeBox(42, 3, 72, 0x555555, bx, 11.5, bz));
        // Entrance porch
        addMesh(makeBox(8, 8, 5, 0x8B2500, bx, 4, bz - 37.5));
        addMesh(makeBox(10, 1, 6, 0x555555, bx, 8.5, bz - 37.5));
        // Side windows
        var dhWins = 8;
        for (var w = 0; w < dhWins; w++) {
            var wz = bz - 31.5 + w * 9;
            addMesh(makeBox(0.5, 4, 3, 0x334466, bx - 20, 6, wz));
            addMesh(makeBox(0.5, 4, 3, 0x334466, bx + 20, 6, wz));
        }
    }

    function buildParadeGround(bx, bz) {
        // Tarmac surface
        addMesh(makeBox(120, 0.5, 100, 0x222222, bx, 0.25, bz));
        // Perimeter railings — posts
        var numPostsX = 13;
        var numPostsZ = 11;
        for (var px = 0; px <= numPostsX; px++) {
            var rx = bx - 60 + px * 10;
            addMesh(makeCylinder(0.2, 0.2, 3, 6, 0x111111, rx, 1.5, bz - 50));
            addMesh(makeCylinder(0.2, 0.2, 3, 6, 0x111111, rx, 1.5, bz + 50));
        }
        for (var pz = 1; pz < numPostsZ; pz++) {
            var rz = bz - 50 + pz * 10;
            addMesh(makeCylinder(0.2, 0.2, 3, 6, 0x111111, bx - 60, 1.5, rz));
            addMesh(makeCylinder(0.2, 0.2, 3, 6, 0x111111, bx + 60, 1.5, rz));
        }
        // Railing rails
        addMesh(makeBox(122, 0.3, 0.3, 0x111111, bx, 2.5, bz - 50));
        addMesh(makeBox(122, 0.3, 0.3, 0x111111, bx, 2.5, bz + 50));
        addMesh(makeBox(0.3, 0.3, 102, 0x111111, bx - 60, 2.5, bz));
        addMesh(makeBox(0.3, 0.3, 102, 0x111111, bx + 60, 2.5, bz));

        // Flagpoles — three in a row
        var flagPolePositions = [bx - 15, bx, bx + 15];
        for (var fp = 0; fp < flagPolePositions.length; fp++) {
            addMesh(makeCylinder(0.25, 0.35, 18, 8, 0xCCCCCC, flagPolePositions[fp], 9, bz - 45));
            // Union Jack approximation — blue field
            addMesh(makeBox(4, 2.4, 0.15, 0x003399, flagPolePositions[fp] + 2, 17, bz - 45));
            // Red cross horizontal
            addMesh(makeBox(4, 0.6, 0.2, 0xCC0000, flagPolePositions[fp] + 2, 17, bz - 45));
            // Red cross vertical
            addMesh(makeBox(0.6, 2.4, 0.2, 0xCC0000, flagPolePositions[fp] + 2, 17, bz - 45));
        }

        // Reviewing dais / stand
        addMesh(makeBox(30, 1.5, 8, 0xCCCCCC, bx, 0.75, bz + 42));
        // Steps up to dais
        addMesh(makeBox(8, 0.5, 1.5, 0xBBBBBB, bx, 0.25, bz + 38));
        // Dais roof canopy
        addMesh(makeBox(32, 0.5, 10, 0x224422, bx, 5, bz + 42));
        // Canopy supports
        var canopyPosts = [-14, -7, 0, 7, 14];
        for (var cp = 0; cp < canopyPosts.length; cp++) {
            addMesh(makeCylinder(0.3, 0.3, 5, 6, 0xEEEEEE, bx + canopyPosts[cp], 2.5, bz + 42));
        }
    }

    function buildWellingtonStatue(bx, bz) {
        // Tall stone plinth
        addMesh(makeBox(5, 3, 5, 0xBBBBAA, bx, 1.5, bz));
        addMesh(makeBox(4, 2, 4, 0xAAA999, bx, 4, bz));
        addMesh(makeBox(3.5, 6, 3.5, 0xAAAAAA, bx, 8, bz));
        // Horse body
        addMesh(makeBox(3, 2.5, 5, 0x333333, bx, 12.25, bz));
        // Horse neck
        addMesh(makeBox(1.2, 2, 1.2, 0x333333, bx, 13.5, bz - 1.8));
        // Horse head
        addMesh(makeBox(1, 1.5, 2, 0x333333, bx, 14.5, bz - 2.8));
        // Horse legs
        addMesh(makeCylinder(0.4, 0.4, 3, 6, 0x333333, bx - 1, 10, bz - 1.5));
        addMesh(makeCylinder(0.4, 0.4, 3, 6, 0x333333, bx + 1, 10, bz - 1.5));
        addMesh(makeCylinder(0.4, 0.4, 3, 6, 0x333333, bx - 1, 10, bz + 1.5));
        addMesh(makeCylinder(0.4, 0.4, 2.5, 6, 0x333333, bx + 1, 10.25, bz + 1.5));
        // Rider torso
        addMesh(makeBox(1.2, 2, 1, 0x111133, bx, 13.8, bz - 0.5));
        // Rider head
        addMesh(makeSphere(0.5, 8, 6, 0xFFCC99, bx, 15.2, bz - 0.5));
        // Wellington hat
        addMesh(makeCylinder(0.55, 0.55, 0.8, 8, 0x111111, bx, 15.85, bz - 0.5));
        addMesh(makeCylinder(0.8, 0.8, 0.15, 8, 0x111111, bx, 15.45, bz - 0.5));
        // Sword raised
        addMesh(makeBox(0.12, 3, 0.12, 0xCCCCCC, bx - 0.6, 15.5, bz - 0.5));
        // Plinth inscription panel
        addMesh(makeBox(3, 1.5, 0.2, 0x888880, bx, 8, bz - 1.76));
    }

    function buildMuseum(bx, bz) {
        // Main museum building
        addMesh(makeBox(35, 9, 25, 0xCC9966, bx, 4.5, bz));
        // Roof
        addMesh(makeBox(37, 1.5, 27, 0x555555, bx, 9.75, bz));
        // Entrance portico
        addMesh(makeBox(12, 7, 4, 0xDDAA88, bx, 3.5, bz - 14.5));
        addMesh(makeBox(14, 1, 5, 0x555555, bx, 7.5, bz - 14.5));
        // Portico columns
        var musColX = [-4, -1.3, 1.3, 4];
        for (var mc = 0; mc < musColX.length; mc++) {
            addMesh(makeCylinder(0.45, 0.45, 7, 8, 0xEEDDBB, bx + musColX[mc], 3.5, bz - 16.5));
        }
        // Sign board
        addMesh(makeBox(10, 1.5, 0.3, 0x224422, bx, 6.5, bz - 14.7));

        // Static display — tank (Chieftain approximation)
        var tx = bx + 22;
        var tz = bz - 8;
        // Tank hull
        addMesh(makeBox(5, 2, 8, 0x556633, tx, 1, tz));
        // Tank turret
        addMesh(makeBox(3.5, 1.8, 4, 0x445522, tx + 0.3, 2.9, tz - 0.5));
        // Gun barrel
        addMesh(makeCylinder(0.25, 0.25, 7, 8, 0x334422, tx + 0.3, 3.5, tz - 4.5));
        var tankGun = objects[objects.length - 1];
        tankGun.rotation.x = Math.PI / 2;
        tankGun.position.set(tx + 0.3, 3.5, tz - 5.5);
        // Tank tracks
        addMesh(makeBox(1, 1.5, 8.5, 0x222222, tx - 2.5, 0.75, tz));
        addMesh(makeBox(1, 1.5, 8.5, 0x222222, tx + 2.5, 0.75, tz));

        // Artillery piece — QF 25 pounder approximation
        var ax = bx + 22;
        var az = bz + 8;
        addMesh(makeBox(2.5, 1.2, 4.5, 0x556633, ax, 0.6, az));
        addMesh(makeCylinder(0.2, 0.2, 6, 8, 0x445522, ax, 1.8, az));
        var artGun = objects[objects.length - 1];
        artGun.rotation.x = Math.PI / 2;
        artGun.position.set(ax, 1.8, az - 4);
        // Wheels
        addMesh(makeCylinder(0.9, 0.9, 0.4, 12, 0x333333, ax - 1.5, 0.9, az));
        addMesh(makeCylinder(0.9, 0.9, 0.4, 12, 0x333333, ax + 1.5, 0.9, az));

        // Second artillery piece
        var ax2 = bx + 22;
        var az2 = bz + 16;
        addMesh(makeBox(2.5, 1.2, 4.5, 0x556633, ax2, 0.6, az2));
        addMesh(makeCylinder(0.2, 0.2, 6, 8, 0x445522, ax2, 1.8, az2));
        var artGun2 = objects[objects.length - 1];
        artGun2.rotation.x = Math.PI / 2;
        artGun2.position.set(ax2, 1.8, az2 - 4);
        addMesh(makeCylinder(0.9, 0.9, 0.4, 12, 0x333333, ax2 - 1.5, 0.9, az2));
        addMesh(makeCylinder(0.9, 0.9, 0.4, 12, 0x333333, ax2 + 1.5, 0.9, az2));

        // Museum signage panels outside
        addMesh(makeBox(0.3, 2.5, 1.5, 0x224422, bx - 18, 1.25, bz - 10));
        addMesh(makeBox(0.3, 2.5, 1.5, 0x224422, bx - 18, 1.25, bz - 14));
    }

    function buildOfficersMess(bx, bz) {
        // Grand Georgian building
        addMesh(makeBox(40, 12, 22, 0xFFEECC, bx, 6, bz));
        // Roof
        addMesh(makeBox(42, 2, 24, 0x555555, bx, 13, bz));
        // Roof pediment / triangular gable
        addMesh(makeBox(20, 4, 1, 0xFFEECC, bx, 15, bz - 11.5));
        // Chimneys
        addMesh(makeBox(1.5, 4, 1.5, 0xCC8866, bx - 10, 15, bz));
        addMesh(makeBox(1.5, 4, 1.5, 0xCC8866, bx + 10, 15, bz));
        addMesh(makeBox(1.5, 4, 1.5, 0xCC8866, bx - 16, 15, bz));
        addMesh(makeBox(1.5, 4, 1.5, 0xCC8866, bx + 16, 15, bz));
        // Columns along facade
        var omColX = [-12, -8, -4, 0, 4, 8, 12];
        for (var oc = 0; oc < omColX.length; oc++) {
            addMesh(makeCylinder(0.55, 0.55, 10, 8, 0xEEEEDD, bx + omColX[oc], 5, bz - 11.5));
        }
        // Portico entablature
        addMesh(makeBox(28, 1.2, 2, 0xEEEEDD, bx, 10.6, bz - 11.5));
        // Front steps
        addMesh(makeBox(14, 0.5, 2.5, 0xCCCCBB, bx, 0.25, bz - 13));
        addMesh(makeBox(12, 0.5, 2, 0xCCCCBB, bx, 0.75, bz - 12.25));
        addMesh(makeBox(10, 0.5, 1.5, 0xCCCCBB, bx, 1.25, bz - 11.5));

        // Windows — Georgian sash windows
        var winRows = [3.5, 7.5, 10.5];
        var winCols = [-16, -12, -8, -4, 0, 4, 8, 12, 16];
        for (var wr = 0; wr < winRows.length; wr++) {
            for (var wc2 = 0; wc2 < winCols.length; wc2++) {
                addMesh(makeBox(0.3, 2, 1.4, 0x8899BB, bx + winCols[wc2], winRows[wr], bz - 11.1));
            }
        }

        // Formal garden — hedgerows
        addMesh(makeBox(44, 2, 4, 0x226622, bx, 1, bz - 22));
        addMesh(makeBox(4, 2, 18, 0x226622, bx - 22, 1, bz - 17));
        addMesh(makeBox(4, 2, 18, 0x226622, bx + 22, 1, bz - 17));
        // Central garden path
        addMesh(makeBox(4, 0.15, 10, 0xCCBBAA, bx, 0.1, bz - 17));
        // Garden urns / decorative spheres
        addMesh(makeCylinder(0.6, 0.8, 1.5, 8, 0xCCCCBB, bx - 10, 0.75, bz - 19));
        addMesh(makeSphere(0.6, 8, 6, 0xCCCCBB, bx - 10, 2.1, bz - 19));
        addMesh(makeCylinder(0.6, 0.8, 1.5, 8, 0xCCCCBB, bx + 10, 0.75, bz - 19));
        addMesh(makeSphere(0.6, 8, 6, 0xCCCCBB, bx + 10, 2.1, bz - 19));
        // Lawn
        addMesh(makeBox(36, 0.2, 14, 0x338833, bx, 0.1, bz - 17));
    }

    function buildAssaultCourse(bx, bz) {
        // High wall obstacle
        addMesh(makeBox(8, 4, 0.5, 0x886644, bx, 2, bz));
        addMesh(makeBox(8, 0.5, 0.5, 0x775533, bx, 0.25, bz));

        // Second lower wall
        addMesh(makeBox(6, 2.5, 0.5, 0x886644, bx + 15, 1.25, bz));

        // Balance beams
        addMesh(makeBox(10, 0.3, 0.3, 0x774422, bx + 30, 1.5, bz - 1));
        addMesh(makeBox(10, 0.3, 0.3, 0x774422, bx + 30, 1.5, bz + 1));
        addMesh(makeCylinder(0.2, 0.2, 1.5, 6, 0x664422, bx + 25, 0.75, bz - 1));
        addMesh(makeCylinder(0.2, 0.2, 1.5, 6, 0x664422, bx + 35, 0.75, bz - 1));
        addMesh(makeCylinder(0.2, 0.2, 1.5, 6, 0x664422, bx + 25, 0.75, bz + 1));
        addMesh(makeCylinder(0.2, 0.2, 1.5, 6, 0x664422, bx + 35, 0.75, bz + 1));

        // Rope climb frames (vertical poles with cross bar)
        addMesh(makeCylinder(0.25, 0.25, 8, 6, 0x886633, bx + 50, 4, bz - 2));
        addMesh(makeCylinder(0.25, 0.25, 8, 6, 0x886633, bx + 50, 4, bz + 2));
        addMesh(makeBox(0.3, 0.3, 6, 0x775522, bx + 50, 8, bz));
        // Rope approximations (thin cylinders hanging)
        addMesh(makeCylinder(0.08, 0.08, 6, 4, 0x886644, bx + 50, 5, bz - 1));
        addMesh(makeCylinder(0.08, 0.08, 6, 4, 0x886644, bx + 50, 5, bz + 1));

        // Tunnel crawl (half-pipe)
        addMesh(makeBox(10, 1.2, 2, 0x888888, bx + 65, 0.6, bz));

        // Water jump ditch — dark ground channel
        addMesh(makeBox(3, 0.8, 6, 0x334466, bx + 78, -0.4, bz));

        // Scramble net frame
        addMesh(makeCylinder(0.25, 0.25, 6, 6, 0x886633, bx + 90, 3, bz - 3));
        addMesh(makeCylinder(0.25, 0.25, 6, 6, 0x886633, bx + 90, 3, bz + 3));
        addMesh(makeBox(0.3, 0.3, 8, 0x775522, bx + 90, 6, bz));
        addMesh(makeBox(0.3, 0.3, 8, 0x775522, bx + 90, 4, bz));
        addMesh(makeBox(0.3, 0.3, 8, 0x775522, bx + 90, 2, bz));

        // Tyres (flat cylinders on ground)
        var tyrePositions = [0, 2, 4, 6, 8, 10];
        for (var tp = 0; tp < tyrePositions.length; tp++) {
            addMesh(makeCylinder(0.7, 0.7, 0.4, 12, 0x111111, bx + 105 + tyrePositions[tp] * 2, 0.2, bz));
        }

        // Sprint finish line marker
        addMesh(makeBox(10, 0.1, 0.3, 0xFFFFFF, bx + 125, 0.05, bz));
    }

    function buildFiringRange(bx, bz) {
        // Firing range berms — large earth mounds
        addMesh(makeBox(40, 6, 8, 0x556633, bx, 3, bz));
        // Berm slope front
        addMesh(makeBox(40, 3, 4, 0x445522, bx, 1.5, bz - 6));
        // Target frames (wooden posts and crossbars)
        var numTargets = 6;
        for (var t = 0; t < numTargets; t++) {
            var tx2 = bx - 25 + t * 10;
            // Post left
            addMesh(makeCylinder(0.15, 0.15, 2.5, 6, 0x774422, tx2 - 0.6, 1.25, bz - 25));
            // Post right
            addMesh(makeCylinder(0.15, 0.15, 2.5, 6, 0x774422, tx2 + 0.6, 1.25, bz - 25));
            // Crossbar
            addMesh(makeBox(1.5, 0.15, 0.15, 0x774422, tx2, 2.5, bz - 25));
            // Target face
            addMesh(makeBox(1.2, 1.8, 0.1, 0xEEEEDD, tx2, 1.5, bz - 25.1));
            // Target bullseye
            addMesh(makeBox(0.6, 0.6, 0.12, 0xCC2222, tx2, 1.5, bz - 25.12));
        }
        // Range safety flag poles
        addMesh(makeCylinder(0.2, 0.2, 5, 6, 0x886644, bx - 22, 2.5, bz - 30));
        addMesh(makeBox(2, 1.2, 0.15, 0xCC0000, bx - 21, 5, bz - 30));
        addMesh(makeCylinder(0.2, 0.2, 5, 6, 0x886644, bx + 22, 2.5, bz - 30));
        addMesh(makeBox(2, 1.2, 0.15, 0xCC0000, bx + 21, 5, bz - 30));
        // Firing positions — prone mounds
        for (var fp2 = 0; fp2 < 4; fp2++) {
            addMesh(makeBox(4, 0.5, 2, 0x556633, bx - 15 + fp2 * 10, 0.25, bz + 5));
        }
    }

    function buildGrounds() {
        // Overall ground plane for the barracks estate
        addMesh(makeBox(400, 0.3, 350, 0x667755, X_OFFSET, -0.15, 0));
        // Internal roads — light grey tarmac strips
        addMesh(makeBox(8, 0.35, 350, 0x333333, X_OFFSET - 60, 0.18, 0));
        addMesh(makeBox(8, 0.35, 350, 0x333333, X_OFFSET + 60, 0.18, 0));
        addMesh(makeBox(400, 0.35, 8, 0x333333, X_OFFSET, 0.18, -80));
        addMesh(makeBox(400, 0.35, 8, 0x333333, X_OFFSET, 0.18, 80));
        // Perimeter wall
        addMesh(makeBox(402, 3, 1, 0xAA8866, X_OFFSET, 1.5, -175));
        addMesh(makeBox(402, 3, 1, 0xAA8866, X_OFFSET, 1.5, 175));
        addMesh(makeBox(1, 3, 352, 0xAA8866, X_OFFSET - 200, 1.5, 0));
        addMesh(makeBox(1, 3, 352, 0xAA8866, X_OFFSET + 200, 1.5, 0));
        // Gate pillars at main entrance
        addMesh(makeBox(3, 5, 3, 0xAA8866, X_OFFSET - 8, 2.5, 175));
        addMesh(makeBox(3, 5, 3, 0xAA8866, X_OFFSET + 8, 2.5, 175));
        addMesh(makeSphere(1.2, 8, 6, 0xCCBBAA, X_OFFSET - 8, 5.8, 175));
        addMesh(makeSphere(1.2, 8, 6, 0xCCBBAA, X_OFFSET + 8, 5.8, 175));
    }

    function build() {
        buildGrounds();

        // Victorian barracks blocks — rows
        buildBarracksBlock(X_OFFSET - 100, -120, 14, 60);
        buildBarracksBlock(X_OFFSET - 100, -40, 14, 60);
        buildBarracksBlock(X_OFFSET - 100, 40, 14, 60);

        buildBarracksBlock(X_OFFSET - 130, -120, 14, 60);
        buildBarracksBlock(X_OFFSET - 130, -40, 14, 60);
        buildBarracksBlock(X_OFFSET - 130, 40, 14, 60);

        // Right side barracks
        buildBarracksBlock(X_OFFSET + 100, -120, 14, 60);
        buildBarracksBlock(X_OFFSET + 100, -40, 14, 60);
        buildBarracksBlock(X_OFFSET + 100, 40, 14, 60);

        buildBarracksBlock(X_OFFSET + 130, -120, 14, 60);
        buildBarracksBlock(X_OFFSET + 130, -40, 14, 60);
        buildBarracksBlock(X_OFFSET + 130, 40, 14, 60);

        // Clock tower — at end of central barracks block
        buildClockTower(X_OFFSET - 100, -155);

        // Drill hall — large central building
        buildDrillHall(X_OFFSET, -140);

        // Parade ground — central
        buildParadeGround(X_OFFSET, 20);

        // Wellington statue — near parade ground entrance
        buildWellingtonStatue(X_OFFSET + 30, 85);

        // Military museum — east side
        buildMuseum(X_OFFSET + 155, -80);

        // Officers mess — north-west, formal setting
        buildOfficersMess(X_OFFSET - 145, 100);

        // Assault course — east training area
        buildAssaultCourse(X_OFFSET + 60, 130);

        // Firing range — south-east
        buildFiringRange(X_OFFSET + 120, 160);

        // Guard house at main gate
        addMesh(makeBox(6, 4, 5, 0x9B3500, X_OFFSET - 20, 2, 170));
        addMesh(makeBox(6, 0.5, 5, 0x555555, X_OFFSET - 20, 4.25, 170));
        addMesh(makeBox(6, 4, 5, 0x9B3500, X_OFFSET + 20, 2, 170));
        addMesh(makeBox(6, 0.5, 5, 0x555555, X_OFFSET + 20, 4.25, 170));
        // Barrier pole
        addMesh(makeBox(12, 0.2, 0.2, 0xEE2222, X_OFFSET + 6, 2.5, 174));

        // Trees around officers mess formal garden
        var treeXs = [-155, -145, -135, -165, -125];
        var treeZs = [-10, -12, -10, 80, 80];
        for (var tr = 0; tr < treeXs.length; tr++) {
            addMesh(makeCylinder(0.4, 0.4, 5, 6, 0x553311, X_OFFSET + treeXs[tr], 2.5, treeZs[tr]));
            addMesh(makeSphere(2.5, 8, 6, 0x226622, X_OFFSET + treeXs[tr], 7, treeZs[tr]));
        }
        // Trees along parade ground perimeter
        var ptreeXs = [-55, -45, 45, 55, -55, -45, 45, 55];
        var ptreeZs = [-30, -30, -30, -30, 70, 70, 70, 70];
        for (var pt = 0; pt < ptreeXs.length; pt++) {
            addMesh(makeCylinder(0.35, 0.35, 4, 6, 0x553311, X_OFFSET + ptreeXs[pt], 2, ptreeZs[pt]));
            addMesh(makeSphere(2, 8, 6, 0x226622, X_OFFSET + ptreeXs[pt], 5.5, ptreeZs[pt]));
        }
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
