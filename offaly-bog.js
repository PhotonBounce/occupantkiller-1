window.OffalyBog = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var smokePuffs = [];
    var turbineBlades = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        smokePuffs = [];
        turbineBlades = [];
        build();
    }

    function makeMesh(geo, mat) {
        var m = new THREE.Mesh(geo, mat);
        objects.push(m);
        scene.add(m);
        return m;
    }

    function bogMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function build() {
        buildBogExpanse();
        buildDrainageChannels();
        buildPeatCutting();
        buildNarrowGaugeRailway();
        buildBriquetteFactory();
        buildBogCottages();
        buildTogher();
        buildBogPools();
        buildSphagnumHummocks();
        buildWindTurbines();
        buildClonmacnoiseHorizon();
        buildSky();
    }

    // -----------------------------------------------------------------------
    // Clara Bog peat expanse — nine large flat sections
    // -----------------------------------------------------------------------
    function buildBogExpanse() {
        var mat = bogMat(0x8B4513);
        var sections = [
            [18920,  -1,    0,   400, 2, 300],
            [18920,  -1,  320,   400, 2, 260],
            [18920,  -1, -320,   400, 2, 260],
            [18620,  -1,  100,   200, 2, 160],
            [19220,  -1, -100,   200, 2, 160],
            [18920,  -1,  580,   360, 2, 200],
            [18920,  -1, -580,   360, 2, 200],
            [18620,  -1, -440,   180, 2, 140],
            [19220,  -1,  440,   180, 2, 140]
        ];
        for (var i = 0; i < sections.length; i++) {
            var s = sections[i];
            var geo = new THREE.BoxGeometry(s[3], s[4], s[5]);
            var mesh = makeMesh(geo, mat);
            mesh.position.set(s[0], s[1], s[2]);
        }
    }

    // -----------------------------------------------------------------------
    // Drainage channels — grid of dark water strips
    // -----------------------------------------------------------------------
    function buildDrainageChannels() {
        var mat = bogMat(0x1E4A6A);
        var i;
        // North-south channels
        for (i = 0; i < 6; i++) {
            var geo = new THREE.BoxGeometry(4, 1.5, 500);
            var mesh = makeMesh(geo, mat);
            mesh.position.set(18760 + i * 50, -0.5, 0);
        }
        // East-west channels
        for (i = 0; i < 5; i++) {
            var geo2 = new THREE.BoxGeometry(380, 1.5, 4);
            var mesh2 = makeMesh(geo2, mat);
            mesh2.position.set(18920, -0.5, -100 + i * 50);
        }
    }

    // -----------------------------------------------------------------------
    // Bord na Mona peat cutting — rows of cut peat faces
    // -----------------------------------------------------------------------
    function buildPeatCutting() {
        var mat = bogMat(0x5C2A00);
        var i, j;
        // Rows of cut peat blocks
        for (i = 0; i < 8; i++) {
            for (j = 0; j < 5; j++) {
                var geo = new THREE.BoxGeometry(18, 3, 6);
                var mesh = makeMesh(geo, mat);
                mesh.position.set(18820 + j * 22, 0.5, 80 + i * 10);
            }
        }
        // Exposed peat face wall
        var faceGeo = new THREE.BoxGeometry(120, 5, 3);
        var face = makeMesh(faceGeo, mat);
        face.position.set(18870, 1, 75);

        var faceGeo2 = new THREE.BoxGeometry(120, 5, 3);
        var face2 = makeMesh(faceGeo2, mat);
        face2.position.set(18870, 1, 165);
    }

    // -----------------------------------------------------------------------
    // Narrow-gauge railway tracks — two parallel rail strips
    // -----------------------------------------------------------------------
    function buildNarrowGaugeRailway() {
        var railMat = bogMat(0x333333);
        var tiesMat = bogMat(0x4A2C00);
        var i;
        // Two rails running east-west
        var rail1 = makeMesh(new THREE.BoxGeometry(280, 0.4, 1.2), railMat);
        rail1.position.set(18920, 0.6, 30);
        var rail2 = makeMesh(new THREE.BoxGeometry(280, 0.4, 1.2), railMat);
        rail2.position.set(18920, 0.6, 34);
        // Railway ties/sleepers
        for (i = 0; i < 18; i++) {
            var tie = makeMesh(new THREE.BoxGeometry(2, 0.3, 7), tiesMat);
            tie.position.set(18790 + i * 16, 0.4, 32);
        }
        // A small peat wagon on the tracks
        var wagonMat = bogMat(0x8B6914);
        var wagon = makeMesh(new THREE.BoxGeometry(10, 4, 5), wagonMat);
        wagon.position.set(18900, 3, 32);
        var wheelMat = bogMat(0x222222);
        var wh1 = makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 1.2, 8), wheelMat);
        wh1.rotation.z = Math.PI / 2;
        wh1.position.set(18895, 1.2, 29.5);
        var wh2 = makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 1.2, 8), wheelMat);
        wh2.rotation.z = Math.PI / 2;
        wh2.position.set(18905, 1.2, 29.5);
        var wh3 = makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 1.2, 8), wheelMat);
        wh3.rotation.z = Math.PI / 2;
        wh3.position.set(18895, 1.2, 34.5);
        var wh4 = makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 1.2, 8), wheelMat);
        wh4.rotation.z = Math.PI / 2;
        wh4.position.set(18905, 1.2, 34.5);
    }

    // -----------------------------------------------------------------------
    // Peat briquette factory — industrial buildings + chimneys + smoke
    // -----------------------------------------------------------------------
    function buildBriquetteFactory() {
        var wallMat = bogMat(0xCD5C5C);
        var roofMat = bogMat(0x8B3A3A);
        var chimneyMat = bogMat(0x555555);
        var smokeMat = bogMat(0xC0C0C0);
        var windowMat = bogMat(0x8BAACC);
        var i;

        // Main factory building
        var mainBody = makeMesh(new THREE.BoxGeometry(60, 18, 30), wallMat);
        mainBody.position.set(19050, 9, -80);
        var mainRoof = makeMesh(new THREE.BoxGeometry(64, 4, 34), roofMat);
        mainRoof.position.set(19050, 19, -80);

        // Secondary building
        var secBody = makeMesh(new THREE.BoxGeometry(30, 12, 20), wallMat);
        secBody.position.set(19100, 6, -55);
        var secRoof = makeMesh(new THREE.BoxGeometry(32, 3, 22), roofMat);
        secRoof.position.set(19100, 13.5, -55);

        // Storage shed
        var shed = makeMesh(new THREE.BoxGeometry(20, 8, 15), bogMat(0xA0522D));
        shed.position.set(19005, 4, -60);

        // Chimney stacks
        var chimneyPositions = [
            [19040, 0, -75],
            [19060, 0, -85],
            [19080, 0, -78]
        ];
        for (i = 0; i < chimneyPositions.length; i++) {
            var cp = chimneyPositions[i];
            var chimney = makeMesh(new THREE.CylinderGeometry(2.5, 3, 35, 10), chimneyMat);
            chimney.position.set(cp[0], cp[1] + 17.5, cp[2]);

            // Smoke puffs — spheres stacked above chimneys
            for (var k = 0; k < 3; k++) {
                var puff = makeMesh(new THREE.SphereGeometry(3 + k, 6, 6), smokeMat);
                puff.position.set(cp[0] + k * 1.5, cp[1] + 38 + k * 6, cp[2]);
                smokePuffs.push({ mesh: puff, baseY: cp[1] + 38 + k * 6, baseX: cp[0] + k * 1.5 });
            }
        }

        // Factory windows
        for (i = 0; i < 4; i++) {
            var win = makeMesh(new THREE.BoxGeometry(0.5, 4, 5), windowMat);
            win.position.set(19021, 10, -90 + i * 8);
        }
    }

    // -----------------------------------------------------------------------
    // Bog cottages — whitewashed, sunk slightly into bog
    // -----------------------------------------------------------------------
    function buildBogCottages() {
        var wallMat = bogMat(0xFFFFF0);
        var roofMat = bogMat(0x808080);
        var doorMat = bogMat(0x2F4F4F);
        var chimneyMat = bogMat(0x666666);

        var cottageSpots = [
            [18780, -1, -200],
            [18840, -1, -240],
            [19010, -1, 200],
            [19080, -1, 230]
        ];

        for (var i = 0; i < cottageSpots.length; i++) {
            var p = cottageSpots[i];
            // Walls
            var walls = makeMesh(new THREE.BoxGeometry(14, 7, 10), wallMat);
            walls.position.set(p[0], p[1] + 3.5, p[2]);
            // Roof
            var roof = makeMesh(new THREE.BoxGeometry(16, 4, 12), roofMat);
            roof.position.set(p[0], p[1] + 9, p[2]);
            // Door
            var door = makeMesh(new THREE.BoxGeometry(0.3, 4, 2.5), doorMat);
            door.position.set(p[0] - 7.1, p[1] + 2, p[2]);
            // Chimney
            var chim = makeMesh(new THREE.BoxGeometry(2, 4, 2), chimneyMat);
            chim.position.set(p[0] + 4, p[1] + 12, p[2]);
        }
    }

    // -----------------------------------------------------------------------
    // Ancient togher (bog road) — 3500-year-old plank road
    // -----------------------------------------------------------------------
    function buildTogher() {
        var plankMat = bogMat(0x5C3317);
        var logMat = bogMat(0x4A2700);
        var i;
        // Planks running north-south across bog
        for (i = 0; i < 25; i++) {
            var plank = makeMesh(new THREE.BoxGeometry(6, 0.4, 1.8), plankMat);
            plank.position.set(18950 + i * 2.5, 0.1, -300 + i * 4);
        }
        // Cross logs underneath
        for (i = 0; i < 8; i++) {
            var log = makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 6), logMat);
            log.rotation.x = Math.PI / 2;
            log.position.set(18960 + i * 7, -0.2, -295 + i * 4);
        }
    }

    // -----------------------------------------------------------------------
    // Bog pools — shallow blue lakes
    // -----------------------------------------------------------------------
    function buildBogPools() {
        var mat = bogMat(0x006994);
        var poolDefs = [
            [18860, -0.4,  180, 30, 1, 18],
            [19000, -0.4,  250, 20, 1, 14],
            [18780, -0.4, -120, 25, 1, 16],
            [19050, -0.4, -160, 22, 1, 12],
            [18920, -0.4,  420, 35, 1, 22],
            [18920, -0.4, -420, 28, 1, 18]
        ];
        for (var i = 0; i < poolDefs.length; i++) {
            var d = poolDefs[i];
            var geo = new THREE.BoxGeometry(d[3], d[4], d[5]);
            var mesh = makeMesh(geo, mat);
            mesh.position.set(d[0], d[1], d[2]);
        }
    }

    // -----------------------------------------------------------------------
    // Sphagnum moss hummocks — green mounds scattered across bog
    // -----------------------------------------------------------------------
    function buildSphagnumHummocks() {
        var mat = bogMat(0x5F8B4A);
        var hummockData = [
            [18830,  0.5,   50,  8, 1.5,  6],
            [18870,  0.5,  -30,  6, 1.2,  5],
            [18940,  0.5,   90,  9, 1.8,  7],
            [19000,  0.5,  -60,  7, 1.4,  6],
            [18800,  0.5,  130, 10, 2,    8],
            [18960,  0.5,  -130, 8, 1.6,  6],
            [19030,  0.5,   160, 6, 1.2,  5],
            [18750,  0.5,  -80,  9, 1.8,  7],
            [19080,  0.5,   40,  7, 1.4,  6],
            [18910,  0.5,  -180, 8, 1.5,  6],
            [18855,  0.5,  300,  6, 1.2,  5],
            [19010,  0.5,  330,  8, 1.6,  7]
        ];
        for (var i = 0; i < hummockData.length; i++) {
            var h = hummockData[i];
            var geo = new THREE.BoxGeometry(h[3], h[4], h[5]);
            var mesh = makeMesh(geo, mat);
            mesh.position.set(h[0], h[1], h[2]);
        }
    }

    // -----------------------------------------------------------------------
    // Wind turbines — white towers + rotating blades
    // -----------------------------------------------------------------------
    function buildWindTurbines() {
        var towerMat = bogMat(0xF5F5F5);
        var bladeMat = bogMat(0xEEEEEE);
        var hubMat = bogMat(0xDDDDDD);

        var turbineSpots = [
            [18750, 0, -340],
            [18810, 0, -360],
            [18870, 0, -380],
            [18930, 0, -355]
        ];

        for (var i = 0; i < turbineSpots.length; i++) {
            var p = turbineSpots[i];
            // Tower
            var tower = makeMesh(new THREE.CylinderGeometry(1.5, 2.5, 45, 8), towerMat);
            tower.position.set(p[0], p[1] + 22.5, p[2]);

            // Hub
            var hub = makeMesh(new THREE.SphereGeometry(2.5, 6, 6), hubMat);
            hub.position.set(p[0], p[1] + 47, p[2]);

            // Three blades — BoxGeometry
            var blade1 = makeMesh(new THREE.BoxGeometry(1.5, 20, 0.8), bladeMat);
            blade1.position.set(p[0], p[1] + 57, p[2]);
            turbineBlades.push({ mesh: blade1, cx: p[0], cy: p[1] + 47, cz: p[2], angle: 0, radius: 10, axis: 'y-up' });

            var blade2 = makeMesh(new THREE.BoxGeometry(1.5, 20, 0.8), bladeMat);
            blade2.position.set(p[0] + 8.66, p[1] + 47 - 5, p[2]);
            blade2.rotation.z = (2 * Math.PI / 3);
            turbineBlades.push({ mesh: blade2, cx: p[0], cy: p[1] + 47, cz: p[2], angle: 2.094, radius: 10, axis: 'y-up' });

            var blade3 = makeMesh(new THREE.BoxGeometry(1.5, 20, 0.8), bladeMat);
            blade3.position.set(p[0] - 8.66, p[1] + 47 - 5, p[2]);
            blade3.rotation.z = (4 * Math.PI / 3);
            turbineBlades.push({ mesh: blade3, cx: p[0], cy: p[1] + 47, cz: p[2], angle: 4.189, radius: 10, axis: 'y-up' });
        }
    }

    // -----------------------------------------------------------------------
    // Clonmacnoise on horizon — round tower + cathedral silhouette
    // -----------------------------------------------------------------------
    function buildClonmacnoiseHorizon() {
        var stoneMat = bogMat(0x808080);
        var darkStoneMat = bogMat(0x606060);
        var skyLineMat = bogMat(0x505050);

        // Round tower — tall cylinder
        var roundTower = makeMesh(new THREE.CylinderGeometry(3, 4, 55, 10), stoneMat);
        roundTower.position.set(19300, 27.5, -500);

        // Conical tower cap
        var towerCap = makeMesh(new THREE.ConeGeometry(3.5, 8, 10), darkStoneMat);
        towerCap.position.set(19300, 59, -500);

        // Cathedral nave — long box
        var nave = makeMesh(new THREE.BoxGeometry(40, 18, 15), stoneMat);
        nave.position.set(19260, 9, -500);

        // Cathedral chancel
        var chancel = makeMesh(new THREE.BoxGeometry(16, 14, 12), darkStoneMat);
        chancel.position.set(19236, 7, -500);

        // West gable
        var gable = makeMesh(new THREE.BoxGeometry(3, 22, 15), stoneMat);
        gable.position.set(19280, 11, -500);

        // Gable triangular peak (using box as approximation)
        var gablePeak = makeMesh(new THREE.BoxGeometry(3, 6, 9), darkStoneMat);
        gablePeak.position.set(19280, 22, -500);

        // Ruined walls — partial remnants
        var wall1 = makeMesh(new THREE.BoxGeometry(3, 12, 20), stoneMat);
        wall1.position.set(19320, 6, -498);

        var wall2 = makeMesh(new THREE.BoxGeometry(3, 8, 14), stoneMat);
        wall2.position.set(19335, 4, -504);

        // Celtic cross silhouette
        var crossV = makeMesh(new THREE.BoxGeometry(1.5, 14, 1.5), skyLineMat);
        crossV.position.set(19350, 7, -500);
        var crossH = makeMesh(new THREE.BoxGeometry(1.5, 1.5, 9), skyLineMat);
        crossH.position.set(19350, 10, -500);
        var crossRing = makeMesh(new THREE.CylinderGeometry(3, 3, 1, 8), skyLineMat);
        crossRing.position.set(19350, 10, -500);

        // Low bog horizon ridgeline
        var horizon = makeMesh(new THREE.BoxGeometry(600, 4, 8), bogMat(0x3B2000));
        horizon.position.set(19100, 2, -495);
    }

    // -----------------------------------------------------------------------
    // Sky dome — pale Irish sky
    // -----------------------------------------------------------------------
    function buildSky() {
        var skyMat = bogMat(0x87CEEB);
        var sky = makeMesh(new THREE.SphereGeometry(900, 8, 6), skyMat);
        sky.position.set(18920, 0, 0);
        // Invert so it renders inside
        sky.material.side = THREE.BackSide;

        // A few cloud formations — sphere clusters
        var cloudMat = bogMat(0xFFFFFF);
        var cloudPositions = [
            [18700, 180, -200],
            [19100, 200,  150],
            [18850, 190, -350],
            [19200, 210,  300]
        ];
        for (var i = 0; i < cloudPositions.length; i++) {
            var cp = cloudPositions[i];
            var c1 = makeMesh(new THREE.SphereGeometry(18, 6, 5), cloudMat);
            c1.position.set(cp[0], cp[1], cp[2]);
            var c2 = makeMesh(new THREE.SphereGeometry(13, 6, 5), cloudMat);
            c2.position.set(cp[0] + 20, cp[1] - 4, cp[2]);
            var c3 = makeMesh(new THREE.SphereGeometry(15, 6, 5), cloudMat);
            c3.position.set(cp[0] - 18, cp[1] - 3, cp[2]);
        }

        // Ambient directional light approximated via fog-coloured flat box on horizon
        var fogMat = bogMat(0xB0C4DE);
        var fogStrip = makeMesh(new THREE.BoxGeometry(900, 30, 5), fogMat);
        fogStrip.position.set(18920, 15, -495);
    }

    // -----------------------------------------------------------------------
    // update — animate smoke and turbine blades
    // -----------------------------------------------------------------------
    function update(delta) {
        var i, s, b;
        // Smoke puffs drift upward and reset
        for (i = 0; i < smokePuffs.length; i++) {
            s = smokePuffs[i];
            s.mesh.position.y += delta * 2;
            s.mesh.position.x += delta * 0.8;
            if (s.mesh.position.y > s.baseY + 22) {
                s.mesh.position.y = s.baseY;
                s.mesh.position.x = s.baseX;
            }
        }
        // Turbine blades rotate around their tower hub
        for (i = 0; i < turbineBlades.length; i++) {
            b = turbineBlades[i];
            b.angle += delta * 0.6;
            var cosA = Math.cos(b.angle);
            var sinA = Math.sin(b.angle);
            b.mesh.position.x = b.cx + b.radius * sinA * 0;
            b.mesh.position.y = b.cy + b.radius * cosA;
            b.mesh.position.x = b.cx;
            b.mesh.rotation.z = b.angle;
        }
    }

    // -----------------------------------------------------------------------
    // reset — clean up all objects
    // -----------------------------------------------------------------------
    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        smokePuffs = [];
        turbineBlades = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };

}());
