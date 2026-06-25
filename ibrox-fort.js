window.IbroxFort = (function() {
    'use strict';

    var WX = 2170;
    var WZ = 2200;

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color);
        return new THREE.Mesh(geo, mat);
    }

    function makeCylinder(rt, rb, h, segs, color) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMaterial(color);
        return new THREE.Mesh(geo, mat);
    }

    function makeCone(r, h, segs, color) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMaterial(color);
        return new THREE.Mesh(geo, mat);
    }

    function makeSphere(r, ws, hs, color) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMaterial(color);
        return new THREE.Mesh(geo, mat);
    }

    function makeWireBox(w, h, d) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: 0xffffff });
        return new THREE.LineSegments(edges, mat);
    }

    function buildStands(group) {
        var standColor = 0x3A3A3A;

        // North stand
        var northStand = makeBox(50, 12, 8, standColor);
        northStand.position.set(WX, 6, WZ - 30);
        group.add(northStand);

        // North stand roof overhang
        var northRoof = makeBox(54, 1.5, 10, 0x2A2A2A);
        northRoof.position.set(WX, 12.75, WZ - 29);
        group.add(northRoof);

        // South stand
        var southStand = makeBox(50, 12, 8, standColor);
        southStand.position.set(WX, 6, WZ + 30);
        group.add(southStand);

        // South stand roof overhang
        var southRoof = makeBox(54, 1.5, 10, 0x2A2A2A);
        southRoof.position.set(WX, 12.75, WZ + 29);
        group.add(southRoof);

        // East stand (shorter side)
        var eastStand = makeBox(8, 12, 50, standColor);
        eastStand.position.set(WX + 28, 6, WZ);
        group.add(eastStand);

        // East stand roof overhang
        var eastRoof = makeBox(10, 1.5, 54, 0x2A2A2A);
        eastRoof.position.set(WX + 27, 12.75, WZ);
        group.add(eastRoof);

        // West stand — main stand (red brick facade)
        var westStand = makeBox(8, 12, 50, standColor);
        westStand.position.set(WX - 28, 6, WZ);
        group.add(westStand);

        // West stand roof overhang
        var westRoof = makeBox(10, 1.5, 54, 0x2A2A2A);
        westRoof.position.set(WX - 27, 12.75, WZ);
        group.add(westRoof);
    }

    function buildMainStandFacade(group) {
        var brickColor = 0xB05050;

        // Main ornate facade frontage
        var facade = makeBox(50, 14, 3, brickColor);
        facade.position.set(WX - 31.5, 7, WZ);
        group.add(facade);

        // Arched window inserts along facade (decorative box inserts)
        var windowColor = 0x1A1A3A;
        var windowPositions = [-20, -13, -6, 0, 6, 13, 20];
        for (var i = 0; i < windowPositions.length; i++) {
            var win = makeBox(3, 4, 0.4, windowColor);
            win.position.set(WX - 31.5, 9, WZ + windowPositions[i]);
            group.add(win);

            // Arch top (small box above window)
            var arch = makeBox(3, 1.2, 0.4, brickColor);
            arch.position.set(WX - 31.5, 11.6, WZ + windowPositions[i]);
            group.add(arch);
        }

        // Clock tower base
        var towerBase = makeBox(4, 20, 4, brickColor);
        towerBase.position.set(WX - 31.5, 10, WZ);
        group.add(towerBase);

        // Clock face (darker square inset on tower)
        var clockFace = makeBox(2.5, 2.5, 0.3, 0x222222);
        clockFace.position.set(WX - 33.65, 18, WZ);
        group.add(clockFace);

        // Clock tower pyramid roof
        var towerRoof = makeCone(3.2, 5, 4, 0x5A2A2A);
        towerRoof.position.set(WX - 31.5, 22.5, WZ);
        group.add(towerRoof);
    }

    function buildPitch(group) {
        var pitchColor = 0x3A7A2A;
        var lineColor = 0xF0F0F0;

        // Main pitch surface (split into sections to avoid PlaneGeometry)
        var pitch = makeBox(44, 0.3, 52, pitchColor);
        pitch.position.set(WX, 0.15, WZ);
        group.add(pitch);

        // Touchline strips — long sides
        var leftLine = makeBox(0.3, 0.35, 52, lineColor);
        leftLine.position.set(WX - 22, 0.175, WZ);
        group.add(leftLine);

        var rightLine = makeBox(0.3, 0.35, 52, lineColor);
        rightLine.position.set(WX + 22, 0.175, WZ);
        group.add(rightLine);

        // Goal line strips — short sides
        var northLine = makeBox(44, 0.35, 0.3, lineColor);
        northLine.position.set(WX, 0.175, WZ - 26);
        group.add(northLine);

        var southLine = makeBox(44, 0.35, 0.3, lineColor);
        southLine.position.set(WX, 0.175, WZ + 26);
        group.add(southLine);

        // Halfway line
        var halfLine = makeBox(44, 0.35, 0.3, lineColor);
        halfLine.position.set(WX, 0.175, WZ);
        group.add(halfLine);

        // Centre circle — approximated with thin box segments
        var circleSegs = 16;
        var circleR = 9.15;
        for (var i = 0; i < circleSegs; i++) {
            var angle = (i / circleSegs) * Math.PI * 2;
            var nextAngle = ((i + 1) / circleSegs) * Math.PI * 2;
            var mx = Math.cos((angle + nextAngle) / 2) * circleR;
            var mz = Math.sin((angle + nextAngle) / 2) * circleR;
            var segLen = 2 * circleR * Math.sin(Math.PI / circleSegs) + 0.1;
            var seg = makeBox(0.25, 0.36, segLen, lineColor);
            seg.position.set(WX + mx, 0.18, WZ + mz);
            seg.rotation.y = -(angle + nextAngle) / 2;
            group.add(seg);
        }

        // Penalty area boxes
        var northPenBox = makeBox(32, 0.35, 0.3, lineColor);
        northPenBox.position.set(WX, 0.175, WZ - 16);
        group.add(northPenBox);

        var northPenLeft = makeBox(0.3, 0.35, 10, lineColor);
        northPenLeft.position.set(WX - 16, 0.175, WZ - 21);
        group.add(northPenLeft);

        var northPenRight = makeBox(0.3, 0.35, 10, lineColor);
        northPenRight.position.set(WX + 16, 0.175, WZ - 21);
        group.add(northPenRight);

        var southPenBox = makeBox(32, 0.35, 0.3, lineColor);
        southPenBox.position.set(WX, 0.175, WZ + 16);
        group.add(southPenBox);

        var southPenLeft = makeBox(0.3, 0.35, 10, lineColor);
        southPenLeft.position.set(WX - 16, 0.175, WZ + 21);
        group.add(southPenLeft);

        var southPenRight = makeBox(0.3, 0.35, 10, lineColor);
        southPenRight.position.set(WX + 16, 0.175, WZ + 21);
        group.add(southPenRight);
    }

    function buildMachineGunNests(group) {
        var sandbagColor = 0x9A9A7A;
        var metalColor = 0x4A4A4A;

        // Four corners of the stadium roof
        var corners = [
            { x: WX - 24, z: WZ - 25 },
            { x: WX + 24, z: WZ - 25 },
            { x: WX - 24, z: WZ + 25 },
            { x: WX + 24, z: WZ + 25 }
        ];

        for (var i = 0; i < corners.length; i++) {
            var cx = corners[i].x;
            var cz = corners[i].z;
            var roofY = 13.5;

            // Sandbag bunker base
            var bunkerBase = makeBox(4, 2, 4, sandbagColor);
            bunkerBase.position.set(cx, roofY + 1, cz);
            group.add(bunkerBase);

            // Sandbag front wall
            var frontWall = makeBox(4, 1.2, 0.6, sandbagColor);
            frontWall.position.set(cx, roofY + 2.6, cz + 2);
            group.add(frontWall);

            // Sandbag side walls
            var leftWall = makeBox(0.6, 1.2, 3, sandbagColor);
            leftWall.position.set(cx - 2, roofY + 2.6, cz);
            group.add(leftWall);

            var rightWall = makeBox(0.6, 1.2, 3, sandbagColor);
            rightWall.position.set(cx + 2, roofY + 2.6, cz);
            group.add(rightWall);

            // Machine gun barrel (cylinder)
            var barrel = makeCylinder(0.12, 0.12, 2.5, 6, metalColor);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(cx, roofY + 2.8, cz + 1.5);
            group.add(barrel);

            // Gun mount base
            var mount = makeCylinder(0.5, 0.5, 0.5, 8, metalColor);
            mount.position.set(cx, roofY + 2.25, cz + 0.5);
            group.add(mount);

            // Spent shell pile approximation (small sphere cluster)
            var shells = makeSphere(0.3, 4, 4, 0xB8860B);
            shells.position.set(cx - 0.5, roofY + 2.3, cz - 0.5);
            group.add(shells);
        }
    }

    function buildMortarBattery(group) {
        var tubeColor = 0x3A3A3A;
        var baseColor = 0x6A6A6A;
        var pitchY = 0.3;

        // Three mortars in a ring around the pitch centre circle
        var mortarAngles = [0, Math.PI * 2 / 3, Math.PI * 4 / 3];
        var mortarRadius = 5;

        for (var i = 0; i < mortarAngles.length; i++) {
            var angle = mortarAngles[i];
            var mx = WX + Math.cos(angle) * mortarRadius;
            var mz = WZ + Math.sin(angle) * mortarRadius;

            // Mortar baseplate
            var baseplate = makeBox(1.5, 0.2, 1.5, baseColor);
            baseplate.position.set(mx, pitchY + 0.1, mz);
            group.add(baseplate);

            // Bipod legs (two thin cylinders)
            var legL = makeCylinder(0.06, 0.06, 1.0, 4, baseColor);
            legL.rotation.z = 0.35;
            legL.position.set(mx - 0.3, pitchY + 0.6, mz);
            group.add(legL);

            var legR = makeCylinder(0.06, 0.06, 1.0, 4, baseColor);
            legR.rotation.z = -0.35;
            legR.position.set(mx + 0.3, pitchY + 0.6, mz);
            group.add(legR);

            // Mortar tube barrel (angled)
            var tube = makeCylinder(0.18, 0.22, 1.8, 8, tubeColor);
            tube.rotation.x = 0.7;
            tube.position.set(mx, pitchY + 1.1, mz - 0.3);
            group.add(tube);

            // Muzzle cap
            var muzzle = makeCylinder(0.22, 0.18, 0.2, 8, 0x2A2A2A);
            muzzle.rotation.x = 0.7;
            muzzle.position.set(mx, pitchY + 1.9, mz - 0.85);
            group.add(muzzle);

            // Ammo round beside each mortar
            var round = makeSphere(0.18, 6, 6, 0x4A4A4A);
            round.position.set(mx + 0.6, pitchY + 0.48, mz + 0.3);
            group.add(round);
        }
    }

    function buildAmmoStore(group) {
        var concreteColor = 0x5A5A5A;
        var doorColor = 0x3A3A3A;
        var brassColor = 0x8B7A30;

        // Under the main (west) stand — reinforced concrete box
        var store = makeBox(8, 4, 8, concreteColor);
        store.position.set(WX - 27, 2, WZ);
        group.add(store);

        // Thick blast walls around it
        var blastN = makeBox(10, 4.5, 1.5, concreteColor);
        blastN.position.set(WX - 27, 2.25, WZ - 5.25);
        group.add(blastN);

        var blastS = makeBox(10, 4.5, 1.5, concreteColor);
        blastS.position.set(WX - 27, 2.25, WZ + 5.25);
        group.add(blastS);

        var blastE = makeBox(1.5, 4.5, 10, concreteColor);
        blastE.position.set(WX - 22.25, 2.25, WZ);
        group.add(blastE);

        // Blast doors (double doors, box slabs)
        var doorL = makeBox(2, 3.2, 0.4, doorColor);
        doorL.position.set(WX - 32.2, 1.6, WZ - 1.1);
        group.add(doorL);

        var doorR = makeBox(2, 3.2, 0.4, doorColor);
        doorR.position.set(WX - 32.2, 1.6, WZ + 1.1);
        group.add(doorR);

        // Door hinges (small cylinders)
        var hingeL = makeCylinder(0.15, 0.15, 0.5, 6, brassColor);
        hingeL.rotation.x = Math.PI / 2;
        hingeL.position.set(WX - 32.2, 1.6, WZ - 2.05);
        group.add(hingeL);

        var hingeR = makeCylinder(0.15, 0.15, 0.5, 6, brassColor);
        hingeR.rotation.x = Math.PI / 2;
        hingeR.position.set(WX - 32.2, 1.6, WZ + 2.05);
        group.add(hingeR);

        // Ventilation shaft on roof of store
        var vent = makeCylinder(0.4, 0.4, 1.2, 6, concreteColor);
        vent.position.set(WX - 25, 4.6, WZ + 2);
        group.add(vent);

        var ventCap = makeBox(1.2, 0.3, 1.2, doorColor);
        ventCap.position.set(WX - 25, 5.35, WZ + 2);
        group.add(ventCap);

        // Ammo crates stacked inside (visible as box protrusions at door)
        var crateA = makeBox(1.0, 0.8, 0.7, 0x5A4A2A);
        crateA.position.set(WX - 31.8, 0.4, WZ - 0.4);
        group.add(crateA);

        var crateB = makeBox(1.0, 0.8, 0.7, 0x5A4A2A);
        crateB.position.set(WX - 31.8, 1.2, WZ - 0.4);
        group.add(crateB);

        var crateC = makeBox(1.0, 0.8, 0.7, 0x5A4A2A);
        crateC.position.set(WX - 31.8, 0.4, WZ + 0.4);
        group.add(crateC);
    }

    function buildWireframe(group) {
        // Wireframe outlines on key structural elements for visual fidelity
        var outlineStore = makeWireBox(8.1, 4.1, 8.1);
        outlineStore.position.set(WX - 27, 2, WZ);
        group.add(outlineStore);
    }

    function buildFloodlights(group) {
        var poleColor = 0x9A9A9A;
        var lightColor = 0xFFFF88;

        // Four floodlight towers at pitch corners
        var polePositions = [
            { x: WX - 23, z: WZ - 27 },
            { x: WX + 23, z: WZ - 27 },
            { x: WX - 23, z: WZ + 27 },
            { x: WX + 23, z: WZ + 27 }
        ];

        for (var i = 0; i < polePositions.length; i++) {
            var px = polePositions[i].x;
            var pz = polePositions[i].z;

            // Pole
            var pole = makeCylinder(0.25, 0.35, 18, 6, poleColor);
            pole.position.set(px, 9, pz);
            group.add(pole);

            // Light cluster box
            var lightCluster = makeBox(3, 0.8, 1.5, 0x5A5A5A);
            lightCluster.position.set(px, 18.4, pz);
            group.add(lightCluster);

            // Individual light bulbs
            var bulbOffsets = [-0.9, 0, 0.9];
            for (var j = 0; j < bulbOffsets.length; j++) {
                var bulb = makeSphere(0.22, 5, 5, lightColor);
                bulb.position.set(px + bulbOffsets[j], 18.4, pz - 0.85);
                group.add(bulb);
            }
        }
    }

    function buildDefencePerimeter(group) {
        var barrierColor = 0x7A7A6A;
        var metalColor = 0x4A5A4A;

        // Outer defensive concrete barrier segments around the stadium exterior
        var barrierN = makeBox(60, 1.5, 1.0, barrierColor);
        barrierN.position.set(WX, 0.75, WZ - 40);
        group.add(barrierN);

        var barrierS = makeBox(60, 1.5, 1.0, barrierColor);
        barrierS.position.set(WX, 0.75, WZ + 40);
        group.add(barrierS);

        var barrierW = makeBox(1.0, 1.5, 60, barrierColor);
        barrierW.position.set(WX - 40, 0.75, WZ);
        group.add(barrierW);

        var barrierE = makeBox(1.0, 1.5, 60, barrierColor);
        barrierE.position.set(WX + 40, 0.75, WZ);
        group.add(barrierE);

        // Razor wire approximation — thin box strips on top of barriers
        var wireColor = 0xC0C0C0;
        for (var i = 0; i < 6; i++) {
            var wireN = makeBox(8, 0.1, 0.3, wireColor);
            wireN.position.set(WX - 20 + i * 8, 1.55, WZ - 40);
            group.add(wireN);

            var wireS = makeBox(8, 0.1, 0.3, wireColor);
            wireS.position.set(WX - 20 + i * 8, 1.55, WZ + 40);
            group.add(wireS);
        }

        for (var k = 0; k < 6; k++) {
            var wireW = makeBox(0.3, 0.1, 8, wireColor);
            wireW.position.set(WX - 40, 1.55, WZ - 20 + k * 8);
            group.add(wireW);

            var wireE = makeBox(0.3, 0.1, 8, wireColor);
            wireE.position.set(WX + 40, 1.55, WZ - 20 + k * 8);
            group.add(wireE);
        }

        // Sentry posts — small reinforced boxes at corners of perimeter
        var sentryPositions = [
            { x: WX - 40, z: WZ - 40 },
            { x: WX + 40, z: WZ - 40 },
            { x: WX - 40, z: WZ + 40 },
            { x: WX + 40, z: WZ + 40 }
        ];

        for (var s = 0; s < sentryPositions.length; s++) {
            var sx = sentryPositions[s].x;
            var sz = sentryPositions[s].z;

            var sentryBox = makeBox(2.5, 3, 2.5, barrierColor);
            sentryBox.position.set(sx, 1.5, sz);
            group.add(sentryBox);

            var sentryRoof = makeBox(3, 0.3, 3, metalColor);
            sentryRoof.position.set(sx, 3.15, sz);
            group.add(sentryRoof);

            // Observation slit
            var slit = makeBox(1.5, 0.25, 0.15, 0x111111);
            slit.position.set(sx, 1.8, sz - 1.28);
            group.add(slit);
        }
    }

    function buildGroundwork(group) {
        var groundColor = 0x4A4A4A;
        var concreteColor = 0x5A5A5A;

        // Stadium concourse (surrounding pitch, inside stands)
        var concourseN = makeBox(50, 0.4, 8, concreteColor);
        concourseN.position.set(WX, 0.2, WZ - 28);
        group.add(concourseN);

        var concourseS = makeBox(50, 0.4, 8, concreteColor);
        concourseS.position.set(WX, 0.2, WZ + 28);
        group.add(concourseS);

        var concourseE = makeBox(8, 0.4, 50, concreteColor);
        concourseE.position.set(WX + 28, 0.2, WZ);
        group.add(concourseE);

        var concourseW = makeBox(8, 0.4, 50, concreteColor);
        concourseW.position.set(WX - 28, 0.2, WZ);
        group.add(concourseW);

        // Exterior paved area
        var extPaveN = makeBox(70, 0.2, 8, groundColor);
        extPaveN.position.set(WX, 0.1, WZ - 38);
        group.add(extPaveN);

        var extPaveS = makeBox(70, 0.2, 8, groundColor);
        extPaveS.position.set(WX, 0.1, WZ + 38);
        group.add(extPaveS);

        var extPaveW = makeBox(8, 0.2, 70, groundColor);
        extPaveW.position.set(WX - 38, 0.1, WZ);
        group.add(extPaveW);

        var extPaveE = makeBox(8, 0.2, 70, groundColor);
        extPaveE.position.set(WX + 38, 0.1, WZ);
        group.add(extPaveE);
    }

    function create() {
        var group = new THREE.Group();

        buildGroundwork(group);
        buildStands(group);
        buildMainStandFacade(group);
        buildPitch(group);
        buildMachineGunNests(group);
        buildMortarBattery(group);
        buildAmmoStore(group);
        buildFloodlights(group);
        buildDefencePerimeter(group);
        buildWireframe(group);

        return group;
    }

    return {
        create: create,
        worldX: WX,
        worldZ: WZ
    };

}());
