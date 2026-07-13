window.CrawleyGatwick = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 13120;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeLines(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var ls = new THREE.LineSegments(geo, mat);
        scene.add(ls);
        objects.push(ls);
        return ls;
    }

    function buildRunway() {
        // Main runway - long flat strip
        var geo = new THREE.BoxGeometry(2200, 1, 60);
        var mesh = makeMesh(geo, 0x333333);
        mesh.position.set(X_OFFSET, 0.5, -200);

        // Runway markings - centre line segments
        var i;
        for (i = 0; i < 20; i++) {
            var markGeo = new THREE.BoxGeometry(40, 1, 4);
            var mark = makeMesh(markGeo, 0xffffff);
            mark.position.set(X_OFFSET - 900 + i * 95, 1, -200);
        }

        // Taxiway
        var taxiGeo = new THREE.BoxGeometry(2200, 1, 20);
        var taxi = makeMesh(taxiGeo, 0x444444);
        taxi.position.set(X_OFFSET, 0.5, -150);

        // Runway end markings
        var endGeo1 = new THREE.BoxGeometry(8, 1, 50);
        var end1 = makeMesh(endGeo1, 0xffffff);
        end1.position.set(X_OFFSET - 1080, 1, -200);

        var endGeo2 = new THREE.BoxGeometry(8, 1, 50);
        var end2 = makeMesh(endGeo2, 0xffffff);
        end2.position.set(X_OFFSET + 1080, 1, -200);
    }

    function buildSouthTerminal() {
        // Main south terminal building - wide flat structure
        var mainGeo = new THREE.BoxGeometry(300, 20, 80);
        var main = makeMesh(mainGeo, 0xd0c8b8);
        main.position.set(X_OFFSET - 200, 10, -80);

        // South terminal upper level / roof
        var roofGeo = new THREE.BoxGeometry(310, 4, 85);
        var roof = makeMesh(roofGeo, 0xb8b0a0);
        roof.position.set(X_OFFSET - 200, 22, -80);

        // Departures level
        var depGeo = new THREE.BoxGeometry(280, 8, 30);
        var dep = makeMesh(depGeo, 0xc8d0d8);
        dep.position.set(X_OFFSET - 200, 24, -60);

        // Terminal pier / satellite building
        var pierGeo = new THREE.BoxGeometry(20, 12, 180);
        var pier = makeMesh(pierGeo, 0xd0c8b8);
        pier.position.set(X_OFFSET - 300, 6, -180);

        // Pier 2
        var pier2Geo = new THREE.BoxGeometry(20, 12, 180);
        var pier2 = makeMesh(pier2Geo, 0xd0c8b8);
        pier2.position.set(X_OFFSET - 100, 6, -180);

        // Connector walkways to piers
        var walk1Geo = new THREE.BoxGeometry(100, 8, 12);
        var walk1 = makeMesh(walk1Geo, 0xbcb8b0);
        walk1.position.set(X_OFFSET - 250, 4, -130);

        var walk2Geo = new THREE.BoxGeometry(100, 8, 12);
        var walk2 = makeMesh(walk2Geo, 0xbcb8b0);
        walk2.position.set(X_OFFSET - 150, 4, -130);
    }

    function buildNorthTerminal() {
        // Main north terminal building
        var mainGeo = new THREE.BoxGeometry(250, 22, 70);
        var main = makeMesh(mainGeo, 0xd8d0c4);
        main.position.set(X_OFFSET + 300, 11, -80);

        // North terminal roof
        var roofGeo = new THREE.BoxGeometry(260, 4, 75);
        var roof = makeMesh(roofGeo, 0xc0b8a8);
        roof.position.set(X_OFFSET + 300, 25, -80);

        // Pier A
        var pierAGeo = new THREE.BoxGeometry(18, 12, 200);
        var pierA = makeMesh(pierAGeo, 0xd0c8b8);
        pierA.position.set(X_OFFSET + 220, 6, -200);

        // Pier B
        var pierBGeo = new THREE.BoxGeometry(18, 12, 160);
        var pierB = makeMesh(pierBGeo, 0xd0c8b8);
        pierB.position.set(X_OFFSET + 380, 6, -190);

        // Pier connector A
        var connAGeo = new THREE.BoxGeometry(80, 8, 12);
        var connA = makeMesh(connAGeo, 0xbcb8b0);
        connA.position.set(X_OFFSET + 260, 4, -130);

        // Pier connector B
        var connBGeo = new THREE.BoxGeometry(80, 8, 12);
        var connB = makeMesh(connBGeo, 0xbcb8b0);
        connB.position.set(X_OFFSET + 340, 4, -130);

        // Drop-off forecourt canopy
        var canopyGeo = new THREE.BoxGeometry(240, 3, 30);
        var canopy = makeMesh(canopyGeo, 0xa0a0a0);
        canopy.position.set(X_OFFSET + 300, 18, -50);
    }

    function buildControlTower() {
        // Base shaft - tall cylinder (distinctive Gatwick tower)
        var shaftGeo = new THREE.CylinderGeometry(6, 8, 50, 12);
        var shaft = makeMesh(shaftGeo, 0xe8e0d0);
        shaft.position.set(X_OFFSET + 50, 25, -100);

        // Circular cab at top - wider cylinder
        var cabGeo = new THREE.CylinderGeometry(14, 10, 12, 16);
        var cab = makeMesh(cabGeo, 0xd0e8f0);
        cab.position.set(X_OFFSET + 50, 55, -100);

        // Cab roof dome
        var domeGeo = new THREE.SphereGeometry(14, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        var dome = makeMesh(domeGeo, 0xb0c8d8);
        dome.position.set(X_OFFSET + 50, 61, -100);

        // Equipment mast on top
        var mastGeo = new THREE.CylinderGeometry(1, 1, 20, 6);
        var mast = makeMesh(mastGeo, 0x888888);
        mast.position.set(X_OFFSET + 50, 77, -100);
    }

    function buildRailwayStation() {
        // Station building connecting South terminal to mainline
        var stationGeo = new THREE.BoxGeometry(60, 15, 40);
        var station = makeMesh(stationGeo, 0xc8c0b8);
        station.position.set(X_OFFSET - 200, 7, -30);

        // Station roof canopy
        var canopyGeo = new THREE.BoxGeometry(70, 3, 45);
        var canopy = makeMesh(canopyGeo, 0x888880);
        canopy.position.set(X_OFFSET - 200, 16, -30);

        // Elevated walkway to terminal
        var walkGeo = new THREE.BoxGeometry(8, 8, 50);
        var walk = makeMesh(walkGeo, 0xb8b0a8);
        walk.position.set(X_OFFSET - 200, 12, -55);

        // Platform shed
        var shedGeo = new THREE.BoxGeometry(60, 8, 20);
        var shed = makeMesh(shedGeo, 0x909088);
        shed.position.set(X_OFFSET - 200, 20, -20);

        // Rail track sections
        var track1Geo = new THREE.BoxGeometry(200, 1, 3);
        var track1 = makeMesh(track1Geo, 0x444440);
        track1.position.set(X_OFFSET - 200, 1, -18);

        var track2Geo = new THREE.BoxGeometry(200, 1, 3);
        var track2 = makeMesh(track2Geo, 0x444440);
        track2.position.set(X_OFFSET - 200, 1, -22);
    }

    function buildAirbridges() {
        // Jet bridges / airbridges at South Terminal
        var i;
        for (i = 0; i < 6; i++) {
            var bridgeGeo = new THREE.BoxGeometry(5, 5, 30);
            var bridge = makeMesh(bridgeGeo, 0xc0b8a8);
            bridge.position.set(X_OFFSET - 330 + i * 50, 4, -160);
            bridge.rotation.y = 0.3;
        }

        // Jet bridges at North Terminal
        for (i = 0; i < 5; i++) {
            var bridgeGeo2 = new THREE.BoxGeometry(5, 5, 30);
            var bridge2 = makeMesh(bridgeGeo2, 0xc0b8a8);
            bridge2.position.set(X_OFFSET + 190 + i * 50, 4, -160);
            bridge2.rotation.y = -0.3;
        }
    }

    function buildAircraft() {
        // Parked aircraft on stands - simplified fuselage + wings
        var i;
        for (i = 0; i < 5; i++) {
            var xPos = X_OFFSET - 350 + i * 80;
            // Fuselage
            var fuseGeo = new THREE.CylinderGeometry(5, 5, 60, 8);
            var fuse = makeMesh(fuseGeo, 0xf0f0f0);
            fuse.rotation.z = Math.PI / 2;
            fuse.position.set(xPos, 5, -280);

            // Wing
            var wingGeo = new THREE.BoxGeometry(80, 2, 12);
            var wing = makeMesh(wingGeo, 0xe8e8e8);
            wing.position.set(xPos, 5, -280);

            // Tail fin
            var tailGeo = new THREE.BoxGeometry(3, 14, 12);
            var tail = makeMesh(tailGeo, 0xe8e8e8);
            tail.position.set(xPos - 25, 10, -280);
        }

        // North terminal parked aircraft
        for (i = 0; i < 4; i++) {
            var xPos2 = X_OFFSET + 170 + i * 90;
            var fuseGeo2 = new THREE.CylinderGeometry(5, 5, 60, 8);
            var fuse2 = makeMesh(fuseGeo2, 0xf0f0f0);
            fuse2.rotation.z = Math.PI / 2;
            fuse2.position.set(xPos2, 5, -280);

            var wingGeo2 = new THREE.BoxGeometry(80, 2, 12);
            var wing2 = makeMesh(wingGeo2, 0xe8e8e8);
            wing2.position.set(xPos2, 5, -280);

            var tailGeo2 = new THREE.BoxGeometry(3, 14, 12);
            var tail2 = makeMesh(tailGeo2, 0xe8e8e8);
            tail2.position.set(xPos2 - 25, 10, -280);
        }
    }

    function buildCarParks() {
        // Multi-storey car parks near terminals
        var cp1Geo = new THREE.BoxGeometry(120, 30, 80);
        var cp1 = makeMesh(cp1Geo, 0xb8b0a8);
        cp1.position.set(X_OFFSET - 200, 15, 20);

        var cp2Geo = new THREE.BoxGeometry(100, 30, 70);
        var cp2 = makeMesh(cp2Geo, 0xb0a8a0);
        cp2.position.set(X_OFFSET + 300, 15, 20);

        // Car park level lines
        var i;
        for (i = 1; i < 5; i++) {
            var lineGeo = new THREE.BoxGeometry(122, 1, 82);
            var line = makeMesh(lineGeo, 0x909088);
            line.position.set(X_OFFSET - 200, i * 6, 20);
        }
    }

    function buildGatwickGround() {
        // Airport apron / ground
        var apronGeo = new THREE.BoxGeometry(2400, 1, 500);
        var apron = makeMesh(apronGeo, 0x888878);
        apron.position.set(X_OFFSET, 0, -150);

        // Perimeter fence - north
        var fence1Geo = new THREE.BoxGeometry(2400, 4, 2);
        var fence1 = makeMesh(fence1Geo, 0xc0c0b8);
        fence1.position.set(X_OFFSET, 2, -400);

        // Perimeter fence - south
        var fence2Geo = new THREE.BoxGeometry(2400, 4, 2);
        var fence2 = makeMesh(fence2Geo, 0xc0c0b8);
        fence2.position.set(X_OFFSET, 2, 100);
    }

    function buildMartletsShopping() {
        // The Martlets shopping precinct - covered mall
        var martGeo = new THREE.BoxGeometry(140, 12, 60);
        var mart = makeMesh(martGeo, 0xe0d8cc);
        mart.position.set(X_OFFSET - 600, 6, 400);

        // Roof with glazing
        var martRoofGeo = new THREE.BoxGeometry(145, 4, 65);
        var martRoof = makeMesh(martRoofGeo, 0xc8c0b4);
        martRoof.position.set(X_OFFSET - 600, 14, 400);

        // Entrance canopy north
        var entGeo = new THREE.BoxGeometry(30, 6, 20);
        var ent = makeMesh(entGeo, 0xd0c8bc);
        ent.position.set(X_OFFSET - 600, 15, 370);

        // County Mall - larger covered shopping centre
        var countyGeo = new THREE.BoxGeometry(180, 15, 100);
        var county = makeMesh(countyGeo, 0xd8d0c8);
        county.position.set(X_OFFSET - 700, 7, 500);

        // County Mall roof dome section
        var domeGeo = new THREE.CylinderGeometry(40, 40, 8, 16);
        var domeMall = makeMesh(domeGeo, 0xc0ccd8);
        domeMall.position.set(X_OFFSET - 700, 19, 500);

        // County Mall entrance tower
        var towerGeo = new THREE.BoxGeometry(20, 30, 20);
        var tower = makeMesh(towerGeo, 0xd0c8bc);
        tower.position.set(X_OFFSET - 620, 15, 450);
    }

    function buildHighStreet() {
        // Crawley High Street buildings - varied retail blocks
        var i;
        var heights = [12, 14, 10, 16, 12, 14, 11, 13];
        var widths = [20, 25, 18, 22, 20, 24, 19, 21];
        for (i = 0; i < 8; i++) {
            var bGeo = new THREE.BoxGeometry(widths[i], heights[i], 30);
            var b = makeMesh(bGeo, 0xc8c0b4);
            b.position.set(X_OFFSET - 450 + i * 28, heights[i] / 2, 380);
        }

        // Opposite side of High Street
        var heights2 = [10, 13, 15, 11, 14, 12];
        for (i = 0; i < 6; i++) {
            var bGeo2 = new THREE.BoxGeometry(22, heights2[i], 28);
            var b2 = makeMesh(bGeo2, 0xc4bca8);
            b2.position.set(X_OFFSET - 440 + i * 32, heights2[i] / 2, 420);
        }

        // Street surface
        var streetGeo = new THREE.BoxGeometry(350, 1, 35);
        var street = makeMesh(streetGeo, 0x888880);
        street.position.set(X_OFFSET - 500, 0.5, 400);
    }

    function buildTownHall() {
        // Crawley Town Hall - civic building
        var hallGeo = new THREE.BoxGeometry(60, 20, 50);
        var hall = makeMesh(hallGeo, 0xd4c8b8);
        hall.position.set(X_OFFSET - 550, 10, 300);

        // Portico columns
        var i;
        for (i = 0; i < 4; i++) {
            var colGeo = new THREE.CylinderGeometry(2, 2, 16, 8);
            var col = makeMesh(colGeo, 0xe0d8cc);
            col.position.set(X_OFFSET - 570 + i * 10, 8, 278);
        }

        // Town hall roof feature
        var pedGeo = new THREE.BoxGeometry(65, 6, 10);
        var ped = makeMesh(pedGeo, 0xc8bcac);
        ped.position.set(X_OFFSET - 550, 23, 278);

        // Clock tower
        var clockTowerGeo = new THREE.BoxGeometry(12, 35, 12);
        var clockTower = makeMesh(clockTowerGeo, 0xd0c4b4);
        clockTower.position.set(X_OFFSET - 550, 17, 300);

        // Clock tower top
        var clockTopGeo = new THREE.ConeGeometry(8, 10, 4);
        var clockTop = makeMesh(clockTopGeo, 0xa0a898);
        clockTop.position.set(X_OFFSET - 550, 42, 300);
    }

    function buildManorRoyal() {
        // Manor Royal business district - large office/industrial campus
        // Main office buildings
        var i;
        var officeData = [
            { x: 0, z: 200, w: 80, h: 18, d: 50 },
            { x: 100, z: 200, w: 70, h: 22, d: 50 },
            { x: 200, z: 200, w: 90, h: 16, d: 55 },
            { x: -100, z: 200, w: 75, h: 20, d: 48 },
            { x: -200, z: 200, w: 85, h: 14, d: 52 },
            { x: 50, z: 280, w: 100, h: 25, d: 60 },
            { x: -50, z: 280, w: 80, h: 18, d: 55 },
            { x: 150, z: 280, w: 70, h: 20, d: 45 }
        ];

        for (i = 0; i < officeData.length; i++) {
            var od = officeData[i];
            var offGeo = new THREE.BoxGeometry(od.w, od.h, od.d);
            var off = makeMesh(offGeo, 0xc4cccc);
            off.position.set(X_OFFSET + od.x, od.h / 2, od.z);
        }

        // Large warehouse/distribution units
        var wh1Geo = new THREE.BoxGeometry(150, 12, 80);
        var wh1 = makeMesh(wh1Geo, 0xb8b0a8);
        wh1.position.set(X_OFFSET + 350, 6, 200);

        var wh2Geo = new THREE.BoxGeometry(130, 10, 70);
        var wh2 = makeMesh(wh2Geo, 0xb0a8a0);
        wh2.position.set(X_OFFSET + 350, 5, 300);

        // Roundabout 1
        var round1Geo = new THREE.CylinderGeometry(20, 20, 1, 16);
        var round1 = makeMesh(round1Geo, 0x607050);
        round1.position.set(X_OFFSET, 0.5, 150);

        // Roundabout 2
        var round2Geo = new THREE.CylinderGeometry(15, 15, 1, 16);
        var round2 = makeMesh(round2Geo, 0x607050);
        round2.position.set(X_OFFSET + 200, 0.5, 150);

        // Road network in Manor Royal
        var road1Geo = new THREE.BoxGeometry(600, 1, 14);
        var road1 = makeMesh(road1Geo, 0x555550);
        road1.position.set(X_OFFSET + 100, 0.5, 150);

        var road2Geo = new THREE.BoxGeometry(14, 1, 200);
        var road2 = makeMesh(road2Geo, 0x555550);
        road2.position.set(X_OFFSET, 0.5, 230);

        // Tech company buildings - glass-clad
        var tech1Geo = new THREE.BoxGeometry(60, 30, 40);
        var tech1 = makeMesh(tech1Geo, 0xb0c8d8);
        tech1.position.set(X_OFFSET - 150, 15, 350);

        var tech2Geo = new THREE.BoxGeometry(55, 28, 45);
        var tech2 = makeMesh(tech2Geo, 0xa8c0d0);
        tech2.position.set(X_OFFSET - 250, 14, 350);

        // Manor Royal ground
        var groundGeo = new THREE.BoxGeometry(900, 1, 300);
        var ground = makeMesh(groundGeo, 0x787870);
        ground.position.set(X_OFFSET + 100, 0, 250);
    }

    function buildK2Crawley() {
        // K2 Crawley leisure centre - modern sports complex
        // Main building - large glass-fronted structure
        var mainGeo = new THREE.BoxGeometry(140, 20, 100);
        var mainK2 = makeMesh(mainGeo, 0xb0c8e0);
        mainK2.position.set(X_OFFSET + 600, 10, 450);

        // Glass facade front
        var glassGeo = new THREE.BoxGeometry(142, 22, 4);
        var glass = makeMesh(glassGeo, 0x90b8d8);
        glass.position.set(X_OFFSET + 600, 11, 400);

        // Sports hall roof - raised section
        var hallRoofGeo = new THREE.BoxGeometry(100, 8, 90);
        var hallRoof = makeMesh(hallRoofGeo, 0xa0bcd0);
        hallRoof.position.set(X_OFFSET + 600, 24, 450);

        // Swimming pool wing - slightly lower
        var poolGeo = new THREE.BoxGeometry(60, 16, 80);
        var pool = makeMesh(poolGeo, 0xa8d0e8);
        pool.position.set(X_OFFSET + 700, 8, 460);

        // Pool roof glazing
        var poolRoofGeo = new THREE.BoxGeometry(62, 3, 82);
        var poolRoof = makeMesh(poolRoofGeo, 0x90c0e0);
        poolRoof.position.set(X_OFFSET + 700, 17, 460);

        // Sports hall - indoor courts wing
        var courtsGeo = new THREE.BoxGeometry(70, 18, 70);
        var courts = makeMesh(courtsGeo, 0xb8ccd8);
        courts.position.set(X_OFFSET + 510, 9, 450);

        // Entrance canopy
        var entCanopyGeo = new THREE.BoxGeometry(50, 4, 15);
        var entCanopy = makeMesh(entCanopyGeo, 0x8898a8);
        entCanopy.position.set(X_OFFSET + 600, 20, 403);

        // Car park K2
        var cpGeo = new THREE.BoxGeometry(200, 2, 100);
        var cp = makeMesh(cpGeo, 0x888880);
        cp.position.set(X_OFFSET + 600, 1, 360);

        // Floodlight towers for outdoor pitches
        var i;
        for (i = 0; i < 4; i++) {
            var lightPoleGeo = new THREE.CylinderGeometry(1, 1, 30, 6);
            var lightPole = makeMesh(lightPoleGeo, 0x888888);
            lightPole.position.set(X_OFFSET + 550 + (i % 2) * 100, 15, 540 + Math.floor(i / 2) * 60);

            var lightHeadGeo = new THREE.BoxGeometry(8, 3, 4);
            var lightHead = makeMesh(lightHeadGeo, 0xd0d0c0);
            lightHead.position.set(X_OFFSET + 550 + (i % 2) * 100, 31, 540 + Math.floor(i / 2) * 60);
        }

        // Outdoor pitch surfaces
        var pitch1Geo = new THREE.BoxGeometry(90, 1, 55);
        var pitch1 = makeMesh(pitch1Geo, 0x408040);
        pitch1.position.set(X_OFFSET + 600, 0.5, 570);
    }

    function buildNewTownDistricts() {
        // Crawley new town - 1940s planned districts
        // Neighbourhood centres with local shops and community buildings

        // Northgate neighbourhood centre
        var ngGeo = new THREE.BoxGeometry(50, 8, 35);
        var ng = makeMesh(ngGeo, 0xd0c4b4);
        ng.position.set(X_OFFSET - 800, 4, 500);

        // Maidenbower area homes - rows of houses
        var i;
        for (i = 0; i < 10; i++) {
            var houseGeo = new THREE.BoxGeometry(12, 8, 10);
            var house = makeMesh(houseGeo, 0xd0b898);
            house.position.set(X_OFFSET - 900 + i * 18, 4, 450);

            var roofGeo = new THREE.ConeGeometry(9, 6, 4);
            var hRoof = makeMesh(roofGeo, 0x805040);
            hRoof.rotation.y = Math.PI / 4;
            hRoof.position.set(X_OFFSET - 900 + i * 18, 11, 450);
        }

        // Three Bridges area
        for (i = 0; i < 8; i++) {
            var houseGeo2 = new THREE.BoxGeometry(11, 8, 10);
            var house2 = makeMesh(houseGeo2, 0xc8b490);
            house2.position.set(X_OFFSET - 900 + i * 18, 4, 490);

            var roofGeo2 = new THREE.ConeGeometry(8, 5, 4);
            var hRoof2 = makeMesh(roofGeo2, 0x704838);
            hRoof2.rotation.y = Math.PI / 4;
            hRoof2.position.set(X_OFFSET - 900 + i * 18, 11, 490);
        }

        // Tilgate neighbourhood
        var tilGeo = new THREE.BoxGeometry(40, 9, 30);
        var til = makeMesh(tilGeo, 0xd4c8b8);
        til.position.set(X_OFFSET - 800, 4, 600);

        // Tilgate Park - green space
        var parkGeo = new THREE.BoxGeometry(200, 1, 150);
        var park = makeMesh(parkGeo, 0x508040);
        park.position.set(X_OFFSET - 700, 0.5, 650);

        // Park trees (simple cones)
        var treePositions = [
            [-680, 620], [-720, 640], [-660, 680], [-740, 700],
            [-700, 660], [-760, 630], [-640, 650], [-780, 680]
        ];
        for (i = 0; i < treePositions.length; i++) {
            var trunkGeo = new THREE.CylinderGeometry(1.5, 2, 8, 6);
            var trunk = makeMesh(trunkGeo, 0x604020);
            trunk.position.set(X_OFFSET + treePositions[i][0], 4, treePositions[i][1]);

            var canopyGeo = new THREE.ConeGeometry(10, 16, 7);
            var canopyMesh = makeMesh(canopyGeo, 0x306020);
            canopyMesh.position.set(X_OFFSET + treePositions[i][0], 16, treePositions[i][1]);
        }

        // Broadfield neighbourhood shops
        var bfGeo = new THREE.BoxGeometry(45, 10, 32);
        var bf = makeMesh(bfGeo, 0xc8c0b0);
        bf.position.set(X_OFFSET + 400, 5, 600);

        // Bewbush neighbourhood centre
        var bwGeo = new THREE.BoxGeometry(38, 9, 28);
        var bw = makeMesh(bwGeo, 0xd0c4b4);
        bw.position.set(X_OFFSET + 500, 4, 650);

        // Open space / park in town centre area
        var centreParkGeo = new THREE.BoxGeometry(120, 1, 80);
        var centrePark = makeMesh(centreParkGeo, 0x50804a);
        centrePark.position.set(X_OFFSET - 500, 0.5, 480);

        // Church - landmark building
        var churchGeo = new THREE.BoxGeometry(20, 15, 40);
        var church = makeMesh(churchGeo, 0xd0c8b8);
        church.position.set(X_OFFSET - 580, 7, 350);

        var spireGeo = new THREE.ConeGeometry(4, 25, 4);
        var spire = makeMesh(spireGeo, 0xb8b0a0);
        spire.rotation.y = Math.PI / 4;
        spire.position.set(X_OFFSET - 580, 27, 360);

        // Crawley bus station
        var busGeo = new THREE.BoxGeometry(80, 8, 40);
        var bus = makeMesh(busGeo, 0xbcb4a8);
        bus.position.set(X_OFFSET - 630, 4, 440);

        var busRoofGeo = new THREE.BoxGeometry(84, 3, 44);
        var busRoof = makeMesh(busRoofGeo, 0xa8a098);
        busRoof.position.set(X_OFFSET - 630, 10, 440);
    }

    function buildRoads() {
        // Main roads connecting areas
        // A23 London Road approaching airport
        var a23Geo = new THREE.BoxGeometry(18, 1, 800);
        var a23 = makeMesh(a23Geo, 0x666660);
        a23.position.set(X_OFFSET - 50, 0.5, 200);

        // Airport Way
        var awayGeo = new THREE.BoxGeometry(600, 1, 14);
        var away = makeMesh(awayGeo, 0x666660);
        away.position.set(X_OFFSET, 0.5, 50);

        // Town centre road
        var tcRoadGeo = new THREE.BoxGeometry(400, 1, 12);
        var tcRoad = makeMesh(tcRoadGeo, 0x666660);
        tcRoad.position.set(X_OFFSET - 600, 0.5, 400);

        // Manor Royal access road
        var mrRoadGeo = new THREE.BoxGeometry(16, 1, 300);
        var mrRoad = makeMesh(mrRoadGeo, 0x666660);
        mrRoad.position.set(X_OFFSET + 150, 0.5, 100);
    }

    function build() {
        buildGatwickGround();
        buildRunway();
        buildSouthTerminal();
        buildNorthTerminal();
        buildControlTower();
        buildRailwayStation();
        buildAirbridges();
        buildAircraft();
        buildCarParks();
        buildMartletsShopping();
        buildHighStreet();
        buildTownHall();
        buildManorRoyal();
        buildK2Crawley();
        buildNewTownDistricts();
        buildRoads();
    }

    function update(delta) {
        // Static environment - no animation required
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
