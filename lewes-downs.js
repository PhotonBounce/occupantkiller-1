window.LewesDowns = (function() {
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

    function makeMaterial(color, options) {
        var opts = options || {};
        opts.color = color;
        return new THREE.MeshLambertMaterial(opts);
    }

    function buildCastle() {
        var X = 10400;
        // Motte 1 — main mound (cylinder base)
        var motte1Geo = new THREE.CylinderGeometry(18, 24, 14, 8);
        var earthMat = makeMaterial(0x6b5a3e);
        var motte1 = new THREE.Mesh(motte1Geo, earthMat);
        motte1.position.set(X - 20, 7, -180);
        addMesh(motte1);

        // Keep on motte 1
        var keep1Geo = new THREE.BoxGeometry(16, 20, 16);
        var flintMat = makeMaterial(0x888878);
        var keep1 = new THREE.Mesh(keep1Geo, flintMat);
        keep1.position.set(X - 20, 25, -180);
        addMesh(keep1);

        // Partial ruined wall on motte 1 (north section missing — ruin effect)
        var wall1aGeo = new THREE.BoxGeometry(2, 12, 20);
        var wall1a = new THREE.Mesh(wall1aGeo, flintMat);
        wall1a.position.set(X - 29, 20, -183);
        addMesh(wall1a);

        var wall1bGeo = new THREE.BoxGeometry(20, 8, 2);
        var wall1b = new THREE.Mesh(wall1bGeo, flintMat);
        wall1b.position.set(X - 20, 18, -173);
        addMesh(wall1b);

        // Motte 2 — western mound
        var motte2Geo = new THREE.CylinderGeometry(14, 20, 10, 8);
        var motte2 = new THREE.Mesh(motte2Geo, earthMat);
        motte2.position.set(X + 60, 5, -190);
        addMesh(motte2);

        // Partial tower on motte 2
        var tower2Geo = new THREE.CylinderGeometry(7, 8, 18, 8);
        var tower2 = new THREE.Mesh(tower2Geo, flintMat);
        tower2.position.set(X + 60, 20, -190);
        addMesh(tower2);

        // Ruined wall stub on motte 2
        var wallStubGeo = new THREE.BoxGeometry(2, 10, 14);
        var wallStub = new THREE.Mesh(wallStubGeo, flintMat);
        wallStub.position.set(X + 70, 15, -190);
        addMesh(wallStub);

        // Barbican gatehouse — arch represented with two pillars and lintel
        var pillarMat = makeMaterial(0x777766);

        var pillar1Geo = new THREE.BoxGeometry(4, 20, 4);
        var pillar1 = new THREE.Mesh(pillar1Geo, pillarMat);
        pillar1.position.set(X + 5, 10, -170);
        addMesh(pillar1);

        var pillar2Geo = new THREE.BoxGeometry(4, 20, 4);
        var pillar2 = new THREE.Mesh(pillar2Geo, pillarMat);
        pillar2.position.set(X + 17, 10, -170);
        addMesh(pillar2);

        // Lintel over arch
        var lintelGeo = new THREE.BoxGeometry(16, 3, 4);
        var lintel = new THREE.Mesh(lintelGeo, pillarMat);
        lintel.position.set(X + 11, 21, -170);
        addMesh(lintel);

        // Arch roundel (sphere approximating arch crown)
        var archGeo = new THREE.SphereGeometry(4, 8, 6, 0, Math.PI);
        var arch = new THREE.Mesh(archGeo, pillarMat);
        arch.position.set(X + 11, 20, -170);
        arch.rotation.z = Math.PI;
        addMesh(arch);

        // Gatehouse side walls
        var gateWallGeo = new THREE.BoxGeometry(2, 20, 14);
        var gateWallL = new THREE.Mesh(gateWallGeo, flintMat);
        gateWallL.position.set(X + 3, 10, -164);
        addMesh(gateWallL);

        var gateWallRGeo = new THREE.BoxGeometry(2, 20, 14);
        var gateWallR = new THREE.Mesh(gateWallRGeo, flintMat);
        gateWallR.position.set(X + 19, 10, -164);
        addMesh(gateWallR);

        // Curtain wall section connecting the two mottes
        var curtainGeo = new THREE.BoxGeometry(78, 6, 2);
        var curtainMat = makeMaterial(0x7a7a6a);
        var curtain = new THREE.Mesh(curtainGeo, curtainMat);
        curtain.position.set(X + 20, 8, -196);
        addMesh(curtain);

        // Crenellations along curtain wall (small box merlons)
        var merlonMat = makeMaterial(0x7a7a6a);
        for (var m = 0; m < 8; m++) {
            var merlonGeo = new THREE.BoxGeometry(4, 3, 2);
            var merlon = new THREE.Mesh(merlonGeo, merlonMat);
            merlon.position.set(X - 18 + m * 10, 12, -196);
            addMesh(merlon);
        }
    }

    function buildSouthDowns() {
        var X = 10400;
        var downsMat = makeMaterial(0x7a9a4a);
        var chalkMat = makeMaterial(0xf0ede0);
        var downs2Mat = makeMaterial(0x8aaa5a);

        // Ridge — stacked box terrain layers rising behind town
        var ridge1Geo = new THREE.BoxGeometry(400, 8, 120);
        var ridge1 = new THREE.Mesh(ridge1Geo, downsMat);
        ridge1.position.set(X, 4, -360);
        addMesh(ridge1);

        var ridge2Geo = new THREE.BoxGeometry(380, 10, 100);
        var ridge2 = new THREE.Mesh(ridge2Geo, downs2Mat);
        ridge2.position.set(X, 14, -390);
        addMesh(ridge2);

        var ridge3Geo = new THREE.BoxGeometry(350, 12, 80);
        var ridge3 = new THREE.Mesh(ridge3Geo, downsMat);
        ridge3.position.set(X, 26, -420);
        addMesh(ridge3);

        var ridge4Geo = new THREE.BoxGeometry(310, 14, 60);
        var ridge4 = new THREE.Mesh(ridge4Geo, downs2Mat);
        ridge4.position.set(X, 40, -445);
        addMesh(ridge4);

        var peakGeo = new THREE.BoxGeometry(260, 16, 40);
        var peak = new THREE.Mesh(peakGeo, downsMat);
        peak.position.set(X, 55, -462);
        addMesh(peak);

        // Chalk white path strips across the downs
        var path1Geo = new THREE.BoxGeometry(4, 1, 100);
        var path1 = new THREE.Mesh(path1Geo, chalkMat);
        path1.position.set(X - 30, 64, -420);
        path1.rotation.y = 0.3;
        addMesh(path1);

        var path2Geo = new THREE.BoxGeometry(4, 1, 80);
        var path2 = new THREE.Mesh(path2Geo, chalkMat);
        path2.position.set(X + 50, 64, -435);
        path2.rotation.y = -0.2;
        addMesh(path2);

        // Chalk cliff face at far end
        var cliffGeo = new THREE.BoxGeometry(300, 50, 10);
        var cliffMat = makeMaterial(0xf5f2e8);
        var cliff = new THREE.Mesh(cliffGeo, cliffMat);
        cliff.position.set(X, 38, -480);
        addMesh(cliff);
    }

    function buildCliffeHighStreet() {
        var X = 10400;
        var georgianMat = makeMaterial(0xc8a878);
        var shopMat = makeMaterial(0xb89868);
        var roofMat = makeMaterial(0x5a4030);
        var windowMat = makeMaterial(0x8abacc);
        var brickMat = makeMaterial(0xb06040);

        // Row of Georgian facades — south side of High Street
        for (var i = 0; i < 8; i++) {
            var facadeGeo = new THREE.BoxGeometry(10, 14, 8);
            var facade = new THREE.Mesh(facadeGeo, i % 2 === 0 ? georgianMat : shopMat);
            facade.position.set(X - 60 + i * 12, 7, -80);
            addMesh(facade);

            // Roof
            var rfGeo = new THREE.BoxGeometry(11, 4, 9);
            var rf = new THREE.Mesh(rfGeo, roofMat);
            rf.position.set(X - 60 + i * 12, 16, -80);
            addMesh(rf);

            // Window (flat box)
            var winGeo = new THREE.BoxGeometry(3, 3, 1);
            var win = new THREE.Mesh(winGeo, windowMat);
            win.position.set(X - 60 + i * 12, 9, -76);
            addMesh(win);
        }

        // North side of High Street — antique shops, slightly varied height
        for (var j = 0; j < 7; j++) {
            var shopGeo = new THREE.BoxGeometry(11, 12 + j % 3 * 2, 8);
            var shop = new THREE.Mesh(shopGeo, j % 3 === 0 ? brickMat : georgianMat);
            shop.position.set(X - 54 + j * 13, 6 + j % 3, -100);
            addMesh(shop);

            var shopRoofGeo = new THREE.BoxGeometry(12, 3, 9);
            var shopRoof = new THREE.Mesh(shopRoofGeo, roofMat);
            shopRoof.position.set(X - 54 + j * 13, 14 + j % 3 * 2, -100);
            addMesh(shopRoof);
        }

        // Harvey's Brewery building — brick, taller
        var breweryGeo = new THREE.BoxGeometry(28, 22, 20);
        var breweryMat = makeMaterial(0x8b4a2a);
        var brewery = new THREE.Mesh(breweryGeo, breweryMat);
        brewery.position.set(X + 80, 11, -90);
        addMesh(brewery);

        var brewRoofGeo = new THREE.BoxGeometry(30, 6, 22);
        var brewRoof = new THREE.Mesh(brewRoofGeo, roofMat);
        brewRoof.position.set(X + 80, 25, -90);
        addMesh(brewRoof);

        // Copper vat cylinders visible above brewery roof
        var copperMat = makeMaterial(0xb87333);
        for (var v = 0; v < 3; v++) {
            var vatGeo = new THREE.CylinderGeometry(4, 4, 12, 10);
            var vat = new THREE.Mesh(vatGeo, copperMat);
            vat.position.set(X + 70 + v * 10, 35, -90);
            addMesh(vat);

            // Vat dome top
            var vatDomeGeo = new THREE.SphereGeometry(4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
            var vatDome = new THREE.Mesh(vatDomeGeo, copperMat);
            vatDome.position.set(X + 70 + v * 10, 41, -90);
            addMesh(vatDome);
        }

        // Brewery chimney
        var chimneyGeo = new THREE.CylinderGeometry(1.5, 2, 20, 8);
        var chimney = new THREE.Mesh(chimneyGeo, breweryMat);
        chimney.position.set(X + 90, 32, -85);
        addMesh(chimney);

        // Street surface
        var streetGeo = new THREE.BoxGeometry(160, 0.5, 22);
        var streetMat = makeMaterial(0x888880);
        var street = new THREE.Mesh(streetGeo, streetMat);
        street.position.set(X - 10, 0.25, -90);
        addMesh(street);
    }

    function buildRiverOuse() {
        var X = 10400;
        var waterMat = makeMaterial(0x3a6a8a);
        var stoneMat = makeMaterial(0x8a8070);
        var bankMat = makeMaterial(0x5a7040);

        // River channel — flowing south (long Z strip)
        var riverGeo = new THREE.BoxGeometry(18, 0.8, 400);
        var river = new THREE.Mesh(riverGeo, waterMat);
        river.position.set(X + 150, 0.4, -50);
        addMesh(river);

        // River banks
        var bank1Geo = new THREE.BoxGeometry(6, 2, 400);
        var bank1 = new THREE.Mesh(bank1Geo, bankMat);
        bank1.position.set(X + 141, 1, -50);
        addMesh(bank1);

        var bank2Geo = new THREE.BoxGeometry(6, 2, 400);
        var bank2 = new THREE.Mesh(bank2Geo, bankMat);
        bank2.position.set(X + 159, 1, -50);
        addMesh(bank2);

        // Stone bridge — two arch piers and road deck
        var pier1Geo = new THREE.BoxGeometry(4, 8, 8);
        var pier1 = new THREE.Mesh(pier1Geo, stoneMat);
        pier1.position.set(X + 145, 4, -120);
        addMesh(pier1);

        var pier2Geo = new THREE.BoxGeometry(4, 8, 8);
        var pier2 = new THREE.Mesh(pier2Geo, stoneMat);
        pier2.position.set(X + 155, 4, -120);
        addMesh(pier2);

        // Bridge deck
        var deckGeo = new THREE.BoxGeometry(30, 2, 10);
        var deck = new THREE.Mesh(deckGeo, stoneMat);
        deck.position.set(X + 150, 9, -120);
        addMesh(deck);

        // Bridge arch approximation using CylinderGeometry halved
        var arch1Geo = new THREE.CylinderGeometry(5, 5, 8, 8, 1, false, 0, Math.PI);
        var arch1 = new THREE.Mesh(arch1Geo, stoneMat);
        arch1.position.set(X + 150, 5, -116);
        arch1.rotation.x = Math.PI / 2;
        arch1.rotation.z = Math.PI / 2;
        addMesh(arch1);

        // Bridge parapets
        var parapet1Geo = new THREE.BoxGeometry(30, 3, 2);
        var parapet1 = new THREE.Mesh(parapet1Geo, stoneMat);
        parapet1.position.set(X + 150, 11, -115);
        addMesh(parapet1);

        var parapet2Geo = new THREE.BoxGeometry(30, 3, 2);
        var parapet2 = new THREE.Mesh(parapet2Geo, stoneMat);
        parapet2.position.set(X + 150, 11, -125);
        addMesh(parapet2);

        // Additional bridge (northern crossing)
        var pier3Geo = new THREE.BoxGeometry(4, 8, 8);
        var pier3 = new THREE.Mesh(pier3Geo, stoneMat);
        pier3.position.set(X + 145, 4, -60);
        addMesh(pier3);

        var pier4Geo = new THREE.BoxGeometry(4, 8, 8);
        var pier4 = new THREE.Mesh(pier4Geo, stoneMat);
        pier4.position.set(X + 155, 4, -60);
        addMesh(pier4);

        var deck2Geo = new THREE.BoxGeometry(30, 2, 10);
        var deck2 = new THREE.Mesh(deck2Geo, stoneMat);
        deck2.position.set(X + 150, 9, -60);
        addMesh(deck2);
    }

    function buildBonfirememorial() {
        var X = 10400;
        var woodMat = makeMaterial(0x6a3a1a);
        var fireMat = makeMaterial(0xcc4400);
        var emberMat = makeMaterial(0xff8800);
        var squareMat = makeMaterial(0x888870);

        // Town square paving
        var squareGeo = new THREE.BoxGeometry(50, 0.5, 50);
        var square = new THREE.Mesh(squareGeo, squareMat);
        square.position.set(X + 20, 0.25, -40);
        addMesh(square);

        // Central bonfire — tall posts arranged in circle
        var postAngles = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, 5 * Math.PI / 4, 3 * Math.PI / 2, 7 * Math.PI / 4];
        for (var p = 0; p < postAngles.length; p++) {
            var ang = postAngles[p];
            var postGeo = new THREE.CylinderGeometry(0.6, 0.9, 10, 6);
            var post = new THREE.Mesh(postGeo, woodMat);
            post.position.set(
                X + 20 + Math.cos(ang) * 5,
                5,
                -40 + Math.sin(ang) * 5
            );
            post.rotation.x = Math.cos(ang) * 0.15;
            post.rotation.z = Math.sin(ang) * -0.15;
            addMesh(post);
        }

        // Inner fire core — cone of flames
        var fireGeo = new THREE.ConeGeometry(4, 8, 8);
        var fire = new THREE.Mesh(fireGeo, fireMat);
        fire.position.set(X + 20, 4, -40);
        addMesh(fire);

        var fire2Geo = new THREE.ConeGeometry(2.5, 6, 8);
        var fire2 = new THREE.Mesh(fire2Geo, emberMat);
        fire2.position.set(X + 20, 7, -40);
        addMesh(fire2);

        // Effigy frame — cross post (Guy Fawkes effigy)
        var effigyPostGeo = new THREE.CylinderGeometry(0.5, 0.5, 14, 6);
        var effigyPost = new THREE.Mesh(effigyPostGeo, woodMat);
        effigyPost.position.set(X + 20, 7, -40);
        addMesh(effigyPost);

        // Crossbar of effigy
        var crossbarGeo = new THREE.CylinderGeometry(0.4, 0.4, 10, 6);
        var crossbar = new THREE.Mesh(crossbarGeo, woodMat);
        crossbar.position.set(X + 20, 11, -40);
        crossbar.rotation.z = Math.PI / 2;
        addMesh(crossbar);

        // Effigy head
        var headGeo = new THREE.SphereGeometry(1.2, 8, 8);
        var headMat = makeMaterial(0xdaa070);
        var head = new THREE.Mesh(headGeo, headMat);
        head.position.set(X + 20, 15.5, -40);
        addMesh(head);

        // Effigy hat (cone)
        var hatGeo = new THREE.ConeGeometry(1.4, 2.5, 8);
        var hatMat = makeMaterial(0x222222);
        var hat = new THREE.Mesh(hatGeo, hatMat);
        hat.position.set(X + 20, 17.5, -40);
        addMesh(hat);

        // Surrounding torches on poles around the square
        var torchMat = makeMaterial(0x5a2a0a);
        var torchFireMat = makeMaterial(0xff6600);
        var torchPositions = [
            [X - 5, -15], [X + 45, -15],
            [X - 5, -65], [X + 45, -65]
        ];
        for (var t = 0; t < torchPositions.length; t++) {
            var tpx = torchPositions[t][0];
            var tpz = torchPositions[t][1];

            var torchPoleGeo = new THREE.CylinderGeometry(0.3, 0.4, 7, 6);
            var torchPole = new THREE.Mesh(torchPoleGeo, torchMat);
            torchPole.position.set(tpx, 3.5, tpz);
            addMesh(torchPole);

            var torchFlameGeo = new THREE.ConeGeometry(0.6, 1.5, 6);
            var torchFlame = new THREE.Mesh(torchFlameGeo, torchFireMat);
            torchFlame.position.set(tpx, 8, tpz);
            addMesh(torchFlame);
        }

        // Bonfire society barrels stacked at edge of square
        var barrelMat = makeMaterial(0x7a4a20);
        for (var b = 0; b < 4; b++) {
            var barrelGeo = new THREE.CylinderGeometry(1.2, 1.2, 2, 8);
            var barrel = new THREE.Mesh(barrelGeo, barrelMat);
            barrel.position.set(X - 10 + b * 3, 1, -30);
            addMesh(barrel);
        }
        // Second stack row
        for (var b2 = 0; b2 < 3; b2++) {
            var barrel2Geo = new THREE.CylinderGeometry(1.2, 1.2, 2, 8);
            var barrel2 = new THREE.Mesh(barrel2Geo, barrelMat);
            barrel2.position.set(X - 8.5 + b2 * 3, 3, -30);
            addMesh(barrel2);
        }
    }

    function buildGroundplane() {
        var X = 10400;
        var groundGeo = new THREE.BoxGeometry(500, 1, 600);
        var groundMat = makeMaterial(0x5a7040);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(X, -0.5, -140);
        addMesh(ground);
    }

    function build() {
        buildGroundplane();
        buildCastle();
        buildSouthDowns();
        buildCliffeHighStreet();
        buildRiverOuse();
        buildBonfirememorial();
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
