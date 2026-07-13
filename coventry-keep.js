window.CoventryKeep = (function() {
    'use strict';

    var WORLD_X = 3070;
    var WORLD_Z = 2200;

    function buildOldCathedralShell(scene) {
        var mat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });

        // Main ruin shell — roofless sandstone walls
        var bodyGeo = new THREE.BoxGeometry(35, 16, 12);
        var body = new THREE.Mesh(bodyGeo, mat);
        body.position.set(WORLD_X, 8, WORLD_Z - 20);
        scene.add(body);

        // North wall Gothic window cutout illusion — thin dark recessed boxes
        var windowMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        var winGeo1 = new THREE.BoxGeometry(3, 6, 1);
        var win1 = new THREE.Mesh(winGeo1, windowMat);
        win1.position.set(WORLD_X - 10, 11, WORLD_Z - 26.1);
        scene.add(win1);

        var win2 = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 1), windowMat);
        win2.position.set(WORLD_X, 11, WORLD_Z - 26.1);
        scene.add(win2);

        var win3 = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 1), windowMat);
        win3.position.set(WORLD_X + 10, 11, WORLD_Z - 26.1);
        scene.add(win3);

        // South wall windows
        var win4 = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 1), windowMat);
        win4.position.set(WORLD_X - 10, 11, WORLD_Z - 13.9);
        scene.add(win4);

        var win5 = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 1), windowMat);
        win5.position.set(WORLD_X + 10, 11, WORLD_Z - 13.9);
        scene.add(win5);

        // East end apse wall
        var eastWall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 16, 12), mat);
        eastWall.position.set(WORLD_X + 18, 8, WORLD_Z - 20);
        scene.add(eastWall);

        // West end wall (entrance)
        var westWall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 16, 12), mat);
        westWall.position.set(WORLD_X - 18, 8, WORLD_Z - 20);
        scene.add(westWall);
    }

    function buildOldSpire(scene) {
        var spireMat = new THREE.MeshLambertMaterial({ color: 0xD4A97A });

        // Spire base tower
        var towerGeo = new THREE.BoxGeometry(4, 28, 4);
        var tower = new THREE.Mesh(towerGeo, spireMat);
        tower.position.set(WORLD_X - 16, 22, WORLD_Z - 20);
        scene.add(tower);

        // Spire needle tip (cone)
        var needleGeo = new THREE.ConeGeometry(2, 12, 6);
        var needle = new THREE.Mesh(needleGeo, spireMat);
        needle.position.set(WORLD_X - 16, 42, WORLD_Z - 20);
        scene.add(needle);
    }

    function buildNewCathedral(scene) {
        var concreteMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

        // Main Basil Spence modernist nave
        var naveGeo = new THREE.BoxGeometry(30, 14, 16);
        var nave = new THREE.Mesh(naveGeo, concreteMat);
        nave.position.set(WORLD_X, 7, WORLD_Z + 10);
        scene.add(nave);

        // Roof — slightly wider slab
        var roofGeo = new THREE.BoxGeometry(31, 1.2, 17);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(WORLD_X, 14.6, WORLD_Z + 10);
        scene.add(roof);

        // Graham Sutherland tapestry panel on north wall (colourful)
        var tapestryMat = new THREE.MeshLambertMaterial({ color: 0x2E5FA3 });
        var tapestryGeo = new THREE.BoxGeometry(6, 12, 1);
        var tapestry = new THREE.Mesh(tapestryGeo, tapestryMat);
        tapestry.position.set(WORLD_X, 8, WORLD_Z + 2.1);
        scene.add(tapestry);

        // Tapestry accent panel — golden figure of Christ
        var goldMat = new THREE.MeshLambertMaterial({ color: 0xD4AF37 });
        var goldGeo = new THREE.BoxGeometry(2, 8, 0.5);
        var goldPanel = new THREE.Mesh(goldGeo, goldMat);
        goldPanel.position.set(WORLD_X, 7, WORLD_Z + 1.7);
        scene.add(goldPanel);

        // Entrance porch connecting ruins to new cathedral
        var porchGeo = new THREE.BoxGeometry(8, 10, 4);
        var porch = new THREE.Mesh(porchGeo, concreteMat);
        porch.position.set(WORLD_X, 5, WORLD_Z + 2);
        scene.add(porch);

        // New cathedral fleche (small spike on roof)
        var flecheMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var flecheGeo = new THREE.ConeGeometry(0.8, 8, 4);
        var fleche = new THREE.Mesh(flecheGeo, flecheMat);
        fleche.position.set(WORLD_X, 19, WORLD_Z + 10);
        scene.add(fleche);
    }

    function buildLadyGodiva(scene) {
        var bronzeMat = new THREE.MeshLambertMaterial({ color: 0x7A5A2A });

        // Plinth / pedestal
        var plinthGeo = new THREE.BoxGeometry(2.5, 2, 2.5);
        var plinth = new THREE.Mesh(plinthGeo, new THREE.MeshLambertMaterial({ color: 0x555555 }));
        plinth.position.set(WORLD_X + 40, 1, WORLD_Z);
        scene.add(plinth);

        // Horse body
        var horseBodyGeo = new THREE.BoxGeometry(3.5, 2, 1.5);
        var horseBody = new THREE.Mesh(horseBodyGeo, bronzeMat);
        horseBody.position.set(WORLD_X + 40, 3.5, WORLD_Z);
        scene.add(horseBody);

        // Horse neck
        var horseNeckGeo = new THREE.BoxGeometry(0.8, 1.6, 0.8);
        var horseNeck = new THREE.Mesh(horseNeckGeo, bronzeMat);
        horseNeck.position.set(WORLD_X + 41.5, 5, WORLD_Z);
        scene.add(horseNeck);

        // Horse head
        var horseHeadGeo = new THREE.BoxGeometry(1.2, 1, 0.9);
        var horseHead = new THREE.Mesh(horseHeadGeo, bronzeMat);
        horseHead.position.set(WORLD_X + 42.5, 6, WORLD_Z);
        scene.add(horseHead);

        // Horse legs
        var legGeo = new THREE.BoxGeometry(0.5, 1.8, 0.5);
        var legFL = new THREE.Mesh(legGeo, bronzeMat);
        legFL.position.set(WORLD_X + 41, 2.4, WORLD_Z - 0.5);
        scene.add(legFL);

        var legFR = new THREE.Mesh(legGeo, bronzeMat);
        legFR.position.set(WORLD_X + 41, 2.4, WORLD_Z + 0.5);
        scene.add(legFR);

        var legBL = new THREE.Mesh(legGeo, bronzeMat);
        legBL.position.set(WORLD_X + 39, 2.4, WORLD_Z - 0.5);
        scene.add(legBL);

        var legBR = new THREE.Mesh(legGeo, bronzeMat);
        legBR.position.set(WORLD_X + 39, 2.4, WORLD_Z + 0.5);
        scene.add(legBR);

        // Rider torso (cylinder)
        var riderBodyGeo = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 8);
        var riderBody = new THREE.Mesh(riderBodyGeo, bronzeMat);
        riderBody.position.set(WORLD_X + 40, 5.5, WORLD_Z);
        scene.add(riderBody);

        // Rider head (sphere)
        var riderHeadGeo = new THREE.SphereGeometry(0.35, 8, 6);
        var riderHead = new THREE.Mesh(riderHeadGeo, bronzeMat);
        riderHead.position.set(WORLD_X + 40, 6.6, WORLD_Z);
        scene.add(riderHead);
    }

    function buildWhittleArch(scene) {
        var steelMat = new THREE.MeshLambertMaterial({ color: 0x8A8A8A });

        // Left arch leg
        var leftLeg = new THREE.BoxGeometry(1.5, 20, 1.5);
        var leftPillar = new THREE.Mesh(leftLeg, steelMat);
        leftPillar.position.set(WORLD_X + 60, 10, WORLD_Z - 8);
        scene.add(leftPillar);

        // Right arch leg
        var rightPillar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 20, 1.5), steelMat);
        rightPillar.position.set(WORLD_X + 60, 10, WORLD_Z + 8);
        scene.add(rightPillar);

        // Arch crown (horizontal top)
        var crownGeo = new THREE.BoxGeometry(1.5, 1.5, 18);
        var crown = new THREE.Mesh(crownGeo, steelMat);
        crown.position.set(WORLD_X + 60, 20, WORLD_Z);
        scene.add(crown);

        // Arch diagonals — angled boxes to suggest curve
        var diagL = new THREE.BoxGeometry(1.5, 6, 1.5);
        var diagMeshL = new THREE.Mesh(diagL, steelMat);
        diagMeshL.position.set(WORLD_X + 60, 17, WORLD_Z - 6);
        diagMeshL.rotation.z = 0.3;
        scene.add(diagMeshL);

        var diagMeshR = new THREE.Mesh(new THREE.BoxGeometry(1.5, 6, 1.5), steelMat);
        diagMeshR.position.set(WORLD_X + 60, 17, WORLD_Z + 6);
        diagMeshR.rotation.z = -0.3;
        scene.add(diagMeshR);
    }

    function buildTransportMuseum(scene) {
        var buildingMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x777777 });

        // Museum building
        var buildingGeo = new THREE.BoxGeometry(24, 8, 16);
        var building = new THREE.Mesh(buildingGeo, buildingMat);
        building.position.set(WORLD_X - 50, 4, WORLD_Z);
        scene.add(building);

        // Roof
        var museumRoofGeo = new THREE.BoxGeometry(25, 1, 17);
        var museumRoof = new THREE.Mesh(museumRoofGeo, roofMat);
        museumRoof.position.set(WORLD_X - 50, 8.5, WORLD_Z);
        scene.add(museumRoof);

        // Entrance canopy
        var canopyGeo = new THREE.BoxGeometry(6, 0.5, 4);
        var canopy = new THREE.Mesh(canopyGeo, roofMat);
        canopy.position.set(WORLD_X - 38, 5, WORLD_Z);
        scene.add(canopy);

        // Thrust SSC land speed record car (long thin box inside)
        var carMat = new THREE.MeshLambertMaterial({ color: 0x3A3A5A });
        var carGeo = new THREE.BoxGeometry(10, 1.2, 2);
        var car = new THREE.Mesh(carGeo, carMat);
        car.position.set(WORLD_X - 50, 1.2, WORLD_Z - 2);
        scene.add(car);

        // Car nose cone
        var noseMat = new THREE.MeshLambertMaterial({ color: 0x2A2A4A });
        var noseGeo = new THREE.ConeGeometry(1, 3, 4);
        var nose = new THREE.Mesh(noseGeo, noseMat);
        nose.rotation.z = -Math.PI / 2;
        nose.position.set(WORLD_X - 44.5, 1.2, WORLD_Z - 2);
        scene.add(nose);

        // Car twin jet engine nacelles
        var nacelleGeo = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
        var nacelleMat = new THREE.MeshLambertMaterial({ color: 0x5A5A7A });

        var nacLeft = new THREE.Mesh(nacelleGeo, nacelleMat);
        nacLeft.rotation.z = Math.PI / 2;
        nacLeft.position.set(WORLD_X - 50, 1.8, WORLD_Z - 1);
        scene.add(nacLeft);

        var nacRight = new THREE.Mesh(nacelleGeo, nacelleMat);
        nacRight.rotation.z = Math.PI / 2;
        nacRight.position.set(WORLD_X - 50, 1.8, WORLD_Z - 3);
        scene.add(nacRight);

        // Museum signage panel
        var signMat = new THREE.MeshLambertMaterial({ color: 0xC0392B });
        var signGeo = new THREE.BoxGeometry(8, 2, 0.3);
        var sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(WORLD_X - 50, 7, WORLD_Z + 8.2);
        scene.add(sign);
    }

    function buildGroundPlane(scene) {
        // Ground surface for the cathedral precinct
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x6B8E5A });
        var groundGeo = new THREE.BoxGeometry(180, 0.4, 120);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(WORLD_X, -0.2, WORLD_Z);
        scene.add(ground);

        // Paving around old cathedral
        var paveMat = new THREE.MeshLambertMaterial({ color: 0xA09080 });
        var paveGeo = new THREE.BoxGeometry(50, 0.3, 30);
        var pave = new THREE.Mesh(paveGeo, paveMat);
        pave.position.set(WORLD_X, 0.15, WORLD_Z - 10);
        scene.add(pave);

        // Broadgate square paving
        var broadGeo = new THREE.BoxGeometry(40, 0.3, 30);
        var broad = new THREE.Mesh(broadGeo, paveMat);
        broad.position.set(WORLD_X + 35, 0.15, WORLD_Z);
        scene.add(broad);
    }

    function buildCrossMemorial(scene) {
        // Charred Cross — made from charred roof timbers, symbol of reconciliation
        var crossMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });

        var vertGeo = new THREE.BoxGeometry(0.5, 4, 0.5);
        var vert = new THREE.Mesh(vertGeo, crossMat);
        vert.position.set(WORLD_X, 6, WORLD_Z - 20);
        scene.add(vert);

        var horizGeo = new THREE.BoxGeometry(2.5, 0.5, 0.5);
        var horiz = new THREE.Mesh(horizGeo, crossMat);
        horiz.position.set(WORLD_X, 7, WORLD_Z - 20);
        scene.add(horiz);
    }

    function buildBoundaryWalls(scene) {
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });

        // North boundary wall
        var northWall = new THREE.BoxGeometry(180, 3, 1);
        var nw = new THREE.Mesh(northWall, wallMat);
        nw.position.set(WORLD_X, 1.5, WORLD_Z - 60);
        scene.add(nw);

        // South boundary wall
        var sw = new THREE.Mesh(new THREE.BoxGeometry(180, 3, 1), wallMat);
        sw.position.set(WORLD_X, 1.5, WORLD_Z + 60);
        scene.add(sw);

        // East boundary wall
        var eastWall = new THREE.BoxGeometry(1, 3, 120);
        var ew = new THREE.Mesh(eastWall, wallMat);
        ew.position.set(WORLD_X + 90, 1.5, WORLD_Z);
        scene.add(ew);

        // West boundary wall
        var ww = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 120), wallMat);
        ww.position.set(WORLD_X - 90, 1.5, WORLD_Z);
        scene.add(ww);
    }

    function build(scene) {
        buildGroundPlane(scene);
        buildBoundaryWalls(scene);
        buildOldCathedralShell(scene);
        buildOldSpire(scene);
        buildNewCathedral(scene);
        buildLadyGodiva(scene);
        buildWhittleArch(scene);
        buildTransportMuseum(scene);
        buildCrossMemorial(scene);
    }

    return {
        build: build
    };
}());
