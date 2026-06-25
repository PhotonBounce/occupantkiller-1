window.WarAirfield = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animatedObjects = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedObjects = [];

		buildLighting();
		buildRunway();
		buildHangars();
		buildControlTower();
		buildRadarDish();
		buildFuelDepot();
		buildRunwayLights();
		buildFighterJets();
		buildAntiAircraftGuns();
		buildFencing();
		buildMilitaryTrucks();
		buildMiscellaneousObjects();
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(100, 80, 50);
		directionalLight.castShadow = true;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var pointLight1 = new THREE.PointLight(0xffaa44, 0.5);
		pointLight1.position.set(-50, 30, 80);
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0x4488ff, 0.4);
		pointLight2.position.set(100, 25, -60);
		scene.add(pointLight2);
		lights.push(pointLight2);
	}

	function buildRunway() {
		var geometry = new THREE.BoxGeometry(300, 1, 80);
		var material = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var runway = new THREE.Mesh(geometry, material);
		runway.position.set(0, 0, 0);
		scene.add(runway);
		objects.push(runway);

		var lineGeometry = new THREE.BufferGeometry();
		var linePositions = [];
		for (var i = -150; i <= 150; i += 20) {
			linePositions.push(i, 0.1, 0);
			linePositions.push(i, 0.1, 0);
		}
		lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
		var lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
		var lines = new THREE.LineSegments(lineGeometry, lineMaterial);
		scene.add(lines);
		objects.push(lines);
	}

	function buildHangars() {
		var positions = [
			{ x: -80, z: 60 },
			{ x: -80, z: 120 },
			{ x: -80, z: -60 },
			{ x: 80, z: 60 },
			{ x: 80, z: 120 },
			{ x: 80, z: -60 }
		];

		positions.forEach(function(pos) {
			var geometry = new THREE.BoxGeometry(35, 25, 50);
			var material = new THREE.MeshLambertMaterial({ color: 0x444444 });
			var hangar = new THREE.Mesh(geometry, material);
			hangar.position.set(pos.x, 12.5, pos.z);
			scene.add(hangar);
			objects.push(hangar);

			var roofGeometry = new THREE.BoxGeometry(37, 3, 52);
			var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var roof = new THREE.Mesh(roofGeometry, roofMaterial);
			roof.position.set(pos.x, 26, pos.z);
			scene.add(roof);
			objects.push(roof);

			var crackGeometry = new THREE.BoxGeometry(15, 20, 2);
			var crackMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var crack = new THREE.Mesh(crackGeometry, crackMaterial);
			crack.position.set(pos.x, 10, pos.z + 24);
			scene.add(crack);
			objects.push(crack);
		});
	}

	function buildControlTower() {
		var baseGeometry = new THREE.BoxGeometry(12, 8, 12);
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.set(-120, 4, -80);
		scene.add(base);
		objects.push(base);

		var towerGeometry = new THREE.BoxGeometry(10, 30, 10);
		var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var tower = new THREE.Mesh(towerGeometry, towerMaterial);
		tower.position.set(-120, 19, -80);
		scene.add(tower);
		objects.push(tower);

		var cabinGeometry = new THREE.BoxGeometry(12, 8, 12);
		var cabinMaterial = new THREE.MeshLambertMaterial({ color: 0x4d4dff });
		var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
		cabin.position.set(-120, 37, -80);
		scene.add(cabin);
		objects.push(cabin);

		var radarSupportGeometry = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
		var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
		var support = new THREE.Mesh(radarSupportGeometry, supportMaterial);
		support.position.set(-120, 42, -80);
		scene.add(support);
		objects.push(support);
	}

	function buildRadarDish() {
		var dishGeometry = new THREE.SphereGeometry(6, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
		var dishMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
		var dish = new THREE.Mesh(dishGeometry, dishMaterial);
		dish.position.set(-120, 50, -80);
		scene.add(dish);
		objects.push(dish);
		animatedObjects.push({ mesh: dish, type: 'radar' });

		var poleGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
		var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var pole = new THREE.Mesh(poleGeometry, poleMaterial);
		pole.position.set(-120, 41, -80);
		scene.add(pole);
		objects.push(pole);
	}

	function buildFuelDepot() {
		var positions = [
			{ x: 120, z: 80 },
			{ x: 135, z: 80 },
			{ x: 120, z: 95 },
			{ x: 135, z: 95 }
		];

		positions.forEach(function(pos) {
			var tankGeometry = new THREE.CylinderGeometry(6, 6, 16, 16);
			var tankMaterial = new THREE.MeshLambertMaterial({ color: 0xaa5500 });
			var tank = new THREE.Mesh(tankGeometry, tankMaterial);
			tank.position.set(pos.x, 8, pos.z);
			scene.add(tank);
			objects.push(tank);

			var capGeometry = new THREE.SphereGeometry(6, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.3);
			var capMaterial = new THREE.MeshLambertMaterial({ color: 0x664400 });
			var cap = new THREE.Mesh(capGeometry, capMaterial);
			cap.position.set(pos.x, 16, pos.z);
			scene.add(cap);
			objects.push(cap);

			var ventGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
			var ventMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var vent = new THREE.Mesh(ventGeometry, ventMaterial);
			vent.position.set(pos.x, 18.5, pos.z);
			scene.add(vent);
			objects.push(vent);
		});

		var pipeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 30, 8);
		var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
		pipe.position.set(127.5, 9, 87.5);
		pipe.rotation.z = Math.PI / 2;
		scene.add(pipe);
		objects.push(pipe);
	}

	function buildRunwayLights() {
		var positions = [
			{ x: -160, z: -45 },
			{ x: -160, z: 45 },
			{ x: 160, z: -45 },
			{ x: 160, z: 45 },
			{ x: -100, z: -40 },
			{ x: -100, z: 40 },
			{ x: 100, z: -40 },
			{ x: 100, z: 40 },
			{ x: -50, z: -42 },
			{ x: -50, z: 42 },
			{ x: 50, z: -42 },
			{ x: 50, z: 42 }
		];

		positions.forEach(function(pos) {
			var poleGeometry = new THREE.CylinderGeometry(0.5, 0.6, 5, 8);
			var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var pole = new THREE.Mesh(poleGeometry, poleMaterial);
			pole.position.set(pos.x, 2.5, pos.z);
			scene.add(pole);
			objects.push(pole);

			var lightGeometry = new THREE.SphereGeometry(0.8, 8, 8);
			var lightMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
			var light = new THREE.Mesh(lightGeometry, lightMaterial);
			light.position.set(pos.x, 5.5, pos.z);
			scene.add(light);
			objects.push(light);
			animatedObjects.push({ mesh: light, type: 'blink' });
		});
	}

	function buildFighterJets() {
		var positions = [
			{ x: -40, z: 140 },
			{ x: 20, z: 140 },
			{ x: -40, z: -140 },
			{ x: 40, z: -140 }
		];

		positions.forEach(function(pos) {
			var fuselageGeometry = new THREE.BoxGeometry(4, 3, 14);
			var fuselageMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
			var fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
			fuselage.position.set(pos.x, 1.5, pos.z);
			scene.add(fuselage);
			objects.push(fuselage);

			var cockpitGeometry = new THREE.BoxGeometry(2, 1.5, 3);
			var cockpitMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
			cockpit.position.set(pos.x, 2, pos.z + 4);
			scene.add(cockpit);
			objects.push(cockpit);

			var wingGeometry = new THREE.BoxGeometry(12, 0.8, 3);
			var wingMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
			var wing = new THREE.Mesh(wingGeometry, wingMaterial);
			wing.position.set(pos.x, 1.8, pos.z);
			scene.add(wing);
			objects.push(wing);

			var engineGeometry = new THREE.CylinderGeometry(1, 1.2, 3, 8);
			var engineMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
			var engine = new THREE.Mesh(engineGeometry, engineMaterial);
			engine.position.set(pos.x, 1, pos.z - 5);
			scene.add(engine);
			objects.push(engine);
		});
	}

	function buildAntiAircraftGuns() {
		var positions = [
			{ x: -140, z: 100 },
			{ x: 140, z: 100 },
			{ x: -140, z: -100 },
			{ x: 140, z: -100 }
		];

		positions.forEach(function(pos) {
			var baseGeometry = new THREE.CylinderGeometry(3, 4, 2, 16);
			var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			base.position.set(pos.x, 1, pos.z);
			scene.add(base);
			objects.push(base);

			var muzzleGeometry = new THREE.CylinderGeometry(1.5, 1.8, 8, 12);
			var muzzleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var muzzle = new THREE.Mesh(muzzleGeometry, muzzleMaterial);
			muzzle.position.set(pos.x, 5, pos.z);
			muzzle.rotation.z = Math.PI * 0.3;
			scene.add(muzzle);
			objects.push(muzzle);
			animatedObjects.push({ mesh: muzzle, type: 'gun', originalRotation: muzzle.rotation.z });

			var sightGeometry = new THREE.ConeGeometry(0.8, 3, 8);
			var sightMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
			var sight = new THREE.Mesh(sightGeometry, sightMaterial);
			sight.position.set(pos.x + 1, 6, pos.z);
			scene.add(sight);
			objects.push(sight);
		});
	}

	function buildFencing() {
		var fencePositions = [
			{ x1: -170, z1: -150, x2: -170, z2: 150 },
			{ x1: 170, z1: -150, x2: 170, z2: 150 },
			{ x1: -170, z1: -150, x2: 170, z2: -150 },
			{ x1: -170, z1: 150, x2: 170, z2: 150 }
		];

		fencePositions.forEach(function(seg) {
			var segmentLength = Math.sqrt(Math.pow(seg.x2 - seg.x1, 2) + Math.pow(seg.z2 - seg.z1, 2));
			var angle = Math.atan2(seg.z2 - seg.z1, seg.x2 - seg.x1);
			var midX = (seg.x1 + seg.x2) / 2;
			var midZ = (seg.z1 + seg.z2) / 2;

			var postCount = Math.floor(segmentLength / 30);
			for (var i = 0; i <= postCount; i++) {
				var t = i / postCount;
				var postX = seg.x1 + (seg.x2 - seg.x1) * t;
				var postZ = seg.z1 + (seg.z2 - seg.z1) * t;

				var postGeometry = new THREE.CylinderGeometry(0.4, 0.5, 6, 8);
				var postMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
				var post = new THREE.Mesh(postGeometry, postMaterial);
				post.position.set(postX, 3, postZ);
				scene.add(post);
				objects.push(post);

				var wireGeometry = new THREE.CylinderGeometry(0.15, 0.15, 6, 6);
				var wireMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
				var wire = new THREE.Mesh(wireGeometry, wireMaterial);
				wire.position.set(postX, 3, postZ);
				scene.add(wire);
				objects.push(wire);
			}
		});
	}

	function buildMilitaryTrucks() {
		var positions = [
			{ x: -60, z: -100 },
			{ x: 60, z: -100 },
			{ x: -70, z: 110 }
		];

		positions.forEach(function(pos) {
			var cabGeometry = new THREE.BoxGeometry(5, 4, 6);
			var cabMaterial = new THREE.MeshLambertMaterial({ color: 0x447722 });
			var cab = new THREE.Mesh(cabGeometry, cabMaterial);
			cab.position.set(pos.x, 2, pos.z);
			scene.add(cab);
			objects.push(cab);

			var bedGeometry = new THREE.BoxGeometry(6, 2, 12);
			var bedMaterial = new THREE.MeshLambertMaterial({ color: 0x335511 });
			var bed = new THREE.Mesh(bedGeometry, bedMaterial);
			bed.position.set(pos.x, 3.5, pos.z - 8);
			scene.add(bed);
			objects.push(bed);

			var wheelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 1, 16);
			var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });

			var wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheel1.position.set(pos.x - 2, 1.2, pos.z + 1);
			scene.add(wheel1);
			objects.push(wheel1);

			var wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheel2.position.set(pos.x + 2, 1.2, pos.z + 1);
			scene.add(wheel2);
			objects.push(wheel2);

			var wheel3 = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheel3.position.set(pos.x - 2, 1.2, pos.z - 6);
			scene.add(wheel3);
			objects.push(wheel3);

			var wheel4 = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheel4.position.set(pos.x + 2, 1.2, pos.z - 6);
			scene.add(wheel4);
			objects.push(wheel4);

			var canopyGeometry = new THREE.BoxGeometry(5, 2.5, 5);
			var canopyMaterial = new THREE.MeshLambertMaterial({ color: 0x335511 });
			var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
			canopy.position.set(pos.x, 5.5, pos.z - 7);
			scene.add(canopy);
			objects.push(canopy);
		});
	}

	function buildMiscellaneousObjects() {
		var containerPositions = [
			{ x: 100, z: -80 },
			{ x: 115, z: -80 },
			{ x: 130, z: -80 }
		];

		containerPositions.forEach(function(pos) {
			var containerGeometry = new THREE.BoxGeometry(8, 8, 10);
			var containerMaterial = new THREE.MeshLambertMaterial({ color: 0xdd5500 });
			var container = new THREE.Mesh(containerGeometry, containerMaterial);
			container.position.set(pos.x, 4, pos.z);
			scene.add(container);
			objects.push(container);

			var doorGeometry = new THREE.BoxGeometry(6, 6, 0.5);
			var doorMaterial = new THREE.MeshLambertMaterial({ color: 0xbb4400 });
			var door = new THREE.Mesh(doorGeometry, doorMaterial);
			door.position.set(pos.x, 4, pos.z + 5.2);
			scene.add(door);
			objects.push(door);
		});

		var sandbagPositions = [
			{ x: -120, z: 20 },
			{ x: -115, z: 20 },
			{ x: -125, z: 20 },
			{ x: -120, z: 25 },
			{ x: -110, z: 20 },
			{ x: -120, z: 30 }
		];

		sandbagPositions.forEach(function(pos) {
			var sandbagGeometry = new THREE.BoxGeometry(2, 1.5, 3);
			var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x887744 });
			var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
			sandbag.position.set(pos.x, 0.75, pos.z);
			scene.add(sandbag);
			objects.push(sandbag);
		});

		var radarEquipmentGeometry = new THREE.BoxGeometry(3, 4, 5);
		var radarEquipmentMaterial = new THREE.MeshLambertMaterial({ color: 0x4d4dff });
		var radarEquipment = new THREE.Mesh(radarEquipmentGeometry, radarEquipmentMaterial);
		radarEquipment.position.set(-130, 2, -75);
		scene.add(radarEquipment);
		objects.push(radarEquipment);

		var generatorGeometry = new THREE.BoxGeometry(4, 3, 4);
		var generatorMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var generator = new THREE.Mesh(generatorGeometry, generatorMaterial);
		generator.position.set(-130, 1.5, -65);
		scene.add(generator);
		objects.push(generator);

		var exhaustGeometry = new THREE.CylinderGeometry(0.8, 0.8, 5, 8);
		var exhaustMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
		exhaust.position.set(-130, 4.5, -65);
		scene.add(exhaust);
		objects.push(exhaust);

		var helipadGeometry = new THREE.CylinderGeometry(15, 15, 0.5, 32);
		var helipadMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var helipad = new THREE.Mesh(helipadGeometry, helipadMaterial);
		helipad.position.set(50, 0.25, 50);
		scene.add(helipad);
		objects.push(helipad);

		var markingGeometry = new THREE.CylinderGeometry(12, 12, 0.1, 32);
		var markingMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
		var marking = new THREE.Mesh(markingGeometry, markingMaterial);
		marking.position.set(50, 0.3, 50);
		scene.add(marking);
		objects.push(marking);

		var warningBoxPositions = [
			{ x: -140, z: 0 },
			{ x: 140, z: 0 }
		];

		warningBoxPositions.forEach(function(pos) {
			var warningGeometry = new THREE.BoxGeometry(2, 3, 2);
			var warningMaterial = new THREE.MeshLambertMaterial({ color: 0xff5500 });
			var warning = new THREE.Mesh(warningGeometry, warningMaterial);
			warning.position.set(pos.x, 1.5, pos.z);
			scene.add(warning);
			objects.push(warning);

			var stripGeometry = new THREE.BoxGeometry(2.5, 0.3, 2.5);
			var stripMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
			var strip = new THREE.Mesh(stripGeometry, stripMaterial);
			strip.position.set(pos.x, 3.5, pos.z);
			scene.add(strip);
			objects.push(strip);
		});
	}

	function update(delta) {
		animatedObjects.forEach(function(obj) {
			if (obj.type === 'radar') {
				obj.mesh.rotation.y += delta * 0.5;
			}
			else if (obj.type === 'blink') {
				var blinkCycle = 0.6;
				var blinkPhase = (Date.now() / 1000) % blinkCycle;
				obj.mesh.material.opacity = blinkPhase < 0.3 ? 1 : 0.2;
				obj.mesh.material.transparent = true;
			}
			else if (obj.type === 'gun') {
				var gunTime = Date.now() / 1000;
				var gunOscillation = Math.sin(gunTime * 0.8) * 0.2;
				obj.mesh.rotation.z = obj.originalRotation + gunOscillation;
			}
		});
	}

	function reset() {
		objects.forEach(function(obj) {
			scene.remove(obj);
		});
		lights.forEach(function(light) {
			scene.remove(light);
		});
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
})();
