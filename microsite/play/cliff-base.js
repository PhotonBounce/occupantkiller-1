window.CliffBase = (function() {
	'use strict';

	var scene;
	var camera;
	var cliffObjects = [];
	var elevators = [];
	var rotatingObjects = [];
	var lightSweeps = [];
	var elapsedTime = 0;

	var materialRock;
	var materialMetal;
	var materialGreen;

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		cliffObjects = [];
		elevators = [];
		rotatingObjects = [];
		lightSweeps = [];
		elapsedTime = 0;

		createMaterials();
		buildCliffBase();
		buildElevators();
		buildRadarDish();
		buildHelicopterPad();
		buildObservationDeck();
		buildAmmunitionStorage();
		buildAntiAircraftPositions();
		buildDefensiveNests();
		buildWaterfallColumn();
		buildSupplyCrates();
		buildRappelLines();
		buildLightSweeps();
		buildEnvironmentLighting();
	}

	function createMaterials() {
		materialRock = new THREE.MeshPhongMaterial({ color: 0x666666, shininess: 30 });
		materialMetal = new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 80 });
		materialGreen = new THREE.MeshPhongMaterial({ color: 0x556b2f, shininess: 20 });
	}

	function buildCliffBase() {
		var cliffTexture = new THREE.CanvasTexture(createRockTexture());
		materialRock.map = cliffTexture;

		var baseCliffGeometry = new THREE.BoxGeometry(80, 60, 15);
		var baseCliff = new THREE.Mesh(baseCliffGeometry, materialRock);
		baseCliff.position.set(0, -5, -8);
		baseCliff.castShadow = true;
		baseCliff.receiveShadow = true;
		scene.add(baseCliff);
		cliffObjects.push(baseCliff);

		var ledgeGeometry = new THREE.BoxGeometry(70, 8, 12);
		var ledge1 = new THREE.Mesh(ledgeGeometry, materialRock);
		ledge1.position.set(0, 15, -6);
		ledge1.castShadow = true;
		ledge1.receiveShadow = true;
		scene.add(ledge1);
		cliffObjects.push(ledge1);

		var ledge2 = new THREE.Mesh(ledgeGeometry, materialRock);
		ledge2.position.set(0, 35, -5);
		ledge2.castShadow = true;
		ledge2.receiveShadow = true;
		scene.add(ledge2);
		cliffObjects.push(ledge2);

		var cliffTopGeometry = new THREE.BoxGeometry(75, 10, 14);
		var cliffTop = new THREE.Mesh(cliffTopGeometry, materialRock);
		cliffTop.position.set(0, 55, -7);
		cliffTop.castShadow = true;
		cliffTop.receiveShadow = true;
		scene.add(cliffTop);
		cliffObjects.push(cliffTop);
	}

	function buildElevators() {
		var elevatorPositions = [
			{ x: -25, y: 25, z: 0 },
			{ x: 25, y: 35, z: 0 },
			{ x: 0, y: 15, z: 0 }
		];

		elevatorPositions.forEach(function(pos) {
			var elevatorCabin = buildElevatorUnit(pos.x, pos.y, pos.z);
			elevators.push({
				cabin: elevatorCabin,
				startY: pos.y,
				baseY: pos.y - 15,
				topY: pos.y + 15,
				speed: 0.8 + Math.random() * 0.4
			});
		});
	}

	function buildElevatorUnit(x, y, z) {
		var elevatorGroup = new THREE.Group();

		var cableGeometry = new THREE.CylinderGeometry(0.3, 0.3, 40, 8);
		var cable = new THREE.Mesh(cableGeometry, materialMetal);
		cable.position.set(0, 0, 0);
		elevatorGroup.add(cable);

		var cabinGeometry = new THREE.BoxGeometry(4, 5, 4);
		var cabin = new THREE.Mesh(cabinGeometry, materialGreen);
		cabin.position.set(0, 0, 0);
		cabin.castShadow = true;
		cabin.receiveShadow = true;
		elevatorGroup.add(cabin);

		var doorGeometry = new THREE.BoxGeometry(3, 4.5, 0.3);
		var door = new THREE.Mesh(doorGeometry, materialMetal);
		door.position.set(0, 0, 2.2);
		door.castShadow = true;
		elevatorGroup.add(door);

		elevatorGroup.position.set(x, y, z);
		elevatorGroup.castShadow = true;
		scene.add(elevatorGroup);
		cliffObjects.push(elevatorGroup);

		return elevatorGroup;
	}

	function buildRadarDish() {
		var radarGroup = new THREE.Group();

		var poleGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 16);
		var pole = new THREE.Mesh(poleGeometry, materialMetal);
		pole.position.set(0, 8, 0);
		pole.castShadow = true;
		radarGroup.add(pole);

		var dishGeometry = new THREE.SphereGeometry(3, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
		var dish = new THREE.Mesh(dishGeometry, materialMetal);
		dish.position.set(0, 14, 0);
		dish.scale.set(1, 0.3, 1);
		dish.castShadow = true;
		dish.receiveShadow = true;
		radarGroup.add(dish);

		radarGroup.position.set(30, 50, 5);
		scene.add(radarGroup);
		cliffObjects.push(radarGroup);
		rotatingObjects.push({ object: radarGroup, axis: 'y', speed: 0.5 });
	}

	function buildHelicopterPad() {
		var padGroup = new THREE.Group();

		var baseGeometry = new THREE.CylinderGeometry(12, 12, 1, 32);
		var base = new THREE.Mesh(baseGeometry, materialMetal);
		base.position.set(0, 0, 0);
		base.castShadow = true;
		base.receiveShadow = true;
		padGroup.add(base);

		var ringGeometry = new THREE.CylinderGeometry(12.5, 12.5, 0.3, 32);
		var ring = new THREE.Mesh(ringGeometry, materialGreen);
		ring.position.set(0, 0.8, 0);
		padGroup.add(ring);

		var guideLightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
		var colors = [0xff0000, 0xff0000, 0x00ff00, 0x00ff00];
		var positions = [
			{ x: 10, z: 0 },
			{ x: -10, z: 0 },
			{ x: 0, z: 10 },
			{ x: 0, z: -10 }
		];

		positions.forEach(function(pos, idx) {
			var light = new THREE.Mesh(guideLightGeometry, new THREE.MeshBasicMaterial({ color: colors[idx] }));
			light.position.set(pos.x, 1.5, pos.z);
			padGroup.add(light);
		});

		padGroup.position.set(0, 60, 2);
		scene.add(padGroup);
		cliffObjects.push(padGroup);
	}

	function buildObservationDeck() {
		var deckGroup = new THREE.Group();

		var floorGeometry = new THREE.BoxGeometry(15, 1, 12);
		var floor = new THREE.Mesh(floorGeometry, materialMetal);
		floor.position.set(0, 0, 0);
		floor.castShadow = true;
		floor.receiveShadow = true;
		deckGroup.add(floor);

		var wallGeometry = new THREE.BoxGeometry(15, 4, 0.5);
		var wall = new THREE.Mesh(wallGeometry, materialRock);
		wall.position.set(0, 2.5, -6);
		wall.castShadow = true;
		deckGroup.add(wall);

		var cornerGeometry = new THREE.BoxGeometry(1, 3, 6);
		var cornerLeft = new THREE.Mesh(cornerGeometry, materialMetal);
		cornerLeft.position.set(-7.5, 1.8, -3);
		cornerLeft.castShadow = true;
		deckGroup.add(cornerLeft);

		var cornerRight = new THREE.Mesh(cornerGeometry, materialMetal);
		cornerRight.position.set(7.5, 1.8, -3);
		cornerRight.castShadow = true;
		deckGroup.add(cornerRight);

		var railGeometry = new THREE.CylinderGeometry(0.2, 0.2, 15, 8);
		var railFront = new THREE.Mesh(railGeometry, materialMetal);
		railFront.rotation.z = Math.PI * 0.5;
		railFront.position.set(0, 2, -6);
		deckGroup.add(railFront);

		deckGroup.position.set(-20, 35, 0);
		scene.add(deckGroup);
		cliffObjects.push(deckGroup);
	}

	function buildAmmunitionStorage() {
		var storageGroup = new THREE.Group();

		var mainChamberGeometry = new THREE.CylinderGeometry(8, 8, 10, 16);
		var mainChamber = new THREE.Mesh(mainChamberGeometry, materialRock);
		mainChamber.position.set(0, 0, 0);
		mainChamber.castShadow = true;
		mainChamber.receiveShadow = true;
		storageGroup.add(mainChamber);

		var doorFrameGeometry = new THREE.BoxGeometry(5, 6, 0.8);
		var doorFrame = new THREE.Mesh(doorFrameGeometry, materialMetal);
		doorFrame.position.set(0, 0, 8.5);
		doorFrame.castShadow = true;
		storageGroup.add(doorFrame);

		var reinforcementGeometry = new THREE.CylinderGeometry(0.6, 0.6, 20, 8);
		for (var i = 0; i < 4; i++) {
			var angle = (i * Math.PI * 2) / 4;
			var reinforce = new THREE.Mesh(reinforcementGeometry, materialMetal);
			reinforce.position.set(Math.cos(angle) * 6, 0, Math.sin(angle) * 6);
			reinforce.rotation.z = Math.PI * 0.15;
			storageGroup.add(reinforce);
		}

		storageGroup.position.set(20, 15, -8);
		scene.add(storageGroup);
		cliffObjects.push(storageGroup);
	}

	function buildAntiAircraftPositions() {
		var positions = [
			{ x: -30, y: 28, z: 0 },
			{ x: 35, y: 28, z: 0 },
			{ x: -20, y: 45, z: 0 },
			{ x: 25, y: 45, z: 0 }
		];

		positions.forEach(function(pos) {
			var aaGroup = new THREE.Group();

			var baseGeometry = new THREE.CylinderGeometry(3, 4, 1, 16);
			var base = new THREE.Mesh(baseGeometry, materialMetal);
			base.position.set(0, 0, 0);
			base.castShadow = true;
			aaGroup.add(base);

			var barrelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
			var barrel = new THREE.Mesh(barrelGeometry, materialMetal);
			barrel.rotation.x = 0.3;
			barrel.position.set(0, 3.5, 0);
			barrel.castShadow = true;
			aaGroup.add(barrel);

			var gunBoxGeometry = new THREE.BoxGeometry(2, 1.5, 2);
			var gunBox = new THREE.Mesh(gunBoxGeometry, materialMetal);
			gunBox.position.set(0, 1, 0);
			gunBox.castShadow = true;
			aaGroup.add(gunBox);

			aaGroup.position.set(pos.x, pos.y, pos.z);
			scene.add(aaGroup);
			cliffObjects.push(aaGroup);
		});
	}

	function buildDefensiveNests() {
		var nestPositions = [
			{ x: -35, y: 20, z: -5 },
			{ x: 35, y: 25, z: -4 },
			{ x: -15, y: 38, z: -6 },
			{ x: 20, y: 40, z: -5 }
		];

		nestPositions.forEach(function(pos) {
			var nestGroup = new THREE.Group();

			var windowGeometry = new THREE.BoxGeometry(3, 2.5, 0.6);
			var window = new THREE.Mesh(windowGeometry, new THREE.MeshPhongMaterial({ color: 0x1a1a2e }));
			window.position.set(0, 0, 0);
			window.castShadow = true;
			nestGroup.add(window);

			var sillGeometry = new THREE.BoxGeometry(4, 0.5, 1);
			var sill = new THREE.Mesh(sillGeometry, materialMetal);
			sill.position.set(0, -1.5, 0);
			nestGroup.add(sill);

			var supportGeometry = new THREE.BoxGeometry(0.6, 3, 1);
			var supportLeft = new THREE.Mesh(supportGeometry, materialMetal);
			supportLeft.position.set(-1.8, -0.5, 0);
			nestGroup.add(supportLeft);

			var supportRight = new THREE.Mesh(supportGeometry, materialMetal);
			supportRight.position.set(1.8, -0.5, 0);
			nestGroup.add(supportRight);

			var barrelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
			var gunBarrel = new THREE.Mesh(barrelGeometry, materialMetal);
			gunBarrel.rotation.z = 0.4;
			gunBarrel.position.set(0, 0.5, 0.5);
			nestGroup.add(gunBarrel);

			nestGroup.position.set(pos.x, pos.y, pos.z);
			scene.add(nestGroup);
			cliffObjects.push(nestGroup);
		});
	}

	function buildWaterfallColumn() {
		var waterfallGroup = new THREE.Group();

		var waterGeometry = new THREE.CylinderGeometry(2.5, 2.8, 45, 12);
		var waterMaterial = new THREE.MeshPhongMaterial({
			color: 0x4da6ff,
			opacity: 0.4,
			transparent: true,
			shininess: 100
		});
		var waterColumn = new THREE.Mesh(waterGeometry, waterMaterial);
		waterColumn.position.set(0, 5, 0);
		waterColumn.castShadow = true;
		waterColumn.receiveShadow = true;
		waterfallGroup.add(waterColumn);

		var basePoolGeometry = new THREE.CylinderGeometry(4, 4, 0.8, 24);
		var poolMaterial = new THREE.MeshPhongMaterial({ color: 0x2d5a8c, shininess: 60 });
		var basePool = new THREE.Mesh(basePoolGeometry, poolMaterial);
		basePool.position.set(0, -25, 0);
		basePool.castShadow = true;
		basePool.receiveShadow = true;
		waterfallGroup.add(basePool);

		var rimGeometry = new THREE.CylinderGeometry(4.2, 4.2, 0.4, 24);
		var rim = new THREE.Mesh(rimGeometry, materialRock);
		rim.position.set(0, -24.5, 0);
		waterfallGroup.add(rim);

		waterfallGroup.position.set(-38, 40, -10);
		scene.add(waterfallGroup);
		cliffObjects.push(waterfallGroup);
	}

	function buildSupplyCrates() {
		var cratePositions = [
			{ x: -28, y: 18, z: 2 },
			{ x: -28, y: 18, z: 6 },
			{ x: 28, y: 22, z: 2 },
			{ x: 28, y: 22, z: 6 },
			{ x: -10, y: 20, z: 4 },
			{ x: 10, y: 25, z: 3 }
		];

		cratePositions.forEach(function(pos) {
			var crateGeometry = new THREE.BoxGeometry(3, 3, 3);
			var crateMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
			var crate = new THREE.Mesh(crateGeometry, crateMaterial);
			crate.position.set(pos.x, pos.y, pos.z);
			crate.castShadow = true;
			crate.receiveShadow = true;
			scene.add(crate);
			cliffObjects.push(crate);
		});
	}

	function buildRappelLines() {
		var linePositions = [
			{ x: -20, z: 2 },
			{ x: -5, z: 2 },
			{ x: 10, z: 2 },
			{ x: 25, z: 2 }
		];

		linePositions.forEach(function(pos) {
			var points = [
				new THREE.Vector3(pos.x, 52, pos.z),
				new THREE.Vector3(pos.x - 2, 0, pos.z + 1)
			];
			var lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
			var lineMaterial = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 2 });
			var line = new THREE.LineSegments(lineGeometry, lineMaterial);
			scene.add(line);
			cliffObjects.push(line);
		});
	}

	function buildLightSweeps() {
		var sweep1 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.3, 0.3, 5, 8),
			new THREE.MeshBasicMaterial({ color: 0xffff00 })
		);
		sweep1.position.set(-32, 42, 0);
		scene.add(sweep1);
		lightSweeps.push({
			object: sweep1,
			centerX: -32,
			centerY: 42,
			radius: 25
		});

		var sweep2 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.3, 0.3, 5, 8),
			new THREE.MeshBasicMaterial({ color: 0xffff00 })
		);
		sweep2.position.set(32, 48, 0);
		scene.add(sweep2);
		lightSweeps.push({
			object: sweep2,
			centerX: 32,
			centerY: 48,
			radius: 28
		});
	}

	function buildEnvironmentLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(40, 50, 30);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -100;
		directionalLight.shadow.camera.right = 100;
		directionalLight.shadow.camera.top = 100;
		directionalLight.shadow.camera.bottom = -50;
		scene.add(directionalLight);

		var pointLight1 = new THREE.PointLight(0x00ff00, 0.5, 40);
		pointLight1.position.set(-30, 30, 5);
		scene.add(pointLight1);

		var pointLight2 = new THREE.PointLight(0xff6600, 0.4, 35);
		pointLight2.position.set(30, 25, 5);
		scene.add(pointLight2);
	}

	function createRockTexture() {
		var canvas = document.createElement('canvas');
		canvas.width = 256;
		canvas.height = 256;
		var ctx = canvas.getContext('2d');

		ctx.fillStyle = '#666666';
		ctx.fillRect(0, 0, 256, 256);

		for (var i = 0; i < 500; i++) {
			var x = Math.random() * 256;
			var y = Math.random() * 256;
			var size = Math.random() * 8;
			ctx.fillStyle = '#' + Math.floor(Math.random() * 0x444444).toString(16);
			ctx.fillRect(x, y, size, size);
		}

		return canvas;
	}

	function update(delta) {
		elapsedTime += delta;

		elevators.forEach(function(elevator) {
			var oscillation = Math.sin(elapsedTime * elevator.speed) * (elevator.topY - elevator.baseY) * 0.5;
			elevator.cabin.position.y = elevator.startY + oscillation;
		});

		rotatingObjects.forEach(function(obj) {
			if (obj.axis === 'y') {
				obj.object.rotation.y += 0.8 * delta;
			} else if (obj.axis === 'x') {
				obj.object.rotation.x += obj.speed * delta;
			}
		});

		lightSweeps.forEach(function(sweep) {
			var angle = elapsedTime * 0.6;
			sweep.object.position.x = sweep.centerX + Math.cos(angle) * sweep.radius;
			sweep.object.position.z = sweep.centerZ !== undefined ? sweep.centerZ : 0 + Math.sin(angle) * sweep.radius * 0.5;
		});
	}

	function reset() {
		cliffObjects.forEach(function(obj) {
			if (obj.parent) {
				obj.parent.remove(obj);
			}
		});
		cliffObjects = [];
		elevators = [];
		rotatingObjects = [];
		lightSweeps = [];
		elapsedTime = 0;

		if (scene) {
			init(scene, camera);
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
