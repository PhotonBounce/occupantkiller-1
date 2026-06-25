window.LindisfarnePost = (function() {
    'use strict';

    var WX = 2740;
    var WZ = 2200;

    function createPriory(scene) {
        var sandstone = new THREE.MeshLambertMaterial({ color: 0xD4A97A });

        // Main nave walls - roofless skeleton boxes
        var naveGeom = new THREE.BoxGeometry(28, 12, 1);

        // North wall
        var northWall = new THREE.Mesh(naveGeom, sandstone);
        northWall.position.set(WX, 6, WZ - 5);
        scene.add(northWall);

        // South wall
        var southWall = new THREE.Mesh(naveGeom, sandstone);
        southWall.position.set(WX, 6, WZ + 5);
        scene.add(southWall);

        // West end wall
        var westGeom = new THREE.BoxGeometry(1, 12, 10);
        var westWall = new THREE.Mesh(westGeom, sandstone);
        westWall.position.set(WX - 14, 6, WZ);
        scene.add(westWall);

        // East end wall (partial ruin)
        var eastGeom = new THREE.BoxGeometry(1, 8, 10);
        var eastWall = new THREE.Mesh(eastGeom, sandstone);
        eastWall.position.set(WX + 14, 4, WZ);
        scene.add(eastWall);

        // Rainbow Arch - left pier
        var pierGeom = new THREE.BoxGeometry(2, 10, 2);
        var leftPier = new THREE.Mesh(pierGeom, sandstone);
        leftPier.position.set(WX + 4, 5, WZ - 4);
        scene.add(leftPier);

        // Rainbow Arch - right pier
        var rightPier = new THREE.Mesh(pierGeom, sandstone);
        rightPier.position.set(WX + 4, 5, WZ + 4);
        scene.add(rightPier);

        // Rainbow Arch - lintel spanning the two piers
        var lintelGeom = new THREE.BoxGeometry(2, 2, 10);
        var lintel = new THREE.Mesh(lintelGeom, sandstone);
        lintel.position.set(WX + 4, 11, WZ);
        scene.add(lintel);

        // Arch crown box (top of arch)
        var crownGeom = new THREE.BoxGeometry(2, 3, 4);
        var crown = new THREE.Mesh(crownGeom, sandstone);
        crown.position.set(WX + 4, 13.5, WZ);
        scene.add(crown);

        // Interior crossing piers
        var interiorPierGeom = new THREE.BoxGeometry(1.5, 10, 1.5);
        var pier1 = new THREE.Mesh(interiorPierGeom, sandstone);
        pier1.position.set(WX - 6, 5, WZ - 4);
        scene.add(pier1);

        var pier2 = new THREE.Mesh(interiorPierGeom, sandstone);
        pier2.position.set(WX - 6, 5, WZ + 4);
        scene.add(pier2);

        var pier3 = new THREE.Mesh(interiorPierGeom, sandstone);
        pier3.position.set(WX + 2, 5, WZ - 4);
        scene.add(pier3);

        var pier4 = new THREE.Mesh(interiorPierGeom, sandstone);
        pier4.position.set(WX + 2, 5, WZ + 4);
        scene.add(pier4);
    }

    function createCastle(scene) {
        var basaltMat = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
        var sandstoneMat = new THREE.MeshLambertMaterial({ color: 0xD4A97A });

        // Basalt cone rock base
        var rockGeom = new THREE.ConeGeometry(8, 10, 8);
        var rock = new THREE.Mesh(rockGeom, basaltMat);
        rock.position.set(WX + 60, 5, WZ - 40);
        scene.add(rock);

        // Castle body on top of rock
        var castleGeom = new THREE.BoxGeometry(10, 8, 8);
        var castle = new THREE.Mesh(castleGeom, sandstoneMat);
        castle.position.set(WX + 60, 14, WZ - 40);
        scene.add(castle);

        // Corner turrets
        var turretGeom = new THREE.CylinderGeometry(1.2, 1.2, 10, 6);
        var turretMat = new THREE.MeshLambertMaterial({ color: 0xC09060 });

        var turret1 = new THREE.Mesh(turretGeom, turretMat);
        turret1.position.set(WX + 55, 15, WZ - 44);
        scene.add(turret1);

        var turret2 = new THREE.Mesh(turretGeom, turretMat);
        turret2.position.set(WX + 65, 15, WZ - 44);
        scene.add(turret2);

        var turret3 = new THREE.Mesh(turretGeom, turretMat);
        turret3.position.set(WX + 55, 15, WZ - 36);
        scene.add(turret3);

        var turret4 = new THREE.Mesh(turretGeom, turretMat);
        turret4.position.set(WX + 65, 15, WZ - 36);
        scene.add(turret4);

        // Turret cone tops
        var coneGeom = new THREE.ConeGeometry(1.5, 3, 6);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

        var cone1 = new THREE.Mesh(coneGeom, coneMat);
        cone1.position.set(WX + 55, 21.5, WZ - 44);
        scene.add(cone1);

        var cone2 = new THREE.Mesh(coneGeom, coneMat);
        cone2.position.set(WX + 65, 21.5, WZ - 44);
        scene.add(cone2);

        var cone3 = new THREE.Mesh(coneGeom, coneMat);
        cone3.position.set(WX + 55, 21.5, WZ - 36);
        scene.add(cone3);

        var cone4 = new THREE.Mesh(coneGeom, coneMat);
        cone4.position.set(WX + 65, 21.5, WZ - 36);
        scene.add(cone4);

        // Keep tower
        var keepGeom = new THREE.BoxGeometry(5, 12, 5);
        var keep = new THREE.Mesh(keepGeom, sandstoneMat);
        keep.position.set(WX + 60, 22, WZ - 40);
        scene.add(keep);
    }

    function createCauseway(scene) {
        var roadMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

        // Long tidal causeway road
        var causeGeom = new THREE.BoxGeometry(60, 1, 4);
        var causeway = new THREE.Mesh(causeGeom, roadMat);
        causeway.position.set(WX - 70, 0.5, WZ + 60);
        scene.add(causeway);

        // Refuge shelter box halfway along
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var shelterBaseGeom = new THREE.BoxGeometry(4, 5, 4);
        var shelterBase = new THREE.Mesh(shelterBaseGeom, shelterMat);
        shelterBase.position.set(WX - 70, 3, WZ + 60);
        scene.add(shelterBase);

        // Refuge shelter raised platform legs
        var legGeom = new THREE.BoxGeometry(0.5, 4, 0.5);
        var legMat = new THREE.MeshLambertMaterial({ color: 0x666666 });

        var leg1 = new THREE.Mesh(legGeom, legMat);
        leg1.position.set(WX - 72, 2, WZ + 58);
        scene.add(leg1);

        var leg2 = new THREE.Mesh(legGeom, legMat);
        leg2.position.set(WX - 68, 2, WZ + 58);
        scene.add(leg2);

        var leg3 = new THREE.Mesh(legGeom, legMat);
        leg3.position.set(WX - 72, 2, WZ + 62);
        scene.add(leg3);

        var leg4 = new THREE.Mesh(legGeom, legMat);
        leg4.position.set(WX - 68, 2, WZ + 62);
        scene.add(leg4);

        // Refuge roof
        var roofGeom = new THREE.BoxGeometry(5, 0.5, 5);
        var roof = new THREE.Mesh(roofGeom, shelterMat);
        roof.position.set(WX - 70, 5.75, WZ + 60);
        scene.add(roof);
    }

    function createVikingWreck(scene) {
        var wreckMat = new THREE.MeshLambertMaterial({ color: 0x2A1A0A });

        // Main hull box - half buried, tilted
        var hullGeom = new THREE.BoxGeometry(16, 2, 5);
        var hull = new THREE.Mesh(hullGeom, wreckMat);
        hull.position.set(WX - 30, 0.5, WZ + 30);
        hull.rotation.y = 0.4;
        scene.add(hull);

        // Prow rising from sand
        var prowGeom = new THREE.BoxGeometry(2, 4, 3);
        var prow = new THREE.Mesh(prowGeom, wreckMat);
        prow.position.set(WX - 22, 2.5, WZ + 28);
        prow.rotation.y = 0.4;
        scene.add(prow);

        // Broken mast
        var mastGeom = new THREE.BoxGeometry(0.6, 8, 0.6);
        var mast = new THREE.Mesh(mastGeom, wreckMat);
        mast.position.set(WX - 30, 4, WZ + 30);
        mast.rotation.z = 0.5;
        scene.add(mast);

        // Ribs of ship sticking up
        var ribGeom = new THREE.BoxGeometry(0.4, 3, 5);
        var rib1 = new THREE.Mesh(ribGeom, wreckMat);
        rib1.position.set(WX - 27, 2, WZ + 30);
        rib1.rotation.y = 0.4;
        scene.add(rib1);

        var rib2 = new THREE.Mesh(ribGeom, wreckMat);
        rib2.position.set(WX - 31, 1.5, WZ + 31);
        rib2.rotation.y = 0.4;
        scene.add(rib2);

        var rib3 = new THREE.Mesh(ribGeom, wreckMat);
        rib3.position.set(WX - 35, 1, WZ + 33);
        rib3.rotation.y = 0.4;
        scene.add(rib3);
    }

    function createStCuthbert(scene) {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });

        // Body - tall thin box figure
        var bodyGeom = new THREE.BoxGeometry(2, 8, 2);
        var body = new THREE.Mesh(bodyGeom, stoneMat);
        body.position.set(WX + 20, 4, WZ + 10);
        scene.add(body);

        // Head
        var headGeom = new THREE.BoxGeometry(1.4, 1.4, 1.4);
        var head = new THREE.Mesh(headGeom, stoneMat);
        head.position.set(WX + 20, 8.7, WZ + 10);
        scene.add(head);

        // Bishop's mitre cone on top
        var mitreMat = new THREE.MeshLambertMaterial({ color: 0xB8A890 });
        var mitreGeom = new THREE.ConeGeometry(0.9, 2.5, 4);
        var mitre = new THREE.Mesh(mitreGeom, mitreMat);
        mitre.position.set(WX + 20, 10.65, WZ + 10);
        scene.add(mitre);

        // Arms extended
        var armGeom = new THREE.BoxGeometry(5, 0.8, 0.8);
        var arms = new THREE.Mesh(armGeom, stoneMat);
        arms.position.set(WX + 20, 6, WZ + 10);
        scene.add(arms);

        // Crozier staff
        var staffGeom = new THREE.BoxGeometry(0.3, 10, 0.3);
        var staff = new THREE.Mesh(staffGeom, stoneMat);
        staff.position.set(WX + 21.5, 5, WZ + 10);
        scene.add(staff);

        // Plinth base
        var plinthGeom = new THREE.BoxGeometry(3, 1.5, 3);
        var plinth = new THREE.Mesh(plinthGeom, stoneMat);
        plinth.position.set(WX + 20, 0.75, WZ + 10);
        scene.add(plinth);
    }

    function createSealColony(scene) {
        var sealMat = new THREE.MeshLambertMaterial({ color: 0x8A8A8A });
        var rockMat = new THREE.MeshLambertMaterial({ color: 0x555555 });

        // Offshore rocks
        var rock1Geom = new THREE.BoxGeometry(6, 1.5, 4);
        var rock1 = new THREE.Mesh(rock1Geom, rockMat);
        rock1.position.set(WX + 80, 0.75, WZ + 20);
        scene.add(rock1);

        var rock2Geom = new THREE.BoxGeometry(4, 1, 3);
        var rock2 = new THREE.Mesh(rock2Geom, rockMat);
        rock2.position.set(WX + 90, 0.5, WZ + 30);
        scene.add(rock2);

        var rock3Geom = new THREE.BoxGeometry(5, 1.2, 5);
        var rock3 = new THREE.Mesh(rock3Geom, rockMat);
        rock3.position.set(WX + 75, 0.6, WZ + 35);
        scene.add(rock3);

        // Seals - grey spheres of various sizes lounging on rocks
        var seal1Geom = new THREE.SphereGeometry(1.2, 6, 6);
        var seal1 = new THREE.Mesh(seal1Geom, sealMat);
        seal1.position.set(WX + 80, 2.2, WZ + 20);
        seal1.scale.set(1.8, 0.7, 1);
        scene.add(seal1);

        var seal2Geom = new THREE.SphereGeometry(1.0, 6, 6);
        var seal2 = new THREE.Mesh(seal2Geom, sealMat);
        seal2.position.set(WX + 82, 2.0, WZ + 21);
        seal2.scale.set(1.5, 0.65, 1);
        scene.add(seal2);

        var seal3Geom = new THREE.SphereGeometry(0.8, 6, 6);
        var seal3 = new THREE.Mesh(seal3Geom, sealMat);
        seal3.position.set(WX + 79, 2.0, WZ + 18);
        seal3.scale.set(1.3, 0.6, 1);
        scene.add(seal3);

        var seal4Geom = new THREE.SphereGeometry(1.1, 6, 6);
        var seal4 = new THREE.Mesh(seal4Geom, sealMat);
        seal4.position.set(WX + 90, 1.6, WZ + 31);
        seal4.scale.set(1.6, 0.65, 1);
        scene.add(seal4);

        var seal5Geom = new THREE.SphereGeometry(0.9, 6, 6);
        var seal5 = new THREE.Mesh(seal5Geom, sealMat);
        seal5.position.set(WX + 88, 1.55, WZ + 29);
        seal5.scale.set(1.4, 0.6, 1);
        scene.add(seal5);

        var seal6Geom = new THREE.SphereGeometry(1.3, 6, 6);
        var seal6 = new THREE.Mesh(seal6Geom, sealMat);
        seal6.position.set(WX + 76, 1.85, WZ + 34);
        seal6.scale.set(1.9, 0.7, 1);
        scene.add(seal6);

        var seal7Geom = new THREE.SphereGeometry(0.7, 6, 6);
        var seal7 = new THREE.Mesh(seal7Geom, sealMat);
        seal7.position.set(WX + 74, 1.7, WZ + 36);
        seal7.scale.set(1.2, 0.55, 1);
        scene.add(seal7);

        var seal8Geom = new THREE.SphereGeometry(1.0, 6, 6);
        var seal8 = new THREE.Mesh(seal8Geom, sealMat);
        seal8.position.set(WX + 78, 1.8, WZ + 37);
        seal8.scale.set(1.5, 0.62, 1);
        scene.add(seal8);

        // Dark pup seal
        var pupMat = new THREE.MeshLambertMaterial({ color: 0xB0B0B0 });
        var pupGeom = new THREE.SphereGeometry(0.5, 6, 6);
        var pup = new THREE.Mesh(pupGeom, pupMat);
        pup.position.set(WX + 81, 2.1, WZ + 22);
        pup.scale.set(1.1, 0.5, 1);
        scene.add(pup);
    }

    function createIslandTerrain(scene) {
        var grassMat = new THREE.MeshLambertMaterial({ color: 0x5A7A3A });
        var sandMat = new THREE.MeshLambertMaterial({ color: 0xD4C48A });

        // Island ground base
        var islandGeom = new THREE.BoxGeometry(120, 2, 100);
        var island = new THREE.Mesh(islandGeom, grassMat);
        island.position.set(WX + 10, -1, WZ);
        scene.add(island);

        // Sandy beach strips
        var beach1Geom = new THREE.BoxGeometry(120, 1, 8);
        var beach1 = new THREE.Mesh(beach1Geom, sandMat);
        beach1.position.set(WX + 10, 0, WZ + 54);
        scene.add(beach1);

        var beach2Geom = new THREE.BoxGeometry(20, 1, 60);
        var beach2 = new THREE.Mesh(beach2Geom, sandMat);
        beach2.position.set(WX - 50, 0, WZ);
        scene.add(beach2);

        // Sand dunes
        var dune1Geom = new THREE.SphereGeometry(5, 6, 4);
        var dune1 = new THREE.Mesh(dune1Geom, sandMat);
        dune1.position.set(WX - 20, 1, WZ + 45);
        dune1.scale.set(1, 0.5, 1);
        scene.add(dune1);

        var dune2Geom = new THREE.SphereGeometry(4, 6, 4);
        var dune2 = new THREE.Mesh(dune2Geom, sandMat);
        dune2.position.set(WX - 10, 1, WZ + 50);
        dune2.scale.set(1, 0.4, 1);
        scene.add(dune2);

        var dune3Geom = new THREE.SphereGeometry(6, 6, 4);
        var dune3 = new THREE.Mesh(dune3Geom, sandMat);
        dune3.position.set(WX + 5, 1, WZ + 48);
        dune3.scale.set(1, 0.45, 1);
        scene.add(dune3);
    }

    function createInformationBoard(scene) {
        var postMat = new THREE.MeshLambertMaterial({ color: 0x5C4A2A });
        var boardMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });

        var post1Geom = new THREE.BoxGeometry(0.3, 4, 0.3);
        var post1 = new THREE.Mesh(post1Geom, postMat);
        post1.position.set(WX + 18, 2, WZ + 15);
        scene.add(post1);

        var post2 = new THREE.Mesh(post1Geom, postMat);
        post2.position.set(WX + 22, 2, WZ + 15);
        scene.add(post2);

        var boardGeom = new THREE.BoxGeometry(4.5, 2, 0.2);
        var board = new THREE.Mesh(boardGeom, boardMat);
        board.position.set(WX + 20, 3.5, WZ + 15);
        scene.add(board);
    }

    function init(scene) {
        createIslandTerrain(scene);
        createPriory(scene);
        createCastle(scene);
        createCauseway(scene);
        createVikingWreck(scene);
        createStCuthbert(scene);
        createSealColony(scene);
        createInformationBoard(scene);
    }

    return {
        init: init,
        worldX: WX,
        worldZ: WZ
    };

}());
