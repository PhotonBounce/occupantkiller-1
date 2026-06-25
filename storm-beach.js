window.StormBeach = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var animatedObjects = [];

    var SAND_COLOR = 0xc2b280;
    var CONCRETE_COLOR = 0x808080;
    var METAL_COLOR = 0x2a2a2a;
    var SKY_COLOR = 0x4a5568;
    var WATER_COLOR = 0x3a5a7a;
    var DEBRIS_COLOR = 0x5a4a3a;

    function buildCzechHedgehog(x, y, z) {
        var group = [];
        var barLength = 2;
        var barRadius = 0.15;
        var barGeometry = new THREE.CylinderGeometry(barRadius, barRadius, barLength, 8);
        var material = new THREE.MeshLambertMaterial({ color: METAL_COLOR });

        var angles = [0, 60, 120];
        for (var a = 0; a < angles.length; a++) {
            var angle = angles[a] * Math.PI / 180;
            for (var b = 0; b < 2; b++) {
                var bar = new THREE.Mesh(barGeometry, material);
                bar.rotation.z = angle;
                bar.position.set(x, y + (b === 0 ? -0.3 : 0.3), z);
                scene.add(bar);
                objects.push(bar);
                group.push(bar);
            }
        }
        return group;
    }

    function buildConcreteBunker(x, y, z, width, depth, height) {
        var group = [];
        var geometry = new THREE.BoxGeometry(width, height, depth);
        var material = new THREE.MeshLambertMaterial({ color: CONCRETE_COLOR });
        var bunker = new THREE.Mesh(geometry, material);
        bunker.position.set(x, y, z);
        scene.add(bunker);
        objects.push(bunker);
        group.push(bunker);

        var slitWidth = 0.8;
        var slitHeight = 0.4;
        var slitGeometry = new THREE.BoxGeometry(slitWidth, slitHeight, depth + 0.5);
        var slitMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

        for (var s = 0; s < 3; s++) {
            var slit = new THREE.Mesh(slitGeometry, slitMaterial);
            slit.position.set(x - width/2 + 0.5, y + height/2 - 0.8, z + (s - 1) * 1.5);
            scene.add(slit);
            objects.push(slit);
            group.push(slit);
        }

        return group;
    }

    function buildBarbedWire(x, y, z, length) {
        var group = [];
        var wireGeometry = new THREE.BufferGeometry();
        var points = [];

        var segmentCount = 20;
        for (var i = 0; i <= segmentCount; i++) {
            var xPos = x + (i / segmentCount) * length;
            var zPos = z + Math.sin(i * 0.5) * 0.3;
            var yPos = y + (i % 2) * 0.2;
            points.push(new THREE.Vector3(xPos, yPos, zPos));
        }

        wireGeometry.setFromPoints(points);
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0x8b4513, linewidth: 2 });
        var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
        scene.add(wire);
        objects.push(wire);
        group.push(wire);

        return group;
    }

    function buildWreckedLandingCraft(x, y, z) {
        var group = [];
        var hullGeometry = new THREE.BoxGeometry(4, 1.5, 8);
        var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.set(x, y - 0.5, z);
        hull.rotation.z = 0.3;
        scene.add(hull);
        objects.push(hull);
        group.push(hull);

        var bowGeometry = new THREE.BoxGeometry(2, 1.2, 3);
        var bow = new THREE.Mesh(bowGeometry, hullMaterial);
        bow.position.set(x, y + 0.2, z + 3.5);
        bow.rotation.z = 0.5;
        scene.add(bow);
        objects.push(bow);
        group.push(bow);

        var cabinetGeometry = new THREE.BoxGeometry(1.5, 0.8, 1.5);
        var cabinetMaterial = new THREE.MeshLambertMaterial({ color: DEBRIS_COLOR });
        var cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
        cabinet.position.set(x + 1, y + 0.5, z - 2);
        scene.add(cabinet);
        objects.push(cabinet);
        group.push(cabinet);

        return group;
    }

    function buildSandbagWall(x, y, z, length) {
        var group = [];
        var bagGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.4);
        var bagMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });

        for (var i = 0; i < length; i++) {
            for (var h = 0; h < 3; h++) {
                var bag = new THREE.Mesh(bagGeometry, bagMaterial);
                bag.position.set(x + i * 0.65, y + h * 0.55, z);
                scene.add(bag);
                objects.push(bag);
                group.push(bag);
            }
        }

        return group;
    }

    function buildCannonEmplacement(x, y, z) {
        var group = [];
        var baseGeometry = new THREE.BoxGeometry(2, 0.8, 2);
        var baseMaterial = new THREE.MeshLambertMaterial({ color: CONCRETE_COLOR });
        var base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(x, y, z);
        scene.add(base);
        objects.push(base);
        group.push(base);

        var barrelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 12);
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: METAL_COLOR });
        var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(x, y + 1.2, z);
        barrel.rotation.z = 0.4;
        scene.add(barrel);
        objects.push(barrel);
        group.push(barrel);
        animatedObjects.push({ obj: barrel, type: 'cannon' });

        var ammoBoxGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.8);
        var ammoBoxMaterial = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
        for (var a = 0; a < 3; a++) {
            var ammoBox = new THREE.Mesh(ammoBoxGeometry, ammoBoxMaterial);
            ammoBox.position.set(x + 1 + a * 0.9, y + 0.5, z);
            scene.add(ammoBox);
            objects.push(ammoBox);
            group.push(ammoBox);
        }

        return group;
    }

    function buildWatchtower(x, y, z) {
        var group = [];
        var stiltsGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
        var stiltMaterial = new THREE.MeshLambertMaterial({ color: METAL_COLOR });

        for (var s = 0; s < 4; s++) {
            var stilt = new THREE.Mesh(stiltsGeometry, stiltMaterial);
            var offsetX = (s < 2) ? 0.6 : -0.6;
            var offsetZ = (s % 2 === 0) ? 0.6 : -0.6;
            stilt.position.set(x + offsetX, y + 1.5, z + offsetZ);
            scene.add(stilt);
            objects.push(stilt);
            group.push(stilt);
        }

        var cabinGeometry = new THREE.BoxGeometry(1.5, 1.2, 1.5);
        var cabinMaterial = new THREE.MeshLambertMaterial({ color: CONCRETE_COLOR });
        var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(x, y + 3.5, z);
        scene.add(cabin);
        objects.push(cabin);
        group.push(cabin);

        var roofGeometry = new THREE.ConeGeometry(1, 0.8, 8);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(x, y + 4.3, z);
        scene.add(roof);
        objects.push(roof);
        group.push(roof);

        var spotlightGeometry = new THREE.SphereGeometry(0.25, 6, 6);
        var spotlightMaterial = new THREE.MeshLambertMaterial({ color: 0xffff99 });
        var spotlight = new THREE.Mesh(spotlightGeometry, spotlightMaterial);
        spotlight.position.set(x, y + 4.5, z);
        scene.add(spotlight);
        objects.push(spotlight);
        group.push(spotlight);
        animatedObjects.push({ obj: spotlight, type: 'spotlight' });

        return group;
    }

    function buildBombCrater(x, y, z, radius) {
        var group = [];
        var craterGeometry = new THREE.ConeGeometry(radius, 1.5, 16);
        var craterMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        var crater = new THREE.Mesh(craterGeometry, craterMaterial);
        crater.position.set(x, y - 0.75, z);
        crater.rotation.x = Math.PI;
        scene.add(crater);
        objects.push(crater);
        group.push(crater);

        var rimGeometry = new THREE.CylinderGeometry(radius + 0.3, radius, 0.3, 16);
        var rimMaterial = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
        var rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.position.set(x, y, z);
        scene.add(rim);
        objects.push(rim);
        group.push(rim);

        return group;
    }

    function buildRockyCliff(x, y, z, width, height) {
        var group = [];
        var boxGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
        var rockMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });

        for (var w = 0; w < width; w++) {
            for (var h = 0; h < height; h++) {
                var rock = new THREE.Mesh(boxGeometry, rockMaterial);
                var offsetX = (h % 2) * 0.4;
                rock.position.set(x + w * 0.85 + offsetX, y + h * 1.05, z);
                rock.rotation.x = (Math.random() - 0.5) * 0.3;
                rock.rotation.y = (Math.random() - 0.5) * 0.3;
                rock.rotation.z = (Math.random() - 0.5) * 0.3;
                scene.add(rock);
                objects.push(rock);
                group.push(rock);
            }
        }

        return group;
    }

    function buildDebrisField(x, y, z) {
        var group = [];

        var helmetGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        var helmetMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        for (var h = 0; h < 8; h++) {
            var helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
            helmet.position.set(x + Math.random() * 6 - 3, y + 0.3, z + Math.random() * 6 - 3);
            helmet.scale.y = 0.7;
            scene.add(helmet);
            objects.push(helmet);
            group.push(helmet);
        }

        var ammoGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.5);
        var ammoMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        for (var a = 0; a < 12; a++) {
            var ammo = new THREE.Mesh(ammoGeometry, ammoMaterial);
            ammo.position.set(x + Math.random() * 8 - 4, y + 0.2, z + Math.random() * 8 - 4);
            ammo.rotation.x = Math.random() * Math.PI;
            ammo.rotation.y = Math.random() * Math.PI;
            scene.add(ammo);
            objects.push(ammo);
            group.push(ammo);
        }

        var equipmentGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.3);
        var equipmentMaterial = new THREE.MeshLambertMaterial({ color: DEBRIS_COLOR });
        for (var e = 0; e < 10; e++) {
            var equipment = new THREE.Mesh(equipmentGeometry, equipmentMaterial);
            equipment.position.set(x + Math.random() * 7 - 3.5, y + 0.3, z + Math.random() * 7 - 3.5);
            equipment.rotation.x = Math.random() * Math.PI;
            equipment.rotation.z = Math.random() * Math.PI;
            scene.add(equipment);
            objects.push(equipment);
            group.push(equipment);
        }

        return group;
    }

    function buildWaveFoam(x, y, z) {
        var group = [];
        var foamGeometry = new THREE.SphereGeometry(0.3, 6, 6);
        var foamMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

        for (var f = 0; f < 15; f++) {
            var foam = new THREE.Mesh(foamGeometry, foamMaterial);
            foam.position.set(x + Math.random() * 10 - 5, y + Math.random() * 0.5, z + Math.random() * 3);
            foam.scale.x = 0.8 + Math.random() * 0.4;
            foam.scale.z = 0.8 + Math.random() * 0.4;
            scene.add(foam);
            objects.push(foam);
            group.push(foam);
            animatedObjects.push({ obj: foam, type: 'foam', baseY: foam.position.y });
        }

        return group;
    }

    function buildSandyBeach(x, y, z) {
        var group = [];
        var sandGeometry = new THREE.BoxGeometry(40, 0.5, 25);
        var sandMaterial = new THREE.MeshLambertMaterial({ color: SAND_COLOR });
        var sand = new THREE.Mesh(sandGeometry, sandMaterial);
        sand.position.set(x, y - 0.25, z);
        scene.add(sand);
        objects.push(sand);
        group.push(sand);

        return group;
    }

    function buildWaterArea(x, y, z) {
        var group = [];
        var waterGeometry = new THREE.BoxGeometry(50, 2, 30);
        var waterMaterial = new THREE.MeshLambertMaterial({ color: WATER_COLOR });
        var water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.set(x, y - 1, z + 15);
        scene.add(water);
        objects.push(water);
        group.push(water);

        return group;
    }

    function buildTrenchLine(x, y, z, length) {
        var group = [];
        var trenchGeometry = new THREE.BoxGeometry(length, 1.2, 1.5);
        var trenchMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var trench = new THREE.Mesh(trenchGeometry, trenchMaterial);
        trench.position.set(x + length / 2, y - 0.6, z);
        scene.add(trench);
        objects.push(trench);
        group.push(trench);

        var wallGeometry = new THREE.BoxGeometry(0.4, 1, length);
        var wallMaterial = new THREE.MeshLambertMaterial({ color: SAND_COLOR });

        for (var w = 0; w < 2; w++) {
            var wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.set(x + (w === 0 ? 0 : length), y, z);
            scene.add(wall);
            objects.push(wall);
            group.push(wall);
        }

        return group;
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        animatedObjects = [];

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(15, 20, 10);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var stormLight = new THREE.DirectionalLight(0x8899bb, 0.4);
        stormLight.position.set(-10, 15, -15);
        scene.add(stormLight);
        lights.push(stormLight);

        buildSandyBeach(0, 0, 0);
        buildWaterArea(0, -1, 5);

        buildCzechHedgehog(-8, 0.2, -5);
        buildCzechHedgehog(-3, 0.2, -8);
        buildCzechHedgehog(4, 0.2, -4);
        buildCzechHedgehog(10, 0.2, -7);
        buildCzechHedgehog(-12, 0.2, 2);
        buildCzechHedgehog(8, 0.2, 5);

        buildConcreteBunker(-10, 0, 8, 3, 2.5, 2.5);
        buildConcreteBunker(6, 0, 10, 3, 2.5, 2.5);
        buildConcreteBunker(-2, 0, 12, 3, 2.5, 2.5);

        buildBarbedWire(-15, 0.5, -10, 12);
        buildBarbedWire(-10, 0.5, -15, 10);
        buildBarbedWire(5, 0.5, -12, 8);

        buildWreckedLandingCraft(-5, -0.5, -12);
        buildWreckedLandingCraft(12, -0.5, -14);

        buildSandbagWall(-8, 0, 3, 8);
        buildSandbagWall(3, 0, 5, 6);

        buildCannonEmplacement(-6, 0, 7);
        buildCannonEmplacement(9, 0, 8);

        buildWatchtower(-15, 0, 5);
        buildWatchtower(14, 0, 6);

        buildBombCrater(-4, 0, 1, 2);
        buildBombCrater(7, 0, -2, 1.8);
        buildBombCrater(-1, 0, 4, 1.5);
        buildBombCrater(11, 0, 2, 1.6);

        buildRockyCliff(16, 1, 0, 6, 5);

        buildDebrisField(0, 0, 0);

        buildWaveFoam(-8, 0, -2);
        buildWaveFoam(5, 0, 1);

        buildTrenchLine(-6, 0, -3, 10);
        buildTrenchLine(5, 0, -6, 8);
    }

    function update(delta) {
        for (var i = 0; i < animatedObjects.length; i++) {
            var anim = animatedObjects[i];
            if (anim.type === 'cannon') {
                anim.obj.rotation.y += delta * 0.3;
                if (anim.obj.rotation.y > Math.PI * 2) {
                    anim.obj.rotation.y -= Math.PI * 2;
                }
            }
            else if (anim.type === 'foam') {
                anim.obj.position.y = anim.baseY + Math.sin(Date.now() * 0.003 + i) * 0.4;
            }
            else if (anim.type === 'spotlight') {
                anim.obj.position.x += Math.sin(Date.now() * 0.001) * 0.01;
                anim.obj.position.z += Math.cos(Date.now() * 0.001) * 0.01;
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
        animatedObjects = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
