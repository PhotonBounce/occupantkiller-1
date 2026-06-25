window.WaterfordViking = (function() {
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

    function makeMesh(geometry, color) {
        return new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: color }));
    }

    function build() {
        var cx = 17800;
        var cz = 0;

        // ----------------------------------------------------------------
        // REGINALD'S TOWER
        // ----------------------------------------------------------------
        // Main tower body
        var rTower = makeMesh(new THREE.CylinderGeometry(4, 4.5, 14, 12), 0x8B7355);
        rTower.position.set(cx, 7, cz);
        addMesh(rTower);

        // Tower top parapet ring
        var rParapet = makeMesh(new THREE.CylinderGeometry(4.6, 4.6, 1.2, 12), 0x7A6445);
        rParapet.position.set(cx, 14.6, cz);
        addMesh(rParapet);

        // Cone roof
        var rRoof = makeMesh(new THREE.ConeGeometry(4.8, 5, 12), 0x2F4F4F);
        rRoof.position.set(cx, 19.5, cz);
        addMesh(rRoof);

        // Slit windows (thin dark boxes cut into tower face)
        var winOffsets = [
            [0, 4, 4.3],
            [4.3, 4, 0],
            [0, 4, -4.3],
            [-4.3, 4, 0],
            [0, 9, 4.3],
            [4.3, 9, 0]
        ];
        for (var w = 0; w < winOffsets.length; w++) {
            var win = makeMesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), 0x111111);
            win.position.set(cx + winOffsets[w][0], winOffsets[w][1], cz + winOffsets[w][2]);
            addMesh(win);
        }

        // Tower doorway arch base
        var rDoor = makeMesh(new THREE.BoxGeometry(1.8, 2.5, 0.4), 0x1a1a1a);
        rDoor.position.set(cx + 4.2, 1.25, cz);
        addMesh(rDoor);

        // ----------------------------------------------------------------
        // MEDIEVAL CITY WALLS
        // ----------------------------------------------------------------
        var wallColor = 0x808080;
        var wallSegments = [
            [cx - 40, 3, cz - 30,  80, 6, 2],
            [cx - 40, 3, cz + 30,  80, 6, 2],
            [cx - 40, 3, cz,       2,  6, 62],
            [cx + 40, 3, cz,       2,  6, 62]
        ];
        for (var ws = 0; ws < wallSegments.length; ws++) {
            var seg = wallSegments[ws];
            var wall = makeMesh(new THREE.BoxGeometry(seg[3], seg[4], seg[5]), wallColor);
            wall.position.set(seg[0], seg[1], seg[2]);
            addMesh(wall);
        }

        // Wall merlons (battlements) along north wall
        for (var m = 0; m < 10; m++) {
            var merlon = makeMesh(new THREE.BoxGeometry(2, 1.5, 1.5), wallColor);
            merlon.position.set(cx - 37 + m * 8, 7.25, cz - 30);
            addMesh(merlon);
        }

        // Round corner towers on city wall
        var cornerTowers = [
            [cx - 40, cz - 30],
            [cx + 40, cz - 30],
            [cx - 40, cz + 30],
            [cx + 40, cz + 30]
        ];
        for (var ct = 0; ct < cornerTowers.length; ct++) {
            var ctower = makeMesh(new THREE.CylinderGeometry(3, 3, 8, 10), wallColor);
            ctower.position.set(cornerTowers[ct][0], 4, cornerTowers[ct][1]);
            addMesh(ctower);
            var ctRoof = makeMesh(new THREE.ConeGeometry(3.2, 3, 10), 0x2F4F4F);
            ctRoof.position.set(cornerTowers[ct][0], 9.5, cornerTowers[ct][1]);
            addMesh(ctRoof);
        }

        // Mid-wall towers
        var midTowers = [
            [cx, cz - 30],
            [cx, cz + 30]
        ];
        for (var mt = 0; mt < midTowers.length; mt++) {
            var mtower = makeMesh(new THREE.CylinderGeometry(2.5, 2.5, 9, 10), wallColor);
            mtower.position.set(midTowers[mt][0], 4.5, midTowers[mt][1]);
            addMesh(mtower);
            var mtRoof = makeMesh(new THREE.ConeGeometry(2.7, 2.5, 10), 0x2F4F4F);
            mtRoof.position.set(midTowers[mt][0], 10.25, midTowers[mt][1]);
            addMesh(mtRoof);
        }

        // ----------------------------------------------------------------
        // RIVER SUIR (north of settlement)
        // ----------------------------------------------------------------
        var riverColor = 0x006994;
        // River surface (wide, low box)
        var river = makeMesh(new THREE.BoxGeometry(150, 0.4, 30), riverColor);
        river.position.set(cx + 10, -0.2, cz - 55);
        addMesh(river);

        // Quay wall along north bank
        var quayWall = makeMesh(new THREE.BoxGeometry(150, 3, 2), 0x696969);
        quayWall.position.set(cx + 10, 1.5, cz - 40);
        addMesh(quayWall);

        // Quay cobble surface
        var quaySurface = makeMesh(new THREE.BoxGeometry(150, 0.3, 8), 0x555555);
        quaySurface.position.set(cx + 10, 0.15, cz - 37);
        addMesh(quaySurface);

        // ----------------------------------------------------------------
        // VIKING LONGSHIPS (3 ships at quay)
        // ----------------------------------------------------------------
        var shipPositions = [
            [cx - 30, cz - 50],
            [cx,      cz - 52],
            [cx + 30, cz - 50]
        ];
        for (var s = 0; s < 3; s++) {
            var sx = shipPositions[s][0];
            var sz = shipPositions[s][1];

            // Hull segments (series of boxes tapering like a hull)
            var hullColor = 0x5C3D1E;
            var hullSegs = [
                [0,    0, 0,    10,  0.5, 2.8],
                [-4,   0, 0,    2,   0.5, 2.4],
                [4,    0, 0,    2,   0.5, 2.4],
                [-5.5, 0, 0,    1,   0.5, 1.8],
                [5.5,  0, 0,    1,   0.5, 1.8]
            ];
            for (var hs = 0; hs < hullSegs.length; hs++) {
                var hull = makeMesh(new THREE.BoxGeometry(hullSegs[hs][3], hullSegs[hs][4], hullSegs[hs][5]), hullColor);
                hull.position.set(sx + hullSegs[hs][0], hullSegs[hs][1], sz + hullSegs[hs][2]);
                addMesh(hull);
            }

            // Hull sides (raised gunwales)
            var gunwale1 = makeMesh(new THREE.BoxGeometry(12, 0.8, 0.3), 0x4A2E0E);
            gunwale1.position.set(sx, 0.65, sz + 1.4);
            addMesh(gunwale1);
            var gunwale2 = makeMesh(new THREE.BoxGeometry(12, 0.8, 0.3), 0x4A2E0E);
            gunwale2.position.set(sx, 0.65, sz - 1.4);
            addMesh(gunwale2);

            // Dragon prow (cone at bow)
            var prow = makeMesh(new THREE.ConeGeometry(0.5, 2.5, 6), 0x8B0000);
            prow.rotation.z = -Math.PI / 2;
            prow.position.set(sx + 7.2, 1.2, sz);
            addMesh(prow);

            // Stern post
            var stern = makeMesh(new THREE.ConeGeometry(0.4, 2, 6), 0x8B0000);
            stern.rotation.z = Math.PI / 2;
            stern.position.set(sx - 7.2, 1.2, sz);
            addMesh(stern);

            // Mast
            var mast = makeMesh(new THREE.CylinderGeometry(0.15, 0.2, 7, 6), 0x6B4226);
            mast.position.set(sx, 3.5, sz);
            addMesh(mast);

            // Striped sail (red and off-white alternating boxes)
            var sailColors = [0x8B0000, 0xF5F0E8, 0x8B0000, 0xF5F0E8];
            for (var sc = 0; sc < 4; sc++) {
                var sailStripe = makeMesh(new THREE.BoxGeometry(0.15, 1.2, 2.8), sailColors[sc]);
                sailStripe.position.set(sx, 3.5 + (sc - 1.5) * 1.25, sz);
                addMesh(sailStripe);
            }

            // Yard arm (horizontal spar)
            var yard = makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 6), 0x6B4226);
            yard.rotation.z = Math.PI / 2;
            yard.position.set(sx, 7, sz);
            addMesh(yard);

            // Round shields along gunwale
            var shieldColors = [0xCC0000, 0xFFCC00];
            for (var sh = 0; sh < 4; sh++) {
                var shield = makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 0.12, 8), shieldColors[sh % 2]);
                shield.rotation.x = Math.PI / 2;
                shield.position.set(sx - 3 + sh * 2, 0.8, sz + 1.6);
                addMesh(shield);
            }
        }

        // ----------------------------------------------------------------
        // VIKING SETTLEMENT LONGHOUSES (8 houses)
        // ----------------------------------------------------------------
        var housePositions = [
            [cx - 20, cz + 5],
            [cx - 8,  cz + 5],
            [cx + 5,  cz + 5],
            [cx + 18, cz + 5],
            [cx - 20, cz + 20],
            [cx - 8,  cz + 20],
            [cx + 5,  cz + 20],
            [cx + 18, cz + 20],
            [cx - 14, cz - 12],
            [cx + 12, cz - 12]
        ];
        var wallDaub = 0xC4A35A;
        var thatchBrown = 0x8B4513;
        for (var h = 0; h < housePositions.length; h++) {
            var hx = housePositions[h][0];
            var hz = housePositions[h][1];
            // Walls
            var houseWall = makeMesh(new THREE.BoxGeometry(10, 3, 5), wallDaub);
            houseWall.position.set(hx, 1.5, hz);
            addMesh(houseWall);
            // Roof (thatch box, slightly wider and taller)
            var houseRoof = makeMesh(new THREE.BoxGeometry(11, 1.5, 5.8), thatchBrown);
            houseRoof.position.set(hx, 3.75, hz);
            addMesh(houseRoof);
            // Roof ridge
            var ridge = makeMesh(new THREE.BoxGeometry(10.5, 0.6, 1), 0x5C2E00);
            ridge.position.set(hx, 4.8, hz);
            addMesh(ridge);
            // Door opening (dark box)
            var door = makeMesh(new THREE.BoxGeometry(0.2, 2, 1.2), 0x1a1a1a);
            door.position.set(hx + 5.05, 1.0, hz);
            addMesh(door);
        }

        // ----------------------------------------------------------------
        // CHRIST CHURCH CATHEDRAL
        // ----------------------------------------------------------------
        var cathX = cx + 20;
        var cathZ = cz + 10;
        var stoneGray = 0x808080;

        // Nave body
        var nave = makeMesh(new THREE.BoxGeometry(16, 8, 10), stoneGray);
        nave.position.set(cathX, 4, cathZ);
        addMesh(nave);

        // Chancel (east end)
        var chancel = makeMesh(new THREE.BoxGeometry(8, 7, 8), stoneGray);
        chancel.position.set(cathX + 12, 3.5, cathZ);
        addMesh(chancel);

        // Transept (north arm)
        var transeptN = makeMesh(new THREE.BoxGeometry(6, 7, 8), stoneGray);
        transeptN.position.set(cathX, 3.5, cathZ - 9);
        addMesh(transeptN);

        // Transept (south arm)
        var transeptS = makeMesh(new THREE.BoxGeometry(6, 7, 8), stoneGray);
        transeptS.position.set(cathX, 3.5, cathZ + 9);
        addMesh(transeptS);

        // Dome over crossing
        var dome = makeMesh(new THREE.SphereGeometry(3.5, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0x2F4F4F);
        dome.position.set(cathX, 8, cathZ);
        addMesh(dome);

        // Drum under dome
        var drum = makeMesh(new THREE.CylinderGeometry(3.5, 3.5, 2, 10), stoneGray);
        drum.position.set(cathX, 8.5, cathZ);
        addMesh(drum);

        // Portico columns (front facade)
        var colPositions = [-4, -2, 0, 2, 4];
        for (var col = 0; col < colPositions.length; col++) {
            var column = makeMesh(new THREE.CylinderGeometry(0.35, 0.4, 6, 8), 0x909090);
            column.position.set(cathX - 8.5, 3, cathZ + colPositions[col]);
            addMesh(column);
        }

        // Portico pediment
        var pediment = makeMesh(new THREE.BoxGeometry(1.5, 2, 11), stoneGray);
        pediment.position.set(cathX - 8.5, 7.5, cathZ);
        addMesh(pediment);

        // Bell tower
        var bellTower = makeMesh(new THREE.BoxGeometry(4, 14, 4), stoneGray);
        bellTower.position.set(cathX - 10, 7, cathZ - 4);
        addMesh(bellTower);
        var bellSpire = makeMesh(new THREE.ConeGeometry(2.2, 5, 4), 0x2F4F4F);
        bellSpire.position.set(cathX - 10, 16.5, cathZ - 4);
        addMesh(bellSpire);

        // ----------------------------------------------------------------
        // WATERFORD CRYSTAL SHOWROOM
        // ----------------------------------------------------------------
        var crysX = cx - 25;
        var crysZ = cz + 10;
        var silverColor = 0xC0C0C0;
        var glassBlue = 0x87CEEB;

        // Main building body
        var crysMain = makeMesh(new THREE.BoxGeometry(18, 7, 12), silverColor);
        crysMain.position.set(crysX, 3.5, crysZ);
        addMesh(crysMain);

        // Glass facade panels (front face)
        var panelOffsets = [-6, -2, 2, 6];
        for (var gp = 0; gp < panelOffsets.length; gp++) {
            var glassPanel = makeMesh(new THREE.BoxGeometry(0.15, 5, 2.8), glassBlue);
            glassPanel.position.set(crysX + 9.1, 3.5, crysZ + panelOffsets[gp]);
            addMesh(glassPanel);
        }

        // Entrance canopy
        var canopy = makeMesh(new THREE.BoxGeometry(6, 0.3, 4), silverColor);
        canopy.position.set(crysX + 9, 4.5, crysZ);
        addMesh(canopy);

        // Signage box
        var signage = makeMesh(new THREE.BoxGeometry(0.2, 1.5, 8), 0xA8A8A8);
        signage.position.set(crysX + 9.1, 6.75, crysZ);
        addMesh(signage);

        // ----------------------------------------------------------------
        // VIKING ARCHAEOLOGICAL DIG SITE
        // ----------------------------------------------------------------
        var digX = cx + 30;
        var digZ = cz - 15;

        // Dig pit floor
        var pitFloor = makeMesh(new THREE.BoxGeometry(20, 0.5, 16), 0x7B5C2A);
        pitFloor.position.set(digX, -0.75, digZ);
        addMesh(pitFloor);

        // Pit walls
        var pitWallN = makeMesh(new THREE.BoxGeometry(20, 1.5, 0.5), 0x8B6914);
        pitWallN.position.set(digX, 0.25, digZ - 8);
        addMesh(pitWallN);
        var pitWallS = makeMesh(new THREE.BoxGeometry(20, 1.5, 0.5), 0x8B6914);
        pitWallS.position.set(digX, 0.25, digZ + 8);
        addMesh(pitWallS);
        var pitWallE = makeMesh(new THREE.BoxGeometry(0.5, 1.5, 16), 0x8B6914);
        pitWallE.position.set(digX + 10, 0.25, digZ);
        addMesh(pitWallE);
        var pitWallW = makeMesh(new THREE.BoxGeometry(0.5, 1.5, 16), 0x8B6914);
        pitWallW.position.set(digX - 10, 0.25, digZ);
        addMesh(pitWallW);

        // Excavation trench grid (rows of raised earth strips)
        for (var tr = 0; tr < 3; tr++) {
            for (var tc = 0; tc < 4; tc++) {
                var trench = makeMesh(new THREE.BoxGeometry(0.4, 0.5, 5), 0x5C3D11);
                trench.position.set(digX - 7 + tc * 4.5, -0.3, digZ - 4 + tr * 4);
                addMesh(trench);
            }
        }

        // Archaeology equipment: wooden stakes
        var stakeOffsets = [-8, -5, 0, 5, 8];
        for (var st = 0; st < stakeOffsets.length; st++) {
            var stake = makeMesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 4), 0x8B5E3C);
            stake.position.set(digX + stakeOffsets[st], 0.1, digZ - 7.5);
            addMesh(stake);
        }

        // ----------------------------------------------------------------
        // MARKET CROSS
        // ----------------------------------------------------------------
        var crossX = cx - 5;
        var crossZ = cz - 5;

        // Base plinth
        var crossBase = makeMesh(new THREE.BoxGeometry(2, 0.8, 2), 0x999999);
        crossBase.position.set(crossX, 0.4, crossZ);
        addMesh(crossBase);

        // Shaft
        var crossShaft = makeMesh(new THREE.BoxGeometry(0.5, 5, 0.5), 0x888888);
        crossShaft.position.set(crossX, 3.3, crossZ);
        addMesh(crossShaft);

        // Horizontal arms (cylinder)
        var crossArms = makeMesh(new THREE.CylinderGeometry(0.22, 0.22, 3, 8), 0x888888);
        crossArms.rotation.z = Math.PI / 2;
        crossArms.position.set(crossX, 4.5, crossZ);
        addMesh(crossArms);

        // Top cap
        var crossTop = makeMesh(new THREE.BoxGeometry(0.5, 0.8, 0.5), 0x888888);
        crossTop.position.set(crossX, 6.2, crossZ);
        addMesh(crossTop);

        // Cross circle ring (Celtic cross motif)
        var crossRing = makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 0.3, 12), 0x777777);
        crossRing.rotation.x = Math.PI / 2;
        crossRing.position.set(crossX, 4.5, crossZ);
        addMesh(crossRing);

        // ----------------------------------------------------------------
        // QUAY WAREHOUSES (Georgian brick, along river)
        // ----------------------------------------------------------------
        var brickRed = 0xCD5C5C;
        var warehousePositions = [
            [cx - 50, cz - 36],
            [cx - 35, cz - 36],
            [cx - 20, cz - 36],
            [cx - 5,  cz - 36],
            [cx + 10, cz - 36],
            [cx + 25, cz - 36]
        ];
        for (var wh = 0; wh < warehousePositions.length; wh++) {
            var whx = warehousePositions[wh][0];
            var whz = warehousePositions[wh][1];

            // Warehouse body
            var warehouse = makeMesh(new THREE.BoxGeometry(12, 9, 8), brickRed);
            warehouse.position.set(whx, 4.5, whz);
            addMesh(warehouse);

            // Roof (flat with parapet)
            var whRoof = makeMesh(new THREE.BoxGeometry(12.8, 0.8, 8.8), 0x8B3A3A);
            whRoof.position.set(whx, 9.4, whz);
            addMesh(whRoof);

            // Windows (dark boxes on facade)
            for (var ww = 0; ww < 3; ww++) {
                var wWindow = makeMesh(new THREE.BoxGeometry(0.2, 1.5, 1.2), 0x1a1a1a);
                wWindow.position.set(whx + 6.1, 5.5 + Math.floor(ww / 3) * 3, whz - 2.5 + (ww % 3) * 2.5);
                addMesh(wWindow);
            }

            // Loading door
            var loadDoor = makeMesh(new THREE.BoxGeometry(0.2, 3, 2.5), 0x2a1a0a);
            loadDoor.position.set(whx + 6.1, 1.5, whz);
            addMesh(loadDoor);
        }

        // ----------------------------------------------------------------
        // ADDITIONAL VIKING SETTLEMENT DETAILS
        // ----------------------------------------------------------------
        // Central fire pit area (stone circle)
        var firePitX = cx - 2;
        var firePitZ = cz - 8;
        var fireStones = 8;
        for (var fs = 0; fs < fireStones; fs++) {
            var angle = (fs / fireStones) * Math.PI * 2;
            var fstone = makeMesh(new THREE.BoxGeometry(0.6, 0.4, 0.6), 0x666666);
            fstone.position.set(
                firePitX + Math.cos(angle) * 2.5,
                0.2,
                firePitZ + Math.sin(angle) * 2.5
            );
            addMesh(fstone);
        }

        // Fire embers (small orange sphere)
        var embers = makeMesh(new THREE.SphereGeometry(0.5, 6, 6), 0xFF6600);
        embers.position.set(firePitX, 0.3, firePitZ);
        addMesh(embers);

        // Well
        var wellX = cx + 8;
        var wellZ = cz - 8;
        var wellBase = makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 1, 10), 0x888888);
        wellBase.position.set(wellX, 0.5, wellZ);
        addMesh(wellBase);
        var wellRim = makeMesh(new THREE.CylinderGeometry(1.4, 1.4, 0.3, 10), 0x777777);
        wellRim.position.set(wellX, 1.15, wellZ);
        addMesh(wellRim);
        var wellPost1 = makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 6), 0x5C3D1E);
        wellPost1.position.set(wellX - 0.9, 2, wellZ);
        addMesh(wellPost1);
        var wellPost2 = makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 6), 0x5C3D1E);
        wellPost2.position.set(wellX + 0.9, 2, wellZ);
        addMesh(wellPost2);
        var wellBeam = makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 6), 0x5C3D1E);
        wellBeam.rotation.z = Math.PI / 2;
        wellBeam.position.set(wellX, 3, wellZ);
        addMesh(wellBeam);

        // ----------------------------------------------------------------
        // GROUND PLANE (as boxes to avoid PlaneGeometry)
        // ----------------------------------------------------------------
        // Settlement ground
        var ground = makeMesh(new THREE.BoxGeometry(160, 0.3, 100), 0x5A4A2A);
        ground.position.set(cx, -0.15, cz);
        addMesh(ground);

        // Cobblestone streets (lighter strips)
        var streetOffsets = [-10, 0, 10];
        for (var st2 = 0; st2 < streetOffsets.length; st2++) {
            var street = makeMesh(new THREE.BoxGeometry(80, 0.31, 3), 0x8a8a7a);
            street.position.set(cx, 0.0, cz + streetOffsets[st2]);
            addMesh(street);
        }

        // ----------------------------------------------------------------
        // WATERFORD CITY GATE (Arched entrance in wall)
        // ----------------------------------------------------------------
        var gateX = cx;
        var gateZ = cz - 30;

        // Gate tower left
        var gateL = makeMesh(new THREE.BoxGeometry(4, 10, 5), wallColor);
        gateL.position.set(gateX - 4, 5, gateZ);
        addMesh(gateL);

        // Gate tower right
        var gateR = makeMesh(new THREE.BoxGeometry(4, 10, 5), wallColor);
        gateR.position.set(gateX + 4, 5, gateZ);
        addMesh(gateR);

        // Gate lintel
        var gateLint = makeMesh(new THREE.BoxGeometry(4, 1.5, 5), wallColor);
        gateLint.position.set(gateX, 7.75, gateZ);
        addMesh(gateLint);

        // Portcullis (dark bars)
        for (var pg = 0; pg < 4; pg++) {
            var bar = makeMesh(new THREE.BoxGeometry(0.25, 6, 0.25), 0x333333);
            bar.position.set(gateX - 1.5 + pg * 1, 3.5, gateZ);
            addMesh(bar);
        }

        // ----------------------------------------------------------------
        // WOODEN PALISADE (inner Viking settlement fence)
        // ----------------------------------------------------------------
        for (var p = 0; p < 12; p++) {
            var pale = makeMesh(new THREE.BoxGeometry(0.4, 3, 0.4), 0x6B4226);
            pale.position.set(cx - 28 + p * 3, 1.5, cz - 1);
            addMesh(pale);
        }

        // Palisade top spikes (cones)
        for (var ps = 0; ps < 12; ps++) {
            var spike = makeMesh(new THREE.ConeGeometry(0.25, 0.7, 4), 0x5A3520);
            spike.position.set(cx - 28 + ps * 3, 3.35, cz - 1);
            addMesh(spike);
        }

        // ----------------------------------------------------------------
        // STONE STEPS up to Reginald's Tower entrance
        // ----------------------------------------------------------------
        for (var step = 0; step < 4; step++) {
            var stair = makeMesh(new THREE.BoxGeometry(2.5, 0.35, 0.6), 0x9A8A6A);
            stair.position.set(cx + 4.5 + step * 0.6, step * 0.35, cz);
            addMesh(stair);
        }

        // ----------------------------------------------------------------
        // RIVER MOORING POSTS
        // ----------------------------------------------------------------
        var moorPostX = [cx - 40, cx - 30, cx - 20, cx - 10, cx, cx + 10, cx + 20, cx + 30];
        for (var mp = 0; mp < moorPostX.length; mp++) {
            var moorPost = makeMesh(new THREE.CylinderGeometry(0.2, 0.25, 3, 6), 0x5C3D1E);
            moorPost.position.set(moorPostX[mp], 1.5, cz - 40);
            addMesh(moorPost);
        }

        // ----------------------------------------------------------------
        // DECORATIVE BOLLARDS along quay
        // ----------------------------------------------------------------
        for (var b = 0; b < 10; b++) {
            var bollard = makeMesh(new THREE.CylinderGeometry(0.18, 0.22, 1, 8), 0x444444);
            bollard.position.set(cx - 45 + b * 10, 0.5, cz - 39);
            addMesh(bollard);
            var bollardTop = makeMesh(new THREE.SphereGeometry(0.22, 8, 8), 0x444444);
            bollardTop.position.set(cx - 45 + b * 10, 1.22, cz - 39);
            addMesh(bollardTop);
        }
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
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
