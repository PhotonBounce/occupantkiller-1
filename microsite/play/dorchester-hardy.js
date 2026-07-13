window.DorchesterHardy = (function() {
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

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geo, color) {
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
    }

    function buildMaumburyRings() {
        var ox = 13680;
        var oz = 200;
        var i, angle, x, z, seg;

        // Oval earthwork ring — 16 bank segments around the oval
        for (i = 0; i < 16; i++) {
            angle = (i / 16) * Math.PI * 2;
            x = ox + Math.cos(angle) * 38;
            z = oz + Math.sin(angle) * 30;
            seg = makeMesh(new THREE.BoxGeometry(10, 5, 8), 0x6b5a3e);
            seg.position.set(x, 2.5, z);
            seg.rotation.y = angle;
            addObj(seg);
        }

        // Arena floor
        var arenaFloor = makeMesh(new THREE.CylinderGeometry(30, 30, 0.5, 24), 0x8a7560);
        arenaFloor.position.set(ox, 0.25, oz);
        addObj(arenaFloor);

        // Banked seating terraces — inner ring
        for (i = 0; i < 12; i++) {
            angle = (i / 12) * Math.PI * 2;
            x = ox + Math.cos(angle) * 25;
            z = oz + Math.sin(angle) * 20;
            var terrace = makeMesh(new THREE.BoxGeometry(8, 2, 5), 0x7a6a50);
            terrace.position.set(x, 1.5, z);
            terrace.rotation.y = angle;
            addObj(terrace);
        }

        // Entrance cuttings — north and south gaps (represented as marker posts)
        var entN1 = makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 6), 0x5a4a30);
        entN1.position.set(ox - 4, 2, oz - 32);
        addObj(entN1);
        var entN2 = makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 6), 0x5a4a30);
        entN2.position.set(ox + 4, 2, oz - 32);
        addObj(entN2);
        var entS1 = makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 6), 0x5a4a30);
        entS1.position.set(ox - 4, 2, oz + 32);
        addObj(entS1);
        var entS2 = makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 6), 0x5a4a30);
        entS2.position.set(ox + 4, 2, oz + 32);
        addObj(entS2);

        // Central amphitheatre marker stone
        var marker = makeMesh(new THREE.CylinderGeometry(1, 1.5, 3, 8), 0x9a8a70);
        marker.position.set(ox, 1.5, oz);
        addObj(marker);
    }

    function buildHardysCottage() {
        var ox = 13680 + 600;
        var oz = -400;

        // Low cob walls — main cottage body
        var walls = makeMesh(new THREE.BoxGeometry(12, 4, 8), 0xc8a87a);
        walls.position.set(ox, 2, oz);
        addObj(walls);

        // Thatched roof — wide low cone
        var roof = makeMesh(new THREE.ConeGeometry(9, 3.5, 4), 0x8b6914);
        roof.position.set(ox, 5.75, oz);
        roof.rotation.y = Math.PI / 4;
        addObj(roof);

        // Chimney
        var chimney = makeMesh(new THREE.BoxGeometry(1.2, 4, 1.2), 0xa09080);
        chimney.position.set(ox + 3, 6, oz);
        addObj(chimney);

        // Small porch
        var porch = makeMesh(new THREE.BoxGeometry(3, 3, 2), 0xc0a070);
        porch.position.set(ox, 1.5, oz - 5);
        addObj(porch);
        var porchRoof = makeMesh(new THREE.ConeGeometry(2.5, 1.5, 4), 0x7a5a10);
        porchRoof.position.set(ox, 3.75, oz - 5);
        porchRoof.rotation.y = Math.PI / 4;
        addObj(porchRoof);

        // Garden wall
        var gardenWall = makeMesh(new THREE.BoxGeometry(20, 1.5, 0.5), 0xb0906a);
        gardenWall.position.set(ox, 0.75, oz - 9);
        addObj(gardenWall);

        // Woodland edge trees
        var i;
        for (i = 0; i < 8; i++) {
            var tx = ox - 15 + i * 5;
            var trunk = makeMesh(new THREE.CylinderGeometry(0.4, 0.5, 5, 6), 0x5a3a1a);
            trunk.position.set(tx, 2.5, oz + 12);
            addObj(trunk);
            var canopy = makeMesh(new THREE.SphereGeometry(3, 6, 5), 0x2d5a1a);
            canopy.position.set(tx, 7, oz + 12);
            addObj(canopy);
        }

        // Path stones
        for (i = 0; i < 5; i++) {
            var stone = makeMesh(new THREE.BoxGeometry(1, 0.2, 1), 0x909090);
            stone.position.set(ox, 0.1, oz - 6 - i * 1.2);
            addObj(stone);
        }
    }

    function buildMaidenCastle() {
        var ox = 13680 - 800;
        var oz = 600;
        var i, angle, x, z;

        // Three concentric rampart rings
        var rings = [
            { rx: 120, rz: 80, h: 8, color: 0x6b5a3e },
            { rx: 90, rz: 60, h: 6, color: 0x7a6a4e },
            { rx: 60, rz: 40, h: 4, color: 0x8a7a5e }
        ];

        var r, numSegs, ra;
        for (r = 0; r < rings.length; r++) {
            numSegs = 24;
            for (i = 0; i < numSegs; i++) {
                angle = (i / numSegs) * Math.PI * 2;
                x = ox + Math.cos(angle) * rings[r].rx;
                z = oz + Math.sin(angle) * rings[r].rz;

                // Skip eastern gateway gap
                if (angle > -0.3 && angle < 0.3) {
                    continue;
                }
                var rampart = makeMesh(new THREE.BoxGeometry(14, rings[r].h, 10), rings[r].color);
                rampart.position.set(x, rings[r].h / 2, z);
                rampart.rotation.y = angle;
                addObj(rampart);
            }
        }

        // Complex eastern gateway — overlapping banks
        var gateBank1 = makeMesh(new THREE.BoxGeometry(8, 7, 25), 0x6b5a3e);
        gateBank1.position.set(ox + 96, 3.5, oz - 15);
        addObj(gateBank1);
        var gateBank2 = makeMesh(new THREE.BoxGeometry(8, 7, 25), 0x6b5a3e);
        gateBank2.position.set(ox + 96, 3.5, oz + 15);
        addObj(gateBank2);
        var gateBank3 = makeMesh(new THREE.BoxGeometry(8, 5, 20), 0x7a6a4e);
        gateBank3.position.set(ox + 108, 2.5, oz - 10);
        addObj(gateBank3);
        var gateBank4 = makeMesh(new THREE.BoxGeometry(8, 5, 20), 0x7a6a4e);
        gateBank4.position.set(ox + 108, 2.5, oz + 10);
        addObj(gateBank4);

        // Inner enclosure floor
        var innerFloor = makeMesh(new THREE.CylinderGeometry(55, 55, 0.5, 24), 0x9a8a6a);
        innerFloor.position.set(ox, 0.25, oz);
        addObj(innerFloor);

        // Hillfort summit marker
        var summit = makeMesh(new THREE.CylinderGeometry(2, 3, 5, 8), 0x8a7a5e);
        summit.position.set(ox, 2.5, oz);
        addObj(summit);
    }

    function buildDorchesterTown() {
        var ox = 13680;
        var oz = -100;
        var i;

        // South Street — road surface
        var southStreet = makeMesh(new THREE.BoxGeometry(10, 0.2, 200), 0x808080);
        southStreet.position.set(ox, 0.1, oz);
        addObj(southStreet);

        // Pavement
        var pavementL = makeMesh(new THREE.BoxGeometry(4, 0.15, 200), 0xb0a090);
        pavementL.position.set(ox - 7, 0.075, oz);
        addObj(pavementL);
        var pavementR = makeMesh(new THREE.BoxGeometry(4, 0.15, 200), 0xb0a090);
        pavementR.position.set(ox + 7, 0.075, oz);
        addObj(pavementR);

        // Row of townhouses — west side
        for (i = 0; i < 6; i++) {
            var houseW = makeMesh(new THREE.BoxGeometry(10, 12, 9), 0xc8b090);
            houseW.position.set(ox - 16, 6, oz - 60 + i * 22);
            addObj(houseW);
            var roofW = makeMesh(new THREE.ConeGeometry(7.5, 4, 4), 0x8a6a50);
            roofW.position.set(ox - 16, 14, oz - 60 + i * 22);
            roofW.rotation.y = Math.PI / 4;
            addObj(roofW);
        }

        // Row of townhouses — east side
        for (i = 0; i < 6; i++) {
            var houseE = makeMesh(new THREE.BoxGeometry(10, 12, 9), 0xd0b898);
            houseE.position.set(ox + 16, 6, oz - 60 + i * 22);
            addObj(houseE);
            var roofE = makeMesh(new THREE.ConeGeometry(7.5, 4, 4), 0x8a6a50);
            roofE.position.set(ox + 16, 14, oz - 60 + i * 22);
            roofE.rotation.y = Math.PI / 4;
            addObj(roofE);
        }

        // Judge Jeffreys Restaurant (former assizes court) — prominent corner building
        var judgeBuilding = makeMesh(new THREE.BoxGeometry(16, 16, 12), 0xe0d0b0);
        judgeBuilding.position.set(ox - 18, 8, oz - 80);
        addObj(judgeBuilding);
        var judgeRoof = makeMesh(new THREE.BoxGeometry(17, 2, 13), 0xb0a080);
        judgeRoof.position.set(ox - 18, 17, oz - 80);
        addObj(judgeRoof);
        // Columned portico
        var col1 = makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 14, 8), 0xf0e8d0);
        col1.position.set(ox - 13, 7, oz - 87);
        addObj(col1);
        var col2 = makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 14, 8), 0xf0e8d0);
        col2.position.set(ox - 16, 7, oz - 87);
        addObj(col2);
        var col3 = makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 14, 8), 0xf0e8d0);
        col3.position.set(ox - 19, 7, oz - 87);
        addObj(col3);

        // Dorset Museum — Victorian Gothic building
        var museum = makeMesh(new THREE.BoxGeometry(22, 18, 16), 0xd4c4a0);
        museum.position.set(ox + 24, 9, oz - 70);
        addObj(museum);
        var museumTower = makeMesh(new THREE.BoxGeometry(6, 28, 6), 0xc8b890);
        museumTower.position.set(ox + 20, 14, oz - 70);
        addObj(museumTower);
        var museumSpire = makeMesh(new THREE.ConeGeometry(4, 8, 4), 0xa09070);
        museumSpire.position.set(ox + 20, 32, oz - 70);
        museumSpire.rotation.y = Math.PI / 4;
        addObj(museumSpire);

        // County Hall — large civic building
        var countyHall = makeMesh(new THREE.BoxGeometry(40, 20, 20), 0xc8c0b0);
        countyHall.position.set(ox - 60, 10, oz + 60);
        addObj(countyHall);
        var countyRoof = makeMesh(new THREE.BoxGeometry(42, 3, 22), 0xb0a890);
        countyRoof.position.set(ox - 60, 21.5, oz + 60);
        addObj(countyRoof);
        var countyTower = makeMesh(new THREE.BoxGeometry(8, 30, 8), 0xd0c8b8);
        countyTower.position.set(ox - 60, 15, oz + 60);
        addObj(countyTower);

        // Street lamps along South Street
        for (i = 0; i < 5; i++) {
            var lampPost = makeMesh(new THREE.CylinderGeometry(0.15, 0.2, 8, 6), 0x404040);
            lampPost.position.set(ox - 6, 4, oz - 80 + i * 35);
            addObj(lampPost);
            var lampHead = makeMesh(new THREE.SphereGeometry(0.5, 6, 4), 0xffff80);
            lampHead.position.set(ox - 6, 8.5, oz - 80 + i * 35);
            addObj(lampHead);
        }
    }

    function buildHardyStatue() {
        var ox = 13680 + 5;
        var oz = -140;

        // Plinth
        var plinth = makeMesh(new THREE.BoxGeometry(3, 2, 3), 0x909080);
        plinth.position.set(ox, 1, oz);
        addObj(plinth);

        // Seated body torso
        var torso = makeMesh(new THREE.BoxGeometry(1.2, 1.6, 0.9), 0x5a5a6a);
        torso.position.set(ox, 3.4, oz);
        addObj(torso);

        // Head
        var head = makeMesh(new THREE.SphereGeometry(0.45, 8, 6), 0xd4a070);
        head.position.set(ox, 4.65, oz);
        addObj(head);

        // Seated legs
        var legs = makeMesh(new THREE.BoxGeometry(1.2, 0.6, 1.1), 0x5a5a6a);
        legs.position.set(ox, 2.3, oz + 0.3);
        addObj(legs);

        // Arm holding notebook
        var arm = makeMesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), 0x5a5a6a);
        arm.position.set(ox + 0.7, 3.3, oz - 0.2);
        arm.rotation.z = 0.4;
        addObj(arm);

        // Notebook
        var notebook = makeMesh(new THREE.BoxGeometry(0.6, 0.1, 0.8), 0xe8d8b0);
        notebook.position.set(ox + 0.8, 2.9, oz + 0.1);
        addObj(notebook);

        // Hat
        var hat = makeMesh(new THREE.CylinderGeometry(0.4, 0.5, 0.6, 8), 0x3a3a3a);
        hat.position.set(ox, 5.15, oz);
        addObj(hat);
        var hatBrim = makeMesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 8), 0x3a3a3a);
        hatBrim.position.set(ox, 4.85, oz);
        addObj(hatBrim);

        // Surrounding paving
        var paving = makeMesh(new THREE.CylinderGeometry(4, 4, 0.1, 12), 0xa0a090);
        paving.position.set(ox, 0.05, oz);
        addObj(paving);
    }

    function buildPoundbury() {
        var ox = 13680 - 300;
        var oz = -300;
        var i, row, col;

        // Neo-traditional housing blocks — Duchy of Cornwall housing
        var housePalette = [0xd4b896, 0xc8c0b0, 0xe0d0b8, 0xc8a878, 0xd8c8a8];
        for (row = 0; row < 4; row++) {
            for (col = 0; col < 5; col++) {
                var hc = housePalette[(row * 5 + col) % housePalette.length];
                var house = makeMesh(new THREE.BoxGeometry(9, 10, 8), hc);
                house.position.set(ox - 30 + col * 18, 5, oz - 20 + row * 22);
                addObj(house);
                var hRoof = makeMesh(new THREE.ConeGeometry(7, 4, 4), 0x7a6a5a);
                hRoof.position.set(ox - 30 + col * 18, 12, oz - 20 + row * 22);
                hRoof.rotation.y = Math.PI / 4;
                addObj(hRoof);
                var hChimney = makeMesh(new THREE.BoxGeometry(0.9, 3, 0.9), 0xa09080);
                hChimney.position.set(ox - 30 + col * 18 + 2, 14, oz - 20 + row * 22);
                addObj(hChimney);
            }
        }

        // Market Hall — central civic building
        var marketHall = makeMesh(new THREE.BoxGeometry(20, 12, 14), 0xe8dcc8);
        marketHall.position.set(ox + 20, 6, oz + 60);
        addObj(marketHall);
        var marketRoof = makeMesh(new THREE.ConeGeometry(13, 6, 4), 0xa08860);
        marketRoof.position.set(ox + 20, 15, oz + 60);
        marketRoof.rotation.y = Math.PI / 4;
        addObj(marketRoof);

        // Market hall columns
        var marketCols = [
            [ox + 10, oz + 53],
            [ox + 30, oz + 53],
            [ox + 10, oz + 67],
            [ox + 30, oz + 67]
        ];
        for (i = 0; i < marketCols.length; i++) {
            var mcol = makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 10, 8), 0xf0e8d8);
            mcol.position.set(marketCols[i][0], 5, marketCols[i][1]);
            addObj(mcol);
        }

        // Poundbury streets
        var streetH = makeMesh(new THREE.BoxGeometry(120, 0.15, 8), 0x787878);
        streetH.position.set(ox + 15, 0.075, oz + 30);
        addObj(streetH);
        var streetV = makeMesh(new THREE.BoxGeometry(8, 0.15, 100), 0x787878);
        streetV.position.set(ox - 5, 0.075, oz + 35);
        addObj(streetV);

        // Roundabout at junction
        var roundabout = makeMesh(new THREE.CylinderGeometry(6, 6, 0.2, 12), 0x808070);
        roundabout.position.set(ox - 5, 0.1, oz + 30);
        addObj(roundabout);
        var roundIsland = makeMesh(new THREE.CylinderGeometry(3, 3, 0.5, 12), 0x508030);
        roundIsland.position.set(ox - 5, 0.25, oz + 30);
        addObj(roundIsland);

        // Duchy of Cornwall stone marker
        var dcMarker = makeMesh(new THREE.BoxGeometry(1.5, 4, 0.4), 0xd0c8b8);
        dcMarker.position.set(ox - 5, 2, oz - 5);
        addObj(dcMarker);
    }

    function build() {
        buildMaumburyRings();
        buildHardysCottage();
        buildMaidenCastle();
        buildDorchesterTown();
        buildHardyStatue();
        buildPoundbury();
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
