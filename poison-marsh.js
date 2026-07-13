window.PoisonMarsh = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animatedElements = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedElements = [];

		buildToxicPools();
		buildDeadTrees();
		buildHazmatSuits();
		buildMilitaryEquipment();
		buildChemicalBarrels();
		buildGasMaskDispensers();
		buildChemicalPlant();
		buildDecontaminationStations();
		buildWarningBeacons();
		buildToxicClouds();
		buildLighting();
	}

	function buildToxicPools() {
		var poolMaterial = new THREE.MeshLambertMaterial({ color: 0x88dd22, emissive: 0x44aa11 });

		var positions = [
			{ x: -40, z: -50, radius: 15 },
			{ x: 30, z: -40, radius: 12 },
			{ x: -20, z: 20, radius: 18 },
			{ x: 45, z: 30, radius: 14 },
			{ x: 10, z: -80, radius: 11 },
			{ x: -60, z: 10, radius: 16 }
		];

		positions.forEach(function(pos) {
			var poolGeom = new THREE.CylinderGeometry(pos.radius, pos.radius * 1.2, 2, 32);
			var pool = new THREE.Mesh(poolGeom, poolMaterial);
			pool.position.set(pos.x, -0.8, pos.z);
			pool.castShadow = true;
			pool.receiveShadow = true;
			scene.add(pool);
			objects.push(pool);

			var bubbleGeom = new THREE.SphereGeometry(pos.radius * 0.8, 16, 16);
			var bubbleMaterial = new THREE.MeshLambertMaterial({ color: 0xbbff44, transparent: true, opacity: 0.4 });
			var bubble = new THREE.Mesh(bubbleGeom, bubbleMaterial);
			bubble.position.set(pos.x, 0, pos.z);
			bubble.poolPos = pos;
			scene.add(bubble);
			objects.push(bubble);
			animatedElements.push({ obj: bubble, type: 'bubble', time: 0 });
		});
	}

	function buildDeadTrees() {
		var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x332200 });
		var positions = [
			{ x: -50, z: -30 },
			{ x: 20, z: -60 },
			{ x: 35, z: 10 },
			{ x: -35, z: 40 },
			{ x: 55, z: -20 },
			{ x: -70, z: -50 },
			{ x: 10, z: 50 },
			{ x: -25, z: -70 }
		];

		positions.forEach(function(pos) {
			var trunkGeom = new THREE.CylinderGeometry(3, 4, 25, 8);
			var trunk = new THREE.Mesh(trunkGeom, trunkMaterial);
			trunk.position.set(pos.x, 12, pos.z);
			trunk.castShadow = true;
			trunk.receiveShadow = true;
			scene.add(trunk);
			objects.push(trunk);

			var burnMaterial = new THREE.MeshLambertMaterial({ color: 0x885522 });
			for (var i = 0; i < 4; i++) {
				var burnGeom = new THREE.BoxGeometry(1.5, 8, 0.5);
				var burn = new THREE.Mesh(burnGeom, burnMaterial);
				var angle = (Math.PI * 2 * i) / 4;
				burn.position.set(
					pos.x + Math.cos(angle) * 3.5,
					15 + Math.random() * 8,
					pos.z + Math.sin(angle) * 3.5
				);
				burn.rotation.z = angle;
				burn.castShadow = true;
				scene.add(burn);
				objects.push(burn);
			}

			var branchGeom = new THREE.ConeGeometry(2, 8, 8);
			var branchMaterial = new THREE.MeshLambertMaterial({ color: 0x554400 });
			var branch = new THREE.Mesh(branchGeom, branchMaterial);
			branch.position.set(pos.x, 28, pos.z);
			branch.castShadow = true;
			scene.add(branch);
			objects.push(branch);
		});
	}

	function buildHazmatSuits() {
		var positions = [
			{ x: -45, z: 0 },
			{ x: 40, z: -50 },
			{ x: 15, z: 35 },
			{ x: -65, z: 20 }
		];

		positions.forEach(function(pos) {
			var poleGeom = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
			var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
			var pole = new THREE.Mesh(poleGeom, poleMaterial);
			pole.position.set(pos.x, 6, pos.z);
			pole.castShadow = true;
			scene.add(pole);
			objects.push(pole);

			var suitGeom = new THREE.BoxGeometry(2, 3, 1.5);
			var suitMaterial = new THREE.MeshLambertMaterial({ color: 0xffdd44, emissive: 0xaaaa00 });
			var suit = new THREE.Mesh(suitGeom, suitMaterial);
			suit.position.set(pos.x, 13, pos.z);
			suit.castShadow = true;
			suit.receiveShadow = true;
			scene.add(suit);
			objects.push(suit);

			var helmetGeom = new THREE.SphereGeometry(1.2, 16, 16);
			var helmetMaterial = new THREE.MeshLambertMaterial({ color: 0xccff66 });
			var helmet = new THREE.Mesh(helmetGeom, helmetMaterial);
			helmet.position.set(pos.x, 16, pos.z);
			helmet.castShadow = true;
			scene.add(helmet);
			objects.push(helmet);
		});
	}

	function buildMilitaryEquipment() {
		var positions = [
			{ x: -30, z: -40 },
			{ x: 50, z: 20 },
			{ x: 0, z: 60 },
			{ x: -70, z: 30 }
		];

		positions.forEach(function(pos) {
			var tankBody = new THREE.BoxGeometry(8, 4, 12);
			var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x665533, emissive: 0x442200 });
			var body = new THREE.Mesh(tankBody, metalMaterial);
			body.position.set(pos.x, 2, pos.z);
			body.castShadow = true;
			body.receiveShadow = true;
			scene.add(body);
			objects.push(body);

			var turret = new THREE.CylinderGeometry(3, 3, 2, 16);
			var turretMesh = new THREE.Mesh(turret, metalMaterial);
			turretMesh.position.set(pos.x, 5, pos.z);
			turretMesh.castShadow = true;
			scene.add(turretMesh);
			objects.push(turretMesh);

			var gunBarrel = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
			var gun = new THREE.Mesh(gunBarrel, metalMaterial);
			gun.position.set(pos.x + 4, 5, pos.z);
			gun.rotation.z = Math.PI / 6;
			gun.castShadow = true;
			scene.add(gun);
			objects.push(gun);
		});
	}

	function buildChemicalBarrels() {
		var positions = [
			{ x: -55, z: -20, count: 5 },
			{ x: 25, z: 45, count: 6 },
			{ x: -20, z: 10, count: 4 },
			{ x: 60, z: -30, count: 5 }
		];

		positions.forEach(function(pos) {
			for (var i = 0; i < pos.count; i++) {
				var offsetX = (i % 3) * 4;
				var offsetZ = Math.floor(i / 3) * 4;

				var barrelGeom = new THREE.CylinderGeometry(2, 2, 5, 8);
				var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0xffbb00, emissive: 0xaa7700 });
				var barrel = new THREE.Mesh(barrelGeom, barrelMaterial);
				barrel.position.set(pos.x + offsetX, 2.5, pos.z + offsetZ);
				barrel.castShadow = true;
				barrel.receiveShadow = true;
				scene.add(barrel);
				objects.push(barrel);

				var lidGeom = new THREE.CylinderGeometry(2.3, 2, 1, 8);
				var lid = new THREE.Mesh(lidGeom, barrelMaterial);
				lid.position.set(pos.x + offsetX, 6, pos.z + offsetZ);
				lid.castShadow = true;
				scene.add(lid);
				objects.push(lid);

				var striped = new THREE.BoxGeometry(4.5, 5, 0.3);
				var stripeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
				var stripe = new THREE.Mesh(striped, stripeMaterial);
				stripe.position.set(pos.x + offsetX, 2.5, pos.z + offsetZ - 2.3);
				scene.add(stripe);
				objects.push(stripe);
			}
		});
	}

	function buildGasMaskDispensers() {
		var positions = [
			{ x: -35, z: 50 },
			{ x: 45, z: -35 },
			{ x: 5, z: -50 }
		];

		positions.forEach(function(pos) {
			var boxGeom = new THREE.BoxGeometry(3, 4, 3);
			var dispenserMaterial = new THREE.MeshLambertMaterial({ color: 0x99cc33, emissive: 0x66aa00 });
			var dispenserBox = new THREE.Mesh(boxGeom, dispenserMaterial);
			dispenserBox.position.set(pos.x, 2, pos.z);
			dispenserBox.castShadow = true;
			dispenserBox.receiveShadow = true;
			scene.add(dispenserBox);
			objects.push(dispenserBox);

			var poleGeom = new THREE.CylinderGeometry(1, 1, 6, 6);
			var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
			var pole = new THREE.Mesh(poleGeom, poleMaterial);
			pole.position.set(pos.x, 5, pos.z);
			pole.castShadow = true;
			scene.add(pole);
			objects.push(pole);

			for (var i = 0; i < 4; i++) {
				var maskGeom = new THREE.SphereGeometry(0.8, 12, 12);
				var maskMaterial = new THREE.MeshLambertMaterial({ color: 0xbbff44 });
				var mask = new THREE.Mesh(maskGeom, maskMaterial);
				var angle = (Math.PI * 2 * i) / 4;
				mask.position.set(
					pos.x + Math.cos(angle) * 2,
					3 + Math.sin(angle) * 0.5,
					pos.z + Math.sin(angle) * 2
				);
				mask.castShadow = true;
				scene.add(mask);
				objects.push(mask);
			}
		});
	}

	function buildChemicalPlant() {
		var buildingGeom = new THREE.BoxGeometry(25, 20, 15);
		var plantMaterial = new THREE.MeshLambertMaterial({ color: 0x887755, emissive: 0x554422 });
		var building = new THREE.Mesh(buildingGeom, plantMaterial);
		building.position.set(-40, 10, -15);
		building.castShadow = true;
		building.receiveShadow = true;
		scene.add(building);
		objects.push(building);

		var roofGeom = new THREE.ConeGeometry(14, 8, 4);
		var roof = new THREE.Mesh(roofGeom, plantMaterial);
		roof.position.set(-40, 28, -15);
		roof.castShadow = true;
		scene.add(roof);
		objects.push(roof);

		for (var i = 0; i < 4; i++) {
			var windowGeom = new THREE.BoxGeometry(3, 3, 0.5);
			var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var window = new THREE.Mesh(windowGeom, windowMaterial);
			window.position.set(-50 + i * 6, 12, -23);
			scene.add(window);
			objects.push(window);
		}

		for (var j = 0; j < 3; j++) {
			var pipeGeom = new THREE.CylinderGeometry(1.5, 1.5, 30, 8);
			var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
			var pipe = new THREE.Mesh(pipeGeom, pipeMaterial);
			pipe.position.set(-32 + j * 8, 35, -15);
			pipe.rotation.x = Math.PI / 6;
			pipe.castShadow = true;
			scene.add(pipe);
			objects.push(pipe);
		}

		var tankGeom = new THREE.CylinderGeometry(5, 5, 12, 16);
		var tank = new THREE.Mesh(tankGeom, plantMaterial);
		tank.position.set(-20, 8, 5);
		tank.castShadow = true;
		scene.add(tank);
		objects.push(tank);
	}

	function buildDecontaminationStations() {
		var positions = [
			{ x: 30, z: 10 },
			{ x: -15, z: -35 }
		];

		positions.forEach(function(pos) {
			var frameGeom = new THREE.BoxGeometry(8, 10, 2);
			var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
			var frame = new THREE.Mesh(frameGeom, frameMaterial);
			frame.position.set(pos.x, 5, pos.z);
			frame.castShadow = true;
			scene.add(frame);
			objects.push(frame);

			for (var i = 0; i < 6; i++) {
				var nozzleGeom = new THREE.CylinderGeometry(0.4, 0.4, 1, 6);
				var nozzleMaterial = new THREE.MeshLambertMaterial({ color: 0x99cc33 });
				var nozzle = new THREE.Mesh(nozzleGeom, nozzleMaterial);
				nozzle.position.set(pos.x - 3 + i * 1.2, 8, pos.z - 1.5);
				scene.add(nozzle);
				objects.push(nozzle);
			}

			var platformGeom = new THREE.BoxGeometry(10, 1, 4);
			var platform = new THREE.Mesh(platformGeom, frameMaterial);
			platform.position.set(pos.x, 0.5, pos.z);
			platform.castShadow = true;
			platform.receiveShadow = true;
			scene.add(platform);
			objects.push(platform);
		});
	}

	function buildWarningBeacons() {
		var positions = [
			{ x: -50, z: 30 },
			{ x: 50, z: 40 },
			{ x: 20, z: -70 }
		];

		positions.forEach(function(pos) {
			var poleGeom = new THREE.CylinderGeometry(1, 1, 8, 6);
			var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
			var pole = new THREE.Mesh(poleGeom, poleMaterial);
			pole.position.set(pos.x, 4, pos.z);
			pole.castShadow = true;
			scene.add(pole);
			objects.push(pole);

			var lightGeom = new THREE.SphereGeometry(1.5, 16, 16);
			var lightMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xaa0000 });
			var beacon = new THREE.Mesh(lightGeom, lightMaterial);
			beacon.position.set(pos.x, 9, pos.z);
			beacon.castShadow = true;
			scene.add(beacon);
			objects.push(beacon);
			animatedElements.push({ obj: beacon, type: 'beacon', time: 0 });
		});
	}

	function buildToxicClouds() {
		var positions = [
			{ x: -30, z: -60 },
			{ x: 40, z: 25 },
			{ x: -60, z: 0 }
		];

		positions.forEach(function(pos) {
			for (var i = 0; i < 3; i++) {
				var cloudGeom = new THREE.SphereGeometry(3 + i, 12, 12);
				var cloudMaterial = new THREE.MeshLambertMaterial({
					color: 0xccff44,
					emissive: 0x88aa00,
					transparent: true,
					opacity: 0.5
				});
				var cloud = new THREE.Mesh(cloudGeom, cloudMaterial);
				cloud.position.set(pos.x + (i - 1) * 2, 5 + i * 2, pos.z + (i - 1) * 1.5);
				scene.add(cloud);
				objects.push(cloud);
				animatedElements.push({
					obj: cloud,
					type: 'cloud',
					time: 0,
					baseY: cloud.position.y,
					baseX: cloud.position.x
				});
			}
		});
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0xccdd88, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffff99, 0.8);
		directionalLight.position.set(50, 60, 40);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var positions = [
			{ x: -40, z: -50, color: 0x88dd22 },
			{ x: 30, z: -40, color: 0xbbff44 },
			{ x: -20, z: 20, color: 0x99cc33 }
		];

		positions.forEach(function(pos) {
			var pointLight = new THREE.PointLight(pos.color, 0.5, 40);
			pointLight.position.set(pos.x, 3, pos.z);
			scene.add(pointLight);
			lights.push(pointLight);
		});
	}

	function update(delta) {
		animatedElements.forEach(function(elem) {
			elem.time += delta;

			if (elem.type === 'bubble') {
				elem.obj.position.y = Math.sin(elem.time * 2) * 2 + 1;
				elem.obj.scale.x = 1 + Math.sin(elem.time * 1.5) * 0.2;
				elem.obj.scale.y = 1 + Math.sin(elem.time * 1.5) * 0.2;
				elem.obj.scale.z = 1 + Math.sin(elem.time * 1.5) * 0.2;
			}

			if (elem.type === 'beacon') {
				elem.obj.rotation.y += delta * 3;
				var pulse = 0.5 + Math.sin(elem.time * 4) * 0.5;
				elem.obj.material.emissiveIntensity = pulse;
			}

			if (elem.type === 'cloud') {
				elem.obj.position.y = elem.baseY + Math.sin(elem.time * 0.8) * 3;
				elem.obj.position.x = elem.baseX + Math.sin(elem.time * 0.5) * 2;
				elem.obj.material.opacity = 0.4 + Math.cos(elem.time * 1.2) * 0.1;
			}
		});
	}

	function reset() {
		objects.forEach(function(obj) {
			scene.remove(obj);
			if (obj.geometry) {
				obj.geometry.dispose();
			}
			if (obj.material) {
				obj.material.dispose();
			}
		});

		lights.forEach(function(light) {
			scene.remove(light);
		});

		objects = [];
		lights = [];
		animatedElements = [];
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
