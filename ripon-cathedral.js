window.RiponCathedral = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 21040;
    var OY = 0;
    var OZ = 0;

    function addMesh(geo, mat, x, y, z) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addMeshRot(geo, mat, x, y, z, rx, ry, rz) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        mesh.rotation.set(rx, ry, rz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function matLambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function build() {
        buildGround();
        buildCathedralWestFront();
        buildCathedralNave();
        buildCathedralCentral();
        buildCathedralTransept();
        buildSaxonCrypt();
        buildMarketSquare();
        buildObelisk();
        buildGeorgianTownhouses();
        buildRiponWorkhouse();
        buildCanalBasin();
        buildStudleyRoyalPark();
        buildMarketSquareDetails();
    }

    function buildGround() {
        // Ground plane built from box slabs — PlaneGeometry is forbidden
        var groundMat = matLambert(0x5A7A3A);
        // Main ground slab
        var ground = new THREE.Mesh(new THREE.BoxGeometry(600, 1, 600), groundMat);
        ground.position.set(OX, OY - 0.5, OZ);
        scene.add(ground);
        objects.push(ground);

        // Cathedral close ground — lighter stone paving
        var closeMat = matLambert(0xC8C0A8);
        var close = new THREE.Mesh(new THREE.BoxGeometry(120, 0.5, 140), closeMat);
        close.position.set(OX, OY, OZ + 10);
        scene.add(close);
        objects.push(close);

        // Market square cobbles
        var cobbleMat = matLambert(0xB0A898);
        var cobbles = new THREE.Mesh(new THREE.BoxGeometry(80, 0.5, 80), cobbleMat);
        cobbles.position.set(OX + 150, OY, OZ + 20);
        scene.add(cobbles);
        objects.push(cobbles);

        // Road connecting cathedral to market square
        var roadMat = matLambert(0x7A7060);
        var road = new THREE.Mesh(new THREE.BoxGeometry(60, 0.4, 14), roadMat);
        road.position.set(OX + 105, OY, OZ + 20);
        scene.add(road);
        objects.push(road);
    }

    function buildCathedralWestFront() {
        var stoneMat = matLambert(0xD4C9B0);
        var darkStoneMat = matLambert(0xB8AD98);
        var windowMat = matLambert(0x3A3A5C);
        var leadMat = matLambert(0x7A8A8A);

        // West front main facade body
        addMesh(new THREE.BoxGeometry(44, 38, 4), stoneMat, 0, 19, -36);

        // LEFT west tower — square tower
        addMesh(new THREE.BoxGeometry(14, 52, 14), stoneMat, -15, 26, -33);
        // Left tower cap
        addMesh(new THREE.BoxGeometry(14, 3, 14), darkStoneMat, -15, 53, -33);
        // Left tower pinnacle
        addMesh(new THREE.ConeGeometry(2.5, 10, 4), stoneMat, -15, 60, -33);
        // Left tower corner pinnacles
        addMesh(new THREE.ConeGeometry(1, 5, 4), stoneMat, -21, 54, -39);
        addMesh(new THREE.ConeGeometry(1, 5, 4), stoneMat, -9, 54, -39);
        addMesh(new THREE.ConeGeometry(1, 5, 4), stoneMat, -21, 54, -27);
        addMesh(new THREE.ConeGeometry(1, 5, 4), stoneMat, -9, 54, -27);

        // RIGHT west tower — square tower
        addMesh(new THREE.BoxGeometry(14, 52, 14), stoneMat, 15, 26, -33);
        // Right tower cap
        addMesh(new THREE.BoxGeometry(14, 3, 14), darkStoneMat, 15, 53, -33);
        // Right tower pinnacle
        addMesh(new THREE.ConeGeometry(2.5, 10, 4), stoneMat, 15, 60, -33);
        // Right tower corner pinnacles
        addMesh(new THREE.ConeGeometry(1, 5, 4), stoneMat, 21, 54, -39);
        addMesh(new THREE.ConeGeometry(1, 5, 4), stoneMat, 9, 54, -39);
        addMesh(new THREE.ConeGeometry(1, 5, 4), stoneMat, 21, 54, -27);
        addMesh(new THREE.ConeGeometry(1, 5, 4), stoneMat, 9, 54, -27);

        // West front main portal — recessed arch blocks
        addMesh(new THREE.BoxGeometry(8, 14, 2), darkStoneMat, 0, 7, -34);
        // Portal arch top (simulated with squashed cylinder)
        addMesh(new THREE.CylinderGeometry(4, 4, 2, 8, 1, false, 0, Math.PI), stoneMat, 0, 14.5, -34);

        // Blind arcading on west front — series of thin vertical ribs
        var arcMat = matLambert(0xC0B5A0);
        for (var bi = -3; bi <= 3; bi++) {
            addMesh(new THREE.BoxGeometry(0.6, 18, 1), arcMat, bi * 4.5, 20, -34);
        }
        // Blind arcading arch tops
        for (var ai = -3; ai <= 3; ai++) {
            addMesh(new THREE.CylinderGeometry(2, 2, 1, 6, 1, false, 0, Math.PI), arcMat, ai * 4.5, 29.5, -34);
        }

        // Lancet windows — tall narrow pointed windows in groups of three
        addMesh(new THREE.BoxGeometry(2.5, 10, 1), windowMat, -6, 28, -34);
        addMesh(new THREE.BoxGeometry(2.5, 10, 1), windowMat, 0, 28, -34);
        addMesh(new THREE.BoxGeometry(2.5, 10, 1), windowMat, 6, 28, -34);
        // Lancet pointed tops
        addMesh(new THREE.ConeGeometry(1.25, 3, 4), windowMat, -6, 34, -34);
        addMesh(new THREE.ConeGeometry(1.25, 3, 4), windowMat, 0, 34, -34);
        addMesh(new THREE.ConeGeometry(1.25, 3, 4), windowMat, 6, 34, -34);

        // Rose / circular window zone above lancets
        addMesh(new THREE.CylinderGeometry(3.5, 3.5, 1, 12), windowMat, 0, 38, -34);

        // West front string course horizontal bands
        addMesh(new THREE.BoxGeometry(44, 1.2, 2), darkStoneMat, 0, 18, -34);
        addMesh(new THREE.BoxGeometry(44, 1.2, 2), darkStoneMat, 0, 32, -34);

        // Lead roof of nave visible behind facade
        addMesh(new THREE.BoxGeometry(22, 1, 80), leadMat, 0, 38, 4);
        addMeshRot(new THREE.BoxGeometry(22, 1, 80), leadMat, -5, 38, 4, 0, 0, 0.18);
        addMeshRot(new THREE.BoxGeometry(22, 1, 80), leadMat, 5, 38, 4, 0, 0, -0.18);
    }

    function buildCathedralNave() {
        var stoneMat = matLambert(0xD4C9B0);
        var darkStoneMat = matLambert(0xB8AD98);
        var windowMat = matLambert(0x3A3A5C);
        var pillarMat = matLambert(0xC8BDA8);

        // Nave outer walls — north and south
        // South nave wall
        addMesh(new THREE.BoxGeometry(4, 32, 80), stoneMat, -22, 16, 4);
        // North nave wall
        addMesh(new THREE.BoxGeometry(4, 32, 80), stoneMat, 22, 16, 4);

        // Nave clearstory level — upper walls with windows
        addMesh(new THREE.BoxGeometry(4, 10, 80), darkStoneMat, -22, 38, 4);
        addMesh(new THREE.BoxGeometry(4, 10, 80), darkStoneMat, 22, 38, 4);

        // Clerestory windows south
        for (var cs = 0; cs < 6; cs++) {
            addMesh(new THREE.BoxGeometry(1, 7, 3), windowMat, -21, 38, -28 + cs * 12);
        }
        // Clerestory windows north
        for (var cn = 0; cn < 6; cn++) {
            addMesh(new THREE.BoxGeometry(1, 7, 3), windowMat, 21, 38, -28 + cn * 12);
        }

        // Triforium band — decorative horizontal arcade zone
        addMesh(new THREE.BoxGeometry(4, 5, 80), matLambert(0xC2B7A2), -22, 28, 4);
        addMesh(new THREE.BoxGeometry(4, 5, 80), matLambert(0xC2B7A2), 22, 28, 4);

        // Nave interior pillars — alternating round and octagonal (12th century)
        for (var np = 0; np < 6; np++) {
            var pz = -26 + np * 12;
            if (np % 2 === 0) {
                // Round pillars
                addMesh(new THREE.CylinderGeometry(1.4, 1.4, 30, 12), pillarMat, -10, 15, pz);
                addMesh(new THREE.CylinderGeometry(1.4, 1.4, 30, 12), pillarMat, 10, 15, pz);
            } else {
                // Octagonal pillars
                addMesh(new THREE.CylinderGeometry(1.4, 1.4, 30, 8), pillarMat, -10, 15, pz);
                addMesh(new THREE.CylinderGeometry(1.4, 1.4, 30, 8), pillarMat, 10, 15, pz);
            }
            // Pillar caps
            addMesh(new THREE.BoxGeometry(3.5, 1.5, 3.5), stoneMat, -10, 31, pz);
            addMesh(new THREE.BoxGeometry(3.5, 1.5, 3.5), stoneMat, 10, 31, pz);
        }

        // Aisle outer walls south
        addMesh(new THREE.BoxGeometry(4, 20, 80), stoneMat, -32, 10, 4);
        // Aisle outer walls north
        addMesh(new THREE.BoxGeometry(4, 20, 80), stoneMat, 32, 10, 4);

        // Aisle roofs
        addMesh(new THREE.BoxGeometry(12, 1, 80), matLambert(0x8A9A9A), -27, 22, 4);
        addMesh(new THREE.BoxGeometry(12, 1, 80), matLambert(0x8A9A9A), 27, 22, 4);

        // Aisle windows south
        for (var as = 0; as < 6; as++) {
            addMesh(new THREE.BoxGeometry(1, 8, 4), windowMat, -32, 10, -28 + as * 12);
        }
        // Aisle windows north
        for (var an = 0; an < 6; an++) {
            addMesh(new THREE.BoxGeometry(1, 8, 4), windowMat, 32, 10, -28 + an * 12);
        }

        // Nave end wall (east end toward choir)
        addMesh(new THREE.BoxGeometry(68, 42, 4), stoneMat, 0, 21, 44);

        // Nave east end lancet windows
        addMesh(new THREE.BoxGeometry(2, 12, 1), windowMat, -8, 22, 42);
        addMesh(new THREE.BoxGeometry(2, 12, 1), windowMat, 0, 22, 42);
        addMesh(new THREE.BoxGeometry(2, 12, 1), windowMat, 8, 22, 42);
    }

    function buildCathedralCentral() {
        var stoneMat = matLambert(0xD4C9B0);
        var darkStoneMat = matLambert(0xB8AD98);
        var windowMat = matLambert(0x3A3A5C);

        // Low central tower over crossing — Ripon's tower is relatively modest
        // Tower base
        addMesh(new THREE.BoxGeometry(24, 8, 24), stoneMat, 0, 44, 44);
        // Tower upper stage
        addMesh(new THREE.BoxGeometry(22, 10, 22), stoneMat, 0, 53, 44);
        // Tower top parapet
        addMesh(new THREE.BoxGeometry(23, 2, 23), darkStoneMat, 0, 59, 44);
        // Corner pinnacles on tower
        addMesh(new THREE.ConeGeometry(1.2, 6, 4), stoneMat, -11, 63, 33);
        addMesh(new THREE.ConeGeometry(1.2, 6, 4), stoneMat, 11, 63, 33);
        addMesh(new THREE.ConeGeometry(1.2, 6, 4), stoneMat, -11, 63, 55);
        addMesh(new THREE.ConeGeometry(1.2, 6, 4), stoneMat, 11, 63, 55);

        // Tower belfry windows — pairs on each face
        addMesh(new THREE.BoxGeometry(3, 6, 1), windowMat, -4, 52, 33);
        addMesh(new THREE.BoxGeometry(3, 6, 1), windowMat, 4, 52, 33);
        addMesh(new THREE.BoxGeometry(3, 6, 1), windowMat, -4, 52, 55);
        addMesh(new THREE.BoxGeometry(3, 6, 1), windowMat, 4, 52, 55);
        addMesh(new THREE.BoxGeometry(1, 6, 3), windowMat, -11, 52, 38);
        addMesh(new THREE.BoxGeometry(1, 6, 3), windowMat, -11, 52, 50);
        addMesh(new THREE.BoxGeometry(1, 6, 3), windowMat, 11, 52, 38);
        addMesh(new THREE.BoxGeometry(1, 6, 3), windowMat, 11, 52, 50);

        // Choir east of crossing
        addMesh(new THREE.BoxGeometry(28, 38, 40), stoneMat, 0, 19, 68);
        // Choir aisle walls
        addMesh(new THREE.BoxGeometry(4, 20, 40), stoneMat, -22, 10, 68);
        addMesh(new THREE.BoxGeometry(4, 20, 40), stoneMat, 22, 10, 68);
        // East end / Lady Chapel
        addMesh(new THREE.BoxGeometry(44, 38, 4), stoneMat, 0, 19, 90);
        // East window — tall Early English lancets
        addMesh(new THREE.BoxGeometry(2, 16, 1), windowMat, -6, 22, 89);
        addMesh(new THREE.BoxGeometry(2, 16, 1), windowMat, 0, 22, 89);
        addMesh(new THREE.BoxGeometry(2, 16, 1), windowMat, 6, 22, 89);
        // East window pointed tops
        addMesh(new THREE.ConeGeometry(1, 4, 4), windowMat, -6, 31, 89);
        addMesh(new THREE.ConeGeometry(1, 4, 4), windowMat, 0, 31, 89);
        addMesh(new THREE.ConeGeometry(1, 4, 4), windowMat, 6, 31, 89);
    }

    function buildCathedralTransept() {
        var stoneMat = matLambert(0xD4C9B0);
        var darkStoneMat = matLambert(0xB8AD98);
        var windowMat = matLambert(0x3A3A5C);

        // North transept
        addMesh(new THREE.BoxGeometry(28, 36, 30), stoneMat, 29, 18, 44);
        // North transept gable
        addMeshRot(new THREE.BoxGeometry(28, 8, 2), stoneMat, 29, 38, 29, 0.4, 0, 0);
        // North transept window
        addMesh(new THREE.BoxGeometry(4, 14, 1), windowMat, 29, 22, 29);
        addMesh(new THREE.ConeGeometry(2, 5, 4), windowMat, 29, 30, 29);

        // South transept
        addMesh(new THREE.BoxGeometry(28, 36, 30), stoneMat, -29, 18, 44);
        // South transept gable
        addMeshRot(new THREE.BoxGeometry(28, 8, 2), stoneMat, -29, 38, 29, 0.4, 0, 0);
        // South transept window
        addMesh(new THREE.BoxGeometry(4, 14, 1), windowMat, -29, 22, 29);
        addMesh(new THREE.ConeGeometry(2, 5, 4), windowMat, -29, 30, 29);

        // Transept roofs
        addMesh(new THREE.BoxGeometry(28, 1, 30), matLambert(0x8A9A9A), 29, 36, 44);
        addMesh(new THREE.BoxGeometry(28, 1, 30), matLambert(0x8A9A9A), -29, 36, 44);

        // Crossing arch supports — piers
        var pierMat = matLambert(0xC8BDA8);
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 44, 8), pierMat, -11, 22, 33);
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 44, 8), pierMat, 11, 22, 33);
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 44, 8), pierMat, -11, 22, 55);
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 44, 8), pierMat, 11, 22, 55);
    }

    function buildSaxonCrypt() {
        // St Wilfrid's crypt 672 AD — ancient tunnel crypt under crossing
        var cryptMat = matLambert(0x6E6458);
        var cryptDarkMat = matLambert(0x4A3F38);

        // Crypt chamber walls (underground — shown partially sunken)
        addMesh(new THREE.BoxGeometry(10, 5, 14), cryptMat, 0, -2, 44);
        // Crypt inner space (darker hollow suggestion)
        addMesh(new THREE.BoxGeometry(7, 3, 11), cryptDarkMat, 0, -1.5, 44);

        // Crypt access passage west
        addMesh(new THREE.BoxGeometry(3, 3, 8), cryptMat, -4, -2, 36);
        addMesh(new THREE.BoxGeometry(3, 3, 8), cryptMat, 4, -2, 36);

        // Crypt tunnel arch suggestion — curved roof blocks
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 10, 8, 1, false, 0, Math.PI), cryptMat, 0, 1, 44);
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 8, 8, 1, false, 0, Math.PI), cryptMat, -4, 0, 36);

        // Saxon stonework markers — rough ancient stones
        addMesh(new THREE.BoxGeometry(1.5, 0.8, 1.5), cryptDarkMat, -3, 0.4, 39);
        addMesh(new THREE.BoxGeometry(1.5, 0.8, 1.5), cryptDarkMat, 3, 0.4, 39);
        addMesh(new THREE.BoxGeometry(1.2, 0.6, 1.2), cryptDarkMat, 0, 0.3, 38);

        // Crypt entrance steps descending
        addMesh(new THREE.BoxGeometry(4, 0.4, 1), matLambert(0x8A7A68), 0, 0, 31);
        addMesh(new THREE.BoxGeometry(4, 0.4, 1), matLambert(0x8A7A68), 0, -0.4, 32);
        addMesh(new THREE.BoxGeometry(4, 0.4, 1), matLambert(0x8A7A68), 0, -0.8, 33);
        addMesh(new THREE.BoxGeometry(4, 0.4, 1), matLambert(0x8A7A68), 0, -1.2, 34);
    }

    function buildMarketSquare() {
        var stoneMat = matLambert(0xD4C9B0);
        var cobbleMat = matLambert(0xB0A898);
        var darkMat = matLambert(0x7A6E60);

        // Market square perimeter low kerb walls
        addMesh(new THREE.BoxGeometry(80, 0.6, 2), darkMat, 150, 0.3, -20);
        addMesh(new THREE.BoxGeometry(80, 0.6, 2), darkMat, 150, 0.3, 60);
        addMesh(new THREE.BoxGeometry(2, 0.6, 80), darkMat, 110, 0.3, 20);
        addMesh(new THREE.BoxGeometry(2, 0.6, 80), darkMat, 190, 0.3, 20);

        // Hornblower plinth — the wakeman's horn is blown nightly
        var plinthMat = matLambert(0xC8B89A);
        addMesh(new THREE.BoxGeometry(4, 1.2, 4), plinthMat, 150, 0.6, 20);
        // Hornblower figure (simplified humanoid)
        addMesh(new THREE.BoxGeometry(1.2, 3, 0.8), matLambert(0x4A3828), 150, 2.7, 20);
        addMesh(new THREE.SphereGeometry(0.7, 8, 8), matLambert(0xD4A882), 150, 4.9, 20);
        // Horn shape
        addMesh(new THREE.CylinderGeometry(0.15, 0.5, 3, 8), matLambert(0x8B6914), 151.5, 3.2, 20);

        // Market cross — traditional stone market cross
        addMesh(new THREE.BoxGeometry(6, 0.5, 6), stoneMat, 150, 0.25, 5);
        addMesh(new THREE.BoxGeometry(4, 0.5, 4), stoneMat, 150, 0.75, 5);
        addMesh(new THREE.CylinderGeometry(0.4, 0.6, 8, 8), stoneMat, 150, 5, 5);
        // Cross arms
        addMesh(new THREE.BoxGeometry(4, 0.5, 0.5), stoneMat, 150, 9.5, 5);
        addMesh(new THREE.BoxGeometry(0.5, 3, 0.5), stoneMat, 150, 10.5, 5);

        // Market stall frameworks — timber market stalls
        var timberMat = matLambert(0x6B4C2A);
        for (var ms = 0; ms < 5; ms++) {
            addMesh(new THREE.BoxGeometry(5, 0.3, 3), matLambert(0xDEB887), 125 + ms * 10, 1.15, 0);
            addMesh(new THREE.CylinderGeometry(0.15, 0.15, 2.2, 6), timberMat, 122 + ms * 10, 1.1, -1);
            addMesh(new THREE.CylinderGeometry(0.15, 0.15, 2.2, 6), timberMat, 127 + ms * 10, 1.1, -1);
        }
    }

    function buildObelisk() {
        // Aislabie obelisk in market square centre
        var obeliskMat = matLambert(0xC8B89A);
        var baseMat = matLambert(0xB8A888);

        // Multi-stepped base
        addMesh(new THREE.BoxGeometry(5, 1, 5), baseMat, 150, 0.5, 40);
        addMesh(new THREE.BoxGeometry(4, 1, 4), baseMat, 150, 1.5, 40);
        addMesh(new THREE.BoxGeometry(3, 1, 3), baseMat, 150, 2.5, 40);
        // Obelisk shaft — tall tapered
        addMesh(new THREE.BoxGeometry(2, 18, 2), obeliskMat, 150, 12, 40);
        addMesh(new THREE.BoxGeometry(1.5, 6, 1.5), obeliskMat, 150, 24, 40);
        // Obelisk pyramidion tip
        addMesh(new THREE.ConeGeometry(1.2, 4, 4), obeliskMat, 150, 29.5, 40);

        // Decorative iron railings around obelisk (box posts)
        var railMat = matLambert(0x2A2A2A);
        for (var or = 0; or < 8; or++) {
            var angle = (or / 8) * Math.PI * 2;
            var rx = Math.cos(angle) * 5;
            var rz = Math.sin(angle) * 5;
            addMesh(new THREE.BoxGeometry(0.2, 2.5, 0.2), railMat, 150 + rx, 1.25, 40 + rz);
        }
    }

    function buildGeorgianTownhouses() {
        var georgianMat = matLambert(0xF5F0E8);
        var georgiaMat2 = matLambert(0xD4C9B0);
        var roofMat = matLambert(0x6A4E35);
        var windowMat = matLambert(0x3A5A7A);
        var doorMat = matLambert(0x3A2818);

        // North side of market square — row of Georgian townhouses
        for (var gh = 0; gh < 6; gh++) {
            var hx = 115 + gh * 13;
            var hz = -30;
            var mat = (gh % 2 === 0) ? georgianMat : georgiaMat2;

            // Main house body
            addMesh(new THREE.BoxGeometry(11, 14, 10), mat, hx, 7, hz);
            // Roof
            addMesh(new THREE.BoxGeometry(11, 1, 10), roofMat, hx, 14.5, hz);
            addMeshRot(new THREE.BoxGeometry(12, 1, 6), roofMat, hx, 15.5, hz, 0.35, 0, 0);
            addMeshRot(new THREE.BoxGeometry(12, 1, 6), roofMat, hx, 15.5, hz - 2, -0.35, 0, 0);

            // Sash windows — two per floor, two floors
            addMesh(new THREE.BoxGeometry(2.5, 3, 0.5), windowMat, hx - 2.5, 5, hz - 5);
            addMesh(new THREE.BoxGeometry(2.5, 3, 0.5), windowMat, hx + 2.5, 5, hz - 5);
            addMesh(new THREE.BoxGeometry(2.5, 3, 0.5), windowMat, hx - 2.5, 10, hz - 5);
            addMesh(new THREE.BoxGeometry(2.5, 3, 0.5), windowMat, hx + 2.5, 10, hz - 5);

            // Georgian door with fanlight
            addMesh(new THREE.BoxGeometry(2, 4, 0.5), doorMat, hx, 2, hz - 5);
            addMesh(new THREE.CylinderGeometry(1, 1, 0.5, 8, 1, false, 0, Math.PI), windowMat, hx, 4.3, hz - 5);

            // Chimney stacks
            addMesh(new THREE.BoxGeometry(1.5, 3.5, 1.5), georgiaMat2, hx - 3, 17.5, hz);
            addMesh(new THREE.BoxGeometry(1.5, 3.5, 1.5), georgiaMat2, hx + 3, 17.5, hz);
        }

        // South side of market square — more varied buildings
        for (var ghs = 0; ghs < 4; ghs++) {
            var shx = 120 + ghs * 16;
            var shz = 65;
            addMesh(new THREE.BoxGeometry(13, 16, 10), georgiaMat2, shx, 8, shz);
            addMesh(new THREE.BoxGeometry(13, 1, 10), roofMat, shx, 16.5, shz);
            addMesh(new THREE.BoxGeometry(3, 3.5, 0.5), windowMat, shx - 3, 7, shz + 5);
            addMesh(new THREE.BoxGeometry(3, 3.5, 0.5), windowMat, shx + 3, 7, shz + 5);
            addMesh(new THREE.BoxGeometry(3, 3.5, 0.5), windowMat, shx - 3, 13, shz + 5);
            addMesh(new THREE.BoxGeometry(3, 3.5, 0.5), windowMat, shx + 3, 13, shz + 5);
            addMesh(new THREE.BoxGeometry(2, 5, 0.5), doorMat, shx, 2.5, shz + 5);
        }
    }

    function buildRiponWorkhouse() {
        // Victorian workhouse museum on edge of town
        var workhouseMat = matLambert(0xCD5C5C);
        var roofMat = matLambert(0x5A3C28);
        var windowMat = matLambert(0x3A5A3A);
        var stoneMat = matLambert(0xD4C9B0);

        // Main workhouse block — imposing Victorian brick
        addMesh(new THREE.BoxGeometry(50, 18, 18), workhouseMat, -120, 9, 60);
        // Wing blocks
        addMesh(new THREE.BoxGeometry(14, 18, 30), workhouseMat, -90, 9, 45);
        addMesh(new THREE.BoxGeometry(14, 18, 30), workhouseMat, -150, 9, 45);

        // Pitched roof
        addMesh(new THREE.BoxGeometry(50, 1, 18), roofMat, -120, 18.5, 60);
        addMeshRot(new THREE.BoxGeometry(52, 1, 12), roofMat, -120, 20, 60, 0.35, 0, 0);
        addMeshRot(new THREE.BoxGeometry(52, 1, 12), roofMat, -120, 20, 66, -0.35, 0, 0);

        // Workhouse gate lodge
        addMesh(new THREE.BoxGeometry(8, 10, 8), stoneMat, -120, 5, 35);
        addMesh(new THREE.ConeGeometry(5, 4, 4), roofMat, -120, 12, 35);

        // Gate piers
        addMesh(new THREE.BoxGeometry(2, 8, 2), stoneMat, -113, 4, 35);
        addMesh(new THREE.BoxGeometry(2, 8, 2), stoneMat, -127, 4, 35);
        addMesh(new THREE.SphereGeometry(1.2, 8, 8), stoneMat, -113, 9, 35);
        addMesh(new THREE.SphereGeometry(1.2, 8, 8), stoneMat, -127, 9, 35);

        // Workhouse windows — small functional Victorian windows
        for (var ww = 0; ww < 5; ww++) {
            addMesh(new THREE.BoxGeometry(2.5, 3.5, 0.5), windowMat, -136 + ww * 10, 7, 51);
            addMesh(new THREE.BoxGeometry(2.5, 3.5, 0.5), windowMat, -136 + ww * 10, 13, 51);
        }

        // Chapel attached to workhouse
        addMesh(new THREE.BoxGeometry(16, 14, 12), matLambert(0xC05050), -120, 7, 80);
        addMesh(new THREE.BoxGeometry(16, 1, 12), roofMat, -120, 14.5, 80);
        addMeshRot(new THREE.BoxGeometry(17, 1, 8), roofMat, -120, 15.5, 80, 0.4, 0, 0);
        // Chapel lancet window
        addMesh(new THREE.BoxGeometry(2.5, 7, 0.5), windowMat, -120, 9, 74);
        addMesh(new THREE.ConeGeometry(1.25, 3, 4), windowMat, -120, 14, 74);
    }

    function buildCanalBasin() {
        // Ripon Canal terminus and canal basin
        var waterMat = matLambert(0x006994);
        var stoneMat = matLambert(0xA09080);
        var boatMat = matLambert(0x8B2020);
        var boatMat2 = matLambert(0x1A5C8A);

        // Canal basin water
        addMesh(new THREE.BoxGeometry(60, 0.5, 30), waterMat, -120, 0.25, -80);

        // Canal approach channel
        addMesh(new THREE.BoxGeometry(12, 0.5, 40), waterMat, -145, 0.25, -60);

        // Canal basin stone surround
        addMesh(new THREE.BoxGeometry(62, 1.5, 3), stoneMat, -120, 0.75, -65);
        addMesh(new THREE.BoxGeometry(62, 1.5, 3), stoneMat, -120, 0.75, -95);
        addMesh(new THREE.BoxGeometry(3, 1.5, 30), stoneMat, -89, 0.75, -80);
        addMesh(new THREE.BoxGeometry(3, 1.5, 30), stoneMat, -151, 0.75, -80);

        // Narrowboat 1 — traditional style
        addMesh(new THREE.BoxGeometry(20, 2, 4), boatMat, -105, 1.5, -78);
        addMesh(new THREE.BoxGeometry(18, 2, 3.5), matLambert(0xF5C842), -105, 3.5, -78);
        addMesh(new THREE.BoxGeometry(4, 3, 4), boatMat, -115, 3, -78);
        // Boat chimney
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 6), matLambert(0x1A1A1A), -115, 6, -78);

        // Narrowboat 2
        addMesh(new THREE.BoxGeometry(22, 2, 4), boatMat2, -128, 1.5, -82);
        addMesh(new THREE.BoxGeometry(20, 2, 3.5), matLambert(0xE8E8E8), -128, 3.5, -82);
        addMesh(new THREE.BoxGeometry(4, 3, 4), boatMat2, -138, 3, -82);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 6), matLambert(0x1A1A1A), -138, 6, -82);

        // Canal warehouse
        addMesh(new THREE.BoxGeometry(22, 14, 16), matLambert(0xA05C3C), -108, 7, -100);
        addMesh(new THREE.BoxGeometry(22, 1, 16), matLambert(0x5A3C28), -108, 14.5, -100);
        // Warehouse loading doors
        addMesh(new THREE.BoxGeometry(5, 7, 0.5), matLambert(0x4A3018), -108, 3.5, -92);

        // Canal lock gates suggestion
        addMesh(new THREE.BoxGeometry(12, 4, 1.5), matLambert(0x5A4A38), -145, 2, -70);
        addMesh(new THREE.BoxGeometry(6, 4, 1.5), matLambert(0x5A4A38), -148, 2, -68);
        addMesh(new THREE.BoxGeometry(6, 4, 1.5), matLambert(0x5A4A38), -142, 2, -68);

        // Canal towpath
        addMesh(new THREE.BoxGeometry(60, 0.3, 8), matLambert(0xC8A878), -120, 0.15, -58);

        // Mooring posts
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 2.5, 6), matLambert(0x2A1A0A), -95, 1.25, -67);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 2.5, 6), matLambert(0x2A1A0A), -110, 1.25, -67);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 2.5, 6), matLambert(0x2A1A0A), -125, 1.25, -67);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 2.5, 6), matLambert(0x2A1A0A), -140, 1.25, -67);
    }

    function buildStudleyRoyalPark() {
        // Studley Royal deer park — World Heritage parkland near Ripon
        var parkMat = matLambert(0x3D6B30);
        var treeMat = matLambert(0x2A5A20);
        var trunkMat = matLambert(0x5A4020);
        var deerMat = matLambert(0xC8A068);

        // Park ground
        addMesh(new THREE.BoxGeometry(160, 0.5, 100), parkMat, 80, 0.25, -120);

        // Mature parkland oaks
        for (var tr = 0; tr < 12; tr++) {
            var tx = 20 + (tr % 4) * 36 + (Math.floor(tr / 4) % 2) * 18;
            var tz = -100 - Math.floor(tr / 4) * 28;
            addMesh(new THREE.CylinderGeometry(0.8, 1.2, 8, 8), trunkMat, tx, 4, tz);
            addMesh(new THREE.SphereGeometry(7, 8, 8), treeMat, tx, 14, tz);
        }

        // Deer herd — simplified deer shapes
        for (var dr = 0; dr < 5; dr++) {
            var drx = 50 + dr * 14;
            var drz = -110;
            // Deer body
            addMesh(new THREE.BoxGeometry(3, 1.5, 1.2), deerMat, drx, 1.5, drz);
            // Deer head
            addMesh(new THREE.SphereGeometry(0.6, 6, 6), deerMat, drx + 1.8, 2.5, drz);
            // Deer legs
            addMesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 4), deerMat, drx + 0.8, 0.6, drz + 0.35);
            addMesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 4), deerMat, drx - 0.8, 0.6, drz + 0.35);
            // Deer antlers (stag)
            if (dr % 2 === 0) {
                addMesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5, 4), deerMat, drx + 1.8, 3.5, drz);
                addMesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 4), deerMat, drx + 1.5, 4, drz);
            }
        }

        // Ha-ha wall (sunken garden boundary)
        addMesh(new THREE.BoxGeometry(160, 3, 2), matLambert(0xA09080), 80, 1.5, -105);

        // Park lake / river Skell suggestion
        addMesh(new THREE.BoxGeometry(80, 0.3, 20), matLambert(0x4A7A9A), 40, 0.15, -140);

        // Temple of Piety folly (classical column suggestion)
        addMesh(new THREE.CylinderGeometry(8, 8, 2, 16), matLambert(0xE8E0D0), 110, 1, -130);
        addMesh(new THREE.CylinderGeometry(1, 1, 12, 8), matLambert(0xE8E0D0), 100, 6, -130);
        addMesh(new THREE.CylinderGeometry(1, 1, 12, 8), matLambert(0xE8E0D0), 104, 6, -130);
        addMesh(new THREE.CylinderGeometry(1, 1, 12, 8), matLambert(0xE8E0D0), 108, 6, -130);
        addMesh(new THREE.CylinderGeometry(1, 1, 12, 8), matLambert(0xE8E0D0), 112, 6, -130);
        addMesh(new THREE.CylinderGeometry(1, 1, 12, 8), matLambert(0xE8E0D0), 116, 6, -130);
        addMesh(new THREE.CylinderGeometry(1, 1, 12, 8), matLambert(0xE8E0D0), 120, 6, -130);
        addMesh(new THREE.BoxGeometry(22, 1.5, 8), matLambert(0xE8E0D0), 110, 13, -130);
    }

    function buildMarketSquareDetails() {
        var stoneMat = matLambert(0xD4C9B0);
        var ironMat = matLambert(0x2A2A2A);
        var greenMat = matLambert(0x2A5A1A);

        // Street lamp posts around market square
        for (var lp = 0; lp < 6; lp++) {
            var lpx = 115 + lp * 15;
            addMesh(new THREE.CylinderGeometry(0.2, 0.3, 6, 8), ironMat, lpx, 3, -16);
            addMesh(new THREE.SphereGeometry(0.8, 8, 8), matLambert(0xFFDD88), lpx, 6.5, -16);
            addMesh(new THREE.CylinderGeometry(0.2, 0.3, 6, 8), ironMat, lpx, 3, 56);
            addMesh(new THREE.SphereGeometry(0.8, 8, 8), matLambert(0xFFDD88), lpx, 6.5, 56);
        }

        // Town hall / town hall-like building on north of square
        addMesh(new THREE.BoxGeometry(30, 18, 12), matLambert(0xD4C9B0), 195, 9, 20);
        // Portico columns
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 14, 8), matLambert(0xE8E0D0), 182, 7, 15);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 14, 8), matLambert(0xE8E0D0), 186, 7, 15);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 14, 8), matLambert(0xE8E0D0), 190, 7, 15);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 14, 8), matLambert(0xE8E0D0), 194, 7, 15);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 14, 8), matLambert(0xE8E0D0), 198, 7, 15);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 14, 8), matLambert(0xE8E0D0), 202, 7, 15);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 14, 8), matLambert(0xE8E0D0), 206, 7, 15);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 14, 8), matLambert(0xE8E0D0), 208, 7, 15);
        // Pediment
        addMeshRot(new THREE.BoxGeometry(30, 1, 8), matLambert(0xD4C9B0), 195, 16, 15, 0.3, 0, 0);
        // Town hall clock tower
        addMesh(new THREE.BoxGeometry(8, 12, 8), matLambert(0xD4C9B0), 195, 24, 20);
        addMesh(new THREE.CylinderGeometry(2, 2, 2, 8), matLambert(0xC8C8C8), 195, 31, 20);
        addMesh(new THREE.ConeGeometry(3, 5, 4), matLambert(0x5A3C28), 195, 34, 20);

        // Market square tree plantings
        addMesh(new THREE.CylinderGeometry(0.5, 0.7, 5, 8), matLambert(0x5A4020), 130, 2.5, 20);
        addMesh(new THREE.SphereGeometry(4, 8, 8), greenMat, 130, 9, 20);
        addMesh(new THREE.CylinderGeometry(0.5, 0.7, 5, 8), matLambert(0x5A4020), 170, 2.5, 20);
        addMesh(new THREE.SphereGeometry(4, 8, 8), greenMat, 170, 9, 20);

        // Cathedral close boundary wall
        addMesh(new THREE.BoxGeometry(2, 4, 140), matLambert(0xC8BDA8), 58, 2, 10);
        addMesh(new THREE.BoxGeometry(2, 4, 140), matLambert(0xC8BDA8), -58, 2, 10);
        addMesh(new THREE.BoxGeometry(120, 4, 2), matLambert(0xC8BDA8), 0, 2, -45);

        // Cathedral close lych gate
        addMesh(new THREE.BoxGeometry(2, 7, 2), stoneMat, -5, 3.5, -44);
        addMesh(new THREE.BoxGeometry(2, 7, 2), stoneMat, 5, 3.5, -44);
        addMesh(new THREE.BoxGeometry(14, 1, 3), matLambert(0x5A4020), 0, 7.5, -44);
        addMesh(new THREE.ConeGeometry(7, 3, 4), matLambert(0x5A4020), 0, 10, -44);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function update(delta) {
        // Static environment — no per-frame animation required
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
