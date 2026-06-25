window.GlacierFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var time = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        time = 0;
        buildGlacier();
        buildFortress();
        buildIceFormations();
        buildDefenses();
        buildCrevasses();
        buildOutpost();
        buildSnowDrifts();
        setupLighting();
    }

    function buildGlacier() {
        var iceColor = 0xB0E0E6;
        var whiteColor = 0xF0F8FF;

        var geometry1 = new THREE.BoxGeometry(200, 40, 200);
        var material1 = new THREE.MeshLambertMaterial({ color: iceColor });
        var glacier1 = new THREE.Mesh(geometry1, material1);
        glacier1.position.set(0, 0, 0);
        scene.add(glacier1);
        objects.push(glacier1);

        var geometry2 = new THREE.BoxGeometry(180, 35, 180);
        var material2 = new THREE.MeshLambertMaterial({ color: whiteColor });
        var glacier2 = new THREE.Mesh(geometry2, material2);
        glacier2.position.set(50, 25, 50);
        scene.add(glacier2);
        objects.push(glacier2);

        var geometry3 = new THREE.BoxGeometry(160, 30, 160);
        var material3 = new THREE.MeshLambertMaterial({ color: iceColor });
        var glacier3 = new THREE.Mesh(geometry3, material3);
        glacier3.position.set(-60, 20, -70);
        scene.add(glacier3);
        objects.push(glacier3);

        var geometry4 = new THREE.BoxGeometry(140, 25, 140);
        var material4 = new THREE.MeshLambertMaterial({ color: whiteColor });
        var glacier4 = new THREE.Mesh(geometry4, material4);
        glacier4.position.set(80, 15, -80);
        scene.add(glacier4);
        objects.push(glacier4);

        var geometry5 = new THREE.BoxGeometry(120, 20, 120);
        var material5 = new THREE.MeshLambertMaterial({ color: iceColor });
        var glacier5 = new THREE.Mesh(geometry5, material5);
        glacier5.position.set(-90, 10, 90);
        scene.add(glacier5);
        objects.push(glacier5);

        var geometry6 = new THREE.BoxGeometry(100, 18, 100);
        var material6 = new THREE.MeshLambertMaterial({ color: whiteColor });
        var glacier6 = new THREE.Mesh(geometry6, material6);
        glacier6.position.set(70, 12, 70);
        scene.add(glacier6);
        objects.push(glacier6);
    }

    function buildFortress() {
        var stoneColor = 0x4A4A4A;
        var battlementColor = 0x5A5A5A;

        var towerGeo = new THREE.BoxGeometry(50, 80, 50);
        var towerMat = new THREE.MeshLambertMaterial({ color: stoneColor });
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(0, 50, 0);
        scene.add(tower);
        objects.push(tower);

        var wallGeo1 = new THREE.BoxGeometry(100, 30, 20);
        var wallMat = new THREE.MeshLambertMaterial({ color: stoneColor });
        var wall1 = new THREE.Mesh(wallGeo1, wallMat);
        wall1.position.set(0, 35, 60);
        scene.add(wall1);
        objects.push(wall1);

        var wallGeo2 = new THREE.BoxGeometry(100, 30, 20);
        var wall2 = new THREE.Mesh(wallGeo2, wallMat);
        wall2.position.set(0, 35, -60);
        scene.add(wall2);
        objects.push(wall2);

        var wallGeo3 = new THREE.BoxGeometry(20, 30, 100);
        var wall3 = new THREE.Mesh(wallGeo3, wallMat);
        wall3.position.set(60, 35, 0);
        scene.add(wall3);
        objects.push(wall3);

        var wallGeo4 = new THREE.BoxGeometry(20, 30, 100);
        var wall4 = new THREE.Mesh(wallGeo4, wallMat);
        wall4.position.set(-60, 35, 0);
        scene.add(wall4);
        objects.push(wall4);

        var battlementGeo = new THREE.BoxGeometry(50, 15, 50);
        var battlementMat = new THREE.MeshLambertMaterial({ color: battlementColor });
        var battlement = new THREE.Mesh(battlementGeo, battlementMat);
        battlement.position.set(0, 95, 0);
        scene.add(battlement);
        objects.push(battlement);

        var snowGeo1 = new THREE.SphereGeometry(8, 8, 8);
        var snowMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var snow1 = new THREE.Mesh(snowGeo1, snowMat);
        snow1.position.set(15, 110, 15);
        scene.add(snow1);
        objects.push(snow1);

        var snow2 = new THREE.Mesh(snowGeo1, snowMat);
        snow2.position.set(-15, 110, 15);
        scene.add(snow2);
        objects.push(snow2);

        var snow3 = new THREE.Mesh(snowGeo1, snowMat);
        snow3.position.set(15, 110, -15);
        scene.add(snow3);
        objects.push(snow3);

        var snow4 = new THREE.Mesh(snowGeo1, snowMat);
        snow4.position.set(-15, 110, -15);
        scene.add(snow4);
        objects.push(snow4);
    }

    function buildIceFormations() {
        var spikeMat = new THREE.MeshLambertMaterial({ color: 0x87CEEB });

        for (var i = 0; i < 15; i++) {
            var spikeGeo = new THREE.ConeGeometry(4, 30, 8);
            var spike = new THREE.Mesh(spikeGeo, spikeMat);
            var angle = (i / 15) * Math.PI * 2;
            spike.position.set(Math.cos(angle) * 120, 15, Math.sin(angle) * 120);
            scene.add(spike);
            objects.push(spike);
        }

        for (var j = 0; j < 12; j++) {
            var smallSpikeGeo = new THREE.ConeGeometry(3, 20, 6);
            var smallSpike = new THREE.Mesh(smallSpikeGeo, spikeMat);
            var angle2 = (j / 12) * Math.PI * 2;
            smallSpike.position.set(Math.cos(angle2) * 150, 10, Math.sin(angle2) * 150);
            scene.add(smallSpike);
            objects.push(smallSpike);
        }
    }

    function buildDefenses() {
        var turrentGeo = new THREE.CylinderGeometry(12, 12, 20, 8);
        var turrentMat = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });

        var turret1 = new THREE.Mesh(turrentGeo, turrentMat);
        turret1.position.set(50, 80, 50);
        scene.add(turret1);
        objects.push(turret1);

        var turret2 = new THREE.Mesh(turrentGeo, turrentMat);
        turret2.position.set(-50, 80, 50);
        scene.add(turret2);
        objects.push(turret2);

        var turret3 = new THREE.Mesh(turrentGeo, turrentMat);
        turret3.position.set(50, 80, -50);
        scene.add(turret3);
        objects.push(turret3);

        var turret4 = new THREE.Mesh(turrentGeo, turrentMat);
        turret4.position.set(-50, 80, -50);
        scene.add(turret4);
        objects.push(turret4);

        var gunGeo = new THREE.CylinderGeometry(3, 3, 25, 6);
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
        var gun = new THREE.Mesh(gunGeo, gunMat);
        gun.position.set(50, 95, 50);
        gun.rotation.z = Math.PI / 4;
        scene.add(gun);
        objects.push(gun);
    }

    function buildCrevasses() {
        var crevasseMat = new THREE.MeshLambertMaterial({ color: 0x1E3A5F });

        var crevGeo1 = new THREE.BoxGeometry(300, 80, 8);
        var crev1 = new THREE.Mesh(crevGeo1, crevasseMat);
        crev1.position.set(0, 30, 0);
        scene.add(crev1);
        objects.push(crev1);

        var crevGeo2 = new THREE.BoxGeometry(8, 80, 300);
        var crev2 = new THREE.Mesh(crevGeo2, crevasseMat);
        crev2.position.set(0, 30, 0);
        scene.add(crev2);
        objects.push(crev2);

        var crevGeo3 = new THREE.BoxGeometry(150, 100, 10);
        var crev3 = new THREE.Mesh(crevGeo3, crevasseMat);
        crev3.position.set(100, 40, 100);
        scene.add(crev3);
        objects.push(crev3);

        var bridgeGeo = new THREE.BoxGeometry(20, 5, 80);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        var bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridge.position.set(0, 65, 0);
        scene.add(bridge);
        objects.push(bridge);
    }

    function buildOutpost() {
        var domeBaseMat = new THREE.MeshLambertMaterial({ color: 0xE0E0E0 });
        var baseGeo = new THREE.BoxGeometry(40, 20, 40);
        var base = new THREE.Mesh(baseGeo, domeBaseMat);
        base.position.set(-100, 25, -100);
        scene.add(base);
        objects.push(base);

        var domeMat = new THREE.MeshLambertMaterial({ color: 0xD3D3D3 });
        var domeGeo = new THREE.SphereGeometry(25, 16, 16);
        var dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.set(-100, 45, -100);
        dome.scale.y = 0.6;
        scene.add(dome);
        objects.push(dome);

        var pumpGeo = new THREE.CylinderGeometry(3, 3, 15, 6);
        var pumpMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var pump = new THREE.Mesh(pumpGeo, pumpMat);
        pump.position.set(-100, 30, -70);
        scene.add(pump);
        objects.push(pump);
    }

    function buildSnowDrifts() {
        var driftMat = new THREE.MeshLambertMaterial({ color: 0xFAFAFA });

        for (var i = 0; i < 20; i++) {
            var driftGeo = new THREE.BoxGeometry(Math.random() * 30 + 20, Math.random() * 8 + 4, Math.random() * 30 + 20);
            var drift = new THREE.Mesh(driftGeo, driftMat);
            drift.position.set(Math.random() * 300 - 150, 5, Math.random() * 300 - 150);
            scene.add(drift);
            objects.push(drift);
        }

        var depotGeo = new THREE.BoxGeometry(50, 25, 60);
        var depotMat = new THREE.MeshLambertMaterial({ color: 0xD0D0A8 });
        var depot = new THREE.Mesh(depotGeo, depotMat);
        depot.position.set(120, 20, 120);
        scene.add(depot);
        objects.push(depot);

        var roofGeo = new THREE.BoxGeometry(55, 5, 65);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0xB0B090 });
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(120, 32, 120);
        scene.add(roof);
        objects.push(roof);
    }

    function buildVehicles() {
        var bodyGeo = new THREE.BoxGeometry(30, 20, 50);
        var bodyMat = new THREE.MeshLambertMaterial({ color: 0xA8A878 });
        var body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(-120, 25, 0);
        scene.add(body);
        objects.push(body);

        var track1Geo = new THREE.CylinderGeometry(8, 8, 35, 8);
        var trackMat = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
        var track1 = new THREE.Mesh(track1Geo, trackMat);
        track1.position.set(-120, 12, 20);
        track1.rotation.z = Math.PI / 2;
        scene.add(track1);
        objects.push(track1);

        var track2 = new THREE.Mesh(track1Geo, trackMat);
        track2.position.set(-120, 12, -20);
        track2.rotation.z = Math.PI / 2;
        scene.add(track2);
        objects.push(track2);

        var cabinGeo = new THREE.BoxGeometry(25, 15, 20);
        var cabinMat = new THREE.MeshLambertMaterial({ color: 0x8A8A5A });
        var cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(-120, 28, 0);
        scene.add(cabin);
        objects.push(cabin);
    }

    function buildSupplyStorage() {
        var drumMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });

        for (var row = 0; row < 4; row++) {
            for (var col = 0; col < 5; col++) {
                var drumGeo = new THREE.CylinderGeometry(4, 4, 12, 8);
                var drum = new THREE.Mesh(drumGeo, drumMat);
                drum.position.set(100 + col * 12, 15 + row * 15, -120);
                scene.add(drum);
                objects.push(drum);
            }
        }
    }

    function buildObservationPost() {
        var pillarGeo = new THREE.CylinderGeometry(8, 8, 40, 8);
        var pillarMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(0, 30, 100);
        scene.add(pillar);
        objects.push(pillar);

        var platformGeo = new THREE.BoxGeometry(30, 8, 30);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.set(0, 65, 100);
        scene.add(platform);
        objects.push(platform);

        var railGeo = new THREE.BoxGeometry(30, 3, 2);
        var railMat = new THREE.MeshLambertMaterial({ color: 0xA0A0A0 });
        var rail1 = new THREE.Mesh(railGeo, railMat);
        rail1.position.set(0, 72, 115);
        scene.add(rail1);
        objects.push(rail1);

        var rail2 = new THREE.Mesh(railGeo, railMat);
        rail2.position.set(0, 72, 85);
        scene.add(rail2);
        objects.push(rail2);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(100, 100, 100);
        scene.add(directionalLight);
        lights.push(directionalLight);

        var auroraLight = new THREE.PointLight(0x00FF88, 0.3);
        auroraLight.position.set(0, 150, 0);
        scene.add(auroraLight);
        lights.push(auroraLight);
    }

    function update(delta) {
        time += delta;

        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.SphereGeometry) {
                if (i % 5 === 0) {
                    objects[i].position.y += Math.sin(time * 2 + i) * 0.1;
                }
            }
        }

        if (lights.length > 2) {
            lights[2].intensity = 0.3 + Math.sin(time * 1.5) * 0.2;
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

    buildVehicles();
    buildSupplyStorage();
    buildObservationPost();

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
