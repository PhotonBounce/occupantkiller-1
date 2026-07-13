window.GreenockDock = (function() {
    'use strict';

    var WORLD_X = 2050;
    var WORLD_Z = 2200;

    function buildCustomHouse(scene) {
        var mat = new THREE.MeshLambertMaterial({ color: 0xF5E8C0 });
        var bodyGeo = new THREE.BoxGeometry(20, 10, 12);
        var body = new THREE.Mesh(bodyGeo, mat);
        body.position.set(WORLD_X + 0, 5, WORLD_Z + 0);
        scene.add(body);

        var columnMat = new THREE.MeshLambertMaterial({ color: 0xEDE0B0 });
        var colPositions = [-8, -4.8, -1.6, 1.6, 4.8, 8];
        var i;
        for (i = 0; i < colPositions.length; i++) {
            var colGeo = new THREE.CylinderGeometry(0.5, 0.6, 9, 8);
            var col = new THREE.Mesh(colGeo, columnMat);
            col.position.set(WORLD_X + colPositions[i], 4.5, WORLD_Z - 7);
            scene.add(col);
        }

        var porticoMat = new THREE.MeshLambertMaterial({ color: 0xE8D8A0 });
        var step1Geo = new THREE.BoxGeometry(22, 0.5, 3);
        var step1 = new THREE.Mesh(step1Geo, porticoMat);
        step1.position.set(WORLD_X + 0, 0.25, WORLD_Z - 8.5);
        scene.add(step1);

        var step2Geo = new THREE.BoxGeometry(20, 0.5, 2.5);
        var step2 = new THREE.Mesh(step2Geo, porticoMat);
        step2.position.set(WORLD_X + 0, 0.75, WORLD_Z - 8);
        scene.add(step2);

        var step3Geo = new THREE.BoxGeometry(18, 0.5, 2);
        var step3 = new THREE.Mesh(step3Geo, porticoMat);
        step3.position.set(WORLD_X + 0, 1.25, WORLD_Z - 7.5);
        scene.add(step3);

        var pedimentGeo = new THREE.BoxGeometry(21, 1, 0.5);
        var pediment = new THREE.Mesh(pedimentGeo, mat);
        pediment.position.set(WORLD_X + 0, 10.5, WORLD_Z - 6.8);
        scene.add(pediment);

        var roofGeo = new THREE.BoxGeometry(20.5, 0.8, 12.5);
        var roof = new THREE.Mesh(roofGeo, porticoMat);
        roof.position.set(WORLD_X + 0, 10.4, WORLD_Z + 0);
        scene.add(roof);
    }

    function buildOceanTerminal(scene) {
        var mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var termGeo = new THREE.BoxGeometry(40, 5, 20);
        var term = new THREE.Mesh(termGeo, mat);
        term.position.set(WORLD_X + 60, 2.5, WORLD_Z + 10);
        scene.add(term);

        var darkMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var roofGeo = new THREE.BoxGeometry(40.5, 0.6, 20.5);
        var roof = new THREE.Mesh(roofGeo, darkMat);
        roof.position.set(WORLD_X + 60, 5.3, WORLD_Z + 10);
        scene.add(roof);

        var windowMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
        var w;
        var windowPositions = [-16, -8, 0, 8, 16];
        for (w = 0; w < windowPositions.length; w++) {
            var winGeo = new THREE.BoxGeometry(4, 2.5, 0.3);
            var win = new THREE.Mesh(winGeo, windowMat);
            win.position.set(WORLD_X + 60 + windowPositions[w], 3.5, WORLD_Z + 0.15);
            scene.add(win);
        }

        var pillarMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var pPositions = [-18, -9, 0, 9, 18];
        for (w = 0; w < pPositions.length; w++) {
            var pilGeo = new THREE.BoxGeometry(1.5, 5, 1.5);
            var pil = new THREE.Mesh(pilGeo, pillarMat);
            pil.position.set(WORLD_X + 60 + pPositions[w], 2.5, WORLD_Z + 0);
            scene.add(pil);
        }

        var dockMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var dockGeo = new THREE.BoxGeometry(44, 0.5, 8);
        var dock = new THREE.Mesh(dockGeo, dockMat);
        dock.position.set(WORLD_X + 60, 0.25, WORLD_Z + 24);
        scene.add(dock);
    }

    function buildSugarRefineries(scene) {
        var brickMat = new THREE.MeshLambertMaterial({ color: 0x8A7A6A });
        var chimneyMat = new THREE.MeshLambertMaterial({ color: 0x7A6A5A });

        var warehouses = [
            { x: -30, z: 15, w: 18, h: 10, d: 12 },
            { x: -50, z: 10, w: 14, h: 8, d: 10 },
            { x: -35, z: -5, w: 16, h: 9, d: 11 }
        ];
        var i;
        for (i = 0; i < warehouses.length; i++) {
            var wh = warehouses[i];
            var whGeo = new THREE.BoxGeometry(wh.w, wh.h, wh.d);
            var whMesh = new THREE.Mesh(whGeo, brickMat);
            whMesh.position.set(WORLD_X + wh.x, wh.h / 2, WORLD_Z + wh.z);
            scene.add(whMesh);
        }

        var chimneyPositions = [
            { x: -22, z: 18 },
            { x: -42, z: 14 },
            { x: -58, z: 8 }
        ];
        for (i = 0; i < chimneyPositions.length; i++) {
            var cp = chimneyPositions[i];
            var chimGeo = new THREE.CylinderGeometry(1.2, 1.5, 24, 10);
            var chim = new THREE.Mesh(chimGeo, chimneyMat);
            chim.position.set(WORLD_X + cp.x, 12, WORLD_Z + cp.z);
            scene.add(chim);

            var capMat = new THREE.MeshLambertMaterial({ color: 0x5A4A3A });
            var capGeo = new THREE.CylinderGeometry(1.5, 1.2, 0.8, 10);
            var cap = new THREE.Mesh(capGeo, capMat);
            cap.position.set(WORLD_X + cp.x, 24.4, WORLD_Z + cp.z);
            scene.add(cap);
        }

        var roofMat = new THREE.MeshLambertMaterial({ color: 0x6A5A4A });
        for (i = 0; i < warehouses.length; i++) {
            var whr = warehouses[i];
            var ridgeGeo = new THREE.BoxGeometry(whr.w + 0.5, 1, whr.d + 0.5);
            var ridge = new THREE.Mesh(ridgeGeo, roofMat);
            ridge.position.set(WORLD_X + whr.x, whr.h + 0.5, WORLD_Z + whr.z);
            scene.add(ridge);
        }
    }

    function buildTailOBank(scene) {
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x1A3A5A });
        var anchorGeo = new THREE.BoxGeometry(80, 0.4, 40);
        var anchor = new THREE.Mesh(anchorGeo, waterMat);
        anchor.position.set(WORLD_X + 100, 0.2, WORLD_Z + 60);
        scene.add(anchor);

        var hullMat = new THREE.MeshLambertMaterial({ color: 0x555560 });
        var superMat = new THREE.MeshLambertMaterial({ color: 0x666670 });
        var funnelMat = new THREE.MeshLambertMaterial({ color: 0x444450 });

        var ships = [
            { x: 80, z: 50 },
            { x: 100, z: 65 },
            { x: 120, z: 52 }
        ];
        var i;
        for (i = 0; i < ships.length; i++) {
            var sp = ships[i];
            var hullGeo = new THREE.BoxGeometry(25, 3, 6);
            var hull = new THREE.Mesh(hullGeo, hullMat);
            hull.position.set(WORLD_X + sp.x, 1.5, WORLD_Z + sp.z);
            scene.add(hull);

            var superGeo = new THREE.BoxGeometry(10, 3, 5);
            var superMesh = new THREE.Mesh(superGeo, superMat);
            superMesh.position.set(WORLD_X + sp.x - 2, 4.5, WORLD_Z + sp.z);
            scene.add(superMesh);

            var funnelGeo = new THREE.CylinderGeometry(0.6, 0.8, 3, 8);
            var funnel = new THREE.Mesh(funnelGeo, funnelMat);
            funnel.position.set(WORLD_X + sp.x - 1, 7.5, WORLD_Z + sp.z);
            scene.add(funnel);

            var bowMat = new THREE.MeshLambertMaterial({ color: 0x4A4A55 });
            var bowGeo = new THREE.BoxGeometry(3, 2.5, 5.5);
            var bow = new THREE.Mesh(bowGeo, bowMat);
            bow.position.set(WORLD_X + sp.x + 13, 1.25, WORLD_Z + sp.z);
            scene.add(bow);

            var mastMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
            var mastGeo = new THREE.CylinderGeometry(0.12, 0.15, 8, 6);
            var mast = new THREE.Mesh(mastGeo, mastMat);
            mast.position.set(WORLD_X + sp.x + 5, 7, WORLD_Z + sp.z);
            scene.add(mast);
        }
    }

    function buildJamesWattStatue(scene) {
        var plinthMat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        var plinthGeo = new THREE.BoxGeometry(3, 6, 3);
        var plinth = new THREE.Mesh(plinthGeo, plinthMat);
        plinth.position.set(WORLD_X + 30, 3, WORLD_Z - 20);
        scene.add(plinth);

        var baseMat = new THREE.MeshLambertMaterial({ color: 0xB0B0B0 });
        var baseGeo = new THREE.BoxGeometry(4, 0.8, 4);
        var base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(WORLD_X + 30, 0.4, WORLD_Z - 20);
        scene.add(base);

        var figureMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var bodyGeo = new THREE.BoxGeometry(1.2, 2.5, 0.8);
        var figBody = new THREE.Mesh(bodyGeo, figureMat);
        figBody.position.set(WORLD_X + 30, 8.25, WORLD_Z - 20);
        scene.add(figBody);

        var headMat = new THREE.MeshLambertMaterial({ color: 0x909090 });
        var headGeo = new THREE.SphereGeometry(0.4, 8, 6);
        var head = new THREE.Mesh(headGeo, headMat);
        head.position.set(WORLD_X + 30, 9.9, WORLD_Z - 20);
        scene.add(head);

        var armLGeo = new THREE.BoxGeometry(0.3, 1.5, 0.3);
        var armL = new THREE.Mesh(armLGeo, figureMat);
        armL.position.set(WORLD_X + 30 - 0.85, 8.0, WORLD_Z - 20);
        scene.add(armL);

        var armRGeo = new THREE.BoxGeometry(0.3, 1.5, 0.3);
        var armR = new THREE.Mesh(armRGeo, figureMat);
        armR.position.set(WORLD_X + 30 + 0.85, 8.0, WORLD_Z - 20);
        scene.add(armR);
    }

    function buildGlassFactory(scene) {
        var glassMat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });
        var factGeo = new THREE.BoxGeometry(16, 8, 10);
        var fact = new THREE.Mesh(factGeo, glassMat);
        fact.position.set(WORLD_X - 25, 4, WORLD_Z - 25);
        scene.add(fact);

        var roofMat = new THREE.MeshLambertMaterial({ color: 0x7A6A58 });
        var roofGeo = new THREE.BoxGeometry(16.6, 0.8, 10.6);
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(WORLD_X - 25, 8.4, WORLD_Z - 25);
        scene.add(roof);

        var chimMat = new THREE.MeshLambertMaterial({ color: 0x6A5A48 });
        var chimGeo = new THREE.CylinderGeometry(1.0, 1.3, 18, 10);
        var chim = new THREE.Mesh(chimGeo, chimMat);
        chim.position.set(WORLD_X - 18, 9, WORLD_Z - 22);
        scene.add(chim);

        var capMat = new THREE.MeshLambertMaterial({ color: 0x5A4A38 });
        var capGeo = new THREE.CylinderGeometry(1.3, 1.0, 0.6, 10);
        var cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(WORLD_X - 18, 18.3, WORLD_Z - 22);
        scene.add(cap);

        var windowMat = new THREE.MeshLambertMaterial({ color: 0x6688AA });
        var wPositions = [-5, 0, 5];
        var w;
        for (w = 0; w < wPositions.length; w++) {
            var winGeo = new THREE.BoxGeometry(2.5, 2, 0.3);
            var win = new THREE.Mesh(winGeo, windowMat);
            win.position.set(WORLD_X - 25 + wPositions[w], 4.5, WORLD_Z - 30.15);
            scene.add(win);
        }

        var annexMat = new THREE.MeshLambertMaterial({ color: 0x8A7A68 });
        var annexGeo = new THREE.BoxGeometry(8, 5, 6);
        var annex = new THREE.Mesh(annexGeo, annexMat);
        annex.position.set(WORLD_X - 33, 2.5, WORLD_Z - 25);
        scene.add(annex);
    }

    function buildGroundPlane(scene) {
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x4A5A4A });
        var groundGeo = new THREE.BoxGeometry(250, 0.3, 200);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(WORLD_X + 20, -0.15, WORLD_Z + 10);
        scene.add(ground);

        var dockMat = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
        var dockGeo = new THREE.BoxGeometry(200, 0.35, 30);
        var dock = new THREE.Mesh(dockGeo, dockMat);
        dock.position.set(WORLD_X + 30, 0, WORLD_Z + 35);
        scene.add(dock);
    }

    function buildDockWalls(scene) {
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x5A5050 });
        var wallGeo = new THREE.BoxGeometry(200, 2, 1.5);
        var wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(WORLD_X + 30, 1, WORLD_Z + 20);
        scene.add(wall);

        var bollardMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var i;
        for (i = 0; i < 10; i++) {
            var bollardGeo = new THREE.CylinderGeometry(0.25, 0.3, 1, 6);
            var bollard = new THREE.Mesh(bollardGeo, bollardMat);
            bollard.position.set(WORLD_X - 60 + i * 18, 0.5, WORLD_Z + 21);
            scene.add(bollard);
        }
    }

    function init(scene) {
        buildGroundPlane(scene);
        buildDockWalls(scene);
        buildCustomHouse(scene);
        buildOceanTerminal(scene);
        buildSugarRefineries(scene);
        buildTailOBank(scene);
        buildJamesWattStatue(scene);
        buildGlassFactory(scene);
    }

    return {
        init: init
    };
}());
