window.ShorehamPort = (function() {
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

    function makeMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildPortBasins() {
        // Harbour walls - long stone/concrete walls
        var wallGeo1 = new THREE.BoxGeometry(200, 6, 10);
        makeMesh(wallGeo1, 0x888888, 13240, 3, -200);

        var wallGeo2 = new THREE.BoxGeometry(200, 6, 10);
        makeMesh(wallGeo2, 0x888888, 13240, 3, -400);

        var wallGeo3 = new THREE.BoxGeometry(10, 6, 200);
        makeMesh(wallGeo3, 0x888888, 13140, 3, -300);

        var wallGeo4 = new THREE.BoxGeometry(10, 6, 200);
        makeMesh(wallGeo4, 0x888888, 13340, 3, -300);

        // Second basin
        var wallGeo5 = new THREE.BoxGeometry(160, 6, 10);
        makeMesh(wallGeo5, 0x777777, 13300, 3, -480);

        var wallGeo6 = new THREE.BoxGeometry(10, 6, 120);
        makeMesh(wallGeo6, 0x777777, 13380, 3, -420);

        // Dock floor / water plane representation
        var dockFloorGeo = new THREE.BoxGeometry(190, 1, 190);
        makeMesh(dockFloorGeo, 0x1a3a5c, 13240, 0, -300);
    }

    function buildCargoCranes() {
        var i;
        for (i = 0; i < 4; i++) {
            // Crane tower
            var towerGeo = new THREE.BoxGeometry(6, 40, 6);
            makeMesh(towerGeo, 0xcc6600, 13160 + i * 40, 20, -220);

            // Crane boom horizontal
            var boomGeo = new THREE.BoxGeometry(50, 3, 3);
            makeMesh(boomGeo, 0xcc6600, 13185 + i * 40, 42, -220);

            // Crane cab
            var cabGeo = new THREE.BoxGeometry(8, 8, 8);
            makeMesh(cabGeo, 0xdd7700, 13160 + i * 40, 44, -220);

            // Counterweight
            var cwGeo = new THREE.BoxGeometry(10, 6, 6);
            makeMesh(cwGeo, 0x994400, 13137 + i * 40, 42, -220);

            // Support legs
            var legGeo = new THREE.BoxGeometry(3, 10, 20);
            makeMesh(legGeo, 0xcc6600, 13160 + i * 40, 5, -220);
        }
    }

    function buildGrainSilos() {
        var i;
        for (i = 0; i < 6; i++) {
            // Cylindrical silo
            var siloGeo = new THREE.CylinderGeometry(8, 8, 35, 12);
            makeMesh(siloGeo, 0xddccaa, 13350 + i * 18, 17.5, -260);

            // Silo roof cone
            var roofGeo = new THREE.ConeGeometry(8, 8, 12);
            makeMesh(roofGeo, 0xccbbaa, 13350 + i * 18, 39, -260);
        }

        // Silo connecting walkway
        var walkGeo = new THREE.BoxGeometry(90, 4, 6);
        makeMesh(walkGeo, 0xccbbaa, 13395, 38, -260);

        // Loading conveyor building
        var convBldgGeo = new THREE.BoxGeometry(20, 15, 12);
        makeMesh(convBldgGeo, 0xbbaa88, 13460, 7.5, -260);
    }

    function buildBulkCarriers() {
        var i;
        for (i = 0; i < 2; i++) {
            // Ship hull - large boxy hull
            var hullGeo = new THREE.BoxGeometry(80, 10, 22);
            makeMesh(hullGeo, 0x333344, 13200 + i * 100, 5, -310 + i * 20);

            // Ship superstructure / bridge
            var superGeo = new THREE.BoxGeometry(16, 12, 18);
            makeMesh(superGeo, 0xeeddcc, 13220 + i * 100, 16, -310 + i * 20);

            // Funnel
            var funnelGeo = new THREE.CylinderGeometry(3, 4, 10, 8);
            makeMesh(funnelGeo, 0xcc2200, 13224 + i * 100, 27, -310 + i * 20);

            // Ship bow (angled front)
            var bowGeo = new THREE.BoxGeometry(15, 8, 22);
            makeMesh(bowGeo, 0x444455, 13162 + i * 100, 5, -310 + i * 20);

            // Deck hatch covers
            var hatchGeo = new THREE.BoxGeometry(40, 2, 14);
            makeMesh(hatchGeo, 0x555566, 13195 + i * 100, 11, -310 + i * 20);

            // Mast
            var mastGeo = new THREE.CylinderGeometry(0.5, 0.5, 20, 6);
            makeMesh(mastGeo, 0xaaaaaa, 13175 + i * 100, 20, -310 + i * 20);
        }
    }

    function buildContainerStorage() {
        var r, c;
        var colors = [0xcc2200, 0x2255cc, 0x228822, 0xccaa00, 0x884422];
        for (r = 0; r < 4; r++) {
            for (c = 0; c < 8; c++) {
                var containerGeo = new THREE.BoxGeometry(12, 8, 6);
                makeMesh(containerGeo, colors[(r + c) % colors.length], 13140 + c * 14, 4 + r * 9, -450);
            }
        }

        // Second container yard
        for (r = 0; r < 3; r++) {
            for (c = 0; c < 6; c++) {
                var containerGeo2 = new THREE.BoxGeometry(12, 8, 6);
                makeMesh(containerGeo2, colors[(r * 2 + c + 1) % colors.length], 13140 + c * 14, 4 + r * 9, -470);
            }
        }
    }

    function buildAirportTerminal() {
        // Art Deco curved white terminal building (1936, Grade I listed)
        // Central curved section
        var termCentralGeo = new THREE.CylinderGeometry(18, 18, 12, 16, 1, false, 0, Math.PI);
        makeMesh(termCentralGeo, 0xf5f0e8, 13240, 6, 200);

        // Terminal flat roof top
        var termRoofGeo = new THREE.BoxGeometry(36, 1.5, 18);
        makeMesh(termRoofGeo, 0xeeeee0, 13240, 12.5, 209);

        // Terminal wings
        var wingLGeo = new THREE.BoxGeometry(40, 10, 14);
        makeMesh(wingLGeo, 0xf5f0e8, 13160, 5, 205);

        var wingRGeo = new THREE.BoxGeometry(40, 10, 14);
        makeMesh(wingRGeo, 0xf5f0e8, 13320, 5, 205);

        // Art Deco tower / control section
        var towerGeo = new THREE.BoxGeometry(10, 20, 10);
        makeMesh(towerGeo, 0xf0ebe0, 13240, 16, 204);

        // Tower top decoration
        var towerTopGeo = new THREE.BoxGeometry(12, 4, 12);
        makeMesh(towerTopGeo, 0xe8e3d8, 13240, 28, 204);

        // Windows strips (Art Deco horizontal banding)
        var windowBand1 = new THREE.BoxGeometry(36, 1, 1);
        makeMesh(windowBand1, 0xaaddff, 13240, 7, 196);

        var windowBand2 = new THREE.BoxGeometry(36, 1, 1);
        makeMesh(windowBand2, 0xaaddff, 13240, 9, 196);

        // Entrance canopy
        var canopyGeo = new THREE.BoxGeometry(20, 1, 6);
        makeMesh(canopyGeo, 0xddddcc, 13240, 11, 195);

        // Grass airfield
        var fieldGeo = new THREE.BoxGeometry(300, 0.5, 200);
        makeMesh(fieldGeo, 0x449933, 13240, 0.25, 350);

        // Runway
        var runwayGeo = new THREE.BoxGeometry(12, 0.6, 180);
        makeMesh(runwayGeo, 0x333333, 13240, 0.35, 350);

        // Runway markings (centre line)
        var markGeo = new THREE.BoxGeometry(2, 0.7, 160);
        makeMesh(markGeo, 0xffffff, 13240, 0.4, 350);
    }

    function buildAircraftHangars() {
        var i;
        for (i = 0; i < 3; i++) {
            // Hangar body
            var hangarGeo = new THREE.BoxGeometry(30, 14, 25);
            makeMesh(hangarGeo, 0xaaaaaa, 13140 + i * 36, 7, 240);

            // Curved hangar roof (approximated with cylinder half)
            var hangarRoofGeo = new THREE.CylinderGeometry(15, 15, 30, 12, 1, false, 0, Math.PI);
            makeMesh(hangarRoofGeo, 0x999999, 13140 + i * 36, 14, 240);

            // Hangar doors (large opening)
            var doorGeo = new THREE.BoxGeometry(20, 12, 1);
            makeMesh(doorGeo, 0x666666, 13140 + i * 36, 6, 227.5);
        }

        // Vintage aircraft on apron
        // Biplane body
        var planeBodyGeo = new THREE.BoxGeometry(14, 3, 3);
        makeMesh(planeBodyGeo, 0xccaa44, 13240, 1.5, 220);

        var wingGeo = new THREE.BoxGeometry(18, 0.8, 4);
        makeMesh(wingGeo, 0xccaa44, 13240, 2.5, 220);

        var wing2Geo = new THREE.BoxGeometry(18, 0.8, 4);
        makeMesh(wing2Geo, 0xccaa44, 13240, 4, 220);

        var tailGeo = new THREE.BoxGeometry(5, 3, 0.8);
        makeMesh(tailGeo, 0xccaa44, 13247, 3, 220);
    }

    function buildCementWorks() {
        // Industrial processing plant buildings
        var plantGeo1 = new THREE.BoxGeometry(40, 18, 30);
        makeMesh(plantGeo1, 0x888877, 13500, 9, 50);

        var plantGeo2 = new THREE.BoxGeometry(30, 22, 25);
        makeMesh(plantGeo2, 0x999988, 13550, 11, 80);

        var plantGeo3 = new THREE.BoxGeometry(25, 15, 20);
        makeMesh(plantGeo3, 0x777766, 13470, 7.5, 85);

        // Tall chimneys
        var chimney1Geo = new THREE.CylinderGeometry(3, 4, 60, 10);
        makeMesh(chimney1Geo, 0x666655, 13510, 30, 60);

        var chimney2Geo = new THREE.CylinderGeometry(3, 4, 55, 10);
        makeMesh(chimney2Geo, 0x666655, 13540, 27.5, 70);

        var chimney3Geo = new THREE.CylinderGeometry(2.5, 3.5, 50, 10);
        makeMesh(chimney3Geo, 0x777766, 13560, 25, 55);

        // Chimney tops (slightly wider rim)
        var rim1Geo = new THREE.CylinderGeometry(4, 3, 3, 10);
        makeMesh(rim1Geo, 0x555544, 13510, 61.5, 60);

        var rim2Geo = new THREE.CylinderGeometry(4, 3, 3, 10);
        makeMesh(rim2Geo, 0x555544, 13540, 56.5, 70);

        // Conveyor belt structures - elevated trusses
        var convGeo1 = new THREE.BoxGeometry(60, 3, 4);
        makeMesh(convGeo1, 0x888888, 13490, 14, 65);

        var convGeo2 = new THREE.BoxGeometry(50, 3, 4);
        makeMesh(convGeo2, 0x888888, 13500, 18, 75);

        // Conveyor support towers
        var suppGeo1 = new THREE.BoxGeometry(4, 14, 4);
        makeMesh(suppGeo1, 0x777777, 13465, 7, 65);

        var suppGeo2 = new THREE.BoxGeometry(4, 18, 4);
        makeMesh(suppGeo2, 0x777777, 13515, 9, 65);

        // Aggregate piles - cone shapes
        var pile1Geo = new THREE.ConeGeometry(12, 8, 8);
        makeMesh(pile1Geo, 0xbbaa88, 13420, 4, 90);

        var pile2Geo = new THREE.ConeGeometry(10, 7, 8);
        makeMesh(pile2Geo, 0xccbbaa, 13445, 3.5, 95);

        var pile3Geo = new THREE.ConeGeometry(8, 6, 8);
        makeMesh(pile3Geo, 0xaabb88, 13435, 3, 75);

        // Storage tanks
        var tank1Geo = new THREE.CylinderGeometry(7, 7, 16, 10);
        makeMesh(tank1Geo, 0xaaaaaa, 13580, 8, 60);

        var tank2Geo = new THREE.CylinderGeometry(6, 6, 14, 10);
        makeMesh(tank2Geo, 0xbbbbbb, 13600, 7, 72);

        // Factory perimeter fence wall
        var fenceGeo = new THREE.BoxGeometry(120, 4, 1);
        makeMesh(fenceGeo, 0x777766, 13500, 2, 40);
    }

    function buildTollBridge() {
        // Historic wooden toll bridge across River Adur
        // Bridge deck - wooden planking appearance
        var deckGeo = new THREE.BoxGeometry(4, 1, 80);
        makeMesh(deckGeo, 0x8B5E3C, 13240, 3, 120);

        // Bridge railings - left
        var railLGeo = new THREE.BoxGeometry(1, 2, 80);
        makeMesh(railLGeo, 0x7a5230, 13237, 4.5, 120);

        // Bridge railings - right
        var railRGeo = new THREE.BoxGeometry(1, 2, 80);
        makeMesh(railRGeo, 0x7a5230, 13243, 4.5, 120);

        // Wooden support posts along bridge
        var i;
        for (i = 0; i < 10; i++) {
            var postLGeo = new THREE.BoxGeometry(1, 8, 1);
            makeMesh(postLGeo, 0x6b4423, 13237, 4, 84 + i * 8);

            var postRGeo = new THREE.BoxGeometry(1, 8, 1);
            makeMesh(postRGeo, 0x6b4423, 13243, 4, 84 + i * 8);
        }

        // Cross beams under bridge deck
        for (i = 0; i < 8; i++) {
            var crossGeo = new THREE.BoxGeometry(6, 1, 1);
            makeMesh(crossGeo, 0x7a5230, 13240, 2.5, 84 + i * 10);
        }

        // Toll booths at each end
        var tollBooth1Geo = new THREE.BoxGeometry(5, 5, 5);
        makeMesh(tollBooth1Geo, 0xddcc99, 13248, 2.5, 83);

        var tollBooth2Geo = new THREE.BoxGeometry(5, 5, 5);
        makeMesh(tollBooth2Geo, 0xddcc99, 13248, 2.5, 157);

        // Toll booth roofs
        var tollRoof1Geo = new THREE.BoxGeometry(6, 1, 6);
        makeMesh(tollRoof1Geo, 0x885533, 13248, 5.5, 83);

        var tollRoof2Geo = new THREE.BoxGeometry(6, 1, 6);
        makeMesh(tollRoof2Geo, 0x885533, 13248, 5.5, 157);

        // River Adur representation
        var riverGeo = new THREE.BoxGeometry(30, 0.5, 80);
        makeMesh(riverGeo, 0x2255aa, 13240, 0.3, 120);
    }

    function buildShorehamTown() {
        // St Mary de Haura church - Norman church
        // Nave
        var naveGeo = new THREE.BoxGeometry(16, 14, 40);
        makeMesh(naveGeo, 0x887766, 13170, 7, 30);

        // Chancel
        var chancelGeo = new THREE.BoxGeometry(10, 12, 16);
        makeMesh(chancelGeo, 0x887766, 13170, 6, -5);

        // Norman tower
        var towerGeo = new THREE.BoxGeometry(10, 24, 10);
        makeMesh(towerGeo, 0x776655, 13178, 12, 12);

        // Tower parapet
        var parapetGeo = new THREE.BoxGeometry(12, 3, 12);
        makeMesh(parapetGeo, 0x776655, 13178, 25.5, 12);

        // Church roof (pitched)
        var roofGeo = new THREE.BoxGeometry(17, 6, 41);
        makeMesh(roofGeo, 0x665544, 13170, 17, 30);

        // Chancel roof
        var chRoofGeo = new THREE.BoxGeometry(11, 5, 17);
        makeMesh(chRoofGeo, 0x665544, 13170, 16, -5);

        // Flint-walled buildings along High Street
        var i;
        for (i = 0; i < 8; i++) {
            var houseGeo = new THREE.BoxGeometry(8 + Math.floor(i * 0.5) % 4, 10 + (i % 3) * 2, 10);
            makeMesh(houseGeo, 0x776655, 13120 + i * 12, 5 + (i % 3), 60);

            // Pitched roofs
            var houseRoofGeo = new THREE.BoxGeometry(9 + Math.floor(i * 0.5) % 4, 5, 11);
            makeMesh(houseRoofGeo, 0xaa6644, 13120 + i * 12, 15 + (i % 3), 60);
        }

        // Flint walls texture (dark grey/black stone typical of Sussex)
        for (i = 0; i < 6; i++) {
            var shopGeo = new THREE.BoxGeometry(7, 9, 8);
            makeMesh(shopGeo, 0x665544, 13200 + i * 10, 4.5, 58);

            var shopRoofGeo = new THREE.BoxGeometry(8, 4, 9);
            makeMesh(shopRoofGeo, 0x994433, 13200 + i * 10, 11, 58);
        }

        // River Adur boats (moored)
        for (i = 0; i < 4; i++) {
            // Boat hull
            var boatGeo = new THREE.BoxGeometry(8, 2.5, 3);
            makeMesh(boatGeo, 0xaa8833 + i * 0x001100, 13200 + i * 14, 2, 110 + i * 5);

            // Boat cabin
            var boatCabinGeo = new THREE.BoxGeometry(4, 3, 2.5);
            makeMesh(boatCabinGeo, 0xffeedd, 13201 + i * 14, 4, 110 + i * 5);

            // Mast
            var boatMastGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 5);
            makeMesh(boatMastGeo, 0x886644, 13202 + i * 14, 7, 110 + i * 5);
        }
    }

    function buildBeachHuts() {
        // Long row of beach huts on shingle bank
        var hutColors = [
            0xcc3333, 0x3355cc, 0x33aa33, 0xcc9922, 0xaa33aa,
            0x33aaaa, 0xcc6633, 0x6633cc, 0x33cc66, 0xcc3366
        ];
        var i;
        for (i = 0; i < 30; i++) {
            // Hut body
            var hutGeo = new THREE.BoxGeometry(4, 5, 4);
            makeMesh(hutGeo, hutColors[i % hutColors.length], 13080 + i * 5, 2.5, -520);

            // Hut pitched roof
            var hutRoofGeo = new THREE.BoxGeometry(4.5, 2.5, 4.5);
            makeMesh(hutRoofGeo, 0xffffff, 13080 + i * 5, 6.25, -520);

            // Hut door
            var hutDoorGeo = new THREE.BoxGeometry(1.5, 3, 0.5);
            makeMesh(hutDoorGeo, 0x442211, 13080 + i * 5, 1.5, -522);
        }

        // Groynes (wooden breakwater structures extending into sea)
        for (i = 0; i < 8; i++) {
            var groyneGeo = new THREE.BoxGeometry(2, 2, 30);
            makeMesh(groyneGeo, 0x5a3a1a, 13100 + i * 22, 1, -540);
        }

        // Sea wall / promenade
        var seaWallGeo = new THREE.BoxGeometry(200, 3, 6);
        makeMesh(seaWallGeo, 0x999988, 13155, 1.5, -514);

        // Shingle bank
        var shingleGeo = new THREE.BoxGeometry(200, 2, 20);
        makeMesh(shingleGeo, 0x998877, 13155, 1, -522);

        // Sea (water plane beyond beach)
        var seaGeo = new THREE.BoxGeometry(400, 0.5, 100);
        makeMesh(seaGeo, 0x1144aa, 13155, 0, -575);
    }

    function buildPortInfrastructure() {
        // Port office buildings
        var officeGeo = new THREE.BoxGeometry(20, 12, 15);
        makeMesh(officeGeo, 0xccbbaa, 13140, 6, -200);

        var officeRoofGeo = new THREE.BoxGeometry(21, 1, 16);
        makeMesh(officeRoofGeo, 0xaa9988, 13140, 12.5, -200);

        // Dock warehouses
        var wh1Geo = new THREE.BoxGeometry(50, 10, 20);
        makeMesh(wh1Geo, 0xaaaaaa, 13140, 5, -160);

        var wh2Geo = new THREE.BoxGeometry(50, 10, 20);
        makeMesh(wh2Geo, 0xbbbbbb, 13340, 5, -160);

        // Lighthouse / harbour light
        var lighthouseGeo = new THREE.CylinderGeometry(3, 4, 20, 10);
        makeMesh(lighthouseGeo, 0xffffff, 13140, 10, -410);

        var lightTopGeo = new THREE.CylinderGeometry(4, 3, 4, 10);
        makeMesh(lightTopGeo, 0xffee00, 13140, 22, -410);

        // Fuel tanks near port
        var fuelTank1Geo = new THREE.CylinderGeometry(8, 8, 12, 10);
        makeMesh(fuelTank1Geo, 0x334455, 13380, 6, -180);

        var fuelTank2Geo = new THREE.CylinderGeometry(7, 7, 10, 10);
        makeMesh(fuelTank2Geo, 0x445566, 13400, 5, -160);

        // Quayside road / hard standing
        var quayRoadGeo = new THREE.BoxGeometry(200, 0.5, 30);
        makeMesh(quayRoadGeo, 0x666666, 13240, 0.3, -180);

        // Loading dock lights/bollards
        var k;
        for (k = 0; k < 6; k++) {
            var bollardGeo = new THREE.CylinderGeometry(0.6, 0.8, 2.5, 6);
            makeMesh(bollardGeo, 0x333333, 13145 + k * 35, 1.25, -205);
        }
    }

    function build() {
        buildPortBasins();
        buildCargoCranes();
        buildGrainSilos();
        buildBulkCarriers();
        buildContainerStorage();
        buildPortInfrastructure();
        buildAirportTerminal();
        buildAircraftHangars();
        buildCementWorks();
        buildTollBridge();
        buildShorehamTown();
        buildBeachHuts();
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
