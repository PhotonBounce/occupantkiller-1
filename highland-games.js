window.HighlandGames = (function() {
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

    function makeMesh(geo, color) {
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
    }

    function build() {
        buildArena();
        buildCaberToss();
        buildHighlandDancing();
        buildBraemarCastle();
        buildCairngorms();
        buildDeeside();
    }

    function buildArena() {
        var x = 15200;
        // Grass arena floor (oval approximated by wide box)
        var grass = makeMesh(new THREE.BoxGeometry(120, 1, 80), 0x3a7d3a);
        grass.position.set(x, 0, 0);
        addObj(grass);

        // Arena perimeter wall
        var wallN = makeMesh(new THREE.BoxGeometry(120, 2, 2), 0xc8b97a);
        wallN.position.set(x, 1, -41);
        addObj(wallN);
        var wallS = makeMesh(new THREE.BoxGeometry(120, 2, 2), 0xc8b97a);
        wallS.position.set(x, 1, 41);
        addObj(wallS);
        var wallE = makeMesh(new THREE.BoxGeometry(2, 2, 80), 0xc8b97a);
        wallE.position.set(x + 61, 1, 0);
        addObj(wallE);
        var wallW = makeMesh(new THREE.BoxGeometry(2, 2, 80), 0xc8b97a);
        wallW.position.set(x - 61, 1, 0);
        addObj(wallW);

        // Grandstand tiered seating — north side, 3 tiers
        var tierColors = [0x8b6914, 0x7a5c10, 0x6b4f0e];
        var i;
        for (i = 0; i < 3; i++) {
            var tier = makeMesh(new THREE.BoxGeometry(100, 3, 8), tierColors[i]);
            tier.position.set(x, 1.5 + i * 3, -50 - i * 8);
            addObj(tier);
        }
        // Grandstand roof
        var standRoof = makeMesh(new THREE.BoxGeometry(104, 1, 26), 0x5a4010);
        standRoof.position.set(x, 12, -66);
        addObj(standRoof);

        // Grandstand south side
        for (i = 0; i < 2; i++) {
            var stierS = makeMesh(new THREE.BoxGeometry(80, 3, 6), 0x8b6914);
            stierS.position.set(x, 1.5 + i * 3, 49 + i * 6);
            addObj(stierS);
        }

        // Royal Pavilion — blue/white tent structure
        var pavilionBase = makeMesh(new THREE.BoxGeometry(20, 4, 14), 0xffffff);
        pavilionBase.position.set(x - 40, 2, -55);
        addObj(pavilionBase);
        var pavilionRoof = makeMesh(new THREE.ConeGeometry(14, 8, 4), 0x003399);
        pavilionRoof.position.set(x - 40, 8, -55);
        addObj(pavilionRoof);
        // Pavilion side stripes (boxes)
        var stripe1 = makeMesh(new THREE.BoxGeometry(20, 4, 2), 0x003399);
        stripe1.position.set(x - 40, 2, -52);
        addObj(stripe1);
        var stripe2 = makeMesh(new THREE.BoxGeometry(20, 4, 2), 0x003399);
        stripe2.position.set(x - 40, 2, -58);
        addObj(stripe2);
        // Pavilion flagpole
        var pavPole = makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 10, 6), 0xaaaaaa);
        pavPole.position.set(x - 40, 12, -55);
        addObj(pavPole);
        var pavFlag = makeMesh(new THREE.BoxGeometry(4, 2.5, 0.1), 0x003399);
        pavFlag.position.set(x - 38, 16.5, -55);
        addObj(pavFlag);

        // Flag bunting — LineSegments strung across arena
        var buntingPoints = [];
        var j;
        for (j = 0; j <= 20; j++) {
            var bx = x - 60 + j * 6;
            var by = 8 + Math.sin(j * 0.5) * 1.5;
            buntingPoints.push(bx, by, -43);
            if (j < 20) {
                buntingPoints.push(bx + 6, 8 + Math.sin((j + 1) * 0.5) * 1.5, -43);
            }
        }
        var bGeo = new THREE.BufferGeometry();
        bGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buntingPoints), 3));
        var bLine = new THREE.LineSegments(bGeo, new THREE.MeshLambertMaterial({ color: 0xff4400 }));
        scene.add(bLine);
        objects.push(bLine);

        // Cross bunting second row
        var buntingPoints2 = [];
        for (j = 0; j <= 20; j++) {
            var bx2 = x - 60 + j * 6;
            var by2 = 8 + Math.cos(j * 0.6) * 1.5;
            buntingPoints2.push(bx2, by2, 43);
            if (j < 20) {
                buntingPoints2.push(bx2 + 6, 8 + Math.cos((j + 1) * 0.6) * 1.5, 43);
            }
        }
        var bGeo2 = new THREE.BufferGeometry();
        bGeo2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buntingPoints2), 3));
        var bLine2 = new THREE.LineSegments(bGeo2, new THREE.MeshLambertMaterial({ color: 0xffcc00 }));
        scene.add(bLine2);
        objects.push(bLine2);

        // Scoreboard
        var sbPost1 = makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 12, 6), 0x5a3a1a);
        sbPost1.position.set(x + 55, 6, -40);
        addObj(sbPost1);
        var sbPost2 = makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 12, 6), 0x5a3a1a);
        sbPost2.position.set(x + 55, 6, -28);
        addObj(sbPost2);
        var sbBoard = makeMesh(new THREE.BoxGeometry(1, 8, 14), 0x1a1a2e);
        sbBoard.position.set(x + 55.5, 10, -34);
        addObj(sbBoard);
        var sbText = makeMesh(new THREE.BoxGeometry(0.5, 5, 10), 0xffff00);
        sbText.position.set(x + 56, 10, -34);
        addObj(sbText);

        // Flagpoles around arena
        var flagAngles = [0, 1, 2, 3, 4, 5, 6, 7];
        for (i = 0; i < flagAngles.length; i++) {
            var fa = flagAngles[i] * (Math.PI * 2 / 8);
            var fpx = x + Math.cos(fa) * 65;
            var fpz = Math.sin(fa) * 45;
            var fpole = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 14, 6), 0xcccccc);
            fpole.position.set(fpx, 7, fpz);
            addObj(fpole);
            var fcolors = [0x003399, 0xff0000, 0xffffff, 0x009900, 0x003399, 0xff0000, 0xffffff, 0x009900];
            var flag = makeMesh(new THREE.BoxGeometry(0.1, 3, 5), fcolors[i]);
            flag.position.set(fpx, 13, fpz + 2.5);
            addObj(flag);
        }
    }

    function buildCaberToss() {
        var x = 15200;
        var zBase = 80;

        // Landing mat area
        var mat = makeMesh(new THREE.BoxGeometry(30, 0.5, 20), 0x8b7355);
        mat.position.set(x + 20, 0.25, zBase + 10);
        addObj(mat);

        // Caber (massive wooden pole)
        var caber = makeMesh(new THREE.CylinderGeometry(0.5, 0.8, 28, 8), 0x8b5a1a);
        caber.position.set(x + 10, 14, zBase);
        caber.rotation.z = Math.PI * 0.35;
        caber.rotation.y = 0.3;
        addObj(caber);

        // Competitor 1 — main thrower: cylinder body + sphere head
        var body1 = makeMesh(new THREE.CylinderGeometry(0.7, 0.7, 3.5, 8), 0x2244aa);
        body1.position.set(x + 5, 1.75, zBase);
        addObj(body1);
        var head1 = makeMesh(new THREE.SphereGeometry(0.6, 8, 8), 0xf4c27f);
        head1.position.set(x + 5, 4.2, zBase);
        addObj(head1);
        // Arms (cylinders)
        var arm1L = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 2.5, 6), 0x2244aa);
        arm1L.position.set(x + 5, 3, zBase - 1);
        arm1L.rotation.z = 1.2;
        addObj(arm1L);
        var arm1R = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 2.5, 6), 0x2244aa);
        arm1R.position.set(x + 5, 3, zBase + 1);
        arm1R.rotation.z = -0.8;
        addObj(arm1R);
        // Kilt
        var kilt1 = makeMesh(new THREE.CylinderGeometry(0.9, 1.1, 1.5, 8), 0x8b0000);
        kilt1.position.set(x + 5, 0.75, zBase);
        addObj(kilt1);

        // Competitor 2 — preparing to throw
        var body2 = makeMesh(new THREE.CylinderGeometry(0.7, 0.7, 3.5, 8), 0x22aa44);
        body2.position.set(x - 5, 1.75, zBase + 5);
        addObj(body2);
        var head2 = makeMesh(new THREE.SphereGeometry(0.6, 8, 8), 0xf4c27f);
        head2.position.set(x - 5, 4.2, zBase + 5);
        addObj(head2);
        var kilt2 = makeMesh(new THREE.CylinderGeometry(0.9, 1.1, 1.5, 8), 0x006600);
        kilt2.position.set(x - 5, 0.75, zBase + 5);
        addObj(kilt2);

        // Spare caber on ground
        var caberGround = makeMesh(new THREE.CylinderGeometry(0.5, 0.8, 28, 8), 0x8b5a1a);
        caberGround.position.set(x - 15, 0.4, zBase + 8);
        caberGround.rotation.z = Math.PI * 0.5;
        caberGround.rotation.y = 0.5;
        addObj(caberGround);

        // Judges tent
        var judgeTent = makeMesh(new THREE.BoxGeometry(10, 4, 6), 0xffffff);
        judgeTent.position.set(x + 35, 2, zBase);
        addObj(judgeTent);
        var judgeTentRoof = makeMesh(new THREE.ConeGeometry(7, 4, 4), 0xff0000);
        judgeTentRoof.position.set(x + 35, 6, zBase);
        addObj(judgeTentRoof);

        // Measurement markers
        var k;
        for (k = 0; k < 5; k++) {
            var marker = makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 2, 6), 0xff6600);
            marker.position.set(x + 18 + k * 4, 1, zBase + 10);
            addObj(marker);
        }
    }

    function buildHighlandDancing() {
        var x = 15200;
        var zBase = 130;

        // Dance platform
        var platform = makeMesh(new THREE.BoxGeometry(25, 0.8, 25), 0xc8a05a);
        platform.position.set(x, 0.4, zBase);
        addObj(platform);
        // Platform border
        var platBorderN = makeMesh(new THREE.BoxGeometry(25, 0.5, 0.5), 0x8b6914);
        platBorderN.position.set(x, 0.9, zBase - 12.5);
        addObj(platBorderN);
        var platBorderS = makeMesh(new THREE.BoxGeometry(25, 0.5, 0.5), 0x8b6914);
        platBorderS.position.set(x, 0.9, zBase + 12.5);
        addObj(platBorderS);
        var platBorderE = makeMesh(new THREE.BoxGeometry(0.5, 0.5, 25), 0x8b6914);
        platBorderE.position.set(x + 12.5, 0.9, zBase);
        addObj(platBorderE);
        var platBorderW = makeMesh(new THREE.BoxGeometry(0.5, 0.5, 25), 0x8b6914);
        platBorderW.position.set(x - 12.5, 0.9, zBase);
        addObj(platBorderW);

        // Dancers on platform (4 dancers in positions)
        var dancerPositions = [
            [x - 5, zBase - 5],
            [x + 5, zBase - 5],
            [x - 5, zBase + 5],
            [x + 5, zBase + 5]
        ];
        var dancerColors = [0xcc2244, 0x2244cc, 0xcc8800, 0x228844];
        var i;
        for (i = 0; i < 4; i++) {
            var dbody = makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 2.8, 8), dancerColors[i]);
            dbody.position.set(dancerPositions[i][0], 2.2, dancerPositions[i][1]);
            addObj(dbody);
            var dhead = makeMesh(new THREE.SphereGeometry(0.5, 8, 8), 0xf4c27f);
            dhead.position.set(dancerPositions[i][0], 3.9, dancerPositions[i][1]);
            addObj(dhead);
            var dkilt = makeMesh(new THREE.CylinderGeometry(0.7, 0.9, 1.2, 8), 0x660000);
            dkilt.position.set(dancerPositions[i][0], 1.4, dancerPositions[i][1]);
            addObj(dkilt);
        }

        // Pipers in a circle around the platform
        var piperCount = 6;
        for (i = 0; i < piperCount; i++) {
            var pa = i * (Math.PI * 2 / piperCount);
            var px = x + Math.cos(pa) * 18;
            var pz = zBase + Math.sin(pa) * 18;
            var pbody = makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 3, 8), 0x333333);
            pbody.position.set(px, 1.5, pz);
            addObj(pbody);
            var phead = makeMesh(new THREE.SphereGeometry(0.5, 8, 8), 0xf4c27f);
            phead.position.set(px, 3.3, pz);
            addObj(phead);
            // Bagpipes (small box)
            var pipes = makeMesh(new THREE.BoxGeometry(0.8, 0.8, 1.5), 0x8b4513);
            pipes.position.set(px + Math.cos(pa) * 0.5, 2.5, pz + Math.sin(pa) * 0.5);
            addObj(pipes);
            // Pipe drone (cylinder)
            var drone = makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 6), 0x5a2d0c);
            drone.position.set(px + Math.cos(pa) * 0.3, 3, pz + Math.sin(pa) * 0.3);
            drone.rotation.z = 0.5;
            addObj(drone);
            // Bearskin hat
            var hat = makeMesh(new THREE.CylinderGeometry(0.45, 0.45, 0.9, 8), 0x111111);
            hat.position.set(px, 3.9, pz);
            addObj(hat);
        }

        // Spectator rows around dancing area
        var specColors = [0x4466aa, 0xaa4422, 0x448844, 0xaa8822];
        for (i = 0; i < 16; i++) {
            var srow = Math.floor(i / 4);
            var scol = i % 4;
            var sbody = makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 2.2, 6), specColors[scol % 4]);
            sbody.position.set(x - 25 + scol * 3, 1.1, zBase + 18 + srow * 3);
            addObj(sbody);
            var shead = makeMesh(new THREE.SphereGeometry(0.4, 6, 6), 0xf0c070);
            shead.position.set(x - 25 + scol * 3, 2.5, zBase + 18 + srow * 3);
            addObj(shead);
        }

        // Trophy table
        var table = makeMesh(new THREE.BoxGeometry(6, 1, 3), 0xc8a06a);
        table.position.set(x, 0.5, zBase - 20);
        addObj(table);
        var tableLegs = makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 6), 0x8b6914);
        tableLegs.position.set(x, 0, zBase - 20);
        addObj(tableLegs);
        // Trophies (small cylinders + spheres)
        var trophyPositions = [-2, 0, 2];
        for (i = 0; i < 3; i++) {
            var tbase = makeMesh(new THREE.CylinderGeometry(0.3, 0.4, 0.8, 8), 0xd4a017);
            tbase.position.set(x + trophyPositions[i], 1.4, zBase - 20);
            addObj(tbase);
            var tcup = makeMesh(new THREE.CylinderGeometry(0.4, 0.2, 0.6, 8), 0xd4a017);
            tcup.position.set(x + trophyPositions[i], 2.1, zBase - 20);
            addObj(tcup);
        }
    }

    function buildBraemarCastle() {
        var x = 15200;
        var zBase = -120;

        // Main tower house
        var tower = makeMesh(new THREE.BoxGeometry(16, 24, 16), 0x8a8070);
        tower.position.set(x - 80, 12, zBase);
        addObj(tower);
        // Tower battlements
        var i;
        for (i = 0; i < 5; i++) {
            var merlonN = makeMesh(new THREE.BoxGeometry(2, 3, 1), 0x8a8070);
            merlonN.position.set(x - 88 + i * 4, 25.5, zBase - 8);
            addObj(merlonN);
            var merlonS = makeMesh(new THREE.BoxGeometry(2, 3, 1), 0x8a8070);
            merlonS.position.set(x - 88 + i * 4, 25.5, zBase + 8);
            addObj(merlonS);
        }
        for (i = 0; i < 5; i++) {
            var merlonE = makeMesh(new THREE.BoxGeometry(1, 3, 2), 0x8a8070);
            merlonE.position.set(x - 72, 25.5, zBase - 8 + i * 4);
            addObj(merlonE);
            var merlonW = makeMesh(new THREE.BoxGeometry(1, 3, 2), 0x8a8070);
            merlonW.position.set(x - 88, 25.5, zBase - 8 + i * 4);
            addObj(merlonW);
        }

        // Round stair tower (Z-plan feature)
        var stairTower = makeMesh(new THREE.CylinderGeometry(4, 4, 26, 10), 0x7a7060);
        stairTower.position.set(x - 88, 13, zBase - 8);
        addObj(stairTower);
        var stairCap = makeMesh(new THREE.ConeGeometry(5, 6, 10), 0x5a4a3a);
        stairCap.position.set(x - 88, 29, zBase - 8);
        addObj(stairCap);

        // Corner turrets
        var turretPositions = [
            [x - 72, zBase + 8],
            [x - 72, zBase - 8],
            [x - 88, zBase + 8]
        ];
        for (i = 0; i < turretPositions.length; i++) {
            var turret = makeMesh(new THREE.CylinderGeometry(2.5, 2.5, 8, 8), 0x7a7060);
            turret.position.set(turretPositions[i][0], 28, turretPositions[i][1]);
            addObj(turret);
            var turretCap = makeMesh(new THREE.ConeGeometry(3, 5, 8), 0x5a4a3a);
            turretCap.position.set(turretPositions[i][0], 35, turretPositions[i][1]);
            addObj(turretCap);
        }

        // Star-shaped defensive outwork (Z-plan)
        var starPoints = [0, 1, 2, 3, 4, 5];
        for (i = 0; i < starPoints.length; i++) {
            var sa = i * (Math.PI / 3);
            var starWall = makeMesh(new THREE.BoxGeometry(12, 5, 2), 0x6a6050);
            starWall.position.set(x - 80 + Math.cos(sa) * 20, 2.5, zBase + Math.sin(sa) * 20);
            starWall.rotation.y = sa;
            addObj(starWall);
        }

        // Outwork bastions at star points
        for (i = 0; i < 6; i++) {
            var ba = i * (Math.PI / 3) + Math.PI / 6;
            var bastion = makeMesh(new THREE.BoxGeometry(5, 6, 5), 0x6a6050);
            bastion.position.set(x - 80 + Math.cos(ba) * 26, 3, zBase + Math.sin(ba) * 26);
            addObj(bastion);
        }

        // Castle gate
        var gate = makeMesh(new THREE.BoxGeometry(6, 10, 2), 0x5a5040);
        gate.position.set(x - 80, 5, zBase + 10);
        addObj(gate);
        var gateArch = makeMesh(new THREE.CylinderGeometry(3, 3, 2, 8, 1, false, 0, Math.PI), 0x5a5040);
        gateArch.position.set(x - 80, 10, zBase + 10);
        gateArch.rotation.x = Math.PI * 0.5;
        addObj(gateArch);

        // Castle flag
        var castlePole = makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 8, 6), 0xaaaaaa);
        castlePole.position.set(x - 80, 28, zBase);
        addObj(castlePole);
        var castleFlag = makeMesh(new THREE.BoxGeometry(4, 2.5, 0.1), 0xcc0000);
        castleFlag.position.set(x - 78, 33, zBase);
        addObj(castleFlag);

        // Surrounding walls (curtain wall)
        var cwN = makeMesh(new THREE.BoxGeometry(50, 6, 2), 0x7a7060);
        cwN.position.set(x - 80, 3, zBase - 35);
        addObj(cwN);
        var cwS = makeMesh(new THREE.BoxGeometry(50, 6, 2), 0x7a7060);
        cwS.position.set(x - 80, 3, zBase + 35);
        addObj(cwS);
        var cwW = makeMesh(new THREE.BoxGeometry(2, 6, 70), 0x7a7060);
        cwW.position.set(x - 105, 3, zBase);
        addObj(cwW);
        var cwE = makeMesh(new THREE.BoxGeometry(2, 6, 70), 0x7a7060);
        cwE.position.set(x - 55, 3, zBase);
        addObj(cwE);

        // Mar Lodge estate house
        var lodgeMain = makeMesh(new THREE.BoxGeometry(28, 12, 18), 0xd4c8a8);
        lodgeMain.position.set(x - 160, 6, zBase - 20);
        addObj(lodgeMain);
        var lodgeRoof = makeMesh(new THREE.ConeGeometry(20, 8, 4), 0x8b6914);
        lodgeRoof.position.set(x - 160, 16, zBase - 20);
        addObj(lodgeRoof);
        var lodgeTowerL = makeMesh(new THREE.CylinderGeometry(3, 3, 16, 8), 0xd4c8a8);
        lodgeTowerL.position.set(x - 148, 8, zBase - 20);
        addObj(lodgeTowerL);
        var lodgeTowerR = makeMesh(new THREE.CylinderGeometry(3, 3, 16, 8), 0xd4c8a8);
        lodgeTowerR.position.set(x - 172, 8, zBase - 20);
        addObj(lodgeTowerR);
        var lodgeTowerLCap = makeMesh(new THREE.ConeGeometry(4, 5, 8), 0x8b6914);
        lodgeTowerLCap.position.set(x - 148, 19, zBase - 20);
        addObj(lodgeTowerLCap);
        var lodgeTowerRCap = makeMesh(new THREE.ConeGeometry(4, 5, 8), 0x8b6914);
        lodgeTowerRCap.position.set(x - 172, 19, zBase - 20);
        addObj(lodgeTowerRCap);
    }

    function buildCairngorms() {
        var x = 15200;

        // Extensive plateau range background — multiple overlapping mountain shapes
        var mountainData = [
            // [relX, relZ, radiusBase, radiusTop, height, color]
            [0,    -300, 100, 20, 180, 0x7a8a7a],
            [60,   -280, 90,  15, 165, 0x8a9a8a],
            [-70,  -290, 85,  18, 158, 0x7a8a7a],
            [130,  -270, 80,  12, 155, 0x8a9a8a],
            [-140, -285, 88,  16, 162, 0x7a7a8a],
            [200,  -260, 75,  10, 148, 0x8a8a7a],
            [-200, -275, 78,  14, 152, 0x7a8a7a],
            [280,  -250, 70,  8,  140, 0x8a9a8a],
            [-280, -260, 72,  11, 144, 0x7a8a7a]
        ];
        var i;
        for (i = 0; i < mountainData.length; i++) {
            var md = mountainData[i];
            var mtn = makeMesh(new THREE.CylinderGeometry(md[3], md[2], md[4], 10), md[5]);
            mtn.position.set(x + md[0], md[4] / 2, md[1]);
            addObj(mtn);
        }

        // Ben Macdui summit (highest point — special peak)
        var benMacdui = makeMesh(new THREE.CylinderGeometry(5, 70, 200, 10), 0x9aaa9a);
        benMacdui.position.set(x + 40, 100, -310);
        addObj(benMacdui);
        // Ben Macdui snow cap
        var bmSnow = makeMesh(new THREE.ConeGeometry(20, 30, 10), 0xffffff);
        bmSnow.position.set(x + 40, 215, -310);
        addObj(bmSnow);

        // Snow patches on other peaks
        var snowPatches = [
            [x,      -300, 0.6615],
            [x - 70, -290, 0.6615],
            [x + 60, -280, 0.6615]
        ];
        for (i = 0; i < snowPatches.length; i++) {
            var sp = snowPatches[i];
            var snow = makeMesh(new THREE.SphereGeometry(18, 8, 8), 0xeeeeff);
            snow.position.set(sp[0], 155, sp[1]);
            snow.scale.y = 0.3;
            addObj(snow);
        }

        // Cairn Gorm skiing area
        var skiMtn = makeMesh(new THREE.CylinderGeometry(8, 75, 170, 10), 0x8a9a8a);
        skiMtn.position.set(x - 120, 85, -285);
        addObj(skiMtn);
        // Ski slopes (white strips)
        var skiSlope1 = makeMesh(new THREE.BoxGeometry(4, 1, 60), 0xeeeeff);
        skiSlope1.position.set(x - 120, 140, -265);
        skiSlope1.rotation.x = 0.6;
        addObj(skiSlope1);
        var skiSlope2 = makeMesh(new THREE.BoxGeometry(4, 1, 60), 0xeeeeff);
        skiSlope2.position.set(x - 110, 138, -267);
        skiSlope2.rotation.x = 0.55;
        addObj(skiSlope2);

        // Funicular railway — base station
        var funicularBase = makeMesh(new THREE.BoxGeometry(12, 6, 8), 0xaaaacc);
        funicularBase.position.set(x - 120, 3, -240);
        addObj(funicularBase);
        var funicularBaseRoof = makeMesh(new THREE.BoxGeometry(14, 2, 10), 0x8888aa);
        funicularBaseRoof.position.set(x - 120, 7, -240);
        addObj(funicularBaseRoof);
        // Funicular railway — top station
        var funicularTop = makeMesh(new THREE.BoxGeometry(12, 6, 8), 0xaaaacc);
        funicularTop.position.set(x - 118, 163, -298);
        addObj(funicularTop);
        // Funicular track cables (LineSegments)
        var cablePoints = [
            x - 120, 6, -240,
            x - 118, 163, -298
        ];
        var cableGeo = new THREE.BufferGeometry();
        cableGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cablePoints), 3));
        var cable = new THREE.LineSegments(cableGeo, new THREE.MeshLambertMaterial({ color: 0x444444 }));
        scene.add(cable);
        objects.push(cable);
        // Second cable track
        var cablePoints2 = [
            x - 116, 6, -240,
            x - 114, 163, -298
        ];
        var cableGeo2 = new THREE.BufferGeometry();
        cableGeo2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cablePoints2), 3));
        var cable2 = new THREE.LineSegments(cableGeo2, new THREE.MeshLambertMaterial({ color: 0x444444 }));
        scene.add(cable2);
        objects.push(cable2);

        // Funicular car (box on slope)
        var funCar = makeMesh(new THREE.BoxGeometry(5, 3, 4), 0x3344cc);
        funCar.position.set(x - 119, 85, -269);
        addObj(funCar);

        // Plateau moorland in foreground of mountains
        var moor = makeMesh(new THREE.BoxGeometry(600, 0.5, 100), 0x7a6a5a);
        moor.position.set(x, 0, -230);
        addObj(moor);
        // Heather patches on moor
        var hColors = [0x8b3a8b, 0x9b4a9b, 0x7a2a7a];
        for (i = 0; i < 20; i++) {
            var hx = x - 250 + i * 25;
            var hz = -215 - (i % 3) * 15;
            var heather = makeMesh(new THREE.BoxGeometry(8, 0.8, 8), hColors[i % 3]);
            heather.position.set(hx, 0.7, hz);
            addObj(heather);
        }
    }

    function buildDeeside() {
        var x = 15200;
        var zBase = 170;

        // River Dee — meandering (series of wide, slightly offset box sections)
        var riverSegments = [
            [x - 200, zBase + 5,  80, 0],
            [x - 120, zBase,      70, 0.1],
            [x - 50,  zBase + 8,  60, -0.08],
            [x + 10,  zBase + 2,  70, 0.12],
            [x + 80,  zBase - 5,  80, 0],
            [x + 160, zBase + 3,  70, -0.1]
        ];
        var i;
        for (i = 0; i < riverSegments.length; i++) {
            var rs = riverSegments[i];
            var river = makeMesh(new THREE.BoxGeometry(rs[2], 0.3, 12), 0x4a90d9);
            river.position.set(rs[0], 0.15, rs[1]);
            river.rotation.y = rs[3];
            addObj(river);
        }

        // River banks
        for (i = 0; i < 6; i++) {
            var rb = riverSegments[i];
            var bankN = makeMesh(new THREE.BoxGeometry(rb[2], 0.5, 4), 0x8b7355);
            bankN.position.set(rb[0], 0.25, rb[1] - 8);
            bankN.rotation.y = rb[3];
            addObj(bankN);
            var bankS = makeMesh(new THREE.BoxGeometry(rb[2], 0.5, 4), 0x8b7355);
            bankS.position.set(rb[0], 0.25, rb[1] + 8);
            bankS.rotation.y = rb[3];
            addObj(bankS);
        }

        // Caledonian pine forest — sphere on cylinder
        var pinePositions = [];
        var pi;
        for (pi = 0; pi < 35; pi++) {
            var row = Math.floor(pi / 7);
            var col = pi % 7;
            pinePositions.push([
                x - 180 + col * 30 + (row % 2) * 12,
                zBase + 30 + row * 15
            ]);
        }
        for (i = 0; i < pinePositions.length; i++) {
            var ppos = pinePositions[i];
            var trunk = makeMesh(new THREE.CylinderGeometry(0.6, 0.8, 9, 8), 0x5a3a1a);
            trunk.position.set(ppos[0], 4.5, ppos[1]);
            addObj(trunk);
            var canopy = makeMesh(new THREE.SphereGeometry(4 + (i % 3) * 0.5, 8, 8), 0x1a5a1a);
            canopy.position.set(ppos[0], 11 + (i % 3) * 0.3, ppos[1]);
            addObj(canopy);
        }

        // Deeside valley floor grass
        var valley = makeMesh(new THREE.BoxGeometry(500, 0.5, 120), 0x4a8a3a);
        valley.position.set(x, -0.25, zBase + 20);
        addObj(valley);

        // Queen Victoria era cottages (5 cottages)
        var cottagePositions = [
            [x - 100, zBase + 15],
            [x - 65,  zBase + 12],
            [x + 50,  zBase + 18],
            [x + 90,  zBase + 10],
            [x + 130, zBase + 20]
        ];
        for (i = 0; i < cottagePositions.length; i++) {
            var cp = cottagePositions[i];
            var cwall = makeMesh(new THREE.BoxGeometry(10, 7, 8), 0xf0e8d0);
            cwall.position.set(cp[0], 3.5, cp[1]);
            addObj(cwall);
            var croof = makeMesh(new THREE.CylinderGeometry(0.1, 8, 5, 4), 0x8b3030);
            croof.position.set(cp[0], 9.5, cp[1]);
            addObj(croof);
            // Chimney
            var chimney = makeMesh(new THREE.BoxGeometry(1.5, 4, 1.5), 0xcc9966);
            chimney.position.set(cp[0] + 3, 11, cp[1]);
            addObj(chimney);
            // Door
            var door = makeMesh(new THREE.BoxGeometry(0.2, 3.5, 2), 0x5a3a1a);
            door.position.set(cp[0] - 5.1, 1.75, cp[1]);
            addObj(door);
            // Window
            var win = makeMesh(new THREE.BoxGeometry(0.2, 2, 2), 0x9acced);
            win.position.set(cp[0] - 5.1, 4, cp[1] + 2.5);
            addObj(win);
        }

        // Cricket pitch on Deeside
        var pitch = makeMesh(new THREE.BoxGeometry(30, 0.3, 60), 0xa8c870);
        pitch.position.set(x + 200, 0.15, zBase + 25);
        addObj(pitch);
        // Pitch crease markings
        var crease1 = makeMesh(new THREE.BoxGeometry(8, 0.1, 0.3), 0xffffff);
        crease1.position.set(x + 200, 0.35, zBase + 7);
        addObj(crease1);
        var crease2 = makeMesh(new THREE.BoxGeometry(8, 0.1, 0.3), 0xffffff);
        crease2.position.set(x + 200, 0.35, zBase + 43);
        addObj(crease2);
        // Wickets
        var wicketData = [
            [x + 200, zBase + 8],
            [x + 200, zBase + 42]
        ];
        for (i = 0; i < 2; i++) {
            var wd = wicketData[i];
            var wk;
            for (wk = 0; wk < 3; wk++) {
                var stump = makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6), 0xffcc88);
                stump.position.set(wd[0] - 0.3 + wk * 0.3, 0.6, wd[1]);
                addObj(stump);
            }
            var bail1 = makeMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6), 0xffcc88);
            bail1.position.set(wd[0] - 0.2, 1.25, wd[1]);
            bail1.rotation.z = Math.PI * 0.5;
            addObj(bail1);
        }
        // Cricket pavilion
        var cpav = makeMesh(new THREE.BoxGeometry(16, 5, 8), 0xffffff);
        cpav.position.set(x + 218, 2.5, zBase + 25);
        addObj(cpav);
        var cpavRoof = makeMesh(new THREE.CylinderGeometry(0.1, 11, 4, 4), 0x8b3030);
        cpavRoof.position.set(x + 218, 7, zBase + 25);
        addObj(cpavRoof);
        // Scoreboard
        var cboard = makeMesh(new THREE.BoxGeometry(0.5, 6, 8), 0x1a1a2e);
        cboard.position.set(x + 235, 3, zBase + 25);
        addObj(cboard);

        // Stone bridge over River Dee
        var bridgeDeck = makeMesh(new THREE.BoxGeometry(20, 1.5, 14), 0x9a8a7a);
        bridgeDeck.position.set(x + 10, 1, zBase + 2);
        addObj(bridgeDeck);
        var bridgeArchL = makeMesh(new THREE.CylinderGeometry(4, 4, 2, 10, 1, false, 0, Math.PI), 0x8a7a6a);
        bridgeArchL.position.set(x + 5, 0, zBase + 2);
        bridgeArchL.rotation.x = Math.PI * 0.5;
        addObj(bridgeArchL);
        var bridgeArchR = makeMesh(new THREE.CylinderGeometry(4, 4, 2, 10, 1, false, 0, Math.PI), 0x8a7a6a);
        bridgeArchR.position.set(x + 15, 0, zBase + 2);
        bridgeArchR.rotation.x = Math.PI * 0.5;
        addObj(bridgeArchR);
        // Bridge parapets
        var parapetL = makeMesh(new THREE.BoxGeometry(20, 1.5, 1), 0x9a8a7a);
        parapetL.position.set(x + 10, 2, zBase - 6.5);
        addObj(parapetL);
        var parapetR = makeMesh(new THREE.BoxGeometry(20, 1.5, 1), 0x9a8a7a);
        parapetR.position.set(x + 10, 2, zBase + 8.5);
        addObj(parapetR);

        // Deeside road along valley
        var road = makeMesh(new THREE.BoxGeometry(400, 0.2, 6), 0x555555);
        road.position.set(x, 0.1, zBase + 5);
        addObj(road);
        // Road markings
        var k;
        for (k = 0; k < 10; k++) {
            var rm = makeMesh(new THREE.BoxGeometry(8, 0.1, 0.4), 0xffffff);
            rm.position.set(x - 180 + k * 40, 0.2, zBase + 5);
            addObj(rm);
        }
    }

    function update(delta) {
        // Static environment, no animation needed
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
