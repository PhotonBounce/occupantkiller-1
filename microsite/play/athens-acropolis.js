window.AthensAcropolis = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 22960;
    var BASE_Y = 0;
    var BASE_Z = 0;

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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function build() {
        buildAcropolisRock();
        buildParthenon();
        buildErechtheion();
        buildPropylaea();
        buildTempleAthenaNike();
        buildAcropolisWalls();
        buildTheatreDionysus();
        buildNewAcropolisMuseum();
        buildTempleOlympianZeus();
        buildLycabettusHill();
        buildAthensCityBlocks();
        buildAcropolisPathway();
    }

    function buildAcropolisRock() {
        // Main limestone plateau base - massive
        makeBox(320, 80, 220, 0xD4C8A0, 0, 40, 0);
        // Rock face south side - irregular chunks
        makeBox(280, 30, 20, 0xC8BC94, 0, 85, -110);
        makeBox(240, 20, 15, 0xBFB38A, -10, 100, -105);
        // Rock face north side
        makeBox(260, 35, 20, 0xC8BC94, 5, 82, 108);
        // Rock face west - Propylaea approach side
        makeBox(30, 40, 180, 0xC4B896, -155, 78, -10);
        // Rocky outcrop east
        makeBox(40, 25, 60, 0xBCB08A, 162, 75, 20);
        // Top surface - flattened top of acropolis
        makeBox(310, 8, 210, 0xD8CCAA, 0, 83, 0);
        // South retaining wall
        makeBox(300, 16, 8, 0xC0B488, 0, 90, -105);
        // North retaining wall
        makeBox(300, 14, 8, 0xC0B488, 0, 90, 105);
        // Bedrock lumps adding texture
        makeBox(60, 12, 50, 0xCCC0A0, -80, 87, 40);
        makeBox(45, 10, 35, 0xD0C4A4, 90, 87, -50);
        makeBox(35, 8, 30, 0xC8BC9C, 30, 87, 60);
    }

    function buildParthenon() {
        // Parthenon sits on top of the Acropolis
        // Stylobate (stepped platform) - 3 steps
        makeBox(74, 3, 34, 0xEAE4CC, 20, 88, -20);
        makeBox(71, 3, 31, 0xF0EAD2, 20, 91, -20);
        makeBox(68, 3, 28, 0xF5F0D8, 20, 94, -20);

        // 46 outer Doric columns arranged around the perimeter
        // North colonnade - 17 columns along long side
        var i;
        for (i = 0; i < 17; i++) {
            makeCylinder(0.9, 1.0, 10, 8, 0xF5F0D8, 20 - 31 + i * 3.875, 102, -20 - 12.5);
        }
        // South colonnade - 17 columns
        for (i = 0; i < 17; i++) {
            makeCylinder(0.9, 1.0, 10, 8, 0xF5F0D8, 20 - 31 + i * 3.875, 102, -20 + 12.5);
        }
        // West colonnade - 8 columns (minus corners already placed)
        for (i = 1; i < 7; i++) {
            makeCylinder(0.9, 1.0, 10, 8, 0xF5F0D8, 20 - 31, 102, -20 - 12.5 + i * 3.57);
        }
        // East colonnade - 8 columns
        for (i = 1; i < 7; i++) {
            makeCylinder(0.9, 1.0, 10, 8, 0xF5F0D8, 20 + 31, 102, -20 - 12.5 + i * 3.57);
        }

        // Entablature (architrave) - broken sections
        makeBox(62, 3, 2, 0xF0EAD0, 20, 113, -20 - 12);
        makeBox(62, 3, 2, 0xF0EAD0, 20, 113, -20 + 12);
        makeBox(2, 3, 24, 0xF0EAD0, 20 - 30, 113, -20);
        // East entablature broken - only partial
        makeBox(28, 3, 2, 0xECE6CE, 20 + 18, 113, -20 - 12);

        // Frieze remnants
        makeBox(55, 2, 1.5, 0xEEE8D0, 20, 116, -20 - 11.5);
        makeBox(40, 2, 1.5, 0xEEE8D0, -2, 116, -20 + 11.5);

        // West pediment remnant - triangular gable shape via stacked boxes
        makeBox(60, 2, 2, 0xF2ECD4, 20, 119, -20 - 10);
        makeBox(40, 2, 2, 0xF2ECD4, 20, 121, -20 - 10);
        makeBox(20, 2, 2, 0xF2ECD4, 20, 123, -20 - 10);
        makeBox(6, 2, 2, 0xF2ECD4, 20, 125, -20 - 10);

        // Cella (inner chamber) walls - ruined
        makeBox(44, 8, 1.5, 0xF5F0D8, 20, 100, -20 - 8);
        makeBox(44, 8, 1.5, 0xF5F0D8, 20, 100, -20 + 8);
        makeBox(1.5, 8, 16, 0xF5F0D8, 20 - 22, 100, -20);
        // East cella wall broken - partial
        makeBox(1.5, 6, 10, 0xF5F0D8, 20 + 22, 100, -20 + 3);

        // Inner columns - pronaos
        makeCylinder(0.7, 0.8, 9, 8, 0xF5F0D8, 20 - 18, 101, -20 - 6.5);
        makeCylinder(0.7, 0.8, 9, 8, 0xF5F0D8, 20 - 18, 101, -20 + 6.5);
        makeCylinder(0.7, 0.8, 9, 8, 0xF5F0D8, 20 + 18, 101, -20 - 6.5);

        // Fallen column drums scattered
        makeCylinder(1.0, 1.0, 2, 8, 0xE8E2CA, 20 - 35, 89, -20 - 5);
        makeCylinder(1.0, 1.0, 2, 8, 0xE8E2CA, 20 + 33, 89, -20 + 8);
        makeCylinder(1.0, 1.0, 2, 8, 0xE8E2CA, 20 - 10, 89, -20 - 15);

        // Broken column stump
        makeCylinder(0.9, 1.0, 5, 8, 0xF5F0D8, 20 + 31, 99, -20 + 10);
    }

    function buildErechtheion() {
        var i;
        // Smaller temple NW of Parthenon
        // Stylobate
        makeBox(24, 4, 13, 0xEEE8D0, -50, 89, -10);

        // Main body walls
        makeBox(22, 7, 1.5, 0xF5F0D8, -50, 96, -10 - 5.5);
        makeBox(22, 7, 1.5, 0xF5F0D8, -50, 96, -10 + 5.5);
        makeBox(1.5, 7, 11, 0xF5F0D8, -50 - 11, 96, -10);
        makeBox(1.5, 7, 11, 0xF5F0D8, -50 + 11, 96, -10);

        // East porch columns - 6 Ionic columns
        for (i = 0; i < 6; i++) {
            makeCylinder(0.55, 0.6, 6.5, 12, 0xF5F0D8, -50 + 11, 96, -10 - 5.5 + i * 2.2);
        }

        // Porch of Caryatids - south porch, 6 female figure columns
        // Each caryatid is a slightly tapered cylinder topped with a box capital
        for (i = 0; i < 6; i++) {
            makeCylinder(0.45, 0.5, 5.5, 8, 0xF5F0D8, -50 - 4 + i * 1.7, 94, -10 - 6);
            makeBox(1.0, 0.8, 1.0, 0xF2ECD4, -50 - 4 + i * 1.7, 99.6, -10 - 6);
        }
        // Caryatid porch entablature
        makeBox(10, 2, 2, 0xF0EAD0, -50 - 1, 100.5, -10 - 6);

        // North porch
        for (i = 0; i < 4; i++) {
            makeCylinder(0.55, 0.6, 6.5, 12, 0xF5F0D8, -50 - 8 + i * 2.5, 96, -10 + 5.5);
        }

        // Roof - partial slab
        makeBox(20, 1.5, 11, 0xECE6CE, -50, 103, -10);
    }

    function buildPropylaea() {
        var i;
        // Monumental gateway on western slope
        // Base platform
        makeBox(50, 6, 30, 0xD4C8A0, -120, 86, 0);

        // Central gateway building
        makeBox(36, 10, 5, 0xD8CC9C, -120, 92, -12);
        makeBox(36, 10, 5, 0xD8CC9C, -120, 92, 12);
        makeBox(5, 10, 24, 0xD4C8A0, -120 - 15, 92, 0);
        makeBox(5, 10, 24, 0xD4C8A0, -120 + 15, 92, 0);

        // 5 gateway columns - west facade
        for (i = 0; i < 6; i++) {
            makeCylinder(0.8, 0.9, 9, 8, 0xD8CCA4, -120 - 14, 91, -12.5 + i * 5);
        }
        // East facade columns
        for (i = 0; i < 6; i++) {
            makeCylinder(0.8, 0.9, 9, 8, 0xD8CCA4, -120 + 14, 91, -12.5 + i * 5);
        }

        // Entablature over propylaea
        makeBox(30, 3, 4, 0xCCC09A, -120, 97, -12);
        makeBox(30, 3, 4, 0xCCC09A, -120, 97, 12);

        // Pediment
        makeBox(30, 2, 4, 0xD0C49E, -120, 100, -12);
        makeBox(20, 2, 4, 0xD0C49E, -120, 102, -12);
        makeBox(10, 2, 4, 0xD0C49E, -120, 104, -12);

        // Wing buildings (north and south wings)
        makeBox(18, 8, 12, 0xCEC2A0, -120 - 8, 90, -20);
        makeBox(18, 8, 12, 0xCEC2A0, -120 - 8, 90, 20);

        // Approach ramp / steps
        makeBox(22, 2, 16, 0xC8BC9A, -138, 83, 0);
        makeBox(22, 2, 16, 0xC8BC9A, -144, 81, 0);
        makeBox(22, 2, 16, 0xC8BC9A, -150, 79, 0);
    }

    function buildTempleAthenaNike() {
        // Tiny 4-column Ionic temple at SW corner of Acropolis
        // Elevated bastion
        makeBox(16, 10, 12, 0xD4C8A0, -140, 90, -90);

        // Temple stylobate
        makeBox(9, 2, 6, 0xEEE8D0, -140, 96, -90);

        // 4 Ionic columns
        makeCylinder(0.4, 0.45, 5, 12, 0xF5F0D8, -140 - 3, 99, -90 - 2);
        makeCylinder(0.4, 0.45, 5, 12, 0xF5F0D8, -140 + 3, 99, -90 - 2);
        makeCylinder(0.4, 0.45, 5, 12, 0xF5F0D8, -140 - 3, 99, -90 + 2);
        makeCylinder(0.4, 0.45, 5, 12, 0xF5F0D8, -140 + 3, 99, -90 + 2);

        // Entablature
        makeBox(9, 2, 6, 0xF0EAD0, -140, 104.5, -90);

        // Pediment
        makeBox(9, 1.5, 1, 0xF2ECD4, -140, 106.5, -90 - 2.5);
        makeBox(6, 1.5, 1, 0xF2ECD4, -140, 108, -90 - 2.5);
        makeBox(2, 1.5, 1, 0xF2ECD4, -140, 109.5, -90 - 2.5);
    }

    function buildAcropolisWalls() {
        // Perimeter walls around the Acropolis summit
        // South wall
        makeBox(300, 6, 4, 0xB8AC86, 0, 87, -108);
        // North wall
        makeBox(300, 6, 4, 0xB8AC86, 0, 87, 108);
        // East wall
        makeBox(4, 6, 216, 0xB8AC86, 152, 87, 0);
        // West wall sections (broken by propylaea)
        makeBox(4, 6, 60, 0xB8AC86, -152, 87, -75);
        makeBox(4, 6, 60, 0xB8AC86, -152, 87, 75);

        // Towers on south wall
        makeBox(10, 12, 6, 0xBCB088, -60, 92, -108);
        makeBox(10, 12, 6, 0xBCB088, 80, 92, -108);

        // Beule Gate remnant (later Roman gate)
        makeBox(4, 8, 10, 0xC0B48C, -152, 90, -6);
        makeBox(4, 8, 10, 0xC0B48C, -152, 90, 6);
        makeBox(12, 3, 4, 0xBCAE88, -152, 96, 0);
    }

    function buildTheatreDionysus() {
        var i;
        // Ancient theatre carved into south slope of Acropolis
        // Orchestra circle (flat round area)
        makeCylinder(14, 14, 1.5, 16, 0x888888, 50, 72, 130);

        // Stage building (skene) - back wall
        makeBox(30, 6, 4, 0x777777, 50, 74, 116);
        makeBox(8, 8, 4, 0x888888, 50 - 16, 75, 116);
        makeBox(8, 8, 4, 0x888888, 50 + 16, 75, 116);

        // Columns on stage
        makeCylinder(0.6, 0.7, 6, 8, 0x909090, 50 - 8, 75, 116);
        makeCylinder(0.6, 0.7, 6, 8, 0x909090, 50, 75, 116);
        makeCylinder(0.6, 0.7, 6, 8, 0x909090, 50 + 8, 75, 116);

        // Carved stone seating tiers (cavea) - rising up south slope
        makeBox(70, 3, 8, 0x808080, 50, 75, 140);
        makeBox(80, 3, 8, 0x7A7A7A, 50, 78, 148);
        makeBox(90, 3, 8, 0x787878, 50, 81, 156);
        makeBox(96, 3, 8, 0x747474, 50, 84, 164);
        makeBox(100, 3, 8, 0x707070, 50, 87, 172);
        makeBox(100, 3, 8, 0x6E6E6E, 50, 90, 180);

        // Side walls of theatre
        makeBox(4, 18, 50, 0x767676, 50 - 52, 78, 155);
        makeBox(4, 18, 50, 0x767676, 50 + 52, 78, 155);
    }

    function buildNewAcropolisMuseum() {
        // Modern glass and concrete museum - southeast of Acropolis
        // Main glass box - modern angular building
        makeBox(90, 16, 50, 0xD3D3D3, 120, 8, 180);
        // Upper gallery floor - larger cantilevered
        makeBox(110, 8, 60, 0xC8C8C8, 120, 24, 180);
        // Concrete piloti supports
        makeCylinder(1.5, 1.5, 14, 6, 0xBEBEBE, 120 - 40, 7, 180 - 22);
        makeCylinder(1.5, 1.5, 14, 6, 0xBEBEBE, 120 - 40, 7, 180 + 22);
        makeCylinder(1.5, 1.5, 14, 6, 0xBEBEBE, 120, 7, 180 - 22);
        makeCylinder(1.5, 1.5, 14, 6, 0xBEBEBE, 120, 7, 180 + 22);
        makeCylinder(1.5, 1.5, 14, 6, 0xBEBEBE, 120 + 40, 7, 180 - 22);
        makeCylinder(1.5, 1.5, 14, 6, 0xBEBEBE, 120 + 40, 7, 180 + 22);
        // Basement archaeological floor (glass floor revealing excavations)
        makeBox(88, 2, 48, 0xAAAAAA, 120, 1, 180);
        // Entrance stairs/ramp
        makeBox(20, 1, 6, 0xC0C0C0, 120 - 55, 5, 180);
        makeBox(20, 1, 6, 0xC0C0C0, 120 - 55, 6, 180);
        makeBox(20, 1, 6, 0xC0C0C0, 120 - 55, 7, 180);
    }

    function buildTempleOlympianZeus() {
        var i;
        // Massive temple far southeast - 15 remaining Corinthian columns
        // Foundation platform
        makeBox(110, 4, 56, 0xE8E0C8, 300, 2, 250);

        // 15 surviving columns - tall Corinthian (using cylinder)
        // South row
        for (i = 0; i < 8; i++) {
            makeCylinder(1.5, 1.7, 17, 12, 0xF5F0D8, 300 - 49 + i * 14, 11, 250 - 22);
        }
        // East row remaining columns
        makeCylinder(1.5, 1.7, 17, 12, 0xF5F0D8, 300 + 49, 11, 250 - 22);
        makeCylinder(1.5, 1.7, 17, 12, 0xF5F0D8, 300 + 49, 11, 250 - 8);
        makeCylinder(1.5, 1.7, 17, 12, 0xF5F0D8, 300 + 49, 11, 250 + 8);
        makeCylinder(1.5, 1.7, 17, 12, 0xF5F0D8, 300 + 49, 11, 250 + 22);

        // Fallen column (famous fallen column at temple)
        // Use a box rotated - simulate fallen drum stack
        makeBox(17, 3, 3, 0xECE6CE, 300 - 20, 3.5, 250 + 20);

        // Corinthian capitals - boxes on top of columns
        for (i = 0; i < 8; i++) {
            makeBox(4, 2, 4, 0xF0EAD0, 300 - 49 + i * 14, 19.5, 250 - 22);
        }

        // Arch of Hadrian nearby
        makeBox(3, 12, 10, 0xE0D8C0, 280, 6, 300);
        makeBox(3, 12, 10, 0xE0D8C0, 292, 6, 300);
        makeBox(15, 4, 10, 0xDDD5BD, 286, 14, 300);
        makeBox(15, 3, 4, 0xDDD5BD, 286, 18, 300);
    }

    function buildLycabettusHill() {
        // Distinctive cone-shaped hill northeast of Acropolis
        // Hill layers - rough cone shape
        makeCone(90, 60, 8, 0xC8B89A, -200, 30, -300);
        makeCone(65, 40, 8, 0xBFAF90, -200, 60, -300);
        makeCone(40, 25, 8, 0xB8A888, -200, 72, -300);
        makeCone(18, 15, 8, 0xB0A080, -200, 82, -300);

        // Small chapel of St. George on top
        makeBox(8, 6, 6, 0xF0ECE4, -200, 92, -300);
        makeCone(4, 5, 8, 0xE8E4DC, -200, 97.5, -300);
        // Bell tower
        makeBox(2, 8, 2, 0xF0ECE4, -200 + 5, 93, -300);
        makeCone(2, 3, 6, 0xE8E4DC, -200 + 5, 100.5, -300);

        // Rocky outcrops on slope
        makeBox(20, 8, 15, 0xBEB09A, -200 - 50, 35, -300 - 30);
        makeBox(15, 6, 12, 0xC0B298, -200 + 45, 28, -300 + 40);
    }

    function buildAthensCityBlocks() {
        var i;
        // Dense Athens cityscape - white/cream apartment blocks
        // Plaka neighborhood (old town below acropolis)
        var plakaOffsets = [
            [60, 140], [85, 155], [110, 140], [60, 165], [90, 175],
            [40, 150], [130, 155], [70, 185], [115, 170], [100, 190]
        ];
        for (i = 0; i < plakaOffsets.length; i++) {
            makeBox(18, 10 + Math.floor(i * 1.5), 14, 0xE8DCCC,
                plakaOffsets[i][0], 5 + Math.floor(i * 0.75), plakaOffsets[i][1]);
        }

        // Syntagma square area apartments (east)
        makeBox(22, 18, 16, 0xEADECE, 240, 9, -80);
        makeBox(20, 14, 18, 0xE6DAC8, 270, 7, -60);
        makeBox(25, 20, 15, 0xE8DCC8, 260, 10, -100);
        makeBox(18, 12, 20, 0xECE0D0, 295, 6, -80);
        makeBox(30, 16, 14, 0xE4D8C4, 230, 8, -120);

        // Kolonaki (upscale residential - northeast)
        makeBox(24, 22, 18, 0xECE0CC, -100, 11, -220);
        makeBox(20, 18, 16, 0xEADECA, -130, 9, -240);
        makeBox(22, 20, 20, 0xE8DCC8, -80, 10, -250);
        makeBox(18, 14, 14, 0xEEE2CE, -110, 7, -200);
        makeBox(28, 24, 16, 0xECE0CC, -150, 12, -210);

        // Monastiraki area (west, near ancient agora)
        makeBox(16, 10, 12, 0xE4D8C4, -160, 5, 100);
        makeBox(20, 12, 16, 0xE6DACC, -180, 6, 80);
        makeBox(14, 8, 14, 0xE8DCD0, -170, 4, 120);

        // Distant city blocks - all directions
        // South Athens toward coast
        makeBox(35, 16, 30, 0xE0D4C0, 80, 8, 280);
        makeBox(40, 12, 35, 0xDDD1BD, 150, 6, 300);
        makeBox(30, 20, 25, 0xE2D6C2, 200, 10, 280);
        makeBox(45, 14, 40, 0xDFD3BF, 50, 7, 320);

        // North Athens - Patisia, Kypseli
        makeBox(40, 18, 35, 0xE4D8C4, -100, 9, -320);
        makeBox(35, 22, 30, 0xE2D6C2, -150, 11, -340);
        makeBox(50, 16, 45, 0xE0D4C0, -80, 8, -360);

        // West - Piraeus direction
        makeBox(35, 14, 30, 0xE4D8C4, -280, 7, 80);
        makeBox(40, 16, 35, 0xE2D6C2, -320, 8, 60);
        makeBox(30, 12, 25, 0xE6DAC8, -300, 6, 100);

        // East neighborhoods
        makeBox(38, 20, 32, 0xE6DAC8, 320, 10, 50);
        makeBox(42, 18, 38, 0xE4D8C4, 360, 9, 20);
        makeBox(36, 16, 30, 0xE8DCCA, 340, 8, 80);
    }

    function buildAcropolisPathway() {
        var i;
        // Sacred Way path ascending to Propylaea
        makeBox(12, 2, 60, 0xC8BC96, -170, 75, 0);
        makeBox(12, 2, 60, 0xC4B892, -185, 70, 0);
        makeBox(12, 2, 60, 0xC0B490, -200, 65, 0);

        // Ancient Agora of Athens (west of Acropolis)
        // Stoa of Attalos (reconstructed)
        makeBox(115, 10, 18, 0xEADECE, -200, 5, -60);
        // Stoa columns - front row
        for (i = 0; i < 12; i++) {
            makeCylinder(0.7, 0.8, 9, 8, 0xF0EAD4, -200 - 50 + i * 10, 8, -68);
        }
        // Temple of Hephaestus (Theseion) - well preserved
        makeBox(38, 4, 18, 0xE8E2CC, -230, 20, -100);
        for (i = 0; i < 6; i++) {
            makeCylinder(0.8, 0.9, 8, 8, 0xF0EAD4, -230 - 17 + i * 7, 23, -100 - 8);
        }
        for (i = 0; i < 6; i++) {
            makeCylinder(0.8, 0.9, 8, 8, 0xF0EAD4, -230 - 17 + i * 7, 23, -100 + 8);
        }
        // Theseion entablature and partial roof
        makeBox(36, 3, 18, 0xECE6D0, -230, 31.5, -100);
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
