window.FlamePit = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var arenaGroup = null;
	var fireTrapMeshes = [];
	var brazierMeshes = [];
	var spectacleLights = [];
	var fireTrapTimers = [];

	var ARENA_RADIUS = 40;
	var ARENA_FLOOR_Y = 0;
	var PIT_DEPTH = 8;
	var SEATING_TIER_HEIGHT = 4;
	var NUM_SEATING_TIERS = 3;
	var SPECTATOR_BOX_HEIGHT = 24;

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		arenaGroup = new THREE.Group();
		scene.add(arenaGroup);

		buildCentralPit();
		buildArenaFloor();
		buildPerimeterWalls();
		buildCardinalGates();
		buildSeatingTiers();
		buildSpectatorBoxes();
		buildChainArchways();
		buildFireBraziers();
		buildWeaponRacks();
		buildEnemySpawnCages();
		buildFireTraps();
		buildSpectacleLighting();
		buildDecorativeColumns();
		buildDestructibleBarrels();
		buildRockFormations();
		buildGladiatorSkulls();

		return true;
	}

	function buildCentralPit() {
		var pitRadius = 12;
		var pitGeom = new THREE.CylinderGeometry(pitRadius, pitRadius + 2, PIT_DEPTH, 32);
		var pitMat = new THREE.MeshStandardMaterial({
			color: 0x3a2a1a,
			metalness: 0.1,
			roughness: 0.9
		});
		var pitMesh = new THREE.Mesh(pitGeom, pitMat);
		pitMesh.position.y = -PIT_DEPTH / 2;
		pitMesh.position.z = 0;
		pitMesh.position.x = 0;
		pitMesh.castShadow = true;
		pitMesh.receiveShadow = true;
		arenaGroup.add(pitMesh);

		var pitFloorGeom = new THREE.CylinderGeometry(pitRadius - 0.5, pitRadius - 0.5, 1, 32);
		var pyreMat = new THREE.MeshStandardMaterial({
			color: 0xff4500,
			emissive: 0xff2200,
			metalness: 0,
			roughness: 0.4
		});
		var pitFloor = new THREE.Mesh(pitFloorGeom, pyreMat);
		pitFloor.position.y = -PIT_DEPTH + 0.5;
		pitFloor.position.z = 0;
		pitFloor.position.x = 0;
		pitFloor.castShadow = true;
		pitFloor.receiveShadow = true;
		arenaGroup.add(pitFloor);

		for (var i = 0; i < 8; i++) {
			var flameGeom = new THREE.ConeGeometry(1.5, 3, 8);
			var flameMat = new THREE.MeshStandardMaterial({
				color: 0xff6600,
				emissive: 0xff3300,
				metalness: 0,
				roughness: 0.5
			});
			var flameMesh = new THREE.Mesh(flameGeom, flameMat);
			var angle = (Math.PI * 2 / 8) * i;
			flameMesh.position.x = Math.cos(angle) * (pitRadius - 3);
			flameMesh.position.y = -PIT_DEPTH + 2;
			flameMesh.position.z = Math.sin(angle) * (pitRadius - 3);
			flameMesh.castShadow = true;
			arenaGroup.add(flameMesh);
		}
	}

	function buildArenaFloor() {
		var floorRadius = ARENA_RADIUS - 2;
		var floorGeom = new THREE.CylinderGeometry(floorRadius, floorRadius, 0.5, 64);
		var floorMat = new THREE.MeshStandardMaterial({
			color: 0x5a4a3a,
			metalness: 0.05,
			roughness: 0.85
		});
		var floorMesh = new THREE.Mesh(floorGeom, floorMat);
		floorMesh.position.y = ARENA_FLOOR_Y;
		floorMesh.castShadow = true;
		floorMesh.receiveShadow = true;
		arenaGroup.add(floorMesh);

		var scorchGeom = new THREE.CylinderGeometry(8, 8, 0.6, 16);
		var scorchMat = new THREE.MeshStandardMaterial({
			color: 0x2a1a0a,
			metalness: 0,
			roughness: 0.95
		});
		for (var i = 0; i < 6; i++) {
			var scorch = new THREE.Mesh(scorchGeom, scorchMat);
			var angle = (Math.PI * 2 / 6) * i;
			scorch.position.x = Math.cos(angle) * 15;
			scorch.position.y = ARENA_FLOOR_Y + 0.3;
			scorch.position.z = Math.sin(angle) * 15;
			scorch.scale.x = 1.2 + Math.random() * 0.4;
			scorch.scale.z = 1.2 + Math.random() * 0.4;
			scorch.castShadow = true;
			arenaGroup.add(scorch);
		}
	}

	function buildPerimeterWalls() {
		var wallHeight = 16;
		var wallThickness = 2;
		var numSegments = 12;

		for (var i = 0; i < numSegments; i++) {
			var angle1 = (Math.PI * 2 / numSegments) * i;
			var angle2 = (Math.PI * 2 / numSegments) * (i + 1);

			var x1 = Math.cos(angle1) * ARENA_RADIUS;
			var z1 = Math.sin(angle1) * ARENA_RADIUS;
			var x2 = Math.cos(angle2) * ARENA_RADIUS;
			var z2 = Math.sin(angle2) * ARENA_RADIUS;

			var dx = x2 - x1;
			var dz = z2 - z1;
			var segmentLength = Math.sqrt(dx * dx + dz * dz);

			var wallGeom = new THREE.BoxGeometry(segmentLength, wallHeight, wallThickness);
			var wallMat = new THREE.MeshStandardMaterial({
				color: 0x4a3a2a,
				metalness: 0.1,
				roughness: 0.8
			});
			var wallMesh = new THREE.Mesh(wallGeom, wallMat);
			wallMesh.position.x = (x1 + x2) / 2;
			wallMesh.position.y = ARENA_FLOOR_Y + wallHeight / 2;
			wallMesh.position.z = (z1 + z2) / 2;
			wallMesh.rotation.y = angle1 + Math.PI / 2;
			wallMesh.castShadow = true;
			wallMesh.receiveShadow = true;
			arenaGroup.add(wallMesh);
		}
	}

	function buildCardinalGates() {
		var gatePositions = [
			{ x: ARENA_RADIUS, z: 0, rot: Math.PI / 2 },
			{ x: -ARENA_RADIUS, z: 0, rot: -Math.PI / 2 },
			{ x: 0, z: ARENA_RADIUS, rot: 0 },
			{ x: 0, z: -ARENA_RADIUS, rot: Math.PI }
		];

		for (var g = 0; g < gatePositions.length; g++) {
			var pos = gatePositions[g];

			var frameGeom = new THREE.BoxGeometry(6, 12, 0.5);
			var ironMat = new THREE.MeshStandardMaterial({
				color: 0x2a2a2a,
				metalness: 0.7,
				roughness: 0.3
			});
			var frame = new THREE.Mesh(frameGeom, ironMat);
			frame.position.x = pos.x * 0.95;
			frame.position.y = ARENA_FLOOR_Y + 6;
			frame.position.z = pos.z * 0.95;
			frame.rotation.y = pos.rot;
			frame.castShadow = true;
			frame.receiveShadow = true;
			arenaGroup.add(frame);

			for (var b = 0; b < 4; b++) {
				var barGeom = new THREE.BoxGeometry(0.3, 12, 0.3);
				var bar = new THREE.Mesh(barGeom, ironMat);
				bar.position.x = pos.x * 0.95 + (b - 1.5) * 1.5;
				bar.position.y = ARENA_FLOOR_Y + 6;
				bar.position.z = pos.z * 0.95;
				bar.rotation.y = pos.rot;
				bar.castShadow = true;
				arenaGroup.add(bar);
			}
		}
	}

	function buildSeatingTiers() {
		var tierRadiusStart = ARENA_RADIUS;
		var tierWidth = 8;

		for (var t = 0; t < NUM_SEATING_TIERS; t++) {
			var innerRadius = tierRadiusStart + t * tierWidth;
			var outerRadius = innerRadius + tierWidth;
			var tierY = ARENA_FLOOR_Y + SEATING_TIER_HEIGHT * (t + 1);

			var tierGeom = new THREE.CylinderGeometry(outerRadius, outerRadius, 1, 64, 1, false, 0, Math.PI * 2);
			var tierMat = new THREE.MeshStandardMaterial({
				color: 0x6a5a4a + (t * 0x111111),
				metalness: 0.05,
				roughness: 0.8
			});
			var tierMesh = new THREE.Mesh(tierGeom, tierMat);
			tierMesh.position.y = tierY;
			tierMesh.castShadow = true;
			tierMesh.receiveShadow = true;
			arenaGroup.add(tierMesh);

			var innerWallGeom = new THREE.CylinderGeometry(innerRadius, innerRadius, SEATING_TIER_HEIGHT + 0.5, 64);
			var wallMat = new THREE.MeshStandardMaterial({
				color: 0x5a4a3a,
				metalness: 0.05,
				roughness: 0.85
			});
			var innerWall = new THREE.Mesh(innerWallGeom, wallMat);
			innerWall.position.y = tierY - 0.5;
			innerWall.castShadow = true;
			innerWall.receiveShadow = true;
			arenaGroup.add(innerWall);
		}
	}

	function buildSpectatorBoxes() {
		var boxPositions = [
			{ x: 35, z: 35 },
			{ x: -35, z: 35 },
			{ x: 35, z: -35 },
			{ x: -35, z: -35 }
		];

		for (var b = 0; b < boxPositions.length; b++) {
			var bpos = boxPositions[b];

			var boxGeom = new THREE.BoxGeometry(8, 6, 8);
			var boxMat = new THREE.MeshStandardMaterial({
				color: 0x8a6a4a,
				metalness: 0.1,
				roughness: 0.75
			});
			var boxMesh = new THREE.Mesh(boxGeom, boxMat);
			boxMesh.position.x = bpos.x;
			boxMesh.position.y = SPECTATOR_BOX_HEIGHT;
			boxMesh.position.z = bpos.z;
			boxMesh.castShadow = true;
			boxMesh.receiveShadow = true;
			arenaGroup.add(boxMesh);

			var roofGeom = new THREE.ConeGeometry(5.5, 2, 4);
			var roofMat = new THREE.MeshStandardMaterial({
				color: 0x3a2a1a,
				metalness: 0,
				roughness: 0.9
			});
			var roof = new THREE.Mesh(roofGeom, roofMat);
			roof.position.x = bpos.x;
			roof.position.y = SPECTATOR_BOX_HEIGHT + 4;
			roof.position.z = bpos.z;
			roof.castShadow = true;
			arenaGroup.add(roof);
		}
	}

	function buildChainArchways() {
		var archCount = 4;

		for (var a = 0; a < archCount; a++) {
			var archAngle = (Math.PI * 2 / archCount) * a;
			var archX = Math.cos(archAngle) * (ARENA_RADIUS - 4);
			var archZ = Math.sin(archAngle) * (ARENA_RADIUS - 4);

			var topGeom = new THREE.BoxGeometry(6, 1, 1);
			var stoneMat = new THREE.MeshStandardMaterial({
				color: 0x4a3a2a,
				metalness: 0.05,
				roughness: 0.85
			});
			var topMesh = new THREE.Mesh(topGeom, stoneMat);
			topMesh.position.x = archX;
			topMesh.position.y = 14;
			topMesh.position.z = archZ;
			topMesh.rotation.y = archAngle + Math.PI / 2;
			topMesh.castShadow = true;
			arenaGroup.add(topMesh);

			for (var c = 0; c < 3; c++) {
				var chainGeom = new THREE.CylinderGeometry(0.15, 0.15, 8, 8);
				var chainMat = new THREE.MeshStandardMaterial({
					color: 0x2a2a2a,
					metalness: 0.8,
					roughness: 0.2
				});
				var chain = new THREE.Mesh(chainGeom, chainMat);
				chain.position.x = archX + (c - 1) * 2;
				chain.position.y = 10;
				chain.position.z = archZ;
				chain.castShadow = true;
				arenaGroup.add(chain);
			}
		}
	}

	function buildFireBraziers() {
		var brazierCount = 8;

		for (var br = 0; br < brazierCount; br++) {
			var bAngle = (Math.PI * 2 / brazierCount) * br;
			var bX = Math.cos(bAngle) * 25;
			var bZ = Math.sin(bAngle) * 25;

			var baseGeom = new THREE.BoxGeometry(3, 0.5, 3);
			var baseMat = new THREE.MeshStandardMaterial({
				color: 0x2a2a2a,
				metalness: 0.6,
				roughness: 0.4
			});
			var base = new THREE.Mesh(baseGeom, baseMat);
			base.position.x = bX;
			base.position.y = ARENA_FLOOR_Y + 0.25;
			base.position.z = bZ;
			base.castShadow = true;
			arenaGroup.add(base);

			var postGeom = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
			var postMat = new THREE.MeshStandardMaterial({
				color: 0x1a1a1a,
				metalness: 0.7,
				roughness: 0.3
			});
			var post = new THREE.Mesh(postGeom, postMat);
			post.position.x = bX;
			post.position.y = ARENA_FLOOR_Y + 3;
			post.position.z = bZ;
			post.castShadow = true;
			arenaGroup.add(post);

			var bowlGeom = new THREE.SphereGeometry(1.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
			var bowlMat = new THREE.MeshStandardMaterial({
				color: 0xff4500,
				emissive: 0xff2200,
				metalness: 0.3,
				roughness: 0.5
			});
			var bowl = new THREE.Mesh(bowlGeom, bowlMat);
			bowl.position.x = bX;
			bowl.position.y = ARENA_FLOOR_Y + 5.5;
			bowl.position.z = bZ;
			bowl.castShadow = true;
			brazierMeshes.push(bowl);
			arenaGroup.add(bowl);
		}
	}

	function buildWeaponRacks() {
		var rackPositions = [
			{ x: -28, z: -28 },
			{ x: 28, z: -28 },
			{ x: -28, z: 28 },
			{ x: 28, z: 28 }
		];

		for (var r = 0; r < rackPositions.length; r++) {
			var rpos = rackPositions[r];

			var frameGeom = new THREE.BoxGeometry(5, 8, 1);
			var frameMat = new THREE.MeshStandardMaterial({
				color: 0x3a3a3a,
				metalness: 0.6,
				roughness: 0.4
			});
			var frame = new THREE.Mesh(frameGeom, frameMat);
			frame.position.x = rpos.x;
			frame.position.y = ARENA_FLOOR_Y + 4;
			frame.position.z = rpos.z;
			frame.castShadow = true;
			frame.receiveShadow = true;
			arenaGroup.add(frame);

			for (var w = 0; w < 4; w++) {
				var weaponGeom = new THREE.BoxGeometry(0.3, 4, 0.15);
				var weaponMat = new THREE.MeshStandardMaterial({
					color: 0x4a4a4a,
					metalness: 0.8,
					roughness: 0.2
				});
				var weapon = new THREE.Mesh(weaponGeom, weaponMat);
				weapon.position.x = rpos.x + (w - 1.5) * 1.2;
				weapon.position.y = ARENA_FLOOR_Y + 4;
				weapon.position.z = rpos.z;
				weapon.rotation.z = 0.3;
				weapon.castShadow = true;
				arenaGroup.add(weapon);
			}
		}
	}

	function buildEnemySpawnCages() {
		var cagePositions = [
			{ x: 0, z: -32 },
			{ x: 32, z: 0 },
			{ x: 0, z: 32 },
			{ x: -32, z: 0 }
		];

		for (var s = 0; s < cagePositions.length; s++) {
			var spos = cagePositions[s];

			var cageGeom = new THREE.BoxGeometry(6, 5, 6);
			var cageMat = new THREE.MeshStandardMaterial({
				color: 0x2a2a2a,
				metalness: 0.7,
				roughness: 0.3
			});
			var cage = new THREE.Mesh(cageGeom, cageMat);
			cage.position.x = spos.x;
			cage.position.y = ARENA_FLOOR_Y - 3;
			cage.position.z = spos.z;
			cage.castShadow = true;
			cage.receiveShadow = true;
			arenaGroup.add(cage);

			var gateGeom = new THREE.BoxGeometry(6, 5, 0.5);
			var gateMat = new THREE.MeshStandardMaterial({
				color: 0x1a1a1a,
				metalness: 0.8,
				roughness: 0.2
			});
			var gate = new THREE.Mesh(gateGeom, gateMat);
			gate.position.x = spos.x;
			gate.position.y = ARENA_FLOOR_Y - 3;
			gate.position.z = spos.z - 3;
			gate.castShadow = true;
			arenaGroup.add(gate);
		}
	}

	function buildFireTraps() {
		var trapPositions = [
			{ x: 15, z: 15 },
			{ x: -15, z: 15 },
			{ x: 15, z: -15 },
			{ x: -15, z: -15 }
		];

		for (var t = 0; t < trapPositions.length; t++) {
			var tpos = trapPositions[t];

			var trapGeom = new THREE.BoxGeometry(4, 0.8, 4);
			var trapMat = new THREE.MeshStandardMaterial({
				color: 0x1a1a1a,
				metalness: 0.5,
				roughness: 0.6
			});
			var trap = new THREE.Mesh(trapGeom, trapMat);
			trap.position.x = tpos.x;
			trap.position.y = ARENA_FLOOR_Y - 0.4;
			trap.position.z = tpos.z;
			trap.castShadow = true;
			trap.receiveShadow = true;
			arenaGroup.add(trap);

			var rimGeom = new THREE.CylinderGeometry(2.2, 2.2, 0.4, 16);
			var rimMat = new THREE.MeshStandardMaterial({
				color: 0x4a4a4a,
				metalness: 0.7,
				roughness: 0.3
			});
			var rim = new THREE.Mesh(rimGeom, rimMat);
			rim.position.x = tpos.x;
			rim.position.y = ARENA_FLOOR_Y + 0.3;
			rim.position.z = tpos.z;
			rim.castShadow = true;
			arenaGroup.add(rim);

			fireTrapMeshes.push({ trap: trap, rim: rim, x: tpos.x, z: tpos.z });
			fireTrapTimers.push(Math.random() * 5);
		}
	}

	function buildSpectacleLighting() {
		var lightPositions = [
			{ x: 0, y: 20, z: 40 },
			{ x: 40, y: 20, z: 0 },
			{ x: 0, y: 20, z: -40 },
			{ x: -40, y: 20, z: 0 }
		];

		for (var l = 0; l < lightPositions.length; l++) {
			var lpos = lightPositions[l];

			var spotLight = new THREE.SpotLight(0xff6600, 1, 60, Math.PI / 4, 0.5, 1.5);
			spotLight.position.set(lpos.x, lpos.y, lpos.z);
			spotLight.target.position.set(0, 0, 0);
			spotLight.castShadow = true;
			arenaGroup.add(spotLight);
			arenaGroup.add(spotLight.target);
			spectacleLights.push(spotLight);
		}
	}

	function buildDecorativeColumns() {
		var colPositions = [
			{ x: -20, z: -20 },
			{ x: 20, z: -20 },
			{ x: -20, z: 20 },
			{ x: 20, z: 20 }
		];

		for (var d = 0; d < colPositions.length; d++) {
			var dpos = colPositions[d];

			var shaftGeom = new THREE.CylinderGeometry(1, 1.2, 12, 12);
			var shaftMat = new THREE.MeshStandardMaterial({
				color: 0x5a4a3a,
				metalness: 0.05,
				roughness: 0.85
			});
			var shaft = new THREE.Mesh(shaftGeom, shaftMat);
			shaft.position.x = dpos.x;
			shaft.position.y = ARENA_FLOOR_Y + 6;
			shaft.position.z = dpos.z;
			shaft.castShadow = true;
			shaft.receiveShadow = true;
			arenaGroup.add(shaft);

			var capGeom = new THREE.SphereGeometry(1.3, 8, 6);
			var capMat = new THREE.MeshStandardMaterial({
				color: 0x6a5a4a,
				metalness: 0.1,
				roughness: 0.8
			});
			var cap = new THREE.Mesh(capGeom, capMat);
			cap.position.x = dpos.x;
			cap.position.y = ARENA_FLOOR_Y + 13;
			cap.position.z = dpos.z;
			cap.castShadow = true;
			arenaGroup.add(cap);
		}
	}

	function buildDestructibleBarrels() {
		var barrelPositions = [
			{ x: -10, z: 0 },
			{ x: 10, z: 0 },
			{ x: 0, z: -10 },
			{ x: 0, z: 10 },
			{ x: -8, z: -8 },
			{ x: 8, z: -8 }
		];

		for (var ba = 0; ba < barrelPositions.length; ba++) {
			var bapos = barrelPositions[ba];

			var barrelGeom = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
			var barrelMat = new THREE.MeshStandardMaterial({
				color: 0x8a6a2a,
				metalness: 0.2,
				roughness: 0.7
			});
			var barrel = new THREE.Mesh(barrelGeom, barrelMat);
			barrel.position.x = bapos.x;
			barrel.position.y = ARENA_FLOOR_Y + 1;
			barrel.position.z = bapos.z;
			barrel.castShadow = true;
			barrel.receiveShadow = true;
			arenaGroup.add(barrel);

			var bandGeom = new THREE.CylinderGeometry(0.82, 0.82, 0.3, 8);
			var bandMat = new THREE.MeshStandardMaterial({
				color: 0x3a3a3a,
				metalness: 0.7,
				roughness: 0.3
			});
			var band = new THREE.Mesh(bandGeom, bandMat);
			band.position.x = bapos.x;
			band.position.y = ARENA_FLOOR_Y + 0.8;
			band.position.z = bapos.z;
			band.castShadow = true;
			arenaGroup.add(band);
		}
	}

	function buildRockFormations() {
		for (var rf = 0; rf < 5; rf++) {
			var rockX = (Math.random() - 0.5) * 60;
			var rockZ = (Math.random() - 0.5) * 60;
			var dist = Math.sqrt(rockX * rockX + rockZ * rockZ);

			if (dist < 12 || dist > 45) {
				rf--;
				continue;
			}

			var rockGeom = new THREE.SphereGeometry(1 + Math.random() * 1.5, 6, 5);
			var rockMat = new THREE.MeshStandardMaterial({
				color: 0x4a4a3a + Math.floor(Math.random() * 0x111111),
				metalness: 0,
				roughness: 0.9
			});
			var rock = new THREE.Mesh(rockGeom, rockMat);
			rock.position.set(rockX, ARENA_FLOOR_Y + Math.random() * 0.5, rockZ);
			rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
			rock.castShadow = true;
			rock.receiveShadow = true;
			arenaGroup.add(rock);
		}
	}

	function buildGladiatorSkulls() {
		var skullPositions = [
			{ x: -35, z: 0 },
			{ x: 35, z: 0 },
			{ x: 0, z: 35 },
			{ x: 0, z: -35 }
		];

		for (var sk = 0; sk < skullPositions.length; sk++) {
			var skpos = skullPositions[sk];

			var skullGeom = new THREE.SphereGeometry(1, 8, 7);
			var skullMat = new THREE.MeshStandardMaterial({
				color: 0xd9d9d9,
				metalness: 0,
				roughness: 0.95
			});
			var skull = new THREE.Mesh(skullGeom, skullMat);
			skull.position.x = skpos.x;
			skull.position.y = ARENA_FLOOR_Y + SEATING_TIER_HEIGHT + 3;
			skull.position.z = skpos.z;
			skull.castShadow = true;
			arenaGroup.add(skull);

			var jawGeom = new THREE.SphereGeometry(0.6, 6, 5);
			var jaw = new THREE.Mesh(jawGeom, skullMat);
			jaw.position.x = skpos.x;
			jaw.position.y = ARENA_FLOOR_Y + SEATING_TIER_HEIGHT + 2.2;
			jaw.position.z = skpos.z;
			jaw.scale.y = 0.5;
			jaw.castShadow = true;
			arenaGroup.add(jaw);

			var eyeGeom = new THREE.SphereGeometry(0.2, 4, 4);
			var eyeMat = new THREE.MeshStandardMaterial({
				color: 0x1a1a1a,
				metalness: 0,
				roughness: 1
			});
			var eye1 = new THREE.Mesh(eyeGeom, eyeMat);
			eye1.position.set(skpos.x - 0.3, ARENA_FLOOR_Y + SEATING_TIER_HEIGHT + 3.5, skpos.z + 0.9);
			arenaGroup.add(eye1);

			var eye2 = new THREE.Mesh(eyeGeom, eyeMat);
			eye2.position.set(skpos.x + 0.3, ARENA_FLOOR_Y + SEATING_TIER_HEIGHT + 3.5, skpos.z + 0.9);
			arenaGroup.add(eye2);
		}
	}

	function updateFireTraps(delta) {
		for (var i = 0; i < fireTrapMeshes.length; i++) {
			fireTrapTimers[i] -= delta;

			if (fireTrapTimers[i] <= 0) {
				eruption(i);
				fireTrapTimers[i] = 4 + Math.random() * 6;
			}

			var eruptionPulse = Math.max(0, 1 - fireTrapTimers[i] / 1.5);
			fireTrapMeshes[i].trap.scale.y = 1 + eruptionPulse * 0.3;
			fireTrapMeshes[i].rim.material.emissive.setHex(Math.floor(0xff2200 * eruptionPulse));
		}
	}

	function eruption(trapIndex) {
		var trap = fireTrapMeshes[trapIndex];
		var flameCount = 3 + Math.floor(Math.random() * 2);

		for (var f = 0; f < flameCount; f++) {
			var flameGeom = new THREE.ConeGeometry(0.8 + Math.random() * 0.4, 2 + Math.random() * 2, 6);
			var flameMat = new THREE.MeshStandardMaterial({
				color: 0xff4500,
				emissive: 0xff3300,
				metalness: 0,
				roughness: 0.5,
				transparent: true,
				opacity: 0.7
			});
			var flame = new THREE.Mesh(flameGeom, flameMat);
			flame.position.x = trap.x + (Math.random() - 0.5) * 2;
			flame.position.y = ARENA_FLOOR_Y + 1 + Math.random() * 1;
			flame.position.z = trap.z + (Math.random() - 0.5) * 2;
			flame.userData.lifespan = 0.5;
			flame.userData.maxLifespan = 0.5;
			arenaGroup.add(flame);
		}
	}

	function updateBraziers(delta) {
		for (var i = 0; i < brazierMeshes.length; i++) {
			var flicker = 0.8 + Math.sin(Math.random() * Math.PI) * 0.2;
			brazierMeshes[i].material.emissive.setHex(Math.floor(0xff2200 * flicker));
		}
	}

	function updateSpectacleLights(delta) {
		for (var i = 0; i < spectacleLights.length; i++) {
			var intensity = 0.6 + Math.sin(Date.now() * 0.001 + i) * 0.4;
			spectacleLights[i].intensity = intensity;
		}
	}

	function updateFlames(delta) {
		var childrenToRemove = [];

		for (var i = arenaGroup.children.length - 1; i >= 0; i--) {
			var child = arenaGroup.children[i];
			if (child.userData.lifespan !== undefined) {
				child.userData.lifespan -= delta;
				child.position.y += delta * 3;

				if (child.userData.maxLifespan > 0) {
					child.material.opacity = (child.userData.lifespan / child.userData.maxLifespan) * 0.7;
				}

				if (child.userData.lifespan <= 0) {
					childrenToRemove.push(child);
				}
			}
		}

		for (var r = 0; r < childrenToRemove.length; r++) {
			arenaGroup.remove(childrenToRemove[r]);
		}
	}

	function update(delta) {
		updateFireTraps(delta);
		updateBraziers(delta);
		updateSpectacleLights(delta);
		updateFlames(delta);

		if (arenaGroup) {
			arenaGroup.rotation.y += delta * 0.01;
		}
	}

	function reset() {
		if (scene && arenaGroup) {
			scene.remove(arenaGroup);
		}

		fireTrapMeshes = [];
		brazierMeshes = [];
		spectacleLights = [];
		fireTrapTimers = [];

		arenaGroup = new THREE.Group();
		scene.add(arenaGroup);

		init(scene, camera);
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
