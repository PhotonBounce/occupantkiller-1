window.BattleCanyon = (function() {
	'use strict';

	var scene;
	var camera;
	var objects = [];
	var bridges = [];
	var turbines = [];
	var searchlights = [];
	var swayPhase = 0;
	var rotationPhase = 0;
	var searchPhase = 0;

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		scene.background = new THREE.Color(0x87ceeb);
		scene.fog = new THREE.Fog(0x87ceeb, 150, 300);

		buildCanyonWalls();
		buildCanyonFloor();
		buildRopeBridges();
		buildBunkers();
		buildTurbines();
		buildSearchlights();
		buildSupplyDebris();
		buildRockOutcroppings();
		buildVTOLPlatforms();
		buildEnemyPositions();

		return {
			objects: objects
		};
	}

	function buildCanyonWalls() {
		var leftWallMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
		var rightWallMaterial = new THREE.MeshLambertMaterial({ color: 0xa0522d });

		var leftWallGeometry = new THREE.BoxGeometry(15, 50, 100);
		var leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
		leftWall.position.set(-32, 15, 0);
		leftWall.castShadow = true;
		leftWall.receiveShadow = true;
		scene.add(leftWall);
		objects.push(leftWall);

		var rightWallGeometry = new THREE.BoxGeometry(15, 50, 100);
		var rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
		rightWall.position.set(32, 15, 0);
		rightWall.castShadow = true;
		rightWall.receiveShadow = true;
		scene.add(rightWall);
		objects.push(rightWall);

		var backWallGeometry = new THREE.BoxGeometry(70, 45, 8);
		var backWallMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
		var backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
		backWall.position.set(0, 18, -48);
		backWall.castShadow = true;
		backWall.receiveShadow = true;
		scene.add(backWall);
		objects.push(backWall);
	}

	function buildCanyonFloor() {
		var floorMaterial = new THREE.MeshLambertMaterial({ color: 0xd2b48c });

		var floorGeometry = new THREE.BoxGeometry(70, 2, 100);
		var floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.position.set(0, -18, 0);
		floor.receiveShadow = true;
		scene.add(floor);
		objects.push(floor);

		var dirtRidgeGeometry = new THREE.BoxGeometry(68, 1, 95);
		var dirtRidgeMaterial = new THREE.MeshLambertMaterial({ color: 0xc9a876 });
		var dirtRidge = new THREE.Mesh(dirtRidgeGeometry, dirtRidgeMaterial);
		dirtRidge.position.set(0, -17, 5);
		dirtRidge.receiveShadow = true;
		scene.add(dirtRidge);
		objects.push(dirtRidge);
	}

	function buildRopeBridges() {
		var bridgeCount = 3;
		var bridgeSpacing = 80 / (bridgeCount + 1);

		for (var i = 0; i < bridgeCount; i++) {
			var bridgeZ = -30 + (i * bridgeSpacing);
			var bridgeData = {
				mesh: null,
				z: bridgeZ,
				baseRotation: 0,
				phase: i * 2.0
			};

			var platformGeometry = new THREE.BoxGeometry(50, 1.5, 4);
			var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
			var platform = new THREE.Mesh(platformGeometry, platformMaterial);
			platform.position.set(0, 5, bridgeZ);
			platform.castShadow = true;
			platform.receiveShadow = true;
			scene.add(platform);
			objects.push(platform);
			bridgeData.mesh = platform;

			var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x8b7355, linewidth: 2 });
			var ropeGeometry = new THREE.BufferGeometry();
			var ropePositions = new Float32Array([
				-25, 5, bridgeZ, -25, 12, bridgeZ,
				25, 5, bridgeZ, 25, 12, bridgeZ,
				-25, 5, bridgeZ, 0, 3, bridgeZ,
				25, 5, bridgeZ, 0, 3, bridgeZ
			]);
			ropeGeometry.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
			var ropes = new THREE.LineSegments(ropeGeometry, ropeMaterial);
			scene.add(ropes);

			bridges.push(bridgeData);
		}
	}

	function buildBunkers() {
		var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
		var gunPortMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

		for (var i = 0; i < 4; i++) {
			var bunkerX = i % 2 === 0 ? -25 : 25;
			var bunkerZ = -35 + (i * 25);
			var bunkerY = 8;

			var bunkerGeometry = new THREE.BoxGeometry(12, 10, 8);
			var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
			bunker.position.set(bunkerX, bunkerY, bunkerZ);
			bunker.castShadow = true;
			bunker.receiveShadow = true;
			scene.add(bunker);
			objects.push(bunker);

			var gunPortGeometry = new THREE.CylinderGeometry(1.2, 1.2, 1, 8);
			var gunPort = new THREE.Mesh(gunPortGeometry, gunPortMaterial);
			gunPort.position.set(bunkerX, bunkerY + 2, bunkerZ + 4.5);
			gunPort.rotation.z = Math.PI / 2;
			gunPort.castShadow = true;
			scene.add(gunPort);
			objects.push(gunPort);
		}
	}

	function buildTurbines() {
		var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
		var bladeMaterial = new THREE.MeshLambertMaterial({ color: 0xd3d3d3 });

		for (var i = 0; i < 2; i++) {
			var turbineX = i === 0 ? -28 : 28;
			var turbineZ = 25;

			var towerGeometry = new THREE.CylinderGeometry(2, 2.5, 30, 8);
			var tower = new THREE.Mesh(towerGeometry, towerMaterial);
			tower.position.set(turbineX, 5, turbineZ);
			tower.castShadow = true;
			tower.receiveShadow = true;
			scene.add(tower);
			objects.push(tower);

			var nacelle = {
				mesh: new THREE.Group(),
				rotationSpeed: 0.8 + (i * 0.3),
				phase: i * Math.PI
			};

			var nacelleGeometry = new THREE.BoxGeometry(3, 2, 6);
			var nacelleMesh = new THREE.Mesh(nacelleGeometry, towerMaterial);
			nacelle.mesh.add(nacelleMesh);

			for (var j = 0; j < 3; j++) {
				var bladeGeometry = new THREE.BoxGeometry(1.5, 12, 0.5);
				var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
				blade.position.y = 8;
				blade.rotation.z = (j * (2 * Math.PI / 3));
				nacelle.mesh.add(blade);
			}

			nacelle.mesh.position.set(turbineX, 20, turbineZ);
			scene.add(nacelle.mesh);
			turbines.push(nacelle);
		}
	}

	function buildSearchlights() {
		var baseGeometry = new THREE.CylinderGeometry(1.5, 1.5, 1, 8);
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

		for (var i = 0; i < 2; i++) {
			var lightX = i === 0 ? -28 : 28;
			var lightZ = -40;

			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			base.position.set(lightX, 12, lightZ);
			scene.add(base);
			objects.push(base);

			var spotlightGeometry = new THREE.CylinderGeometry(0.8, 1.2, 3, 8);
			var spotlightMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
			var spotlight = new THREE.Mesh(spotlightGeometry, spotlightMaterial);
			spotlight.position.set(lightX, 14, lightZ);

			var searchlight = {
				mesh: spotlight,
				baseX: lightX,
				baseZ: lightZ,
				phase: i * Math.PI,
				sweepSpeed: 0.5
			};

			scene.add(spotlight);
			searchlights.push(searchlight);
		}
	}

	function buildSupplyDebris() {
		var debrisMaterial = new THREE.MeshLambertMaterial({ color: 0x8b8680 });

		var debrisPositions = [
			[0, -16, -20],
			[-8, -16, 10],
			[12, -16, 30],
			[-15, -16, 0],
			[18, -16, -10]
		];

		for (var i = 0; i < debrisPositions.length; i++) {
			var pos = debrisPositions[i];
			var debrisGeometry = new THREE.BoxGeometry(4, 2, 3);
			var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
			debris.position.set(pos[0], pos[1], pos[2]);
			debris.rotation.z = Math.random() * 0.5;
			debris.castShadow = true;
			debris.receiveShadow = true;
			scene.add(debris);
			objects.push(debris);
		}
	}

	function buildRockOutcroppings() {
		var rockMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

		var rockPositions = [
			[-35, -10, 15],
			[35, -10, -15],
			[-20, -12, -30],
			[25, -12, 25],
			[0, -14, 40]
		];

		for (var i = 0; i < rockPositions.length; i++) {
			var pos = rockPositions[i];
			var rockGeometry = new THREE.SphereGeometry(3 + Math.random() * 2, 6, 6);
			var rock = new THREE.Mesh(rockGeometry, rockMaterial);
			rock.position.set(pos[0], pos[1], pos[2]);
			rock.castShadow = true;
			rock.receiveShadow = true;
			scene.add(rock);
			objects.push(rock);
		}
	}

	function buildVTOLPlatforms() {
		var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x556b2f });

		for (var i = 0; i < 2; i++) {
			var platformX = i === 0 ? -30 : 30;
			var platformZ = 10;

			var platformGeometry = new THREE.BoxGeometry(14, 1, 14);
			var platform = new THREE.Mesh(platformGeometry, platformMaterial);
			platform.position.set(platformX, 18, platformZ);
			platform.castShadow = true;
			platform.receiveShadow = true;
			scene.add(platform);
			objects.push(platform);

			var edgeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
			var edgeMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });

			var corners = [
				[-7, -7],
				[7, -7],
				[-7, 7],
				[7, 7]
			];

			for (var j = 0; j < corners.length; j++) {
				var corner = corners[j];
				var edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
				edge.position.set(platformX + corner[0], 18.5, platformZ + corner[1]);
				scene.add(edge);
				objects.push(edge);
			}
		}
	}

	function buildEnemyPositions() {
		var barricadeMaterial = new THREE.MeshLambertMaterial({ color: 0xcd5c5c });

		var barricadePositions = [
			[0, -15, -45],
			[-8, -15, -44],
			[8, -15, -45]
		];

		for (var i = 0; i < barricadePositions.length; i++) {
			var pos = barricadePositions[i];
			var barricadeGeometry = new THREE.BoxGeometry(3, 4, 2);
			var barricade = new THREE.Mesh(barricadeGeometry, barricadeMaterial);
			barricade.position.set(pos[0], pos[1], pos[2]);
			barricade.castShadow = true;
			barricade.receiveShadow = true;
			scene.add(barricade);
			objects.push(barricade);
		}

		var fortMaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
		var fortGeometry = new THREE.ConeGeometry(8, 5, 8);
		var fort = new THREE.Mesh(fortGeometry, fortMaterial);
		fort.position.set(0, -13, -48);
		fort.castShadow = true;
		fort.receiveShadow = true;
		scene.add(fort);
		objects.push(fort);
	}

	function update(delta) {
		swayPhase += delta * 0.5;
		rotationPhase += delta * 0.3;
		searchPhase += delta * 0.2;

		updateBridges();
		updateTurbines();
		updateSearchlights();
	}

	function updateBridges() {
		for (var i = 0; i < bridges.length; i++) {
			var bridge = bridges[i];
			var sway = Math.sin(swayPhase + bridge.phase) * 0.02;
			bridge.mesh.rotation.z = sway;
			bridge.mesh.position.y = 5 + Math.abs(sway) * 0.5;
		}
	}

	function updateTurbines() {
		for (var i = 0; i < turbines.length; i++) {
			var turbine = turbines[i];
			turbine.mesh.rotation.z += delta * turbine.rotationSpeed * 0.1;
		}
	}

	function updateSearchlights() {
		for (var i = 0; i < searchlights.length; i++) {
			var light = searchlights[i];
			var sweep = Math.sin(searchPhase + light.phase) * 35;
			light.mesh.position.x = light.baseX + sweep;
			light.mesh.rotation.y = Math.cos(searchPhase + light.phase) * 0.5;
		}
	}

	function reset() {
		swayPhase = 0;
		rotationPhase = 0;
		searchPhase = 0;

		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		for (var i = 0; i < bridges.length; i++) {
			scene.remove(bridges[i].mesh);
		}
		for (var i = 0; i < turbines.length; i++) {
			scene.remove(turbines[i].mesh);
		}
		for (var i = 0; i < searchlights.length; i++) {
			scene.remove(searchlights[i].mesh);
		}

		objects = [];
		bridges = [];
		turbines = [];
		searchlights = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
