window.TaraHill = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 18760;
    var CY = 0;
    var CZ = 0;

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

    function makeMat(color, emissive) {
        return new THREE.MeshLambertMaterial({ color: color, emissive: emissive !== undefined ? emissive : 0x000000 });
    }

    function build() {
        buildHillPlateau();
        buildLiaFail();
        buildMoundOfHostages();
        buildRaithNaRiogh();
        buildCormacHouse();
        buildTechMidchuarta();
        buildRaithLaoghaire();
        buildFieldSystem();
        buildBoyneValley();
        buildHawthornTrees();
        buildVisitorCentre();
        buildEntranceStones();
        buildSky();
        buildGroundPlane();
        buildPathways();
        buildStoneClusters();
    }

    function buildGroundPlane() {
        var segments = 8;
        var geom, mat, mesh;
        var size = 600;
        var step = size / segments;
        mat = makeMat(0x3A7A3A);
        for (var row = 0; row < segments; row++) {
            for (var col = 0; col < segments; col++) {
                geom = new THREE.BoxGeometry(step - 0.5, 0.4, step - 0.5);
                mesh = new THREE.Mesh(geom, mat);
                mesh.position.set(
                    CX - size / 2 + col * step + step / 2,
                    CY - 0.2,
                    CZ - size / 2 + row * step + step / 2
                );
                addMesh(mesh);
            }
        }
    }

    function buildHillPlateau() {
        var geom, mat, mesh;

        // Base terrace — widest, lowest
        mat = makeMat(0x2E7D32);
        geom = new THREE.BoxGeometry(160, 3, 160);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX, CY + 1.5, CZ);
        addMesh(mesh);

        // Second terrace
        mat = makeMat(0x228B22);
        geom = new THREE.BoxGeometry(120, 4, 120);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX, CY + 5, CZ);
        addMesh(mesh);

        // Third terrace
        mat = makeMat(0x228B22);
        geom = new THREE.BoxGeometry(85, 3.5, 85);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX, CY + 8.75, CZ);
        addMesh(mesh);

        // Summit plateau
        mat = makeMat(0x33A633);
        geom = new THREE.BoxGeometry(55, 3, 55);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX, CY + 12.5, CZ);
        addMesh(mesh);

        // Summit crown — topmost flat area
        mat = makeMat(0x3CB043);
        geom = new THREE.BoxGeometry(38, 1.5, 38);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX, CY + 14.75, CZ);
        addMesh(mesh);

        // South slope extensions
        mat = makeMat(0x2A7A2A);
        geom = new THREE.BoxGeometry(140, 2, 60);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX, CY + 1, CZ + 110);
        addMesh(mesh);

        // North slope
        geom = new THREE.BoxGeometry(140, 2, 60);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX, CY + 1, CZ - 110);
        addMesh(mesh);
    }

    function buildLiaFail() {
        var geom, mat, mesh;

        // Stone base plinth
        mat = makeMat(0x6E6E6E);
        geom = new THREE.BoxGeometry(1.8, 0.5, 1.8);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX + 3, CY + 14.5 + 1.25, CZ + 2);
        addMesh(mesh);

        // Second plinth step
        geom = new THREE.BoxGeometry(1.3, 0.4, 1.3);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX + 3, CY + 14.5 + 1.7, CZ + 2);
        addMesh(mesh);

        // Lia Fail upright stone — tapered cylinder (narrower at top)
        mat = makeMat(0x808080);
        geom = new THREE.CylinderGeometry(0.22, 0.32, 1.6, 7);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX + 3, CY + 14.5 + 2.7, CZ + 2);
        addMesh(mesh);

        // Rounded cap
        geom = new THREE.SphereGeometry(0.22, 7, 5);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX + 3, CY + 14.5 + 3.5, CZ + 2);
        addMesh(mesh);
    }

    function buildMoundOfHostages() {
        var geom, mat, mesh;

        // Main earth mound — flattened sphere
        mat = makeMat(0x5C3317);
        geom = new THREE.SphereGeometry(9, 12, 8);
        mesh = new THREE.Mesh(geom, mat);
        mesh.scale.set(1, 0.42, 1);
        mesh.position.set(CX - 12, CY + 14 + 1.9, CZ - 8);
        addMesh(mesh);

        // Grass covering on top of mound
        mat = makeMat(0x228B22);
        geom = new THREE.SphereGeometry(8.6, 10, 6);
        mesh = new THREE.Mesh(geom, mat);
        mesh.scale.set(1, 0.32, 1);
        mesh.position.set(CX - 12, CY + 14 + 2.6, CZ - 8);
        addMesh(mesh);

        // Entrance slab — lintel
        mat = makeMat(0x696969);
        geom = new THREE.BoxGeometry(3.2, 0.5, 0.6);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX - 12, CY + 14.5 + 1.3, CZ - 8 + 9.1);
        addMesh(mesh);

        // Left entrance stone
        geom = new THREE.BoxGeometry(0.5, 1.4, 0.7);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX - 12 - 1.4, CY + 14.5 + 0.7, CZ - 8 + 9.0);
        addMesh(mesh);

        // Right entrance stone
        geom = new THREE.BoxGeometry(0.5, 1.4, 0.7);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX - 12 + 1.4, CY + 14.5 + 0.7, CZ - 8 + 9.0);
        addMesh(mesh);

        // Kerbstones around base
        mat = makeMat(0x787878);
        var kerbCount = 10;
        for (var k = 0; k < kerbCount; k++) {
            var kAngle = (k / kerbCount) * Math.PI * 2;
            var kx = CX - 12 + Math.cos(kAngle) * 9.5;
            var kz = CZ - 8 + Math.sin(kAngle) * 9.5;
            geom = new THREE.BoxGeometry(0.6, 0.8, 1.2);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(kx, CY + 14.5 + 0.4, kz);
            mesh.rotation.y = kAngle;
            addMesh(mesh);
        }
    }

    function buildRaithNaRiogh() {
        var geom, mat, mesh;
        var radius = 90;
        var segCount = 28;
        mat = makeMat(0x6B5B45);

        for (var i = 0; i < segCount; i++) {
            var angle = (i / segCount) * Math.PI * 2;
            var nextAngle = ((i + 0.5) / segCount) * Math.PI * 2;
            var bx = CX + Math.cos(angle) * radius;
            var bz = CZ + Math.sin(angle) * radius;
            var segLen = (2 * Math.PI * radius) / segCount * 1.05;

            geom = new THREE.BoxGeometry(segLen, 2.5, 5);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(bx, CY + 1.25, bz);
            mesh.rotation.y = -angle;
            addMesh(mesh);
        }

        // Inner ditch ring (slightly darker, slightly smaller)
        mat = makeMat(0x4A3B2A);
        var ditchRadius = 82;
        var ditchCount = 24;
        for (var j = 0; j < ditchCount; j++) {
            var dAngle = (j / ditchCount) * Math.PI * 2;
            var dx = CX + Math.cos(dAngle) * ditchRadius;
            var dz = CZ + Math.sin(dAngle) * ditchRadius;
            var dLen = (2 * Math.PI * ditchRadius) / ditchCount * 1.05;

            geom = new THREE.BoxGeometry(dLen, 1.2, 3);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(dx, CY + 0.0, dz);
            mesh.rotation.y = -dAngle;
            addMesh(mesh);
        }
    }

    function buildCormacHouse() {
        var geom, mat, mesh;

        // Main mound body
        mat = makeMat(0x5A4530);
        geom = new THREE.SphereGeometry(14, 10, 7);
        mesh = new THREE.Mesh(geom, mat);
        mesh.scale.set(1, 0.38, 1);
        mesh.position.set(CX + 10, CY + 2.7, CZ + 15);
        addMesh(mesh);

        // Grass cap
        mat = makeMat(0x228B22);
        geom = new THREE.SphereGeometry(13.4, 9, 6);
        mesh = new THREE.Mesh(geom, mat);
        mesh.scale.set(1, 0.28, 1);
        mesh.position.set(CX + 10, CY + 3.1, CZ + 15);
        addMesh(mesh);

        // Surrounding ring bank
        mat = makeMat(0x6B5B45);
        var cRingCount = 14;
        var cRadius = 18;
        for (var c = 0; c < cRingCount; c++) {
            var cAngle = (c / cRingCount) * Math.PI * 2;
            var cLen = (2 * Math.PI * cRadius) / cRingCount * 1.06;
            geom = new THREE.BoxGeometry(cLen, 1.5, 3);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(CX + 10 + Math.cos(cAngle) * cRadius, CY + 0.75, CZ + 15 + Math.sin(cAngle) * cRadius);
            mesh.rotation.y = -cAngle;
            addMesh(mesh);
        }
    }

    function buildTechMidchuarta() {
        var geom, mat, mesh;
        var bankMat = makeMat(0x5C4A30);
        var bankLength = 200;
        var bankWidth = 6;
        var bankHeight = 2;
        var bankSeparation = 26;

        // West bank
        geom = new THREE.BoxGeometry(bankWidth, bankHeight, bankLength);
        mesh = new THREE.Mesh(geom, bankMat);
        mesh.position.set(CX - bankSeparation / 2, CY + bankHeight / 2, CZ - 80);
        addMesh(mesh);

        // East bank
        geom = new THREE.BoxGeometry(bankWidth, bankHeight, bankLength);
        mesh = new THREE.Mesh(geom, bankMat);
        mesh.position.set(CX + bankSeparation / 2, CY + bankHeight / 2, CZ - 80);
        addMesh(mesh);

        // North end cross-bank
        geom = new THREE.BoxGeometry(bankSeparation + bankWidth, bankHeight, bankWidth);
        mesh = new THREE.Mesh(geom, bankMat);
        mesh.position.set(CX, CY + bankHeight / 2, CZ - 178);
        addMesh(mesh);

        // South end cross-bank
        geom = new THREE.BoxGeometry(bankSeparation + bankWidth, bankHeight, bankWidth);
        mesh = new THREE.Mesh(geom, bankMat);
        mesh.position.set(CX, CY + bankHeight / 2, CZ + 18);
        addMesh(mesh);

        // Interior floor raised slightly
        var floorMat = makeMat(0x4A7A4A);
        geom = new THREE.BoxGeometry(bankSeparation - bankWidth, 0.5, bankLength - bankWidth);
        mesh = new THREE.Mesh(geom, floorMat);
        mesh.position.set(CX, CY + 0.25, CZ - 80);
        addMesh(mesh);

        // Dividing internal cross-banks (cubicles)
        var innerMat = makeMat(0x4A3828);
        var numDividers = 5;
        for (var d = 0; d < numDividers; d++) {
            var dz = CZ - 160 + d * 35;
            geom = new THREE.BoxGeometry(bankSeparation - bankWidth, 1.2, 1.5);
            mesh = new THREE.Mesh(geom, innerMat);
            mesh.position.set(CX, CY + 0.6, dz);
            addMesh(mesh);
        }
    }

    function buildRaithLaoghaire() {
        var geom, mat, mesh;
        var outerRadius = 140;
        var outerCount = 36;
        mat = makeMat(0x7A6A50);

        for (var i = 0; i < outerCount; i++) {
            var angle = (i / outerCount) * Math.PI * 2;
            var bx = CX + Math.cos(angle) * outerRadius;
            var bz = CZ + Math.sin(angle) * outerRadius;
            var segLen = (2 * Math.PI * outerRadius) / outerCount * 1.04;

            geom = new THREE.BoxGeometry(segLen, 2.0, 5);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(bx, CY + 1.0, bz);
            mesh.rotation.y = -angle;
            addMesh(mesh);
        }

        // Second outer ring
        mat = makeMat(0x6A5A40);
        var ring2Radius = 155;
        var ring2Count = 38;
        for (var j = 0; j < ring2Count; j++) {
            var rAngle = (j / ring2Count) * Math.PI * 2;
            var rx = CX + Math.cos(rAngle) * ring2Radius;
            var rz = CZ + Math.sin(rAngle) * ring2Radius;
            var rLen = (2 * Math.PI * ring2Radius) / ring2Count * 1.04;

            geom = new THREE.BoxGeometry(rLen, 1.5, 4);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(rx, CY + 0.75, rz);
            mesh.rotation.y = -rAngle;
            addMesh(mesh);
        }
    }

    function buildFieldSystem() {
        var geom, mat, mesh;
        mat = makeMat(0x5C4A2A);

        var fieldBanks = [
            { x: CX + 60, z: CZ + 40, len: 70, rot: 0.2 },
            { x: CX + 80, z: CZ - 20, len: 60, rot: -0.1 },
            { x: CX - 65, z: CZ + 55, len: 75, rot: 0.35 },
            { x: CX - 80, z: CZ - 50, len: 50, rot: -0.25 },
            { x: CX + 40, z: CZ + 80, len: 80, rot: 0.8 },
            { x: CX - 40, z: CZ + 100, len: 60, rot: 0.05 },
            { x: CX + 100, z: CZ + 70, len: 65, rot: -0.5 },
            { x: CX - 100, z: CZ - 80, len: 55, rot: 0.6 }
        ];

        for (var f = 0; f < fieldBanks.length; f++) {
            var fb = fieldBanks[f];
            geom = new THREE.BoxGeometry(fb.len, 0.8, 2.5);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(fb.x, CY + 0.4, fb.z);
            mesh.rotation.y = fb.rot;
            addMesh(mesh);
        }

        // Cross banks
        var crossBanks = [
            { x: CX + 65, z: CZ + 65, len: 45, rot: 1.77 },
            { x: CX - 70, z: CZ + 75, len: 40, rot: 1.4 },
            { x: CX + 95, z: CZ - 50, len: 50, rot: 1.9 }
        ];

        for (var cb = 0; cb < crossBanks.length; cb++) {
            var bank = crossBanks[cb];
            geom = new THREE.BoxGeometry(bank.len, 0.8, 2.5);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(bank.x, CY + 0.4, bank.z);
            mesh.rotation.y = bank.rot;
            addMesh(mesh);
        }
    }

    function buildBoyneValley() {
        var geom, mat, mesh;

        // River Boyne — low blue plane built from BoxGeometry segments
        mat = makeMat(0x006994);
        var riverSegments = 12;
        for (var r = 0; r < riverSegments; r++) {
            var rOffset = r * 38 - 200;
            var rWidth = 18 + Math.sin(r * 1.3) * 4;
            var rCurve = Math.sin(r * 0.55) * 22;
            geom = new THREE.BoxGeometry(rWidth, 0.4, 40);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(CX - 220 + rCurve, CY - 12, CZ - 80 + rOffset);
            addMesh(mesh);
        }

        // River bank near side
        var bankMat = makeMat(0x8B7355);
        for (var rb = 0; rb < 8; rb++) {
            geom = new THREE.BoxGeometry(8, 1.5, 35);
            mesh = new THREE.Mesh(geom, bankMat);
            mesh.position.set(CX - 210 + Math.sin(rb * 1.2) * 6, CY - 11, CZ - 80 + rb * 42);
            addMesh(mesh);
        }

        // Newgrange mound — large white/cream sphere in distance
        mat = makeMat(0xFFFFF0);
        geom = new THREE.SphereGeometry(28, 10, 7);
        mesh = new THREE.Mesh(geom, mat);
        mesh.scale.set(1, 0.48, 1);
        mesh.position.set(CX - 280, CY - 6, CZ - 120);
        addMesh(mesh);

        // Newgrange white quartz retaining wall
        mat = makeMat(0xF5F5F5);
        var ngWallCount = 16;
        for (var ng = 0; ng < ngWallCount; ng++) {
            var ngAngle = (ng / ngWallCount) * Math.PI * 2;
            geom = new THREE.BoxGeometry(12, 4, 4);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(
                CX - 280 + Math.cos(ngAngle) * 29,
                CY - 6 + 2,
                CZ - 120 + Math.sin(ngAngle) * 29
            );
            mesh.rotation.y = -ngAngle;
            addMesh(mesh);
        }

        // Newgrange entrance stone (kerbstone)
        mat = makeMat(0x787878);
        geom = new THREE.BoxGeometry(4, 1.5, 0.8);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX - 280, CY - 6 + 0.75, CZ - 120 + 30);
        addMesh(mesh);

        // Valley ground below hill
        mat = makeMat(0x3A6E3A);
        var valleySegCount = 6;
        for (var v = 0; v < valleySegCount; v++) {
            geom = new THREE.BoxGeometry(80, 1, 80);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(CX - 190 + v * 40, CY - 14, CZ - 60);
            addMesh(mesh);
        }
    }

    function buildHawthornTrees() {
        var geom, mat, mesh;

        var treePositions = [
            { x: CX + 55, z: CZ + 30, h: 4.5, r: 3.2 },
            { x: CX - 50, z: CZ + 45, h: 5.2, r: 3.8 },
            { x: CX + 68, z: CZ - 35, h: 4.0, r: 2.8 },
            { x: CX - 72, z: CZ - 28, h: 5.5, r: 3.5 },
            { x: CX + 35, z: CZ + 110, h: 4.8, r: 3.0 },
            { x: CX - 40, z: CZ + 120, h: 3.8, r: 2.5 },
            { x: CX + 85, z: CZ + 60, h: 5.0, r: 3.3 },
            { x: CX - 90, z: CZ + 60, h: 4.3, r: 2.9 },
            { x: CX + 45, z: CZ - 110, h: 4.6, r: 3.1 },
            { x: CX - 55, z: CZ - 100, h: 5.1, r: 3.6 },
            { x: CX + 120, z: CZ + 10, h: 4.2, r: 2.7 },
            { x: CX - 125, z: CZ - 5, h: 5.3, r: 3.4 }
        ];

        var trunkMat = makeMat(0x5C3A1A);
        var canopyMat = makeMat(0xFFFFF0);
        var leafMat = makeMat(0x2D8A2D);

        for (var t = 0; t < treePositions.length; t++) {
            var tp = treePositions[t];

            // Trunk
            geom = new THREE.CylinderGeometry(0.18, 0.28, tp.h, 6);
            mesh = new THREE.Mesh(geom, trunkMat);
            mesh.position.set(tp.x, CY + tp.h / 2, tp.z);
            addMesh(mesh);

            // Main canopy — white blossom
            geom = new THREE.SphereGeometry(tp.r, 7, 6);
            mesh = new THREE.Mesh(geom, canopyMat);
            mesh.position.set(tp.x, CY + tp.h + tp.r * 0.7, tp.z);
            addMesh(mesh);

            // Green leaf undergrowth
            geom = new THREE.SphereGeometry(tp.r * 0.7, 6, 5);
            mesh = new THREE.Mesh(geom, leafMat);
            mesh.scale.set(1.1, 0.8, 1.1);
            mesh.position.set(tp.x, CY + tp.h + tp.r * 0.3, tp.z);
            addMesh(mesh);
        }
    }

    function buildVisitorCentre() {
        var geom, mat, mesh;

        var vcX = CX + 100;
        var vcZ = CZ + 160;
        var vcY = CY;

        // Main building body
        mat = makeMat(0xF5F5F5);
        geom = new THREE.BoxGeometry(45, 5, 22);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(vcX, vcY + 2.5, vcZ);
        addMesh(mesh);

        // Roof — low-profile slightly sloped (two halves)
        mat = makeMat(0xC8C8C8);
        geom = new THREE.BoxGeometry(45, 1, 22);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(vcX, vcY + 5.5, vcZ);
        addMesh(mesh);

        // Entrance canopy
        mat = makeMat(0xDDDDDD);
        geom = new THREE.BoxGeometry(10, 0.5, 8);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(vcX - 20, vcY + 4, vcZ);
        addMesh(mesh);

        // Entrance pillars
        mat = makeMat(0xEEEEEE);
        geom = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(vcX - 23, vcY + 2, vcZ + 2.5);
        addMesh(mesh);

        geom = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(vcX - 23, vcY + 2, vcZ - 2.5);
        addMesh(mesh);

        // Car park surface
        mat = makeMat(0x808080);
        geom = new THREE.BoxGeometry(50, 0.3, 30);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(vcX + 5, vcY + 0.15, vcZ + 30);
        addMesh(mesh);

        // Fence posts along car park
        mat = makeMat(0x8B6914);
        for (var fp = 0; fp < 8; fp++) {
            geom = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 5);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(vcX - 20 + fp * 7, vcY + 0.6, vcZ + 44);
            addMesh(mesh);
        }

        // Information sign
        mat = makeMat(0x2E5B1A);
        geom = new THREE.BoxGeometry(2.5, 2, 0.2);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(vcX - 30, vcY + 1.5, vcZ + 5);
        addMesh(mesh);

        geom = new THREE.CylinderGeometry(0.08, 0.08, 2, 5);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(vcX - 30, vcY + 1, vcZ + 5);
        addMesh(mesh);
    }

    function buildEntranceStones() {
        var geom, mat, mesh;
        mat = makeMat(0x6E6E6E);

        // Gate stones at Ráith na Ríogh entrance (south)
        geom = new THREE.BoxGeometry(1.2, 2.2, 0.8);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX - 5, CY + 1.1, CZ + 92);
        addMesh(mesh);

        geom = new THREE.BoxGeometry(1.2, 2.2, 0.8);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX + 5, CY + 1.1, CZ + 92);
        addMesh(mesh);

        // Lintel over south entrance
        geom = new THREE.BoxGeometry(12, 0.6, 0.9);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(CX, CY + 2.5, CZ + 92);
        addMesh(mesh);

        // Scattered surface stones — random historic scatter
        mat = makeMat(0x7A7A7A);
        var stonePositions = [
            { x: CX + 20, z: CZ + 8 },
            { x: CX - 18, z: CZ + 22 },
            { x: CX + 30, z: CZ - 15 },
            { x: CX - 8, z: CZ - 25 },
            { x: CX + 5, z: CZ + 55 },
            { x: CX - 25, z: CZ + 50 }
        ];

        for (var s = 0; s < stonePositions.length; s++) {
            var sp = stonePositions[s];
            geom = new THREE.BoxGeometry(0.8 + (s % 3) * 0.3, 0.4 + (s % 2) * 0.3, 1.0 + (s % 4) * 0.2);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(sp.x, CY + 0.3, sp.z);
            mesh.rotation.y = s * 0.6;
            addMesh(mesh);
        }
    }

    function buildSky() {
        var geom, mat, mesh;

        // Sky dome — large inverted sphere overhead
        mat = makeMat(0x87CEEB);
        geom = new THREE.SphereGeometry(600, 10, 6);
        mesh = new THREE.Mesh(geom, mat);
        mesh.scale.set(1, 0.5, 1);
        mesh.position.set(CX, CY - 50, CZ);
        addMesh(mesh);

        // Cloud puffs
        var cloudMat = makeMat(0xFFFFFF);
        var cloudData = [
            { x: CX + 80, y: CY + 120, z: CZ - 60, sx: 2.5, sy: 0.6, sz: 1.2 },
            { x: CX - 100, y: CY + 115, z: CZ + 40, sx: 3.0, sy: 0.55, sz: 1.4 },
            { x: CX + 30, y: CY + 130, z: CZ + 80, sx: 2.2, sy: 0.5, sz: 1.0 },
            { x: CX - 60, y: CY + 125, z: CZ - 100, sx: 2.8, sy: 0.6, sz: 1.3 }
        ];

        for (var cl = 0; cl < cloudData.length; cl++) {
            var cd = cloudData[cl];
            geom = new THREE.SphereGeometry(18, 7, 5);
            mesh = new THREE.Mesh(geom, cloudMat);
            mesh.scale.set(cd.sx, cd.sy, cd.sz);
            mesh.position.set(cd.x, cd.y, cd.z);
            addMesh(mesh);
        }
    }

    function buildPathways() {
        var geom, mat, mesh;
        mat = makeMat(0x9E9078);

        // Main path from visitor centre to hill
        var pathCount = 6;
        for (var p = 0; p < pathCount; p++) {
            geom = new THREE.BoxGeometry(4, 0.15, 20);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(CX + 80 - p * 13, CY + 0.08, CZ + 130 - p * 18);
            mesh.rotation.y = 0.1;
            addMesh(mesh);
        }

        // Path around the Lia Fail
        var circPathCount = 12;
        var circRad = 8;
        mat = makeMat(0xB0A088);
        for (var cp = 0; cp < circPathCount; cp++) {
            var cpAngle = (cp / circPathCount) * Math.PI * 2;
            geom = new THREE.BoxGeometry(4.5, 0.12, 2.5);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(
                CX + 3 + Math.cos(cpAngle) * circRad,
                CY + 14.5 + 0.06,
                CZ + 2 + Math.sin(cpAngle) * circRad
            );
            mesh.rotation.y = cpAngle;
            addMesh(mesh);
        }
    }

    function buildStoneClusters() {
        var geom, mat, mesh;

        // Standing stone cluster near south of enclosure
        mat = makeMat(0x7D7D7D);
        var clusterStones = [
            { x: CX + 40, z: CZ + 70, h: 1.8, r0: 0.18, r1: 0.28 },
            { x: CX + 43, z: CZ + 73, h: 1.2, r0: 0.14, r1: 0.22 },
            { x: CX + 38, z: CZ + 68, h: 2.1, r0: 0.20, r1: 0.30 },
            { x: CX - 45, z: CZ + 68, h: 1.6, r0: 0.16, r1: 0.24 },
            { x: CX - 42, z: CZ + 72, h: 1.0, r0: 0.12, r1: 0.18 }
        ];

        for (var cs = 0; cs < clusterStones.length; cs++) {
            var stone = clusterStones[cs];
            geom = new THREE.CylinderGeometry(stone.r0, stone.r1, stone.h, 6);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(stone.x, CY + stone.h / 2, stone.z);
            addMesh(mesh);
        }

        // Mound of Hostages area marker stones
        mat = makeMat(0x686868);
        var markerData = [
            { x: CX - 22, z: CZ - 7 },
            { x: CX - 2, z: CZ - 7 },
            { x: CX - 12, z: CZ - 18 }
        ];
        for (var ms = 0; ms < markerData.length; ms++) {
            geom = new THREE.CylinderGeometry(0.15, 0.22, 1.0, 5);
            mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(markerData[ms].x, CY + 14.5 + 0.5, markerData[ms].z);
            addMesh(mesh);
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

    return {
        init: init,
        update: update,
        reset: reset
    };

}());
