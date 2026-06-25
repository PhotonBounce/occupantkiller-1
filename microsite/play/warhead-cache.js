window.WarheadCache = (function() {
	'use strict';

	var scene, camera;
	var warheads = [];
	var turrets = [];
	var countdownDisplays = [];
	var rotationSpeed = 0.005;

	function buildVaultDoor() {
		var doorGroup = new THREE.Group();
		var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.2 });
		var handleMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.9, roughness: 0.1 });

		var frameGeometry = new THREE.BoxGeometry(4, 5, 0.5);
		var doorFrame = new THREE.Mesh(frameGeometry, doorMaterial);
		doorFrame.position.z = -10;
		doorGroup.add(doorFrame);

		var handleGeometry = new THREE.SphereGeometry(0.3, 16, 16);
		var handle = new THREE.Mesh(handleGeometry, handleMaterial);
		handle.position.set(1.5, 0, -9.5);
		doorGroup.add(handle);

		return doorGroup;
	}

	function buildMissileRacks() {
		var racksGroup = new THREE.Group();
		var craddleMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 });
		var warheadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });

		for (var i = 0; i < 4; i++) {
			var rackX = -6 + i * 4;
			for (var j = 0; j < 3; j++) {
				var rackZ = -8 + j * 3;

				var cradleGeometry = new THREE.BoxGeometry(3.5, 0.6, 0.8);
				var cradle = new THREE.Mesh(cradleGeometry, craddleMaterial);
				cradle.position.set(rackX, 1 + j * 1.2, rackZ);
				racksGroup.add(cradle);

				var warheadGeometry = new THREE.CylinderGeometry(0.25, 0.25, 2.8, 16);
				var warhead = new THREE.Mesh(warheadGeometry, warheadMaterial);
				warhead.rotation.z = Math.PI / 2;
				warhead.position.set(rackX, 1.2 + j * 1.2, rackZ);
				warhead.index = warheads.length;
				warheads.push(warhead);
				racksGroup.add(warhead);
			}
		}

		return racksGroup;
	}

	function buildStorageCells() {
		var cellsGroup = new THREE.Group();
		var outerMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5 });
		var innerMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4 });

		for (var i = 0; i < 3; i++) {
			var cellX = -7 + i * 7;

			var outerGeometry = new THREE.BoxGeometry(2.8, 3.5, 2.8);
			var outerCell = new THREE.Mesh(outerGeometry, outerMaterial);
			outerCell.position.set(cellX, 2, 5);
			cellsGroup.add(outerCell);

			var innerGeometry = new THREE.BoxGeometry(2.2, 2.8, 2.2);
			var innerCell = new THREE.Mesh(innerGeometry, innerMaterial);
			innerCell.position.set(cellX, 2, 5);
			cellsGroup.add(innerCell);
		}

		return cellsGroup;
	}

	function buildSecurityTurrets() {
		var turretGroup = new THREE.Group();
		var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
		var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 });

		for (var i = 0; i < 2; i++) {
			var turretX = -4 + i * 8;

			var baseGeometry = new THREE.BoxGeometry(1, 0.8, 1);
			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			base.position.set(turretX, 4.5, -5);
			turretGroup.add(base);

			var barrelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 12);
			var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
			barrel.rotation.z = Math.PI / 3;
			barrel.position.set(turretX, 5.3, -5);
			barrel.turretIndex = turrets.length;
			turrets.push(barrel);
			turretGroup.add(barrel);
		}

		return turretGroup;
	}

	function buildCountdownDisplays() {
		var displayGroup = new THREE.Group();
		var screenMaterial = new THREE.MeshStandardMaterial({
			color: 0x00ff00,
			emissive: 0x00ff00,
			emissiveIntensity: 0.8
		});

		for (var i = 0; i < 2; i++) {
			var displayGeometry = new THREE.BoxGeometry(1.5, 1, 0.2);
			var display = new THREE.Mesh(displayGeometry, screenMaterial);
			display.position.set(-5 + i * 10, 3.5, 8);
			display.displayIndex = countdownDisplays.length;
			countdownDisplays.push(display);
			displayGroup.add(display);
		}

		return displayGroup;
	}

	function buildRadiationSymbols() {
		var symbolGroup = new THREE.Group();
		var lineColor = new THREE.Color(0xffcc00);

		var wallPositions = [
			{ x: 0, z: -12 },
			{ x: -10, z: 0 },
			{ x: 10, z: 0 }
		];

		wallPositions.forEach(function(pos) {
			var geometry = new THREE.BufferGeometry();
			var points = [
				new THREE.Vector3(pos.x - 1, 3, pos.z),
				new THREE.Vector3(pos.x + 1, 4, pos.z),
				new THREE.Vector3(pos.x + 1, 3, pos.z),
				new THREE.Vector3(pos.x - 1, 4, pos.z),
				new THREE.Vector3(pos.x - 1, 3, pos.z)
			];
			geometry.setFromPoints(points);
			var line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: lineColor, linewidth: 2 }));
			symbolGroup.add(line);
		});

		return symbolGroup;
	}

	function buildWeaponsTerminal() {
		var terminalGroup = new THREE.Group();
		var cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6 });
		var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x004400, emissive: 0x00ff00, emissiveIntensity: 0.6 });

		var cabinetGeometry = new THREE.BoxGeometry(2.5, 3, 1.5);
		var cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
		cabinet.position.set(0, 1.5, -3);
		terminalGroup.add(cabinet);

		var screenGeometry = new THREE.BoxGeometry(2, 2, 0.1);
		var screen = new THREE.Mesh(screenGeometry, screenMaterial);
		screen.position.set(0, 2.2, -2.3);
		terminalGroup.add(screen);

		var topGeometry = new THREE.ConeGeometry(0.4, 0.5, 8);
		var top = new THREE.Mesh(topGeometry, cabinetMaterial);
		top.position.set(0, 3.3, -3);
		terminalGroup.add(top);

		return terminalGroup;
	}

	function buildFloor() {
		var floorGroup = new THREE.Group();
		var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3 });

		var floorGeometry = new THREE.BoxGeometry(24, 0.5, 20);
		var floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.position.y = -0.25;
		floorGroup.add(floor);

		return floorGroup;
	}

	function buildCeiling() {
		var ceilingGroup = new THREE.Group();
		var ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.4 });

		var ceilingGeometry = new THREE.BoxGeometry(24, 0.5, 20);
		var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
		ceiling.position.y = 5.25;
		ceilingGroup.add(ceiling);

		return ceilingGroup;
	}

	function buildWalls() {
		var wallGroup = new THREE.Group();
		var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.2 });

		var backWallGeometry = new THREE.BoxGeometry(24, 5, 0.5);
		var backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
		backWall.position.set(0, 2.5, -10);
		wallGroup.add(backWall);

		var frontWallGeometry = new THREE.BoxGeometry(24, 5, 0.5);
		var frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
		frontWall.position.set(0, 2.5, 10);
		wallGroup.add(frontWall);

		var leftWallGeometry = new THREE.BoxGeometry(0.5, 5, 20);
		var leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
		leftWall.position.set(-12, 2.5, 0);
		wallGroup.add(leftWall);

		var rightWallGeometry = new THREE.BoxGeometry(0.5, 5, 20);
		var rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
		rightWall.position.set(12, 2.5, 0);
		wallGroup.add(rightWall);

		return wallGroup;
	}

	function init(initScene, initCamera) {
		scene = initScene;
		camera = initCamera;

		var ambientLight = new THREE.AmbientLight(0x444444, 1.2);
		scene.add(ambientLight);

		var spotLight = new THREE.SpotLight(0xffffff, 1.5);
		spotLight.position.set(0, 4.5, 0);
		spotLight.target.position.set(0, 2, 0);
		scene.add(spotLight);

		var redLight = new THREE.PointLight(0xff3300, 0.8);
		redLight.position.set(-8, 3, -8);
		scene.add(redLight);

		scene.add(buildFloor());
		scene.add(buildCeiling());
		scene.add(buildWalls());
		scene.add(buildVaultDoor());
		scene.add(buildMissileRacks());
		scene.add(buildStorageCells());
		scene.add(buildSecurityTurrets());
		scene.add(buildCountdownDisplays());
		scene.add(buildRadiationSymbols());
		scene.add(buildWeaponsTerminal());
	}

	function update(delta) {
		var i;
		for (i = 0; i < warheads.length; i++) {
			warheads[i].rotation.y += rotationSpeed * delta;
		}

		for (i = 0; i < turrets.length; i++) {
			turrets[i].rotation.z += rotationSpeed * 0.7 * delta;
		}

		for (i = 0; i < countdownDisplays.length; i++) {
			countdownDisplays[i].rotation.y += rotationSpeed * 0.5 * delta;
		}
	}

	function reset() {
		warheads = [];
		turrets = [];
		countdownDisplays = [];
		if (scene) {
			scene.clear();
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
