window.GravesendThames = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 10880;

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

    function makeMat(color, opts) {
        var cfg = { color: color };
        if (opts) {
            if (opts.side !== undefined) cfg.side = opts.side;
        }
        return new THREE.MeshLambertMaterial(cfg);
    }

    function buildThamesRiver() {
        // Very wide Thames river — 80 units wide, running along z axis
        var riverGeo = new THREE.BoxGeometry(80, 0.5, 600);
        var riverMat = makeMat(0x6b7a6b);
        var river = new THREE.Mesh(riverGeo, riverMat);
        river.position.set(X_OFFSET, -0.5, 0);
        addObj(river);

        // Ripple/tide bands
        for (var r = 0; r < 6; r++) {
            var bandGeo = new THREE.BoxGeometry(80, 0.1, 2);
            var bandMat = makeMat(0x7a8878);
            var band = new THREE.Mesh(bandGeo, bandMat);
            band.position.set(X_OFFSET, -0.2, -120 + r * 40);
            addObj(band);
        }
    }

    function buildGravesendPier() {
        // Pier deck extending from south bank into river
        var deckGeo = new THREE.BoxGeometry(4, 0.5, 60);
        var deckMat = makeMat(0x8b7355);
        var deck = new THREE.Mesh(deckGeo, deckMat);
        deck.position.set(X_OFFSET - 30, 0.5, -40);
        addObj(deck);

        // Cast-iron pier legs
        for (var p = 0; p < 10; p++) {
            var legGeo = new THREE.CylinderGeometry(0.15, 0.15, 3, 6);
            var legMat = makeMat(0x555555);
            var leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(X_OFFSET - 31 + (p % 2) * 2, -1, -10 - p * 5);
            addObj(leg);
        }

        // Pier head building — Victorian ornate box
        var headBaseGeo = new THREE.BoxGeometry(8, 3, 6);
        var headBaseMat = makeMat(0xc8b89a);
        var headBase = new THREE.Mesh(headBaseGeo, headBaseMat);
        headBase.position.set(X_OFFSET - 30, 2, -68);
        addObj(headBase);

        // Pier head roof
        var headRoofGeo = new THREE.BoxGeometry(9, 0.8, 7);
        var headRoofMat = makeMat(0x5a4a3a);
        var headRoof = new THREE.Mesh(headRoofGeo, headRoofMat);
        headRoof.position.set(X_OFFSET - 30, 3.7, -68);
        addObj(headRoof);

        // Ornate roof lantern
        var lanternGeo = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 8);
        var lanternMat = makeMat(0x4a7a5a);
        var lantern = new THREE.Mesh(lanternGeo, lanternMat);
        lantern.position.set(X_OFFSET - 30, 4.9, -68);
        addObj(lantern);

        // Steps down to water — series of flat boxes
        for (var s = 0; s < 5; s++) {
            var stepGeo = new THREE.BoxGeometry(4, 0.3, 1);
            var stepMat = makeMat(0xa09080);
            var step = new THREE.Mesh(stepGeo, stepMat);
            step.position.set(X_OFFSET - 30, -s * 0.35, -9 + s * 1.1);
            addObj(step);
        }

        // Pier entrance gate posts
        var post1Geo = new THREE.CylinderGeometry(0.2, 0.2, 4, 8);
        var postMat = makeMat(0x888888);
        var post1 = new THREE.Mesh(post1Geo, postMat);
        post1.position.set(X_OFFSET - 32, 2, -8);
        addObj(post1);

        var post2Geo = new THREE.CylinderGeometry(0.2, 0.2, 4, 8);
        var post2 = new THREE.Mesh(post2Geo, postMat);
        post2.position.set(X_OFFSET - 28, 2, -8);
        addObj(post2);

        // Gate lintel
        var lintelGeo = new THREE.BoxGeometry(5, 0.5, 0.4);
        var lintelMat = makeMat(0x888888);
        var lintel = new THREE.Mesh(lintelGeo, lintelMat);
        lintel.position.set(X_OFFSET - 30, 4.2, -8);
        addObj(lintel);
    }

    function buildContainerShip(zPos) {
        // Long box hull
        var hullGeo = new THREE.BoxGeometry(8, 2.5, 40);
        var hullMat = makeMat(0x3a5a7a);
        var hull = new THREE.Mesh(hullGeo, hullMat);
        hull.position.set(X_OFFSET, 0.5, zPos);
        addObj(hull);

        // Hull bow taper
        var bowGeo = new THREE.CylinderGeometry(0, 4, 3, 4);
        var bowMat = makeMat(0x3a5a7a);
        var bow = new THREE.Mesh(bowGeo, bowMat);
        bow.rotation.x = Math.PI / 2;
        bow.rotation.z = Math.PI / 4;
        bow.position.set(X_OFFSET, 0.5, zPos - 21);
        addObj(bow);

        // Container stacks — rows of boxes on deck
        for (var row = 0; row < 4; row++) {
            for (var col = 0; col < 3; col++) {
                var colors = [0xc84040, 0x4040c8, 0x40a840, 0xc8a040];
                var cGeo = new THREE.BoxGeometry(2.2, 1.5, 2.8);
                var cMat = makeMat(colors[(row + col) % 4]);
                var container = new THREE.Mesh(cGeo, cMat);
                container.position.set(
                    X_OFFSET - 2.5 + col * 2.5,
                    2.5 + Math.floor(row / 2) * 1.6,
                    zPos - 12 + (row % 2) * 6
                );
                addObj(container);
            }
        }

        // Bridge superstructure
        var bridgeGeo = new THREE.BoxGeometry(6, 5, 8);
        var bridgeMat = makeMat(0xe8e0d0);
        var bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridge.position.set(X_OFFSET, 4.5, zPos + 14);
        addObj(bridge);

        // Bridge wings
        var wingGeo = new THREE.BoxGeometry(9, 1, 1);
        var wingMat = makeMat(0xd8d0c0);
        var wing = new THREE.Mesh(wingGeo, wingMat);
        wing.position.set(X_OFFSET, 6.5, zPos + 14);
        addObj(wing);

        // Funnel
        var funnelGeo = new THREE.CylinderGeometry(0.6, 0.8, 3, 8);
        var funnelMat = makeMat(0x2a2a2a);
        var funnel = new THREE.Mesh(funnelGeo, funnelMat);
        funnel.position.set(X_OFFSET, 9.5, zPos + 12);
        addObj(funnel);

        // Mast forward
        var mastGeo = new THREE.CylinderGeometry(0.1, 0.1, 8, 6);
        var mastMat = makeMat(0xc0b090);
        var mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(X_OFFSET, 5, zPos - 15);
        addObj(mast);
    }

    function buildTilburyChimneys() {
        // Tilbury power station chimneys on far bank (north)
        var chimneyPositions = [
            { x: X_OFFSET - 15, z: 60 },
            { x: X_OFFSET - 8,  z: 62 },
            { x: X_OFFSET + 2,  z: 58 },
            { x: X_OFFSET + 10, z: 63 }
        ];

        for (var c = 0; c < chimneyPositions.length; c++) {
            var chGeo = new THREE.CylinderGeometry(0.8, 1.1, 30, 8);
            var chMat = makeMat(0xc8c0b8);
            var chimney = new THREE.Mesh(chGeo, chMat);
            chimney.position.set(chimneyPositions[c].x, 15, chimneyPositions[c].z);
            addObj(chimney);

            // Red warning band near top
            var bandGeo = new THREE.CylinderGeometry(0.85, 0.85, 1, 8);
            var bandMat = makeMat(0xcc2020);
            var warnBand = new THREE.Mesh(bandGeo, bandMat);
            warnBand.position.set(chimneyPositions[c].x, 26, chimneyPositions[c].z);
            addObj(warnBand);

            // Smoke puff suggestion
            var smokeGeo = new THREE.SphereGeometry(1.5, 6, 6);
            var smokeMat = makeMat(0xcccccc);
            var smoke = new THREE.Mesh(smokeGeo, smokeMat);
            smoke.position.set(chimneyPositions[c].x, 32, chimneyPositions[c].z);
            addObj(smoke);
        }

        // Power station building on far bank
        var psGeo = new THREE.BoxGeometry(35, 10, 18);
        var psMat = makeMat(0xb8b0a0);
        var ps = new THREE.Mesh(psGeo, psMat);
        ps.position.set(X_OFFSET - 3, 5, 55);
        addObj(ps);
    }

    function buildPocahontasMemorial() {
        // St George's Church Norman tower
        var towerGeo = new THREE.BoxGeometry(6, 16, 6);
        var towerMat = makeMat(0xa09070);
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(X_OFFSET + 25, 8, -50);
        addObj(tower);

        // Tower crenellations
        for (var cr = 0; cr < 4; cr++) {
            var crenGeo = new THREE.BoxGeometry(1.2, 1.5, 1.2);
            var crenMat = makeMat(0xa09070);
            var cren = new THREE.Mesh(crenGeo, crenMat);
            var angle = (cr / 4) * Math.PI * 2;
            cren.position.set(
                X_OFFSET + 25 + Math.cos(angle) * 2.2,
                17,
                -50 + Math.sin(angle) * 2.2
            );
            addObj(cren);
        }

        // Church nave
        var naveGeo = new THREE.BoxGeometry(12, 8, 22);
        var naveMat = makeMat(0xa09070);
        var nave = new THREE.Mesh(naveGeo, naveMat);
        nave.position.set(X_OFFSET + 25, 4, -42);
        addObj(nave);

        // Nave roof (box approximation)
        var roofGeo = new THREE.BoxGeometry(13, 3, 23);
        var roofMat = makeMat(0x606060);
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(X_OFFSET + 25, 9.5, -42);
        addObj(roof);

        // Pocahontas memorial plinth
        var plinthGeo = new THREE.BoxGeometry(2, 1.5, 2);
        var plinthMat = makeMat(0xd0c8b8);
        var plinth = new THREE.Mesh(plinthGeo, plinthMat);
        plinth.position.set(X_OFFSET + 18, 0.75, -48);
        addObj(plinth);

        // Figure suggestion on plinth — stacked cylinders/sphere
        var bodyGeo = new THREE.CylinderGeometry(0.25, 0.35, 1.4, 8);
        var figureMat = makeMat(0x8b6a40);
        var body = new THREE.Mesh(bodyGeo, figureMat);
        body.position.set(X_OFFSET + 18, 2.2, -48);
        addObj(body);

        var headGeo = new THREE.SphereGeometry(0.22, 8, 8);
        var head = new THREE.Mesh(headGeo, figureMat);
        head.position.set(X_OFFSET + 18, 3.1, -48);
        addObj(head);

        // Outstretched arm suggestion
        var armGeo = new THREE.BoxGeometry(0.8, 0.12, 0.12);
        var arm = new THREE.Mesh(armGeo, figureMat);
        arm.position.set(X_OFFSET + 18, 2.5, -48);
        addObj(arm);

        // Memorial inscription block
        var inscGeo = new THREE.BoxGeometry(2.5, 0.5, 0.2);
        var inscMat = makeMat(0xe8e0d0);
        var insc = new THREE.Mesh(inscGeo, inscMat);
        insc.position.set(X_OFFSET + 18, 1.3, -47.1);
        addObj(insc);

        // Low churchyard wall
        for (var w = 0; w < 5; w++) {
            var wallGeo = new THREE.BoxGeometry(5, 1.2, 0.4);
            var wallMat = makeMat(0x908878);
            var wall = new THREE.Mesh(wallGeo, wallMat);
            wall.position.set(X_OFFSET + 20 + w * 5, 0.6, -33);
            addObj(wall);
        }
    }

    function buildTilburyFort() {
        // Tilbury Fort on far (north) bank — star-shaped earthwork outline
        // Represented as angled bastion walls and main body
        var fortZ = 90;
        var fortX = X_OFFSET;

        // Central fort body
        var bodyGeo = new THREE.BoxGeometry(20, 4, 16);
        var bodyMat = makeMat(0x8a7a5a);
        var fortBody = new THREE.Mesh(bodyGeo, bodyMat);
        fortBody.position.set(fortX, 2, fortZ);
        addObj(fortBody);

        // Earthwork rampart walls — 4 sides
        var rampartDefs = [
            { w: 22, d: 2, x: 0,    z: -10 },
            { w: 22, d: 2, x: 0,    z: 10  },
            { w: 2,  d: 18, x: -11, z: 0   },
            { w: 2,  d: 18, x: 11,  z: 0   }
        ];
        for (var rd = 0; rd < rampartDefs.length; rd++) {
            var rDef = rampartDefs[rd];
            var rGeo = new THREE.BoxGeometry(rDef.w, 3, rDef.d);
            var rMat = makeMat(0x7a6a4a);
            var ramp = new THREE.Mesh(rGeo, rMat);
            ramp.position.set(fortX + rDef.x, 1.5, fortZ + rDef.z);
            addObj(ramp);
        }

        // Bastions at corners — angled diamond shapes approximated as rotated boxes
        var bastionCorners = [
            { x: -11, z: -10 },
            { x:  11, z: -10 },
            { x: -11, z:  10 },
            { x:  11, z:  10 }
        ];
        for (var bc = 0; bc < bastionCorners.length; bc++) {
            var bGeo = new THREE.BoxGeometry(5, 3, 5);
            var bMat = makeMat(0x6a5a3a);
            var bastion = new THREE.Mesh(bGeo, bMat);
            bastion.rotation.y = Math.PI / 4;
            bastion.position.set(fortX + bastionCorners[bc].x, 1.5, fortZ + bastionCorners[bc].z);
            addObj(bastion);
        }

        // Water Gate — columns and archway facing river
        var gatePlatformGeo = new THREE.BoxGeometry(10, 1, 4);
        var gatePlatformMat = makeMat(0xd0c8b0);
        var gatePlatform = new THREE.Mesh(gatePlatformGeo, gatePlatformMat);
        gatePlatform.position.set(fortX, 3.5, fortZ - 12);
        addObj(gatePlatform);

        // Gate columns x4
        var colPositions = [-3.5, -1.2, 1.2, 3.5];
        for (var cp = 0; cp < colPositions.length; cp++) {
            var colGeo = new THREE.CylinderGeometry(0.3, 0.35, 4, 8);
            var colMat = makeMat(0xe0d8c0);
            var col = new THREE.Mesh(colGeo, colMat);
            col.position.set(fortX + colPositions[cp], 5.5, fortZ - 12);
            addObj(col);
        }

        // Gate entablature
        var entabGeo = new THREE.BoxGeometry(9, 1, 1.5);
        var entabMat = makeMat(0xd8d0b8);
        var entab = new THREE.Mesh(entabGeo, entabMat);
        entab.position.set(fortX, 7.8, fortZ - 12);
        addObj(entab);

        // Gate pediment
        var pedGeo = new THREE.ConeGeometry(4.5, 2, 4);
        var pedMat = makeMat(0xd0c8b0);
        var ped = new THREE.Mesh(pedGeo, pedMat);
        ped.rotation.y = Math.PI / 4;
        ped.position.set(fortX, 9.5, fortZ - 12);
        addObj(ped);

        // Moat suggestion — thin flat blue strip around fort
        var moatGeo = new THREE.BoxGeometry(30, 0.2, 30);
        var moatMat = makeMat(0x5a6a7a);
        var moat = new THREE.Mesh(moatGeo, moatMat);
        moat.position.set(fortX, -0.1, fortZ);
        addObj(moat);
    }

    function buildThamesBarge(xPos, zPos) {
        // Flat-bottomed barge hull
        var hullGeo = new THREE.BoxGeometry(5, 1.5, 14);
        var hullMat = makeMat(0x3a2a1a);
        var hull = new THREE.Mesh(hullGeo, hullMat);
        hull.position.set(xPos, 0.25, zPos);
        addObj(hull);

        // Low freeboard sides
        var sideGeo = new THREE.BoxGeometry(0.3, 1, 14);
        var sideMat = makeMat(0x2a1a0a);
        var sideL = new THREE.Mesh(sideGeo, sideMat);
        sideL.position.set(xPos - 2.5, 1.0, zPos);
        addObj(sideL);

        var sideR = new THREE.Mesh(sideGeo, sideMat);
        sideR.position.set(xPos + 2.5, 1.0, zPos);
        addObj(sideR);

        // Cargo hold cover — flat box
        var holdGeo = new THREE.BoxGeometry(4, 0.4, 8);
        var holdMat = makeMat(0x5a4a2a);
        var hold = new THREE.Mesh(holdGeo, holdMat);
        hold.position.set(xPos, 1.5, zPos - 1);
        addObj(hold);

        // Spritsail mast — vertical cylinder
        var mastGeo = new THREE.CylinderGeometry(0.1, 0.12, 10, 6);
        var mastMat = makeMat(0x6a4a2a);
        var mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(xPos, 6.5, zPos + 2);
        addObj(mast);

        // Sprit — diagonal pole from mast foot to sail peak (LineSegments)
        var spritPoints = new Float32Array([
            0, 1.5, zPos - 3,
            0, 10.5, zPos + 5
        ]);
        var spritGeo = new THREE.BufferGeometry();
        spritGeo.setAttribute('position', new THREE.BufferAttribute(spritPoints, 3));
        // LineSegments needs pairs; add dummy second segment
        var spritSegs = new Float32Array([
            xPos, 1.5, zPos - 3,
            xPos, 10.5, zPos + 5,
            xPos, 10.5, zPos + 5,
            xPos, 10.5, zPos + 5
        ]);
        var spritBufGeo = new THREE.BufferGeometry();
        spritBufGeo.setAttribute('position', new THREE.BufferAttribute(spritSegs, 3));
        var spritMat = new THREE.LineBasicMaterial({ color: 0x4a3a1a });
        var sprit = new THREE.LineSegments(spritBufGeo, spritMat);
        scene.add(sprit);
        objects.push(sprit);

        // Red-brown sail — flat box frame approximation
        var sailGeo = new THREE.BoxGeometry(4.5, 8, 0.1);
        var sailMat = makeMat(0x8b3a1a);
        var sail = new THREE.Mesh(sailGeo, sailMat);
        sail.position.set(xPos, 6.5, zPos + 2);
        addObj(sail);

        // Mizzen mast (smaller aft mast)
        var mizzGeo = new THREE.CylinderGeometry(0.08, 0.1, 5, 6);
        var mizzMat = makeMat(0x6a4a2a);
        var mizz = new THREE.Mesh(mizzGeo, mizzMat);
        mizz.position.set(xPos, 3.5, zPos - 5);
        addObj(mizz);

        // Mizzen sail
        var mizzSailGeo = new THREE.BoxGeometry(2, 4, 0.1);
        var mizzSailMat = makeMat(0x7a3010);
        var mizzSail = new THREE.Mesh(mizzSailGeo, mizzSailMat);
        mizzSail.position.set(xPos, 4, zPos - 5);
        addObj(mizzSail);

        // Rigging LineSegments — forestay and backstay
        var riggingVerts = new Float32Array([
            xPos, 11.5, zPos + 2,
            xPos, 1.2, zPos - 6,
            xPos, 11.5, zPos + 2,
            xPos, 1.2, zPos + 6
        ]);
        var riggingGeo = new THREE.BufferGeometry();
        riggingGeo.setAttribute('position', new THREE.BufferAttribute(riggingVerts, 3));
        var riggingMat = new THREE.LineBasicMaterial({ color: 0x5a4a30 });
        var rigging = new THREE.LineSegments(riggingGeo, riggingMat);
        scene.add(rigging);
        objects.push(rigging);
    }

    function buildTownBuildings() {
        // Gravesend town buildings along waterfront south bank
        var buildingDefs = [
            { x: X_OFFSET + 35, z: -30, w: 8,  h: 10, d: 8,  color: 0xc8b89a },
            { x: X_OFFSET + 44, z: -28, w: 6,  h: 8,  d: 7,  color: 0xbcac90 },
            { x: X_OFFSET + 51, z: -32, w: 10, h: 14, d: 9,  color: 0xd0c0a8 },
            { x: X_OFFSET + 62, z: -29, w: 7,  h: 9,  d: 8,  color: 0xb8a888 },
            { x: X_OFFSET + 70, z: -31, w: 9,  h: 11, d: 8,  color: 0xc4b498 },
            { x: X_OFFSET - 45, z: -20, w: 8,  h: 8,  d: 7,  color: 0xb0a088 },
            { x: X_OFFSET - 54, z: -22, w: 7,  h: 7,  d: 6,  color: 0xbcac90 },
            { x: X_OFFSET - 63, z: -19, w: 10, h: 12, d: 8,  color: 0xc8b89a }
        ];

        for (var b = 0; b < buildingDefs.length; b++) {
            var def = buildingDefs[b];
            var bGeo = new THREE.BoxGeometry(def.w, def.h, def.d);
            var bMat = makeMat(def.color);
            var bld = new THREE.Mesh(bGeo, bMat);
            bld.position.set(def.x, def.h / 2, def.z);
            addObj(bld);

            // Pitched roof
            var rGeo = new THREE.BoxGeometry(def.w + 0.5, def.h * 0.25, def.d + 0.5);
            var rMat = makeMat(0x5a4a3a);
            var bRoof = new THREE.Mesh(rGeo, rMat);
            bRoof.position.set(def.x, def.h + def.h * 0.125, def.z);
            addObj(bRoof);
        }
    }

    function buildEmbankmentWall() {
        // Stone embankment retaining wall along south bank
        var wallGeo = new THREE.BoxGeometry(200, 3, 1.5);
        var wallMat = makeMat(0x888070);
        var wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(X_OFFSET, 1.5, -12);
        addObj(wall);

        // Wall coping stones
        var copingGeo = new THREE.BoxGeometry(200, 0.4, 2);
        var copingMat = makeMat(0x9a9080);
        var coping = new THREE.Mesh(copingGeo, copingMat);
        coping.position.set(X_OFFSET, 3.2, -12);
        addObj(coping);

        // Mooring bollards along wall
        for (var mb = 0; mb < 12; mb++) {
            var bollardGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.2, 6);
            var bollardMat = makeMat(0x222222);
            var bollard = new THREE.Mesh(bollardGeo, bollardMat);
            bollard.position.set(X_OFFSET - 55 + mb * 10, 3.8, -12);
            addObj(bollard);
        }
    }

    function buildGroundPlane() {
        // South bank ground
        var groundGeo = new THREE.BoxGeometry(200, 0.5, 50);
        var groundMat = makeMat(0x7a7a6a);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(X_OFFSET, -0.25, -37);
        addObj(ground);

        // North bank ground (Tilbury side)
        var northGeo = new THREE.BoxGeometry(200, 0.5, 60);
        var northMat = makeMat(0x6a7060);
        var north = new THREE.Mesh(northGeo, northMat);
        north.position.set(X_OFFSET, -0.25, 70);
        addObj(north);
    }

    function build() {
        buildGroundPlane();
        buildThamesRiver();
        buildEmbankmentWall();
        buildGravesendPier();
        buildContainerShip(20);
        buildContainerShip(-80);
        buildTilburyChimneys();
        buildPocahontasMemorial();
        buildTilburyFort();
        buildThamesBarge(X_OFFSET - 18, -5);
        buildThamesBarge(X_OFFSET + 12, 10);
        buildTownBuildings();
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
