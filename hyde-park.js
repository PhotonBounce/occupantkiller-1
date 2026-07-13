window.HydePark = (function() {
    'use strict';

    var OX = 4760;
    var OZ = 2200;
    var scene = null;
    var objects = [];
    var boats = [];
    var boatData = [];
    var clock = 0;

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildGround() {
        makeBox(300, 0.5, 300, 0x4A7C3F, 0, -0.25, 0);
    }

    function buildSerpentine() {
        // Water surface
        makeBox(60, 0.4, 15, 0x4169E1, -30, 0.2, -20);
        // Boat ramp / shore detail
        makeBox(62, 0.3, 1, 0x8B7355, -30, 0.15, -12.5);
        makeBox(62, 0.3, 1, 0x8B7355, -30, 0.15, -27.5);

        // Rowing boats on the lake
        var boatPositions = [
            [-50, -16],
            [-40, -22],
            [-25, -18],
            [-15, -24],
            [-5, -17],
            [5, -21]
        ];
        for (var i = 0; i < boatPositions.length; i++) {
            var bx = boatPositions[i][0];
            var bz = boatPositions[i][1];
            var hull = makeBox(3, 0.6, 1.4, 0x8B4513, bx, 0.7, bz);
            var seat = makeBox(1.5, 0.2, 1.0, 0xA0522D, bx, 1.1, bz);
            boats.push(hull);
            boats.push(seat);
            boatData.push({ mesh: hull, seat: seat, baseX: OX + bx, baseZ: OZ + bz, phase: i * 1.1, speed: 0.12 + i * 0.02 });
        }
    }

    function buildSpeakersCorner() {
        // NE corner of park, offset ~(+80, 0, -80)
        var scx = 80;
        var scz = -80;
        // Grass area
        makeBox(30, 0.3, 30, 0x228B22, scx, 0.15, scz);
        // Soapbox podiums
        makeBox(2, 1.2, 2, 0xA0522D, scx - 8, 0.6, scz);
        makeBox(2, 1.2, 2, 0xA0522D, scx, 0.6, scz - 4);
        makeBox(2, 1.2, 2, 0xA0522D, scx + 7, 0.6, scz + 3);
        // Speaker figures on podiums
        makeBox(0.6, 1.8, 0.6, 0x2F4F4F, scx - 8, 2.1, scz);
        makeBox(0.6, 1.8, 0.6, 0x2F4F4F, scx, 2.1, scz - 4);
        makeBox(0.6, 1.8, 0.6, 0x8B0000, scx + 7, 2.1, scz + 3);
        // Crowd figures
        var crowdOffsets = [
            [-5, 5], [-3, 6], [-1, 5], [1, 6], [3, 5],
            [-6, 8], [-4, 8], [-2, 8], [0, 8], [2, 8], [4, 8],
            [-5, 10], [-2, 10], [1, 10], [4, 10]
        ];
        for (var i = 0; i < crowdOffsets.length; i++) {
            makeBox(0.5, 1.6, 0.5, 0x556B2F, scx + crowdOffsets[i][0], 0.8, scz + crowdOffsets[i][1]);
        }
        // Low fence around area
        makeBox(30, 0.8, 0.3, 0x8B7355, scx, 0.4, scz - 15);
        makeBox(30, 0.8, 0.3, 0x8B7355, scx, 0.4, scz + 15);
        makeBox(0.3, 0.8, 30, 0x8B7355, scx - 15, 0.4, scz);
        makeBox(0.3, 0.8, 30, 0x8B7355, scx + 15, 0.4, scz);
    }

    function buildRoyalAlbertHall() {
        // South side of Hyde Park / Kensington Gardens
        var rahx = 20;
        var rahz = 60;
        // Main cylindrical body
        makeCyl(14, 14, 8, 20, 0x8B3A3A, rahx, 4, rahz);
        // Ornamental frieze band
        makeCyl(14.3, 14.3, 1.2, 20, 0xCC9966, rahx, 8.6, rahz);
        // Glass dome
        makeSphere(10, 16, 10, 0x87CEEB, rahx, 12, rahz);
        // Entrance porch boxes
        makeBox(6, 5, 3, 0x7A3030, rahx, 2.5, rahz - 14);
        makeBox(6, 5, 3, 0x7A3030, rahx, 2.5, rahz + 14);
        makeBox(3, 5, 6, 0x7A3030, rahx - 14, 2.5, rahz);
        makeBox(3, 5, 6, 0x7A3030, rahx + 14, 2.5, rahz);
        // Steps
        makeBox(8, 0.5, 2, 0xC8B8A2, rahx, 0.25, rahz - 16);
        makeBox(8, 0.5, 2, 0xC8B8A2, rahx, 0.75, rahz - 17.5);
    }

    function buildAlbertMemorial() {
        // Faces Royal Albert Hall from the north
        var amx = 20;
        var amz = 30;
        // Base plinth
        makeBox(12, 1.5, 12, 0xD4C5A9, amx, 0.75, amz);
        // Steps up
        makeBox(10, 0.6, 10, 0xC8B8A2, amx, 1.8, amz);
        makeBox(8, 0.6, 8, 0xBBAA90, amx, 2.7, amz);
        // Gothic canopy structure
        makeBox(6, 12, 6, 0x4A4A4A, amx, 9, amz);
        // Inner Albert figure (seated)
        makeBox(1.2, 2.2, 1.2, 0xFFD700, amx, 5.5, amz);
        makeBox(2.0, 0.5, 1.8, 0xFFD700, amx, 4.5, amz);
        // Spire
        makeCone(2.5, 8, 4, 0x4A4A4A, amx, 19, amz);
        // Corner canopy posts
        makeBox(0.5, 10, 0.5, 0x5A5A5A, amx - 3, 8, amz - 3);
        makeBox(0.5, 10, 0.5, 0x5A5A5A, amx + 3, 8, amz - 3);
        makeBox(0.5, 10, 0.5, 0x5A5A5A, amx - 3, 8, amz + 3);
        makeBox(0.5, 10, 0.5, 0x5A5A5A, amx + 3, 8, amz + 3);
        // Corner statues
        makeBox(1, 2, 1, 0xC8B89A, amx - 6, 2.5, amz - 6);
        makeBox(1, 2, 1, 0xC8B89A, amx + 6, 2.5, amz - 6);
        makeBox(1, 2, 1, 0xC8B89A, amx - 6, 2.5, amz + 6);
        makeBox(1, 2, 1, 0xC8B89A, amx + 6, 2.5, amz + 6);
        // Canopy arched sides
        makeBox(5, 0.4, 0.3, 0x3A3A3A, amx, 14, amz - 3);
        makeBox(5, 0.4, 0.3, 0x3A3A3A, amx, 14, amz + 3);
        makeBox(0.3, 0.4, 5, 0x3A3A3A, amx - 3, 14, amz);
        makeBox(0.3, 0.4, 5, 0x3A3A3A, amx + 3, 14, amz);
    }

    function buildKensingtonPalace() {
        // West side of Kensington Gardens
        var kpx = -80;
        var kpz = 20;
        // Main palace body
        makeBox(28, 10, 8, 0x8B3A3A, kpx, 5, kpz);
        // Wings
        makeBox(8, 7, 6, 0x7A3030, kpx - 18, 3.5, kpz);
        makeBox(8, 7, 6, 0x7A3030, kpx + 18, 3.5, kpz);
        // Roofline detail
        makeBox(28, 1, 8, 0x6A2828, kpx, 10.5, kpz);
        // Windows (box insets on facade)
        for (var wi = -10; wi <= 10; wi += 4) {
            makeBox(1.2, 1.8, 0.2, 0x87CEEB, kpx + wi, 5, kpz - 4.1);
        }
        // Sunken garden hedge boxes
        makeBox(20, 1.2, 0.6, 0x2E6B2E, kpx, 0.6, kpz + 10);
        makeBox(20, 1.2, 0.6, 0x2E6B2E, kpx, 0.6, kpz + 22);
        makeBox(0.6, 1.2, 12, 0x2E6B2E, kpx - 10, 0.6, kpz + 16);
        makeBox(0.6, 1.2, 12, 0x2E6B2E, kpx + 10, 0.6, kpz + 16);
        // Inner hedge patterns
        makeBox(8, 0.8, 0.4, 0x3A7A3A, kpx - 4, 0.4, kpz + 14);
        makeBox(8, 0.8, 0.4, 0x3A7A3A, kpx - 4, 0.4, kpz + 18);
        makeBox(0.4, 0.8, 4, 0x3A7A3A, kpx - 8, 0.4, kpz + 16);
        makeBox(0.4, 0.8, 4, 0x3A7A3A, kpx, 0.4, kpz + 16);
        makeBox(8, 0.8, 0.4, 0x3A7A3A, kpx + 6, 0.4, kpz + 14);
        makeBox(8, 0.8, 0.4, 0x3A7A3A, kpx + 6, 0.4, kpz + 18);
        // Ornamental pond
        makeBox(8, 0.3, 6, 0x4169E1, kpx, 0.15, kpz + 16);
        // Entrance gate posts
        makeBox(0.8, 4, 0.8, 0xC8C8C8, kpx - 3, 2, kpz - 5);
        makeBox(0.8, 4, 0.8, 0xC8C8C8, kpx + 3, 2, kpz - 5);
    }

    function buildVandAMuseum() {
        // South Kensington, south of Hyde Park
        var vax = 30;
        var vaz = 120;
        // Main complex body
        makeBox(40, 10, 20, 0xCC5500, vax, 5, vaz);
        // Side wings
        makeBox(10, 8, 8, 0xBB4E00, vax - 25, 4, vaz);
        makeBox(10, 8, 8, 0xBB4E00, vax + 25, 4, vaz);
        // Central tower cylinder
        makeCyl(4, 4, 14, 8, 0xCC5500, vax, 12, vaz);
        // Tower spire cone
        makeCone(4, 6, 8, 0x884400, vax, 21, vaz);
        // Facade detail boxes (arched windows)
        for (var fi = -14; fi <= 14; fi += 4) {
            makeBox(1.5, 3, 0.3, 0xD4722A, vax + fi, 5, vaz - 10.2);
        }
        // Roofline parapet
        makeBox(40, 1.5, 1, 0xAA4400, vax, 10.75, vaz - 10);
        makeBox(40, 1.5, 1, 0xAA4400, vax, 10.75, vaz + 10);
        // Entrance steps
        makeBox(12, 0.5, 2, 0xC8B8A2, vax, 0.25, vaz - 11);
        makeBox(12, 0.5, 2, 0xC8B8A2, vax, 0.75, vaz - 12.5);
    }

    function buildScienceMuseum() {
        // Adjacent to V&A
        var smx = -40;
        var smz = 120;
        // Main building body
        makeBox(30, 12, 8, 0xE8E8E8, smx, 6, smz);
        // Upper setback
        makeBox(26, 4, 6, 0xD8D8D8, smx, 14, smz);
        // Entrance canopy
        makeBox(10, 3, 3, 0xC8C8C8, smx, 1.5, smz - 5.5);
        // Window details
        for (var si = -10; si <= 10; si += 5) {
            makeBox(2.5, 3.5, 0.2, 0x87CEEB, smx + si, 6, smz - 4.1);
            makeBox(2.5, 3.5, 0.2, 0x87CEEB, smx + si, 10.5, smz - 4.1);
        }
        // Side detail bands
        makeBox(30, 0.6, 8, 0xD0D0D0, smx, 4, smz);
        makeBox(30, 0.6, 8, 0xD0D0D0, smx, 8, smz);
    }

    function buildNaturalHistoryMuseum() {
        // South Kensington, west of V&A
        var nhx = -60;
        var nhz = 110;
        // Main Romanesque body
        makeBox(40, 16, 10, 0xCC6633, nhx, 8, nhz);
        // Central front gable
        makeBox(14, 3, 0.5, 0xBB5522, nhx, 18, nhz - 5);
        // Twin octagonal towers (front)
        makeCyl(2.5, 2.5, 20, 8, 0xCC6633, nhx - 18, 10, nhz - 5);
        makeCyl(2.5, 2.5, 20, 8, 0xCC6633, nhx + 18, 10, nhz - 5);
        // Tower cone caps
        makeCone(3, 5, 8, 0xAA5522, nhx - 18, 22.5, nhz - 5);
        makeCone(3, 5, 8, 0xAA5522, nhx + 18, 22.5, nhz - 5);
        // Rear towers (smaller)
        makeCyl(1.8, 1.8, 14, 8, 0xCC6633, nhx - 18, 7, nhz + 5);
        makeCyl(1.8, 1.8, 14, 8, 0xCC6633, nhx + 18, 7, nhz + 5);
        makeCone(2, 4, 8, 0xAA5522, nhx - 18, 16, nhz + 5);
        makeCone(2, 4, 8, 0xAA5522, nhx + 18, 16, nhz + 5);
        // Arched facade detail boxes
        for (var ni = -14; ni <= 14; ni += 4) {
            makeBox(1.8, 3.5, 0.4, 0xDD7744, nhx + ni, 5, nhz - 5.2);
            makeBox(1.8, 3, 0.4, 0xDD7744, nhx + ni, 12, nhz - 5.2);
        }
        // Ornamental band
        makeBox(40, 0.8, 10, 0xBB5533, nhx, 7, nhz);
        makeBox(40, 0.8, 10, 0xBB5533, nhx, 14, nhz);
        // Entrance steps
        makeBox(16, 0.5, 2, 0xC8B8A2, nhx, 0.25, nhz - 6);
        makeBox(16, 0.5, 2, 0xC8B8A2, nhx, 0.75, nhz - 7.5);
        // Entrance porch
        makeBox(8, 6, 3, 0xBB5522, nhx, 3, nhz - 6.5);
    }

    function buildMarbleArch() {
        // NE corner of Hyde Park
        var max = 90;
        var maz = -90;
        // Main arch structure
        makeBox(10, 8, 3, 0xFFFFFF, max, 4, maz);
        // Arch opening cutout effect — two side piers
        makeBox(2.5, 8, 3, 0xFFFFFF, max - 3.75, 4, maz);
        makeBox(2.5, 8, 3, 0xFFFFFF, max + 3.75, 4, maz);
        // Arch lintel
        makeBox(10, 1.5, 3, 0xFFFFFF, max, 8.75, maz);
        // Attic storey
        makeBox(10, 2.5, 3, 0xF5F5F5, max, 10.25, maz);
        // Attic cornice
        makeBox(11, 0.5, 3.5, 0xFFFFFF, max, 11.75, maz);
        // Side passage arches (pedestrian)
        makeBox(2, 5, 3, 0xF0F0F0, max - 7, 2.5, maz);
        makeBox(2, 5, 3, 0xF0F0F0, max + 7, 2.5, maz);
        makeBox(2, 0.8, 3, 0xEEEEEE, max - 7, 5.4, maz);
        makeBox(2, 0.8, 3, 0xEEEEEE, max + 7, 5.4, maz);
        // Decorative frieze
        makeBox(10, 0.5, 0.4, 0xE8E8E8, max, 7.25, maz - 1.5);
        makeBox(10, 0.5, 0.4, 0xE8E8E8, max, 7.25, maz + 1.5);
    }

    function buildRottenRow() {
        // Famous sandy riding track running through Hyde Park
        // Runs roughly east-west through the middle of the park
        makeBox(60, 0.3, 4, 0xD2B48C, 0, 0.15, 0);
        // Edge kerb lines
        makeBox(60, 0.2, 0.3, 0xC8A882, 0, 0.35, -2);
        makeBox(60, 0.2, 0.3, 0xC8A882, 0, 0.35, 2);
    }

    function buildParkTrees() {
        var treePositions = [
            [-60, -50], [-55, -60], [-40, -55], [40, -50], [50, -60],
            [60, -40], [-70, 0], [-65, 10], [70, 0], [65, 10],
            [-50, 50], [-45, 60], [50, 50], [45, 60],
            [-20, -60], [-10, -65], [10, -60], [20, -65],
            [-30, 30], [-20, 35], [30, 30], [25, 40],
            [0, -40], [5, -50], [-5, -45]
        ];
        for (var i = 0; i < treePositions.length; i++) {
            var tx = treePositions[i][0];
            var tz = treePositions[i][1];
            // Trunk
            makeCyl(0.3, 0.4, 4, 6, 0x5C3317, tx, 2, tz);
            // Canopy
            makeSphere(2.5, 7, 6, 0x2D6A2D, tx, 6, tz);
        }
    }

    function buildPaths() {
        // Main diagonal path
        makeBox(3, 0.2, 80, 0xC8B8A2, -20, 0.1, 10);
        // Cross path
        makeBox(80, 0.2, 3, 0xC8B8A2, 10, 0.1, -10);
        // Path around Serpentine
        makeBox(65, 0.2, 2, 0xC8B8A2, -30, 0.1, -9);
        makeBox(65, 0.2, 2, 0xC8B8A2, -30, 0.1, -29);
    }

    function buildStreetLights() {
        var lightPositions = [
            [-20, -40], [-20, -20], [-20, 0], [-20, 20],
            [10, -50], [10, -30], [10, -10], [10, 10]
        ];
        for (var i = 0; i < lightPositions.length; i++) {
            var lx = lightPositions[i][0];
            var lz = lightPositions[i][1];
            // Post
            makeCyl(0.1, 0.12, 6, 5, 0x2C2C2C, lx, 3, lz);
            // Lamp head
            makeBox(0.5, 0.3, 0.5, 0xFFFFAA, lx, 6.15, lz);
        }
    }

    function init(sceneRef) {
        scene = sceneRef;
        objects = [];
        boats = [];
        boatData = [];
        clock = 0;

        buildGround();
        buildSerpentine();
        buildSpeakersCorner();
        buildRoyalAlbertHall();
        buildAlbertMemorial();
        buildKensingtonPalace();
        buildVandAMuseum();
        buildScienceMuseum();
        buildNaturalHistoryMuseum();
        buildMarbleArch();
        buildRottenRow();
        buildParkTrees();
        buildPaths();
        buildStreetLights();
    }

    function update(delta) {
        clock += delta;
        for (var i = 0; i < boatData.length; i++) {
            var bd = boatData[i];
            var driftX = Math.sin(clock * bd.speed + bd.phase) * 4;
            var driftZ = Math.cos(clock * bd.speed * 0.7 + bd.phase) * 1.5;
            bd.mesh.position.x = bd.baseX + driftX;
            bd.mesh.position.z = bd.baseZ + driftZ;
            if (bd.seat) {
                bd.seat.position.x = bd.baseX + driftX;
                bd.seat.position.z = bd.baseZ + driftZ;
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].parent) {
                objects[i].parent.remove(objects[i]);
            }
            if (objects[i].geometry) { objects[i].geometry.dispose(); }
            if (objects[i].material) { objects[i].material.dispose(); }
        }
        objects = [];
        boats = [];
        boatData = [];
        scene = null;
        clock = 0;
    }

    return { init: init, update: update, reset: reset };

}());
