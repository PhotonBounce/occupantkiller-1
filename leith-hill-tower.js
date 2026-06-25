window.LeithHillTower = (function() {
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

    function makeMesh(geo, color, flat) {
        var mat = new THREE.MeshLambertMaterial({ color: color, flatShading: flat ? true : false });
        return new THREE.Mesh(geo, mat);
    }

    function build() {
        buildTower();
        buildSummitPlateau();
        buildWoodland();
        buildWottonVillage();
        buildColdharbourVillage();
        buildGreensandRidge();
    }

    function buildTower() {
        var ox = 13080;
        var oz = 0;
        var baseY = 0;

        // Main tower body — square stone tower 19m high
        var towerBody = makeMesh(new THREE.BoxGeometry(8, 19, 8), 0x8B7355, true);
        towerBody.position.set(ox, baseY + 9.5, oz);
        addObj(towerBody);

        // Tower stone texture variation — second layer for depth
        var towerFace = makeMesh(new THREE.BoxGeometry(8.2, 18, 8.2), 0x7A6A4A, true);
        towerFace.position.set(ox, baseY + 9, oz);
        addObj(towerFace);

        // Battlement base (merlon platform)
        var battleBase = makeMesh(new THREE.BoxGeometry(9, 1, 9), 0x7A6A4A, true);
        battleBase.position.set(ox, baseY + 19.5, oz);
        addObj(battleBase);

        // Merlons — battlements around perimeter (8 merlons)
        var merlon1 = makeMesh(new THREE.BoxGeometry(2, 2, 1.5), 0x8B7355, true);
        merlon1.position.set(ox - 3, baseY + 21, oz - 4.5);
        addObj(merlon1);

        var merlon2 = makeMesh(new THREE.BoxGeometry(2, 2, 1.5), 0x8B7355, true);
        merlon2.position.set(ox + 3, baseY + 21, oz - 4.5);
        addObj(merlon2);

        var merlon3 = makeMesh(new THREE.BoxGeometry(2, 2, 1.5), 0x8B7355, true);
        merlon3.position.set(ox - 3, baseY + 21, oz + 4.5);
        addObj(merlon3);

        var merlon4 = makeMesh(new THREE.BoxGeometry(2, 2, 1.5), 0x8B7355, true);
        merlon4.position.set(ox + 3, baseY + 21, oz + 4.5);
        addObj(merlon4);

        var merlon5 = makeMesh(new THREE.BoxGeometry(1.5, 2, 2), 0x8B7355, true);
        merlon5.position.set(ox - 4.5, baseY + 21, oz - 3);
        addObj(merlon5);

        var merlon6 = makeMesh(new THREE.BoxGeometry(1.5, 2, 2), 0x8B7355, true);
        merlon6.position.set(ox - 4.5, baseY + 21, oz + 3);
        addObj(merlon6);

        var merlon7 = makeMesh(new THREE.BoxGeometry(1.5, 2, 2), 0x8B7355, true);
        merlon7.position.set(ox + 4.5, baseY + 21, oz - 3);
        addObj(merlon7);

        var merlon8 = makeMesh(new THREE.BoxGeometry(1.5, 2, 2), 0x8B7355, true);
        merlon8.position.set(ox + 4.5, baseY + 21, oz + 3);
        addObj(merlon8);

        // Gothic arched door — dark archway inset
        var doorFrame = makeMesh(new THREE.BoxGeometry(3, 5, 0.6), 0x4A3A28, true);
        doorFrame.position.set(ox, baseY + 2.5, oz - 4.1);
        addObj(doorFrame);

        // Door arch top (pointed Gothic arch approximation with box)
        var doorArch = makeMesh(new THREE.BoxGeometry(2.5, 1.5, 0.6), 0x3A2A18, true);
        doorArch.position.set(ox, baseY + 5.5, oz - 4.1);
        addObj(doorArch);

        // Door arch peak
        var doorPeak = makeMesh(new THREE.BoxGeometry(1.2, 1, 0.6), 0x3A2A18, true);
        doorPeak.position.set(ox, baseY + 6.8, oz - 4.1);
        addObj(doorPeak);

        // Windows — narrow Gothic lancet windows on each face
        var win1 = makeMesh(new THREE.BoxGeometry(1, 3, 0.5), 0x2A1A08, true);
        win1.position.set(ox, baseY + 12, oz - 4.1);
        addObj(win1);

        var win2 = makeMesh(new THREE.BoxGeometry(0.5, 3, 1), 0x2A1A08, true);
        win2.position.set(ox - 4.1, baseY + 12, oz);
        addObj(win2);

        var win3 = makeMesh(new THREE.BoxGeometry(1, 3, 0.5), 0x2A1A08, true);
        win3.position.set(ox, baseY + 12, oz + 4.1);
        addObj(win3);

        var win4 = makeMesh(new THREE.BoxGeometry(0.5, 3, 1), 0x2A1A08, true);
        win4.position.set(ox + 4.1, baseY + 12, oz);
        addObj(win4);

        // Upper windows
        var winU1 = makeMesh(new THREE.BoxGeometry(1, 2.5, 0.5), 0x2A1A08, true);
        winU1.position.set(ox, baseY + 16, oz - 4.1);
        addObj(winU1);

        var winU2 = makeMesh(new THREE.BoxGeometry(0.5, 2.5, 1), 0x2A1A08, true);
        winU2.position.set(ox + 4.1, baseY + 16, oz);
        addObj(winU2);

        // Interior spiral stair suggestion — visible through doorway
        var stairPost = makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 18, 6), 0x6A5A3A, true);
        stairPost.position.set(ox + 2, baseY + 9, oz + 2);
        addObj(stairPost);

        var stairStep1 = makeMesh(new THREE.BoxGeometry(2.5, 0.3, 1.2), 0x7A6A4A, true);
        stairStep1.position.set(ox + 1, baseY + 3, oz + 1.5);
        addObj(stairStep1);

        var stairStep2 = makeMesh(new THREE.BoxGeometry(1.2, 0.3, 2.5), 0x7A6A4A, true);
        stairStep2.position.set(ox + 1.5, baseY + 5, oz + 1);
        addObj(stairStep2);

        var stairStep3 = makeMesh(new THREE.BoxGeometry(2.5, 0.3, 1.2), 0x7A6A4A, true);
        stairStep3.position.set(ox + 1, baseY + 7, oz + 0.5);
        addObj(stairStep3);

        // Flagpole on top
        var flagPole = makeMesh(new THREE.CylinderGeometry(0.12, 0.12, 8, 5), 0x8B8B8B, false);
        flagPole.position.set(ox, baseY + 26, oz);
        addObj(flagPole);

        // Flag
        var flag = makeMesh(new THREE.BoxGeometry(3, 1.5, 0.05), 0xCC0000, false);
        flag.position.set(ox + 1.5, baseY + 29, oz);
        addObj(flag);

        // Tower foundation/plinth
        var plinth = makeMesh(new THREE.BoxGeometry(10, 1.5, 10), 0x6A5A3A, true);
        plinth.position.set(ox, baseY + 0.75, oz);
        addObj(plinth);

        // Corner buttresses
        var butt1 = makeMesh(new THREE.BoxGeometry(2, 14, 2), 0x7A6A4A, true);
        butt1.position.set(ox - 4.5, baseY + 7, oz - 4.5);
        addObj(butt1);

        var butt2 = makeMesh(new THREE.BoxGeometry(2, 14, 2), 0x7A6A4A, true);
        butt2.position.set(ox + 4.5, baseY + 7, oz - 4.5);
        addObj(butt2);

        var butt3 = makeMesh(new THREE.BoxGeometry(2, 14, 2), 0x7A6A4A, true);
        butt3.position.set(ox - 4.5, baseY + 7, oz + 4.5);
        addObj(butt3);

        var butt4 = makeMesh(new THREE.BoxGeometry(2, 14, 2), 0x7A6A4A, true);
        butt4.position.set(ox + 4.5, baseY + 7, oz + 4.5);
        addObj(butt4);
    }

    function buildSummitPlateau() {
        var ox = 13080;

        // Summit plateau ground — open heathland
        var plateau = makeMesh(new THREE.BoxGeometry(120, 0.8, 120), 0x9B7D3A, true);
        plateau.position.set(ox + 5, -0.4, 10);
        addObj(plateau);

        // Heather patches — low purple mounds
        var i;
        var heatherPositions = [
            [ox - 20, 5, 15], [ox + 30, 8, -10], [ox - 35, 6, -20],
            [ox + 45, 5, 20], [ox - 10, 4, 30], [ox + 20, 6, -35],
            [ox - 40, 5, 5], [ox + 15, 4, 40], [ox - 25, 6, -40],
            [ox + 50, 5, -5], [ox - 50, 4, 25], [ox + 35, 7, 35]
        ];
        for (i = 0; i < heatherPositions.length; i++) {
            var hp = heatherPositions[i];
            var heather = makeMesh(new THREE.SphereGeometry(hp[1] * 0.5 + 1.5, 5, 4), 0x7B3B6B, true);
            heather.scale.y = 0.3;
            heather.position.set(hp[0], 0.8, hp[2]);
            addObj(heather);
        }

        // Gorse bushes — spiky yellow-green
        var gorsePositions = [
            [ox + 25, 15, -15], [ox - 30, 12, 20], [ox + 40, 18, 10],
            [ox - 45, 14, -5], [ox + 10, 16, -40], [ox - 15, 13, 45]
        ];
        for (i = 0; i < gorsePositions.length; i++) {
            var gp = gorsePositions[i];
            var gorseBase = makeMesh(new THREE.SphereGeometry(2.5, 5, 4), 0x4A7A20, true);
            gorseBase.position.set(gp[0], 2, gp[2]);
            addObj(gorseBase);
            var gorseTop = makeMesh(new THREE.ConeGeometry(1.5, 3, 5), 0x6A9A30, true);
            gorseTop.position.set(gp[0], 4.5, gp[2]);
            addObj(gorseTop);
        }

        // Rocky outcrops — greensand sandstone
        var rockData = [
            [ox - 22, 6, -12, 4, 2.5, 3.5], [ox + 32, 8, 18, 5, 3, 4],
            [ox - 38, 5, 22, 3.5, 2, 3], [ox + 18, 6, -30, 4.5, 2.5, 3.5],
            [ox - 12, 7, -45, 3, 2, 2.5], [ox + 48, 5, -20, 4, 1.8, 3.2]
        ];
        for (i = 0; i < rockData.length; i++) {
            var rd = rockData[i];
            var rock = makeMesh(new THREE.BoxGeometry(rd[3], rd[4], rd[5]), 0x9B8B6A, true);
            rock.position.set(rd[0], rd[4] * 0.5, rd[2]);
            rock.rotation.y = i * 0.4;
            addObj(rock);
        }

        // Trig point pillar (Ordnance Survey triangulation pillar)
        var trigBase = makeMesh(new THREE.BoxGeometry(1.2, 0.3, 1.2), 0xCCCCCC, true);
        trigBase.position.set(ox + 8, 0.15, 5);
        addObj(trigBase);

        var trigPillar = makeMesh(new THREE.CylinderGeometry(0.35, 0.45, 1.2, 4), 0xDDDDDD, true);
        trigPillar.position.set(ox + 8, 0.9, 5);
        addObj(trigPillar);

        var trigTop = makeMesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), 0xEEEEEE, true);
        trigTop.position.set(ox + 8, 1.65, 5);
        addObj(trigTop);

        // Viewpoint benches — 4 directions
        var benchPositions = [
            [ox + 60, 0, 0, 0], [ox - 55, 0, 0, 0],
            [ox, 0, 60, Math.PI * 0.5], [ox, 0, -58, Math.PI * 0.5]
        ];
        for (i = 0; i < benchPositions.length; i++) {
            var bp = benchPositions[i];
            var benchSeat = makeMesh(new THREE.BoxGeometry(4, 0.2, 1.2), 0x8B6A3A, true);
            benchSeat.position.set(bp[0], 0.9, bp[2]);
            benchSeat.rotation.y = bp[3];
            addObj(benchSeat);
            var benchLeg1 = makeMesh(new THREE.BoxGeometry(0.2, 0.9, 1.2), 0x7A5A2A, true);
            benchLeg1.position.set(bp[0] + 1.5, 0.45, bp[2]);
            benchLeg1.rotation.y = bp[3];
            addObj(benchLeg1);
            var benchLeg2 = makeMesh(new THREE.BoxGeometry(0.2, 0.9, 1.2), 0x7A5A2A, true);
            benchLeg2.position.set(bp[0] - 1.5, 0.45, bp[2]);
            benchLeg2.rotation.y = bp[3];
            addObj(benchLeg2);
        }
    }

    function buildWoodland() {
        var ox = 13080;
        var i;

        // Dense oak woodland on southern slopes
        var oakData = [
            [ox - 80, 0, 60, 6, 12], [ox - 60, 0, 80, 5, 10], [ox - 40, 0, 90, 7, 14],
            [ox - 20, 0, 100, 5, 11], [ox + 0, 0, 95, 6, 13], [ox + 20, 0, 85, 4, 9],
            [ox + 40, 0, 75, 7, 15], [ox + 60, 0, 65, 5, 10], [ox + 80, 0, 55, 6, 12],
            [ox - 90, 0, 40, 4, 9], [ox - 100, 0, 20, 6, 13], [ox - 95, 0, 0, 5, 11],
            [ox - 85, 0, -20, 7, 14], [ox - 70, 0, -40, 4, 9], [ox + 90, 0, 30, 6, 12],
            [ox + 100, 0, 10, 5, 11], [ox + 95, 0, -10, 7, 14], [ox + 85, 0, -30, 4, 9],
            [ox + 70, 0, -50, 5, 10], [ox + 50, 0, -70, 6, 13], [ox + 30, 0, -85, 4, 9],
            [ox + 10, 0, -100, 6, 12], [ox - 10, 0, -95, 5, 11], [ox - 30, 0, -80, 7, 14],
            [ox - 50, 0, -65, 4, 9], [ox - 65, 0, -55, 6, 13]
        ];
        for (i = 0; i < oakData.length; i++) {
            var od = oakData[i];
            var trunk = makeMesh(new THREE.CylinderGeometry(0.6, 0.9, od[4] * 0.4, 6), 0x5A4A2A, true);
            trunk.position.set(od[0], od[4] * 0.2, od[2]);
            addObj(trunk);
            var canopy = makeMesh(new THREE.SphereGeometry(od[3], 6, 5), 0x2A5A1A, true);
            canopy.position.set(od[0], od[4] * 0.4 + od[3] * 0.8, od[2]);
            addObj(canopy);
            var canopy2 = makeMesh(new THREE.SphereGeometry(od[3] * 0.7, 5, 4), 0x3A6A2A, true);
            canopy2.position.set(od[0] + 1.5, od[4] * 0.4 + od[3], od[2] + 1);
            addObj(canopy2);
        }

        // Birch trees — slender white trunks
        var birchData = [
            [ox - 55, 0, 50, 3, 10], [ox - 35, 0, 70, 2.5, 8], [ox + 35, 0, 60, 3, 11],
            [ox + 55, 0, 45, 2.5, 9], [ox - 75, 0, -30, 3, 10], [ox + 75, 0, -40, 2.5, 9],
            [ox - 45, 0, -60, 3, 11], [ox + 45, 0, -55, 2.5, 8], [ox + 25, 0, -75, 3, 10],
            [ox - 25, 0, -70, 2.5, 9]
        ];
        for (i = 0; i < birchData.length; i++) {
            var bd = birchData[i];
            var birchTrunk = makeMesh(new THREE.CylinderGeometry(0.25, 0.35, bd[4], 5), 0xE0D8C8, true);
            birchTrunk.position.set(bd[0], bd[4] * 0.5, bd[2]);
            addObj(birchTrunk);
            var birchLeaf = makeMesh(new THREE.SphereGeometry(bd[3], 5, 4), 0x4A8A2A, true);
            birchLeaf.position.set(bd[0], bd[4] + bd[3] * 0.6, bd[2]);
            addObj(birchLeaf);
        }

        // Bracken floor patches
        var brackenPositions = [
            [ox - 65, 35], [ox - 45, 55], [ox + 45, 48], [ox + 65, 32],
            [ox - 80, -15], [ox + 80, -25], [ox - 40, -58], [ox + 40, -62],
            [ox, -90]
        ];
        for (i = 0; i < brackenPositions.length; i++) {
            var brp = brackenPositions[i];
            var bracken = makeMesh(new THREE.BoxGeometry(12, 0.5, 8), 0x6A8A2A, true);
            bracken.position.set(brp[0], 0.25, brp[1]);
            bracken.rotation.y = i * 0.6;
            addObj(bracken);
        }

        // Viewpoint ride (cleared path through trees) — east-west
        var ridePath = makeMesh(new THREE.BoxGeometry(200, 0.1, 8), 0xA89060, true);
        ridePath.position.set(ox, 0.05, 55);
        addObj(ridePath);
    }

    function buildWottonVillage() {
        var ox = 13080;
        var vx = ox - 200;
        var vz = 150;
        var i;

        // Village green
        var green = makeMesh(new THREE.BoxGeometry(50, 0.2, 40), 0x3A7A2A, true);
        green.position.set(vx, 0.1, vz);
        addObj(green);

        // St John's Church — nave, chancel, tower
        var churchNave = makeMesh(new THREE.BoxGeometry(16, 8, 28), 0x9B8B6A, true);
        churchNave.position.set(vx - 30, 4, vz - 10);
        addObj(churchNave);

        var churchRoof = makeMesh(new THREE.BoxGeometry(17, 5, 29), 0x7A6A4A, true);
        churchRoof.scale.y = 0.6;
        churchRoof.position.set(vx - 30, 9.5, vz - 10);
        addObj(churchRoof);

        var churchRoofPeak = makeMesh(new THREE.CylinderGeometry(0, 8.5, 6, 4), 0x7A6A4A, true);
        churchRoofPeak.position.set(vx - 30, 11, vz - 10);
        addObj(churchRoofPeak);

        // Church tower
        var churchTower = makeMesh(new THREE.BoxGeometry(8, 14, 8), 0x8B7B5A, true);
        churchTower.position.set(vx - 30, 7, vz - 25);
        addObj(churchTower);

        var churchBattlement = makeMesh(new THREE.BoxGeometry(9, 1.5, 9), 0x7A6A4A, true);
        churchBattlement.position.set(vx - 30, 14.75, vz - 25);
        addObj(churchBattlement);

        // Church spire
        var spire = makeMesh(new THREE.ConeGeometry(3, 12, 4), 0x6A5A3A, true);
        spire.position.set(vx - 30, 21, vz - 25);
        addObj(spire);

        // Churchyard wall
        var cwall1 = makeMesh(new THREE.BoxGeometry(40, 1.5, 0.6), 0x8B7355, true);
        cwall1.position.set(vx - 30, 0.75, vz - 32);
        addObj(cwall1);
        var cwall2 = makeMesh(new THREE.BoxGeometry(40, 1.5, 0.6), 0x8B7355, true);
        cwall2.position.set(vx - 30, 0.75, vz + 5);
        addObj(cwall2);

        // Wotton Hatch pub
        var pubMain = makeMesh(new THREE.BoxGeometry(18, 7, 12), 0xCC8844, true);
        pubMain.position.set(vx + 20, 3.5, vz - 15);
        addObj(pubMain);

        var pubRoof = makeMesh(new THREE.CylinderGeometry(0, 10, 5, 4), 0x8B4513, true);
        pubRoof.position.set(vx + 20, 9.5, vz - 15);
        addObj(pubRoof);

        var pubSign = makeMesh(new THREE.BoxGeometry(3, 2, 0.2), 0x4A2A0A, true);
        pubSign.position.set(vx + 12, 5, vz - 21.1);
        addObj(pubSign);

        var pubSignPost = makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 4), 0x2A1A0A, true);
        pubSignPost.position.set(vx + 12, 3, vz - 21.5);
        addObj(pubSignPost);

        // Flint-stone cottages (5 cottages around the green)
        var cottageData = [
            [vx + 25, vz + 15, 12, 6, 10], [vx + 10, vz + 18, 10, 5.5, 9],
            [vx - 10, vz + 16, 11, 6, 10], [vx - 25, vz + 14, 10, 5, 9],
            [vx + 35, vz, 12, 6.5, 10]
        ];
        for (i = 0; i < cottageData.length; i++) {
            var cd = cottageData[i];
            var cottage = makeMesh(new THREE.BoxGeometry(cd[2], cd[3], cd[4]), 0x7A7A6A, true);
            cottage.position.set(cd[0], cd[3] * 0.5, cd[1]);
            addObj(cottage);
            var cottageRoof = makeMesh(new THREE.CylinderGeometry(0, cd[2] * 0.65, cd[3] * 0.7, 4), 0x8B4513, true);
            cottageRoof.position.set(cd[0], cd[3] + cd[3] * 0.35, cd[1]);
            addObj(cottageRoof);
            // Chimney
            var chimney = makeMesh(new THREE.BoxGeometry(1, 3, 1), 0x6A5A3A, true);
            chimney.position.set(cd[0] + 2, cd[3] + cd[3] * 0.5, cd[1]);
            addObj(chimney);
        }

        // Village road
        var vroad = makeMesh(new THREE.BoxGeometry(6, 0.15, 100), 0x8A8A8A, true);
        vroad.position.set(vx - 10, 0.075, vz + 50);
        addObj(vroad);

        // Village pond
        var pond = makeMesh(new THREE.CylinderGeometry(8, 8, 0.3, 8), 0x2A5A8A, true);
        pond.position.set(vx + 5, 0.15, vz + 5);
        addObj(pond);

        // Pond surround
        var pondSurround = makeMesh(new THREE.CylinderGeometry(9, 9, 0.3, 8), 0x5A7A3A, true);
        pondSurround.position.set(vx + 5, 0.0, vz + 5);
        addObj(pondSurround);
    }

    function buildColdharbourVillage() {
        var ox = 13080;
        var cx = ox + 180;
        var cz = -120;
        var i;

        // Village ground
        var cground = makeMesh(new THREE.BoxGeometry(100, 0.2, 80), 0x4A6A2A, true);
        cground.position.set(cx, 0.1, cz);
        addObj(cground);

        // The Plough pub — isolated hamlet inn
        var ploughMain = makeMesh(new THREE.BoxGeometry(15, 6.5, 11), 0xBB7733, true);
        ploughMain.position.set(cx - 15, 3.25, cz - 5);
        addObj(ploughMain);

        var ploughRoof = makeMesh(new THREE.CylinderGeometry(0, 9, 5, 4), 0x6B3A0A, true);
        ploughRoof.position.set(cx - 15, 8.5, cz - 5);
        addObj(ploughRoof);

        // Plough sign post
        var ploughPost = makeMesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 4), 0x3A2A0A, true);
        ploughPost.position.set(cx - 22, 2.5, cz - 11);
        addObj(ploughPost);
        var ploughSign = makeMesh(new THREE.BoxGeometry(2.5, 1.5, 0.2), 0x5A3A1A, true);
        ploughSign.position.set(cx - 22, 5.5, cz - 11);
        addObj(ploughSign);

        // Cricket ground — flat pitch with crease markings
        var cricketOutfield = makeMesh(new THREE.CylinderGeometry(30, 30, 0.15, 12), 0x4A8A3A, true);
        cricketOutfield.position.set(cx + 25, 0.075, cz + 15);
        addObj(cricketOutfield);

        var cricketPitch = makeMesh(new THREE.BoxGeometry(5, 0.1, 20), 0xC8B870, true);
        cricketPitch.position.set(cx + 25, 0.2, cz + 15);
        addObj(cricketPitch);

        // Cricket pavilion
        var pavilion = makeMesh(new THREE.BoxGeometry(14, 4.5, 8), 0xF5E8C8, true);
        pavilion.position.set(cx + 55, 2.25, cz + 10);
        addObj(pavilion);

        var pavilionRoof = makeMesh(new THREE.BoxGeometry(15, 2, 9), 0x8B4513, true);
        pavilionRoof.position.set(cx + 55, 5.5, cz + 10);
        addObj(pavilionRoof);

        // Cricket stumps (two sets)
        var stump1a = makeMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 4), 0xDDDDDD, false);
        stump1a.position.set(cx + 24.6, 0.35, cz + 24);
        addObj(stump1a);
        var stump1b = makeMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 4), 0xDDDDDD, false);
        stump1b.position.set(cx + 25, 0.35, cz + 24);
        addObj(stump1b);
        var stump1c = makeMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 4), 0xDDDDDD, false);
        stump1c.position.set(cx + 25.4, 0.35, cz + 24);
        addObj(stump1c);

        var stump2a = makeMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 4), 0xDDDDDD, false);
        stump2a.position.set(cx + 24.6, 0.35, cz + 6);
        addObj(stump2a);
        var stump2b = makeMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 4), 0xDDDDDD, false);
        stump2b.position.set(cx + 25, 0.35, cz + 6);
        addObj(stump2b);
        var stump2c = makeMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 4), 0xDDDDDD, false);
        stump2c.position.set(cx + 25.4, 0.35, cz + 6);
        addObj(stump2c);

        // Duck pond
        var duckPond = makeMesh(new THREE.CylinderGeometry(10, 10, 0.4, 8), 0x1A5A7A, true);
        duckPond.position.set(cx - 20, 0.2, cz + 25);
        addObj(duckPond);

        var duckPondEdge = makeMesh(new THREE.CylinderGeometry(11, 11, 0.3, 8), 0x5A6A3A, true);
        duckPondEdge.position.set(cx - 20, 0.0, cz + 25);
        addObj(duckPondEdge);

        // Stone cottages (4 cottages)
        var cColottageData = [
            [cx - 35, cz - 15, 10, 5.5, 9], [cx - 20, cz - 18, 11, 6, 10],
            [cx - 5, cz - 14, 10, 5, 9], [cx + 10, cz - 16, 12, 6.5, 10]
        ];
        for (i = 0; i < cColottageData.length; i++) {
            var ccd = cColottageData[i];
            var cCottage = makeMesh(new THREE.BoxGeometry(ccd[2], ccd[3], ccd[4]), 0x8B8B7A, true);
            cCottage.position.set(ccd[0], ccd[3] * 0.5, ccd[1]);
            addObj(cCottage);
            var cCottageRoof = makeMesh(new THREE.CylinderGeometry(0, ccd[2] * 0.65, ccd[3] * 0.7, 4), 0x7A4513, true);
            cCottageRoof.position.set(ccd[0], ccd[3] + ccd[3] * 0.35, ccd[1]);
            addObj(cCottageRoof);
            var cChimney = makeMesh(new THREE.BoxGeometry(1, 2.5, 1), 0x6A5A3A, true);
            cChimney.position.set(ccd[0] + 2, ccd[3] + ccd[3] * 0.5, ccd[1]);
            addObj(cChimney);
        }

        // Isolated hamlet lane
        var hamletLane = makeMesh(new THREE.BoxGeometry(5, 0.15, 80), 0x9A8A6A, true);
        hamletLane.position.set(cx - 10, 0.075, cz + 10);
        addObj(hamletLane);
    }

    function buildGreensandRidge() {
        var ox = 13080;
        var i;

        // Sandy ridge path running east-west along the ridge
        var ridgePath = makeMesh(new THREE.BoxGeometry(300, 0.2, 3.5), 0xC8A864, true);
        ridgePath.position.set(ox, 0.1, 0);
        addObj(ridgePath);

        // Cross path (north-south)
        var crossPath = makeMesh(new THREE.BoxGeometry(3.5, 0.2, 250), 0xC8A864, true);
        crossPath.position.set(ox - 20, 0.1, 0);
        addObj(crossPath);

        // Sandy path texture patches
        var sandData = [
            [ox - 120, -5, 25, 12], [ox - 80, 8, 20, 15], [ox + 80, -5, 22, 14],
            [ox + 120, 6, 18, 12], [ox - 40, -8, 28, 16], [ox + 40, 5, 24, 13]
        ];
        for (i = 0; i < sandData.length; i++) {
            var sd = sandData[i];
            var sandPatch = makeMesh(new THREE.BoxGeometry(sd[2], 0.15, sd[3]), 0xD4B87A, true);
            sandPatch.position.set(sd[0], 0.075, sd[1]);
            addObj(sandPatch);
        }

        // Viewpoint benches along ridge
        var ridgeBenchPositions = [
            [ox - 100, 0, 3], [ox + 100, 0, 3],
            [ox - 50, 0, -3], [ox + 50, 0, -3]
        ];
        for (i = 0; i < ridgeBenchPositions.length; i++) {
            var rbp = ridgeBenchPositions[i];
            var rSeat = makeMesh(new THREE.BoxGeometry(3.5, 0.18, 1), 0x8B6A3A, true);
            rSeat.position.set(rbp[0], 0.85, rbp[2]);
            addObj(rSeat);
            var rLeg1 = makeMesh(new THREE.BoxGeometry(0.18, 0.85, 1), 0x7A5A2A, true);
            rLeg1.position.set(rbp[0] + 1.5, 0.42, rbp[2]);
            addObj(rLeg1);
            var rLeg2 = makeMesh(new THREE.BoxGeometry(0.18, 0.85, 1), 0x7A5A2A, true);
            rLeg2.position.set(rbp[0] - 1.5, 0.42, rbp[2]);
            addObj(rLeg2);
            // Bench back
            var rBack = makeMesh(new THREE.BoxGeometry(3.5, 0.18, 0.18), 0x8B6A3A, true);
            rBack.position.set(rbp[0], 1.2, rbp[2] - 0.4);
            addObj(rBack);
        }

        // National Trust signage posts
        var ntSignData = [
            [ox - 70, 0, 5], [ox + 70, 0, -5], [ox, 0, 60], [ox, 0, -60]
        ];
        for (i = 0; i < ntSignData.length; i++) {
            var ntd = ntSignData[i];
            var ntPost = makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 4), 0x8B5A20, true);
            ntPost.position.set(ntd[0], 1, ntd[2]);
            addObj(ntPost);
            var ntSign = makeMesh(new THREE.BoxGeometry(1.8, 0.6, 0.08), 0xCC8800, true);
            ntSign.position.set(ntd[0], 2.1, ntd[2]);
            addObj(ntSign);
        }

        // Geological feature — exposed sandstone layers in ridge
        var layerData = [
            [ox - 150, 0, 25, 20, 1.5, 8], [ox + 150, 0, -20, 18, 1.2, 7],
            [ox - 110, 0, -30, 15, 1.8, 9], [ox + 110, 0, 28, 22, 1.4, 8]
        ];
        for (i = 0; i < layerData.length; i++) {
            var ld = layerData[i];
            var layer1 = makeMesh(new THREE.BoxGeometry(ld[3], ld[4], ld[5]), 0xC8A060, true);
            layer1.position.set(ld[0], ld[4] * 0.5, ld[2]);
            addObj(layer1);
            var layer2 = makeMesh(new THREE.BoxGeometry(ld[3] * 0.85, ld[4] * 0.7, ld[5] * 0.9), 0xB89050, true);
            layer2.position.set(ld[0] + 1, ld[4] * 1.1, ld[2] + 0.5);
            addObj(layer2);
        }

        // Ridge waymarker posts
        var wayposts = [
            [ox - 180, 0], [ox - 140, 4], [ox - 100, -4], [ox - 60, 3],
            [ox + 60, -3], [ox + 100, 4], [ox + 140, -4], [ox + 180, 0]
        ];
        for (i = 0; i < wayposts.length; i++) {
            var wp = wayposts[i];
            var wayPost = makeMesh(new THREE.CylinderGeometry(0.1, 0.12, 1.5, 5), 0x8B6A3A, true);
            wayPost.position.set(wp[0], 0.75, wp[1]);
            addObj(wayPost);
            var wayTop = makeMesh(new THREE.CylinderGeometry(0, 0.25, 0.4, 4), 0x7A5A2A, true);
            wayTop.position.set(wp[0], 1.7, wp[1]);
            addObj(wayTop);
        }
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
