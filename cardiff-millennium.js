window.CardiffMillennium = (function() {
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

    function build() {
        buildPrincipalityStadium();
        buildCardiffCastle();
        buildButePark();
        buildNationalMuseum();
        buildCityHall();
        buildRoaldDahlPlass();
    }

    function buildPrincipalityStadium() {
        var ox = 14400;
        var oz = 0;

        // Pitch (green surface)
        var pitch = makeMesh(new THREE.BoxGeometry(120, 1, 80), 0x2e7d32);
        pitch.position.set(ox, 0.5, oz);
        addMesh(pitch);

        // Main stadium bowl base
        var bowl = makeMesh(new THREE.BoxGeometry(160, 18, 120), 0x78909c);
        bowl.position.set(ox, 9, oz);
        addMesh(bowl);

        // Inner pitch surround stands — north stand
        var northStand = makeMesh(new THREE.BoxGeometry(160, 22, 20), 0x607d8b);
        northStand.position.set(ox, 11, oz - 60);
        addMesh(northStand);

        // South stand
        var southStand = makeMesh(new THREE.BoxGeometry(160, 22, 20), 0x607d8b);
        southStand.position.set(ox, 11, oz + 60);
        addMesh(southStand);

        // East stand
        var eastStand = makeMesh(new THREE.BoxGeometry(20, 22, 120), 0x607d8b);
        eastStand.position.set(ox + 70, 11, oz);
        addMesh(eastStand);

        // West stand
        var westStand = makeMesh(new THREE.BoxGeometry(20, 22, 120), 0x607d8b);
        westStand.position.set(ox - 70, 11, oz);
        addMesh(westStand);

        // Upper tier north
        var upperNorth = makeMesh(new THREE.BoxGeometry(150, 14, 16), 0x546e7a);
        upperNorth.position.set(ox, 29, oz - 58);
        addMesh(upperNorth);

        // Upper tier south
        var upperSouth = makeMesh(new THREE.BoxGeometry(150, 14, 16), 0x546e7a);
        upperSouth.position.set(ox, 29, oz + 58);
        addMesh(upperSouth);

        // Upper tier east
        var upperEast = makeMesh(new THREE.BoxGeometry(16, 14, 110), 0x546e7a);
        upperEast.position.set(ox + 68, 29, oz);
        addMesh(upperEast);

        // Upper tier west
        var upperWest = makeMesh(new THREE.BoxGeometry(16, 14, 110), 0x546e7a);
        upperWest.position.set(ox - 68, 29, oz);
        addMesh(upperWest);

        // Four corner towers
        var towerPositions = [
            [ox - 80, oz - 65],
            [ox + 80, oz - 65],
            [ox - 80, oz + 65],
            [ox + 80, oz + 65]
        ];
        for (var i = 0; i < towerPositions.length; i++) {
            var tp = towerPositions[i];
            var tower = makeMesh(new THREE.BoxGeometry(14, 60, 14), 0x455a64);
            tower.position.set(tp[0], 30, tp[1]);
            addMesh(tower);

            // Tower top cap
            var towerCap = makeMesh(new THREE.BoxGeometry(16, 4, 16), 0x37474f);
            towerCap.position.set(tp[0], 62, tp[1]);
            addMesh(towerCap);

            // Crane / mast on each tower
            var mast = makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 20, 6), 0x90a4ae);
            mast.position.set(tp[0], 74, tp[1]);
            addMesh(mast);
        }

        // Retractable roof panels — two halves that slide over pitch
        var roofLeft = makeMesh(new THREE.BoxGeometry(72, 3, 100), 0xb0bec5);
        roofLeft.position.set(ox - 36, 48, oz);
        addMesh(roofLeft);

        var roofRight = makeMesh(new THREE.BoxGeometry(72, 3, 100), 0xb0bec5);
        roofRight.position.set(ox + 36, 48, oz);
        addMesh(roofRight);

        // Roof support truss (north)
        var trussNorth = makeMesh(new THREE.BoxGeometry(150, 2, 4), 0x78909c);
        trussNorth.position.set(ox, 50, oz - 50);
        addMesh(trussNorth);

        // Roof support truss (south)
        var trussSouth = makeMesh(new THREE.BoxGeometry(150, 2, 4), 0x78909c);
        trussSouth.position.set(ox, 50, oz + 50);
        addMesh(trussSouth);

        // Steel framework verticals (exterior)
        var framePosX = [-75, -50, -25, 0, 25, 50, 75];
        for (var fi = 0; fi < framePosX.length; fi++) {
            var frameN = makeMesh(new THREE.BoxGeometry(2, 50, 2), 0x90a4ae);
            frameN.position.set(ox + framePosX[fi], 25, oz - 72);
            addMesh(frameN);

            var frameS = makeMesh(new THREE.BoxGeometry(2, 50, 2), 0x90a4ae);
            frameS.position.set(ox + framePosX[fi], 25, oz + 72);
            addMesh(frameS);
        }

        // Scoreboard east
        var scoreboard = makeMesh(new THREE.BoxGeometry(20, 10, 2), 0x212121);
        scoreboard.position.set(ox + 80, 30, oz);
        addMesh(scoreboard);
    }

    function buildCardiffCastle() {
        var ox = 14300;
        var oz = 220;

        // Castle grounds base
        var grounds = makeMesh(new THREE.BoxGeometry(120, 1, 100), 0x8d6e63);
        grounds.position.set(ox, 0.5, oz);
        addMesh(grounds);

        // Norman motte (earthen mound)
        var motte = makeMesh(new THREE.CylinderGeometry(20, 30, 18, 8), 0x6d4c41);
        motte.position.set(ox - 40, 9, oz - 20);
        addMesh(motte);

        // Shell keep on motte
        var keep = makeMesh(new THREE.CylinderGeometry(16, 16, 10, 8), 0x9e9e9e);
        keep.position.set(ox - 40, 22, oz - 20);
        addMesh(keep);

        var keepInner = makeMesh(new THREE.CylinderGeometry(12, 12, 12, 8), 0x757575);
        keepInner.position.set(ox - 40, 25, oz - 20);
        addMesh(keepInner);

        // Clock tower — black and white (animal wall side)
        var clockBase = makeMesh(new THREE.BoxGeometry(10, 40, 10), 0xeeeeee);
        clockBase.position.set(ox + 10, 20, oz + 40);
        addMesh(clockBase);

        var clockBlackBand = makeMesh(new THREE.BoxGeometry(11, 4, 11), 0x212121);
        clockBlackBand.position.set(ox + 10, 36, oz + 40);
        addMesh(clockBlackBand);

        var clockFace = makeMesh(new THREE.BoxGeometry(10, 6, 10), 0xfafafa);
        clockFace.position.set(ox + 10, 42, oz + 40);
        addMesh(clockFace);

        var clockSpire = makeMesh(new THREE.ConeGeometry(6, 14, 4), 0x37474f);
        clockSpire.position.set(ox + 10, 52, oz + 40);
        addMesh(clockSpire);

        // Victorian Gothic apartments block
        var apartments = makeMesh(new THREE.BoxGeometry(40, 24, 20), 0xbcaaa4);
        apartments.position.set(ox + 20, 12, oz);
        addMesh(apartments);

        // Apartments turrets
        var turretPositions = [
            [ox + 2, oz - 10],
            [ox + 38, oz - 10],
            [ox + 2, oz + 10],
            [ox + 38, oz + 10]
        ];
        for (var ti = 0; ti < turretPositions.length; ti++) {
            var tp2 = turretPositions[ti];
            var turret = makeMesh(new THREE.CylinderGeometry(3, 3, 30, 6), 0xa1887f);
            turret.position.set(tp2[0], 15, tp2[1]);
            addMesh(turret);
            var turretCap = makeMesh(new THREE.ConeGeometry(4, 8, 6), 0x6d4c41);
            turretCap.position.set(tp2[0], 33, tp2[1]);
            addMesh(turretCap);
        }

        // Castle walls
        var wallN = makeMesh(new THREE.BoxGeometry(120, 12, 4), 0x9e9e9e);
        wallN.position.set(ox, 6, oz - 50);
        addMesh(wallN);

        var wallS = makeMesh(new THREE.BoxGeometry(120, 12, 4), 0x9e9e9e);
        wallS.position.set(ox, 6, oz + 50);
        addMesh(wallS);

        var wallE = makeMesh(new THREE.BoxGeometry(4, 12, 100), 0x9e9e9e);
        wallE.position.set(ox + 60, 6, oz);
        addMesh(wallE);

        var wallW = makeMesh(new THREE.BoxGeometry(4, 12, 100), 0x9e9e9e);
        wallW.position.set(ox - 60, 6, oz);
        addMesh(wallW);

        // Corner bastions
        var bastionCorners = [
            [ox - 60, oz - 50],
            [ox + 60, oz - 50],
            [ox - 60, oz + 50],
            [ox + 60, oz + 50]
        ];
        for (var bi = 0; bi < bastionCorners.length; bi++) {
            var bc = bastionCorners[bi];
            var bastion = makeMesh(new THREE.CylinderGeometry(6, 6, 16, 8), 0x757575);
            bastion.position.set(bc[0], 8, bc[1]);
            addMesh(bastion);
        }

        // Animal wall (low decorative wall)
        var animalWall = makeMesh(new THREE.BoxGeometry(30, 3, 2), 0xbdbdbd);
        animalWall.position.set(ox + 25, 1.5, oz + 52);
        addMesh(animalWall);
    }

    function buildButePark() {
        var ox = 14220;
        var oz = 80;

        // Park ground
        var parkGround = makeMesh(new THREE.BoxGeometry(180, 0.5, 160), 0x388e3c);
        parkGround.position.set(ox, 0.25, oz);
        addMesh(parkGround);

        // River Taff — winding through park (several blue segments)
        var riverSegs = [
            [ox - 60, oz - 60, 10, 60],
            [ox - 30, oz - 20, 60, 10],
            [ox + 10, oz + 30, 10, 80]
        ];
        for (var ri = 0; ri < riverSegs.length; ri++) {
            var rs = riverSegs[ri];
            var river = makeMesh(new THREE.BoxGeometry(rs[2], 0.6, rs[3]), 0x1565c0);
            river.position.set(rs[0], 0.3, rs[1]);
            addMesh(river);
        }

        // Tree clusters — trunk + foliage
        var treePositions = [
            [ox - 70, oz - 50],
            [ox - 55, oz - 40],
            [ox - 80, oz - 30],
            [ox - 65, oz + 20],
            [ox - 50, oz + 40],
            [ox - 75, oz + 55],
            [ox - 40, oz - 70],
            [ox + 60, oz - 40],
            [ox + 70, oz + 10],
            [ox + 55, oz + 50],
            [ox + 80, oz + 30],
            [ox - 20, oz + 70],
            [ox + 10, oz - 60],
            [ox + 30, oz + 70],
            [ox - 30, oz - 55],
            [ox + 45, oz - 65],
            [ox - 85, oz + 10],
            [ox + 85, oz - 20]
        ];
        for (var tri = 0; tri < treePositions.length; tri++) {
            var tp3 = treePositions[tri];
            var trunk = makeMesh(new THREE.CylinderGeometry(0.8, 1, 6, 6), 0x5d4037);
            trunk.position.set(tp3[0], 3, tp3[1]);
            addMesh(trunk);
            var foliage = makeMesh(new THREE.SphereGeometry(5, 7, 5), 0x2e7d32);
            foliage.position.set(tp3[0], 10, tp3[1]);
            addMesh(foliage);
        }

        // Bandstand — cylinder base with cone roof
        var bandBase = makeMesh(new THREE.CylinderGeometry(8, 8, 3, 12), 0xf5f5f5);
        bandBase.position.set(ox + 20, 1.5, oz - 20);
        addMesh(bandBase);

        var bandRoof = makeMesh(new THREE.ConeGeometry(10, 8, 12), 0x1a237e);
        bandRoof.position.set(ox + 20, 8, oz - 20);
        addMesh(bandRoof);

        // Bandstand columns
        for (var ci = 0; ci < 8; ci++) {
            var angle = (ci / 8) * Math.PI * 2;
            var col = makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 6), 0xe0e0e0);
            col.position.set(ox + 20 + Math.cos(angle) * 7.5, 3.5, oz - 20 + Math.sin(angle) * 7.5);
            addMesh(col);
        }

        // Paths (light gravel)
        var pathMain = makeMesh(new THREE.BoxGeometry(3, 0.7, 140), 0xd7ccc8);
        pathMain.position.set(ox, 0.35, oz);
        addMesh(pathMain);

        var pathCross = makeMesh(new THREE.BoxGeometry(160, 0.7, 3), 0xd7ccc8);
        pathCross.position.set(ox, 0.35, oz);
        addMesh(pathCross);

        // Footbridge over Taff
        var bridge = makeMesh(new THREE.BoxGeometry(14, 1.5, 4), 0x795548);
        bridge.position.set(ox - 30, 1.5, oz - 20);
        addMesh(bridge);
    }

    function buildNationalMuseum() {
        var ox = 14500;
        var oz = 300;

        // Museum main building
        var museumBody = makeMesh(new THREE.BoxGeometry(80, 20, 60), 0xeceff1);
        museumBody.position.set(ox, 10, oz);
        addMesh(museumBody);

        // East wing
        var eastWing = makeMesh(new THREE.BoxGeometry(30, 16, 40), 0xe8eaf6);
        eastWing.position.set(ox + 55, 8, oz);
        addMesh(eastWing);

        // West wing
        var westWing = makeMesh(new THREE.BoxGeometry(30, 16, 40), 0xe8eaf6);
        westWing.position.set(ox - 55, 8, oz);
        addMesh(westWing);

        // Central dome
        var domeDrum = makeMesh(new THREE.CylinderGeometry(16, 16, 8, 16), 0xfafafa);
        domeDrum.position.set(ox, 24, oz);
        addMesh(domeDrum);

        var domeTop = makeMesh(new THREE.SphereGeometry(16, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xfafafa);
        domeTop.position.set(ox, 28, oz);
        addMesh(domeTop);

        // Dome lantern
        var lantern = makeMesh(new THREE.CylinderGeometry(3, 3, 4, 8), 0xe0e0e0);
        lantern.position.set(ox, 44, oz);
        addMesh(lantern);

        // Portico columns (front)
        var porticoBase = makeMesh(new THREE.BoxGeometry(50, 2, 10), 0xf5f5f5);
        porticoBase.position.set(ox, 20, oz - 35);
        addMesh(porticoBase);

        for (var pci = 0; pci < 6; pci++) {
            var pcol = makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 18, 8), 0xfafafa);
            pcol.position.set(ox - 25 + pci * 10, 20, oz - 35);
            addMesh(pcol);
        }

        // Portico pediment
        var pediment = makeMesh(new THREE.BoxGeometry(52, 1, 10), 0xeceff1);
        pediment.position.set(ox, 38, oz - 35);
        addMesh(pediment);

        var pedimentTriangle = makeMesh(new THREE.BoxGeometry(52, 6, 2), 0xe8eaf6);
        pedimentTriangle.position.set(ox, 42, oz - 35);
        addMesh(pedimentTriangle);

        // Steps
        var steps = makeMesh(new THREE.BoxGeometry(50, 3, 8), 0xeceff1);
        steps.position.set(ox, 1.5, oz - 42);
        addMesh(steps);

        // Museum forecourt
        var forecourt = makeMesh(new THREE.BoxGeometry(90, 0.5, 30), 0xbdbdbd);
        forecourt.position.set(ox, 0.25, oz - 55);
        addMesh(forecourt);
    }

    function buildCityHall() {
        var ox = 14560;
        var oz = 200;

        // Main building body
        var hallBody = makeMesh(new THREE.BoxGeometry(70, 22, 45), 0xf5f5f5);
        hallBody.position.set(ox, 11, oz);
        addMesh(hallBody);

        // Dome drum
        var hallDomeDrum = makeMesh(new THREE.CylinderGeometry(12, 12, 6, 16), 0xfafafa);
        hallDomeDrum.position.set(ox, 25, oz);
        addMesh(hallDomeDrum);

        // Dome
        var hallDome = makeMesh(new THREE.SphereGeometry(12, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xfafafa);
        hallDome.position.set(ox, 28, oz);
        addMesh(hallDome);

        // Dome lantern spire
        var domeSpire = makeMesh(new THREE.CylinderGeometry(0.5, 1, 8, 6), 0xbdbdbd);
        domeSpire.position.set(ox, 42, oz);
        addMesh(domeSpire);

        // Dragon weather vane (sphere on spike)
        var dragonSphere = makeMesh(new THREE.SphereGeometry(1.5, 8, 6), 0xffd600);
        dragonSphere.position.set(ox, 51, oz);
        addMesh(dragonSphere);

        var dragonSpike = makeMesh(new THREE.CylinderGeometry(0.2, 0.4, 3, 4), 0xffd600);
        dragonSpike.position.set(ox, 53.5, oz);
        addMesh(dragonSpike);

        // Clock tower (side)
        var clockTower = makeMesh(new THREE.BoxGeometry(10, 35, 10), 0xeeeeee);
        clockTower.position.set(ox + 40, 17.5, oz);
        addMesh(clockTower);

        var clockTowerTop = makeMesh(new THREE.BoxGeometry(12, 4, 12), 0xe0e0e0);
        clockTowerTop.position.set(ox + 40, 37, oz);
        addMesh(clockTowerTop);

        var clockTowerSpire = makeMesh(new THREE.ConeGeometry(7, 12, 4), 0xbdbdbd);
        clockTowerSpire.position.set(ox + 40, 46, oz);
        addMesh(clockTowerSpire);

        // Portico columns (front)
        var hallPorticoBase = makeMesh(new THREE.BoxGeometry(50, 2, 8), 0xf5f5f5);
        hallPorticoBase.position.set(ox - 5, 22, oz - 26);
        addMesh(hallPorticoBase);

        for (var hci = 0; hci < 5; hci++) {
            var hcol = makeMesh(new THREE.CylinderGeometry(1, 1.3, 20, 8), 0xfafafa);
            hcol.position.set(ox - 20 + hci * 10, 22, oz - 26);
            addMesh(hcol);
        }

        // Pediment
        var hallPediment = makeMesh(new THREE.BoxGeometry(50, 5, 2), 0xeceff1);
        hallPediment.position.set(ox - 5, 34, oz - 26);
        addMesh(hallPediment);

        // Wings
        var leftWing = makeMesh(new THREE.BoxGeometry(20, 18, 40), 0xf0f0f0);
        leftWing.position.set(ox - 45, 9, oz);
        addMesh(leftWing);

        var rightWingBlock = makeMesh(new THREE.BoxGeometry(20, 18, 40), 0xf0f0f0);
        rightWingBlock.position.set(ox + 45, 9, oz);
        addMesh(rightWingBlock);

        // Council chamber civic centre pavement
        var civicPave = makeMesh(new THREE.BoxGeometry(100, 0.5, 60), 0xd0d0d0);
        civicPave.position.set(ox, 0.25, oz);
        addMesh(civicPave);
    }

    function buildRoaldDahlPlass() {
        var ox = 14600;
        var oz = -150;

        // Bay-side oval plaza paving
        var plazzaBase = makeMesh(new THREE.CylinderGeometry(70, 70, 1, 24), 0xb0bec5);
        plazzaBase.position.set(ox, 0.5, oz);
        addMesh(plazzaBase);

        // Inner oval basin
        var basinOuter = makeMesh(new THREE.CylinderGeometry(28, 28, 2, 24), 0x1565c0);
        basinOuter.position.set(ox, 0.8, oz);
        addMesh(basinOuter);

        var basinWater = makeMesh(new THREE.CylinderGeometry(25, 25, 1, 24), 0x1976d2);
        basinWater.position.set(ox, 1.2, oz);
        addMesh(basinWater);

        // Water tower feature (The Oval Basin tower)
        var waterTower = makeMesh(new THREE.CylinderGeometry(4, 5, 24, 12), 0x78909c);
        waterTower.position.set(ox, 12, oz);
        addMesh(waterTower);

        var waterTowerTop = makeMesh(new THREE.CylinderGeometry(6, 4, 4, 12), 0x546e7a);
        waterTowerTop.position.set(ox, 26, oz);
        addMesh(waterTowerTop);

        // Millennium sculpture (abstract vertical feature)
        var sculpturePedestal = makeMesh(new THREE.BoxGeometry(4, 3, 4), 0x9e9e9e);
        sculpturePedestal.position.set(ox + 35, 1.5, oz - 30);
        addMesh(sculpturePedestal);

        var sculptureShaft = makeMesh(new THREE.BoxGeometry(2, 18, 2), 0x757575);
        sculptureShaft.position.set(ox + 35, 12, oz - 30);
        addMesh(sculptureShaft);

        var sculptureTop = makeMesh(new THREE.SphereGeometry(3, 8, 6), 0xb0bec5);
        sculptureTop.position.set(ox + 35, 23, oz - 30);
        addMesh(sculptureTop);

        // Plass radial paths
        var pathAngles = [0, 60, 120, 180, 240, 300];
        for (var pai = 0; pai < pathAngles.length; pai++) {
            var pa = pathAngles[pai] * Math.PI / 180;
            var pathSeg = makeMesh(new THREE.BoxGeometry(2, 0.8, 60), 0xcfd8dc);
            pathSeg.rotation.y = pa;
            pathSeg.position.set(ox + Math.cos(pa) * 30, 0.6, oz + Math.sin(pa) * 30);
            addMesh(pathSeg);
        }

        // Waterfront railing pillars
        for (var rpi = 0; rpi < 16; rpi++) {
            var rpAngle = (rpi / 16) * Math.PI * 2;
            var railPillar = makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 3, 6), 0x78909c);
            railPillar.position.set(ox + Math.cos(rpAngle) * 68, 1.5, oz + Math.sin(rpAngle) * 68);
            addMesh(railPillar);
        }

        // Bay water (background)
        var bayWater = makeMesh(new THREE.BoxGeometry(200, 0.5, 80), 0x0d47a1);
        bayWater.position.set(ox, 0, oz - 90);
        addMesh(bayWater);
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
