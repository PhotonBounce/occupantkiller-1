window.FalkirkWheel = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var wheelArms = [];
    var wheelRotation = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        wheelArms = [];
        wheelRotation = 0;
        build();
    }

    function makeMesh(geometry, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildFalkirkWheel();
        buildUnionCanalAqueduct();
        buildForthClydeCanal();
        buildVisitorCentre();
        buildRoughcastleRomanFort();
        buildAntoniusWall();
        buildCallendarHouse();
        buildCallendarPark();
        buildFalkirkSteeple();
        buildDollarParkBandstand();
        buildFalkirkHighStation();
    }

    // ------------------------------------------------------------------ //
    //  FALKIRK WHEEL
    // ------------------------------------------------------------------ //
    function buildFalkirkWheel() {
        var cx = 20080, cy = 0, cz = 0;

        // Central axle
        var axle = makeMesh(
            new THREE.CylinderGeometry(1.2, 1.2, 8, 12),
            0x666666, cx, cy + 20, cz
        );

        // Two main rotating arms — stored for animation
        var arm1Geo = new THREE.BoxGeometry(4, 35, 3);
        var arm1Mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var arm1 = new THREE.Mesh(arm1Geo, arm1Mat);
        arm1.position.set(cx, cy + 20, cz + 2);
        arm1.rotation.z = Math.PI / 8;
        scene.add(arm1);
        objects.push(arm1);
        wheelArms.push(arm1);

        var arm2Geo = new THREE.BoxGeometry(4, 35, 3);
        var arm2Mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var arm2 = new THREE.Mesh(arm2Geo, arm2Mat);
        arm2.position.set(cx, cy + 20, cz - 2);
        arm2.rotation.z = -Math.PI / 8;
        scene.add(arm2);
        objects.push(arm2);
        wheelArms.push(arm2);

        // Cross arm (horizontal beam)
        makeMesh(new THREE.BoxGeometry(60, 3, 4), 0x777777, cx, cy + 20, cz);

        // Gondola cradle top — water tank box
        makeMesh(new THREE.BoxGeometry(14, 4, 6), 0x888888, cx + 28, cy + 20, cz);
        // Water inside top gondola
        makeMesh(new THREE.BoxGeometry(12, 2.5, 5), 0x006994, cx + 28, cy + 21, cz);
        // Gondola cradle rails top
        makeMesh(new THREE.BoxGeometry(14, 1, 1), 0x555555, cx + 28, cy + 17.5, cz + 2.5);
        makeMesh(new THREE.BoxGeometry(14, 1, 1), 0x555555, cx + 28, cy + 17.5, cz - 2.5);

        // Gondola cradle bottom — water tank box
        makeMesh(new THREE.BoxGeometry(14, 4, 6), 0x888888, cx - 28, cy + 20, cz);
        // Water inside bottom gondola
        makeMesh(new THREE.BoxGeometry(12, 2.5, 5), 0x006994, cx - 28, cy + 21, cz);
        // Gondola cradle rails bottom
        makeMesh(new THREE.BoxGeometry(14, 1, 1), 0x555555, cx - 28, cy + 17.5, cz + 2.5);
        makeMesh(new THREE.BoxGeometry(14, 1, 1), 0x555555, cx - 28, cy + 17.5, cz - 2.5);

        // A-frame concrete left tower
        makeMesh(new THREE.BoxGeometry(3, 28, 4), 0xAAAAAA, cx - 8, cy + 14, cz + 8);
        makeMesh(new THREE.BoxGeometry(3, 28, 4), 0xAAAAAA, cx - 8, cy + 14, cz - 8);
        // A-frame top crosspiece left
        makeMesh(new THREE.BoxGeometry(3, 3, 20), 0xAAAAAA, cx - 8, cy + 28, cz);
        // A-frame concrete right tower
        makeMesh(new THREE.BoxGeometry(3, 28, 4), 0xAAAAAA, cx + 8, cy + 14, cz + 8);
        makeMesh(new THREE.BoxGeometry(3, 28, 4), 0xAAAAAA, cx + 8, cy + 14, cz - 8);
        // A-frame top crosspiece right
        makeMesh(new THREE.BoxGeometry(3, 3, 20), 0xAAAAAA, cx + 8, cy + 28, cz);

        // Wheel hub ring / collar
        makeMesh(new THREE.CylinderGeometry(6, 6, 5, 16), 0x999999, cx, cy + 20, cz);

        // Lower concrete base plinth
        makeMesh(new THREE.BoxGeometry(28, 4, 28), 0xBBBBBB, cx, cy + 2, cz);
        makeMesh(new THREE.BoxGeometry(22, 2, 22), 0xCCCCCC, cx, cy + 4, cz);

        // Circular access walkway platform
        makeMesh(new THREE.CylinderGeometry(14, 14, 1, 20), 0xAAAAAA, cx, cy + 5, cz);

        // Approach access ramp
        makeMesh(new THREE.BoxGeometry(20, 1, 4), 0xBBBBBB, cx - 20, cy + 3, cz);
    }

    // ------------------------------------------------------------------ //
    //  UNION CANAL AQUEDUCT
    // ------------------------------------------------------------------ //
    function buildUnionCanalAqueduct() {
        var cx = 20080, cy = 0, cz = 0;

        // Aqueduct deck carrying canal water to top of wheel
        makeMesh(new THREE.BoxGeometry(50, 2, 8), 0xC8B89A, cx - 5, cy + 32, cz + 20);
        // Canal water on aqueduct
        makeMesh(new THREE.BoxGeometry(48, 1, 6), 0x006994, cx - 5, cy + 33.5, cz + 20);

        // Aqueduct side walls
        makeMesh(new THREE.BoxGeometry(50, 3, 1), 0xB8A88A, cx - 5, cy + 33.5, cz + 23.5);
        makeMesh(new THREE.BoxGeometry(50, 3, 1), 0xB8A88A, cx - 5, cy + 33.5, cz + 16.5);

        // Stone arch supports for aqueduct
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 20, 8), 0xC8B89A, cx - 22, cy + 22, cz + 20);
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 20, 8), 0xC8B89A, cx - 10, cy + 22, cz + 20);
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 20, 8), 0xC8B89A, cx + 2, cy + 22, cz + 20);
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 20, 8), 0xC8B89A, cx + 14, cy + 22, cz + 20);

        // Arch voussoir keystones between pillars
        makeMesh(new THREE.BoxGeometry(12, 3, 8), 0xD8C8AA, cx - 16, cy + 32, cz + 20);
        makeMesh(new THREE.BoxGeometry(12, 3, 8), 0xD8C8AA, cx - 4, cy + 32, cz + 20);
        makeMesh(new THREE.BoxGeometry(12, 3, 8), 0xD8C8AA, cx + 8, cy + 32, cz + 20);

        // Approach embankment
        makeMesh(new THREE.BoxGeometry(6, 14, 8), 0x8B7B6A, cx + 22, cy + 26, cz + 20);
    }

    // ------------------------------------------------------------------ //
    //  FORTH & CLYDE CANAL LOWER BASIN
    // ------------------------------------------------------------------ //
    function buildForthClydeCanal() {
        var cx = 20080, cy = 0, cz = 0;

        // Lower canal basin floor
        makeMesh(new THREE.BoxGeometry(60, 1, 18), 0x005577, cx, cy + 0.5, cz - 28);
        // Basin water surface
        makeMesh(new THREE.BoxGeometry(58, 0.5, 16), 0x006994, cx, cy + 1, cz - 28);

        // Canal bank walls stone
        makeMesh(new THREE.BoxGeometry(60, 3, 2), 0xA09080, cx, cy + 2.5, cz - 19);
        makeMesh(new THREE.BoxGeometry(60, 3, 2), 0xA09080, cx, cy + 2.5, cz - 37);
        makeMesh(new THREE.BoxGeometry(2, 3, 18), 0xA09080, cx - 29, cy + 2.5, cz - 28);
        makeMesh(new THREE.BoxGeometry(2, 3, 18), 0xA09080, cx + 29, cy + 2.5, cz - 28);

        // Mooring bollards
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5, 6), 0x333333, cx - 20, cy + 2.5, cz - 20);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5, 6), 0x333333, cx, cy + 2.5, cz - 20);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5, 6), 0x333333, cx + 20, cy + 2.5, cz - 20);

        // Boat in lower basin
        makeMesh(new THREE.BoxGeometry(10, 2, 3), 0x4466AA, cx - 10, cy + 2, cz - 28);
        makeMesh(new THREE.BoxGeometry(8, 1.5, 2), 0xFFFFFF, cx - 10, cy + 3, cz - 28);
    }

    // ------------------------------------------------------------------ //
    //  VISITOR CENTRE
    // ------------------------------------------------------------------ //
    function buildVisitorCentre() {
        var cx = 20080, cy = 0, cz = 0;

        // Main building body
        makeMesh(new THREE.BoxGeometry(30, 8, 16), 0xD3D3D3, cx + 48, cy + 4, cz - 10);
        // Roof panel
        makeMesh(new THREE.BoxGeometry(30, 1, 16), 0xBBBBBB, cx + 48, cy + 8.5, cz - 10);
        // Glass facade front
        makeMesh(new THREE.BoxGeometry(0.5, 8, 16), 0x99CCDD, cx + 33, cy + 4, cz - 10);
        // Entrance canopy
        makeMesh(new THREE.BoxGeometry(10, 1, 8), 0xCCCCCC, cx + 37, cy + 5, cz - 10);
        // Entrance pillars
        makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 8), 0xDDDDDD, cx + 34, cy + 2.5, cz - 7);
        makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 8), 0xDDDDDD, cx + 34, cy + 2.5, cz - 13);
        // Cafe wing
        makeMesh(new THREE.BoxGeometry(14, 6, 12), 0xD3D3D3, cx + 56, cy + 3, cz - 4);
        // Car park surface
        makeMesh(new THREE.BoxGeometry(40, 0.3, 30), 0x555555, cx + 60, cy + 0.15, cz - 30);
        // Lamp posts car park
        makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 7, 6), 0x333333, cx + 50, cy + 3.5, cz - 40);
        makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 7, 6), 0x333333, cx + 70, cy + 3.5, cz - 40);
    }

    // ------------------------------------------------------------------ //
    //  ROUGHCASTLE ROMAN FORT
    // ------------------------------------------------------------------ //
    function buildRoughcastleRomanFort() {
        var cx = 20080, cy = 0, cz = 0;
        var fx = cx + 150, fz = cz + 80;

        // Fort rampart walls — rectangular outline
        makeMesh(new THREE.BoxGeometry(50, 3, 3), 0x8B7355, fx, cy + 1.5, fz);
        makeMesh(new THREE.BoxGeometry(50, 3, 3), 0x8B7355, fx, cy + 1.5, fz + 40);
        makeMesh(new THREE.BoxGeometry(3, 3, 40), 0x8B7355, fx - 25, cy + 1.5, fz + 20);
        makeMesh(new THREE.BoxGeometry(3, 3, 40), 0x8B7355, fx + 25, cy + 1.5, fz + 20);

        // Earth ditch (depressed)
        makeMesh(new THREE.BoxGeometry(58, 1, 48), 0x7A6545, fx, cy - 0.5, fz + 20);

        // Outer rampart ditch lip
        makeMesh(new THREE.BoxGeometry(60, 2, 2), 0x8B7355, fx, cy + 1, fz - 5);
        makeMesh(new THREE.BoxGeometry(60, 2, 2), 0x8B7355, fx, cy + 1, fz + 46);
        makeMesh(new THREE.BoxGeometry(2, 2, 56), 0x8B7355, fx - 31, cy + 1, fz + 20);
        makeMesh(new THREE.BoxGeometry(2, 2, 56), 0x8B7355, fx + 31, cy + 1, fz + 20);

        // Wooden palisade posts along rampart
        for (var i = 0; i < 9; i++) {
            makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), 0x5C4033, fx - 20 + i * 5, cy + 3.5, fz);
            makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), 0x5C4033, fx - 20 + i * 5, cy + 3.5, fz + 40);
        }
        for (var j = 0; j < 7; j++) {
            makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), 0x5C4033, fx - 25, cy + 3.5, fz + 5 + j * 5);
            makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), 0x5C4033, fx + 25, cy + 3.5, fz + 5 + j * 5);
        }

        // Fort internal barracks block
        makeMesh(new THREE.BoxGeometry(20, 3, 8), 0x9B8365, fx, cy + 1.5, fz + 20);
        // Headquarters building
        makeMesh(new THREE.BoxGeometry(10, 4, 10), 0x9B8365, fx, cy + 2, fz + 12);

        // Gateway entrance north
        makeMesh(new THREE.BoxGeometry(4, 5, 3), 0x7A6545, fx - 2, cy + 2.5, fz);
        makeMesh(new THREE.BoxGeometry(4, 5, 3), 0x7A6545, fx + 2, cy + 2.5, fz);
    }

    // ------------------------------------------------------------------ //
    //  ANTONINE WALL
    // ------------------------------------------------------------------ //
    function buildAntoniusWall() {
        var cx = 20080, cy = 0, cz = 0;

        // Wall turf core running east-west
        for (var i = 0; i < 12; i++) {
            makeMesh(new THREE.BoxGeometry(20, 3, 5), 0x8B7355, cx + 80 + i * 22, cy + 1.5, cz + 60);
        }
        // Stone foundation base
        for (var k = 0; k < 12; k++) {
            makeMesh(new THREE.BoxGeometry(20, 1, 6), 0x7A6040, cx + 80 + k * 22, cy + 0.5, cz + 60);
        }
        // Northern ditch
        for (var m = 0; m < 6; m++) {
            makeMesh(new THREE.BoxGeometry(40, 1, 4), 0x6A5030, cx + 100 + m * 44, cy - 0.5, cz + 68);
        }
    }

    // ------------------------------------------------------------------ //
    //  CALLENDAR HOUSE
    // ------------------------------------------------------------------ //
    function buildCallendarHouse() {
        var cx = 20080, cy = 0, cz = 0;
        var hx = cx - 80, hz = cz - 80;

        // Main mansion block
        makeMesh(new THREE.BoxGeometry(40, 14, 22), 0xF5F0E8, hx, cy + 7, hz);
        // Central tower / pavilion raised section
        makeMesh(new THREE.BoxGeometry(16, 18, 18), 0xF5F0E8, hx, cy + 9, hz);
        // Pitched roof main block
        makeMesh(new THREE.BoxGeometry(42, 5, 24), 0xDDD8CC, hx, cy + 16.5, hz);
        // Central tower roof
        makeMesh(new THREE.BoxGeometry(17, 5, 19), 0xDDD8CC, hx, cy + 20, hz);
        // Roof ridge cap
        makeMesh(new THREE.BoxGeometry(18, 2, 2), 0xCCC8BB, hx, cy + 22.5, hz);

        // Chimneys
        makeMesh(new THREE.BoxGeometry(2, 5, 2), 0xDDD0C0, hx - 15, cy + 21, hz - 6);
        makeMesh(new THREE.BoxGeometry(2, 5, 2), 0xDDD0C0, hx + 15, cy + 21, hz - 6);
        makeMesh(new THREE.BoxGeometry(2, 5, 2), 0xDDD0C0, hx - 15, cy + 21, hz + 6);
        makeMesh(new THREE.BoxGeometry(2, 5, 2), 0xDDD0C0, hx + 15, cy + 21, hz + 6);

        // Entrance portico columns
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 8), 0xEEE8DC, hx - 5, cy + 5, hz - 12);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 8), 0xEEE8DC, hx, cy + 5, hz - 12);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 8), 0xEEE8DC, hx + 5, cy + 5, hz - 12);
        // Portico entablature
        makeMesh(new THREE.BoxGeometry(14, 2, 3), 0xF0EAD8, hx, cy + 11, hz - 12);

        // Wings left and right
        makeMesh(new THREE.BoxGeometry(12, 10, 16), 0xF5F0E8, hx - 26, cy + 5, hz);
        makeMesh(new THREE.BoxGeometry(12, 10, 16), 0xF5F0E8, hx + 26, cy + 5, hz);

        // Forecourt gravel
        makeMesh(new THREE.BoxGeometry(30, 0.2, 20), 0xC8B89A, hx, cy + 0.1, hz - 22);

        // Garden formal hedge rows
        makeMesh(new THREE.BoxGeometry(30, 2, 2), 0x2E6B2E, hx, cy + 1, hz - 38);
        makeMesh(new THREE.BoxGeometry(30, 2, 2), 0x2E6B2E, hx, cy + 1, hz - 44);
    }

    // ------------------------------------------------------------------ //
    //  CALLENDAR PARK
    // ------------------------------------------------------------------ //
    function buildCallendarPark() {
        var cx = 20080, cy = 0, cz = 0;
        var px = cx - 80, pz = cz - 80;

        // Parkland ground
        makeMesh(new THREE.BoxGeometry(120, 0.3, 100), 0x4a7c3f, px, cy + 0.15, pz - 70);

        // Formal tree avenue — pairs of cones as tree forms
        for (var t = 0; t < 6; t++) {
            makeMesh(new THREE.ConeGeometry(2, 8, 8), 0x226622, px - 50 + t * 20, cy + 4, pz - 60);
            makeMesh(new THREE.ConeGeometry(2, 8, 8), 0x226622, px - 50 + t * 20, cy + 4, pz - 80);
        }

        // Boating lake
        makeMesh(new THREE.CylinderGeometry(18, 18, 0.5, 16), 0x3377AA, px - 50, cy + 0.3, pz - 130);
        // Lake bank edging
        makeMesh(new THREE.CylinderGeometry(19.5, 19.5, 0.4, 16), 0x6B8C5A, px - 50, cy + 0.2, pz - 130);

        // Bandstand in park (smaller secondary one)
        makeMesh(new THREE.CylinderGeometry(4, 4, 0.5, 8), 0x888888, px + 30, cy + 0.5, pz - 120);
        makeMesh(new THREE.ConeGeometry(5, 4, 8), 0x666666, px + 30, cy + 5, pz - 120);

        // Park perimeter railings (box representation)
        makeMesh(new THREE.BoxGeometry(120, 2, 1), 0x444444, px, cy + 1, pz - 18);
        makeMesh(new THREE.BoxGeometry(1, 2, 100), 0x444444, px - 60, cy + 1, pz - 68);
        makeMesh(new THREE.BoxGeometry(1, 2, 100), 0x444444, px + 60, cy + 1, pz - 68);
    }

    // ------------------------------------------------------------------ //
    //  FALKIRK STEEPLE / TOLBOOTH
    // ------------------------------------------------------------------ //
    function buildFalkirkSteeple() {
        var cx = 20080, cy = 0, cz = 0;
        var sx = cx - 120, sz = cz + 60;

        // Tolbooth base building
        makeMesh(new THREE.BoxGeometry(14, 10, 12), 0xC8B89A, sx, cy + 5, sz);
        // Tower shaft
        makeMesh(new THREE.BoxGeometry(6, 22, 6), 0xC8B89A, sx, cy + 17, sz);
        // Belfry stage
        makeMesh(new THREE.BoxGeometry(7, 5, 7), 0xBBA88A, sx, cy + 31.5, sz);
        // Spire
        makeMesh(new THREE.ConeGeometry(3.5, 14, 8), 0xAAA888, sx, cy + 42, sz);
        // Spire tip finial
        makeMesh(new THREE.SphereGeometry(0.4, 6, 6), 0x888866, sx, cy + 49, sz);
        // Clock face (disk approximation)
        makeMesh(new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12), 0xFFFFCC, sx + 3.6, cy + 31, sz);
        makeMesh(new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12), 0xFFFFCC, sx - 3.6, cy + 31, sz);
        // Arched ground floor windows suggestion
        makeMesh(new THREE.BoxGeometry(2.5, 4, 0.5), 0x88AACC, sx - 4, cy + 4, sz - 6);
        makeMesh(new THREE.BoxGeometry(2.5, 4, 0.5), 0x88AACC, sx + 4, cy + 4, sz - 6);

        // Town square cobbles around steeple
        makeMesh(new THREE.BoxGeometry(28, 0.2, 24), 0x999999, sx, cy + 0.1, sz);
    }

    // ------------------------------------------------------------------ //
    //  DOLLAR PARK BANDSTAND
    // ------------------------------------------------------------------ //
    function buildDollarParkBandstand() {
        var cx = 20080, cy = 0, cz = 0;
        var bx = cx + 100, bz = cz - 80;

        // Octagonal base platform
        makeMesh(new THREE.CylinderGeometry(7, 7, 1, 8), 0x999999, bx, cy + 0.5, bz);
        // Inner performance floor raised
        makeMesh(new THREE.CylinderGeometry(5.5, 5.5, 0.5, 8), 0xAAAAAA, bx, cy + 1.25, bz);
        // Decorative iron columns — 8 around the ring
        for (var c = 0; c < 8; c++) {
            var angle = (c / 8) * Math.PI * 2;
            var colX = bx + Math.cos(angle) * 5.5;
            var colZ = bz + Math.sin(angle) * 5.5;
            makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 6, 6), 0x777777, colX, cy + 4, colZ);
        }
        // Conical roof
        makeMesh(new THREE.ConeGeometry(7.5, 5, 8), 0x666666, bx, cy + 10, bz);
        // Roof finial
        makeMesh(new THREE.SphereGeometry(0.5, 6, 6), 0x888888, bx, cy + 12.5, bz);
        // Central conductor's podium
        makeMesh(new THREE.BoxGeometry(1.5, 1, 1.5), 0x888888, bx, cy + 2, bz);

        // Park lawns around bandstand
        makeMesh(new THREE.CylinderGeometry(20, 20, 0.2, 12), 0x5A8C4F, bx, cy + 0.1, bz);
        // Park path to bandstand
        makeMesh(new THREE.BoxGeometry(4, 0.2, 30), 0xCCBBAA, bx, cy + 0.15, bz + 25);
    }

    // ------------------------------------------------------------------ //
    //  FALKIRK HIGH RAILWAY STATION
    // ------------------------------------------------------------------ //
    function buildFalkirkHighStation() {
        var cx = 20080, cy = 0, cz = 0;
        var rx = cx - 160, rz = cz + 160;

        // Platform base
        makeMesh(new THREE.BoxGeometry(60, 1.2, 8), 0xD4C9B0, rx, cy + 0.6, rz);
        // Second platform
        makeMesh(new THREE.BoxGeometry(60, 1.2, 8), 0xD4C9B0, rx, cy + 0.6, rz + 16);

        // Station building main block
        makeMesh(new THREE.BoxGeometry(20, 10, 12), 0xD4C9B0, rx - 18, cy + 5, rz + 4);
        // Roof pitched
        makeMesh(new THREE.BoxGeometry(21, 3, 13), 0xBBAA90, rx - 18, cy + 11.5, rz + 4);
        // Gable ends
        makeMesh(new THREE.BoxGeometry(21, 2, 2), 0xC4B9A0, rx - 18, cy + 13, rz + 4);

        // Awning canopy over platform
        makeMesh(new THREE.BoxGeometry(40, 0.5, 6), 0xCCC0A8, rx + 8, cy + 5, rz);
        // Canopy support columns
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), 0xAAA090, rx - 6, cy + 2.5, rz - 2);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), 0xAAA090, rx + 6, cy + 2.5, rz - 2);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), 0xAAA090, rx + 18, cy + 2.5, rz - 2);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), 0xAAA090, rx + 30, cy + 2.5, rz - 2);

        // Railway tracks (narrow boxes)
        makeMesh(new THREE.BoxGeometry(70, 0.3, 0.4), 0x555544, rx, cy + 0.15, rz + 4);
        makeMesh(new THREE.BoxGeometry(70, 0.3, 0.4), 0x555544, rx, cy + 0.15, rz + 6);
        // Sleepers suggestion
        for (var s = 0; s < 14; s++) {
            makeMesh(new THREE.BoxGeometry(0.4, 0.3, 4), 0x5C4033, rx - 30 + s * 5, cy + 0.1, rz + 5);
        }

        // Signal box
        makeMesh(new THREE.BoxGeometry(5, 7, 5), 0xD4C9B0, rx + 38, cy + 3.5, rz + 2);
        // Signal box upper floor windows
        makeMesh(new THREE.BoxGeometry(5.2, 3, 5.2), 0x99BBCC, rx + 38, cy + 6.5, rz + 2);

        // Station name board
        makeMesh(new THREE.BoxGeometry(8, 1.5, 0.3), 0x003366, rx - 18, cy + 3.5, rz - 6.5);
    }

    // ------------------------------------------------------------------ //
    //  UPDATE — rotate the wheel
    // ------------------------------------------------------------------ //
    function update(delta) {
        wheelRotation += delta * 0.05;
        for (var i = 0; i < wheelArms.length; i++) {
            wheelArms[i].rotation.z = wheelRotation;
        }
    }

    // ------------------------------------------------------------------ //
    //  RESET
    // ------------------------------------------------------------------ //
    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        wheelArms = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };

}());
