window.IceBridge = (function() {
	'use strict';

	// Module state
	var scene = null;
	var camera = null;
	var bridgeGroup = null;
	var wallGroup = null;
	var blizzardGroup = null;
	var effectsGroup = null;
	var elapsedTime = 0;

	// Blizzard snowflakes array
	var snowflakes = [];
	var snowflakeCount = 300;

	// Cracking ice animation
	var cracks = [];
	var crackTime = 0;
	var crackSpreading = false;

	// Snow drifts
	var driftBoxes = [];

	// Ice cannon
	var iceCannonGroup = null;
	var cannonRotation = 0;
	var projectiles = [];

	// Frozen soldiers
	var frozenSoldiers = [];

	function init(sceneArg, cameraArg) {
		scene = sceneArg;
		camera = cameraArg;

		bridgeGroup = new THREE.Group();
		wallGroup = new THREE.Group();
		blizzardGroup = new THREE.Group();
		effectsGroup = new THREE.Group();

		scene.add(bridgeGroup);
		scene.add(wallGroup);
		scene.add(blizzardGroup);
		scene.add(effectsGroup);

		// Set fog for blizzard atmosphere
		scene.fog = new THREE.Fog(0xb0d4ff, 150, 500);

		createIceBridge();
		createGlacierWalls();
		createChasmbBelow();
		createCrackingIce();
		createBlizzard();
		createEnemyDugouts();
		createIceStalactites();
		createCrevasses();
		createFrozenSoldiers();
		createSupplySled();
		createSnowDrifts();
		createIceCannon();

		return true;
	}

	function createIceBridge() {
		var bridgeLength = 200;
		var bridgeWidth = 60;
		var bridgeHeight = 8;

		// Main bridge deck made of ice block segments
		var blockSize = 20;
		var iceColor = 0xb0e0ff;
		var iceEmissive = 0x4a8fc4;

		for (var x = -bridgeLength / 2; x < bridgeLength / 2; x += blockSize) {
			for (var z = -bridgeWidth / 2; z < bridgeWidth / 2; z += blockSize) {
				var iceGeom = new THREE.BoxGeometry(blockSize - 0.5, bridgeHeight, blockSize - 0.5);
				var iceMat = new THREE.MeshStandardMaterial({
					color: iceColor,
					emissive: iceEmissive,
					metalness: 0.3,
					roughness: 0.2
				});
				var iceBlock = new THREE.Mesh(iceGeom, iceMat);
				iceBlock.position.set(x, 0, z);
				iceBlock.castShadow = true;
				iceBlock.receiveShadow = true;
				bridgeGroup.add(iceBlock);
			}
		}

		// Add edge railings as ice formations
		var railHeight = 15;
		var railGeom = new THREE.BoxGeometry(bridgeLength, railHeight, 2);
		var railMat = new THREE.MeshStandardMaterial({
			color: 0xa0d0ff,
			metalness: 0.2,
			roughness: 0.3
		});

		var railLeft = new THREE.Mesh(railGeom, railMat);
		railLeft.position.set(0, railHeight / 2, -bridgeWidth / 2 - 3);
		railLeft.castShadow = true;
		railLeft.receiveShadow = true;
		bridgeGroup.add(railLeft);

		var railRight = new THREE.Mesh(railGeom, railMat);
		railRight.position.set(0, railHeight / 2, bridgeWidth / 2 + 3);
		railRight.castShadow = true;
		railRight.receiveShadow = true;
		bridgeGroup.add(railRight);
	}

	function createGlacierWalls() {
		var wallHeight = 300;
		var wallDepth = 100;
		var wallColor = 0x6b9bc4;
		var wallEmissive = 0x2c4a6b;

		// Left glacier wall
		var leftWallGeom = new THREE.BoxGeometry(40, wallHeight, wallDepth);
		var wallMat = new THREE.MeshStandardMaterial({
			color: wallColor,
			emissive: wallEmissive,
			roughness: 0.4,
			metalness: 0.1
		});
		var leftWall = new THREE.Mesh(leftWallGeom, wallMat);
		leftWall.position.set(-100, wallHeight / 2 - 50, 0);
		leftWall.castShadow = true;
		leftWall.receiveShadow = true;
		wallGroup.add(leftWall);

		// Right glacier wall
		var rightWall = new THREE.Mesh(leftWallGeom, wallMat);
		rightWall.position.set(100, wallHeight / 2 - 50, 0);
		rightWall.castShadow = true;
		rightWall.receiveShadow = true;
		wallGroup.add(rightWall);

		// Add ice texture variation to walls
		for (var i = 0; i < 8; i++) {
			var iceBlockGeom = new THREE.BoxGeometry(15, 20, 15);
			var iceBlockMat = new THREE.MeshStandardMaterial({
				color: 0x4a7ba7,
				roughness: 0.5
			});
			var iceBlock = new THREE.Mesh(iceBlockGeom, iceBlockMat);
			iceBlock.position.set(-100 + Math.random() * 30 - 15, 50 + i * 30, Math.random() * 50 - 25);
			iceBlock.castShadow = true;
			iceBlock.receiveShadow = true;
			wallGroup.add(iceBlock);

			var iceBlock2 = new THREE.Mesh(iceBlockGeom, iceBlockMat);
			iceBlock2.position.set(100 + Math.random() * 30 - 15, 50 + i * 30, Math.random() * 50 - 25);
			iceBlock2.castShadow = true;
			iceBlock2.receiveShadow = true;
			wallGroup.add(iceBlock2);
		}
	}

	function createChasmbBelow() {
		// Distant chasm floor visible far below
		var chasmFloorGeom = new THREE.BoxGeometry(300, 20, 200);
		var chasmMat = new THREE.MeshStandardMaterial({
			color: 0x1a2a4a,
			metalness: 0.1,
			roughness: 0.8
		});
		var chasmFloor = new THREE.Mesh(chasmFloorGeom, chasmMat);
		chasmFloor.position.set(0, -400, 0);
		chasmFloor.castShadow = true;
		chasmFloor.receiveShadow = true;
		scene.add(chasmFloor);

		// Add distant ice formations in chasm
		for (var i = 0; i < 10; i++) {
			var iceFormGeom = new THREE.ConeGeometry(8, 40, 8);
			var iceFormMat = new THREE.MeshStandardMaterial({
				color: 0x3a5a7a,
				roughness: 0.5
			});
			var iceForm = new THREE.Mesh(iceFormGeom, iceFormMat);
			iceForm.position.set(
				Math.random() * 200 - 100,
				-350 + Math.random() * 50,
				Math.random() * 100 - 50
			);
			iceForm.castShadow = true;
			iceForm.receiveShadow = true;
			scene.add(iceForm);
		}
	}

	function createCrackingIce() {
		var crackColor = 0x1a1a2a;
		var bridgeLength = 200;
		var bridgeWidth = 60;

		// Create initial crack pattern
		for (var i = 0; i < 6; i++) {
			var startX = Math.random() * bridgeLength - bridgeLength / 2;
			var startZ = Math.random() * bridgeWidth - bridgeWidth / 2;

			var crack = {
				startX: startX,
				startZ: startZ,
				length: 5,
				maxLength: 40 + Math.random() * 30,
				angle: Math.random() * Math.PI * 2,
				growing: false,
				growSpeed: 0.5,
				geometry: null,
				mesh: null
			};

			var points = [
				new THREE.Vector3(startX, 1, startZ),
				new THREE.Vector3(startX + Math.cos(crack.angle) * crack.length, 1, startZ + Math.sin(crack.angle) * crack.length)
			];
			crack.geometry = new THREE.BufferGeometry().setFromPoints(points);
			var crackMat = new THREE.LineBasicMaterial({ color: crackColor, linewidth: 2 });
			crack.mesh = new THREE.LineSegments(crack.geometry, crackMat);
			bridgeGroup.add(crack.mesh);
			cracks.push(crack);
		}
	}

	function createBlizzard() {
		var snowColor = 0xffffff;
		for (var i = 0; i < snowflakeCount; i++) {
			var snowGeom = new THREE.SphereGeometry(0.3, 4, 4);
			var snowMat = new THREE.MeshBasicMaterial({ color: snowColor, transparent: true, opacity: 0.7 });
			var snowflake = new THREE.Mesh(snowGeom, snowMat);

			snowflake.position.set(
				Math.random() * 400 - 200,
				Math.random() * 300 - 50,
				Math.random() * 300 - 150
			);

			snowflake.userData = {
				speedX: (Math.random() - 0.5) * 60,
				speedY: Math.random() * 10 - 30,
				speedZ: (Math.random() - 0.5) * 40,
				rotation: Math.random() * Math.PI * 2
			};

			blizzardGroup.add(snowflake);
			snowflakes.push(snowflake);
		}
	}

	function createEnemyDugouts() {
		var dugoutColor = 0x2a3a4a;
		var dugoutWidth = 12;
		var dugoutHeight = 8;
		var dugoutDepth = 20;

		// Left wall dugouts
		for (var i = 0; i < 3; i++) {
			var dugoutGeom = new THREE.BoxGeometry(dugoutWidth, dugoutHeight, dugoutDepth);
			var dugoutMat = new THREE.MeshStandardMaterial({
				color: dugoutColor,
				roughness: 0.6
			});
			var dugout = new THREE.Mesh(dugoutGeom, dugoutMat);
			dugout.position.set(-108, 80 + i * 70, -10);
			dugout.castShadow = true;
			dugout.receiveShadow = true;
			wallGroup.add(dugout);

			// Gun ports - small spheres representing openings
			var portGeom = new THREE.SphereGeometry(2, 8, 8);
			var portMat = new THREE.MeshStandardMaterial({ color: 0x0a0a1a });
			var port = new THREE.Mesh(portGeom, portMat);
			port.position.set(-108 + 3, 80 + i * 70 + 2, 8);
			wallGroup.add(port);
		}

		// Right wall dugouts
		for (var i = 0; i < 3; i++) {
			var dugoutGeom = new THREE.BoxGeometry(dugoutWidth, dugoutHeight, dugoutDepth);
			var dugoutMat = new THREE.MeshStandardMaterial({
				color: dugoutColor,
				roughness: 0.6
			});
			var dugout = new THREE.Mesh(dugoutGeom, dugoutMat);
			dugout.position.set(108, 80 + i * 70, -10);
			dugout.castShadow = true;
			dugout.receiveShadow = true;
			wallGroup.add(dugout);

			var portGeom = new THREE.SphereGeometry(2, 8, 8);
			var portMat = new THREE.MeshStandardMaterial({ color: 0x0a0a1a });
			var port = new THREE.Mesh(portGeom, portMat);
			port.position.set(108 - 3, 80 + i * 70 + 2, 8);
			wallGroup.add(port);
		}
	}

	function createIceStalactites() {
		var stalactiteColor = 0x7ab8d9;
		var ceilingZ = 150;

		for (var i = 0; i < 12; i++) {
			var xPos = Math.random() * 200 - 100;
			var zPos = Math.random() * 80 - 40;

			var stalactiteGeom = new THREE.ConeGeometry(3, 25 + Math.random() * 20, 8);
			var stalactiteMat = new THREE.MeshStandardMaterial({
				color: stalactiteColor,
				roughness: 0.3,
				metalness: 0.1
			});
			var stalactite = new THREE.Mesh(stalactiteGeom, stalactiteMat);
			stalactite.position.set(xPos, ceilingZ, zPos);
			stalactite.castShadow = true;
			stalactite.receiveShadow = true;
			effectsGroup.add(stalactite);
		}
	}

	function createCrevasses() {
		var crevasseDarkColor = 0x0a1a2a;
		var bridgeLength = 200;
		var bridgeWidth = 60;

		for (var i = 0; i < 5; i++) {
			var crevasseGeom = new THREE.BoxGeometry(15, 30, 8);
			var crevasseMat = new THREE.MeshStandardMaterial({
				color: crevasseDarkColor,
				roughness: 0.8
			});
			var crevasse = new THREE.Mesh(crevasseGeom, crevasseMat);
			crevasse.position.set(
				Math.random() * (bridgeLength - 40) - (bridgeLength / 2 - 20),
				-10,
				Math.random() * (bridgeWidth - 20) - (bridgeWidth / 2 - 10)
			);
			crevasse.castShadow = true;
			crevasse.receiveShadow = true;
			bridgeGroup.add(crevasse);
		}
	}

	function createFrozenSoldiers() {
		var soldierColor = 0x3a4a5a;

		// Soldiers encased in glacier walls
		for (var i = 0; i < 6; i++) {
			var bodyGeom = new THREE.BoxGeometry(2, 6, 1.5);
			var bodyMat = new THREE.MeshStandardMaterial({
				color: soldierColor,
				roughness: 0.5
			});
			var soldier = new THREE.Mesh(bodyGeom, bodyMat);

			var xPos = i < 3 ? -95 : 95;
			soldier.position.set(xPos, 100 + (i % 3) * 60, Math.random() * 30 - 15);
			soldier.castShadow = true;
			soldier.receiveShadow = true;
			wallGroup.add(soldier);

			// Add head
			var headGeom = new THREE.SphereGeometry(0.8, 8, 8);
			var headMat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a });
			var head = new THREE.Mesh(headGeom, headMat);
			head.position.set(xPos, 106, Math.random() * 30 - 15);
			head.castShadow = true;
			head.receiveShadow = true;
			wallGroup.add(head);

			frozenSoldiers.push(soldier);
		}
	}

	function createSupplySled() {
		var sledColor = 0x8b6914;
		var sledMat = new THREE.MeshStandardMaterial({
			color: sledColor,
			roughness: 0.4,
			metalness: 0.2
		});

		// Sled deck
		var sledGeom = new THREE.BoxGeometry(20, 2, 10);
		var sled = new THREE.Mesh(sledGeom, sledMat);
		sled.position.set(30, 10, 0);
		sled.castShadow = true;
		sled.receiveShadow = true;
		bridgeGroup.add(sled);

		// Runner blades (cylinders)
		var runnerGeom = new THREE.CylinderGeometry(1, 1, 18, 8);
		var runnerMat = new THREE.MeshStandardMaterial({
			color: 0x4a4a4a,
			roughness: 0.3,
			metalness: 0.5
		});

		var runnerLeft = new THREE.Mesh(runnerGeom, runnerMat);
		runnerLeft.rotation.z = Math.PI / 2;
		runnerLeft.position.set(30, 2, -3);
		runnerLeft.castShadow = true;
		runnerLeft.receiveShadow = true;
		bridgeGroup.add(runnerLeft);

		var runnerRight = new THREE.Mesh(runnerGeom, runnerMat);
		runnerRight.rotation.z = Math.PI / 2;
		runnerRight.position.set(30, 2, 3);
		runnerRight.castShadow = true;
		runnerRight.receiveShadow = true;
		bridgeGroup.add(runnerRight);

		// Supply boxes
		for (var i = 0; i < 3; i++) {
			var boxGeom = new THREE.BoxGeometry(6, 5, 4);
			var boxMat = new THREE.MeshStandardMaterial({ color: 0x6b4c2a });
			var box = new THREE.Mesh(boxGeom, boxMat);
			box.position.set(28 + i * 3, 8, 0);
			box.castShadow = true;
			box.receiveShadow = true;
			bridgeGroup.add(box);
		}
	}

	function createSnowDrifts() {
		var driftColor = 0xf0f0ff;
		var driftMat = new THREE.MeshStandardMaterial({
			color: driftColor,
			roughness: 0.6,
			metalness: 0.05
		});

		// Snow accumulation against various obstacles
		var driftPositions = [
			{ x: -60, z: -25 },
			{ x: 60, z: 25 },
			{ x: -30, z: 30 },
			{ x: 50, z: -20 },
			{ x: 0, z: -28 }
		];

		for (var i = 0; i < driftPositions.length; i++) {
			var driftGeom = new THREE.BoxGeometry(15, 5, 10);
			var drift = new THREE.Mesh(driftGeom, driftMat);
			drift.position.set(driftPositions[i].x, 3, driftPositions[i].z);
			drift.castShadow = true;
			drift.receiveShadow = true;
			bridgeGroup.add(drift);
			driftBoxes.push(drift);
		}
	}

	function createIceCannon() {
		iceCannonGroup = new THREE.Group();

		// Base
		var baseGeom = new THREE.BoxGeometry(8, 4, 12);
		var baseMat = new THREE.MeshStandardMaterial({
			color: 0x2a3a4a,
			roughness: 0.5
		});
		var base = new THREE.Mesh(baseGeom, baseMat);
		base.position.set(-50, 8, 0);
		base.castShadow = true;
		base.receiveShadow = true;
		iceCannonGroup.add(base);

		// Barrel (cylinder)
		var barrelGeom = new THREE.CylinderGeometry(1.5, 1.5, 30, 8);
		var barrelMat = new THREE.MeshStandardMaterial({
			color: 0x4a5a6a,
			metalness: 0.6,
			roughness: 0.2
		});
		var barrel = new THREE.Mesh(barrelGeom, barrelMat);
		barrel.rotation.z = Math.PI / 2;
		barrel.position.set(-50, 12, 0);
		barrel.castShadow = true;
		barrel.receiveShadow = true;
		iceCannonGroup.add(barrel);

		iceCannonGroup.position.set(0, 0, 0);
		effectsGroup.add(iceCannonGroup);
	}

	function update(delta) {
		elapsedTime += delta;
		crackTime += delta;

		// Update blizzard snowflakes
		for (var i = 0; i < snowflakes.length; i++) {
			var snow = snowflakes[i];
			snow.position.x += snow.userData.speedX * delta;
			snow.position.y += snow.userData.speedY * delta;
			snow.position.z += snow.userData.speedZ * delta;

			snow.rotation.x += (snow.userData.speedX * delta) * 0.1;
			snow.rotation.y += (snow.userData.speedZ * delta) * 0.1;

			// Wrap around edges
			if (snow.position.x > 200) snow.position.x = -200;
			if (snow.position.x < -200) snow.position.x = 200;
			if (snow.position.y < -100) snow.position.y = 300;
			if (snow.position.z > 200) snow.position.z = -200;
			if (snow.position.z < -200) snow.position.z = 200;
		}

		// Update cracking ice - spread cracks over time
		if (crackTime > 2.0) {
			crackSpreading = !crackSpreading;
			crackTime = 0;
		}

		if (crackSpreading) {
			for (var i = 0; i < cracks.length; i++) {
				var crack = cracks[i];
				if (crack.length < crack.maxLength) {
					crack.length += crack.growSpeed * delta * 10;
					var endX = crack.startX + Math.cos(crack.angle) * crack.length;
					var endZ = crack.startZ + Math.sin(crack.angle) * crack.length;

					var points = [
						new THREE.Vector3(crack.startX, 1, crack.startZ),
						new THREE.Vector3(endX, 1, endZ)
					];
					crack.geometry.dispose();
					crack.geometry = new THREE.BufferGeometry().setFromPoints(points);
					crack.mesh.geometry = crack.geometry;
				}
			}
		}

		// Update snow drifts - slight accumulation animation
		for (var i = 0; i < driftBoxes.length; i++) {
			var drift = driftBoxes[i];
			drift.scale.y = 1 + Math.sin(elapsedTime * 0.5 + i) * 0.1;
		}

		// Update ice cannon rotation and firing
		if (iceCannonGroup) {
			cannonRotation += delta * 0.3;
			iceCannonGroup.rotation.y = cannonRotation;

			// Fire projectiles periodically
			if (Math.floor(elapsedTime * 2) % 20 === 0 && projectiles.length < 10) {
				var projectileGeom = new THREE.SphereGeometry(0.8, 6, 6);
				var projectileMat = new THREE.MeshStandardMaterial({
					color: 0x6be0ff,
					metalness: 0.7,
					roughness: 0.1
				});
				var projectile = new THREE.Mesh(projectileGeom, projectileMat);
				projectile.position.copy(iceCannonGroup.position);
				projectile.position.x += Math.cos(cannonRotation) * 20;
				projectile.position.z += Math.sin(cannonRotation) * 20;

				projectile.userData = {
					vx: Math.cos(cannonRotation) * 120,
					vz: Math.sin(cannonRotation) * 120,
					vy: 20,
					age: 0
				};

				effectsGroup.add(projectile);
				projectiles.push(projectile);
			}

			// Update projectiles
			for (var i = projectiles.length - 1; i >= 0; i--) {
				var proj = projectiles[i];
				proj.userData.age += delta;
				proj.position.x += proj.userData.vx * delta;
				proj.position.y += proj.userData.vy * delta;
				proj.position.z += proj.userData.vz * delta;
				proj.userData.vy -= 80 * delta; // gravity

				// Remove old projectiles
				if (proj.userData.age > 5 || proj.position.y < -100) {
					effectsGroup.remove(proj);
					proj.geometry.dispose();
					proj.material.dispose();
					projectiles.splice(i, 1);
				}
			}
		}

		// Update frozen soldiers - slight sway
		for (var i = 0; i < frozenSoldiers.length; i++) {
			frozenSoldiers[i].rotation.x = Math.sin(elapsedTime * 0.2 + i) * 0.02;
		}

		return true;
	}

	function reset() {
		// Clear projectiles
		for (var i = 0; i < projectiles.length; i++) {
			var proj = projectiles[i];
			effectsGroup.remove(proj);
			if (proj.geometry) proj.geometry.dispose();
			if (proj.material) proj.material.dispose();
		}
		projectiles = [];

		// Reset time
		elapsedTime = 0;
		crackTime = 0;
		crackSpreading = false;
		cannonRotation = 0;

		// Reset snowflakes to starting positions
		for (var i = 0; i < snowflakes.length; i++) {
			snowflakes[i].position.set(
				Math.random() * 400 - 200,
				Math.random() * 300 - 50,
				Math.random() * 300 - 150
			);
		}

		return true;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};

}());
