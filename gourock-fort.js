window.GourockFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildFort();
    }

    function buildFort() {
        // Gourock Pier Ferry Control - Victorian pier pavilion
        var pierPavilionGeom = new THREE.BoxGeometry(12, 10, 15);
        var pierPavilionMat = new THREE.MeshLambertMaterial({ color: 0xD2691E });
        var pierPavilion = new THREE.Mesh(pierPavilionGeom, pierPavilionMat);
        pierPavilion.position.set(-25, 5, -28);
        scene.add(pierPavilion);
        objects.push(pierPavilion);

        // Ferry Crane - cylinder
        var craneBoomGeom = new THREE.CylinderGeometry(2, 2, 20, 16);
        var craneBoomMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var craneBoom = new THREE.Mesh(craneBoomGeom, craneBoomMat);
        craneBoom.position.set(-25, 12, -15);
        craneBoom.rotation.z = Math.PI / 4;
        scene.add(craneBoom);
        objects.push(craneBoom);

        // Harbor Shed - box
        var harborShedGeom = new THREE.BoxGeometry(18, 8, 12);
        var harborShedMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var harborShed = new THREE.Mesh(harborShedGeom, harborShedMat);
        harborShed.position.set(-22, 4, 2);
        scene.add(harborShed);
        objects.push(harborShed);

        // Cloch Lighthouse - box tower
        var lighthouseTowerGeom = new THREE.BoxGeometry(6, 25, 6);
        var lighthouseTowerMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var lighthouseTower = new THREE.Mesh(lighthouseTowerGeom, lighthouseTowerMat);
        lighthouseTower.position.set(20, 12.5, -22);
        scene.add(lighthouseTower);
        objects.push(lighthouseTower);

        // Gun Barrel - cylinder
        var gunBarrelGeom = new THREE.CylinderGeometry(1.5, 1.5, 18, 16);
        var gunBarrelMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var gunBarrel = new THREE.Mesh(gunBarrelGeom, gunBarrelMat);
        gunBarrel.position.set(20, 18, -22);
        gunBarrel.rotation.z = Math.PI / 6;
        scene.add(gunBarrel);
        objects.push(gunBarrel);

        // Ammunition Store - box
        var ammoStoreGeom = new THREE.BoxGeometry(10, 7, 10);
        var ammoStoreMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var ammoStore = new THREE.Mesh(ammoStoreGeom, ammoStoreMat);
        ammoStore.position.set(20, 3.5, -8);
        scene.add(ammoStore);
        objects.push(ammoStore);

        // Gourock Esplanade Defense - concrete seafront barriers
        var barrier1Geom = new THREE.BoxGeometry(8, 4, 3);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var barrier1 = new THREE.Mesh(barrier1Geom, barrierMat);
        barrier1.position.set(-10, 2, 25);
        scene.add(barrier1);
        objects.push(barrier1);

        var barrier2Geom = new THREE.BoxGeometry(8, 4, 3);
        var barrier2 = new THREE.Mesh(barrier2Geom, barrierMat);
        barrier2.position.set(5, 2, 25);
        scene.add(barrier2);
        objects.push(barrier2);

        // Searchlight Tower - cylinder
        var searchlightGeom = new THREE.CylinderGeometry(2.5, 2.5, 16, 16);
        var searchlightMat = new THREE.MeshLambertMaterial({ color: 0x708090 });
        var searchlight = new THREE.Mesh(searchlightGeom, searchlightMat);
        searchlight.position.set(-2, 8, 28);
        scene.add(searchlight);
        objects.push(searchlight);

        // Machine Gun Nest - box
        var gunNestGeom = new THREE.BoxGeometry(7, 5, 7);
        var gunNestMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var gunNest = new THREE.Mesh(gunNestGeom, gunNestMat);
        gunNest.position.set(22, 2.5, 20);
        scene.add(gunNest);
        objects.push(gunNest);

        // Lunderston Bay Beach - barbed wire emplacements
        var wireEmplacementGeom = new THREE.BoxGeometry(5, 3, 5);
        var wireEmplacementMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var wireEmplacement = new THREE.Mesh(wireEmplacementGeom, wireEmplacementMat);
        wireEmplacement.position.set(-20, 1.5, -5);
        scene.add(wireEmplacement);
        objects.push(wireEmplacement);

        // Anti-tank Mines - spheres
        var mineSphere1Geom = new THREE.SphereGeometry(1.5, 16, 16);
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x3C3C3C });
        var mineSphere1 = new THREE.Mesh(mineSphere1Geom, mineMat);
        mineSphere1.position.set(-18, 1.5, 5);
        scene.add(mineSphere1);
        objects.push(mineSphere1);

        var mineSphere2 = new THREE.Mesh(mineSphere1Geom, mineMat);
        mineSphere2.position.set(-12, 1.5, 8);
        scene.add(mineSphere2);
        objects.push(mineSphere2);

        // Barrier Cables - LineSegments
        var cablePoints = [
            new THREE.Vector3(-25, 2, 10),
            new THREE.Vector3(-15, 2, 15),
            new THREE.Vector3(-5, 2, 12),
            new THREE.Vector3(5, 2, 18)
        ];
        var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var cableLineMat = new THREE.LineBasicMaterial({ color: 0xFFFF00 });
        var cableLines = new THREE.LineSegments(cableGeom, cableLineMat);
        scene.add(cableLines);
        objects.push(cableLines);

        // Gourock Swimming Pool Command Center - art deco building
        var poolCommandGeom = new THREE.BoxGeometry(14, 9, 12);
        var poolCommandMat = new THREE.MeshLambertMaterial({ color: 0xF0E68C });
        var poolCommand = new THREE.Mesh(poolCommandGeom, poolCommandMat);
        poolCommand.position.set(8, 4.5, -18);
        scene.add(poolCommand);
        objects.push(poolCommand);

        // Generator Shed
        var genShedGeom = new THREE.BoxGeometry(6, 6, 8);
        var genShedMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var genShed = new THREE.Mesh(genShedGeom, genShedMat);
        genShed.position.set(18, 3, -20);
        scene.add(genShed);
        objects.push(genShed);

        // Communications Mast - cylinder
        var commsMastGeom = new THREE.CylinderGeometry(1.2, 1.2, 22, 16);
        var commsMastMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var commsMast = new THREE.Mesh(commsMastGeom, commsMastMat);
        commsMast.position.set(12, 11, -18);
        scene.add(commsMast);
        objects.push(commsMast);

        // Daff Glen Valley Ambush - wooded track
        var woodyTrackGeom = new THREE.BoxGeometry(16, 3, 10);
        var woodyTrackMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var woodyTrack = new THREE.Mesh(woodyTrackGeom, woodyTrackMat);
        woodyTrack.position.set(-8, 1.5, 8);
        scene.add(woodyTrack);
        objects.push(woodyTrack);

        // Stone Wall - box
        var stoneWallGeom = new THREE.BoxGeometry(12, 5, 2);
        var stoneWallMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var stoneWall = new THREE.Mesh(stoneWallGeom, stoneWallMat);
        stoneWall.position.set(4, 2.5, 12);
        scene.add(stoneWall);
        objects.push(stoneWall);

        // IED Charges - sphere
        var iedChargeGeom = new THREE.SphereGeometry(1.2, 16, 16);
        var iedChargeMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var iedCharge = new THREE.Mesh(iedChargeGeom, iedChargeMat);
        iedCharge.position.set(2, 3, 15);
        scene.add(iedCharge);
        objects.push(iedCharge);

        // Command Wire - LineSegments
        var wirePoints = [
            new THREE.Vector3(-2, 2, 8),
            new THREE.Vector3(6, 2, 10),
            new THREE.Vector3(12, 3, 14)
        ];
        var wireGeom = new THREE.BufferGeometry().setFromPoints(wirePoints);
        var wireLineMat = new THREE.LineBasicMaterial({ color: 0xFF0000 });
        var wireLines = new THREE.LineSegments(wireGeom, wireLineMat);
        scene.add(wireLines);
        objects.push(wireLines);

        // Bankfoot Summit Relay - stone shelter
        var shelterGeom = new THREE.BoxGeometry(8, 6, 8);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0x778899 });
        var shelter = new THREE.Mesh(shelterGeom, shelterMat);
        shelter.position.set(12, 3, 5);
        scene.add(shelter);
        objects.push(shelter);

        // Signal Mast - cylinder
        var signalMastGeom = new THREE.CylinderGeometry(1, 1, 20, 16);
        var signalMastMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var signalMast = new THREE.Mesh(signalMastGeom, signalMastMat);
        signalMast.position.set(12, 10, 5);
        scene.add(signalMast);
        objects.push(signalMast);

        // Radome - sphere
        var radomeGeom = new THREE.SphereGeometry(2.5, 16, 16);
        var radiomeMat = new THREE.MeshLambertMaterial({ color: 0xDDA0DD });
        var radome = new THREE.Mesh(radomeGeom, radiomeMat);
        radome.position.set(12, 15, 5);
        scene.add(radome);
        objects.push(radome);

        // Ashton Esplanade Patrol - clifftop OP
        var clifftopOpGeom = new THREE.BoxGeometry(9, 5, 9);
        var clifftopOpMat = new THREE.MeshLambertMaterial({ color: 0x4B0082 });
        var clifftopOp = new THREE.Mesh(clifftopOpGeom, clifftopOpMat);
        clifftopOp.position.set(28, 2.5, -12);
        scene.add(clifftopOp);
        objects.push(clifftopOp);

        // Sensor Buoys - sphere
        var buoyGeom = new THREE.SphereGeometry(1.8, 16, 16);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0x00CED1 });
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy1.position.set(32, 1.8, 15);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy2.position.set(26, 1.8, 10);
        scene.add(buoy2);
        objects.push(buoy2);

        // Net Cable - LineSegments
        var netPoints = [
            new THREE.Vector3(20, 1, 8),
            new THREE.Vector3(28, 1, 12),
            new THREE.Vector3(32, 1, 18),
            new THREE.Vector3(25, 1, 20)
        ];
        var netGeom = new THREE.BufferGeometry().setFromPoints(netPoints);
        var netLineMat = new THREE.LineBasicMaterial({ color: 0x00FF00 });
        var netLines = new THREE.LineSegments(netGeom, netLineMat);
        scene.add(netLines);
        objects.push(netLines);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 30, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate rotating elements
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry && objects[i].geometry.type === 'CylinderGeometry') {
                objects[i].rotation.y += 0.5 * delta;
            }
            if (objects[i].geometry && objects[i].geometry.type === 'SphereGeometry') {
                objects[i].rotation.x += 0.3 * delta;
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        objects = [];
        lights = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
