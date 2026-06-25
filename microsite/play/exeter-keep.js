window.ExeterKeep = (function() {
    'use strict';

    var WORLD_X = 3610;
    var WORLD_Z = 2200;

    function makeMesh(geometry, color) {
        var material = new THREE.MeshLambertMaterial({ color: color });
        return new THREE.Mesh(geometry, material);
    }

    function addBox(scene, w, h, d, color, x, y, z) {
        var mesh = makeMesh(new THREE.BoxGeometry(w, h, d), color);
        mesh.position.set(WORLD_X + x, y, WORLD_Z + z);
        scene.add(mesh);
        return mesh;
    }

    function addCylinder(scene, rt, rb, h, segs, color, x, y, z) {
        var mesh = makeMesh(new THREE.CylinderGeometry(rt, rb, h, segs), color);
        mesh.position.set(WORLD_X + x, y, WORLD_Z + z);
        scene.add(mesh);
        return mesh;
    }

    function addSphere(scene, r, ws, hs, color, x, y, z) {
        var mesh = makeMesh(new THREE.SphereGeometry(r, ws, hs), color);
        mesh.position.set(WORLD_X + x, y, WORLD_Z + z);
        scene.add(mesh);
        return mesh;
    }

    function addCone(scene, r, h, segs, color, x, y, z) {
        var mesh = makeMesh(new THREE.ConeGeometry(r, h, segs), color);
        mesh.position.set(WORLD_X + x, y, WORLD_Z + z);
        scene.add(mesh);
        return mesh;
    }

    function buildCathedral(scene) {
        // Main nave — longest uninterrupted Gothic vault in world
        addBox(scene, 36, 16, 14, 0xD4A097, 0, 8, 0);

        // Twin Norman transept towers — unusual feature of Exeter Cathedral
        addBox(scene, 8, 16, 8, 0xD4A097, -22, 8, 0);
        addBox(scene, 8, 16, 8, 0xD4A097, 22, 8, 0);

        // Tower battlements
        addBox(scene, 8, 3, 8, 0xC49087, -22, 17.5, 0);
        addBox(scene, 8, 3, 8, 0xC49087, 22, 17.5, 0);

        // Tower pinnacles
        addCone(scene, 1.2, 4, 6, 0xB48077, -22, 21, 0);
        addCone(scene, 1.2, 4, 6, 0xB48077, 22, 21, 0);
        addCone(scene, 0.8, 3, 6, 0xB48077, -24.5, 20, -2.5);
        addCone(scene, 0.8, 3, 6, 0xB48077, -19.5, 20, -2.5);
        addCone(scene, 0.8, 3, 6, 0xB48077, -24.5, 20, 2.5);
        addCone(scene, 0.8, 3, 6, 0xB48077, -19.5, 20, 2.5);
        addCone(scene, 0.8, 3, 6, 0xB48077, 24.5, 20, -2.5);
        addCone(scene, 0.8, 3, 6, 0xB48077, 19.5, 20, -2.5);
        addCone(scene, 0.8, 3, 6, 0xB48077, 24.5, 20, 2.5);
        addCone(scene, 0.8, 3, 6, 0xB48077, 19.5, 20, 2.5);

        // West facade — 3-tier carved screen with figure rows
        addBox(scene, 36, 2, 1.5, 0xC49087, 0, 2, -7.5);
        addBox(scene, 36, 2, 1.5, 0xC49087, 0, 6, -7.5);
        addBox(scene, 36, 2, 1.5, 0xC49087, 0, 10, -7.5);

        // West facade figure panels (tier 1)
        addBox(scene, 3, 2, 0.8, 0xD4A097, -15, 2, -7.8);
        addBox(scene, 3, 2, 0.8, 0xD4A097, -9, 2, -7.8);
        addBox(scene, 3, 2, 0.8, 0xD4A097, -3, 2, -7.8);
        addBox(scene, 3, 2, 0.8, 0xD4A097, 3, 2, -7.8);
        addBox(scene, 3, 2, 0.8, 0xD4A097, 9, 2, -7.8);
        addBox(scene, 3, 2, 0.8, 0xD4A097, 15, 2, -7.8);

        // West facade figure panels (tier 2)
        addBox(scene, 3, 2, 0.8, 0xD4A097, -15, 6, -7.8);
        addBox(scene, 3, 2, 0.8, 0xD4A097, -9, 6, -7.8);
        addBox(scene, 3, 2, 0.8, 0xD4A097, -3, 6, -7.8);
        addBox(scene, 3, 2, 0.8, 0xD4A097, 3, 6, -7.8);
        addBox(scene, 3, 2, 0.8, 0xD4A097, 9, 6, -7.8);
        addBox(scene, 3, 2, 0.8, 0xD4A097, 15, 6, -7.8);

        // West facade figure panels (tier 3)
        addBox(scene, 3, 2, 0.8, 0xD4A097, -15, 10, -7.8);
        addBox(scene, 3, 2, 0.8, 0xD4A097, -9, 10, -7.8);
        addBox(scene, 3, 2, 0.8, 0xD4A097, -3, 10, -7.8);
        addBox(scene, 3, 2, 0.8, 0xD4A097, 3, 10, -7.8);
        addBox(scene, 3, 2, 0.8, 0xD4A097, 9, 10, -7.8);
        addBox(scene, 3, 2, 0.8, 0xD4A097, 15, 10, -7.8);

        // East end / choir
        addBox(scene, 14, 14, 10, 0xD4A097, 0, 7, 12);

        // Nave roof ridge line
        addBox(scene, 36, 1.5, 1.5, 0xB48077, 0, 17, 0);

        // Flying buttresses (simplified)
        addBox(scene, 1.5, 6, 1.5, 0xC49087, -14, 11, -6);
        addBox(scene, 1.5, 6, 1.5, 0xC49087, -7, 11, -6);
        addBox(scene, 1.5, 6, 1.5, 0xC49087, 0, 11, -6);
        addBox(scene, 1.5, 6, 1.5, 0xC49087, 7, 11, -6);
        addBox(scene, 1.5, 6, 1.5, 0xC49087, 14, 11, -6);
        addBox(scene, 1.5, 6, 1.5, 0xC49087, -14, 11, 6);
        addBox(scene, 1.5, 6, 1.5, 0xC49087, -7, 11, 6);
        addBox(scene, 1.5, 6, 1.5, 0xC49087, 0, 11, 6);
        addBox(scene, 1.5, 6, 1.5, 0xC49087, 7, 11, 6);
        addBox(scene, 1.5, 6, 1.5, 0xC49087, 14, 11, 6);
    }

    function buildRougemonCastle(scene) {
        // Norman gatehouse on hill — only surviving element
        // Raised on a hill mound
        addBox(scene, 12, 4, 12, 0xB8A870, -80, 2, -90);

        // Gatehouse tower
        addBox(scene, 6, 14, 6, 0xD4A97A, -80, 9, -90);

        // Gatehouse battlements
        addBox(scene, 6, 2, 6, 0xC49A6A, -80, 16.5, -90);

        // Gate arch (two piers)
        addBox(scene, 1.5, 6, 1.5, 0xC49A6A, -81.5, 4, -93);
        addBox(scene, 1.5, 6, 1.5, 0xC49A6A, -78.5, 4, -93);

        // Gate arch top
        addBox(scene, 4.5, 1.5, 1.5, 0xC49A6A, -80, 7.5, -93);

        // Remaining curtain wall stubs
        addBox(scene, 18, 7, 2, 0xD4A97A, -88, 3.5, -94);
        addBox(scene, 18, 7, 2, 0xD4A97A, -72, 3.5, -94);

        // Corner turret remnants
        addCylinder(scene, 1.8, 2, 5, 8, 0xC49A6A, -97, 2.5, -94);
        addCylinder(scene, 1.8, 2, 5, 8, 0xC49A6A, -63, 2.5, -94);
    }

    function buildRomanWalls(scene) {
        // Long stretch of Roman city wall — multiple sections
        // South wall section
        addBox(scene, 40, 6, 2, 0x9A8A78, -60, 3, 60);
        addBox(scene, 40, 6, 2, 0x9A8A78, -20, 3, 60);
        addBox(scene, 30, 6, 2, 0x9A8A78, 25, 3, 60);

        // West wall section
        addBox(scene, 2, 6, 40, 0x9A8A78, -80, 3, 20);
        addBox(scene, 2, 6, 40, 0x9A8A78, -80, 3, -20);

        // Roman lower courses (darker, older stonework)
        addBox(scene, 40, 2, 2.4, 0x7A6A58, -60, 1, 60);
        addBox(scene, 40, 2, 2.4, 0x7A6A58, -20, 1, 60);
        addBox(scene, 30, 2, 2.4, 0x7A6A58, 25, 1, 60);
        addBox(scene, 2, 2, 40, 0x7A6A58, -80, 1, 20);
        addBox(scene, 2, 2, 40, 0x7A6A58, -80, 1, -20);

        // Medieval upper courses (lighter, later stonework)
        addBox(scene, 40, 2, 1.8, 0xAA9A88, -60, 5.5, 60);
        addBox(scene, 40, 2, 1.8, 0xAA9A88, -20, 5.5, 60);
        addBox(scene, 30, 2, 1.8, 0xAA9A88, 25, 5.5, 60);

        // Wall towers along the Roman wall
        addBox(scene, 5, 8, 5, 0x9A8A78, -60, 4, 60);
        addBox(scene, 5, 8, 5, 0x9A8A78, -40, 4, 60);
        addBox(scene, 5, 8, 5, 0x9A8A78, -20, 4, 60);
        addBox(scene, 5, 8, 5, 0x9A8A78, 10, 4, 60);

        // Wall walk parapet
        addBox(scene, 40, 1, 1, 0x8A7A68, -60, 6.5, 59.5);
        addBox(scene, 40, 1, 1, 0x8A7A68, -20, 6.5, 59.5);

        // North wall remnants
        addBox(scene, 30, 5, 2, 0x9A8A78, -50, 2.5, -70);
        addBox(scene, 2, 5, 30, 0x9A8A78, 50, 2.5, -55);
    }

    function buildUndergroundPassages(scene) {
        // Medieval water conduit entrance in city centre
        // Staircase housing above ground
        addBox(scene, 3, 5, 3, 0x5A4A3A, -30, 2.5, -30);

        // Entrance canopy
        addBox(scene, 4, 0.5, 4, 0x4A3A2A, -30, 5.25, -30);

        // Entrance arch detail
        addBox(scene, 1, 3, 0.5, 0x6A5A4A, -31, 2, -31.5);
        addBox(scene, 1, 3, 0.5, 0x6A5A4A, -29, 2, -31.5);
        addBox(scene, 2.5, 0.8, 0.5, 0x6A5A4A, -30, 4, -31.5);

        // Steps indication (surface level)
        addBox(scene, 2.5, 0.3, 0.8, 0x6A5A4A, -30, 0.15, -32);
        addBox(scene, 2.5, 0.3, 0.8, 0x6A5A4A, -30, 0.45, -32.8);

        // Ventilation shaft stub nearby
        addCylinder(scene, 0.4, 0.4, 1.5, 8, 0x4A3A2A, -27, 0.75, -30);
    }

    function buildMuseum(scene) {
        // Royal Albert Memorial Museum — Victorian Gothic
        // Main building block
        addBox(scene, 22, 12, 14, 0xD4A97A, 60, 6, -50);

        // Clock tower — prominent feature
        addBox(scene, 5, 20, 5, 0xC49A6A, 70, 10, -44);

        // Clock tower top
        addBox(scene, 5, 3, 5, 0xB48A5A, 70, 21.5, -44);
        addCone(scene, 3, 6, 8, 0xA47A4A, 70, 26, -44);

        // Museum battlements / parapet
        addBox(scene, 22, 1.5, 1, 0xC49A6A, 60, 12.75, -43);
        addBox(scene, 22, 1.5, 1, 0xC49A6A, 60, 12.75, -57);
        addBox(scene, 1, 1.5, 14, 0xC49A6A, 49, 12.75, -50);
        addBox(scene, 1, 1.5, 14, 0xC49A6A, 71, 12.75, -50);

        // Ornate window bays (front facade)
        addBox(scene, 3, 5, 0.8, 0xE4B98A, 53, 7, -57);
        addBox(scene, 3, 5, 0.8, 0xE4B98A, 59, 7, -57);
        addBox(scene, 3, 5, 0.8, 0xE4B98A, 65, 7, -57);

        // Gothic pointed window arches
        addCone(scene, 1.5, 2.5, 4, 0xD4A97A, 53, 10.25, -57);
        addCone(scene, 1.5, 2.5, 4, 0xD4A97A, 59, 10.25, -57);
        addCone(scene, 1.5, 2.5, 4, 0xD4A97A, 65, 10.25, -57);

        // Museum entrance portico columns
        addCylinder(scene, 0.6, 0.7, 5, 8, 0xD4A97A, 58, 2.5, -57.5);
        addCylinder(scene, 0.6, 0.7, 5, 8, 0xD4A97A, 62, 2.5, -57.5);

        // Portico entablature
        addBox(scene, 6, 1, 1.5, 0xC49A6A, 60, 5.5, -57.5);

        // Side wings
        addBox(scene, 6, 9, 14, 0xD4A97A, 46, 4.5, -50);
        addBox(scene, 6, 9, 14, 0xD4A97A, 74, 4.5, -50);
    }

    function buildExeterQuay(scene) {
        // Historic quayside on the River Exe
        // Quay platform
        addBox(scene, 80, 1, 20, 0x7A6A5A, 20, 0.5, 100);

        // Four historic warehouses
        addBox(scene, 14, 8, 10, 0x8A6A5A, 0, 4, 98);
        addBox(scene, 14, 8, 10, 0x8A6A5A, 18, 4, 98);
        addBox(scene, 14, 8, 10, 0x8A6A5A, 36, 4, 98);
        addBox(scene, 14, 8, 10, 0x8A6A5A, 54, 4, 98);

        // Warehouse roofs (slightly darker)
        addBox(scene, 14, 1.5, 10, 0x7A5A4A, 0, 8.75, 98);
        addBox(scene, 14, 1.5, 10, 0x7A5A4A, 18, 8.75, 98);
        addBox(scene, 14, 1.5, 10, 0x7A5A4A, 36, 8.75, 98);
        addBox(scene, 14, 1.5, 10, 0x7A5A4A, 54, 8.75, 98);

        // Custom house — grander building with cylinder columns
        addBox(scene, 16, 10, 12, 0x9A7A6A, 20, 5, 115);

        // Custom house columns (cylinder)
        addCylinder(scene, 0.5, 0.6, 7, 10, 0xAA8A7A, 15, 3.5, 109.5);
        addCylinder(scene, 0.5, 0.6, 7, 10, 0xAA8A7A, 17.5, 3.5, 109.5);
        addCylinder(scene, 0.5, 0.6, 7, 10, 0xAA8A7A, 20, 3.5, 109.5);
        addCylinder(scene, 0.5, 0.6, 7, 10, 0xAA8A7A, 22.5, 3.5, 109.5);
        addCylinder(scene, 0.5, 0.6, 7, 10, 0xAA8A7A, 25, 3.5, 109.5);

        // Custom house pediment
        addBox(scene, 16, 2, 1, 0x9A7A6A, 20, 7.5, 109.5);

        // Custom house roof
        addBox(scene, 16, 1.5, 12, 0x8A6A5A, 20, 10.75, 115);

        // Quay capstans / bollards
        addCylinder(scene, 0.3, 0.4, 1.2, 6, 0x4A4A4A, 5, 0.6, 91);
        addCylinder(scene, 0.3, 0.4, 1.2, 6, 0x4A4A4A, 15, 0.6, 91);
        addCylinder(scene, 0.3, 0.4, 1.2, 6, 0x4A4A4A, 25, 0.6, 91);
        addCylinder(scene, 0.3, 0.4, 1.2, 6, 0x4A4A4A, 35, 0.6, 91);
        addCylinder(scene, 0.3, 0.4, 1.2, 6, 0x4A4A4A, 45, 0.6, 91);

        // Crane post on quay
        addBox(scene, 0.5, 8, 0.5, 0x3A3A3A, 50, 4, 92);
        addBox(scene, 6, 0.4, 0.4, 0x3A3A3A, 53, 8.2, 92);

        // River Exe suggestion (low flat box)
        addBox(scene, 120, 0.3, 30, 0x2A3A5A, 20, -0.15, 130);
    }

    function buildCityDetails(scene) {
        // Cathedral Close boundary wall
        addBox(scene, 60, 2.5, 1, 0xB0A090, 0, 1.25, -25);
        addBox(scene, 1, 2.5, 30, 0xB0A090, -30, 1.25, -10);
        addBox(scene, 1, 2.5, 30, 0xB0A090, 30, 1.25, -10);

        // Close gate piers
        addBox(scene, 1.5, 3.5, 1.5, 0xA09080, -5, 1.75, -25);
        addBox(scene, 1.5, 3.5, 1.5, 0xA09080, 5, 1.75, -25);

        // Deanery building
        addBox(scene, 12, 7, 8, 0xD4A097, -38, 3.5, -18);
        addBox(scene, 12, 1, 8, 0xC09080, -38, 7.5, -18);

        // High Street suggestion — ground markers
        addBox(scene, 2, 0.2, 50, 0x5A5A5A, -45, 0.1, 20);
        addBox(scene, 2, 0.2, 50, 0x5A5A5A, -47, 0.1, 20);

        // Guildhall (ancient civic building)
        addBox(scene, 14, 9, 10, 0xD4B87A, -55, 4.5, -5);
        // Guildhall portico
        addBox(scene, 14, 5, 3, 0xC4A86A, -55, 3, -10.5);
        addCylinder(scene, 0.5, 0.6, 5, 8, 0xD4B87A, -51, 2.5, -10.5);
        addCylinder(scene, 0.5, 0.6, 5, 8, 0xD4B87A, -55, 2.5, -10.5);
        addCylinder(scene, 0.5, 0.6, 5, 8, 0xD4B87A, -59, 2.5, -10.5);

        // St Peter's Cathedral area flagpole
        addCylinder(scene, 0.1, 0.1, 12, 6, 0x888888, -5, 6, -22);
    }

    function build(scene) {
        buildCathedral(scene);
        buildRougemonCastle(scene);
        buildRomanWalls(scene);
        buildUndergroundPassages(scene);
        buildMuseum(scene);
        buildExeterQuay(scene);
        buildCityDetails(scene);
    }

    function getWorldPosition() {
        return { x: WORLD_X, z: WORLD_Z };
    }

    return {
        build: build,
        getWorldPosition: getWorldPosition
    };
}());
