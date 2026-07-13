window.BlenheimPalace = (function() {
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

    function addMesh(geo, mat, x, y, z) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function stoneMat(hex) {
        return new THREE.MeshLambertMaterial({ color: hex !== undefined ? hex : 0xD4B483 });
    }

    function build() {
        buildPalaceMainBlock();
        buildGrandBridge();
        buildLake();
        buildColumnOfVictory();
        buildFormalGardens();
        buildWoodstockVillage();
    }

    function buildPalaceMainBlock() {
        var ox = 12640;
        var oz = 0;
        var palaceMat = stoneMat(0xD4B483);
        var darkStoneMat = stoneMat(0xB89A60);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        // Main central block
        addMesh(new THREE.BoxGeometry(80, 30, 40), palaceMat, ox, 15, oz);

        // Central portico columns - front row
        var colMat = stoneMat(0xE0C88A);
        var i;
        for (i = -3; i <= 3; i++) {
            addMesh(new THREE.CylinderGeometry(1.2, 1.4, 28, 8), colMat, ox + i * 5, 14, oz - 20);
        }
        // Portico entablature
        addMesh(new THREE.BoxGeometry(38, 4, 4), palaceMat, ox, 30, oz - 20);
        // Portico pediment (triangular top via cone)
        addMesh(new THREE.ConeGeometry(20, 10, 4), palaceMat, ox, 37, oz - 20);

        // Corner towers - four corners
        addMesh(new THREE.BoxGeometry(18, 40, 18), darkStoneMat, ox - 49, 20, oz - 29);
        addMesh(new THREE.BoxGeometry(18, 40, 18), darkStoneMat, ox + 49, 20, oz - 29);
        addMesh(new THREE.BoxGeometry(18, 40, 18), darkStoneMat, ox - 49, 20, oz + 29);
        addMesh(new THREE.BoxGeometry(18, 40, 18), darkStoneMat, ox + 49, 20, oz + 29);

        // Tower finials (carved stone tops)
        addMesh(new THREE.SphereGeometry(3, 8, 8), colMat, ox - 49, 42, oz - 29);
        addMesh(new THREE.SphereGeometry(3, 8, 8), colMat, ox + 49, 42, oz - 29);
        addMesh(new THREE.SphereGeometry(3, 8, 8), colMat, ox - 49, 42, oz + 29);
        addMesh(new THREE.SphereGeometry(3, 8, 8), colMat, ox + 49, 42, oz + 29);

        // Left colonnaded wing
        addMesh(new THREE.BoxGeometry(50, 20, 16), palaceMat, ox - 115, 10, oz - 12);
        var j;
        for (j = 0; j < 8; j++) {
            addMesh(new THREE.CylinderGeometry(0.8, 1.0, 18, 8), colMat, ox - 93 + j * 6, 9, oz - 20);
        }

        // Right colonnaded wing
        addMesh(new THREE.BoxGeometry(50, 20, 16), palaceMat, ox + 115, 10, oz - 12);
        for (j = 0; j < 8; j++) {
            addMesh(new THREE.CylinderGeometry(0.8, 1.0, 18, 8), colMat, ox + 93 + j * 6, 9, oz - 20);
        }

        // Palace roof
        addMesh(new THREE.BoxGeometry(82, 5, 42), roofMat, ox, 32, oz);

        // Attic level decorative urns on roofline
        var k;
        for (k = -3; k <= 3; k++) {
            addMesh(new THREE.CylinderGeometry(1, 1.5, 4, 6), colMat, ox + k * 12, 36, oz - 20);
        }

        // Great Court (forecourt walls)
        addMesh(new THREE.BoxGeometry(200, 4, 3), palaceMat, ox, 2, oz - 80);
        addMesh(new THREE.BoxGeometry(3, 4, 80), palaceMat, ox - 100, 2, oz - 40);
        addMesh(new THREE.BoxGeometry(3, 4, 80), palaceMat, ox + 100, 2, oz - 40);

        // Gate piers at forecourt entrance
        addMesh(new THREE.BoxGeometry(5, 12, 5), darkStoneMat, ox - 20, 6, oz - 80);
        addMesh(new THREE.BoxGeometry(5, 12, 5), darkStoneMat, ox + 20, 6, oz - 80);
        addMesh(new THREE.SphereGeometry(3, 8, 8), colMat, ox - 20, 14, oz - 80);
        addMesh(new THREE.SphereGeometry(3, 8, 8), colMat, ox + 20, 14, oz - 80);
    }

    function buildGrandBridge() {
        var ox = 12640;
        var bridgeMat = stoneMat(0xC8A870);
        var archMat = stoneMat(0xB89A60);

        // Bridge deck
        addMesh(new THREE.BoxGeometry(30, 6, 80), bridgeMat, ox + 160, 8, 80);

        // Bridge piers / arches beneath
        addMesh(new THREE.BoxGeometry(8, 14, 8), archMat, ox + 148, 5, 60);
        addMesh(new THREE.BoxGeometry(8, 14, 8), archMat, ox + 172, 5, 60);
        addMesh(new THREE.BoxGeometry(8, 14, 8), archMat, ox + 148, 5, 100);
        addMesh(new THREE.BoxGeometry(8, 14, 8), archMat, ox + 172, 5, 100);

        // Arch spans (semi-circular approximation with cylinder)
        addMesh(new THREE.CylinderGeometry(8, 8, 26, 8, 1, false, 0, Math.PI), bridgeMat, ox + 160, 14, 60);
        addMesh(new THREE.CylinderGeometry(8, 8, 26, 8, 1, false, 0, Math.PI), bridgeMat, ox + 160, 14, 100);

        // Bridge balustrades
        addMesh(new THREE.BoxGeometry(32, 3, 2), bridgeMat, ox + 160, 12, 42);
        addMesh(new THREE.BoxGeometry(32, 3, 2), bridgeMat, ox + 160, 12, 118);

        // Bridge corner decorative blocks
        addMesh(new THREE.BoxGeometry(4, 5, 4), stoneMat(0xE0C88A), ox + 145, 13, 42);
        addMesh(new THREE.BoxGeometry(4, 5, 4), stoneMat(0xE0C88A), ox + 175, 13, 42);
        addMesh(new THREE.BoxGeometry(4, 5, 4), stoneMat(0xE0C88A), ox + 145, 13, 118);
        addMesh(new THREE.BoxGeometry(4, 5, 4), stoneMat(0xE0C88A), ox + 175, 13, 118);

        // Rooms within bridge (Vanbrugh's bridge had rooms inside)
        addMesh(new THREE.BoxGeometry(28, 10, 20), new THREE.MeshLambertMaterial({ color: 0x9A8060 }), ox + 160, 5, 80);
    }

    function buildLake() {
        var ox = 12640;
        var lakeMat = new THREE.MeshLambertMaterial({ color: 0x2E6E9E });
        var shallowMat = new THREE.MeshLambertMaterial({ color: 0x3A7FAF });

        // Queen Pool - large ornamental lake
        addMesh(new THREE.BoxGeometry(300, 1, 200), lakeMat, ox + 160, 0, 80);

        // River Glyme widened section
        addMesh(new THREE.BoxGeometry(60, 1, 120), shallowMat, ox + 160, 0.5, -20);

        // Lake island
        addMesh(new THREE.CylinderGeometry(15, 18, 2, 12), new THREE.MeshLambertMaterial({ color: 0x4A7A3A }), ox + 220, 1, 130);

        // Lake bank edges
        addMesh(new THREE.BoxGeometry(310, 2, 10), new THREE.MeshLambertMaterial({ color: 0x6B8E5A }), ox + 160, 1, -15);
        addMesh(new THREE.BoxGeometry(310, 2, 10), new THREE.MeshLambertMaterial({ color: 0x6B8E5A }), ox + 160, 1, 185);
        addMesh(new THREE.BoxGeometry(10, 2, 220), new THREE.MeshLambertMaterial({ color: 0x6B8E5A }), ox + 10, 1, 85);
        addMesh(new THREE.BoxGeometry(10, 2, 220), new THREE.MeshLambertMaterial({ color: 0x6B8E5A }), ox + 310, 1, 85);
    }

    function buildColumnOfVictory() {
        var ox = 12640;
        var colMat = stoneMat(0xD4B483);
        var baseMat = stoneMat(0xB89A60);

        // High plinth/base
        addMesh(new THREE.BoxGeometry(12, 8, 12), baseMat, ox - 200, 4, -60);
        addMesh(new THREE.BoxGeometry(10, 6, 10), baseMat, ox - 200, 11, -60);

        // Column shaft - tall Doric column
        addMesh(new THREE.CylinderGeometry(2.5, 3.0, 60, 12), colMat, ox - 200, 41, -60);

        // Capital
        addMesh(new THREE.CylinderGeometry(4, 2.5, 4, 12), colMat, ox - 200, 73, -60);
        addMesh(new THREE.BoxGeometry(8, 2, 8), baseMat, ox - 200, 76, -60);

        // Duke of Marlborough statue on top
        var statueMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        addMesh(new THREE.CylinderGeometry(1.5, 2, 8, 8), statueMat, ox - 200, 81, -60);
        addMesh(new THREE.SphereGeometry(2.5, 8, 8), statueMat, ox - 200, 88, -60);

        // Triumphal arch base inscription panels
        addMesh(new THREE.BoxGeometry(10, 6, 1), new THREE.MeshLambertMaterial({ color: 0xC8A870 }), ox - 200, 4, -67);
    }

    function buildFormalGardens() {
        var ox = 12640;
        var hedgeMat = new THREE.MeshLambertMaterial({ color: 0x2D5A1B });
        var flowerMat = new THREE.MeshLambertMaterial({ color: 0xCC4444 });
        var stoneMat2 = stoneMat(0xD4B483);
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x4488AA });

        // Italian parterre - geometric hedged beds south of palace
        var i;
        for (i = -3; i <= 3; i++) {
            addMesh(new THREE.BoxGeometry(18, 2, 18), hedgeMat, ox + i * 22, 1, -130);
            addMesh(new THREE.BoxGeometry(16, 1, 16), flowerMat, ox + i * 22, 2, -130);
        }

        // Parterre dividing hedges (lines)
        for (i = -3; i <= 4; i++) {
            addMesh(new THREE.BoxGeometry(2, 3, 140), hedgeMat, ox - 66 + i * 22, 1.5, -130);
        }
        addMesh(new THREE.BoxGeometry(154, 3, 2), hedgeMat, ox, 1.5, -62);
        addMesh(new THREE.BoxGeometry(154, 3, 2), hedgeMat, ox, 1.5, -200);

        // Topiary spheres along main path
        for (i = -4; i <= 4; i++) {
            addMesh(new THREE.SphereGeometry(2.5, 8, 8), hedgeMat, ox + i * 18, 4, -115);
            addMesh(new THREE.CylinderGeometry(1, 1, 4, 6), hedgeMat, ox + i * 18, 2, -115);
        }

        // Water fountain basins (circular)
        addMesh(new THREE.CylinderGeometry(8, 8, 1, 16), waterMat, ox - 66, 1, -130);
        addMesh(new THREE.CylinderGeometry(8, 8, 1, 16), waterMat, ox + 66, 1, -130);

        // Fountain jets (thin cylinders)
        addMesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 6), waterMat, ox - 66, 5, -130);
        addMesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 6), waterMat, ox + 66, 5, -130);

        // Triumphal arch gatehouse (Woodstock Gate by Hawksmoor)
        var archMat = stoneMat(0xC8A870);
        // Main arch opening piers
        addMesh(new THREE.BoxGeometry(8, 22, 8), archMat, ox - 15, 11, -220);
        addMesh(new THREE.BoxGeometry(8, 22, 8), archMat, ox + 15, 11, -220);
        // Arch keystone/lintel
        addMesh(new THREE.BoxGeometry(36, 6, 8), archMat, ox, 24, -220);
        // Arch pediment
        addMesh(new THREE.ConeGeometry(18, 8, 4), archMat, ox, 34, -220);
        // Side pedestrian arches
        addMesh(new THREE.BoxGeometry(6, 14, 6), archMat, ox - 28, 7, -220);
        addMesh(new THREE.BoxGeometry(6, 14, 6), archMat, ox + 28, 7, -220);
        addMesh(new THREE.BoxGeometry(14, 4, 6), archMat, ox - 28, 16, -220);
        addMesh(new THREE.BoxGeometry(14, 4, 6), archMat, ox + 28, 16, -220);
        // Gate flanking walls
        addMesh(new THREE.BoxGeometry(60, 5, 3), stoneMat2, ox - 65, 2.5, -220);
        addMesh(new THREE.BoxGeometry(60, 5, 3), stoneMat2, ox + 65, 2.5, -220);

        // Capability Brown parkland - scattered trees
        var treeTopMat = new THREE.MeshLambertMaterial({ color: 0x3A6B28 });
        var treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x5C3D20 });
        var treePositions = [
            [50, -250], [-80, -280], [120, -200], [-150, -160],
            [200, -300], [-200, -320], [300, -180], [-300, -200],
            [400, -100], [-400, -120], [350, 200], [-350, 220]
        ];
        var t;
        for (t = 0; t < treePositions.length; t++) {
            var tx = ox + treePositions[t][0];
            var tz = treePositions[t][1];
            addMesh(new THREE.CylinderGeometry(1, 1.5, 8, 6), treeTrunkMat, tx, 4, tz);
            addMesh(new THREE.SphereGeometry(7, 8, 6), treeTopMat, tx, 14, tz);
        }
    }

    function buildWoodstockVillage() {
        var ox = 12640;
        var cotswoldMat = stoneMat(0xC8A458);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var darkMat = stoneMat(0x9A8050);

        // Village is to the south-east of the palace
        var vox = ox + 300;
        var voz = -280;

        // Row of Cotswold stone cottages
        var i;
        for (i = 0; i < 6; i++) {
            addMesh(new THREE.BoxGeometry(12, 8, 10), cotswoldMat, vox + i * 16, 4, voz);
            addMesh(new THREE.ConeGeometry(7, 6, 4), roofMat, vox + i * 16, 11, voz);
        }

        // Second row of houses
        for (i = 0; i < 5; i++) {
            addMesh(new THREE.BoxGeometry(14, 10, 12), cotswoldMat, vox + i * 18, 5, voz - 22);
            addMesh(new THREE.ConeGeometry(8, 5, 4), roofMat, vox + i * 18, 13, voz - 22);
        }

        // The Bear Hotel (old pub / inn)
        addMesh(new THREE.BoxGeometry(22, 12, 18), cotswoldMat, vox + 10, 6, voz + 22);
        addMesh(new THREE.BoxGeometry(24, 4, 20), roofMat, vox + 10, 13, voz + 22);
        // Pub chimney stacks
        addMesh(new THREE.BoxGeometry(3, 8, 3), darkMat, vox + 2, 16, voz + 14);
        addMesh(new THREE.BoxGeometry(3, 8, 3), darkMat, vox + 18, 16, voz + 14);

        // Church of St Mary Magdalene - church tower
        var churchMat = stoneMat(0xB8924A);
        addMesh(new THREE.BoxGeometry(20, 14, 28), churchMat, vox + 90, 7, voz + 10);
        addMesh(new THREE.BoxGeometry(10, 30, 10), churchMat, vox + 96, 15, voz + 20);
        // Church tower battlements
        addMesh(new THREE.BoxGeometry(12, 3, 3), churchMat, vox + 96, 31, voz + 15);
        addMesh(new THREE.BoxGeometry(12, 3, 3), churchMat, vox + 96, 31, voz + 25);
        addMesh(new THREE.BoxGeometry(3, 3, 12), churchMat, vox + 90, 31, voz + 20);
        addMesh(new THREE.BoxGeometry(3, 3, 12), churchMat, vox + 102, 31, voz + 20);
        // Church roof
        addMesh(new THREE.ConeGeometry(12, 6, 4), roofMat, vox + 90, 17, voz + 10);
        // Church steeple
        addMesh(new THREE.ConeGeometry(2, 10, 6), new THREE.MeshLambertMaterial({ color: 0x666655 }), vox + 96, 38, voz + 20);

        // Village green
        addMesh(new THREE.BoxGeometry(40, 0.5, 40), new THREE.MeshLambertMaterial({ color: 0x4A7A3A }), vox + 50, 0, voz + 5);

        // Market cross / village monument
        addMesh(new THREE.BoxGeometry(4, 4, 4), stoneMat(0xC8A870), vox + 50, 2, voz + 5);
        addMesh(new THREE.CylinderGeometry(0.5, 0.8, 6, 6), stoneMat(0xC8A870), vox + 50, 7, voz + 5);
        addMesh(new THREE.ConeGeometry(1.5, 3, 6), stoneMat(0xC8A870), vox + 50, 12, voz + 5);

        // Village street walls / hedges
        addMesh(new THREE.BoxGeometry(120, 2, 2), new THREE.MeshLambertMaterial({ color: 0xA08050 }), vox + 40, 1, voz - 10);

        // Park boundary wall running from palace to village
        addMesh(new THREE.BoxGeometry(3, 5, 280), stoneMat(0xB89A60), ox + 260, 2.5, -140);
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
