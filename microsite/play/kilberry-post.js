window.KilberryPost = (function() {
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
        buildPost();
    }

    function buildPost() {
        // Kilberry Castle - box tower house
        var towerGeom = new THREE.BoxGeometry(12, 20, 12);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(-25, 10, -20);
        scene.add(tower);
        objects.push(tower);

        // Kilberry Castle - box outbuilding 1
        var outbuildGeom1 = new THREE.BoxGeometry(8, 8, 10);
        var outbuildMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var outbuild1 = new THREE.Mesh(outbuildGeom1, outbuildMat);
        outbuild1.position.set(-20, 4, -35);
        scene.add(outbuild1);
        objects.push(outbuild1);

        // Kilberry Castle - box outbuilding 2
        var outbuildGeom2 = new THREE.BoxGeometry(10, 7, 8);
        var outbuild2 = new THREE.Mesh(outbuildGeom2, outbuildMat);
        outbuild2.position.set(-35, 3.5, -15);
        scene.add(outbuild2);
        objects.push(outbuild2);

        // Kilberry Castle - cylinder radio mast
        var mastGeom = new THREE.CylinderGeometry(1.5, 1.5, 35, 16);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(-22, 27.5, -18);
        scene.add(mast);
        objects.push(mast);

        // Kilberry sculptured stones - cylinder carved stone pillar 1
        var stonePillarGeom1 = new THREE.CylinderGeometry(2, 2.2, 6, 12);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var stonePillar1 = new THREE.Mesh(stonePillarGeom1, stoneMat);
        stonePillar1.position.set(10, 3, -5);
        scene.add(stonePillar1);
        objects.push(stonePillar1);

        // Kilberry sculptured stones - cylinder carved stone pillar 2
        var stonePillarGeom2 = new THREE.CylinderGeometry(2, 2.2, 5.5, 12);
        var stonePillar2 = new THREE.Mesh(stonePillarGeom2, stoneMat);
        stonePillar2.position.set(18, 2.75, 5);
        scene.add(stonePillar2);
        objects.push(stonePillar2);

        // Kilberry sculptured stones - box elevated observation platform
        var obsPlattformGeom = new THREE.BoxGeometry(15, 2, 15);
        var platMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var obsPlatform = new THREE.Mesh(obsPlattformGeom, platMat);
        obsPlatform.position.set(12, 5, 0);
        scene.add(obsPlatform);
        objects.push(obsPlatform);

        // West Loch Tarbert - box gun emplacement
        var gunEmpGeom = new THREE.BoxGeometry(14, 3, 16);
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var gunEmp = new THREE.Mesh(gunEmpGeom, gunMat);
        gunEmp.position.set(25, 1.5, -20);
        scene.add(gunEmp);
        objects.push(gunEmp);

        // West Loch Tarbert - cylinder barrel
        var barrelGeom = new THREE.CylinderGeometry(1, 1, 18, 16);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.rotation.z = Math.PI / 6;
        barrel.position.set(33, 6, -25);
        scene.add(barrel);
        objects.push(barrel);

        // West Loch Tarbert - box magazine
        var magGeom = new THREE.BoxGeometry(9, 5, 11);
        var magMat = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
        var magazine = new THREE.Mesh(magGeom, magMat);
        magazine.position.set(20, 2.5, -8);
        scene.add(magazine);
        objects.push(magazine);

        // Loch Caolisport submarine - cylinder conning tower
        var conningGeom = new THREE.CylinderGeometry(3, 3.5, 8, 16);
        var conningMat = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
        var conning = new THREE.Mesh(conningGeom, conningMat);
        conning.position.set(-15, 3, 20);
        scene.add(conning);
        objects.push(conning);

        // Loch Caolisport - sphere sonar buoy 1
        var buoyGeom1 = new THREE.SphereGeometry(1.5, 16, 16);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var buoy1 = new THREE.Mesh(buoyGeom1, buoyMat);
        buoy1.position.set(-10, 1.5, 15);
        scene.add(buoy1);
        objects.push(buoy1);

        // Loch Caolisport - sphere sonar buoy 2
        var buoyGeom2 = new THREE.SphereGeometry(1.5, 16, 16);
        var buoy2 = new THREE.Mesh(buoyGeom2, buoyMat);
        buoy2.position.set(-22, 1.5, 28);
        scene.add(buoy2);
        objects.push(buoy2);

        // Loch Caolisport - LineSegments detection cable
        var cableGeo = new THREE.BufferGeometry();
        var cablePoints = new Float32Array([
            -10, 2, 15,
            -15, 4, 20,
            -22, 2, 28
        ]);
        cableGeo.setAttribute('position', new THREE.BufferAttribute(cablePoints, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x00FF00 });
        var cable = new THREE.LineSegments(cableGeo, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Ardpatrick Point lighthouse - cylinder lighthouse tower
        var lighthouseGeom = new THREE.CylinderGeometry(2.5, 2.8, 25, 16);
        var lighthouseMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var lighthouse = new THREE.Mesh(lighthouseGeom, lighthouseMat);
        lighthouse.position.set(0, 12.5, 25);
        scene.add(lighthouse);
        objects.push(lighthouse);

        // Ardpatrick Point - box fog horn building
        var fogHornGeom = new THREE.BoxGeometry(8, 6, 8);
        var fogHornMat = new THREE.MeshLambertMaterial({ color: 0xDDD700 });
        var fogHorn = new THREE.Mesh(fogHornGeom, fogHornMat);
        fogHorn.position.set(8, 3, 30);
        scene.add(fogHorn);
        objects.push(fogHorn);

        // Ardpatrick Point - LineSegments signal cables
        var sigCableGeo = new THREE.BufferGeometry();
        var sigCablePoints = new Float32Array([
            0, 13, 25,
            4, 8, 27,
            8, 6, 30
        ]);
        sigCableGeo.setAttribute('position', new THREE.BufferAttribute(sigCablePoints, 3));
        var sigCableMat = new THREE.LineBasicMaterial({ color: 0xFFFF00 });
        var sigCable = new THREE.LineSegments(sigCableGeo, sigCableMat);
        scene.add(sigCable);
        objects.push(sigCable);

        // Achahoish forestry - box forest road
        var roadGeom = new THREE.BoxGeometry(20, 1, 40);
        var roadMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var road = new THREE.Mesh(roadGeom, roadMat);
        road.position.set(15, 0.5, -5);
        scene.add(road);
        objects.push(road);

        // Achahoish - sphere IED charge 1
        var iedGeom1 = new THREE.SphereGeometry(1, 16, 16);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var ied1 = new THREE.Mesh(iedGeom1, iedMat);
        ied1.position.set(8, 1.2, 0);
        scene.add(ied1);
        objects.push(ied1);

        // Achahoish - sphere IED charge 2
        var iedGeom2 = new THREE.SphereGeometry(1, 16, 16);
        var ied2 = new THREE.Mesh(iedGeom2, iedMat);
        ied2.position.set(22, 1.2, -10);
        scene.add(ied2);
        objects.push(ied2);

        // Achahoish - LineSegments command wire to detonator
        var detCableGeo = new THREE.BufferGeometry();
        var detCablePoints = new Float32Array([
            8, 1.5, 0,
            5, 2, 15,
            2, 3, 20
        ]);
        detCableGeo.setAttribute('position', new THREE.BufferAttribute(detCablePoints, 3));
        var detCableMat = new THREE.LineBasicMaterial({ color: 0xFF0000 });
        var detCable = new THREE.LineSegments(detCableGeo, detCableMat);
        scene.add(detCable);
        objects.push(detCable);

        // Achahoish - box detonator shelter
        var detShelterGeom = new THREE.BoxGeometry(6, 4, 6);
        var detShelterMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var detShelter = new THREE.Mesh(detShelterGeom, detShelterMat);
        detShelter.position.set(0, 2, 20);
        scene.add(detShelter);
        objects.push(detShelter);

        // Loch Caolisport beach patrol - box patrol hut
        var patrolGeom = new THREE.BoxGeometry(7, 5, 7);
        var patrolMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var patrol = new THREE.Mesh(patrolGeom, patrolMat);
        patrol.position.set(-28, 2.5, 10);
        scene.add(patrol);
        objects.push(patrol);

        // Beach patrol - cylinder observation post
        var beachObsGeom = new THREE.CylinderGeometry(2, 2, 6, 16);
        var beachObsMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var beachObs = new THREE.Mesh(beachObsGeom, beachObsMat);
        beachObs.position.set(-20, 3, 5);
        scene.add(beachObs);
        objects.push(beachObs);

        // Beach patrol - cone marker buoy 1
        var buoyMarkerGeom1 = new THREE.ConeGeometry(1.2, 3, 16);
        var buoyMarkerMat = new THREE.MeshLambertMaterial({ color: 0xFF8C00 });
        var buoyMarker1 = new THREE.Mesh(buoyMarkerGeom1, buoyMarkerMat);
        buoyMarker1.position.set(-25, 1.5, 20);
        scene.add(buoyMarker1);
        objects.push(buoyMarker1);

        // Beach patrol - cone marker buoy 2
        var buoyMarkerGeom2 = new THREE.ConeGeometry(1.2, 3, 16);
        var buoyMarker2 = new THREE.Mesh(buoyMarkerGeom2, buoyMarkerMat);
        buoyMarker2.position.set(-12, 1.5, 25);
        scene.add(buoyMarker2);
        objects.push(buoyMarker2);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(30, 40, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].rotation) {
                    if (i % 5 === 0) {
                        objects[i].rotation.y += delta * 0.3;
                    }
                }
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

    return { init: init, update: update, reset: reset };
}());
