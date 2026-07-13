window.LutonTown = (function() {
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
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function buildGround() {
        var ground = makeBox(2400, 1, 2400, 0x5a7a3a, 12480, -0.5, 0);
        addObj(ground);
    }

    function buildLutonHoo() {
        var ox = 12480 - 600;
        var oz = -400;

        // Parkland grass
        var park = makeBox(800, 0.5, 600, 0x4a8a2a, ox, 0.25, oz);
        addObj(park);

        // Main mansion body
        var body = makeBox(120, 40, 60, 0xe8d8b0, ox, 20, oz);
        addObj(body);

        // Central portico
        var portico = makeBox(30, 45, 20, 0xd4c490, ox, 22.5, oz - 30);
        addObj(portico);

        // Left wing
        var leftWing = makeBox(60, 32, 50, 0xe0d0a8, ox - 90, 16, oz);
        addObj(leftWing);

        // Right wing
        var rightWing = makeBox(60, 32, 50, 0xe0d0a8, ox + 90, 16, oz);
        addObj(rightWing);

        // Roof main
        var roof = makeBox(124, 8, 64, 0x8a7a60, ox, 44, oz);
        addObj(roof);

        // Left wing roof
        var roofL = makeBox(64, 6, 54, 0x8a7a60, ox - 90, 35, oz);
        addObj(roofL);

        // Right wing roof
        var roofR = makeBox(64, 6, 54, 0x8a7a60, ox + 90, 35, oz);
        addObj(roofR);

        // Portico pediment
        var pediment = makeBox(32, 10, 4, 0xd4c490, ox, 50, oz - 30);
        addObj(pediment);

        // Columns on portico (4 columns)
        var ci;
        for (ci = 0; ci < 4; ci++) {
            var col = makeCylinder(1.5, 1.5, 35, 8, 0xf0e8d0, ox - 10 + ci * 7, 17.5, oz - 40);
            addObj(col);
        }

        // Dome on mansion
        var dome = makeSphere(12, 10, 8, 0xa09070, ox, 52, oz);
        addObj(dome);

        // Ornate gateway left pillar
        var gateL = makeBox(6, 20, 6, 0xd4c490, ox - 80, 10, oz + 320);
        addObj(gateL);

        // Ornate gateway right pillar
        var gateR = makeBox(6, 20, 6, 0xd4c490, ox + 80, 10, oz + 320);
        addObj(gateR);

        // Gateway top arch
        var gateTop = makeBox(160, 4, 6, 0xd4c490, ox, 21, oz + 320);
        addObj(gateTop);

        // Gate cap left
        var capL = makeSphere(4, 6, 5, 0xc8b878, ox - 80, 22, oz + 320);
        addObj(capL);

        // Gate cap right
        var capR = makeSphere(4, 6, 5, 0xc8b878, ox + 80, 22, oz + 320);
        addObj(capR);

        // Walled garden
        var gardenFloor = makeBox(200, 0.5, 150, 0x3a6a1a, ox + 300, 0.25, oz - 80);
        addObj(gardenFloor);

        // Walled garden north wall
        var wallN = makeBox(202, 8, 3, 0xb89060, ox + 300, 4, oz - 155);
        addObj(wallN);

        // Walled garden south wall
        var wallS = makeBox(202, 8, 3, 0xb89060, ox + 300, 4, oz - 5);
        addObj(wallS);

        // Walled garden east wall
        var wallE = makeBox(3, 8, 150, 0xb89060, ox + 400, 4, oz - 80);
        addObj(wallE);

        // Walled garden west wall
        var wallW = makeBox(3, 8, 150, 0xb89060, ox + 200, 4, oz - 80);
        addObj(wallW);

        // Garden hedge rows
        var hi;
        for (hi = 0; hi < 4; hi++) {
            var hedge = makeBox(180, 5, 4, 0x2a5a10, ox + 300, 2.5, oz - 130 + hi * 32);
            addObj(hedge);
        }

        // Stable block
        var stable = makeBox(80, 20, 40, 0xc8b890, ox - 200, 10, oz - 200);
        addObj(stable);

        // Stable roof
        var stableRoof = makeBox(84, 6, 44, 0x7a6a50, ox - 200, 23, oz - 200);
        addObj(stableRoof);

        // Drive approach trees
        var ti;
        for (ti = 0; ti < 8; ti++) {
            var trunk = makeCylinder(1, 1, 12, 6, 0x5a3a1a, ox - 60 + ti % 2 * 120, 6, oz + 220 + ti * 20);
            addObj(trunk);
            var canopy = makeSphere(7, 8, 6, 0x2a6a1a, ox - 60 + ti % 2 * 120, 16, oz + 220 + ti * 20);
            addObj(canopy);
        }
    }

    function buildKenilworthRoad() {
        var ox = 12480 + 100;
        var oz = 300;

        // Pitch
        var pitch = makeBox(110, 0.5, 76, 0x3a8a2a, ox, 0.25, oz);
        addObj(pitch);

        // Pitch markings (lighter strips)
        var si;
        for (si = 0; si < 5; si++) {
            var strip = makeBox(110, 0.6, 2, 0x4aaa3a, ox, 0.3, oz - 36 + si * 18);
            addObj(strip);
        }

        // Main stand (Oak Road end - south)
        var mainStand = makeBox(120, 18, 20, 0xee6600, ox, 9, oz + 58);
        addObj(mainStand);

        // Main stand roof
        var mainRoof = makeBox(122, 4, 22, 0x333333, ox, 19, oz + 58);
        addObj(mainRoof);

        // Oak Road end (east)
        var oakStand = makeBox(20, 14, 80, 0xee6600, ox + 65, 7, oz);
        addObj(oakStand);

        // Oak Road roof
        var oakRoof = makeBox(22, 3, 82, 0x444444, ox + 65, 14.5, oz);
        addObj(oakRoof);

        // Kenilworth Road end (west)
        var kenStand = makeBox(20, 14, 80, 0xee6600, ox - 65, 7, oz);
        addObj(kenStand);

        // Kenilworth Road roof
        var kenRoof = makeBox(22, 3, 82, 0x444444, ox - 65, 14.5, oz);
        addObj(kenRoof);

        // Eric Morecambe upper tier (north)
        var ericStand = makeBox(120, 22, 20, 0xee6600, ox, 11, oz - 58);
        addObj(ericStand);

        // Eric Morecambe roof
        var ericRoof = makeBox(122, 4, 22, 0x333333, ox, 24, oz - 58);
        addObj(ericRoof);

        // Floodlight pylons (4 corners)
        var floodPositions = [
            [ox - 60, oz - 45],
            [ox + 60, oz - 45],
            [ox - 60, oz + 45],
            [ox + 60, oz + 45]
        ];
        var fi;
        for (fi = 0; fi < 4; fi++) {
            var pylon = makeCylinder(1, 1.5, 35, 6, 0x888888, floodPositions[fi][0], 17.5, floodPositions[fi][1]);
            addObj(pylon);
            var light = makeBox(8, 3, 3, 0xffffcc, floodPositions[fi][0], 36, floodPositions[fi][1]);
            addObj(light);
        }

        // Scoreboard
        var scoreboard = makeBox(12, 6, 2, 0x111111, ox + 50, 22, oz - 60);
        addObj(scoreboard);

        // Outer walls
        var wallN = makeBox(124, 6, 3, 0xcc5500, ox, 3, oz - 70);
        addObj(wallN);
        var wallS = makeBox(124, 6, 3, 0xcc5500, ox, 3, oz + 70);
        addObj(wallS);
        var wallE2 = makeBox(3, 6, 80, 0xcc5500, ox + 77, 3, oz);
        addObj(wallE2);
        var wallW2 = makeBox(3, 6, 80, 0xcc5500, ox - 77, 3, oz);
        addObj(wallW2);

        // Club shop
        var shop = makeBox(20, 8, 12, 0xee6600, ox - 90, 4, oz + 60);
        addObj(shop);

        // Hat statue / crest marker
        var statueBase = makeCylinder(3, 4, 4, 8, 0x888888, ox - 100, 2, oz - 70);
        addObj(statueBase);
        var statue = makeBox(4, 8, 4, 0xee6600, ox - 100, 8, oz - 70);
        addObj(statue);
        var hatTop = makeCone(4, 5, 8, 0x222222, ox - 100, 15, oz - 70);
        addObj(hatTop);
    }

    function buildHatQuarter() {
        var ox = 12480 - 100;
        var oz = 700;

        // Main mill building 1
        var mill1 = makeBox(80, 30, 50, 0x8a6a5a, ox, 15, oz);
        addObj(mill1);

        // Mill 1 roof
        var mill1Roof = makeBox(82, 5, 52, 0x5a4a3a, ox, 32.5, oz);
        addObj(mill1Roof);

        // Mill 1 chimney
        var chimney1 = makeCylinder(3, 4, 50, 8, 0x6a5a4a, ox + 30, 25, oz + 10);
        addObj(chimney1);

        // Chimney cap
        var cap1 = makeCylinder(4, 3, 4, 8, 0x5a4a3a, ox + 30, 52, oz + 10);
        addObj(cap1);

        // Main mill building 2
        var mill2 = makeBox(60, 24, 40, 0x9a7a6a, ox + 120, 12, oz - 20);
        addObj(mill2);

        // Mill 2 roof
        var mill2Roof = makeBox(62, 4, 42, 0x5a4a3a, ox + 120, 26, oz - 20);
        addObj(mill2Roof);

        // Mill 2 chimney
        var chimney2 = makeCylinder(2.5, 3.5, 40, 8, 0x6a5a4a, ox + 100, 20, oz - 30);
        addObj(chimney2);

        // Hat workshop sheds (row of 4)
        var wi;
        for (wi = 0; wi < 4; wi++) {
            var shed = makeBox(28, 12, 24, 0x7a6a5a, ox - 80 + wi * 32, 6, oz + 100);
            addObj(shed);
            var shedRoof = makeBox(30, 5, 26, 0x5a4a3a, ox - 80 + wi * 32, 14.5, oz + 100);
            addObj(shedRoof);
        }

        // Victorian terrace housing
        var ti2;
        for (ti2 = 0; ti2 < 6; ti2++) {
            var house = makeBox(10, 16, 12, 0xb09080, ox - 160 + ti2 * 12, 8, oz + 40);
            addObj(house);
            var houseRoof = makeBox(11, 6, 13, 0x6a5a4a, ox - 160 + ti2 * 12, 19, oz + 40);
            addObj(houseRoof);
        }

        // Hat shop row
        var si2;
        for (si2 = 0; si2 < 5; si2++) {
            var hatShop = makeBox(14, 10, 10, 0xa08070, ox + 180 + si2 * 16, 5, oz);
            addObj(hatShop);
            // Hat displays in window (small boxes)
            var display = makeBox(4, 4, 2, 0x554433, ox + 180 + si2 * 16, 5, oz - 5.5);
            addObj(display);
        }

        // Water tower
        var waterTower = makeCylinder(2, 2, 28, 8, 0x9a8878, ox + 200, 14, oz + 80);
        addObj(waterTower);
        var waterTank = makeCylinder(8, 8, 10, 10, 0x7a6858, ox + 200, 33, oz + 80);
        addObj(waterTank);

        // Large factory - hat brim stamping works
        var factory = makeBox(100, 20, 60, 0x7a6050, ox - 60, 10, oz - 120);
        addObj(factory);
        var factoryRoof = makeBox(102, 4, 62, 0x5a4a3a, ox - 60, 22, oz - 120);
        addObj(factoryRoof);

        // Factory chimney stack (tall)
        var bigChimney = makeCylinder(3.5, 5, 65, 8, 0x6a5040, ox - 20, 32.5, oz - 140);
        addObj(bigChimney);
        var bigCap = makeCylinder(5, 3.5, 5, 8, 0x5a4030, ox - 20, 67.5, oz - 140);
        addObj(bigCap);

        // Courtyard cobble marker
        var yard = makeBox(60, 0.5, 40, 0x9a8878, ox + 20, 0.25, oz + 60);
        addObj(yard);
    }

    function buildLutonAirport() {
        var ox = 12480 + 500;
        var oz = -200;

        // Runway tarmac
        var runway = makeBox(600, 0.5, 45, 0x333333, ox, 0.25, oz);
        addObj(runway);

        // Runway centreline markings
        var mi;
        for (mi = 0; mi < 20; mi++) {
            var mark = makeBox(20, 0.6, 2, 0xffffff, ox - 285 + mi * 30, 0.3, oz);
            addObj(mark);
        }

        // Taxiway
        var taxiway = makeBox(400, 0.5, 20, 0x444444, ox + 50, 0.25, oz + 80);
        addObj(taxiway);

        // Terminal building
        var terminal = makeBox(180, 18, 60, 0xcccccc, ox - 80, 9, oz - 120);
        addObj(terminal);

        // Terminal roof
        var termRoof = makeBox(182, 5, 62, 0x999999, ox - 80, 20.5, oz - 120);
        addObj(termRoof);

        // Terminal glass front
        var termGlass = makeBox(180, 14, 4, 0x88aacc, ox - 80, 7, oz - 90);
        addObj(termGlass);

        // Control tower base
        var towerBase = makeBox(12, 25, 12, 0xdddddd, ox + 40, 12.5, oz - 130);
        addObj(towerBase);

        // Control tower cab
        var towerCab = makeBox(18, 8, 18, 0x88aacc, ox + 40, 30, oz - 130);
        addObj(towerCab);

        // Control tower roof
        var towerRoof = makeBox(20, 2, 20, 0x666666, ox + 40, 35, oz - 130);
        addObj(towerRoof);

        // Antenna on tower
        var antenna = makeCylinder(0.3, 0.3, 12, 4, 0xaaaaaa, ox + 40, 43, oz - 130);
        addObj(antenna);

        // Parked aircraft (3 planes)
        var pi;
        var planePositions = [
            [ox - 40, oz + 40],
            [ox + 60, oz + 50],
            [ox + 160, oz + 45]
        ];
        for (pi = 0; pi < 3; pi++) {
            // Fuselage
            var fuselage = makeBox(40, 5, 7, 0xeeeeff, planePositions[pi][0], 3.5, planePositions[pi][1]);
            addObj(fuselage);
            // Wings
            var wings = makeBox(12, 2, 50, 0xddddee, planePositions[pi][0], 2, planePositions[pi][1]);
            addObj(wings);
            // Tail fin
            var tail = makeBox(6, 8, 2, 0xddddee, planePositions[pi][0] + 18, 7, planePositions[pi][1]);
            addObj(tail);
            // Nose cone
            var nose = makeCone(3, 8, 6, 0xeeeeff, planePositions[pi][0] - 24, 3.5, planePositions[pi][1]);
            nose.rotation.z = -Math.PI / 2;
            addObj(nose);
            // Engine pod (under left wing)
            var eng1 = makeCylinder(1.5, 1.5, 10, 8, 0x888888, planePositions[pi][0] - 2, 1.5, planePositions[pi][1] - 14);
            eng1.rotation.z = Math.PI / 2;
            addObj(eng1);
            // Engine pod (under right wing)
            var eng2 = makeCylinder(1.5, 1.5, 10, 8, 0x888888, planePositions[pi][0] - 2, 1.5, planePositions[pi][1] + 14);
            eng2.rotation.z = Math.PI / 2;
            addObj(eng2);
        }

        // Fuel depot tanks
        var fdi;
        for (fdi = 0; fdi < 3; fdi++) {
            var tank = makeCylinder(8, 8, 15, 10, 0xccaa44, ox + 200 + fdi * 25, 7.5, oz - 160);
            addObj(tank);
        }

        // Airport perimeter fence (posts)
        var fpi;
        for (fpi = 0; fpi < 20; fpi++) {
            var post = makeBox(1, 5, 1, 0x888888, ox - 300 + fpi * 30, 2.5, oz - 180);
            addObj(post);
        }

        // Car park
        var carpark = makeBox(150, 0.3, 80, 0x555555, ox - 220, 0.15, oz - 130);
        addObj(carpark);

        // Cargo warehouse
        var cargo = makeBox(100, 14, 50, 0xaaaaaa, ox + 250, 7, oz - 60);
        addObj(cargo);

        // Cargo warehouse roof
        var cargoRoof = makeBox(102, 3, 52, 0x888888, ox + 250, 15.5, oz - 60);
        addObj(cargoRoof);
    }

    function buildTownCentre() {
        var ox = 12480 + 0;
        var oz = 150;

        // Arndale shopping centre main block
        var arndale = makeBox(150, 22, 100, 0xc8b898, ox - 200, 11, oz);
        addObj(arndale);

        // Arndale roof
        var arndaleRoof = makeBox(152, 4, 102, 0x9a8a78, ox - 200, 24, oz);
        addObj(arndaleRoof);

        // Arndale entrance canopy
        var canopy = makeBox(40, 5, 15, 0xaa9988, ox - 275, 12, oz);
        addObj(canopy);

        // Glass front panels
        var glassF = makeBox(150, 18, 4, 0x88aacc, ox - 200, 9, oz + 50);
        addObj(glassF);

        // George Street row of buildings
        var gi;
        for (gi = 0; gi < 8; gi++) {
            var bHeight = 12 + (gi % 3) * 6;
            var bldg = makeBox(18, bHeight, 14, 0xc0a888, ox - 80 + gi * 22, bHeight / 2, oz - 80);
            addObj(bldg);
            var bRoof = makeBox(20, 4, 16, 0x8a7860, ox - 80 + gi * 22, bHeight + 2, oz - 80);
            addObj(bRoof);
        }

        // Luton Museum building
        var museum = makeBox(60, 20, 40, 0xd4c8a0, ox + 120, 10, oz + 80);
        addObj(museum);

        // Museum roof
        var museumRoof = makeBox(62, 6, 42, 0xa09070, ox + 120, 23, oz + 80);
        addObj(museumRoof);

        // Museum columns
        var mci;
        for (mci = 0; mci < 4; mci++) {
            var mcol = makeCylinder(1.2, 1.2, 18, 8, 0xe0d4b0, ox + 93 + mci * 7, 9, oz + 60);
            addObj(mcol);
        }

        // Museum steps
        var steps = makeBox(30, 2, 8, 0xc8bcA0, ox + 120, 1, oz + 60);
        addObj(steps);

        // Town hall
        var townHall = makeBox(50, 28, 35, 0xd0c4a0, ox + 220, 14, oz + 30);
        addObj(townHall);

        // Town hall roof
        var townHallRoof = makeBox(52, 5, 37, 0xa09070, ox + 220, 30.5, oz + 30);
        addObj(townHallRoof);

        // Town hall clock tower
        var clockTower = makeBox(10, 40, 10, 0xd4c8a8, ox + 210, 20, oz + 13);
        addObj(clockTower);

        // Clock tower roof (cone)
        var clockRoof = makeCone(7, 12, 4, 0x7a7060, ox + 210, 46, oz + 13);
        addObj(clockRoof);

        // Market square paving
        var square = makeBox(80, 0.3, 60, 0xb8a888, ox - 40, 0.15, oz + 50);
        addObj(square);

        // Market stalls
        var msi;
        for (msi = 0; msi < 6; msi++) {
            var stall = makeBox(10, 4, 8, 0xcc6644, ox - 60 + msi * 14, 2, oz + 50);
            addObj(stall);
            var stallRoof = makeBox(12, 1.5, 10, 0xaa4422, ox - 60 + msi * 14, 5, oz + 50);
            addObj(stallRoof);
        }

        // Landmark tower block (St George's Square)
        var tower = makeBox(20, 60, 20, 0x9898a8, ox + 50, 30, oz - 20);
        addObj(tower);

        // Tower roof
        var towerRoof = makeBox(22, 4, 22, 0x777788, ox + 50, 62, oz - 20);
        addObj(towerRoof);

        // Bus station
        var busStn = makeBox(80, 8, 30, 0xb8b0a0, ox - 300, 4, oz - 40);
        addObj(busStn);

        // Bus station canopy
        var busCan = makeBox(80, 2, 35, 0x9090a0, ox - 300, 9.5, oz - 40);
        addObj(busCan);

        // Buses
        var busi;
        for (busi = 0; busi < 4; busi++) {
            var bus = makeBox(12, 5, 5, 0xee3333, ox - 330 + busi * 0, ox - 330 + busi * 14, 2.5);
            // Redo bus with correct args
            var busObj = makeBox(12, 5, 5, 0xee3333, ox - 340 + busi * 16, 2.5, oz - 25);
            addObj(busObj);
        }

        // Street lamps
        var li;
        for (li = 0; li < 12; li++) {
            var lampPost = makeCylinder(0.3, 0.3, 8, 6, 0x888888, ox - 150 + li * 30, 4, oz - 60);
            addObj(lampPost);
            var lamp = makeSphere(1, 4, 4, 0xffffaa, ox - 150 + li * 30, 8.5, oz - 60);
            addObj(lamp);
        }
    }

    function build() {
        buildGround();
        buildLutonHoo();
        buildKenilworthRoad();
        buildHatQuarter();
        buildLutonAirport();
        buildTownCentre();
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
