window.WinchesterKeep = (function() {
    'use strict';

    var scene = null;
    var objects = [];
    var BASE_X = 3960;
    var BASE_Z = 2200;

    function makebox(w, h, d, color, ox, oy, oz) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + ox, oy, BASE_Z + oz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, ox, oy, oz) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + ox, oy, BASE_Z + oz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, ox, oy, oz) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + ox, oy, BASE_Z + oz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, ox, oy, oz) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + ox, oy, BASE_Z + oz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildcathedral() {
        // Main nave — longest medieval cathedral in Europe
        makebox(50, 8, 12, 0xB0B0B0, 0, 4, -60);
        // Central tower
        makebox(6, 14, 6, 0xB0B0B0, 0, 7, -60);
        // West facade
        makebox(14, 10, 3, 0xB0B0B0, -24, 5, -60);
        // East end apse — rounded using cylinder
        makecylinder(5, 5, 8, 8, 0xB0B0B0, 26, 4, -60);
        // North transept
        makebox(8, 7, 12, 0xB0B0B0, 0, 3.5, -50);
        // South transept
        makebox(8, 7, 12, 0xB0B0B0, 0, 3.5, -70);
        // Roof ridge — long box on top
        makebox(50, 1, 3, 0x909090, 0, 8.5, -60);
        // Tower top cone / spire stub
        makecone(3, 5, 8, 0x808080, 0, 16.5, -60);
        // West towers (two)
        makebox(3, 12, 3, 0xB0B0B0, -20, 6, -60);
        makebox(3, 12, 3, 0xB0B0B0, 20, 6, -60);
    }

    function buildgreathall() {
        // Great Hall — only remaining part of Winchester Castle
        makebox(20, 8, 10, 0x696969, -80, 4, 20);
        // Round Table display — mounted on wall as vertical disk (flattened box)
        makebox(6, 6, 0.4, 0x8B4513, -90, 5, 20);
        // Inner Round Table rings
        makebox(4, 4, 0.5, 0xA0522D, -90, 5, 20);
        // Hall roof
        makebox(22, 2, 12, 0x505050, -80, 8.5, 20);
        // Entrance porch
        makebox(4, 6, 4, 0x696969, -69, 3, 20);
        // Buttresses left
        makebox(2, 8, 2, 0x5A5A5A, -75, 4, 26);
        makebox(2, 8, 2, 0x5A5A5A, -85, 4, 26);
        // Buttresses right
        makebox(2, 8, 2, 0x5A5A5A, -75, 4, 14);
        makebox(2, 8, 2, 0x5A5A5A, -85, 4, 14);
    }

    function buildcastlekeep() {
        // Winchester Castle keep — ruined L-shaped walls
        // North wall
        makebox(22, 6, 2, 0x555555, -80, 3, -10);
        // West wall
        makebox(2, 6, 18, 0x555555, -91, 3, -1);
        // Partial east wall stub
        makebox(2, 6, 8, 0x555555, -69, 3, -6);
        // Corner tower — ruined cylinder
        makecylinder(2, 2, 7, 8, 0x555555, -91, 3.5, -10);
        // Rubble piles — low boxes
        makebox(4, 1, 3, 0x555555, -78, 0.5, -8);
        makebox(3, 0.8, 2, 0x555555, -83, 0.4, -5);
        makebox(5, 1.2, 4, 0x555555, -75, 0.6, -12);
    }

    function builditchen() {
        // River Itchen — water strip running through town
        makebox(60, 0.3, 4, 0x4169E1, 30, 0.15, 0);
        // Shallow banks — slightly lighter
        makebox(60, 0.2, 1, 0x5080CC, 30, 0.1, 2.5);
        makebox(60, 0.2, 1, 0x5080CC, 30, 0.1, -2.5);
        // City Bridge over river
        makebox(6, 0.5, 6, 0x999999, 30, 0.4, 0);
    }

    function buildcitycross() {
        // City Cross / Buttercross — Gothic monument in town center
        // Base platform
        makebox(2, 0.5, 2, 0xFFF8DC, -10, 0.25, 10);
        // Lower plinth
        makebox(1.6, 1, 1.6, 0xFFF8DC, -10, 1, 10);
        // Column shaft
        makebox(0.5, 5, 0.5, 0xFFF8DC, -10, 3.5, 10);
        // Capital
        makebox(1, 0.6, 1, 0xFFF8DC, -10, 6.3, 10);
        // Cross vertical bar
        makebox(0.3, 3, 0.3, 0xFFF8DC, -10, 8.5, 10);
        // Cross horizontal bar
        makebox(2, 0.3, 0.3, 0xFFF8DC, -10, 9.5, 10);
        // Gothic canopy
        makebox(1.5, 0.4, 1.5, 0xFFF8DC, -10, 7, 10);
        // Finial cone
        makecone(0.3, 1, 6, 0xFFF8DC, -10, 10.5, 10);
    }

    function buildalfredstatue() {
        // King Alfred statue on Broadway
        // Plinth
        makebox(3, 2, 3, 0x808080, 10, 1, 15);
        // Figure torso
        makebox(1.2, 3, 0.8, 0x8B7355, 10, 4.5, 15);
        // Figure head — sphere
        makesphere(0.6, 8, 8, 0x8B7355, 10, 6.6, 15);
        // Arms
        makebox(2.5, 0.4, 0.4, 0x8B7355, 10, 5, 15);
        // Shield
        makebox(0.8, 1.5, 0.15, 0x8B6914, 11.2, 4.5, 15);
        // Sword upright
        makebox(0.15, 2.5, 0.15, 0xC0C0C0, 9, 6, 15);
    }

    function buildbrooks() {
        // The Brooks — modern shopping building, flat roof
        makebox(25, 6, 15, 0x808080, 20, 3, 40);
        // Flat roof
        makebox(25, 0.4, 15, 0x707070, 20, 6.2, 40);
        // Entrance canopy
        makebox(8, 1, 3, 0x909090, 20, 3, 32);
        // Modern glass facade strips
        makebox(25, 3, 0.3, 0x9DB8CC, 20, 4, 32.3);
        // Upper strip windows
        makebox(20, 1, 0.3, 0xB8D0E0, 20, 5.5, 32.3);
    }

    function buildhydeabbey() {
        // Hyde Abbey ruins — where Alfred the Great was originally buried
        // Foundation walls — low thick boxes
        makebox(18, 1, 2, 0x8B7355, -30, 0.5, -90);
        makebox(18, 1, 2, 0x8B7355, -30, 0.5, -74);
        makebox(2, 1, 18, 0x8B7355, -39, 0.5, -82);
        makebox(2, 1, 18, 0x8B7355, -21, 0.5, -82);
        // Partial standing wall
        makebox(8, 4, 1.5, 0x7A6545, -34, 2, -90);
        // Rubble
        makebox(5, 0.8, 4, 0x8B7355, -26, 0.4, -86);
        makebox(3, 0.6, 3, 0x7A6545, -33, 0.3, -80);
        // Cross marker — Alfred memorial
        makebox(0.4, 3, 0.4, 0x8B7355, -30, 1.5, -82);
        makebox(2, 0.4, 0.4, 0x8B7355, -30, 2.5, -82);
        // Interpretive signpost stub
        makebox(0.2, 2, 0.2, 0x654321, -25, 1, -86);
    }

    function buildwinchestercollege() {
        // Winchester College — oldest school in England (1382)
        // Main hall
        makebox(16, 7, 10, 0xD2B48C, 60, 3.5, -40);
        // Chapel
        makebox(8, 9, 6, 0xD2B48C, 74, 4.5, -38);
        // Chapel tower
        makebox(4, 13, 4, 0xD2B48C, 74, 6.5, -38);
        // Chapel spire
        makecone(1.5, 5, 6, 0xC4A882, 74, 15.5, -38);
        // Cloisters — two wings
        makebox(14, 4, 2, 0xD2B48C, 60, 2, -46);
        makebox(2, 4, 10, 0xD2B48C, 53, 2, -41);
        // School courtyard wall
        makebox(20, 3, 1, 0xC4A882, 60, 1.5, -33);
        // Meads gate
        makebox(3, 5, 1.5, 0xD2B48C, 60, 2.5, -33);
        // Scholars accommodation
        makebox(10, 5, 8, 0xD2B48C, 68, 2.5, -48);
        // Library block
        makebox(8, 5, 6, 0xD2B48C, 52, 2.5, -38);
        // Roof details
        makebox(16, 1, 10, 0xBC9A7A, 60, 7.5, -40);
        makebox(8, 1, 6, 0xBC9A7A, 74, 9.5, -38);
    }

    function buildwatermeadows() {
        // Water meadows along River Itchen — flat green ground patches
        makebox(20, 0.2, 12, 0x90EE90, 50, 0.1, 0);
        makebox(18, 0.2, 10, 0x90EE90, 52, 0.1, -14);
        makebox(22, 0.2, 8, 0x90EE90, 48, 0.1, 10);
        makebox(15, 0.2, 14, 0x90EE90, 65, 0.1, -4);
        makebox(12, 0.2, 10, 0x90EE90, 40, 0.1, 18);
        // Rushes / reeds — small cylinders
        makecylinder(0.15, 0.15, 1.5, 5, 0x556B2F, 50, 0.75, 3);
        makecylinder(0.15, 0.15, 1.2, 5, 0x556B2F, 53, 0.6, -2);
        makecylinder(0.15, 0.15, 1.8, 5, 0x556B2F, 47, 0.9, 5);
        makecylinder(0.15, 0.15, 1.4, 5, 0x556B2F, 55, 0.7, 1);
        // Mill building
        makebox(6, 7, 5, 0xA0856A, 64, 3.5, 4);
        // Mill roof
        makecone(3.5, 4, 4, 0x7A6050, 64, 9, 4);
        // Mill wheel — cylinder on side
        makecylinder(2.5, 2.5, 0.6, 12, 0x8B6914, 61, 2.5, 4);
        // Millpond
        makebox(10, 0.2, 8, 0x4169E1, 70, 0.1, 4);
        // Footbridge over mill stream
        makebox(8, 0.4, 1.5, 0x8B7355, 57, 0.3, 6);
    }

    function buildgroundplane() {
        // Cobbled high street ground
        makebox(80, 0.3, 60, 0xC8B89A, -10, 0.05, 10);
        // Cathedral close ground
        makebox(60, 0.2, 40, 0x8FBC8F, 0, 0.02, -60);
        // Castle grounds
        makebox(30, 0.2, 30, 0x7A8A6A, -80, 0.02, 10);
        // Broadway area
        makebox(20, 0.2, 20, 0xC0A870, 10, 0.02, 18);
        // College grounds
        makebox(40, 0.2, 30, 0x7A9A6A, 60, 0.02, -42);
        // Abbey grounds
        makebox(30, 0.2, 25, 0x7A8060, -30, 0.02, -82);
    }

    function buildstreetfurniture() {
        // Medieval market stalls — small boxes along high street
        makebox(3, 2, 2, 0xD2691E, -5, 1, 5);
        makebox(3, 2, 2, 0xCC5500, 0, 1, 5);
        makebox(3, 2, 2, 0xB8860B, 5, 1, 5);
        // Stall canopy tops
        makebox(3.2, 0.2, 2.2, 0x8B4513, -5, 2.1, 5);
        makebox(3.2, 0.2, 2.2, 0x8B0000, 0, 2.1, 5);
        makebox(3.2, 0.2, 2.2, 0x8B6914, 5, 2.1, 5);
        // Town wall remnant
        makebox(30, 5, 2, 0x696969, -50, 2.5, -20);
        makebox(2, 5, 20, 0x696969, -65, 2.5, -10);
        // Gate tower
        makebox(6, 8, 6, 0x696969, -65, 4, -20);
        makecone(3, 4, 6, 0x555555, -65, 10, -20);
        // Wellhouse in square
        makecylinder(1, 1, 1, 10, 0x999999, -15, 0.5, 5);
        makecylinder(0.1, 0.1, 2, 6, 0x654321, -14, 1.5, 5);
        makecylinder(0.1, 0.1, 2, 6, 0x654321, -16, 1.5, 5);
        makebox(2.4, 0.2, 0.2, 0x654321, -15, 2.5, 5);
    }

    function init(sceneref) {
        scene = sceneref;
        objects = [];

        buildgroundplane();
        buildcathedral();
        buildgreathall();
        buildcastlekeep();
        builditchen();
        buildcitycross();
        buildalfredstatue();
        buildbrooks();
        buildhydeabbey();
        buildwinchestercollege();
        buildwatermeadows();
        buildstreetfurniture();
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
        scene = null;
    }

    return { init: init, update: update, reset: reset };

}());
