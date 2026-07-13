window.SofiaAlexander = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 23360;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMeshRot(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        mesh.rotation.set(rx, ry, rz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildAlexanderNevsky();
        buildNDK();
        buildVitosha();
        buildBoyanaChurch();
        buildHistoricalMuseum();
        buildRotundaStGeorge();
        buildYellowBrickRoad();
        buildPresidency();
        buildBanyaBashiMosque();
        buildLargo();
    }

    function buildGround() {
        // Ground plane made of large box
        var groundGeo = new THREE.BoxGeometry(2000, 2, 2000);
        makeMesh(groundGeo, 0x4A5A3A, 0, -1, 0);

        // City plaza paving
        var plazaGeo = new THREE.BoxGeometry(600, 0.5, 600);
        makeMesh(plazaGeo, 0xB0A898, 0, 0.25, 0);
    }

    function buildAlexanderNevsky() {
        // Main nave body
        var naveGeo = new THREE.BoxGeometry(70, 30, 110);
        makeMesh(naveGeo, 0xD4C8A0, 0, 15, -50);

        // Transept wings
        var transeptGeo = new THREE.BoxGeometry(120, 25, 40);
        makeMesh(transeptGeo, 0xD4C8A0, 0, 12.5, -60);

        // Apse (rear)
        var apseGeo = new THREE.CylinderGeometry(20, 22, 22, 8);
        makeMesh(apseGeo, 0xD4C8A0, 0, 11, -110);

        // Central golden dome - large
        var centralDomeGeo = new THREE.SphereGeometry(18, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
        makeMesh(centralDomeGeo, 0xFFD700, 0, 45, -55);

        // Central dome drum
        var drumGeo = new THREE.CylinderGeometry(16, 16, 14, 12);
        makeMesh(drumGeo, 0xD4C8A0, 0, 37, -55);

        // Central dome cross
        var crossVertGeo = new THREE.BoxGeometry(1.5, 10, 1.5);
        makeMesh(crossVertGeo, 0xFFD700, 0, 64, -55);
        var crossHorzGeo = new THREE.BoxGeometry(8, 1.5, 1.5);
        makeMesh(crossHorzGeo, 0xFFD700, 0, 60, -55);

        // Smaller dome 1 - front left
        var dome1Geo = new THREE.SphereGeometry(9, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.55);
        makeMesh(dome1Geo, 0xFFD700, -28, 36, -30);
        var drum1Geo = new THREE.CylinderGeometry(8, 8, 8, 10);
        makeMesh(drum1Geo, 0xD4C8A0, -28, 28, -30);

        // Smaller dome 2 - front right
        var dome2Geo = new THREE.SphereGeometry(9, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.55);
        makeMesh(dome2Geo, 0xFFD700, 28, 36, -30);
        var drum2Geo = new THREE.CylinderGeometry(8, 8, 8, 10);
        makeMesh(drum2Geo, 0xD4C8A0, 28, 28, -30);

        // Smaller dome 3 - rear left
        var dome3Geo = new THREE.SphereGeometry(9, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.55);
        makeMesh(dome3Geo, 0xFFD700, -28, 36, -80);
        var drum3Geo = new THREE.CylinderGeometry(8, 8, 8, 10);
        makeMesh(drum3Geo, 0xD4C8A0, -28, 28, -80);

        // Smaller dome 4 - rear right
        var dome4Geo = new THREE.SphereGeometry(9, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.55);
        makeMesh(dome4Geo, 0xFFD700, 28, 36, -80);
        var drum4Geo = new THREE.CylinderGeometry(8, 8, 8, 10);
        makeMesh(drum4Geo, 0xD4C8A0, 28, 28, -80);

        // Apse dome
        var dome5Geo = new THREE.SphereGeometry(7, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
        makeMesh(dome5Geo, 0xFFD700, 0, 32, -110);

        // Bell tower left
        var belltower1Geo = new THREE.BoxGeometry(14, 50, 14);
        makeMesh(belltower1Geo, 0xD4C8A0, -55, 25, -40);
        var belfry1Geo = new THREE.CylinderGeometry(9, 9, 8, 8);
        makeMesh(belfry1Geo, 0xD4C8A0, -55, 53, -40);
        var belldome1Geo = new THREE.SphereGeometry(9, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
        makeMesh(belldome1Geo, 0xFFD700, -55, 60, -40);

        // Bell tower right
        var belltower2Geo = new THREE.BoxGeometry(14, 50, 14);
        makeMesh(belltower2Geo, 0xD4C8A0, 55, 25, -40);
        var belfry2Geo = new THREE.CylinderGeometry(9, 9, 8, 8);
        makeMesh(belfry2Geo, 0xD4C8A0, 55, 53, -40);
        var belldome2Geo = new THREE.SphereGeometry(9, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
        makeMesh(belldome2Geo, 0xFFD700, 55, 60, -40);

        // Wide entrance steps - stacked boxes
        var step1Geo = new THREE.BoxGeometry(80, 2, 12);
        makeMesh(step1Geo, 0xC8B88A, 0, 1, -5);
        var step2Geo = new THREE.BoxGeometry(76, 2, 10);
        makeMesh(step2Geo, 0xC8B88A, 0, 3, -8);
        var step3Geo = new THREE.BoxGeometry(72, 2, 8);
        makeMesh(step3Geo, 0xC8B88A, 0, 5, -11);

        // Entrance portico columns
        var col1Geo = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
        makeMesh(col1Geo, 0xE8DCC0, -15, 11, -14);
        var col2Geo = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
        makeMesh(col2Geo, 0xE8DCC0, -5, 11, -14);
        var col3Geo = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
        makeMesh(col3Geo, 0xE8DCC0, 5, 11, -14);
        var col4Geo = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
        makeMesh(col4Geo, 0xE8DCC0, 15, 11, -14);

        // Gilded icon panels flanking door
        var iconLeft = new THREE.BoxGeometry(5, 8, 0.5);
        makeMesh(iconLeft, 0xFFD700, -12, 10, -15);
        var iconRight = new THREE.BoxGeometry(5, 8, 0.5);
        makeMesh(iconRight, 0xFFD700, 12, 10, -15);

        // Door arch
        var doorGeo = new THREE.BoxGeometry(10, 14, 1);
        makeMesh(doorGeo, 0x4A3A20, 0, 8, -15.3);
        var archGeo = new THREE.SphereGeometry(5, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.5);
        makeMeshRot(archGeo, 0xD4C8A0, 0, 16, -15.3, 0, 0, 0);
    }

    function buildNDK() {
        // NDK main massive body - 12-story brutalist block
        var ndkMainGeo = new THREE.BoxGeometry(160, 60, 90);
        makeMesh(ndkMainGeo, 0x888899, 200, 30, -80);

        // NDK horizontal banding (brutalist detail)
        var band1Geo = new THREE.BoxGeometry(162, 3, 92);
        makeMesh(band1Geo, 0x777788, 200, 15, -80);
        var band2Geo = new THREE.BoxGeometry(162, 3, 92);
        makeMesh(band2Geo, 0x777788, 200, 30, -80);
        var band3Geo = new THREE.BoxGeometry(162, 3, 92);
        makeMesh(band3Geo, 0x777788, 200, 45, -80);

        // NDK roof parapet
        var parapetGeo = new THREE.BoxGeometry(164, 4, 94);
        makeMesh(parapetGeo, 0x888899, 200, 62, -80);

        // NDK central tower block (raised section)
        var towerGeo = new THREE.BoxGeometry(60, 20, 92);
        makeMesh(towerGeo, 0x8A8A9A, 200, 70, -80);

        // Monumental staircase front
        var stair1Geo = new THREE.BoxGeometry(140, 3, 20);
        makeMesh(stair1Geo, 0x999999, 200, 1.5, -30);
        var stair2Geo = new THREE.BoxGeometry(136, 3, 16);
        makeMesh(stair2Geo, 0x999999, 200, 4.5, -34);
        var stair3Geo = new THREE.BoxGeometry(132, 3, 12);
        makeMesh(stair3Geo, 0x999999, 200, 7.5, -37);
        var stair4Geo = new THREE.BoxGeometry(128, 3, 8);
        makeMesh(stair4Geo, 0x999999, 200, 10.5, -39);

        // Bas-relief panels on facade
        var relief1Geo = new THREE.BoxGeometry(30, 15, 2);
        makeMesh(relief1Geo, 0x7A7A8A, 160, 35, -35.5);
        var relief2Geo = new THREE.BoxGeometry(30, 15, 2);
        makeMesh(relief2Geo, 0x7A7A8A, 200, 35, -35.5);
        var relief3Geo = new THREE.BoxGeometry(30, 15, 2);
        makeMesh(relief3Geo, 0x7A7A8A, 240, 35, -35.5);

        // NDK columns at entrance
        var ndkCol1Geo = new THREE.CylinderGeometry(2.5, 2.5, 18, 8);
        makeMesh(ndkCol1Geo, 0x9A9AAA, 175, 9, -36);
        var ndkCol2Geo = new THREE.CylinderGeometry(2.5, 2.5, 18, 8);
        makeMesh(ndkCol2Geo, 0x9A9AAA, 190, 9, -36);
        var ndkCol3Geo = new THREE.CylinderGeometry(2.5, 2.5, 18, 8);
        makeMesh(ndkCol3Geo, 0x9A9AAA, 210, 9, -36);
        var ndkCol4Geo = new THREE.CylinderGeometry(2.5, 2.5, 18, 8);
        makeMesh(ndkCol4Geo, 0x9A9AAA, 225, 9, -36);

        // NDK side wings
        var wingLeftGeo = new THREE.BoxGeometry(30, 40, 90);
        makeMesh(wingLeftGeo, 0x888899, 115, 20, -80);
        var wingRightGeo = new THREE.BoxGeometry(30, 40, 90);
        makeMesh(wingRightGeo, 0x888899, 285, 20, -80);
    }

    function buildVitosha() {
        // Main mountain mass - large cone
        var mountainGeo = new THREE.ConeGeometry(300, 500, 10);
        makeMesh(mountainGeo, 0x6B7A5A, 0, 250, -700);

        // Cherni Vrah peak - highest point
        var peakGeo = new THREE.ConeGeometry(80, 200, 8);
        makeMesh(peakGeo, 0x7A8A6A, -30, 490, -680);

        // Snow-capped summit
        var snowCapGeo = new THREE.SphereGeometry(70, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.3);
        makeMesh(snowCapGeo, 0xF8F8FF, -30, 550, -680);

        // Snow patches on peak
        var snow1Geo = new THREE.SphereGeometry(30, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.4);
        makeMesh(snow1Geo, 0xF0F0F8, 20, 510, -660);
        var snow2Geo = new THREE.SphereGeometry(25, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.4);
        makeMesh(snow2Geo, 0xF0F0F8, -60, 505, -700);

        // Weather station on Cherni Vrah
        var stationBaseGeo = new THREE.CylinderGeometry(8, 10, 12, 8);
        makeMesh(stationBaseGeo, 0xCCCCCC, -30, 600, -680);
        var stationTopGeo = new THREE.BoxGeometry(14, 8, 14);
        makeMesh(stationTopGeo, 0xBBBBBB, -30, 616, -680);
        var antennaGeo = new THREE.CylinderGeometry(0.8, 0.8, 20, 6);
        makeMesh(antennaGeo, 0xAAAAAA, -30, 630, -680);

        // Secondary peak to the right
        var peak2Geo = new THREE.ConeGeometry(120, 280, 8);
        makeMesh(peak2Geo, 0x607060, 150, 340, -720);

        // Left ridge
        var ridgeGeo = new THREE.BoxGeometry(200, 180, 80);
        makeMeshRot(ridgeGeo, 0x5A6A4A, -200, 220, -650, 0, 0.3, 0.15);

        // Forested slopes - lower tree-line boxes
        var forest1Geo = new THREE.BoxGeometry(280, 80, 100);
        makeMesh(forest1Geo, 0x3A5A2A, 0, 80, -500);
        var forest2Geo = new THREE.BoxGeometry(320, 60, 80);
        makeMesh(forest2Geo, 0x3A5A2A, -50, 60, -560);
        var forest3Geo = new THREE.BoxGeometry(260, 70, 90);
        makeMesh(forest3Geo, 0x4A6A3A, 80, 70, -520);

        // Rocky outcrops
        var rock1Geo = new THREE.BoxGeometry(30, 25, 30);
        makeMeshRot(rock1Geo, 0x7A7A6A, -80, 360, -640, 0.2, 0.4, 0.1);
        var rock2Geo = new THREE.BoxGeometry(25, 20, 25);
        makeMeshRot(rock2Geo, 0x7A7A6A, 60, 380, -650, 0.1, -0.3, 0.2);
    }

    function buildBoyanaChurch() {
        // Main church building 1 (older)
        var church1Geo = new THREE.BoxGeometry(14, 10, 18);
        makeMesh(church1Geo, 0xC8B880, -180, 5, -120);

        // Church 1 roof
        var roof1Geo = new THREE.ConeGeometry(11, 6, 4);
        makeMeshRot(roof1Geo, 0x9A8850, -180, 13, -120, 0, Math.PI * 0.25, 0);

        // Main church building 2 (newer)
        var church2Geo = new THREE.BoxGeometry(16, 12, 20);
        makeMesh(church2Geo, 0xC8B880, -158, 6, -120);

        // Church 2 roof
        var roof2Geo = new THREE.ConeGeometry(12, 7, 4);
        makeMeshRot(roof2Geo, 0x9A8850, -158, 15.5, -120, 0, Math.PI * 0.25, 0);

        // Small dome on church 2
        var boyDomeGeo = new THREE.SphereGeometry(4, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6);
        makeMesh(boyDomeGeo, 0xD4A840, -158, 22, -115);

        // Fortified monastery walls
        var wall1Geo = new THREE.BoxGeometry(60, 6, 2);
        makeMesh(wall1Geo, 0xB8A870, -175, 3, -100);
        var wall2Geo = new THREE.BoxGeometry(2, 6, 40);
        makeMesh(wall2Geo, 0xB8A870, -145, 3, -120);
        var wall3Geo = new THREE.BoxGeometry(60, 6, 2);
        makeMesh(wall3Geo, 0xB8A870, -175, 3, -140);
        var wall4Geo = new THREE.BoxGeometry(2, 6, 40);
        makeMesh(wall4Geo, 0xB8A870, -205, 3, -120);

        // Corner towers on walls
        var corner1Geo = new THREE.CylinderGeometry(3, 3, 10, 6);
        makeMesh(corner1Geo, 0xB8A870, -145, 5, -100);
        var corner2Geo = new THREE.CylinderGeometry(3, 3, 10, 6);
        makeMesh(corner2Geo, 0xB8A870, -145, 5, -140);
        var corner3Geo = new THREE.CylinderGeometry(3, 3, 10, 6);
        makeMesh(corner3Geo, 0xB8A870, -205, 5, -100);
    }

    function buildHistoricalMuseum() {
        // Main museum block
        var museumGeo = new THREE.BoxGeometry(90, 20, 60);
        makeMesh(museumGeo, 0xD4C8B0, -200, 10, 100);

        // Museum front wing
        var frontGeo = new THREE.BoxGeometry(60, 16, 20);
        makeMesh(frontGeo, 0xD4C8B0, -200, 8, 70);

        // Museum rear wing
        var rearGeo = new THREE.BoxGeometry(50, 18, 18);
        makeMesh(rearGeo, 0xD4C8B0, -200, 9, 130);

        // Museum entrance canopy
        var canopyGeo = new THREE.BoxGeometry(40, 2, 12);
        makeMesh(canopyGeo, 0xCCBB9A, -200, 18, 62);

        // Museum columns
        var mcol1Geo = new THREE.CylinderGeometry(1.2, 1.2, 16, 8);
        makeMesh(mcol1Geo, 0xE0D4BC, -215, 8, 62);
        var mcol2Geo = new THREE.CylinderGeometry(1.2, 1.2, 16, 8);
        makeMesh(mcol2Geo, 0xE0D4BC, -205, 8, 62);
        var mcol3Geo = new THREE.CylinderGeometry(1.2, 1.2, 16, 8);
        makeMesh(mcol3Geo, 0xE0D4BC, -195, 8, 62);
        var mcol4Geo = new THREE.CylinderGeometry(1.2, 1.2, 16, 8);
        makeMesh(mcol4Geo, 0xE0D4BC, -185, 8, 62);
    }

    function buildRotundaStGeorge() {
        // Cylindrical Roman rotunda body
        var rotundaGeo = new THREE.CylinderGeometry(10, 10, 14, 12);
        makeMesh(rotundaGeo, 0xC89870, 80, 7, 30);

        // Red brick drum (second register)
        var brickDrumGeo = new THREE.CylinderGeometry(9, 10, 6, 12);
        makeMesh(brickDrumGeo, 0xB07840, 80, 18, 30);

        // Conical roof
        var rotRoofGeo = new THREE.ConeGeometry(10, 8, 12);
        makeMesh(rotRoofGeo, 0x9A6840, 80, 25, 30);

        // Small cross at top
        var rotCrossGeo = new THREE.BoxGeometry(0.8, 5, 0.8);
        makeMesh(rotCrossGeo, 0x8A5830, 80, 31, 30);

        // Surrounding courtyard walls (modern hotel surrounds it)
        var cyard1Geo = new THREE.BoxGeometry(70, 25, 4);
        makeMesh(cyard1Geo, 0xC0B090, 80, 12.5, 55);
        var cyard2Geo = new THREE.BoxGeometry(70, 25, 4);
        makeMesh(cyard2Geo, 0xC0B090, 80, 12.5, 5);
        var cyard3Geo = new THREE.BoxGeometry(4, 25, 50);
        makeMesh(cyard3Geo, 0xC0B090, 115, 12.5, 30);
        var cyard4Geo = new THREE.BoxGeometry(4, 25, 50);
        makeMesh(cyard4Geo, 0xC0B090, 45, 12.5, 30);
    }

    function buildYellowBrickRoad() {
        // Yellow cobblestone street main stretch
        var road1Geo = new THREE.BoxGeometry(12, 0.4, 200);
        makeMesh(road1Geo, 0xDAA520, 40, 0.2, 50);

        // Yellow brick cross street
        var road2Geo = new THREE.BoxGeometry(200, 0.4, 12);
        makeMesh(road2Geo, 0xDAA520, 40, 0.2, 60);

        // Yellow brick branch toward Alexander Nevsky
        var road3Geo = new THREE.BoxGeometry(12, 0.4, 100);
        makeMesh(road3Geo, 0xDAA520, 0, 0.2, 15);
    }

    function buildPresidency() {
        // Presidency building main block
        var presGeo = new THREE.BoxGeometry(50, 22, 30);
        makeMesh(presGeo, 0xC8C8C0, 100, 11, 60);

        // Presidency roof cornice
        var corniceGeo = new THREE.BoxGeometry(52, 3, 32);
        makeMesh(corniceGeo, 0xD0D0C8, 100, 23.5, 60);

        // Presidency flag pole
        var flagpoleGeo = new THREE.CylinderGeometry(0.5, 0.5, 18, 6);
        makeMesh(flagpoleGeo, 0xAAAAAA, 100, 31, 60);

        // Bulgarian flag (three boxes stacked - white/green/red)
        var flagWhiteGeo = new THREE.BoxGeometry(6, 2, 0.3);
        makeMesh(flagWhiteGeo, 0xFFFFFF, 103, 38, 60);
        var flagGreenGeo = new THREE.BoxGeometry(6, 2, 0.3);
        makeMesh(flagGreenGeo, 0x00966E, 103, 36, 60);
        var flagRedGeo = new THREE.BoxGeometry(6, 2, 0.3);
        makeMesh(flagRedGeo, 0xD01C1F, 103, 34, 60);

        // Guard posts / sentry boxes
        var sentry1Geo = new THREE.BoxGeometry(3, 4, 3);
        makeMesh(sentry1Geo, 0x888880, 76, 2, 46);
        var sentry2Geo = new THREE.BoxGeometry(3, 4, 3);
        makeMesh(sentry2Geo, 0x888880, 124, 2, 46);

        // Guards of Honour (stylized soldiers)
        var guard1Geo = new THREE.CylinderGeometry(0.8, 0.8, 4.5, 6);
        makeMesh(guard1Geo, 0x2A3A50, 76, 2.25, 43);
        var guard2Geo = new THREE.CylinderGeometry(0.8, 0.8, 4.5, 6);
        makeMesh(guard2Geo, 0x2A3A50, 124, 2.25, 43);

        // Presidency front columns
        var pcol1Geo = new THREE.CylinderGeometry(1.5, 1.5, 22, 8);
        makeMesh(pcol1Geo, 0xD8D8D0, 84, 11, 47);
        var pcol2Geo = new THREE.CylinderGeometry(1.5, 1.5, 22, 8);
        makeMesh(pcol2Geo, 0xD8D8D0, 92, 11, 47);
        var pcol3Geo = new THREE.CylinderGeometry(1.5, 1.5, 22, 8);
        makeMesh(pcol3Geo, 0xD8D8D0, 108, 11, 47);
        var pcol4Geo = new THREE.CylinderGeometry(1.5, 1.5, 22, 8);
        makeMesh(pcol4Geo, 0xD8D8D0, 116, 11, 47);
    }

    function buildBanyaBashiMosque() {
        // Mosque main body
        var mosqueGeo = new THREE.BoxGeometry(24, 12, 24);
        makeMesh(mosqueGeo, 0xC8A858, -80, 6, 80);

        // Lead dome (dark grey)
        var mosqueDomeGeo = new THREE.SphereGeometry(13, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
        makeMesh(mosqueDomeGeo, 0x888878, -80, 16, 80);

        // Minaret base
        var minaretBaseGeo = new THREE.CylinderGeometry(3, 4, 6, 8);
        makeMesh(minaretBaseGeo, 0xC8A858, -100, 3, 68);

        // Minaret shaft
        var minaretGeo = new THREE.CylinderGeometry(2, 3, 30, 8);
        makeMesh(minaretGeo, 0xC8A858, -100, 18, 68);

        // Minaret balcony ring
        var balconyGeo = new THREE.CylinderGeometry(3.5, 3.5, 1.5, 8);
        makeMesh(balconyGeo, 0xB89848, -100, 34, 68);

        // Minaret tip cone
        var minaretTipGeo = new THREE.ConeGeometry(2.5, 6, 8);
        makeMesh(minaretTipGeo, 0xC8A858, -100, 38, 68);

        // Crescent on minaret (represented as sphere)
        var crescentGeo = new THREE.SphereGeometry(1.2, 6, 4);
        makeMesh(crescentGeo, 0xFFD700, -100, 42, 68);

        // Mosque entrance arch
        var archPortalGeo = new THREE.BoxGeometry(6, 9, 1);
        makeMesh(archPortalGeo, 0x8A6830, -80, 4.5, 68.3);

        // Mosque side portico
        var porticoGeo = new THREE.BoxGeometry(24, 7, 5);
        makeMesh(porticoGeo, 0xBE9848, -80, 3.5, 67);
    }

    function buildLargo() {
        // Central Largo party house / council building
        var largoMainGeo = new THREE.BoxGeometry(100, 35, 50);
        makeMesh(largoMainGeo, 0x999999, -50, 17.5, 180);

        // Soviet star on top of central building
        var starGeo = new THREE.SphereGeometry(4, 5, 4);
        makeMesh(starGeo, 0xCC2200, -50, 38, 180);

        // Largo left wing (communist era block)
        var leftWingGeo = new THREE.BoxGeometry(70, 28, 40);
        makeMesh(leftWingGeo, 0x9A9A9A, -140, 14, 180);

        // Largo right wing
        var rightWingGeo = new THREE.BoxGeometry(70, 28, 40);
        makeMesh(rightWingGeo, 0x9A9A9A, 40, 14, 180);

        // Connecting colonnade left
        var colonnade1Geo = new THREE.BoxGeometry(20, 18, 4);
        makeMesh(colonnade1Geo, 0xA0A0A0, -95, 9, 157);

        // Connecting colonnade right
        var colonnade2Geo = new THREE.BoxGeometry(20, 18, 4);
        makeMesh(colonnade2Geo, 0xA0A0A0, -5, 9, 157);

        // Largo uniform neoclassical ornament rows
        var ornament1Geo = new THREE.BoxGeometry(100, 4, 2);
        makeMesh(ornament1Geo, 0xAAAAAA, -50, 8, 157);
        var ornament2Geo = new THREE.BoxGeometry(100, 4, 2);
        makeMesh(ornament2Geo, 0xAAAAAA, -50, 18, 157);
        var ornament3Geo = new THREE.BoxGeometry(100, 4, 2);
        makeMesh(ornament3Geo, 0xAAAAAA, -50, 28, 157);

        // Largo square pavement extension
        var largoPlazaGeo = new THREE.BoxGeometry(250, 0.3, 80);
        makeMesh(largoPlazaGeo, 0xAAAAAA, -50, 0.15, 140);

        // Soviet monument obelisk in Largo
        var obeliskBaseGeo = new THREE.BoxGeometry(8, 3, 8);
        makeMesh(obeliskBaseGeo, 0x888888, -50, 1.5, 140);
        var obeliskShaftGeo = new THREE.BoxGeometry(4, 25, 4);
        makeMesh(obeliskShaftGeo, 0x9A9A9A, -50, 14.5, 140);
        var obeliskTipGeo = new THREE.ConeGeometry(3, 6, 4);
        makeMeshRot(obeliskTipGeo, 0xAAAAAA, -50, 29, 140, 0, Math.PI * 0.25, 0);
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
