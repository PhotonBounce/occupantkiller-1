window.LulworthCove = (function() {
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

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geo, color) {
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
    }

    function buildCoveWater() {
        // Turquoise circular cove water — approximated with a flat cylinder
        var waterGeo = new THREE.CylinderGeometry(220, 220, 2, 32);
        var water = makeMesh(waterGeo, 0x40e0d0);
        water.position.set(13600, -1, 0);
        addMesh(water);
    }

    function buildShingleBeach() {
        // Shingle beach arc at the mouth of the cove
        var beachGeo = new THREE.BoxGeometry(180, 3, 40);
        var beach = makeMesh(beachGeo, 0xb0a090);
        beach.position.set(13600, 1, 210);
        addMesh(beach);

        var beachSide1 = makeMesh(new THREE.BoxGeometry(60, 3, 30), 0xb0a090);
        beachSide1.position.set(13490, 1, 195);
        beachSide1.rotation.y = 0.4;
        addMesh(beachSide1);

        var beachSide2 = makeMesh(new THREE.BoxGeometry(60, 3, 30), 0xb0a090);
        beachSide2.position.set(13710, 1, 195);
        beachSide2.rotation.y = -0.4;
        addMesh(beachSide2);
    }

    function buildCoveCliffs() {
        // White/grey limestone cliff walls surrounding the cove — arranged in arc segments
        var cliffColor = 0xd8d0c0;
        var cliffData = [
            [13600, 30, -220, 420, 60, 20, 0],
            [13390, 30, -160, 20, 60, 200, 0.35],
            [13810, 30, -160, 20, 60, 200, -0.35],
            [13280, 30, -50, 20, 60, 180, 0.65],
            [13920, 30, -50, 20, 60, 180, -0.65],
            [13230, 30, 80, 20, 60, 140, 0.9],
            [13970, 30, 80, 20, 60, 140, -0.9],
            [13260, 30, 190, 60, 60, 60, 1.1],
            [13940, 30, 190, 60, 60, 60, -1.1]
        ];
        for (var i = 0; i < cliffData.length; i++) {
            var d = cliffData[i];
            var cliff = makeMesh(new THREE.BoxGeometry(d[3], d[4], d[5]), cliffColor);
            cliff.position.set(d[0], d[1], d[2]);
            cliff.rotation.y = d[6];
            addMesh(cliff);
        }

        // Chalk upper cliff caps
        var capColor = 0xf5f5f0;
        var capData = [
            [13600, 65, -220, 420, 20, 20],
            [13390, 65, -160, 20, 20, 200],
            [13810, 65, -160, 20, 20, 200],
            [13280, 65, -50, 20, 20, 180],
            [13920, 65, -50, 20, 20, 180]
        ];
        for (var j = 0; j < capData.length; j++) {
            var c = capData[j];
            var cap = makeMesh(new THREE.BoxGeometry(c[3], c[4], c[5]), capColor);
            cap.position.set(c[0], c[1], c[2]);
            addMesh(cap);
        }
    }

    function buildFishingBoats() {
        // Three small fishing boats on the cove water
        var boatColor = 0xcc4422;
        var hullColor = 0x884422;
        var boatPositions = [
            [13560, 2, 60],
            [13620, 2, 20],
            [13540, 2, -30]
        ];
        for (var i = 0; i < boatPositions.length; i++) {
            var bp = boatPositions[i];
            var hull = makeMesh(new THREE.BoxGeometry(18, 5, 8), hullColor);
            hull.position.set(bp[0], bp[1], bp[2]);
            addMesh(hull);
            var cabin = makeMesh(new THREE.BoxGeometry(8, 5, 6), boatColor);
            cabin.position.set(bp[0] - 2, bp[1] + 5, bp[2]);
            addMesh(cabin);
            var mast = makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 14, 4), 0x886644);
            mast.position.set(bp[0] + 4, bp[1] + 9, bp[2]);
            addMesh(mast);
        }
    }

    function buildDurdleDoor() {
        // Durdle Door — limestone arch west of cove
        // Base cliff face
        var cliffColor = 0xc8b89a;
        var leftCliff = makeMesh(new THREE.BoxGeometry(50, 80, 40), cliffColor);
        leftCliff.position.set(13270, 40, -350);
        addMesh(leftCliff);

        var rightCliff = makeMesh(new THREE.BoxGeometry(50, 80, 40), cliffColor);
        rightCliff.position.set(13370, 40, -350);
        addMesh(rightCliff);

        // Left arch pillar
        var pillarLeft = makeMesh(new THREE.BoxGeometry(18, 50, 18), cliffColor);
        pillarLeft.position.set(13285, 25, -330);
        addMesh(pillarLeft);

        // Right arch pillar
        var pillarRight = makeMesh(new THREE.BoxGeometry(18, 50, 18), cliffColor);
        pillarRight.position.set(13355, 25, -330);
        addMesh(pillarRight);

        // Lintel / arch top
        var lintel = makeMesh(new THREE.BoxGeometry(88, 14, 18), cliffColor);
        lintel.position.set(13320, 50, -330);
        addMesh(lintel);

        // Arch beach below
        var archBeach = makeMesh(new THREE.BoxGeometry(100, 3, 35), 0xb0a090);
        archBeach.position.set(13320, 1, -330);
        addMesh(archBeach);

        // Sea below and through arch
        var archSea = makeMesh(new THREE.BoxGeometry(70, 2, 20), 0x40e0d0);
        archSea.position.set(13320, 0, -330);
        addMesh(archSea);

        // Extended cliff face connecting to main headland
        var headland1 = makeMesh(new THREE.BoxGeometry(30, 70, 120), cliffColor);
        headland1.position.set(13240, 35, -300);
        addMesh(headland1);

        var headland2 = makeMesh(new THREE.BoxGeometry(30, 70, 120), cliffColor);
        headland2.position.set(13400, 35, -300);
        addMesh(headland2);
    }

    function buildLulworthCastle() {
        // Lulworth Castle — 17th century hunting lodge, north of cove
        var stoneColor = 0xd4c8a8;
        var darkStone = 0xa09070;

        // Central main block
        var mainBlock = makeMesh(new THREE.BoxGeometry(60, 50, 60), stoneColor);
        mainBlock.position.set(13600, 25, -550);
        addMesh(mainBlock);

        // Four round corner towers
        var towerPositions = [
            [13570, 0, -520],
            [13630, 0, -520],
            [13570, 0, -580],
            [13630, 0, -580]
        ];
        for (var i = 0; i < towerPositions.length; i++) {
            var tp = towerPositions[i];
            var tower = makeMesh(new THREE.CylinderGeometry(10, 10, 60, 8), stoneColor);
            tower.position.set(tp[0], 30 + tp[1], tp[2]);
            addMesh(tower);
            var battlements = makeMesh(new THREE.CylinderGeometry(11, 11, 5, 8), darkStone);
            battlements.position.set(tp[0], 62 + tp[1], tp[2]);
            addMesh(battlements);
        }

        // Castle roof / parapet
        var parapet = makeMesh(new THREE.BoxGeometry(66, 6, 66), darkStone);
        parapet.position.set(13600, 53, -550);
        addMesh(parapet);

        // Gatehouse / entrance
        var gatehouse = makeMesh(new THREE.BoxGeometry(24, 40, 18), stoneColor);
        gatehouse.position.set(13600, 20, -518);
        addMesh(gatehouse);

        var gateArch = makeMesh(new THREE.BoxGeometry(10, 8, 18), 0x333333);
        gateArch.position.set(13600, 7, -518);
        addMesh(gateArch);

        // Chapel ruins in castle grounds
        var chapelWall1 = makeMesh(new THREE.BoxGeometry(30, 20, 4), stoneColor);
        chapelWall1.position.set(13540, 10, -560);
        addMesh(chapelWall1);

        var chapelWall2 = makeMesh(new THREE.BoxGeometry(4, 20, 25), stoneColor);
        chapelWall2.position.set(13525, 10, -548);
        addMesh(chapelWall2);

        var chapelWall3 = makeMesh(new THREE.BoxGeometry(4, 15, 25), stoneColor);
        chapelWall3.position.set(13555, 10, -548);
        addMesh(chapelWall3);

        // Castle grounds — low wall perimeter
        var groundWallN = makeMesh(new THREE.BoxGeometry(140, 8, 4), darkStone);
        groundWallN.position.set(13600, 4, -620);
        addMesh(groundWallN);

        var groundWallS = makeMesh(new THREE.BoxGeometry(140, 8, 4), darkStone);
        groundWallS.position.set(13600, 4, -490);
        addMesh(groundWallS);

        var groundWallW = makeMesh(new THREE.BoxGeometry(4, 8, 134), darkStone);
        groundWallW.position.set(13530, 4, -555);
        addMesh(groundWallW);

        var groundWallE = makeMesh(new THREE.BoxGeometry(4, 8, 134), darkStone);
        groundWallE.position.set(13670, 4, -555);
        addMesh(groundWallE);
    }

    function buildFossilForest() {
        // Fossil Forest — Jurassic fossilised tree stumps on limestone ledge above cove
        var fossilColor = 0x8a7a5a;
        var ledgeColor = 0xc8b898;

        // Limestone ledge
        var ledge = makeMesh(new THREE.BoxGeometry(120, 8, 40), ledgeColor);
        ledge.position.set(13680, 25, -270);
        addMesh(ledge);

        // Circular fossilised tree stumps
        var stumpData = [
            [13650, 29, -265, 4, 6],
            [13670, 29, -280, 5, 5],
            [13695, 29, -260, 3, 7],
            [13715, 29, -275, 6, 4],
            [13730, 29, -265, 4, 6],
            [13660, 29, -275, 3, 5],
            [13700, 29, -285, 5, 4]
        ];
        for (var i = 0; i < stumpData.length; i++) {
            var s = stumpData[i];
            var stump = makeMesh(new THREE.CylinderGeometry(s[3], s[3] + 1, s[4], 8), fossilColor);
            stump.position.set(s[0], s[1], s[2]);
            addMesh(stump);
            // Concentric ring (algal mound / corona) around stump
            var ring = makeMesh(new THREE.CylinderGeometry(s[3] + 3, s[3] + 3, 2, 8), 0x6a5a3a);
            ring.position.set(s[0], s[1] - 2, s[2]);
            addMesh(ring);
        }
    }

    function buildStairHole() {
        // Stair Hole — collapsed coves east of Durdle Door, dramatic geology
        var rockColor = 0xa09080;
        var caveColor = 0x332211;

        // Rock stacks
        var stackData = [
            [13450, 20, -420, 8, 40, 8],
            [13465, 15, -410, 6, 30, 6],
            [13445, 10, -400, 7, 20, 7]
        ];
        for (var i = 0; i < stackData.length; i++) {
            var s = stackData[i];
            var stack = makeMesh(new THREE.BoxGeometry(s[3], s[4], s[5]), rockColor);
            stack.position.set(s[0], s[1], s[2]);
            addMesh(stack);
        }

        // Cliff face with geological layer lines (coloured bands in cliff)
        var layerColors = [0xd4c4a4, 0x888878, 0xc8b890, 0x707060, 0xd0c0a0];
        for (var j = 0; j < layerColors.length; j++) {
            var layer = makeMesh(new THREE.BoxGeometry(80, 8, 6), layerColors[j]);
            layer.position.set(13460, 8 + j * 8, -450);
            addMesh(layer);
        }

        // Natural arch in stair hole
        var archLeft = makeMesh(new THREE.BoxGeometry(10, 30, 8), rockColor);
        archLeft.position.set(13480, 15, -440);
        addMesh(archLeft);

        var archRight = makeMesh(new THREE.BoxGeometry(10, 30, 8), rockColor);
        archRight.position.set(13510, 15, -440);
        addMesh(archRight);

        var archTop = makeMesh(new THREE.BoxGeometry(40, 8, 8), rockColor);
        archTop.position.set(13495, 30, -440);
        addMesh(archTop);

        // Small cove water pocket
        var stairWater = makeMesh(new THREE.CylinderGeometry(30, 30, 2, 12), 0x40d0c0);
        stairWater.position.set(13460, 0, -420);
        addMesh(stairWater);
    }

    function buildCoastPath() {
        // South West Coast Path chalk track along clifftop
        var pathColor = 0xe8e0c8;
        var postColor = 0x88a844;
        var woodColor = 0x886644;

        // Path segments along cliff edge
        var pathSegments = [
            [13600, 2, -230, 240, 2, 6],
            [13500, 2, -300, 6, 2, 160],
            [13700, 2, -300, 6, 2, 160],
            [13400, 2, -380, 6, 2, 100],
            [13300, 2, -430, 160, 2, 6]
        ];
        for (var i = 0; i < pathSegments.length; i++) {
            var ps = pathSegments[i];
            var path = makeMesh(new THREE.BoxGeometry(ps[3], ps[4], ps[5]), pathColor);
            path.position.set(ps[0], ps[1], ps[2]);
            addMesh(path);
        }

        // Waymarker posts
        var wayposts = [
            [13600, 0, -240],
            [13500, 0, -360],
            [13700, 0, -360],
            [13400, 0, -440]
        ];
        for (var j = 0; j < wayposts.length; j++) {
            var wp = wayposts[j];
            var post = makeMesh(new THREE.CylinderGeometry(1, 1, 14, 4), postColor);
            post.position.set(wp[0], 7, wp[2]);
            addMesh(post);
            var cap = makeMesh(new THREE.ConeGeometry(2, 4, 4), postColor);
            cap.position.set(wp[0], 15, wp[2]);
            addMesh(cap);
        }

        // Bench on clifftop
        var benchSeat = makeMesh(new THREE.BoxGeometry(14, 1.5, 4), woodColor);
        benchSeat.position.set(13660, 4, -250);
        addMesh(benchSeat);

        var benchLegL = makeMesh(new THREE.BoxGeometry(1.5, 5, 4), woodColor);
        benchLegL.position.set(13653, 1.5, -250);
        addMesh(benchLegL);

        var benchLegR = makeMesh(new THREE.BoxGeometry(1.5, 5, 4), woodColor);
        benchLegR.position.set(13667, 1.5, -250);
        addMesh(benchLegR);

        var benchBack = makeMesh(new THREE.BoxGeometry(14, 5, 1.5), woodColor);
        benchBack.position.set(13660, 7, -252);
        addMesh(benchBack);

        // National Trust sign
        var signPost = makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 16, 4), woodColor);
        signPost.position.set(13580, 8, -245);
        addMesh(signPost);

        var signBoard = makeMesh(new THREE.BoxGeometry(14, 6, 1), 0x228833);
        signBoard.position.set(13580, 15, -245);
        addMesh(signBoard);

        // Clifftop vegetation — small rounded bushes
        var vegColor = 0x558844;
        var vegPositions = [
            [13540, 3, -255],
            [13560, 2, -265],
            [13620, 3, -255],
            [13640, 2, -270],
            [13720, 3, -260],
            [13480, 2, -340],
            [13740, 3, -320]
        ];
        for (var k = 0; k < vegPositions.length; k++) {
            var vp = vegPositions[k];
            var bush = makeMesh(new THREE.SphereGeometry(4, 6, 4), vegColor);
            bush.position.set(vp[0], vp[1] + 4, vp[2]);
            addMesh(bush);
        }
    }

    function buildGroundPlane() {
        // Ground plane for the wider area — green coastal grassland
        var ground = makeMesh(new THREE.BoxGeometry(1200, 2, 1200), 0x6a8a4a);
        ground.position.set(13600, -1, -300);
        addMesh(ground);

        // Sea floor / open sea to south
        var sea = makeMesh(new THREE.BoxGeometry(1200, 2, 400), 0x2060a0);
        sea.position.set(13600, -2, 400);
        addMesh(sea);
    }

    function build() {
        buildGroundPlane();
        buildCoveWater();
        buildShingleBeach();
        buildCoveCliffs();
        buildFishingBoats();
        buildDurdleDoor();
        buildLulworthCastle();
        buildFossilForest();
        buildStairHole();
        buildCoastPath();
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
