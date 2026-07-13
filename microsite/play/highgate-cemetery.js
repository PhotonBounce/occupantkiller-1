window.HighgateCemetery = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 12080;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function buildEgyptianAvenue() {
        var darkStone = makeMaterial(0x2a2a2a);
        var ironGray = makeMaterial(0x1a1a1a);
        var hieroglyphic = makeMaterial(0x3d3020);

        // Two rows of 4 obelisk columns, spaced along Z axis
        var columnPositions = [
            { x: -6, z: 0 },
            { x: -6, z: 6 },
            { x: -6, z: 12 },
            { x: -6, z: 18 },
            { x:  6, z: 0 },
            { x:  6, z: 6 },
            { x:  6, z: 12 },
            { x:  6, z: 18 }
        ];

        for (var i = 0; i < columnPositions.length; i++) {
            var cp = columnPositions[i];

            // Obelisk shaft
            var shaftGeo = new THREE.BoxGeometry(1.2, 10, 1.2);
            var shaft = new THREE.Mesh(shaftGeo, darkStone);
            shaft.position.set(X_OFFSET + cp.x, 5, cp.z);
            addMesh(shaft);

            // Obelisk cap (pyramid tip)
            var capGeo = new THREE.CylinderGeometry(0, 0.7, 2.5, 4);
            var cap = new THREE.Mesh(capGeo, darkStone);
            cap.position.set(X_OFFSET + cp.x, 11.25, cp.z);
            cap.rotation.y = Math.PI / 4;
            addMesh(cap);

            // Hieroglyphic panel on shaft
            var panelGeo = new THREE.BoxGeometry(0.1, 4, 0.8);
            var panel = new THREE.Mesh(panelGeo, hieroglyphic);
            panel.position.set(X_OFFSET + cp.x + (cp.x < 0 ? 0.65 : -0.65), 5, cp.z);
            addMesh(panel);

            // Base plinth
            var plinthGeo = new THREE.BoxGeometry(1.8, 0.8, 1.8);
            var plinth = new THREE.Mesh(plinthGeo, darkStone);
            plinth.position.set(X_OFFSET + cp.x, 0.4, cp.z);
            addMesh(plinth);
        }

        // Massive iron gates — two gate panels
        var gateGeo = new THREE.BoxGeometry(4.5, 6, 0.2);
        var gateLeft = new THREE.Mesh(gateGeo, ironGray);
        gateLeft.position.set(X_OFFSET - 3, 3, -2);
        addMesh(gateLeft);

        var gateRight = new THREE.Mesh(gateGeo, ironGray);
        gateRight.position.set(X_OFFSET + 3, 3, -2);
        addMesh(gateRight);

        // Gate top arch bar
        var gateArchGeo = new THREE.BoxGeometry(9.2, 0.4, 0.3);
        var gateArch = new THREE.Mesh(gateArchGeo, ironGray);
        gateArch.position.set(X_OFFSET, 6, -2);
        addMesh(gateArch);

        // Gate vertical bars
        for (var b = -4; b <= 4; b++) {
            var barGeo = new THREE.BoxGeometry(0.12, 6, 0.12);
            var bar = new THREE.Mesh(barGeo, ironGray);
            bar.position.set(X_OFFSET + b, 3, -2);
            addMesh(bar);

            // Spear tip on each bar
            var spearGeo = new THREE.ConeGeometry(0.12, 0.5, 4);
            var spear = new THREE.Mesh(spearGeo, ironGray);
            spear.position.set(X_OFFSET + b, 6.25, -2);
            addMesh(spear);
        }

        // Grand gateway arch pillars
        var gatePillarGeo = new THREE.BoxGeometry(2, 8, 2);
        var leftPillar = new THREE.Mesh(gatePillarGeo, darkStone);
        leftPillar.position.set(X_OFFSET - 8, 4, -2);
        addMesh(leftPillar);

        var rightPillar = new THREE.Mesh(gatePillarGeo, darkStone);
        rightPillar.position.set(X_OFFSET + 8, 4, -2);
        addMesh(rightPillar);

        // Lintel across gateway pillars
        var lintelGeo = new THREE.BoxGeometry(18, 1.5, 2);
        var lintel = new THREE.Mesh(lintelGeo, darkStone);
        lintel.position.set(X_OFFSET, 8.75, -2);
        addMesh(lintel);

        // Hieroglyphic panels on gateway lintel
        var lintelPanelGeo = new THREE.BoxGeometry(14, 0.8, 0.15);
        var lintelPanel = new THREE.Mesh(lintelPanelGeo, hieroglyphic);
        lintelPanel.position.set(X_OFFSET, 8.75, -1.1);
        addMesh(lintelPanel);

        // Flanking boundary walls
        var wallGeo = new THREE.BoxGeometry(0.5, 4, 20);
        var leftWall = new THREE.Mesh(wallGeo, darkStone);
        leftWall.position.set(X_OFFSET - 9, 2, 8);
        addMesh(leftWall);

        var rightWall = new THREE.Mesh(wallGeo, darkStone);
        rightWall.position.set(X_OFFSET + 9, 2, 8);
        addMesh(rightWall);

        // Path stones down the avenue
        for (var p = 0; p < 5; p++) {
            var pathGeo = new THREE.BoxGeometry(10, 0.1, 1.2);
            var path = new THREE.Mesh(pathGeo, makeMaterial(0x1e1e1e));
            path.position.set(X_OFFSET, 0.05, p * 4);
            addMesh(path);
        }
    }

    function buildCircleOfLebanon() {
        var stoneMat = makeMaterial(0x3a3530);
        var darkStoneMat = makeMaterial(0x2a2a2a);
        var barkMat = makeMaterial(0x3d2b1f);
        var leafMat = makeMaterial(0x1a3d1a);
        var leafDarkMat = makeMaterial(0x122810);
        var mossGreen = makeMaterial(0x2d4a1e);

        var cx = X_OFFSET + 40;
        var cz = 40;
        var radius = 18;

        // Sunken circular path — ring of flat slabs
        for (var s = 0; s < 24; s++) {
            var angle = (s / 24) * Math.PI * 2;
            var slabGeo = new THREE.BoxGeometry(4.5, 0.15, 2);
            var slab = new THREE.Mesh(slabGeo, makeMaterial(0x252020));
            slab.position.set(
                cx + Math.cos(angle) * radius,
                -0.5,
                cz + Math.sin(angle) * radius
            );
            slab.rotation.y = -angle;
            addMesh(slab);
        }

        // Sunken path border inner ring
        for (var ri = 0; ri < 16; ri++) {
            var ra = (ri / 16) * Math.PI * 2;
            var borderGeo = new THREE.BoxGeometry(0.4, 0.5, 0.4);
            var border = new THREE.Mesh(borderGeo, stoneMat);
            border.position.set(
                cx + Math.cos(ra) * (radius - 2),
                -0.2,
                cz + Math.sin(ra) * (radius - 2)
            );
            addMesh(border);
        }

        // Ancient cedar tree — massive trunk
        var trunkGeo = new THREE.CylinderGeometry(1.8, 2.5, 14, 8);
        var trunk = new THREE.Mesh(trunkGeo, barkMat);
        trunk.position.set(cx, 7, cz);
        addMesh(trunk);

        // Cedar canopy — wide layered spheres
        var canopy1Geo = new THREE.SphereGeometry(12, 10, 8);
        var canopy1 = new THREE.Mesh(canopy1Geo, leafMat);
        canopy1.position.set(cx, 18, cz);
        canopy1.scale.set(1, 0.45, 1);
        addMesh(canopy1);

        var canopy2Geo = new THREE.SphereGeometry(9, 10, 8);
        var canopy2 = new THREE.Mesh(canopy2Geo, leafDarkMat);
        canopy2.position.set(cx, 21, cz);
        canopy2.scale.set(1, 0.5, 1);
        addMesh(canopy2);

        var canopy3Geo = new THREE.SphereGeometry(5, 8, 6);
        var canopy3 = new THREE.Mesh(canopy3Geo, leafMat);
        canopy3.position.set(cx, 24, cz);
        canopy3.scale.set(1, 0.55, 1);
        addMesh(canopy3);

        // Large exposed roots
        for (var r = 0; r < 6; r++) {
            var rootAngle = (r / 6) * Math.PI * 2;
            var rootGeo = new THREE.BoxGeometry(0.4, 0.3, 3);
            var root = new THREE.Mesh(rootGeo, barkMat);
            root.position.set(
                cx + Math.cos(rootAngle) * 3,
                0.1,
                cz + Math.sin(rootAngle) * 3
            );
            root.rotation.y = rootAngle;
            addMesh(root);
        }

        // Tomb chambers in ring around cedar
        var tombRadius = radius + 5;
        for (var t = 0; t < 8; t++) {
            var ta = (t / 8) * Math.PI * 2;
            var tx = cx + Math.cos(ta) * tombRadius;
            var tz = cz + Math.sin(ta) * tombRadius;

            // Tomb body
            var tombGeo = new THREE.BoxGeometry(4, 3.5, 3);
            var tomb = new THREE.Mesh(tombGeo, stoneMat);
            tomb.position.set(tx, 1.75, tz);
            tomb.rotation.y = -ta;
            addMesh(tomb);

            // Tomb roof
            var roofGeo = new THREE.CylinderGeometry(0, 2.2, 1.5, 4);
            var roof = new THREE.Mesh(roofGeo, darkStoneMat);
            roof.position.set(tx, 4.25, tz);
            roof.rotation.y = -ta + Math.PI / 4;
            addMesh(roof);

            // Arched door (dark recess)
            var doorGeo = new THREE.BoxGeometry(1.2, 2.2, 0.2);
            var doorMat = makeMaterial(0x0d0d0d);
            var door = new THREE.Mesh(doorGeo, doorMat);
            var faceOffset = 1.6;
            door.position.set(
                tx + Math.cos(ta) * faceOffset,
                1.1,
                tz + Math.sin(ta) * faceOffset
            );
            door.rotation.y = -ta;
            addMesh(door);

            // Door arch top
            var archGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 8, 1, false, 0, Math.PI);
            var arch = new THREE.Mesh(archGeo, doorMat);
            arch.position.set(
                tx + Math.cos(ta) * faceOffset,
                2.3,
                tz + Math.sin(ta) * faceOffset
            );
            arch.rotation.z = Math.PI / 2;
            arch.rotation.y = -ta;
            addMesh(arch);

            // Tomb steps
            var stepGeo = new THREE.BoxGeometry(4.5, 0.3, 0.6);
            var step = new THREE.Mesh(stepGeo, darkStoneMat);
            step.position.set(
                tx + Math.cos(ta) * (faceOffset + 0.5),
                0.15,
                tz + Math.sin(ta) * (faceOffset + 0.5)
            );
            step.rotation.y = -ta;
            addMesh(step);

            // Overgrown moss patches on tomb
            var mossGeo = new THREE.BoxGeometry(3.5, 0.15, 2.5);
            var moss = new THREE.Mesh(mossGeo, mossGreen);
            moss.position.set(tx, 3.6, tz);
            moss.rotation.y = -ta;
            addMesh(moss);
        }

        // Overgrown vegetation around circle
        for (var v = 0; v < 12; v++) {
            var va = (v / 12) * Math.PI * 2;
            var vr = radius + 2 + (v % 3) * 2;
            var vx = cx + Math.cos(va) * vr;
            var vz2 = cz + Math.sin(va) * vr;

            var bushGeo = new THREE.SphereGeometry(0.8 + (v % 3) * 0.4, 6, 5);
            var bush = new THREE.Mesh(bushGeo, v % 2 === 0 ? mossGreen : leafDarkMat);
            bush.position.set(vx, 0.8, vz2);
            bush.scale.set(1, 0.7, 1);
            addMesh(bush);
        }
    }

    function buildKarlMarxMonument() {
        var graniteMat = makeMaterial(0x2e2e2e);
        var darkGraniteMat = makeMaterial(0x1e1e1e);
        var bronzeMat = makeMaterial(0x6b4c11);
        var inscriptionMat = makeMaterial(0x3a3020);

        var mx = X_OFFSET + 80;
        var mz = 20;

        // Monumental stepped base — 4 tiers
        var base4Geo = new THREE.BoxGeometry(10, 1, 8);
        var base4 = new THREE.Mesh(base4Geo, graniteMat);
        base4.position.set(mx, 0.5, mz);
        addMesh(base4);

        var base3Geo = new THREE.BoxGeometry(8.5, 1.2, 6.5);
        var base3 = new THREE.Mesh(base3Geo, graniteMat);
        base3.position.set(mx, 1.6, mz);
        addMesh(base3);

        var base2Geo = new THREE.BoxGeometry(7, 1.2, 5);
        var base2 = new THREE.Mesh(base2Geo, darkGraniteMat);
        base2.position.set(mx, 2.8, mz);
        addMesh(base2);

        var base1Geo = new THREE.BoxGeometry(5.5, 1.5, 4);
        var base1 = new THREE.Mesh(base1Geo, graniteMat);
        base1.position.set(mx, 4.25, mz);
        addMesh(base1);

        // Main tomb block
        var tombBlockGeo = new THREE.BoxGeometry(4.5, 4, 3);
        var tombBlock = new THREE.Mesh(tombBlockGeo, darkGraniteMat);
        tombBlock.position.set(mx, 7, mz);
        addMesh(tombBlock);

        // Inscription panels on tomb
        var inscFrontGeo = new THREE.BoxGeometry(3.8, 2.5, 0.1);
        var inscFront = new THREE.Mesh(inscFrontGeo, inscriptionMat);
        inscFront.position.set(mx, 7, mz + 1.55);
        addMesh(inscFront);

        var inscBackGeo = new THREE.BoxGeometry(3.8, 2.5, 0.1);
        var inscBack = new THREE.Mesh(inscBackGeo, inscriptionMat);
        inscBack.position.set(mx, 7, mz - 1.55);
        addMesh(inscBack);

        // Plinth for bust
        var plinthGeo = new THREE.CylinderGeometry(0.7, 0.9, 2, 8);
        var plinths = new THREE.Mesh(plinthGeo, graniteMat);
        plinths.position.set(mx, 10, mz);
        addMesh(plinths);

        // Bronze portrait bust (sphere head + box shoulders)
        var bustHeadGeo = new THREE.SphereGeometry(0.9, 10, 8);
        var bustHead = new THREE.Mesh(bustHeadGeo, bronzeMat);
        bustHead.position.set(mx, 12, mz);
        addMesh(bustHead);

        var bustShoulderGeo = new THREE.BoxGeometry(1.8, 1, 1.2);
        var bustShoulder = new THREE.Mesh(bustShoulderGeo, bronzeMat);
        bustShoulder.position.set(mx, 11, mz);
        addMesh(bustShoulder);

        // Beard representation (box below head)
        var beardGeo = new THREE.BoxGeometry(0.8, 0.6, 0.5);
        var beard = new THREE.Mesh(beardGeo, bronzeMat);
        beard.position.set(mx, 11.4, mz + 0.5);
        addMesh(beard);

        // Flanking small markers
        for (var fl = -1; fl <= 1; fl += 2) {
            var flankGeo = new THREE.BoxGeometry(0.6, 3, 0.6);
            var flank = new THREE.Mesh(flankGeo, graniteMat);
            flank.position.set(mx + fl * 3.5, 1.5, mz);
            addMesh(flank);

            var flankCapGeo = new THREE.CylinderGeometry(0, 0.4, 0.8, 4);
            var flankCap = new THREE.Mesh(flankCapGeo, darkGraniteMat);
            flankCap.position.set(mx + fl * 3.5, 3.4, mz);
            flankCap.rotation.y = Math.PI / 4;
            addMesh(flankCap);
        }

        // Surrounding low fence
        for (var f = 0; f < 4; f++) {
            var fenceGeo = new THREE.BoxGeometry(14, 0.1, 0.1);
            var fence = new THREE.Mesh(fenceGeo, makeMaterial(0x111111));
            var fz = mz + (f < 2 ? -5 : 5);
            if (f % 2 === 0) {
                fence.position.set(mx, 0.8, fz);
            } else {
                fence.rotation.y = Math.PI / 2;
                fence.position.set(mx + (f === 1 ? -7 : 7), 0.8, mz);
            }
            addMesh(fence);
        }
    }

    function buildGothicTombs() {
        var stoneMat = makeMaterial(0x383530);
        var darkMat = makeMaterial(0x222020);
        var weatheredMat = makeMaterial(0x2e2b28);
        var ivyMat = makeMaterial(0x1e4d1a);

        // Scattered tomb positions
        var tombData = [
            { x: X_OFFSET + 20, z: -15, type: 'draped' },
            { x: X_OFFSET + 35, z: -20, type: 'obelisk' },
            { x: X_OFFSET + 55, z: -10, type: 'angel' },
            { x: X_OFFSET + 65, z: -25, type: 'brokenColumn' },
            { x: X_OFFSET + 25, z: 55, type: 'obelisk' },
            { x: X_OFFSET + 50, z: 60, type: 'draped' },
            { x: X_OFFSET + 70, z: 50, type: 'angel' },
            { x: X_OFFSET + 90, z: -15, type: 'brokenColumn' },
            { x: X_OFFSET + 100, z: 35, type: 'draped' },
            { x: X_OFFSET + 15, z: 70, type: 'obelisk' }
        ];

        for (var i = 0; i < tombData.length; i++) {
            var td = tombData[i];
            if (td.type === 'draped') {
                buildDrapedUrnTomb(td.x, td.z, stoneMat, darkMat, ivyMat);
            } else if (td.type === 'obelisk') {
                buildObeliskTomb(td.x, td.z, weatheredMat, darkMat);
            } else if (td.type === 'angel') {
                buildSleepingAngelTomb(td.x, td.z, stoneMat, darkMat);
            } else if (td.type === 'brokenColumn') {
                buildBrokenColumnTomb(td.x, td.z, weatheredMat, darkMat, ivyMat);
            }
        }
    }

    function buildDrapedUrnTomb(x, z, stoneMat, darkMat, ivyMat) {
        // Base slab
        var slabGeo = new THREE.BoxGeometry(3, 0.4, 2);
        var slab = new THREE.Mesh(slabGeo, stoneMat);
        slab.position.set(x, 0.2, z);
        addMesh(slab);

        // Tomb chest
        var chestGeo = new THREE.BoxGeometry(2.5, 1.2, 1.5);
        var chest = new THREE.Mesh(chestGeo, stoneMat);
        chest.position.set(x, 1, z);
        addMesh(chest);

        // Lid
        var lidGeo = new THREE.BoxGeometry(2.6, 0.3, 1.6);
        var lid = new THREE.Mesh(lidGeo, darkMat);
        lid.position.set(x, 1.75, z);
        addMesh(lid);

        // Pedestal for urn
        var pedGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.8, 6);
        var ped = new THREE.Mesh(pedGeo, stoneMat);
        ped.position.set(x, 2.3, z);
        addMesh(ped);

        // Urn body
        var urnGeo = new THREE.CylinderGeometry(0.3, 0.2, 0.7, 8);
        var urn = new THREE.Mesh(urnGeo, darkMat);
        urn.position.set(x, 2.95, z);
        addMesh(urn);

        // Draped cloth representation (flat boxes at angles)
        var drapeGeo = new THREE.BoxGeometry(0.7, 0.08, 1.0);
        var drape = new THREE.Mesh(drapeGeo, stoneMat);
        drape.position.set(x - 0.4, 1.9, z);
        drape.rotation.z = 0.3;
        addMesh(drape);

        var drape2Geo = new THREE.BoxGeometry(0.7, 0.08, 1.0);
        var drape2 = new THREE.Mesh(drape2Geo, stoneMat);
        drape2.position.set(x + 0.4, 1.9, z);
        drape2.rotation.z = -0.3;
        addMesh(drape2);

        // Ivy tendrils
        for (var iv = 0; iv < 4; iv++) {
            var ivyGeo = new THREE.BoxGeometry(0.08, 0.06, 0.8);
            var ivy = new THREE.Mesh(ivyGeo, ivyMat);
            ivy.position.set(x - 1.1 + iv * 0.5, 1.1 - iv * 0.15, z + 0.76);
            ivy.rotation.z = (iv % 2 === 0 ? 0.1 : -0.1);
            addMesh(ivy);
        }
    }

    function buildObeliskTomb(x, z, stoneMat, darkMat) {
        // Base steps
        var step1Geo = new THREE.BoxGeometry(2.5, 0.4, 2.5);
        var step1 = new THREE.Mesh(step1Geo, stoneMat);
        step1.position.set(x, 0.2, z);
        addMesh(step1);

        var step2Geo = new THREE.BoxGeometry(1.8, 0.4, 1.8);
        var step2 = new THREE.Mesh(step2Geo, stoneMat);
        step2.position.set(x, 0.6, z);
        addMesh(step2);

        var step3Geo = new THREE.BoxGeometry(1.2, 0.4, 1.2);
        var step3 = new THREE.Mesh(step3Geo, darkMat);
        step3.position.set(x, 1.0, z);
        addMesh(step3);

        // Obelisk shaft
        var shaftGeo = new THREE.BoxGeometry(0.7, 7, 0.7);
        var shaft = new THREE.Mesh(shaftGeo, stoneMat);
        shaft.position.set(x, 4.7, z);
        addMesh(shaft);

        // Obelisk cap
        var capGeo = new THREE.CylinderGeometry(0, 0.45, 1.5, 4);
        var cap = new THREE.Mesh(capGeo, darkMat);
        cap.position.set(x, 9, z);
        cap.rotation.y = Math.PI / 4;
        addMesh(cap);

        // Inscription panel
        var panelGeo = new THREE.BoxGeometry(0.05, 2, 0.5);
        var panel = new THREE.Mesh(panelGeo, darkMat);
        panel.position.set(x + 0.38, 4, z);
        addMesh(panel);
    }

    function buildSleepingAngelTomb(x, z, stoneMat, darkMat) {
        // Tomb base
        var baseGeo = new THREE.BoxGeometry(3.5, 0.4, 2.5);
        var base = new THREE.Mesh(baseGeo, stoneMat);
        base.position.set(x, 0.2, z);
        addMesh(base);

        // Tomb chest
        var chestGeo = new THREE.BoxGeometry(3, 1.4, 2);
        var chest = new THREE.Mesh(chestGeo, stoneMat);
        chest.position.set(x, 1.1, z);
        addMesh(chest);

        // Sleeping angel — lying body on top
        var bodyGeo = new THREE.BoxGeometry(1.5, 0.4, 0.55);
        var body = new THREE.Mesh(bodyGeo, darkMat);
        body.position.set(x, 1.95, z);
        addMesh(body);

        // Angel head (sphere)
        var headGeo = new THREE.SphereGeometry(0.28, 8, 6);
        var head = new THREE.Mesh(headGeo, darkMat);
        head.position.set(x + 0.7, 2.15, z);
        addMesh(head);

        // Angel wings (boxes, spread out)
        var wingLGeo = new THREE.BoxGeometry(0.08, 0.6, 1.0);
        var wingL = new THREE.Mesh(wingLGeo, stoneMat);
        wingL.position.set(x, 2.1, z - 0.9);
        wingL.rotation.z = 0.25;
        addMesh(wingL);

        var wingRGeo = new THREE.BoxGeometry(0.08, 0.6, 1.0);
        var wingR = new THREE.Mesh(wingRGeo, stoneMat);
        wingR.position.set(x, 2.1, z + 0.9);
        wingR.rotation.z = -0.25;
        addMesh(wingR);

        // Small cross headstone
        var crossVGeo = new THREE.BoxGeometry(0.15, 1.5, 0.15);
        var crossV = new THREE.Mesh(crossVGeo, stoneMat);
        crossV.position.set(x - 1.4, 2.35, z);
        addMesh(crossV);

        var crossHGeo = new THREE.BoxGeometry(0.15, 0.15, 0.8);
        var crossH = new THREE.Mesh(crossHGeo, stoneMat);
        crossH.position.set(x - 1.4, 2.8, z);
        addMesh(crossH);
    }

    function buildBrokenColumnTomb(x, z, stoneMat, darkMat, ivyMat) {
        // Base plinth
        var plinthGeo = new THREE.BoxGeometry(2, 0.6, 2);
        var plinth = new THREE.Mesh(plinthGeo, stoneMat);
        plinth.position.set(x, 0.3, z);
        addMesh(plinth);

        // Column lower section
        var colLowGeo = new THREE.CylinderGeometry(0.45, 0.5, 4, 8);
        var colLow = new THREE.Mesh(colLowGeo, stoneMat);
        colLow.position.set(x, 2.6, z);
        addMesh(colLow);

        // Broken column upper fragment (tilted, shorter)
        var colFragGeo = new THREE.CylinderGeometry(0.38, 0.45, 1.8, 8);
        var colFrag = new THREE.Mesh(colFragGeo, darkMat);
        colFrag.position.set(x + 0.2, 5.5, z + 0.1);
        colFrag.rotation.z = 0.25;
        colFrag.rotation.x = 0.1;
        addMesh(colFrag);

        // Capital on lower column
        var capitalGeo = new THREE.CylinderGeometry(0.6, 0.45, 0.3, 8);
        var capital = new THREE.Mesh(capitalGeo, stoneMat);
        capital.position.set(x, 4.75, z);
        addMesh(capital);

        // Ivy covering column
        for (var ic = 0; ic < 5; ic++) {
            var ivyGeo = new THREE.BoxGeometry(0.4, 0.08, 0.15);
            var ivy = new THREE.Mesh(ivyGeo, ivyMat);
            ivy.position.set(
                x + Math.cos(ic * 1.3) * 0.5,
                1.0 + ic * 0.7,
                z + Math.sin(ic * 1.3) * 0.5
            );
            addMesh(ivy);
        }

        // Scattered stone chips on ground
        for (var sc = 0; sc < 3; sc++) {
            var chipGeo = new THREE.BoxGeometry(0.3 + sc * 0.1, 0.1, 0.2 + sc * 0.1);
            var chip = new THREE.Mesh(chipGeo, darkMat);
            chip.position.set(
                x + sc * 0.5 - 0.5,
                0.05,
                z + sc * 0.3 - 0.3
            );
            chip.rotation.y = sc * 0.8;
            addMesh(chip);
        }
    }

    function buildGravestones() {
        var stoneMat = makeMaterial(0x353030);
        var darkMat = makeMaterial(0x1e1e1e);
        var mossedMat = makeMaterial(0x2a3020);

        // Scattered crooked gravestones
        var stonePositions = [
            { x: X_OFFSET + 10, z: -8 },
            { x: X_OFFSET + 14, z: -12 },
            { x: X_OFFSET + 18, z: -6 },
            { x: X_OFFSET + 30, z: -18 },
            { x: X_OFFSET + 45, z: -22 },
            { x: X_OFFSET + 60, z: -18 },
            { x: X_OFFSET + 75, z: -10 },
            { x: X_OFFSET + 85, z: -20 },
            { x: X_OFFSET + 10, z: 30 },
            { x: X_OFFSET + 15, z: 45 },
            { x: X_OFFSET + 20, z: 62 },
            { x: X_OFFSET + 32, z: 68 },
            { x: X_OFFSET + 55, z: 72 },
            { x: X_OFFSET + 68, z: 65 },
            { x: X_OFFSET + 78, z: 58 },
            { x: X_OFFSET + 95, z: 45 }
        ];

        for (var i = 0; i < stonePositions.length; i++) {
            var sp = stonePositions[i];
            var mat = (i % 3 === 0) ? mossedMat : stoneMat;

            // Headstone slab
            var stoneGeo = new THREE.BoxGeometry(0.8, 1.4, 0.18);
            var stone = new THREE.Mesh(stoneGeo, mat);
            stone.position.set(sp.x, 0.7, sp.z);
            // Crooked lean
            stone.rotation.z = ((i % 5) - 2) * 0.15;
            stone.rotation.y = (i % 4) * 0.4;
            addMesh(stone);

            // Round top on some stones
            if (i % 2 === 0) {
                var topGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.18, 8, 1, false, 0, Math.PI);
                var top = new THREE.Mesh(topGeo, mat);
                top.position.set(sp.x, 1.45, sp.z);
                top.rotation.z = ((i % 5) - 2) * 0.15;
                top.rotation.x = Math.PI / 2;
                top.rotation.y = (i % 4) * 0.4;
                addMesh(top);
            }

            // Cross on some stones
            if (i % 3 === 0) {
                var crossVGeo = new THREE.BoxGeometry(0.12, 0.6, 0.12);
                var crossV = new THREE.Mesh(crossVGeo, darkMat);
                crossV.position.set(sp.x, 1.75, sp.z);
                addMesh(crossV);

                var crossHGeo = new THREE.BoxGeometry(0.12, 0.12, 0.4);
                var crossH = new THREE.Mesh(crossHGeo, darkMat);
                crossH.position.set(sp.x, 1.9, sp.z);
                addMesh(crossH);
            }

            // Small base stone
            var baseGeo = new THREE.BoxGeometry(1.0, 0.2, 0.8);
            var base = new THREE.Mesh(baseGeo, darkMat);
            base.position.set(sp.x, 0.1, sp.z);
            addMesh(base);
        }
    }

    function buildYewTrees() {
        var barkMat = makeMaterial(0x2d1a0e);
        var darkYewMat = makeMaterial(0x0d1f0d);
        var yewMat = makeMaterial(0x162b12);

        var yewPositions = [
            { x: X_OFFSET + 5, z: -5 },
            { x: X_OFFSET + 30, z: -30 },
            { x: X_OFFSET + 60, z: -30 },
            { x: X_OFFSET + 90, z: -5 },
            { x: X_OFFSET + 5, z: 40 },
            { x: X_OFFSET + 30, z: 80 },
            { x: X_OFFSET + 60, z: 80 },
            { x: X_OFFSET + 90, z: 60 }
        ];

        for (var i = 0; i < yewPositions.length; i++) {
            var yp = yewPositions[i];

            // Ancient twisted trunk
            var trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 6, 6);
            var trunk = new THREE.Mesh(trunkGeo, barkMat);
            trunk.position.set(yp.x, 3, yp.z);
            trunk.rotation.z = (i % 3 - 1) * 0.08;
            addMesh(trunk);

            // Dense dark canopy — layered cones for yew shape
            var cone1Geo = new THREE.ConeGeometry(2.5, 5, 7);
            var cone1 = new THREE.Mesh(cone1Geo, darkYewMat);
            cone1.position.set(yp.x, 7.5, yp.z);
            addMesh(cone1);

            var cone2Geo = new THREE.ConeGeometry(1.8, 4, 7);
            var cone2 = new THREE.Mesh(cone2Geo, yewMat);
            cone2.position.set(yp.x, 9, yp.z);
            addMesh(cone2);

            var cone3Geo = new THREE.ConeGeometry(1.0, 2.5, 6);
            var cone3 = new THREE.Mesh(cone3Geo, darkYewMat);
            cone3.position.set(yp.x, 10.5, yp.z);
            addMesh(cone3);

            // Exposed surface roots
            for (var r = 0; r < 3; r++) {
                var rootGeo = new THREE.BoxGeometry(0.2, 0.15, 1.5);
                var root = new THREE.Mesh(rootGeo, barkMat);
                root.position.set(
                    yp.x + Math.cos(r * 2.1) * 0.7,
                    0.08,
                    yp.z + Math.sin(r * 2.1) * 0.7
                );
                root.rotation.y = r * 2.1;
                addMesh(root);
            }
        }
    }

    function buildAtmosphericDetails() {
        var ivyMat = makeMaterial(0x1a3d15);
        var darkIvyMat = makeMaterial(0x0e2a0a);
        var pathMat = makeMaterial(0x1a1815);
        var fogMossGround = makeMaterial(0x181a14);
        var wallMat = makeMaterial(0x282420);

        // Ground paths — dark winding tracks
        var pathSegments = [
            { x: X_OFFSET + 30, z: 5, rot: 0.2, len: 20 },
            { x: X_OFFSET + 50, z: 15, rot: -0.1, len: 25 },
            { x: X_OFFSET + 70, z: 30, rot: 0.5, len: 18 },
            { x: X_OFFSET + 40, z: 50, rot: -0.3, len: 22 }
        ];

        for (var p = 0; p < pathSegments.length; p++) {
            var ps = pathSegments[p];
            var pathGeo = new THREE.BoxGeometry(ps.len, 0.08, 2.5);
            var path = new THREE.Mesh(pathGeo, pathMat);
            path.position.set(ps.x, 0.04, ps.z);
            path.rotation.y = ps.rot;
            addMesh(path);

            // Ivy tendrils along path edges
            for (var iv = 0; iv < 6; iv++) {
                var ivyGeo = new THREE.BoxGeometry(0.5, 0.06, 0.12);
                var ivy = new THREE.Mesh(ivyGeo, ivyMat);
                ivy.position.set(
                    ps.x - ps.len / 2 + iv * (ps.len / 5),
                    0.1,
                    ps.z + 1.3 + (iv % 2) * 0.3
                );
                ivy.rotation.z = (iv % 2 === 0 ? 0.2 : -0.2);
                addMesh(ivy);
            }
        }

        // Moss ground patches
        for (var m = 0; m < 20; m++) {
            var mossGeo = new THREE.BoxGeometry(2 + (m % 3), 0.06, 1.5 + (m % 2));
            var moss = new THREE.Mesh(mossGeo, fogMossGround);
            moss.position.set(
                X_OFFSET + 10 + (m * 9) % 100,
                0.03,
                -20 + (m * 7) % 90
            );
            moss.rotation.y = m * 0.6;
            addMesh(moss);
        }

        // Boundary wall sections
        var wallSections = [
            { x: X_OFFSET - 5, z: -25, rot: 0, len: 30 },
            { x: X_OFFSET + 50, z: -30, rot: 0, len: 50 },
            { x: X_OFFSET + 110, z: 20, rot: Math.PI / 2, len: 60 },
            { x: X_OFFSET - 5, z: 50, rot: 0, len: 50 }
        ];

        for (var w = 0; w < wallSections.length; w++) {
            var ws = wallSections[w];
            var wallGeo = new THREE.BoxGeometry(ws.len, 2.5, 0.5);
            var wall = new THREE.Mesh(wallGeo, wallMat);
            wall.position.set(ws.x, 1.25, ws.z);
            wall.rotation.y = ws.rot;
            addMesh(wall);

            // Wall cap
            var capGeo = new THREE.BoxGeometry(ws.len, 0.2, 0.7);
            var cap = new THREE.Mesh(capGeo, makeMaterial(0x1e1c18));
            cap.position.set(ws.x, 2.6, ws.z);
            cap.rotation.y = ws.rot;
            addMesh(cap);

            // Ivy on wall
            for (var iw = 0; iw < 5; iw++) {
                var wallIvyGeo = new THREE.BoxGeometry(0.06, 1.2, 0.8);
                var wallIvy = new THREE.Mesh(wallIvyGeo, darkIvyMat);
                wallIvy.position.set(
                    ws.x - ws.len / 2 + iw * (ws.len / 4),
                    1.2,
                    ws.z + 0.3
                );
                addMesh(wallIvy);
            }
        }

        // Fallen gravestone fragments
        for (var fg = 0; fg < 6; fg++) {
            var fragGeo = new THREE.BoxGeometry(0.9, 0.2, 0.6);
            var frag = new THREE.Mesh(fragGeo, makeMaterial(0x2a2625));
            frag.position.set(
                X_OFFSET + 20 + fg * 12,
                0.1,
                -5 + (fg % 3) * 8
            );
            frag.rotation.y = fg * 0.9;
            frag.rotation.x = 0.1 * (fg % 2 === 0 ? 1 : -1);
            addMesh(frag);
        }
    }

    function build() {
        buildEgyptianAvenue();
        buildCircleOfLebanon();
        buildKarlMarxMonument();
        buildGothicTombs();
        buildGravestones();
        buildYewTrees();
        buildAtmosphericDetails();
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
