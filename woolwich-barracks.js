window.WoolwichBarracks = (function() {
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

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        return mesh;
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildBarracks() {
        // Royal Artillery Barracks — 322m long Georgian facade
        var X = 11000;
        var Z = -200;

        // Main facade block — 322m wide, 2 storeys
        var facadeGeo = new THREE.BoxGeometry(322, 18, 14);
        var facade = makeMesh(facadeGeo, 0xd4b896);
        facade.position.set(X, 9, Z);
        addMesh(facade);

        // Ground floor string course
        var courseGeo = new THREE.BoxGeometry(322, 1.2, 15);
        var course = makeMesh(courseGeo, 0xc8a878);
        course.position.set(X, 8, Z);
        addMesh(course);

        // Central pediment block (raised centrepiece)
        var pedGeo = new THREE.BoxGeometry(48, 24, 16);
        var ped = makeMesh(pedGeo, 0xcfb98a);
        ped.position.set(X, 12, Z);
        addMesh(ped);

        // Central triangular pediment top
        var pedTopGeo = new THREE.CylinderGeometry(0, 26, 10, 4);
        var pedTop = makeMesh(pedTopGeo, 0xbfa870);
        pedTop.position.set(X, 29, Z);
        pedTop.rotation.y = Math.PI / 4;
        addMesh(pedTop);

        // Central pediment columns — 8 columns
        for (var c = 0; c < 8; c++) {
            var colGeo = new THREE.CylinderGeometry(0.7, 0.9, 18, 8);
            var col = makeMesh(colGeo, 0xe8dcc8);
            col.position.set(X - 14 + c * 4, 9, Z - 8.5);
            addMesh(col);
        }

        // Left pavilion
        var lpGeo = new THREE.BoxGeometry(36, 20, 16);
        var lp = makeMesh(lpGeo, 0xcfb98a);
        lp.position.set(X - 161, 10, Z);
        addMesh(lp);

        // Right pavilion
        var rpGeo = new THREE.BoxGeometry(36, 20, 16);
        var rp = makeMesh(rpGeo, 0xcfb98a);
        rp.position.set(X + 161, 10, Z);
        addMesh(rp);

        // Georgian windows along facade — rows of windows
        for (var w = 0; w < 60; w++) {
            var wx = X - 150 + w * 5.1;
            // Upper windows
            var winGeoU = new THREE.BoxGeometry(2.2, 3.5, 0.4);
            var winU = makeMesh(winGeoU, 0x8ab0d4);
            winU.position.set(wx, 14, Z - 7.2);
            addMesh(winU);
            // Lower windows
            var winGeoL = new THREE.BoxGeometry(2.2, 3.8, 0.4);
            var winL = makeMesh(winGeoL, 0x8ab0d4);
            winL.position.set(wx, 5, Z - 7.2);
            addMesh(winL);
        }

        // Roof cornice
        var corniceGeo = new THREE.BoxGeometry(326, 1.5, 16);
        var cornice = makeMesh(corniceGeo, 0xb8976a);
        cornice.position.set(X, 18.75, Z);
        addMesh(cornice);

        // Parade ground — large flat slab in front
        var paradeGeo = new THREE.BoxGeometry(340, 0.4, 200);
        var parade = makeMesh(paradeGeo, 0x8a9070);
        parade.position.set(X, 0.2, Z + 107);
        addMesh(parade);

        // Flagpole
        var poleGeo = new THREE.CylinderGeometry(0.25, 0.35, 22, 6);
        var pole = makeMesh(poleGeo, 0xdddddd);
        pole.position.set(X, 11, Z - 4);
        addMesh(pole);

        // Flag
        var flagGeo = new THREE.BoxGeometry(6, 3.5, 0.1);
        var flag = makeMesh(flagGeo, 0xcc0000);
        flag.position.set(X + 3, 22, Z - 4);
        addMesh(flag);

        // Rear wings (barracks behind facade)
        var wingLGeo = new THREE.BoxGeometry(80, 16, 120);
        var wingL = makeMesh(wingLGeo, 0xc8a878);
        wingL.position.set(X - 170, 8, Z - 67);
        addMesh(wingL);

        var wingRGeo = new THREE.BoxGeometry(80, 16, 120);
        var wingR = makeMesh(wingRGeo, 0xc8a878);
        wingR.position.set(X + 170, 8, Z - 67);
        addMesh(wingR);

        // Perimeter wall along front
        var wallGeo = new THREE.BoxGeometry(340, 3, 1.2);
        var wall = makeMesh(wallGeo, 0x9a8060);
        wall.position.set(X, 1.5, Z + 206);
        addMesh(wall);
    }

    function buildThamesBarrier() {
        // Thames Barrier — flood barrier across river
        // Positioned north, along Thames
        var X = 11000;
        var Z = 700;
        var riverBase = -1.5;

        // Concrete base sill across river
        var sillGeo = new THREE.BoxGeometry(520, 3, 22);
        var sill = makeMesh(sillGeo, 0x909090);
        sill.position.set(X, riverBase - 1, Z);
        addMesh(sill);

        // River water surface
        var waterGeo = new THREE.BoxGeometry(560, 0.5, 280);
        var water = makeMesh(waterGeo, 0x1a5276);
        water.position.set(X, riverBase, Z + 20);
        addMesh(water);

        // 10 rotating steel gate piers — the iconic hooded cowls
        for (var p = 0; p < 10; p++) {
            var pierX = X - 225 + p * 50;

            // Main concrete support pier
            var pierGeo = new THREE.BoxGeometry(8, 12, 18);
            var pier = makeMesh(pierGeo, 0xa0a0a0);
            pier.position.set(pierX, 5, Z);
            addMesh(pier);

            // The iconic silver hooded cowl (rotating gate housing) — CylinderGeometry
            var cowlGeo = new THREE.CylinderGeometry(7, 7, 10, 12, 1, false);
            var cowl = makeMesh(cowlGeo, 0xc8c8c8);
            cowl.position.set(pierX, 14, Z);
            cowl.rotation.x = Math.PI / 2;
            addMesh(cowl);

            // Hood top cap
            var capGeo = new THREE.CylinderGeometry(7.2, 7.2, 1.5, 12);
            var cap = makeMesh(capGeo, 0xb0b0b0);
            cap.position.set(pierX, 19, Z);
            addMesh(cap);

            // Hood bottom cap
            var botCapGeo = new THREE.CylinderGeometry(7.2, 7.2, 1.5, 12);
            var botCap = makeMesh(botCapGeo, 0xb0b0b0);
            botCap.position.set(pierX, 8, Z);
            addMesh(botCap);

            // Service walkway connection between piers
            if (p < 9) {
                var walkGeo = new THREE.BoxGeometry(42, 2, 4);
                var walk = makeMesh(walkGeo, 0x888888);
                walk.position.set(pierX + 25, 20, Z);
                addMesh(walk);

                // Walkway railing posts
                for (var r = 0; r < 4; r++) {
                    var postGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.5, 5);
                    var post = makeMesh(postGeo, 0x666666);
                    post.position.set(pierX + 10 + r * 8, 22.25, Z + 1.5);
                    addMesh(post);
                    var post2Geo = new THREE.CylinderGeometry(0.2, 0.2, 2.5, 5);
                    var post2 = makeMesh(post2Geo, 0x666666);
                    post2.position.set(pierX + 10 + r * 8, 22.25, Z - 1.5);
                    addMesh(post2);
                }
            }

            // Steel gate (flat slab below water when raised)
            var gateGeo = new THREE.BoxGeometry(48, 1.5, 14);
            var gate = makeMesh(gateGeo, 0x7a8a9a);
            gate.position.set(pierX, riverBase + 0.75, Z);
            addMesh(gate);
        }

        // South bank approach embankment
        var embSGeo = new THREE.BoxGeometry(540, 4, 30);
        var embS = makeMesh(embSGeo, 0x787060);
        embS.position.set(X, 2, Z + 55);
        addMesh(embS);

        // North bank approach
        var embNGeo = new THREE.BoxGeometry(540, 4, 30);
        var embN = makeMesh(embNGeo, 0x787060);
        embN.position.set(X, 2, Z - 155);
        addMesh(embN);

        // Visitor centre building (south side)
        var vcGeo = new THREE.BoxGeometry(40, 12, 30);
        var vc = makeMesh(vcGeo, 0x9090a0);
        vc.position.set(X + 240, 6, Z + 65);
        addMesh(vc);

        var vcRoofGeo = new THREE.BoxGeometry(44, 2, 34);
        var vcRoof = makeMesh(vcRoofGeo, 0x707080);
        vcRoof.position.set(X + 240, 13, Z + 65);
        addMesh(vcRoof);
    }

    function buildWoolwichFerry() {
        var X = 11000;
        var Z = 550;

        // South terminal building
        var termGeo = new THREE.BoxGeometry(50, 10, 30);
        var term = makeMesh(termGeo, 0x8090a0);
        term.position.set(X - 100, 5, Z + 20);
        addMesh(term);

        var termRoofGeo = new THREE.BoxGeometry(54, 2, 34);
        var termRoof = makeMesh(termRoofGeo, 0x607080);
        termRoof.position.set(X - 100, 11, Z + 20);
        addMesh(termRoof);

        // Ferry ramp (sloped approach to water)
        var rampGeo = new THREE.BoxGeometry(30, 1, 40);
        var ramp = makeMesh(rampGeo, 0x707070);
        ramp.position.set(X - 100, 0, Z - 12);
        ramp.rotation.x = 0.07;
        addMesh(ramp);

        // Dock jetty
        var jettyGeo = new THREE.BoxGeometry(34, 1.5, 18);
        var jetty = makeMesh(jettyGeo, 0x606050);
        jetty.position.set(X - 100, -0.5, Z - 35);
        addMesh(jetty);

        // Ferry vessel — wide flat hull
        var hullGeo = new THREE.BoxGeometry(60, 4, 22);
        var hull = makeMesh(hullGeo, 0xddddcc);
        hull.position.set(X - 100, 1.5, Z - 50);
        addMesh(hull);

        // Ferry bow shape
        var bowGeo = new THREE.CylinderGeometry(0, 11, 6, 4);
        var bow = makeMesh(bowGeo, 0xccccbb);
        bow.position.set(X - 131, 3, Z - 50);
        bow.rotation.z = Math.PI / 2;
        bow.rotation.y = Math.PI / 4;
        addMesh(bow);

        // Ferry stern
        var sternGeo = new THREE.CylinderGeometry(0, 11, 6, 4);
        var stern = makeMesh(sternGeo, 0xccccbb);
        stern.position.set(X - 69, 3, Z - 50);
        stern.rotation.z = -Math.PI / 2;
        stern.rotation.y = Math.PI / 4;
        addMesh(stern);

        // Superstructure — passenger deck
        var superGeo = new THREE.BoxGeometry(50, 6, 20);
        var superStr = makeMesh(superGeo, 0xeeeedd);
        superStr.position.set(X - 100, 7, Z - 50);
        addMesh(superStr);

        // Bridge / wheelhouse
        var bridgeGeo = new THREE.BoxGeometry(14, 5, 14);
        var bridge = makeMesh(bridgeGeo, 0xddddcc);
        bridge.position.set(X - 100, 13, Z - 50);
        addMesh(bridge);

        // Funnel
        var funnelGeo = new THREE.CylinderGeometry(1.5, 2, 6, 8);
        var funnel = makeMesh(funnelGeo, 0xcc3300);
        funnel.position.set(X - 100, 18.5, Z - 50);
        addMesh(funnel);

        // Ferry windows
        for (var fw = 0; fw < 7; fw++) {
            var fwinGeo = new THREE.BoxGeometry(3, 2.5, 0.3);
            var fwin = makeMesh(fwinGeo, 0x7ab0d0);
            fwin.position.set(X - 118 + fw * 6, 8, Z - 60.2);
            addMesh(fwin);
        }

        // Mooring bollards
        for (var b = 0; b < 4; b++) {
            var bollardGeo = new THREE.CylinderGeometry(0.5, 0.6, 1.8, 8);
            var bollard = makeMesh(bollardGeo, 0x333333);
            bollard.position.set(X - 117 + b * 12, 1.4, Z - 26);
            addMesh(bollard);
        }
    }

    function buildWoolwichArsenal() {
        var X = 11000;
        var Z = 200;

        // Board of Ordnance building — Georgian brick
        var boardGeo = new THREE.BoxGeometry(80, 20, 40);
        var board = makeMesh(boardGeo, 0x9a6040);
        board.position.set(X + 300, 10, Z);
        addMesh(board);

        // Board of Ordnance roof
        var boardRoofGeo = new THREE.CylinderGeometry(0, 48, 10, 4);
        var boardRoof = makeMesh(boardRoofGeo, 0x7a5030);
        boardRoof.position.set(X + 300, 25, Z);
        boardRoof.rotation.y = Math.PI / 4;
        addMesh(boardRoof);

        // Board windows upper
        for (var bw = 0; bw < 7; bw++) {
            var bwinGeo = new THREE.BoxGeometry(3, 4, 0.4);
            var bwin = makeMesh(bwinGeo, 0x8ab0c8);
            bwin.position.set(X + 263 + bw * 11, 15, Z - 20.2);
            addMesh(bwin);
            var bwinLGeo = new THREE.BoxGeometry(3, 4, 0.4);
            var bwinL = makeMesh(bwinLGeo, 0x8ab0c8);
            bwinL.position.set(X + 263 + bw * 11, 6, Z - 20.2);
            addMesh(bwinL);
        }

        // Dial Arch — iconic brick gateway arch
        var archBaseGeo = new THREE.BoxGeometry(22, 28, 8);
        var archBase = makeMesh(archBaseGeo, 0x8a5030);
        archBase.position.set(X + 200, 14, Z - 5);
        addMesh(archBase);

        // Arch opening (cut-out effect with lighter box)
        var archOpenGeo = new THREE.BoxGeometry(8, 14, 10);
        var archOpen = makeMesh(archOpenGeo, 0x4a3020);
        archOpen.position.set(X + 200, 7, Z - 5);
        addMesh(archOpen);

        // Arch curved top
        var archTopGeo = new THREE.CylinderGeometry(4, 4, 10, 8, 1, false, 0, Math.PI);
        var archTop = makeMesh(archTopGeo, 0x4a3020);
        archTop.position.set(X + 200, 14, Z - 5);
        archTop.rotation.x = Math.PI / 2;
        archTop.rotation.z = Math.PI / 2;
        addMesh(archTop);

        // Clock tower above arch
        var clockTowerGeo = new THREE.BoxGeometry(10, 16, 10);
        var clockTower = makeMesh(clockTowerGeo, 0x9a6040);
        clockTower.position.set(X + 200, 36, Z - 5);
        addMesh(clockTower);

        // Clock face
        var clockGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.5, 12);
        var clock = makeMesh(clockGeo, 0xe8e0c0);
        clock.position.set(X + 200, 36, Z - 10.3);
        clock.rotation.x = Math.PI / 2;
        addMesh(clock);

        // Spire above clock tower
        var spireGeo = new THREE.ConeGeometry(2.5, 10, 8);
        var spire = makeMesh(spireGeo, 0x556644);
        spire.position.set(X + 200, 49, Z - 5);
        addMesh(spire);

        // Brass Foundry — large industrial building
        var foundryGeo = new THREE.BoxGeometry(90, 16, 55);
        var foundry = makeMesh(foundryGeo, 0x8a5030);
        foundry.position.set(X + 410, 8, Z + 10);
        addMesh(foundry);

        // Foundry roof (hipped)
        var foundryRoofGeo = new THREE.CylinderGeometry(0, 55, 12, 4);
        var foundryRoof = makeMesh(foundryRoofGeo, 0x6a3818);
        foundryRoof.position.set(X + 410, 22, Z + 10);
        foundryRoof.rotation.y = Math.PI / 4;
        addMesh(foundryRoof);

        // Foundry chimney
        var chimneyGeo = new THREE.CylinderGeometry(2, 3, 30, 8);
        var chimney = makeMesh(chimneyGeo, 0x6a4020);
        chimney.position.set(X + 440, 23, Z);
        addMesh(chimney);

        // Arsenal perimeter wall
        var aWallGeo = new THREE.BoxGeometry(280, 5, 1.5);
        var aWall = makeMesh(aWallGeo, 0x7a5030);
        aWall.position.set(X + 310, 2.5, Z - 32);
        addMesh(aWall);

        // Arsenal gate piers
        var gPierLGeo = new THREE.BoxGeometry(4, 8, 4);
        var gPierL = makeMesh(gPierLGeo, 0x9a6040);
        gPierL.position.set(X + 186, 4, Z - 32);
        addMesh(gPierL);
        var gPierRGeo = new THREE.BoxGeometry(4, 8, 4);
        var gPierR = makeMesh(gPierRGeo, 0x9a6040);
        gPierR.position.set(X + 214, 4, Z - 32);
        addMesh(gPierR);

        // Arsenal courtyard ground
        var courtGeo = new THREE.BoxGeometry(280, 0.3, 80);
        var court = makeMesh(courtGeo, 0x706050);
        court.position.set(X + 310, 0.15, Z + 10);
        addMesh(court);
    }

    function buildElizabethLineStation() {
        var X = 11000;
        var Z = 320;

        // Station entrance canopy — modern glass structure
        var canopyGeo = new THREE.BoxGeometry(40, 1.5, 20);
        var canopy = makeMesh(canopyGeo, 0x90b8d0);
        canopy.position.set(X - 200, 8, Z);
        addMesh(canopy);

        // Canopy support columns
        for (var sc = 0; sc < 6; sc++) {
            var sColGeo = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
            var sCol = makeMesh(sColGeo, 0x909090);
            sCol.position.set(X - 218 + sc * 8, 4, Z - 8);
            addMesh(sCol);
            var sCol2Geo = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
            var sCol2 = makeMesh(sCol2Geo, 0x909090);
            sCol2.position.set(X - 218 + sc * 8, 4, Z + 8);
            addMesh(sCol2);
        }

        // Station entrance box / head house
        var headGeo = new THREE.BoxGeometry(30, 14, 22);
        var head = makeMesh(headGeo, 0xb0b8c0);
        head.position.set(X - 200, 7, Z + 20);
        addMesh(head);

        // Glass curtain wall facade
        var glassGeo = new THREE.BoxGeometry(30, 14, 0.4);
        var glass = makeMesh(glassGeo, 0x7ab0d0);
        glass.position.set(X - 200, 7, Z + 9.2);
        addMesh(glass);

        // Elizabeth line roundel sign
        var roundelGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.4, 16);
        var roundel = makeMesh(roundelGeo, 0x6000aa);
        roundel.position.set(X - 200, 13, Z + 9.4);
        roundel.rotation.x = Math.PI / 2;
        addMesh(roundel);

        // Escalator shaft boxes (going underground)
        var esc1Geo = new THREE.BoxGeometry(14, 10, 8);
        var esc1 = makeMesh(esc1Geo, 0x9090a0);
        esc1.position.set(X - 200, 5, Z + 32);
        addMesh(esc1);

        var esc2Geo = new THREE.BoxGeometry(14, 8, 8);
        var esc2 = makeMesh(esc2Geo, 0x808090);
        esc2.position.set(X - 200, 4, Z + 42);
        addMesh(esc2);

        // Ventilation shaft
        var ventGeo = new THREE.BoxGeometry(6, 18, 6);
        var vent = makeMesh(ventGeo, 0xa0a0b0);
        vent.position.set(X - 188, 9, Z + 32);
        addMesh(vent);

        var ventCapGeo = new THREE.BoxGeometry(8, 1.5, 8);
        var ventCap = makeMesh(ventCapGeo, 0x808090);
        ventCap.position.set(X - 188, 18.75, Z + 32);
        addMesh(ventCap);

        // Station concourse building body
        var concourseGeo = new THREE.BoxGeometry(45, 12, 35);
        var concourse = makeMesh(concourseGeo, 0xa8b0b8);
        concourse.position.set(X - 200, 6, Z + 55);
        addMesh(concourse);

        // Concourse roof
        var cRoofGeo = new THREE.BoxGeometry(47, 1.5, 37);
        var cRoof = makeMesh(cRoofGeo, 0x909098);
        cRoof.position.set(X - 200, 12.75, Z + 55);
        addMesh(cRoof);

        // Station approach path / plaza
        var plazaGeo = new THREE.BoxGeometry(50, 0.3, 30);
        var plaza = makeMesh(plazaGeo, 0xa0a090);
        plaza.position.set(X - 200, 0.15, Z - 10);
        addMesh(plaza);

        // Cycle parking shelter
        var cycleGeo = new THREE.BoxGeometry(16, 4, 5);
        var cycle = makeMesh(cycleGeo, 0x8898a8);
        cycle.position.set(X - 175, 2, Z - 6);
        addMesh(cycle);
    }

    function buildGroundPlane() {
        var groundGeo = new THREE.BoxGeometry(1200, 0.5, 1200);
        var ground = makeMesh(groundGeo, 0x5a6a45);
        ground.position.set(11000, -0.25, 350);
        addMesh(ground);

        // Roads
        var mainRoadGeo = new THREE.BoxGeometry(16, 0.4, 1200);
        var mainRoad = makeMesh(mainRoadGeo, 0x444444);
        mainRoad.position.set(11000, 0.2, 350);
        addMesh(mainRoad);

        var crossRoadGeo = new THREE.BoxGeometry(1200, 0.4, 14);
        var crossRoad = makeMesh(crossRoadGeo, 0x444444);
        crossRoad.position.set(11000, 0.2, 260);
        addMesh(crossRoad);
    }

    function build() {
        buildGroundPlane();
        buildBarracks();
        buildThamesBarrier();
        buildWoolwichFerry();
        buildWoolwichArsenal();
        buildElizabethLineStation();
    }

    function update(delta) {
        // Static environment — no per-frame animation required
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
