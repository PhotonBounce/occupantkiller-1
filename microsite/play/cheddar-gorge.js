window.CheddarGorge = (function() {
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

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function buildCliffs() {
        var ox = 13960;
        // West cliff face - main limestone cliff rising 110m
        // Base cliff block west side
        makeBox(18, 110, 200, 0x8a8a7a, ox - 28, 55, 0);
        // Overhanging ledge west upper
        makeBox(22, 8, 180, 0x9a9a8a, ox - 30, 108, 5);
        // Scree slope west base
        makeBox(12, 6, 180, 0x7a7060, ox - 16, 3, 0);
        // Rock variation west mid
        makeBox(6, 30, 150, 0x8e8e7e, ox - 36, 75, 10);
        // Vegetation on ledges west - dark green patches
        makeBox(14, 3, 60, 0x2d5a1b, ox - 28, 115, -40);
        makeBox(10, 3, 40, 0x2d5a1b, ox - 26, 85, 30);
        makeBox(8, 3, 50, 0x3a6e22, ox - 24, 60, -20);
        // Small rock outcrops west
        makeBox(4, 15, 20, 0x7a7a6a, ox - 38, 50, -60);
        makeBox(3, 10, 15, 0x7a7a6a, ox - 37, 35, 60);

        // East cliff face
        makeBox(18, 110, 200, 0x8a8a7a, ox + 28, 55, 0);
        // Overhanging ledge east upper
        makeBox(22, 8, 180, 0x9a9a8a, ox + 30, 108, -5);
        // Scree slope east base
        makeBox(12, 6, 180, 0x7a7060, ox + 16, 3, 0);
        // Rock variation east mid
        makeBox(6, 30, 150, 0x8e8e7e, ox + 36, 75, -10);
        // Vegetation on ledges east
        makeBox(14, 3, 60, 0x2d5a1b, ox + 28, 115, 40);
        makeBox(10, 3, 40, 0x2d5a1b, ox + 26, 85, -30);
        makeBox(8, 3, 50, 0x3a6e22, ox + 24, 60, 20);
        // Small rock outcrops east
        makeBox(4, 15, 20, 0x7a7a6a, ox + 38, 50, 60);
        makeBox(3, 10, 15, 0x7a7a6a, ox + 37, 35, -60);

        // Gorge floor - limestone pavement
        makeBox(55, 2, 220, 0x9a9070, ox, 0, 0);

        // Additional cliff sections along gorge length (north)
        makeBox(16, 95, 80, 0x858575, ox - 26, 47, -130);
        makeBox(16, 95, 80, 0x858575, ox + 26, 47, -130);
        makeBox(14, 80, 80, 0x808070, ox - 24, 40, -200);
        makeBox(14, 80, 80, 0x808070, ox + 24, 40, -200);

        // Cliff top plateau vegetation
        makeBox(20, 4, 200, 0x3a6e22, ox - 40, 113, 0);
        makeBox(20, 4, 200, 0x3a6e22, ox + 40, 113, 0);
    }

    function buildGoughsCave() {
        var ox = 13960;
        var cz = -60;
        // Cave entrance arch - built from box segments
        // Left pillar of arch
        makeBox(6, 18, 5, 0x6a6a5a, ox - 18, 9, cz);
        // Right pillar of arch
        makeBox(6, 18, 5, 0x6a6a5a, ox - 6, 9, cz);
        // Arch lintel
        makeBox(18, 5, 5, 0x6a6a5a, ox - 12, 20, cz);
        // Cave interior dark void
        makeBox(10, 14, 30, 0x1a1a14, ox - 12, 10, cz - 12);
        // Cave ceiling low inside
        makeBox(12, 3, 35, 0x5a5a4a, ox - 12, 16, cz - 14);

        // Stalactites hanging from cave ceiling (cones pointing down)
        makeCone(0.5, 4, 6, 0xc0b090, ox - 10, 14, cz - 8);
        makeCone(0.4, 3, 6, 0xc0b090, ox - 13, 15, cz - 10);
        makeCone(0.6, 5, 6, 0xbaa880, ox - 9, 13, cz - 15);
        makeCone(0.3, 3, 6, 0xc0b090, ox - 15, 14, cz - 12);
        makeCone(0.5, 4, 6, 0xbaa880, ox - 11, 15, cz - 20);

        // Stalagmites rising from cave floor (cones pointing up)
        var stgGeo1 = new THREE.ConeGeometry(0.4, 3, 6);
        var stgMat = new THREE.MeshLambertMaterial({ color: 0xb0a070 });
        var stg1 = new THREE.Mesh(stgGeo1, stgMat);
        stg1.position.set(ox - 10, 1.5, cz - 9);
        stg1.rotation.z = Math.PI;
        addObj(stg1);

        var stgGeo2 = new THREE.ConeGeometry(0.5, 4, 6);
        var stgMat2 = new THREE.MeshLambertMaterial({ color: 0xb0a070 });
        var stg2 = new THREE.Mesh(stgGeo2, stgMat2);
        stg2.position.set(ox - 14, 2, cz - 14);
        stg2.rotation.z = Math.PI;
        addObj(stg2);

        var stgGeo3 = new THREE.ConeGeometry(0.3, 2.5, 6);
        var stgMat3 = new THREE.MeshLambertMaterial({ color: 0xb0a070 });
        var stg3 = new THREE.Mesh(stgGeo3, stgMat3);
        stg3.position.set(ox - 12, 1.25, cz - 18);
        stg3.rotation.z = Math.PI;
        addObj(stg3);

        // Cave museum building
        makeBox(14, 8, 12, 0x8a7a5a, ox - 2, 4, cz - 2);
        makeBox(16, 1, 14, 0x6a5a3a, ox - 2, 8.5, cz - 2);
        // Museum sign board
        makeBox(6, 2, 0.5, 0x2a4a2a, ox - 2, 7, cz + 5);
        // Cheddar Man display case (glass-like box)
        makeBox(2, 3, 2, 0x4a6a8a, ox - 8, 1.5, cz + 2);
        // Cheddar Man skeleton representation
        makeCylinder(0.2, 0.2, 1.5, 6, 0xd4c8b0, ox - 8, 2.5, cz + 2);
        makeSphere(0.3, 6, 6, 0xd4c8b0, ox - 8, 3.5, cz + 2);

        // Entrance path to cave
        makeBox(8, 0.5, 20, 0x9a8a6a, ox - 12, 0.25, cz + 10);
        // Ticket booth
        makeBox(3, 4, 3, 0x8a6a3a, ox - 5, 2, cz + 6);
        makeBox(3.2, 0.5, 3.2, 0x6a4a1a, ox - 5, 4.25, cz + 6);
    }

    function buildCoxsCave() {
        var ox = 13960;
        var cz = 60;
        // Cox's Cave entrance - smaller than Gough's
        // Left pillar
        makeBox(4, 12, 4, 0x6a6a5a, ox + 16, 6, cz);
        // Right pillar
        makeBox(4, 12, 4, 0x6a6a5a, ox + 24, 6, cz);
        // Lintel
        makeBox(12, 4, 4, 0x6a6a5a, ox + 20, 14, cz);
        // Cave interior
        makeBox(8, 10, 25, 0x0a0a08, ox + 20, 7, cz - 10);

        // Crystal formations - different coloured materials
        // Purple crystals
        makeSphere(0.8, 6, 5, 0x8a2be2, ox + 18, 2, cz - 6);
        makeCone(0.6, 3, 5, 0x9932cc, ox + 19, 1.5, cz - 8);
        makeCone(0.5, 2.5, 5, 0x8a2be2, ox + 17, 1.5, cz - 5);
        // Blue crystals
        makeCone(0.7, 3.5, 5, 0x1e90ff, ox + 21, 1.5, cz - 10);
        makeSphere(0.6, 6, 5, 0x4169e1, ox + 22, 2, cz - 12);
        makeCone(0.4, 2.5, 5, 0x00bfff, ox + 20, 1.5, cz - 14);
        // Golden crystals
        makeCone(0.6, 3, 5, 0xffd700, ox + 23, 1.5, cz - 9);
        makeSphere(0.5, 6, 5, 0xdaa520, ox + 24, 2, cz - 7);
        // Red crystals
        makeCone(0.5, 2.8, 5, 0xdc143c, ox + 18, 1.5, cz - 15);
        makeSphere(0.4, 6, 5, 0xb22222, ox + 19, 2, cz - 17);
        // Green crystals
        makeCone(0.6, 3.2, 5, 0x32cd32, ox + 22, 1.5, cz - 16);

        // Crystal stalactites from ceiling
        makeCone(0.4, 3, 5, 0x8a2be2, ox + 20, 11, cz - 8);
        makeCone(0.3, 2.5, 5, 0x1e90ff, ox + 22, 12, cz - 12);
        makeCone(0.4, 3, 5, 0xffd700, ox + 19, 11, cz - 14);

        // Cave entrance path
        makeBox(6, 0.5, 15, 0x9a8a6a, ox + 20, 0.25, cz + 8);
        // Small kiosk at entrance
        makeBox(2.5, 3.5, 2.5, 0x7a5a3a, ox + 26, 1.75, cz + 4);
        makeBox(2.7, 0.4, 2.7, 0x5a3a1a, ox + 26, 3.7, cz + 4);
    }

    function buildJacobsLadder() {
        var ox = 13960;
        // Jacob's Ladder - 274 steps up east cliff face
        // Staircase structure - grouped into sections
        var stairBase = ox + 20;
        var i;
        for (i = 0; i < 14; i++) {
            makeBox(4, 0.8, 2, 0x706858, stairBase + (i * 0.4), 2 + (i * 8), -140 + (i * 6));
        }
        // Staircase wall/handrail left
        makeBox(1, 115, 90, 0x8a7a6a, stairBase - 2, 57, -85);
        // Staircase wall/handrail right
        makeBox(1, 115, 90, 0x8a7a6a, stairBase + 6, 57, -85);

        // Step sections continued
        for (i = 0; i < 10; i++) {
            makeBox(4, 0.8, 2, 0x706858, stairBase + 4 + (i * 0.3), 114 - (i * 2), -60 - (i * 3));
        }

        // Observation tower at top of cliff
        var towerX = ox + 32;
        var towerZ = -150;
        var towerY = 116;
        // Tower base
        makeCylinder(3, 3.5, 12, 8, 0x706050, towerX, towerY + 6, towerZ);
        // Tower top platform
        makeBox(8, 1.5, 8, 0x5a4a3a, towerX, towerY + 13, towerZ);
        // Tower parapet corners
        makeBox(1, 2, 1, 0x4a3a2a, towerX - 3, towerY + 15, towerZ - 3);
        makeBox(1, 2, 1, 0x4a3a2a, towerX + 3, towerY + 15, towerZ - 3);
        makeBox(1, 2, 1, 0x4a3a2a, towerX - 3, towerY + 15, towerZ + 3);
        makeBox(1, 2, 1, 0x4a3a2a, towerX + 3, towerY + 15, towerZ + 3);
        // Flagpole
        makeCylinder(0.15, 0.15, 8, 6, 0xc8b08a, towerX, towerY + 21, towerZ);

        // Lookout point railing
        makeBox(20, 1, 1, 0x5a4a3a, ox + 38, 113, -145);
        makeBox(20, 1, 1, 0x5a4a3a, ox + 38, 113, -165);
        makeBox(1, 1, 22, 0x5a4a3a, ox + 28, 113, -155);
        makeBox(1, 1, 22, 0x5a4a3a, ox + 48, 113, -155);
        // Lookout bench
        makeBox(4, 0.5, 1, 0x6a5a3a, ox + 42, 111.25, -155);

        // Cliff path at top
        makeBox(4, 1, 80, 0x8a7a5a, ox + 38, 111.5, -120);
    }

    function buildCheddarVillage() {
        var ox = 13960;
        var vz = 80;

        // Cheese shop 1
        makeBox(8, 6, 7, 0xd4a855, ox - 10, 3, vz);
        makeBox(9, 0.5, 8, 0xa07830, ox - 10, 6.25, vz);
        // Cheese shop sign
        makeBox(4, 1.5, 0.3, 0xf0c060, ox - 10, 6, vz - 3.5);
        // Cheese display cylinders
        makeCylinder(0.8, 0.8, 0.6, 8, 0xf5e080, ox - 8, 0.3, vz - 2);
        makeCylinder(0.6, 0.6, 0.5, 8, 0xf0d870, ox - 11, 0.25, vz - 2);

        // Cheese shop 2
        makeBox(8, 6, 7, 0xd4b860, ox + 5, 3, vz);
        makeBox(9, 0.5, 8, 0xa07830, ox + 5, 6.25, vz);
        // Awning
        makeBox(8, 0.5, 3, 0xc03030, ox + 5, 6, vz - 5);

        // Strawberry stall 1
        makeBox(5, 3, 5, 0x8a4a2a, ox - 18, 1.5, vz + 15);
        makeBox(5.5, 0.3, 5.5, 0xa06030, ox - 18, 3.15, vz + 15);
        // Strawberry display - red spheres
        makeSphere(0.4, 6, 5, 0xff2020, ox - 17, 3.5, vz + 13);
        makeSphere(0.4, 6, 5, 0xff2020, ox - 18, 3.5, vz + 14);
        makeSphere(0.4, 6, 5, 0xff3030, ox - 19, 3.5, vz + 13);
        // Strawberry stall awning - red/white stripe effect
        makeBox(6, 0.3, 4, 0xff4040, ox - 18, 4, vz + 13);

        // Strawberry stall 2
        makeBox(5, 3, 5, 0x8a4a2a, ox + 18, 1.5, vz + 15);
        makeBox(5.5, 0.3, 5.5, 0xa06030, ox + 18, 3.15, vz + 15);
        makeSphere(0.4, 6, 5, 0xff2020, ox + 17, 3.5, vz + 13);
        makeSphere(0.4, 6, 5, 0xff2020, ox + 18, 3.5, vz + 14);
        makeBox(6, 0.3, 4, 0xff4040, ox + 18, 4, vz + 13);

        // Souvenir shop
        makeBox(10, 7, 8, 0xc8a870, ox, 3.5, vz + 5);
        makeBox(11, 0.5, 9, 0x907040, ox, 7.25, vz + 5);
        // Shop window
        makeBox(4, 3, 0.3, 0x88aacc, ox, 3.5, vz + 1);
        // Shop door
        makeBox(1.5, 4, 0.3, 0x6a4a1a, ox - 2, 2, vz + 1);

        // St Andrew's Church tower
        var churchX = ox - 22;
        var churchZ = vz + 20;
        // Church nave
        makeBox(14, 9, 20, 0xc8c0a8, churchX, 4.5, churchZ);
        // Nave roof - use box at angle approximation
        makeBox(16, 2, 22, 0x8a7a5a, churchX, 9.5, churchZ);
        // Church tower
        makeBox(7, 22, 7, 0xb8b0a0, churchX - 8, 11, churchZ - 7);
        // Tower battlements
        makeBox(1.5, 2, 1.5, 0xa8a090, churchX - 10, 23, churchZ - 8);
        makeBox(1.5, 2, 1.5, 0xa8a090, churchX - 6, 23, churchZ - 8);
        makeBox(1.5, 2, 1.5, 0xa8a090, churchX - 10, 23, churchZ - 6);
        makeBox(1.5, 2, 1.5, 0xa8a090, churchX - 6, 23, churchZ - 6);
        // Church spire / pinnacle
        makeCone(1.5, 8, 8, 0x6a6258, churchX - 8, 27, churchZ - 7);
        // Church windows
        makeBox(1.5, 3, 0.3, 0x88aacc, churchX - 3, 5, churchZ - 10);
        makeBox(1.5, 3, 0.3, 0x88aacc, churchX + 3, 5, churchZ - 10);
        // Churchyard wall
        makeBox(30, 2, 1, 0xa8a090, churchX - 8, 1, churchZ - 12);
        makeBox(1, 2, 20, 0xa8a090, churchX - 23, 1, churchZ - 2);

        // Pub / inn
        makeBox(12, 8, 10, 0xc09060, ox + 15, 4, vz + 20);
        makeBox(13, 1, 11, 0x806040, ox + 15, 8.5, vz + 20);
        makeBox(14, 1.5, 12, 0x706030, ox + 15, 9.5, vz + 20);
        // Pub sign hanging
        makeBox(2, 2, 0.3, 0x4a3010, ox + 9, 7, vz + 15);
        // Car park area
        makeBox(22, 0.3, 18, 0x404040, ox + 5, 0.15, vz + 35);
    }

    function buildGorgeRoad() {
        var ox = 13960;
        // B3135 road winding through gorge - main carriageway
        // Central road sections
        makeBox(10, 0.4, 50, 0x3a3a3a, ox - 3, 0.2, -25);
        makeBox(10, 0.4, 50, 0x3a3a3a, ox - 5, 0.2, 25);
        makeBox(10, 0.4, 50, 0x3a3a3a, ox - 2, 0.2, 75);
        makeBox(10, 0.4, 50, 0x3a3a3a, ox + 2, 0.2, -75);
        makeBox(10, 0.4, 50, 0x3a3a3a, ox + 4, 0.2, -125);
        makeBox(10, 0.4, 50, 0x3a3a3a, ox - 4, 0.2, 125);
        makeBox(10, 0.4, 50, 0x3a3a3a, ox + 2, 0.2, -175);

        // Road centre line dashes
        var j;
        for (j = 0; j < 8; j++) {
            makeBox(0.3, 0.5, 4, 0xf0f0a0, ox - 3, 0.45, -10 + (j * 12));
        }

        // Crash barriers - left side
        makeBox(1, 1.2, 50, 0xc0c0c0, ox - 9, 0.6, -25);
        makeBox(1, 1.2, 50, 0xc0c0c0, ox - 11, 0.6, 25);
        makeBox(1, 1.2, 50, 0xc0c0c0, ox - 8, 0.6, 75);
        // Crash barriers - right side
        makeBox(1, 1.2, 50, 0xc0c0c0, ox + 3, 0.6, -25);
        makeBox(1, 1.2, 50, 0xc0c0c0, ox + 1, 0.6, 25);
        makeBox(1, 1.2, 50, 0xc0c0c0, ox + 4, 0.6, 75);

        // Lay-by north side
        makeBox(14, 0.4, 25, 0x4a4a4a, ox + 10, 0.2, -50);
        // Lay-by picnic bench
        makeBox(4, 0.5, 1.5, 0x8a6a3a, ox + 14, 1, -50);
        makeBox(1, 1, 1.5, 0x8a6a3a, ox + 12, 0.5, -50);
        makeBox(1, 1, 1.5, 0x8a6a3a, ox + 16, 0.5, -50);

        // Lay-by south side
        makeBox(14, 0.4, 25, 0x4a4a4a, ox - 12, 0.2, 50);
        // Lay-by bin
        makeCylinder(0.5, 0.5, 1.2, 8, 0x2a2a2a, ox - 16, 0.6, 52);

        // Tourist coach 1 parked in lay-by
        makeBox(10, 3.5, 3, 0x2a4a8a, ox + 12, 1.75, -42);
        makeBox(10.2, 0.4, 3.2, 0x1a3a6a, ox + 12, 3.7, -42);
        // Coach wheels
        makeCylinder(0.6, 0.6, 0.5, 8, 0x1a1a1a, ox + 8, 0.6, -40);
        makeCylinder(0.6, 0.6, 0.5, 8, 0x1a1a1a, ox + 15, 0.6, -40);
        makeCylinder(0.6, 0.6, 0.5, 8, 0x1a1a1a, ox + 8, 0.6, -44);
        makeCylinder(0.6, 0.6, 0.5, 8, 0x1a1a1a, ox + 15, 0.6, -44);
        // Coach windows
        makeBox(1.5, 1.2, 0.2, 0x88aacc, ox + 9, 2.5, -40.6);
        makeBox(1.5, 1.2, 0.2, 0x88aacc, ox + 11, 2.5, -40.6);
        makeBox(1.5, 1.2, 0.2, 0x88aacc, ox + 13, 2.5, -40.6);
        makeBox(1.5, 1.2, 0.2, 0x88aacc, ox + 15, 2.5, -40.6);

        // Tourist coach 2 moving through gorge
        makeBox(10, 3.5, 3, 0x2a8a4a, ox - 3, 1.75, 10);
        makeBox(10.2, 0.4, 3.2, 0x1a6a3a, ox - 3, 3.7, 10);

        // Road signs
        makeCylinder(0.15, 0.15, 3, 6, 0xc0c0c0, ox + 6, 1.5, -30);
        makeBox(2, 1.5, 0.2, 0x2244aa, ox + 6, 3.5, -30);
        makeCylinder(0.15, 0.15, 3, 6, 0xc0c0c0, ox - 8, 1.5, 40);
        makeBox(2, 1.5, 0.2, 0xcc2222, ox - 8, 3.5, 40);

        // Roadside retaining walls
        makeBox(2, 5, 180, 0x8a8070, ox - 22, 2.5, 0);
        makeBox(2, 5, 180, 0x8a8070, ox + 22, 2.5, 0);
    }

    function build() {
        buildCliffs();
        buildGoughsCave();
        buildCoxsCave();
        buildJacobsLadder();
        buildCheddarVillage();
        buildGorgeRoad();
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
