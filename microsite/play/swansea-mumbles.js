window.SwanseaMumbles = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var X = 14560;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makeMesh(geo, color, flat) {
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color, flatShading: flat ? true : false }));
    }

    function buildLighthouse() {
        // Rocky headland base
        var rockGeo = new THREE.CylinderGeometry(18, 24, 8, 8);
        var rock = makeMesh(rockGeo, 0x8a8070, true);
        rock.position.set(X + 320, 4, -180);
        addObj(rock);

        // Lighthouse tower - white cylinder
        var towerGeo = new THREE.CylinderGeometry(4, 5, 32, 12);
        var tower = makeMesh(towerGeo, 0xf5f5f0, false);
        tower.position.set(X + 320, 28, -180);
        addObj(tower);

        // Lantern room - red
        var lanternGeo = new THREE.CylinderGeometry(5, 5, 6, 12);
        var lantern = makeMesh(lanternGeo, 0xcc2222, false);
        lantern.position.set(X + 320, 50, -180);
        addObj(lantern);

        // Lantern dome
        var domeGeo = new THREE.SphereGeometry(5, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
        var dome = makeMesh(domeGeo, 0x333333, false);
        dome.position.set(X + 320, 53, -180);
        addObj(dome);

        // Gallery rail band
        var galleryGeo = new THREE.CylinderGeometry(5.5, 5.5, 1.5, 12);
        var gallery = makeMesh(galleryGeo, 0x555555, false);
        gallery.position.set(X + 320, 47, -180);
        addObj(gallery);

        // Outer pile lighthouse on rocks
        var pileRockGeo = new THREE.BoxGeometry(20, 4, 16);
        var pileRock = makeMesh(pileRockGeo, 0x9a9080, true);
        pileRock.position.set(X + 360, 2, -200);
        addObj(pileRock);

        var pileLegA = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 12, 6), new THREE.MeshLambertMaterial({ color: 0x888888 }));
        pileLegA.position.set(X + 356, 8, -196);
        addObj(pileLegA);

        var pileLegB = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 12, 6), new THREE.MeshLambertMaterial({ color: 0x888888 }));
        pileLegB.position.set(X + 364, 8, -196);
        addObj(pileLegB);

        var pileLegC = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 12, 6), new THREE.MeshLambertMaterial({ color: 0x888888 }));
        pileLegC.position.set(X + 360, 8, -204);
        addObj(pileLegC);

        var pileTopGeo = new THREE.CylinderGeometry(3.5, 3.5, 10, 10);
        var pileTop = makeMesh(pileTopGeo, 0xf0ece0, false);
        pileTop.position.set(X + 360, 20, -200);
        addObj(pileTop);

        var pileLanternGeo = new THREE.CylinderGeometry(4, 4, 4, 10);
        var pileLantern = makeMesh(pileLanternGeo, 0xdd2222, false);
        pileLantern.position.set(X + 360, 30, -200);
        addObj(pileLantern);

        // RNLI lifeboat station
        var stationBaseGeo = new THREE.BoxGeometry(30, 6, 16);
        var stationBase = makeMesh(stationBaseGeo, 0xd0c8b8, false);
        stationBase.position.set(X + 290, 3, -160);
        addObj(stationBase);

        var stationRoofGeo = new THREE.BoxGeometry(32, 3, 18);
        var stationRoof = makeMesh(stationRoofGeo, 0x336699, false);
        stationRoof.position.set(X + 290, 7.5, -160);
        addObj(stationRoof);

        var stationDoorGeo = new THREE.BoxGeometry(10, 5, 1);
        var stationDoor = makeMesh(stationDoorGeo, 0xcc7722, false);
        stationDoor.position.set(X + 290, 2.5, -152.5);
        addObj(stationDoor);

        // Slipway
        var slipGeo = new THREE.BoxGeometry(8, 0.5, 20);
        var slip = makeMesh(slipGeo, 0xb0a898, false);
        slip.rotation.x = 0.15;
        slip.position.set(X + 290, -1, -145);
        addObj(slip);
    }

    function buildOystermouthCastle() {
        // Grassy earthworks mound
        var moundGeo = new THREE.CylinderGeometry(40, 55, 12, 10);
        var mound = makeMesh(moundGeo, 0x6a7a4a, true);
        mound.position.set(X + 80, 6, -80);
        addObj(mound);

        // Keep remains - main ruined tower
        var keepGeo = new THREE.BoxGeometry(18, 22, 16);
        var keep = makeMesh(keepGeo, 0x9a8c78, false);
        keep.position.set(X + 72, 23, -88);
        addObj(keep);

        // Keep broken top - partial wall
        var keepTopGeo = new THREE.BoxGeometry(18, 6, 4);
        var keepTop = makeMesh(keepTopGeo, 0x9a8c78, false);
        keepTop.position.set(X + 72, 38, -96);
        addObj(keepTop);

        // North tower ruin
        var towerNGeo = new THREE.CylinderGeometry(5, 6, 18, 8);
        var towerN = makeMesh(towerNGeo, 0x8a7c68, false);
        towerN.position.set(X + 58, 21, -72);
        addObj(towerN);

        // North tower broken top
        var towerNTopGeo = new THREE.CylinderGeometry(5, 5, 4, 8);
        var towerNTop = makeMesh(towerNTopGeo, 0x7a6c58, true);
        towerNTop.position.set(X + 58, 32, -72);
        addObj(towerNTop);

        // South tower ruin
        var towerSGeo = new THREE.CylinderGeometry(4.5, 5.5, 14, 8);
        var towerS = makeMesh(towerSGeo, 0x8a7c68, false);
        towerS.position.set(X + 90, 19, -100);
        addObj(towerS);

        // Gatehouse walls
        var gateLeftGeo = new THREE.BoxGeometry(5, 16, 8);
        var gateLeft = makeMesh(gateLeftGeo, 0x9a8c78, false);
        gateLeft.position.set(X + 65, 20, -76);
        addObj(gateLeft);

        var gateRightGeo = new THREE.BoxGeometry(5, 16, 8);
        var gateRight = makeMesh(gateRightGeo, 0x9a8c78, false);
        gateRight.position.set(X + 77, 20, -76);
        addObj(gateRight);

        var gateArchGeo = new THREE.BoxGeometry(12, 4, 8);
        var gateArch = makeMesh(gateArchGeo, 0x8a7c68, false);
        gateArch.position.set(X + 71, 30, -76);
        addObj(gateArch);

        // Connecting curtain walls
        var wallEGeo = new THREE.BoxGeometry(3, 10, 30);
        var wallE = makeMesh(wallEGeo, 0x8a7c68, false);
        wallE.position.set(X + 92, 17, -84);
        addObj(wallE);

        var wallWGeo = new THREE.BoxGeometry(3, 10, 28);
        var wallW = makeMesh(wallWGeo, 0x8a7c68, false);
        wallW.position.set(X + 56, 17, -84);
        addObj(wallW);

        // Great hall window tracery (decorative box on wall)
        var hallWallGeo = new THREE.BoxGeometry(14, 10, 2);
        var hallWall = makeMesh(hallWallGeo, 0x9a8c78, false);
        hallWall.position.set(X + 72, 22, -80);
        addObj(hallWall);

        var windowGeo = new THREE.BoxGeometry(4, 6, 1);
        var windowL = makeMesh(windowGeo, 0x4a5a3a, false);
        windowL.position.set(X + 68, 22, -79.5);
        addObj(windowL);

        var windowR = makeMesh(windowGeo, 0x4a5a3a, false);
        windowR.position.set(X + 76, 22, -79.5);
        addObj(windowR);
    }

    function buildSwanseaBay() {
        // Sandy beach - wide flat plane using box
        var beachGeo = new THREE.BoxGeometry(600, 0.5, 80);
        var beach = makeMesh(beachGeo, 0xe8d9a0, false);
        beach.position.set(X + 200, 0, 60);
        addObj(beach);

        // Sea / water
        var seaGeo = new THREE.BoxGeometry(600, 0.3, 120);
        var sea = makeMesh(seaGeo, 0x3a6080, false);
        sea.position.set(X + 200, 0.1, 150);
        addObj(sea);

        // Promenade strip
        var promoGeo = new THREE.BoxGeometry(600, 0.8, 12);
        var promo = makeMesh(promoGeo, 0xc8c0b0, false);
        promo.position.set(X + 200, 0.6, 16);
        addObj(promo);

        // Promenade railings as line segments
        var railPoints = [];
        for (var ri = 0; ri < 30; ri++) {
            railPoints.push(X + 0 + ri * 20, 2, 10);
            railPoints.push(X + 0 + ri * 20, 2, 12);
        }
        var railGeo = new THREE.BufferGeometry();
        var railVerts = new Float32Array(railPoints);
        railGeo.setAttribute('position', new THREE.BufferAttribute(railVerts, 3));
        var railLine = new THREE.LineSegments(railGeo, new THREE.MeshLambertMaterial({ color: 0x888888 }));
        scene.add(railLine);
        objects.push(railLine);

        // Wind Street pub quarter - renovated Victorian buildings
        var windStreetBuildings = [
            { x: X - 40, z: -10, w: 14, h: 14, d: 10, color: 0xc8a878 },
            { x: X - 20, z: -10, w: 12, h: 16, d: 10, color: 0xb89868 },
            { x: X - 4, z: -10, w: 10, h: 12, d: 10, color: 0xd0b088 },
            { x: X + 12, z: -10, w: 12, h: 18, d: 10, color: 0xc8a070 },
            { x: X + 28, z: -10, w: 11, h: 14, d: 10, color: 0xb89060 }
        ];
        for (var wi = 0; wi < windStreetBuildings.length; wi++) {
            var wb = windStreetBuildings[wi];
            var wbGeo = new THREE.BoxGeometry(wb.w, wb.h, wb.d);
            var wbMesh = makeMesh(wbGeo, wb.color, false);
            wbMesh.position.set(wb.x, wb.h / 2, wb.z);
            addObj(wbMesh);
            // Roof detail
            var roofGeo = new THREE.BoxGeometry(wb.w + 0.5, 1.5, wb.d + 0.5);
            var roof = makeMesh(roofGeo, 0x665544, false);
            roof.position.set(wb.x, wb.h + 0.75, wb.z);
            addObj(roof);
        }

        // SA1 waterfront development - modern blocks
        var sa1Buildings = [
            { x: X + 160, z: -20, w: 30, h: 20, d: 16, color: 0x889aaa },
            { x: X + 200, z: -20, w: 24, h: 28, d: 14, color: 0x7a8a9a },
            { x: X + 238, z: -20, w: 26, h: 16, d: 16, color: 0x8899a8 },
            { x: X + 276, z: -20, w: 20, h: 24, d: 14, color: 0x6a7a8a }
        ];
        for (var si = 0; si < sa1Buildings.length; si++) {
            var sb = sa1Buildings[si];
            var sbGeo = new THREE.BoxGeometry(sb.w, sb.h, sb.d);
            var sbMesh = makeMesh(sbGeo, sb.color, false);
            sbMesh.position.set(sb.x, sb.h / 2, sb.z);
            addObj(sbMesh);
        }

        // Marina pontoons
        var pontoonGeo = new THREE.BoxGeometry(60, 0.6, 6);
        var pontoon = makeMesh(pontoonGeo, 0xc0b8a8, false);
        pontoon.position.set(X + 200, 0.5, 130);
        addObj(pontoon);

        var pontoon2Geo = new THREE.BoxGeometry(6, 0.6, 40);
        var pontoon2 = makeMesh(pontoon2Geo, 0xc0b8a8, false);
        pontoon2.position.set(X + 220, 0.5, 114);
        addObj(pontoon2);
    }

    function buildDylanThomas() {
        // Cwmdonkin Park - grassy area
        var parkGeo = new THREE.BoxGeometry(80, 0.4, 60);
        var park = makeMesh(parkGeo, 0x558844, false);
        park.position.set(X - 180, 0.3, -30);
        addObj(park);

        // Park perimeter path
        var pathGeo = new THREE.BoxGeometry(84, 0.5, 2);
        var pathN = makeMesh(pathGeo, 0xc0b8a0, false);
        pathN.position.set(X - 180, 0.4, -60);
        addObj(pathN);

        var pathSGeo = new THREE.BoxGeometry(84, 0.5, 2);
        var pathS = makeMesh(pathSGeo, 0xc0b8a0, false);
        pathS.position.set(X - 180, 0.4, 0);
        addObj(pathS);

        // Dylan Thomas memorial - large boulder with poem
        var boulderGeo = new THREE.SphereGeometry(3.5, 8, 6);
        var boulder = makeMesh(boulderGeo, 0x7a7060, true);
        boulder.scale.y = 0.65;
        boulder.position.set(X - 180, 2.5, -30);
        addObj(boulder);

        // Inscription plaque on boulder
        var plaqueGeo = new THREE.BoxGeometry(2.5, 1.8, 0.3);
        var plaque = makeMesh(plaqueGeo, 0x888060, false);
        plaque.position.set(X - 180, 3.2, -26.8);
        addObj(plaque);

        // Bench near memorial
        var benchSeatGeo = new THREE.BoxGeometry(4, 0.3, 1);
        var benchSeat = makeMesh(benchSeatGeo, 0x886644, false);
        benchSeat.position.set(X - 172, 1.2, -28);
        addObj(benchSeat);

        var benchLegAGeo = new THREE.BoxGeometry(0.3, 1.2, 1);
        var benchLegA = makeMesh(benchLegAGeo, 0x776033, false);
        benchLegA.position.set(X - 174.5, 0.6, -28);
        addObj(benchLegA);

        var benchLegBGeo = new THREE.BoxGeometry(0.3, 1.2, 1);
        var benchLegB = makeMesh(benchLegBGeo, 0x776033, false);
        benchLegB.position.set(X - 169.5, 0.6, -28);
        addObj(benchLegB);

        // No.5 Cwmdonkin Drive - terraced house
        var houseGeo = new THREE.BoxGeometry(8, 12, 10);
        var house = makeMesh(houseGeo, 0xd0c0a0, false);
        house.position.set(X - 220, 6, -20);
        addObj(house);

        var houseRoofGeo = new THREE.CylinderGeometry(0.1, 8, 8, 4);
        var houseRoof = makeMesh(houseRoofGeo, 0x884433, false);
        houseRoof.position.set(X - 220, 16, -20);
        houseRoof.rotation.y = Math.PI / 4;
        addObj(houseRoof);

        var houseDoorGeo = new THREE.BoxGeometry(2, 4, 0.5);
        var houseDoor = makeMesh(houseDoorGeo, 0x553322, false);
        houseDoor.position.set(X - 220, 2, -15.2);
        addObj(houseDoor);

        // Dylan Thomas Centre - larger building
        var centreGeo = new THREE.BoxGeometry(40, 12, 22);
        var centre = makeMesh(centreGeo, 0xd8cebb, false);
        centre.position.set(X - 100, 6, -40);
        addObj(centre);

        var centreRoofGeo = new THREE.BoxGeometry(42, 1.5, 24);
        var centreRoof = makeMesh(centreRoofGeo, 0x665544, false);
        centreRoof.position.set(X - 100, 12.75, -40);
        addObj(centreRoof);

        // Centre entrance portico
        var porticoGeo = new THREE.BoxGeometry(10, 10, 4);
        var portico = makeMesh(porticoGeo, 0xc8bfae, false);
        portico.position.set(X - 100, 5, -29.5);
        addObj(portico);

        var porticoRoofGeo = new THREE.BoxGeometry(12, 1, 5);
        var porticoRoof = makeMesh(porticoRoofGeo, 0x887766, false);
        porticoRoof.position.set(X - 100, 10.5, -29.5);
        addObj(porticoRoof);

        // Plaque sign on centre
        var signGeo = new THREE.BoxGeometry(8, 2, 0.3);
        var sign = makeMesh(signGeo, 0x996633, false);
        sign.position.set(X - 100, 8, -29.0);
        addObj(sign);
    }

    function buildSwanseaMarket() {
        // Market hall base - large Victorian structure
        var hallGeo = new THREE.BoxGeometry(80, 10, 50);
        var hall = makeMesh(hallGeo, 0xd8c8a8, false);
        hall.position.set(X - 60, 5, 30);
        addObj(hall);

        // Iron roof structure - central ridge
        var ridgeGeo = new THREE.BoxGeometry(82, 2, 4);
        var ridge = makeMesh(ridgeGeo, 0x666655, false);
        ridge.position.set(X - 60, 11, 30);
        addObj(ridge);

        // Roof panels as sloped boxes
        var roofLGeo = new THREE.BoxGeometry(82, 1, 25);
        var roofL = makeMesh(roofLGeo, 0x778888, false);
        roofL.rotation.z = 0.22;
        roofL.position.set(X - 60, 13, 17);
        addObj(roofL);

        var roofRGeo = new THREE.BoxGeometry(82, 1, 25);
        var roofR = makeMesh(roofRGeo, 0x778888, false);
        roofR.rotation.z = -0.22;
        roofR.position.set(X - 60, 13, 43);
        addObj(roofR);

        // Skylight ridge row
        for (var ski = 0; ski < 6; ski++) {
            var skylightGeo = new THREE.BoxGeometry(6, 2.5, 3);
            var skylight = makeMesh(skylightGeo, 0xaacccc, false);
            skylight.position.set(X - 100 + ski * 16, 12.5, 30);
            addObj(skylight);
        }

        // Iron support columns inside
        for (var ci = 0; ci < 5; ci++) {
            var colGeo = new THREE.CylinderGeometry(0.5, 0.5, 10, 8);
            var colL = makeMesh(colGeo, 0x556655, false);
            colL.position.set(X - 80 + ci * 20, 5, 12);
            addObj(colL);

            var colR = makeMesh(colGeo, 0x556655, false);
            colR.position.set(X - 80 + ci * 20, 5, 48);
            addObj(colR);
        }

        // Entrance arches - front facade
        var facadeGeo = new THREE.BoxGeometry(80, 12, 2);
        var facade = makeMesh(facadeGeo, 0xc8b898, false);
        facade.position.set(X - 60, 6, 5.5);
        addObj(facade);

        var archAGeo = new THREE.BoxGeometry(10, 10, 2.5);
        var archA = makeMesh(archAGeo, 0xb8a888, false);
        archA.position.set(X - 80, 5, 5.5);
        addObj(archA);

        var archBGeo = new THREE.BoxGeometry(10, 10, 2.5);
        var archB = makeMesh(archBGeo, 0xb8a888, false);
        archB.position.set(X - 60, 5, 5.5);
        addObj(archB);

        var archCGeo = new THREE.BoxGeometry(10, 10, 2.5);
        var archC = makeMesh(archCGeo, 0xb8a888, false);
        archC.position.set(X - 40, 5, 5.5);
        addObj(archC);

        // Market sign
        var marketSignGeo = new THREE.BoxGeometry(40, 4, 1);
        var marketSign = makeMesh(marketSignGeo, 0x996633, false);
        marketSign.position.set(X - 60, 14, 5.5);
        addObj(marketSign);

        // Rear facade
        var rearGeo = new THREE.BoxGeometry(80, 12, 2);
        var rear = makeMesh(rearGeo, 0xc8b898, false);
        rear.position.set(X - 60, 6, 54.5);
        addObj(rear);

        // Stalls inside (simplified as low boxes)
        for (var sti = 0; sti < 8; sti++) {
            var stallGeo = new THREE.BoxGeometry(8, 2, 4);
            var stall = makeMesh(stallGeo, 0xaa9977, false);
            stall.position.set(X - 96 + sti * 10, 1, 20);
            addObj(stall);

            var stall2 = makeMesh(stallGeo, 0x998866);
            stall2.position.set(X - 96 + sti * 10, 1, 40);
            addObj(stall2);
        }
    }

    function buildGowerPeninsula() {
        // Gower peninsula ground mass
        var gowerBaseGeo = new THREE.BoxGeometry(300, 4, 200);
        var gowerBase = makeMesh(gowerBaseGeo, 0x6a8050, true);
        gowerBase.position.set(X - 500, 2, -200);
        addObj(gowerBase);

        // Rhossili Bay - dramatic curved beach
        var rhossiliBeachGeo = new THREE.BoxGeometry(120, 0.5, 60);
        var rhossiliBeach = makeMesh(rhossiliBeachGeo, 0xe8d898, false);
        rhossiliBeach.position.set(X - 520, 0.3, -260);
        addObj(rhossiliBeach);

        // Bay sea
        var baySeaGeo = new THREE.BoxGeometry(120, 0.3, 80);
        var baySea = makeMesh(baySeaGeo, 0x3a608a, false);
        baySea.position.set(X - 520, 0.2, -330);
        addObj(baySea);

        // Coastal cliffs along bay
        var cliffAGeo = new THREE.BoxGeometry(20, 30, 200);
        var cliffA = makeMesh(cliffAGeo, 0x9a8870, true);
        cliffA.position.set(X - 590, 15, -230);
        addObj(cliffA);

        // Worm's Head - long narrow headland
        var wormBodyGeo = new THREE.BoxGeometry(120, 6, 14);
        var wormBody = makeMesh(wormBodyGeo, 0x7a8060, true);
        wormBody.position.set(X - 630, 3, -300);
        addObj(wormBody);

        // Worm's Head tip - rises at end
        var wormHeadGeo = new THREE.SphereGeometry(10, 8, 6);
        var wormHead = makeMesh(wormHeadGeo, 0x8a8060, true);
        wormHead.scale.y = 0.5;
        wormHead.scale.z = 0.8;
        wormHead.position.set(X - 700, 5, -300);
        addObj(wormHead);

        // Causeway to Worm's Head
        var causewayGeo = new THREE.BoxGeometry(30, 1, 8);
        var causeway = makeMesh(causewayGeo, 0x9a8060, false);
        causeway.position.set(X - 598, 1, -300);
        addObj(causeway);

        // Limestone cliffs
        var cliffBGeo = new THREE.BoxGeometry(15, 25, 80);
        var cliffB = makeMesh(cliffBGeo, 0xa09070, true);
        cliffB.position.set(X - 470, 12, -240);
        addObj(cliffB);

        var cliffCGeo = new THREE.BoxGeometry(12, 20, 60);
        var cliffC = makeMesh(cliffCGeo, 0x958a6a, true);
        cliffC.position.set(X - 455, 10, -280);
        addObj(cliffC);

        // Three Cliffs Bay area
        var threeCliffBeachGeo = new THREE.BoxGeometry(70, 0.5, 40);
        var threeCliffBeach = makeMesh(threeCliffBeachGeo, 0xe0d090, false);
        threeCliffBeach.position.set(X - 420, 0.3, -260);
        addObj(threeCliffBeach);

        // Three distinctive cliff stacks
        var cliff1Geo = new THREE.BoxGeometry(8, 22, 6);
        var cliff1 = makeMesh(cliff1Geo, 0xa09060, true);
        cliff1.position.set(X - 410, 11, -248);
        addObj(cliff1);

        var cliff2Geo = new THREE.BoxGeometry(7, 26, 5);
        var cliff2 = makeMesh(cliff2Geo, 0x908a58, true);
        cliff2.position.set(X - 422, 13, -244);
        addObj(cliff2);

        var cliff3Geo = new THREE.BoxGeometry(9, 20, 7);
        var cliff3 = makeMesh(cliff3Geo, 0xaa9868, true);
        cliff3.position.set(X - 434, 10, -250);
        addObj(cliff3);

        // Burry Holms tidal island at north of Rhossili
        var burryGeo = new THREE.SphereGeometry(15, 8, 6);
        var burry = makeMesh(burryGeo, 0x8a8860, true);
        burry.scale.y = 0.35;
        burry.position.set(X - 480, 4, -290);
        addObj(burry);

        // Gower village - simple cluster
        var villageGeo = new THREE.BoxGeometry(12, 8, 10);
        var village = makeMesh(villageGeo, 0xd0c0a0, false);
        village.position.set(X - 480, 4, -180);
        addObj(village);

        var villageRoofGeo = new THREE.CylinderGeometry(0.1, 9, 6, 4);
        var villageRoof = makeMesh(villageRoofGeo, 0x884433, false);
        villageRoof.position.set(X - 480, 11, -180);
        villageRoof.rotation.y = Math.PI / 4;
        addObj(villageRoof);
    }

    function build() {
        buildLighthouse();
        buildOystermouthCastle();
        buildSwanseaBay();
        buildDylanThomas();
        buildSwanseaMarket();
        buildGowerPeninsula();
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
