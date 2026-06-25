window.CroydonTram = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef; camera = cameraRef;
        objects = [];
        build();
    }

    function addmesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 5760;
        var oz = 0;

        buildnlatower(ox, oz);
        buildeastcroydon(ox, oz);
        buildwhitgift(ox, oz);
        buildtrams(ox, oz);
        buildwirepoles(ox, oz);
        buildlunarhouse(ox, oz);
        buildcouncilblock(ox, oz);
        buildparkhill(ox, oz);
        buildmarketstalls(ox, oz);
        buildtramstop(ox, oz);
        buildstreetlamps(ox, oz);
        buildroadsurface(ox, oz);
        buildretailrow(ox, oz);
        buildparkfurniture(ox, oz);
        buildoverheadwires(ox, oz);
        buildbollards(ox, oz);
    }

    function buildnlatower(ox, oz) {
        // NLA Tower "50p building" - 7 BoxGeometry panels in heptagon
        var panelColor = 0x778899;
        var radius = 10;
        var panelCount = 7;
        for (var i = 0; i < panelCount; i++) {
            var angle = (i / panelCount) * Math.PI * 2;
            var px = ox + Math.cos(angle) * radius;
            var pz = oz + 20 + Math.sin(angle) * radius;
            var geom = new THREE.BoxGeometry(4, 30, 2);
            var mat = new THREE.MeshLambertMaterial({ color: panelColor });
            var panel = new THREE.Mesh(geom, mat);
            panel.position.set(px, 15, pz);
            panel.rotation.y = angle;
            addmesh(panel);
        }
        // Rooftop cap
        var capGeom = new THREE.BoxGeometry(18, 2, 18);
        var capMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
        var cap = new THREE.Mesh(capGeom, capMat);
        cap.position.set(ox, 31, oz + 20);
        addmesh(cap);
    }

    function buildeastcroydon(ox, oz) {
        // Main station building
        var stationGeom = new THREE.BoxGeometry(35, 10, 15);
        var stationMat = new THREE.MeshLambertMaterial({ color: 0x88AABB });
        var station = new THREE.Mesh(stationGeom, stationMat);
        station.position.set(ox + 60, 5, oz - 10);
        addmesh(station);

        // Twin canopy towers
        var tower1Geom = new THREE.BoxGeometry(6, 18, 6);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x99BBCC });
        var tower1 = new THREE.Mesh(tower1Geom, towerMat);
        tower1.position.set(ox + 43, 9, oz - 10);
        addmesh(tower1);

        var tower2Geom = new THREE.BoxGeometry(6, 18, 6);
        var tower2Mat = new THREE.MeshLambertMaterial({ color: 0x99BBCC });
        var tower2 = new THREE.Mesh(tower2Geom, tower2Mat);
        tower2.position.set(ox + 77, 9, oz - 10);
        addmesh(tower2);

        // Platform canopy
        var canopyGeom = new THREE.BoxGeometry(35, 1, 10);
        var canopyMat = new THREE.MeshLambertMaterial({ color: 0xAABBCC });
        var canopy = new THREE.Mesh(canopyGeom, canopyMat);
        canopy.position.set(ox + 60, 15, oz - 10);
        addmesh(canopy);
    }

    function buildwhitgift(ox, oz) {
        // Main mall body
        var mallGeom = new THREE.BoxGeometry(60, 8, 35);
        var mallMat = new THREE.MeshLambertMaterial({ color: 0x999988 });
        var mall = new THREE.Mesh(mallGeom, mallMat);
        mall.position.set(ox - 50, 4, oz + 50);
        addmesh(mall);

        // Atrium roof - lighter coloured
        var atriumGeom = new THREE.BoxGeometry(30, 3, 20);
        var atriumMat = new THREE.MeshLambertMaterial({ color: 0x88AACC });
        var atrium = new THREE.Mesh(atriumGeom, atriumMat);
        atrium.position.set(ox - 50, 9.5, oz + 50);
        addmesh(atrium);

        // Side wings
        var wingGeom = new THREE.BoxGeometry(20, 6, 15);
        var wingMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
        var wing1 = new THREE.Mesh(wingGeom, wingMat);
        wing1.position.set(ox - 80, 3, oz + 55);
        addmesh(wing1);

        var wing2Geom = new THREE.BoxGeometry(20, 6, 15);
        var wing2Mat = new THREE.MeshLambertMaterial({ color: 0x888877 });
        var wing2 = new THREE.Mesh(wing2Geom, wing2Mat);
        wing2.position.set(ox - 20, 3, oz + 55);
        addmesh(wing2);
    }

    function buildtrams(ox, oz) {
        // 3 Tramlink trams at staggered positions
        var tramPositions = [
            { x: ox + 10, z: oz + 5 },
            { x: ox - 10, z: oz - 15 },
            { x: ox + 35, z: oz + 5 }
        ];
        for (var i = 0; i < tramPositions.length; i++) {
            buildsingletram(tramPositions[i].x, tramPositions[i].z);
        }
    }

    function buildsingletram(tx, tz) {
        var tramBlue = 0x003399;
        // Main tram body
        var bodyGeom = new THREE.BoxGeometry(12, 2.5, 3);
        var bodyMat = new THREE.MeshLambertMaterial({ color: tramBlue });
        var body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.set(tx, 2, tz);
        addmesh(body);

        // Cabin top
        var topGeom = new THREE.BoxGeometry(10, 1, 2.5);
        var topMat = new THREE.MeshLambertMaterial({ color: 0x0044BB });
        var top = new THREE.Mesh(topGeom, topMat);
        top.position.set(tx, 3.75, tz);
        addmesh(top);

        // 4 wheel axles (cylinder)
        var axleOffsets = [-4.5, -1.5, 1.5, 4.5];
        for (var j = 0; j < axleOffsets.length; j++) {
            var axleGeom = new THREE.CylinderGeometry(0.5, 0.5, 3.5, 6);
            var axleMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
            var axle = new THREE.Mesh(axleGeom, axleMat);
            axle.rotation.z = Math.PI / 2;
            axle.position.set(tx + axleOffsets[j], 0.7, tz);
            addmesh(axle);
        }
    }

    function buildwirepoles(ox, oz) {
        // 5 tram overhead wire support poles
        var poleOffsets = [
            { x: ox + 0,   z: oz + 0 },
            { x: ox + 12,  z: oz + 0 },
            { x: ox + 24,  z: oz + 0 },
            { x: ox - 12,  z: oz + 0 },
            { x: ox + 36,  z: oz + 0 }
        ];
        for (var i = 0; i < poleOffsets.length; i++) {
            var px = poleOffsets[i].x;
            var pz = poleOffsets[i].z;

            // Vertical pole
            var poleGeom = new THREE.BoxGeometry(0.3, 8, 0.3);
            var poleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
            var pole = new THREE.Mesh(poleGeom, poleMat);
            pole.position.set(px, 4, pz);
            addmesh(pole);

            // Horizontal arm
            var armGeom = new THREE.BoxGeometry(4, 0.3, 0.3);
            var armMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
            var arm = new THREE.Mesh(armGeom, armMat);
            arm.position.set(px, 7.85, pz);
            addmesh(arm);
        }
    }

    function buildlunarhouse(ox, oz) {
        // Lunar House - 1970 Home Office tower
        var lunarGeom = new THREE.BoxGeometry(15, 28, 12);
        var lunarMat = new THREE.MeshLambertMaterial({ color: 0x446688 });
        var lunar = new THREE.Mesh(lunarGeom, lunarMat);
        lunar.position.set(ox - 80, 14, oz - 50);
        addmesh(lunar);

        // Base podium
        var podiumGeom = new THREE.BoxGeometry(20, 3, 16);
        var podiumMat = new THREE.MeshLambertMaterial({ color: 0x334466 });
        var podium = new THREE.Mesh(podiumGeom, podiumMat);
        podium.position.set(ox - 80, 1.5, oz - 50);
        addmesh(podium);

        // Horizontal floor bands
        for (var i = 0; i < 5; i++) {
            var bandGeom = new THREE.BoxGeometry(16, 0.5, 13);
            var bandMat = new THREE.MeshLambertMaterial({ color: 0x335577 });
            var band = new THREE.Mesh(bandGeom, bandMat);
            band.position.set(ox - 80, 5 + i * 5, oz - 50);
            addmesh(band);
        }
    }

    function buildcouncilblock(ox, oz) {
        // Brutalist council block
        var blockGeom = new THREE.BoxGeometry(20, 12, 18);
        var blockMat = new THREE.MeshLambertMaterial({ color: 0x888880 });
        var block = new THREE.Mesh(blockGeom, blockMat);
        block.position.set(ox + 30, 6, oz - 60);
        addmesh(block);

        // Side stairwell towers
        var stairGeom1 = new THREE.BoxGeometry(4, 14, 5);
        var stairMat = new THREE.MeshLambertMaterial({ color: 0x777770 });
        var stair1 = new THREE.Mesh(stairGeom1, stairMat);
        stair1.position.set(ox + 22, 7, oz - 60);
        addmesh(stair1);

        var stairGeom2 = new THREE.BoxGeometry(4, 14, 5);
        var stairMat2 = new THREE.MeshLambertMaterial({ color: 0x777770 });
        var stair2 = new THREE.Mesh(stairGeom2, stairMat2);
        stair2.position.set(ox + 38, 7, oz - 60);
        addmesh(stair2);

        // Balcony strips
        for (var i = 0; i < 3; i++) {
            var balconyGeom = new THREE.BoxGeometry(21, 0.5, 2);
            var balconyMat = new THREE.MeshLambertMaterial({ color: 0x666660 });
            var balcony = new THREE.Mesh(balconyGeom, balconyMat);
            balcony.position.set(ox + 30, 3 + i * 4, oz - 51);
            addmesh(balcony);
        }
    }

    function buildparkhill(ox, oz) {
        // 6 trees: sphere canopy + cylinder trunk
        var treePositions = [
            { x: ox - 110, z: oz + 10 },
            { x: ox - 125, z: oz + 25 },
            { x: ox - 100, z: oz + 30 },
            { x: ox - 115, z: oz - 5 },
            { x: ox - 130, z: oz + 10 },
            { x: ox - 105, z: oz + 45 }
        ];
        for (var i = 0; i < treePositions.length; i++) {
            var tx = treePositions[i].x;
            var tz = treePositions[i].z;

            var trunkGeom = new THREE.CylinderGeometry(0.4, 0.5, 4, 6);
            var trunkMat = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
            var trunk = new THREE.Mesh(trunkGeom, trunkMat);
            trunk.position.set(tx, 2, tz);
            addmesh(trunk);

            var canopyGeom = new THREE.SphereGeometry(3, 7, 7);
            var canopyMat = new THREE.MeshLambertMaterial({ color: 0x2E7D32 });
            var canopy = new THREE.Mesh(canopyGeom, canopyMat);
            canopy.position.set(tx, 6.5, tz);
            addmesh(canopy);
        }

        // Bandstand base cylinder
        var bandstandGeom = new THREE.CylinderGeometry(4, 4, 3, 8);
        var bandstandMat = new THREE.MeshLambertMaterial({ color: 0xBCAAA4 });
        var bandstand = new THREE.Mesh(bandstandGeom, bandstandMat);
        bandstand.position.set(ox - 118, 1.5, oz + 20);
        addmesh(bandstand);

        // Bandstand roof cone
        var roofGeom = new THREE.ConeGeometry(5, 3, 8);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x78909C });
        var roof = new THREE.Mesh(roofGeom, roofMat);
        roof.position.set(ox - 118, 4.5, oz + 20);
        addmesh(roof);
    }

    function buildmarketstalls(ox, oz) {
        // 8 street market stalls with varied colors
        var stallColors = [
            0xFF5722, 0xE91E63, 0x9C27B0, 0x3F51B5,
            0x009688, 0x8BC34A, 0xFF9800, 0xF44336
        ];
        for (var i = 0; i < 8; i++) {
            var sx = ox - 30 + (i % 4) * 12;
            var sz = oz + 90 + Math.floor(i / 4) * 8;

            var baseGeom = new THREE.BoxGeometry(3, 2.5, 2);
            var baseMat = new THREE.MeshLambertMaterial({ color: 0xEEEEDD });
            var base = new THREE.Mesh(baseGeom, baseMat);
            base.position.set(sx, 1.25, sz);
            addmesh(base);

            // Canopy
            var awningGeom = new THREE.BoxGeometry(3.5, 0.3, 2.5);
            var awningMat = new THREE.MeshLambertMaterial({ color: stallColors[i] });
            var awning = new THREE.Mesh(awningGeom, awningMat);
            awning.position.set(sx, 2.8, sz);
            addmesh(awning);
        }
    }

    function buildtramstop(ox, oz) {
        // Tram stop shelter: roof slab + 2 side posts + bench
        var roofGeom = new THREE.BoxGeometry(8, 0.4, 3);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0xCCDDEE });
        var stopRoof = new THREE.Mesh(roofGeom, roofMat);
        stopRoof.position.set(ox + 5, 4, oz - 30);
        addmesh(stopRoof);

        var post1Geom = new THREE.BoxGeometry(0.3, 4, 0.3);
        var postMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var post1 = new THREE.Mesh(post1Geom, postMat);
        post1.position.set(ox + 1, 2, oz - 30);
        addmesh(post1);

        var post2Geom = new THREE.BoxGeometry(0.3, 4, 0.3);
        var post2Mat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var post2 = new THREE.Mesh(post2Geom, post2Mat);
        post2.position.set(ox + 9, 2, oz - 30);
        addmesh(post2);

        var benchGeom = new THREE.BoxGeometry(5, 0.3, 1);
        var benchMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
        var bench = new THREE.Mesh(benchGeom, benchMat);
        bench.position.set(ox + 5, 1.2, oz - 31);
        addmesh(bench);

        var benchlegGeom = new THREE.BoxGeometry(0.2, 1.2, 0.2);
        var benchlegMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var benchleg1 = new THREE.Mesh(benchlegGeom, benchlegMat);
        benchleg1.position.set(ox + 2.5, 0.6, oz - 31);
        addmesh(benchleg1);

        var benchleg2Geom = new THREE.BoxGeometry(0.2, 1.2, 0.2);
        var benchleg2Mat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var benchleg2 = new THREE.Mesh(benchleg2Geom, benchleg2Mat);
        benchleg2.position.set(ox + 7.5, 0.6, oz - 31);
        addmesh(benchleg2);
    }

    function buildstreetlamps(ox, oz) {
        // 6 street lamps along the main road
        var lampPositions = [
            { x: ox - 20, z: oz - 5 },
            { x: ox + 0,  z: oz - 5 },
            { x: ox + 20, z: oz - 5 },
            { x: ox + 40, z: oz - 5 },
            { x: ox + 60, z: oz - 5 },
            { x: ox + 80, z: oz - 5 }
        ];
        for (var i = 0; i < lampPositions.length; i++) {
            var lx = lampPositions[i].x;
            var lz = lampPositions[i].z;

            var shaftGeom = new THREE.BoxGeometry(0.3, 7, 0.3);
            var shaftMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
            var shaft = new THREE.Mesh(shaftGeom, shaftMat);
            shaft.position.set(lx, 3.5, lz);
            addmesh(shaft);

            var headGeom = new THREE.BoxGeometry(1.5, 0.5, 0.5);
            var headMat = new THREE.MeshLambertMaterial({ color: 0xFFFFCC });
            var head = new THREE.Mesh(headGeom, headMat);
            head.position.set(lx + 1, 7.2, lz);
            addmesh(head);
        }
    }

    function buildroadsurface(ox, oz) {
        // 4 road surface slabs forming the tram street
        for (var i = 0; i < 4; i++) {
            var slabGeom = new THREE.BoxGeometry(20, 0.2, 8);
            var slabMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var slab = new THREE.Mesh(slabGeom, slabMat);
            slab.position.set(ox - 10 + i * 20, 0.1, oz);
            addmesh(slab);
        }
        // Pavement strips alongside
        for (var j = 0; j < 4; j++) {
            var pavGeom = new THREE.BoxGeometry(20, 0.2, 4);
            var pavMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
            var pav = new THREE.Mesh(pavGeom, pavMat);
            pav.position.set(ox - 10 + j * 20, 0.15, oz - 6);
            addmesh(pav);
        }
    }

    function buildretailrow(ox, oz) {
        // 4 small retail units along the east side of the scene
        var retailColors = [
            0x8D6E63, 0x78909C, 0x7986CB, 0x81C784
        ];
        for (var i = 0; i < 4; i++) {
            var rx = ox + 90 + i * 14;
            var rz = oz + 30;

            var shopGeom = new THREE.BoxGeometry(12, 5, 10);
            var shopMat = new THREE.MeshLambertMaterial({ color: retailColors[i] });
            var shop = new THREE.Mesh(shopGeom, shopMat);
            shop.position.set(rx, 2.5, rz);
            addmesh(shop);

            var fasciageom = new THREE.BoxGeometry(12, 1.5, 0.3);
            var fasciaMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
            var fascia = new THREE.Mesh(fasciageom, fasciaMat);
            fascia.position.set(rx, 4.75, rz - 5.15);
            addmesh(fascia);
        }
    }

    function buildoverheadwires(ox, oz) {
        // Overhead tram wire spans between poles, using LineSegments
        var wireVerts = new Float32Array([
            0, 0, 0,   12, 0, 0,
            12, 0, 0,  24, 0, 0,
            24, 0, 0,  36, 0, 0,
            36, 0, 0,  48, 0, 0
        ]);
        var wireGeom = new THREE.BufferGeometry();
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wireVerts, 3));
        var wireMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var wireLine = new THREE.LineSegments(wireGeom, wireMat);
        wireLine.position.set(ox - 12, 7.85, oz);
        scene.add(wireLine);
        objects.push(wireLine);
    }

    function buildbollards(ox, oz) {
        // 6 concrete bollards at the mall entrance
        for (var i = 0; i < 6; i++) {
            var bollardGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 6);
            var bollardMat = new THREE.MeshLambertMaterial({ color: 0xBBBBBB });
            var bollard = new THREE.Mesh(bollardGeom, bollardMat);
            bollard.position.set(ox - 30 + i * 5, 0.6, oz + 33);
            addmesh(bollard);
        }
    }

    function buildparkfurniture(ox, oz) {
        // Park Hill path slabs
        for (var i = 0; i < 4; i++) {
            var pathGeom = new THREE.BoxGeometry(3, 0.15, 3);
            var pathMat = new THREE.MeshLambertMaterial({ color: 0xBBBBBB });
            var path = new THREE.Mesh(pathGeom, pathMat);
            path.position.set(ox - 118 + i * 4, 0.07, oz + 28);
            addmesh(path);
        }
        // Park bench near bandstand
        var parkbenchGeom = new THREE.BoxGeometry(4, 0.25, 0.8);
        var parkbenchMat = new THREE.MeshLambertMaterial({ color: 0x6D4C41 });
        var parkbench = new THREE.Mesh(parkbenchGeom, parkbenchMat);
        parkbench.position.set(ox - 110, 0.8, oz + 20);
        addmesh(parkbench);

        // Litter bin
        var binGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 6);
        var binMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var bin = new THREE.Mesh(binGeom, binMat);
        bin.position.set(ox - 123, 0.6, oz + 14);
        addmesh(bin);

        // Park gate posts x2
        var gate1Geom = new THREE.BoxGeometry(0.5, 3, 0.5);
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x1A237E });
        var gate1 = new THREE.Mesh(gate1Geom, gateMat);
        gate1.position.set(ox - 135, 1.5, oz + 2);
        addmesh(gate1);

        var gate2Geom = new THREE.BoxGeometry(0.5, 3, 0.5);
        var gate2Mat = new THREE.MeshLambertMaterial({ color: 0x1A237E });
        var gate2 = new THREE.Mesh(gate2Geom, gate2Mat);
        gate2.position.set(ox - 131, 1.5, oz + 2);
        addmesh(gate2);

        // Ornamental park fountain pedestal
        var fountainGeom = new THREE.CylinderGeometry(1.5, 2, 1, 8);
        var fountainMat = new THREE.MeshLambertMaterial({ color: 0xB0BEC5 });
        var fountain = new THREE.Mesh(fountainGeom, fountainMat);
        fountain.position.set(ox - 118, 0.5, oz + 12);
        addmesh(fountain);

        // Fountain column
        var fcolGeom = new THREE.CylinderGeometry(0.4, 0.4, 2.5, 6);
        var fcolMat = new THREE.MeshLambertMaterial({ color: 0xCFD8DC });
        var fcol = new THREE.Mesh(fcolGeom, fcolMat);
        fcol.position.set(ox - 118, 1.75, oz + 12);
        addmesh(fcol);

        // Fountain basin top
        var basinGeom = new THREE.CylinderGeometry(2, 1.5, 0.4, 8);
        var basinMat = new THREE.MeshLambertMaterial({ color: 0xB0BEC5 });
        var basin = new THREE.Mesh(basinGeom, basinMat);
        basin.position.set(ox - 118, 3.2, oz + 12);
        addmesh(basin);
    }

    function update(delta) { }

    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
        objects = []; scene = null; camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
