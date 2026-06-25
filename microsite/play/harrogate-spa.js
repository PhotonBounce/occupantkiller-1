window.HarrogateSpa = (function() {
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

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(20840 + x, y, z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, color, x, y, z, segs) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(20840 + x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, color, x, y, z, wSegs, hSegs) {
        var geo = new THREE.SphereGeometry(r, wSegs || 16, hSegs || 12);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(20840 + x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, color, x, y, z, segs) {
        var geo = new THREE.ConeGeometry(r, h, segs || 8);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(20840 + x, y, z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildRoyalPumpRoom();
        buildTheStray();
        buildBettyCafe();
        buildConventionCentre();
        buildValleyGardens();
        buildSunColonnade();
        buildTurkishBaths();
        buildParliamentStreet();
        buildOldSwanHotel();
        buildMercerGallery();
        buildCrimpleViaduct();
    }

    // ---- GROUND PLANE (using Box, not Plane) ----
    function buildGround() {
        // Large flat ground as thin box
        makeBox(1200, 0.5, 1200, 0x7a9c6a, 0, -0.25, 0);
        // Road surface - Parliament Street axis
        makeBox(600, 0.6, 14, 0x555555, 0, 0, 0);
        // Cross road
        makeBox(14, 0.6, 400, 0x555555, 20, 0, 0);
        // Pavement edges
        makeBox(600, 0.8, 3, 0x888888, 0, 0, 8);
        makeBox(600, 0.8, 3, 0x888888, 0, 0, -8);
    }

    // ---- 1. THE ROYAL PUMP ROOM ----
    // Ornate domed octagonal building where visitors drank sulphur spring water
    function buildRoyalPumpRoom() {
        // Main octagonal body (approximated with cylinder)
        makeCyl(12, 12, 10, 0xC8B89A, -180, 5, -60, 8);
        // Classical drum below dome
        makeCyl(10, 10, 4, 0xD4C9B0, -180, 12, -60, 8);
        // Dome - the signature feature
        makeSphere(10, 0xC8B89A, -180, 18, -60, 16, 12);
        // Dome lantern top
        makeCyl(1.5, 1.5, 3, 0xD4C9B0, -180, 25, -60, 8);
        makeSphere(1.5, 0xC8B89A, -180, 27.5, -60, 8, 6);
        // Classical columns around perimeter (8 columns)
        var i;
        for (i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var cx = Math.cos(angle) * 13;
            var cz = Math.sin(angle) * 13;
            makeCyl(0.6, 0.6, 10, 0xF5F0E8, -180 + cx, 5, -60 + cz, 6);
            // Column capital
            makeCyl(0.9, 0.6, 0.8, 0xEEE8D5, -180 + cx, 10.4, -60 + cz, 6);
            // Column base
            makeCyl(0.9, 0.9, 0.5, 0xEEE8D5, -180 + cx, 0.25, -60 + cz, 6);
        }
        // Entablature ring
        makeCyl(14, 14, 1.2, 0xD4C9B0, -180, 10.6, -60, 8);
        // Entrance steps
        makeBox(8, 0.4, 4, 0xD4C9B0, -180, 0.2, -46);
        makeBox(7, 0.4, 4, 0xD4C9B0, -180, 0.6, -43);
        makeBox(6, 0.4, 4, 0xD4C9B0, -180, 1.0, -40);
        // Front portico columns
        makeCyl(0.6, 0.6, 10, 0xF5F0E8, -183, 5, -38, 6);
        makeCyl(0.6, 0.6, 10, 0xF5F0E8, -177, 5, -38, 6);
        // Portico roof
        makeCone(5, 3, 0xC8B89A, -180, 13, -38, 4);
        // Sign board
        makeBox(6, 1.5, 0.3, 0x8B6914, -180, 8, -37);
    }

    // ---- 2. THE STRAY ----
    // 200-acre greensward common surrounding the town
    function buildTheStray() {
        // North section
        makeBox(300, 0.5, 80, 0x4a7c3f, -50, 0, -120);
        // South section
        makeBox(300, 0.5, 80, 0x4a7c3f, -50, 0, 120);
        // East section
        makeBox(80, 0.5, 200, 0x4a7c3f, 200, 0, 0);
        // West section
        makeBox(80, 0.5, 200, 0x4a7c3f, -280, 0, 0);
        // Stray trees (spheres on cylinders)
        var treePositions = [
            [-60, 0, -100], [-90, 0, -130], [-20, 0, -110],
            [180, 0, -40], [190, 0, 50], [175, 0, 20],
            [-260, 0, -60], [-270, 0, 40], [-255, 0, 10],
            [-30, 0, 100], [-70, 0, 130], [-10, 0, 115]
        ];
        var t;
        for (t = 0; t < treePositions.length; t++) {
            var tp = treePositions[t];
            makeCyl(0.4, 0.5, 5, 0x5C4A2A, tp[0], 2.5, tp[2], 5);
            makeSphere(3.5, 0x2D6A1F, tp[0], 7.5, tp[2], 8, 6);
        }
        // Benches on stray
        makeBox(3, 0.3, 0.8, 0x5C4A2A, 185, 0.5, -20);
        makeBox(3, 0.3, 0.8, 0x5C4A2A, 185, 0.5, 30);
        // Low stone wall border
        makeBox(300, 1.0, 0.8, 0x9E9E8A, -50, 0.5, -80);
        makeBox(300, 1.0, 0.8, 0x9E9E8A, -50, 0.5, 80);
    }

    // ---- 3. BETTY'S CAFE TEA ROOMS ----
    // Famous Swiss-owned Art Nouveau tea room on Parliament Street
    function buildBettyCafe() {
        // Main building body
        makeBox(18, 16, 14, 0xF5F0E8, 0, 8, -30);
        // Upper floor with ornate windows
        makeBox(18, 6, 14, 0xEDE8DC, 0, 19, -30);
        // Roof parapet
        makeBox(20, 1.5, 16, 0xD4C9B0, 0, 22.8, -30);
        // Art Nouveau bay window (projecting)
        makeBox(6, 12, 3, 0xF5F0E8, 0, 7, -37.5);
        makeCyl(3.2, 3.2, 12, 0xEDE8DC, 0, 7, -37.5, 8);
        // Window surrounds (decorative boxes)
        makeBox(4, 6, 0.3, 0xD4C9B0, -5, 8, -37);
        makeBox(4, 6, 0.3, 0xD4C9B0, 5, 8, -37);
        // Ground floor shop front
        makeBox(16, 4, 0.5, 0x2A1A0A, 0, 2, -37);
        // Entrance canopy
        makeBox(8, 0.5, 3, 0x1A3A1A, 0, 5.5, -38.5);
        // Betty's signage
        makeBox(10, 1.8, 0.3, 0x1A3A1A, 0, 9, -37.2);
        // Corner decorative pilasters
        makeCyl(0.5, 0.5, 16, 0xD4C9B0, -9, 8, -23, 6);
        makeCyl(0.5, 0.5, 16, 0xD4C9B0, 9, 8, -23, 6);
    }

    // ---- 4. HARROGATE CONVENTION CENTRE ----
    // Large modern conference and exhibition centre
    function buildConventionCentre() {
        // Main hall - large rectangular block
        makeBox(80, 18, 40, 0xD3D3D3, 100, 9, 60);
        // Secondary wing
        makeBox(40, 14, 30, 0xC8C8C8, 60, 7, 70);
        // Glass atrium front (lighter colour)
        makeBox(20, 18, 5, 0xE8E8E8, 100, 9, 40);
        // Entrance canopy
        makeBox(30, 1, 10, 0xB0B0B0, 100, 19, 38);
        // Entrance columns
        makeCyl(1, 1, 18, 0xD3D3D3, 88, 9, 38, 6);
        makeCyl(1, 1, 18, 0xD3D3D3, 100, 9, 38, 6);
        makeCyl(1, 1, 18, 0xD3D3D3, 112, 9, 38, 6);
        // Loading dock extension
        makeBox(20, 8, 15, 0xBBBBBB, 130, 4, 68);
        // Roof plant room
        makeBox(30, 4, 15, 0xC0C0C0, 100, 20, 60);
        // Parking area indicator (darker ground)
        makeBox(60, 0.6, 40, 0x444444, 100, 0.3, 100);
        // Flag poles
        makeCyl(0.2, 0.2, 12, 0x888888, 86, 6, 38, 4);
        makeCyl(0.2, 0.2, 12, 0x888888, 114, 6, 38, 4);
        // Flags
        makeBox(3, 1.5, 0.1, 0x002147, 87.5, 12, 38);
        makeBox(3, 1.5, 0.1, 0xD52B1E, 115.5, 12, 38);
    }

    // ---- 5. VALLEY GARDENS ----
    // Formal Edwardian gardens with lawns, flower beds, and the Sun Pavilion
    function buildValleyGardens() {
        // Main garden lawns
        makeBox(120, 0.5, 100, 0x4a7c3f, -120, 0, 100);
        // Formal flower bed borders (darker)
        makeBox(20, 0.7, 5, 0x3A6B2F, -100, 0.3, 75);
        makeBox(20, 0.7, 5, 0x3A6B2F, -130, 0.3, 75);
        makeBox(20, 0.7, 5, 0x3A6B2F, -100, 0.3, 125);
        makeBox(20, 0.7, 5, 0x3A6B2F, -130, 0.3, 125);
        // Central fountain basin
        makeCyl(5, 5, 0.8, 0x6699BB, -120, 0.4, 100, 12);
        // Fountain column
        makeCyl(0.5, 0.5, 4, 0xC8C8C8, -120, 2, 100, 6);
        makeSphere(1, 0xC8C8C8, -120, 5, 100, 8, 6);
        // Garden path
        makeBox(4, 0.6, 100, 0xC8B89A, -120, 0.3, 100);
        makeBox(100, 0.6, 4, 0xC8B89A, -120, 0.3, 100);
        // Garden trees
        makeCyl(0.4, 0.5, 6, 0x5C4A2A, -100, 3, 90, 5);
        makeSphere(4, 0x2D6A1F, -100, 8, 90, 8, 6);
        makeCyl(0.4, 0.5, 6, 0x5C4A2A, -140, 3, 90, 5);
        makeSphere(4, 0x2D6A1F, -140, 8, 90, 8, 6);
        makeCyl(0.4, 0.5, 6, 0x5C4A2A, -100, 3, 110, 5);
        makeSphere(4, 0x2D6A1F, -100, 8, 110, 8, 6);
        makeCyl(0.4, 0.5, 6, 0x5C4A2A, -140, 3, 110, 5);
        makeSphere(4, 0x2D6A1F, -140, 8, 110, 8, 6);
        // Garden wall
        makeBox(120, 2, 0.8, 0x9E8060, -120, 1, 55);
        makeBox(0.8, 2, 100, 0x9E8060, -60, 1, 100);
        makeBox(0.8, 2, 100, 0x9E8060, -180, 1, 100);
        // Gate pillars
        makeCyl(1.2, 1.2, 3, 0xC8B89A, -126, 1.5, 55, 6);
        makeCyl(1.2, 1.2, 3, 0xC8B89A, -114, 1.5, 55, 6);
        makeSphere(1.2, 0xC8B89A, -126, 3.5, 55, 6, 5);
        makeSphere(1.2, 0xC8B89A, -114, 3.5, 55, 6, 5);
    }

    // ---- 6. SUN COLONNADE / SUN PAVILION ----
    // Classical colonnade at edge of Valley Gardens, 1930s Art Deco
    function buildSunColonnade() {
        // Main pavilion building
        makeBox(40, 10, 12, 0xD4C9B0, -120, 5, 148);
        // Pavilion roof
        makeBox(42, 1.5, 14, 0xC8B89A, -120, 10.8, 148);
        // Colonnade columns (12 columns along front)
        var col;
        for (col = 0; col < 12; col++) {
            makeCyl(0.7, 0.7, 10, 0xF5F0E8, -100 + col * (-3.6), 5, 142, 6);
        }
        // Colonnade entablature
        makeBox(44, 1.2, 2, 0xD4C9B0, -120, 10.4, 142);
        // Pavilion wings
        makeBox(10, 8, 10, 0xD4C9B0, -145, 4, 148);
        makeBox(10, 8, 10, 0xD4C9B0, -95, 4, 148);
        // Decorative dome on pavilion
        makeSphere(6, 0xD4C9B0, -120, 14, 148, 12, 8);
        // Steps up to colonnade
        makeBox(44, 0.4, 3, 0xC8B89A, -120, 0.2, 140);
        makeBox(42, 0.4, 3, 0xC8B89A, -120, 0.6, 138);
    }

    // ---- 7. TURKISH BATHS ----
    // 1897 Moorish-style baths building with domes and arches
    function buildTurkishBaths() {
        // Main building block
        makeBox(30, 14, 20, 0xC8B89A, -220, 7, -30);
        // Moorish horseshoe arch entrance feature
        makeBox(8, 12, 2, 0xD4C9B0, -220, 6, -40);
        makeSphere(4, 0xC8B89A, -220, 12, -40, 12, 8);
        // Minaret-style towers at corners
        makeCyl(1.5, 2, 14, 0xD4C9B0, -236, 7, -38, 8);
        makeCone(2, 4, 0xC8B89A, -236, 16, -38, 8);
        makeCyl(1.5, 2, 14, 0xD4C9B0, -204, 7, -38, 8);
        makeCone(2, 4, 0xC8B89A, -204, 16, -38, 8);
        makeCyl(1.5, 2, 14, 0xD4C9B0, -236, 7, -22, 8);
        makeCone(2, 4, 0xC8B89A, -236, 16, -22, 8);
        makeCyl(1.5, 2, 14, 0xD4C9B0, -204, 7, -22, 8);
        makeCone(2, 4, 0xC8B89A, -204, 16, -22, 8);
        // Central dome
        makeSphere(7, 0xC8B89A, -220, 16, -30, 12, 8);
        // Decorative band around dome base
        makeCyl(7.2, 7.2, 1, 0xD4C9B0, -220, 9.5, -30, 12);
        // Side bays
        makeBox(8, 10, 18, 0xC8B89A, -232, 5, -30);
        makeBox(8, 10, 18, 0xC8B89A, -208, 5, -30);
        // Ornate window panels
        makeBox(4, 5, 0.5, 0xEEDDCC, -220, 7, -40.3);
        makeBox(3, 4, 0.5, 0xEEDDCC, -228, 6, -40.3);
        makeBox(3, 4, 0.5, 0xEEDDCC, -212, 6, -40.3);
    }

    // ---- 8. PARLIAMENT STREET ----
    // Grand Victorian commercial street - the main spine of town
    function buildParliamentStreet() {
        // Row of Victorian commercial buildings - east side
        var b;
        for (b = 0; b < 6; b++) {
            makeBox(14, 18, 12, 0xF5F0E8, -60 + b * 16, 9, -30);
            // Ornate parapet
            makeBox(15, 2, 13, 0xD4C9B0, -60 + b * 16, 19, -30);
            // Shop front
            makeBox(12, 4, 0.5, 0x222222, -60 + b * 16, 2, -36);
            // First floor windows
            makeBox(3, 3, 0.3, 0xD4C9B0, -60 + b * 16 - 3, 11, -36);
            makeBox(3, 3, 0.3, 0xD4C9B0, -60 + b * 16 + 3, 11, -36);
        }
        // Row of Victorian commercial buildings - west side
        for (b = 0; b < 6; b++) {
            makeBox(14, 16, 12, 0xD4C9B0, -60 + b * 16, 8, 30);
            // Parapet
            makeBox(15, 2, 13, 0xC8B89A, -60 + b * 16, 17, 30);
            // Shop front
            makeBox(12, 4, 0.5, 0x222222, -60 + b * 16, 2, 36);
        }
        // Street lamp posts
        var lamp;
        for (lamp = 0; lamp < 5; lamp++) {
            makeCyl(0.15, 0.2, 7, 0x333333, -50 + lamp * 20, 3.5, -10, 5);
            makeSphere(0.7, 0xFFFF99, -50 + lamp * 20, 7.5, -10, 6, 5);
            makeCyl(0.15, 0.2, 7, 0x333333, -50 + lamp * 20, 3.5, 10, 5);
            makeSphere(0.7, 0xFFFF99, -50 + lamp * 20, 7.5, 10, 6, 5);
        }
        // Victorian drinking fountain
        makeCyl(1, 1.5, 3, 0x777777, 30, 1.5, 0, 8);
        makeCyl(1.5, 1.5, 0.4, 0x888888, 30, 3, 0, 8);
        makeSphere(0.8, 0x999999, 30, 3.6, 0, 6, 5);
    }

    // ---- 9. THE OLD SWAN HOTEL ----
    // Victorian hotel, famous as where Agatha Christie was found in 1926
    function buildOldSwanHotel() {
        // Main hotel building - large Victorian block
        makeBox(40, 22, 25, 0xF5F0E8, 60, 11, -80);
        // Side wing
        makeBox(20, 18, 20, 0xF5F0E8, 88, 9, -80);
        // Mansard roof
        makeBox(42, 5, 27, 0xD4C9B0, 60, 24.5, -80);
        makeCone(21, 8, 0xC8B89A, 60, 31, -80, 4);
        // Grand entrance portico
        makeBox(14, 6, 6, 0xD4C9B0, 60, 3, -93);
        // Portico columns
        makeCyl(0.8, 0.8, 12, 0xF5F0E8, 53, 6, -93, 6);
        makeCyl(0.8, 0.8, 12, 0xF5F0E8, 60, 6, -93, 6);
        makeCyl(0.8, 0.8, 12, 0xF5F0E8, 67, 6, -93, 6);
        // Portico pediment
        makeCone(8, 4, 0xD4C9B0, 60, 16, -93, 4);
        // Hotel sign
        makeBox(14, 2, 0.4, 0x1A1A1A, 60, 8, -92.8);
        // Ground floor windows/bays
        makeBox(6, 5, 2, 0xEEE8D5, 48, 6, -93);
        makeBox(6, 5, 2, 0xEEE8D5, 72, 6, -93);
        // Chimney stacks
        makeCyl(1, 1, 5, 0xBBAA99, 50, 27, -80, 4);
        makeCyl(1, 1, 5, 0xBBAA99, 70, 27, -80, 4);
        makeCyl(1, 1, 5, 0xBBAA99, 85, 23, -78, 4);
        // Landscaped forecourt
        makeBox(30, 0.6, 12, 0x7a9c6a, 60, 0.3, -98);
        makeCyl(0.4, 0.5, 5, 0x5C4A2A, 52, 2.5, -100, 5);
        makeSphere(3, 0x2D6A1F, 52, 6.5, -100, 8, 6);
        makeCyl(0.4, 0.5, 5, 0x5C4A2A, 68, 2.5, -100, 5);
        makeSphere(3, 0x2D6A1F, 68, 6.5, -100, 8, 6);
    }

    // ---- 10. MERCER ART GALLERY ----
    // 1806 neoclassical building, originally the Promenade Room
    function buildMercerGallery() {
        // Main neoclassical body
        makeBox(28, 14, 16, 0xD4C9B0, -150, 7, -60);
        // Pediment triangular gable
        makeCone(16, 6, 0xC8B89A, -150, 18, -68, 4);
        // Cornice
        makeBox(30, 1.5, 18, 0xC8B89A, -150, 14.8, -60);
        // Classical columns - grand hexastyle portico
        var col2;
        for (col2 = 0; col2 < 6; col2++) {
            makeCyl(0.8, 0.8, 14, 0xF5F0E8, -163 + col2 * 5.2, 7, -68, 6);
            // Column capitals
            makeCyl(1.1, 0.8, 0.8, 0xEEE8D5, -163 + col2 * 5.2, 14.4, -68, 6);
            // Column bases
            makeCyl(1.1, 1.1, 0.6, 0xEEE8D5, -163 + col2 * 5.2, 0.3, -68, 6);
        }
        // Entablature
        makeBox(32, 2, 3, 0xD4C9B0, -150, 15.3, -68);
        // Steps
        makeBox(20, 0.5, 4, 0xC8B89A, -150, 0.25, -70);
        makeBox(18, 0.5, 4, 0xC8B89A, -150, 0.75, -72);
        // Entrance door
        makeBox(4, 7, 0.4, 0x2A1A0A, -150, 3.5, -68.2);
        // Gallery name plaque
        makeBox(8, 1.5, 0.4, 0xB8A070, -150, 8, -68.2);
        // Side windows (decorative)
        makeBox(3, 5, 0.5, 0xD4C9B0, -163, 8, -60);
        makeBox(3, 5, 0.5, 0xD4C9B0, -137, 8, -60);
    }

    // ---- 11. CRIMPLE VIADUCT ----
    // 1848 Victorian railway viaduct, 31 arches, 110 feet high
    function buildCrimpleViaduct() {
        // Main deck span
        makeBox(200, 4, 8, 0xC8B89A, 250, 30, -200);
        // Parapet walls
        makeBox(200, 2, 1, 0xBBAA99, 250, 33, -196);
        makeBox(200, 2, 1, 0xBBAA99, 250, 33, -204);
        // Viaduct piers (11 piers for the visible section)
        var pier;
        for (pier = 0; pier < 11; pier++) {
            var px = 155 + pier * 20;
            // Main pier shaft - tapers slightly
            makeCyl(3, 3.5, 30, 0xC8B89A, px, 15, -200, 6);
            // Pier cap
            makeBox(9, 2, 12, 0xBBAA99, px, 31, -200);
            // Arch voussoirs (simplified as thinner box between piers)
            if (pier < 10) {
                makeBox(14, 3, 6, 0xBBAA99, px + 10, 18, -200);
                // Arch springer stones
                makeCyl(2, 3, 4, 0xC8B89A, px + 4, 16, -200, 5);
                makeCyl(2, 3, 4, 0xC8B89A, px + 16, 16, -200, 5);
            }
        }
        // Embankment approaches
        makeBox(30, 15, 20, 0x6B5A3E, 145, 7.5, -200);
        makeBox(30, 15, 20, 0x6B5A3E, 365, 7.5, -200);
        // Abutment walls
        makeBox(8, 32, 12, 0xC8B89A, 150, 16, -200);
        makeBox(8, 32, 12, 0xC8B89A, 350, 16, -200);
        // River/valley floor below
        makeBox(200, 0.6, 40, 0x5577AA, 250, 0.3, -200);
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
