window.CoastLine = (function() {
	'use strict';

	var scene;
	var camera;
	var objects;
	var lights;
	var animatedObjects;
	var time;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedObjects = [];
		time = 0;

		buildBeach();
		buildObstacles();
		buildSeawall();
		buildPillboxes();
		buildLandingCraft();
		buildSoldiers();
		buildBunkerComplex();
		buildFireAndSmoke();
		buildLights();
		buildDefenseStructures();
	}

	function buildBeach() {
		var sandColor = 0xD2B48C;
		var geometry = new THREE.BoxGeometry(200, 1, 150);
		var material = new THREE.MeshLambertMaterial({ color: sandColor });
		var beach = new THREE.Mesh(geometry, material);
		beach.position.y = -0.5;
		beach.position.z = 0;
		scene.add(beach);
		objects.push(beach);

		var waterGeometry = new THREE.BoxGeometry(300, 20, 100);
		var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x1E90FF });
		var water = new THREE.Mesh(waterGeometry, waterMaterial);
		water.position.y = -15;
		water.position.z = -80;
		scene.add(water);
		objects.push(water);

		var cliff1 = new THREE.Mesh(
			new THREE.BoxGeometry(50, 40, 100),
			new THREE.MeshLambertMaterial({ color: 0x8B7355 })
		);
		cliff1.position.set(100, 15, -20);
		scene.add(cliff1);
		objects.push(cliff1);

		var cliff2 = new THREE.Mesh(
			new THREE.BoxGeometry(50, 40, 100),
			new THREE.MeshLambertMaterial({ color: 0x7B6344 })
		);
		cliff2.position.set(-100, 15, -20);
		scene.add(cliff2);
		objects.push(cliff2);

		var rockGroup = buildRocks(30, 10, 50, 5);
		for (var i = 0; i < rockGroup.length; i++) {
			scene.add(rockGroup[i]);
			objects.push(rockGroup[i]);
		}
	}

	function buildObstacles() {
		var czechHedgehogs = buildCzechHedgehogs(0, 0, 60, 6);
		for (var i = 0; i < czechHedgehogs.length; i++) {
			scene.add(czechHedgehogs[i]);
			objects.push(czechHedgehogs[i]);
		}

		var stakes = buildWoodenStakes(-50, 5, 40, 12);
		for (var i = 0; i < stakes.length; i++) {
			scene.add(stakes[i]);
			objects.push(stakes[i]);
		}

		var barbedWire = buildBarbedWireStrands(30, 2, 80, 4);
		for (var i = 0; i < barbedWire.length; i++) {
			scene.add(barbedWire[i]);
			objects.push(barbedWire[i]);
		}

		var ditchGroup = buildAntiTankDitch(-70, 0, -30, 80);
		for (var i = 0; i < ditchGroup.length; i++) {
			scene.add(ditchGroup[i]);
			objects.push(ditchGroup[i]);
		}
	}

	function buildSeawall() {
		var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });

		var wall = new THREE.Mesh(
			new THREE.BoxGeometry(160, 12, 8),
			wallMaterial
		);
		wall.position.set(0, 4, 85);
		scene.add(wall);
		objects.push(wall);

		var machineGunSlit1 = new THREE.Mesh(
			new THREE.BoxGeometry(3, 2, 4),
			new THREE.MeshLambertMaterial({ color: 0x222222 })
		);
		machineGunSlit1.position.set(-40, 8, 85);
		scene.add(machineGunSlit1);
		objects.push(machineGunSlit1);

		var machineGunSlit2 = new THREE.Mesh(
			new THREE.BoxGeometry(3, 2, 4),
			new THREE.MeshLambertMaterial({ color: 0x222222 })
		);
		machineGunSlit2.position.set(40, 8, 85);
		scene.add(machineGunSlit2);
		objects.push(machineGunSlit2);

		var wallSupport1 = new THREE.Mesh(
			new THREE.BoxGeometry(4, 15, 8),
			wallMaterial
		);
		wallSupport1.position.set(-70, 2, 85);
		scene.add(wallSupport1);
		objects.push(wallSupport1);

		var wallSupport2 = new THREE.Mesh(
			new THREE.BoxGeometry(4, 15, 8),
			wallMaterial
		);
		wallSupport2.position.set(70, 2, 85);
		scene.add(wallSupport2);
		objects.push(wallSupport2);
	}

	function buildPillboxes() {
		var pillbox1 = buildPillbox(-80, 8, -40);
		for (var i = 0; i < pillbox1.length; i++) {
			scene.add(pillbox1[i]);
			objects.push(pillbox1[i]);
		}

		var pillbox2 = buildPillbox(80, 8, -50);
		for (var i = 0; i < pillbox2.length; i++) {
			scene.add(pillbox2[i]);
			objects.push(pillbox2[i]);
		}

		var pillbox3 = buildPillbox(0, 12, -60);
		for (var i = 0; i < pillbox3.length; i++) {
			scene.add(pillbox3[i]);
			objects.push(pillbox3[i]);
		}
	}

	function buildLandingCraft() {
		var craft1 = buildLandingCraftHull(-50, 0, 70);
		craft1.name = 'landingCraft1';
		animatedObjects.push(craft1);
		for (var i = 0; i < craft1.children.length; i++) {
			objects.push(craft1.children[i]);
		}
		scene.add(craft1);

		var craft2 = buildLandingCraftHull(50, 0, 60);
		craft2.name = 'landingCraft2';
		animatedObjects.push(craft2);
		for (var i = 0; i < craft2.children.length; i++) {
			objects.push(craft2.children[i]);
		}
		scene.add(craft2);

		var craft3 = buildLandingCraftHull(0, 0.5, 75);
		craft3.name = 'landingCraft3';
		animatedObjects.push(craft3);
		for (var i = 0; i < craft3.children.length; i++) {
			objects.push(craft3.children[i]);
		}
		scene.add(craft3);
	}

	function buildSoldiers() {
		var soldierPositions = [
			[-40, 1, 65],
			[-30, 1, 68],
			[-20, 1, 70],
			[20, 1, 65],
			[30, 1, 67],
			[40, 1, 69]
		];

		for (var i = 0; i < soldierPositions.length; i++) {
			var soldier = buildSoldier(
				soldierPositions[i][0],
				soldierPositions[i][1],
				soldierPositions[i][2]
			);
			for (var j = 0; j < soldier.length; j++) {
				scene.add(soldier[j]);
				objects.push(soldier[j]);
			}
		}
	}

	function buildBunkerComplex() {
		var bunker = buildFortressStructure(0, 10, -70);
		for (var i = 0; i < bunker.length; i++) {
			scene.add(bunker[i]);
			objects.push(bunker[i]);
		}

		var watchtower = buildWatchtower(60, 15, -75);
		for (var i = 0; i < watchtower.length; i++) {
			scene.add(watchtower[i]);
			objects.push(watchtower[i]);
		}

		var searchLight = buildSearchlight(70, 25, -70);
		searchLight.name = 'searchlight';
		animatedObjects.push(searchLight);
		scene.add(searchLight);
		objects.push(searchLight);
	}

	function buildFireAndSmoke() {
		var vehicle1 = buildBurningVehicle(-60, 0, 20);
		for (var i = 0; i < vehicle1.length; i++) {
			scene.add(vehicle1[i]);
			objects.push(vehicle1[i]);
		}

		var vehicle2 = buildBurningVehicle(60, 0, 15);
		for (var i = 0; i < vehicle2.length; i++) {
			scene.add(vehicle2[i]);
			objects.push(vehicle2[i]);
		}

		var fire1 = buildFire(-60, 2, 20);
		fire1.name = 'fire1';
		animatedObjects.push(fire1);
		scene.add(fire1);
		objects.push(fire1);

		var fire2 = buildFire(60, 2, 15);
		fire2.name = 'fire2';
		animatedObjects.push(fire2);
		scene.add(fire2);
		objects.push(fire2);
	}

	function buildLights() {
		var sunLight = new THREE.DirectionalLight(0xFFFFFF, 0.7);
		sunLight.position.set(50, 80, 50);
		sunLight.castShadow = true;
		scene.add(sunLight);
		lights.push(sunLight);

		var ambientLight = new THREE.AmbientLight(0xFFFFCC, 0.4);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var fireLight1 = new THREE.PointLight(0xFF6600, 1.5, 60);
		fireLight1.position.set(-60, 5, 20);
		scene.add(fireLight1);
		lights.push(fireLight1);

		var fireLight2 = new THREE.PointLight(0xFF6600, 1.5, 60);
		fireLight2.position.set(60, 5, 15);
		scene.add(fireLight2);
		lights.push(fireLight2);

		var searchLightBeam = new THREE.SpotLight(0xFFFFFF, 1, 200, Math.PI / 6, 0.5, 2);
		searchLightBeam.position.set(70, 25, -70);
		scene.add(searchLightBeam);
		lights.push(searchLightBeam);
	}

	function buildDefenseStructures() {
		var bunkerEntrance = new THREE.Mesh(
			new THREE.BoxGeometry(8, 10, 3),
			new THREE.MeshLambertMaterial({ color: 0x2F2F2F })
		);
		bunkerEntrance.position.set(-15, 5, -75);
		scene.add(bunkerEntrance);
		objects.push(bunkerEntrance);

		var sandbags = buildSandbagWall(0, 1, 50, 10);
		for (var i = 0; i < sandbags.length; i++) {
			scene.add(sandbags[i]);
			objects.push(sandbags[i]);
		}

		var fences = buildDefenseFence(-90, 2, 0, 5);
		for (var i = 0; i < fences.length; i++) {
			scene.add(fences[i]);
			objects.push(fences[i]);
		}
	}

	function buildCzechHedgehogs(startX, startY, startZ, count) {
		var group = [];
		for (var i = 0; i < count; i++) {
			var x = startX + (i % 3) * 20;
			var z = startZ - Math.floor(i / 3) * 25;

			var hedgehog = new THREE.Group();

			var cylinder1 = new THREE.Mesh(
				new THREE.CylinderGeometry(0.5, 0.5, 8, 8),
				new THREE.MeshLambertMaterial({ color: 0x8B7355 })
			);
			cylinder1.rotation.z = Math.PI / 2.5;
			hedgehog.add(cylinder1);

			var cylinder2 = new THREE.Mesh(
				new THREE.CylinderGeometry(0.5, 0.5, 8, 8),
				new THREE.MeshLambertMaterial({ color: 0x8B7355 })
			);
			cylinder2.rotation.x = Math.PI / 2.5;
			hedgehog.add(cylinder2);

			var cylinder3 = new THREE.Mesh(
				new THREE.CylinderGeometry(0.5, 0.5, 8, 8),
				new THREE.MeshLambertMaterial({ color: 0x8B7355 })
			);
			cylinder3.rotation.z = -Math.PI / 2.5;
			hedgehog.add(cylinder3);

			hedgehog.position.set(x, startY, z);
			group.push(hedgehog);
		}
		return group;
	}

	function buildWoodenStakes(startX, startY, startZ, count) {
		var group = [];
		for (var i = 0; i < count; i++) {
			var x = startX + (i % 4) * 15;
			var z = startZ - Math.floor(i / 4) * 18;

			var stake = new THREE.Mesh(
				new THREE.CylinderGeometry(0.3, 0.4, 6, 6),
				new THREE.MeshLambertMaterial({ color: 0x8B4513 })
			);
			stake.position.set(x, startY + 3, z);
			group.push(stake);
		}
		return group;
	}

	function buildBarbedWireStrands(startX, startY, startZ, count) {
		var group = [];
		for (var i = 0; i < count; i++) {
			var points = [];
			points.push(new THREE.Vector3(-30, startY, startZ - i * 25));
			points.push(new THREE.Vector3(30, startY, startZ - i * 25));

			var geometry = new THREE.BufferGeometry().setFromPoints(points);
			var line = new THREE.Line(
				geometry,
				new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 2 })
			);
			group.push(line);
		}
		return group;
	}

	function buildAntiTankDitch(startX, startY, startZ, width) {
		var group = [];

		var ditch1 = new THREE.Mesh(
			new THREE.BoxGeometry(width, 4, 6),
			new THREE.MeshLambertMaterial({ color: 0x5C4033 })
		);
		ditch1.position.set(startX, startY, startZ);
		group.push(ditch1);

		var ditch2 = new THREE.Mesh(
			new THREE.BoxGeometry(width, 4, 6),
			new THREE.MeshLambertMaterial({ color: 0x5C4033 })
		);
		ditch2.position.set(startX, startY, startZ + 30);
		group.push(ditch2);

		var ditch3 = new THREE.Mesh(
			new THREE.BoxGeometry(width, 4, 6),
			new THREE.MeshLambertMaterial({ color: 0x5C4033 })
		);
		ditch3.position.set(startX, startY, startZ + 60);
		group.push(ditch3);

		return group;
	}

	function buildPillbox(x, y, z) {
		var group = [];

		var main = new THREE.Mesh(
			new THREE.CylinderGeometry(5, 6, 4, 8),
			new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
		);
		main.position.set(x, y, z);
		group.push(main);

		var gunPort = new THREE.Mesh(
			new THREE.BoxGeometry(2, 1.5, 3),
			new THREE.MeshLambertMaterial({ color: 0x1A1A1A })
		);
		gunPort.position.set(x, y + 1, z + 5.5);
		group.push(gunPort);

		var roof = new THREE.Mesh(
			new THREE.ConeGeometry(6, 2, 8),
			new THREE.MeshLambertMaterial({ color: 0x3A3A3A })
		);
		roof.position.set(x, y + 3, z);
		group.push(roof);

		return group;
	}

	function buildLandingCraftHull(x, y, z) {
		var group = new THREE.Group();

		var hull = new THREE.Mesh(
			new THREE.BoxGeometry(12, 4, 20),
			new THREE.MeshLambertMaterial({ color: 0x8B7355 })
		);
		hull.position.set(0, 0, 0);
		group.add(hull);

		var ramp = new THREE.Mesh(
			new THREE.BoxGeometry(10, 0.8, 8),
			new THREE.MeshLambertMaterial({ color: 0x696969 })
		);
		ramp.position.set(0, 2, 9);
		ramp.rotation.z = 0.3;
		group.add(ramp);

		var cabin = new THREE.Mesh(
			new THREE.BoxGeometry(8, 3, 6),
			new THREE.MeshLambertMaterial({ color: 0x696969 })
		);
		cabin.position.set(0, 2.5, -6);
		group.add(cabin);

		group.position.set(x, y, z);
		return group;
	}

	function buildSoldier(x, y, z) {
		var group = [];

		var body = new THREE.Mesh(
			new THREE.BoxGeometry(0.8, 1.8, 0.6),
			new THREE.MeshLambertMaterial({ color: 0x3C3C3C })
		);
		body.position.set(x, y + 1, z);
		group.push(body);

		var head = new THREE.Mesh(
			new THREE.SphereGeometry(0.35, 8, 8),
			new THREE.MeshLambertMaterial({ color: 0xD4A574 })
		);
		head.position.set(x, y + 2.2, z);
		group.push(head);

		var helmet = new THREE.Mesh(
			new THREE.SphereGeometry(0.4, 8, 8),
			new THREE.MeshLambertMaterial({ color: 0x545454 })
		);
		helmet.position.set(x, y + 2.3, z);
		group.push(helmet);

		return group;
	}

	function buildFortressStructure(x, y, z) {
		var group = [];

		var main = new THREE.Mesh(
			new THREE.BoxGeometry(30, 20, 40),
			new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
		);
		main.position.set(x, y, z);
		group.push(main);

		var tower = new THREE.Mesh(
			new THREE.CylinderGeometry(4, 5, 12, 8),
			new THREE.MeshLambertMaterial({ color: 0x1C1C1C })
		);
		tower.position.set(x + 10, y + 8, z - 15);
		group.push(tower);

		var crenellation = new THREE.Mesh(
			new THREE.BoxGeometry(28, 2, 3),
			new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
		);
		crenellation.position.set(x, y + 10.5, z - 20);
		group.push(crenellation);

		return group;
	}

	function buildWatchtower(x, y, z) {
		var group = [];

		var base = new THREE.Mesh(
			new THREE.CylinderGeometry(3, 4, 8, 8),
			new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
		);
		base.position.set(x, y - 5, z);
		group.push(base);

		var tower = new THREE.Mesh(
			new THREE.CylinderGeometry(2.5, 3, 12, 8),
			new THREE.MeshLambertMaterial({ color: 0x3A3A3A })
		);
		tower.position.set(x, y + 2, z);
		group.push(tower);

		var platform = new THREE.Mesh(
			new THREE.CylinderGeometry(3.5, 3.5, 1, 8),
			new THREE.MeshLambertMaterial({ color: 0x2F2F2F })
		);
		platform.position.set(x, y + 9, z);
		group.push(platform);

		return group;
	}

	function buildSearchlight(x, y, z) {
		var group = new THREE.Group();

		var mount = new THREE.Mesh(
			new THREE.CylinderGeometry(0.5, 1, 2, 8),
			new THREE.MeshLambertMaterial({ color: 0x333333 })
		);
		mount.position.set(0, 0, 0);
		group.add(mount);

		var spotlight = new THREE.Mesh(
			new THREE.SphereGeometry(1.2, 8, 8),
			new THREE.MeshLambertMaterial({ color: 0xFFFFCC })
		);
		spotlight.position.set(0, 2, 0);
		group.add(spotlight);

		group.position.set(x, y, z);
		group.initialRotation = { x: 0, y: 0 };
		return group;
	}

	function buildBurningVehicle(x, y, z) {
		var group = [];

		var hull = new THREE.Mesh(
			new THREE.BoxGeometry(5, 3, 8),
			new THREE.MeshLambertMaterial({ color: 0x1A1A1A })
		);
		hull.position.set(x, y + 1.5, z);
		group.push(hull);

		var turret = new THREE.Mesh(
			new THREE.CylinderGeometry(1.5, 2, 2, 8),
			new THREE.MeshLambertMaterial({ color: 0x222222 })
		);
		turret.position.set(x, y + 3, z);
		group.push(turret);

		return group;
	}

	function buildFire(x, y, z) {
		var group = new THREE.Group();

		var flame = new THREE.Mesh(
			new THREE.ConeGeometry(1.5, 4, 8),
			new THREE.MeshLambertMaterial({ color: 0xFF4500, emissive: 0xFF6600 })
		);
		flame.position.set(0, 0, 0);
		group.add(flame);

		group.position.set(x, y, z);
		group.baseScale = 1;
		return group;
	}

	function buildRocks(x, y, z, count) {
		var group = [];
		for (var i = 0; i < count; i++) {
			var rock = new THREE.Mesh(
				new THREE.SphereGeometry(Math.random() * 1.5 + 0.5, 8, 8),
				new THREE.MeshLambertMaterial({ color: 0x696969 })
			);
			rock.position.set(
				x + Math.random() * 40 - 20,
				y,
				z + Math.random() * 40 - 20
			);
			group.push(rock);
		}
		return group;
	}

	function buildSandbagWall(x, y, z, count) {
		var group = [];
		for (var i = 0; i < count; i++) {
			var bag = new THREE.Mesh(
				new THREE.BoxGeometry(2, 1, 1.5),
				new THREE.MeshLambertMaterial({ color: 0xB8860B })
			);
			bag.position.set(x + i * 2.2, y, z);
			group.push(bag);
		}
		return group;
	}

	function buildDefenseFence(x, y, z, count) {
		var group = [];
		for (var i = 0; i < count; i++) {
			var post = new THREE.Mesh(
				new THREE.CylinderGeometry(0.2, 0.2, 3, 6),
				new THREE.MeshLambertMaterial({ color: 0x654321 })
			);
			post.position.set(x + i * 8, y + 1.5, z);
			group.push(post);
		}
		return group;
	}

	function update(delta) {
		time += delta;

		for (var i = 0; i < animatedObjects.length; i++) {
			var obj = animatedObjects[i];

			if (obj.name === 'landingCraft1' || obj.name === 'landingCraft2' || obj.name === 'landingCraft3') {
				obj.position.y = obj.userData.baseY + Math.sin(time * 1.5 + i) * 0.3;
				obj.rotation.z = Math.sin(time * 1.2 + i) * 0.1;
			}
			else if (obj.name === 'fire1' || obj.name === 'fire2') {
				var scale = 1 + Math.sin(time * 4) * 0.3;
				obj.scale.set(scale, scale, scale);
				obj.position.y = obj.userData.baseY + Math.sin(time * 3.5) * 0.2;
			}
			else if (obj.name === 'searchlight') {
				obj.rotation.y += 0.8 * delta;
				obj.rotation.x = 0.4 + Math.sin(time * 0.5) * 0.2;
			}
		}

		for (var i = 0; i < lights.length; i++) {
			var light = lights[i];
			if (light.isPointLight && light.intensity > 1) {
				light.intensity = 1.3 + Math.sin(time * 3) * 0.3;
			}
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			if (objects[i].parent) {
				objects[i].parent.remove(objects[i]);
			} else {
				scene.remove(objects[i]);
			}
		}
		objects = [];

		for (var i = 0; i < lights.length; i++) {
			scene.remove(lights[i]);
		}
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
})();
