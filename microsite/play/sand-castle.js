window.SandCastle = (function() {
	'use strict';

	var scene, camera;
	var fortressGroup, animationState;
	var sandDunes, palmTrees, flags, marketplace, walls;
	var TIME_SCALE = 1.0;

	function createMaterial(color, roughness, metalness) {
		var material = new THREE.MeshStandardMaterial({
			color: color,
			roughness: roughness || 0.8,
			metalness: metalness || 0.0
		});
		return material;
	}

	function createOuterWalls() {
		var wallGroup = new THREE.Group();
		var wallMaterial = createMaterial(0xD4A574, 0.9, 0);

		// Front wall
		var frontWall = new THREE.Mesh(
			new THREE.BoxGeometry(80, 25, 4),
			wallMaterial
		);
		frontWall.position.set(0, 12.5, -45);
		wallGroup.add(frontWall);

		// Back wall
		var backWall = new THREE.Mesh(
			new THREE.BoxGeometry(80, 25, 4),
			wallMaterial
		);
		backWall.position.set(0, 12.5, 45);
		wallGroup.add(backWall);

		// Left wall
		var leftWall = new THREE.Mesh(
			new THREE.BoxGeometry(4, 25, 90),
			wallMaterial
		);
		leftWall.position.set(-40, 12.5, 0);
		wallGroup.add(leftWall);

		// Right wall
		var rightWall = new THREE.Mesh(
			new THREE.BoxGeometry(4, 25, 90),
			wallMaterial
		);
		rightWall.position.set(40, 12.5, 0);
		wallGroup.add(rightWall);

		// Crenellations - arched gate segments
		for (var i = 0; i < 12; i++) {
			var crenelX = -35 + (i * 6);
			var crenelBlock = new THREE.Mesh(
				new THREE.BoxGeometry(2, 8, 2),
				wallMaterial
			);
			crenelBlock.position.set(crenelX, 30, -46);
			wallGroup.add(crenelBlock);
		}

		// Arched gate - using stacked cylinders as arch supports
		var archLeft = new THREE.Mesh(
			new THREE.CylinderGeometry(3, 3, 4, 16),
			wallMaterial
		);
		archLeft.position.set(-10, 18, -46);
		wallGroup.add(archLeft);

		var archRight = new THREE.Mesh(
			new THREE.CylinderGeometry(3, 3, 4, 16),
			wallMaterial
		);
		archRight.position.set(10, 18, -46);
		wallGroup.add(archRight);

		var archTop = new THREE.Mesh(
			new THREE.BoxGeometry(22, 3, 4),
			wallMaterial
		);
		archTop.position.set(0, 22, -46);
		wallGroup.add(archTop);

		// Gateway opening
		var gateOpening = new THREE.Mesh(
			new THREE.BoxGeometry(18, 14, 1),
			createMaterial(0x1a1a1a, 1.0, 0)
		);
		gateOpening.position.set(0, 12, -44.5);
		wallGroup.add(gateOpening);

		return wallGroup;
	}

	function createCornerTowers() {
		var towerGroup = new THREE.Group();
		var towerMaterial = createMaterial(0xC9964F, 0.85, 0);

		var corners = [
			{ x: -38, z: -43 },
			{ x: 38, z: -43 },
			{ x: -38, z: 43 },
			{ x: 38, z: 43 }
		];

		for (var i = 0; i < corners.length; i++) {
			var corner = corners[i];

			// Tower cylinder
			var tower = new THREE.Mesh(
				new THREE.CylinderGeometry(8, 8, 30, 16),
				towerMaterial
			);
			tower.position.set(corner.x, 15, corner.z);
			towerGroup.add(tower);

			// Dome cap on top
			var dome = new THREE.Mesh(
				new THREE.SphereGeometry(8, 16, 16),
				createMaterial(0xB8860B, 0.7, 0)
			);
			dome.position.set(corner.x, 32, corner.z);
			dome.scale.set(1, 0.6, 1);
			towerGroup.add(dome);

			// Crescent ornament on dome
			var crescent = new THREE.Mesh(
				new THREE.CylinderGeometry(2, 2, 3, 8),
				createMaterial(0xFFD700, 0.3, 0.5)
			);
			crescent.position.set(corner.x + 5, 38, corner.z);
			crescent.rotation.z = Math.PI / 4;
			towerGroup.add(crescent);
		}

		return towerGroup;
	}

	function createInnerPalace() {
		var palaceGroup = new THREE.Group();
		var palaceMaterial = createMaterial(0xE8B66B, 0.8, 0);

		// Main palace building
		var palace = new THREE.Mesh(
			new THREE.BoxGeometry(35, 20, 40),
			palaceMaterial
		);
		palace.position.set(0, 10, 0);
		palaceGroup.add(palace);

		// Decorative arch windows - using cylinder segments
		for (var row = 0; row < 2; row++) {
			for (var col = 0; col < 4; col++) {
				var windowX = -12 + (col * 8);
				var windowY = 12 + (row * 6);
				var windowZ = -21;

				var windowFrame = new THREE.Mesh(
					new THREE.CylinderGeometry(2.5, 2.5, 2, 12),
					createMaterial(0x8B7355, 0.6, 0)
				);
				windowFrame.rotation.z = Math.PI / 2;
				windowFrame.position.set(windowX, windowY, windowZ);
				palaceGroup.add(windowFrame);

				// Window opening
				var windowHole = new THREE.Mesh(
					new THREE.SphereGeometry(2, 8, 8),
					createMaterial(0x1a1a1a, 1.0, 0)
				);
				windowHole.position.set(windowX, windowY, windowZ - 1);
				palaceGroup.add(windowHole);
			}
		}

		// Central courtyard floor
		var courtyardFloor = new THREE.Mesh(
			new THREE.BoxGeometry(30, 0.5, 30),
			createMaterial(0xCDA878, 0.95, 0)
		);
		courtyardFloor.position.set(0, 0.25, 0);
		palaceGroup.add(courtyardFloor);

		return palaceGroup;
	}

	function createMarketplace() {
		var marketGroup = new THREE.Group();
		var stallMaterial = createMaterial(0xD2961E, 0.85, 0);
		var poleMaterial = createMaterial(0x8B4513, 0.9, 0);

		// Market stalls in courtyard
		for (var i = 0; i < 5; i++) {
			for (var j = 0; j < 3; j++) {
				var stallX = -15 + (i * 8);
				var stallZ = -8 + (j * 8);

				// Awning poles
				var pole1 = new THREE.Mesh(
					new THREE.CylinderGeometry(0.8, 0.8, 8, 8),
					poleMaterial
				);
				pole1.position.set(stallX - 3, 4, stallZ - 3);
				marketGroup.add(pole1);

				var pole2 = new THREE.Mesh(
					new THREE.CylinderGeometry(0.8, 0.8, 8, 8),
					poleMaterial
				);
				pole2.position.set(stallX + 3, 4, stallZ + 3);
				marketGroup.add(pole2);

				// Awning fabric
				var awning = new THREE.Mesh(
					new THREE.BoxGeometry(8, 0.3, 8),
					createMaterial(0xE74C3C, 0.7, 0)
				);
				awning.position.set(stallX, 7.8, stallZ);
				marketGroup.add(awning);

				// Stall counter
				var counter = new THREE.Mesh(
					new THREE.BoxGeometry(6, 2, 4),
					stallMaterial
				);
				counter.position.set(stallX, 1, stallZ);
				marketGroup.add(counter);
			}
		}

		// Overturned carts
		for (var k = 0; k < 3; k++) {
			var cartX = -20 + (k * 20);
			var cartZ = 15;

			var cartBody = new THREE.Mesh(
				new THREE.BoxGeometry(6, 3, 4),
				createMaterial(0x8B6F47, 0.9, 0)
			);
			cartBody.position.set(cartX, 1.5, cartZ);
			cartBody.rotation.z = 0.3;
			marketGroup.add(cartBody);

			// Cart wheel
			var wheel = new THREE.Mesh(
				new THREE.CylinderGeometry(2, 2, 0.8, 16),
				createMaterial(0x4A4A4A, 0.8, 0)
			);
			wheel.rotation.z = Math.PI / 2;
			wheel.position.set(cartX + 3, 2, cartZ - 2);
			marketGroup.add(wheel);
		}

		return marketGroup;
	}

	function createCentralFountain() {
		var fountainGroup = new THREE.Group();
		var stoneMaterial = createMaterial(0xA0826D, 0.85, 0);

		// Pedestal
		var pedestal = new THREE.Mesh(
			new THREE.CylinderGeometry(6, 8, 3, 16),
			stoneMaterial
		);
		pedestal.position.set(0, 1.5, 0);
		fountainGroup.add(pedestal);

		// Basin
		var basin = new THREE.Mesh(
			new THREE.CylinderGeometry(7, 8, 2, 16),
			stoneMaterial
		);
		basin.position.set(0, 4.5, 0);
		fountainGroup.add(basin);

		// Dry pool inside
		var poolFloor = new THREE.Mesh(
			new THREE.CylinderGeometry(6, 6, 0.5, 16),
			createMaterial(0x8B7355, 0.95, 0)
		);
		poolFloor.position.set(0, 3.5, 0);
		fountainGroup.add(poolFloor);

		// Central spout piece
		var spout = new THREE.Mesh(
			new THREE.CylinderGeometry(1.5, 1.5, 3, 8),
			stoneMaterial
		);
		spout.position.set(0, 6.5, 0);
		fountainGroup.add(spout);

		return fountainGroup;
	}

	function createRoofTerraces() {
		var roofGroup = new THREE.Group();
		var roofMaterial = createMaterial(0xD4A574, 0.9, 0);

		// Multiple roof levels
		var roofPositions = [
			{ x: -15, z: -15, w: 12, d: 12, h: 0.5 },
			{ x: 15, z: -15, w: 12, d: 12, h: 0.5 },
			{ x: -15, z: 15, w: 12, d: 12, h: 0.5 },
			{ x: 15, z: 15, w: 12, d: 12, h: 0.5 },
			{ x: 0, z: 0, w: 20, d: 20, h: 0.5 }
		];

		for (var i = 0; i < roofPositions.length; i++) {
			var pos = roofPositions[i];
			var roof = new THREE.Mesh(
				new THREE.BoxGeometry(pos.w, pos.h, pos.d),
				roofMaterial
			);
			roof.position.set(pos.x, 25 + (i * 0.8), pos.z);
			roofGroup.add(roof);

			// Decorative finial on each roof corner
			for (var fx = -1; fx <= 1; fx += 2) {
				for (var fz = -1; fz <= 1; fz += 2) {
					var finial = new THREE.Mesh(
						new THREE.ConeGeometry(1.5, 4, 8),
						createMaterial(0xFFD700, 0.4, 0.6)
					);
					finial.position.set(pos.x + (fx * pos.w / 2), 28 + (i * 0.8), pos.z + (fz * pos.d / 2));
					roofGroup.add(finial);
				}
			}
		}

		return roofGroup;
	}

	function createSniperPositions() {
		var sniperGroup = new THREE.Group();
		var sandbagMaterial = createMaterial(0xC2B280, 0.95, 0);

		// Sandbag nests in crenellations
		var nestPositions = [
			{ x: -35, z: -42 },
			{ x: -15, z: -42 },
			{ x: 5, z: -42 },
			{ x: 25, z: -42 },
			{ x: -35, z: 42 },
			{ x: -15, z: 42 },
			{ x: 15, z: 42 },
			{ x: 35, z: 42 }
		];

		for (var i = 0; i < nestPositions.length; i++) {
			var pos = nestPositions[i];

			// Front sandbag wall
			var frontBags = new THREE.Mesh(
				new THREE.BoxGeometry(4, 2, 2),
				sandbagMaterial
			);
			frontBags.position.set(pos.x, 30, pos.z);
			sniperGroup.add(frontBags);

			// Side sandbags
			var sideBags = new THREE.Mesh(
				new THREE.BoxGeometry(2, 2, 3),
				sandbagMaterial
			);
			sideBags.position.set(pos.x + 2.5, 30, pos.z - 1);
			sniperGroup.add(sideBags);
		}

		return sniperGroup;
	}

	function createUndergroundCistern() {
		var cisternGroup = new THREE.Group();
		var stoneMaterial = createMaterial(0x8B7355, 0.9, 0);

		// Cistern chamber - positioned below
		var chamberWalls = new THREE.Mesh(
			new THREE.BoxGeometry(30, 12, 25),
			stoneMaterial
		);
		chamberWalls.position.set(0, -10, 0);
		cisternGroup.add(chamberWalls);

		// Dry pool bottom
		var poolBottom = new THREE.Mesh(
			new THREE.BoxGeometry(28, 1, 23),
			createMaterial(0x6B5D52, 0.95, 0)
		);
		poolBottom.position.set(0, -16, 0);
		cisternGroup.add(poolBottom);

		// Arched supports - cylinder segments
		for (var i = 0; i < 4; i++) {
			var archX = -10 + (i * 7);
			var arch = new THREE.Mesh(
				new THREE.CylinderGeometry(2.5, 2.5, 25, 12),
				stoneMaterial
			);
			arch.rotation.z = Math.PI / 2;
			arch.position.set(archX, -5, 0);
			cisternGroup.add(arch);
		}

		// Entrance shaft
		var shaft = new THREE.Mesh(
			new THREE.CylinderGeometry(3, 3, 25, 12),
			stoneMaterial
		);
		shaft.position.set(20, -8, 0);
		cisternGroup.add(shaft);

		return cisternGroup;
	}

	function createDesertDunes() {
		var duneGroup = new THREE.Group();
		var sandMaterial = createMaterial(0xEDCC81, 0.95, 0);

		// Sand dunes encroaching on walls
		var dunePositions = [
			{ x: -40, z: -50, w: 25, h: 8, d: 15 },
			{ x: 35, z: -55, w: 20, h: 6, d: 18 },
			{ x: -45, z: 40, w: 18, h: 7, d: 20 },
			{ x: 40, z: 45, w: 22, h: 6, d: 15 }
		];

		for (var i = 0; i < dunePositions.length; i++) {
			var dune = dunePositions[i];
			var duneBody = new THREE.Mesh(
				new THREE.BoxGeometry(dune.w, dune.h, dune.d),
				sandMaterial
			);
			duneBody.position.set(dune.x, dune.h / 2, dune.z);
			duneGroup.add(duneBody);
		}

		// Sand drifts against walls
		for (var j = 0; j < 3; j++) {
			var drift = new THREE.Mesh(
				new THREE.BoxGeometry(15, 4, 8),
				sandMaterial
			);
			drift.position.set(-42, 2, -30 + (j * 20));
			drift.rotation.z = 0.2;
			duneGroup.add(drift);
		}

		return duneGroup;
	}

	function createShatteredTiles() {
		var debrisGroup = new THREE.Group();
		var tileColors = [0xE74C3C, 0x3498DB, 0xF39C12, 0x2ECC71, 0x9B59B6];

		// Scattered decorative tile fragments
		for (var i = 0; i < 25; i++) {
			var tileX = -18 + Math.random() * 36;
			var tileZ = -8 + Math.random() * 16;
			var colorIndex = Math.floor(Math.random() * tileColors.length);

			var tile = new THREE.Mesh(
				new THREE.BoxGeometry(1 + Math.random() * 1.5, 0.2, 1 + Math.random() * 1.5),
				createMaterial(tileColors[colorIndex], 0.6, 0.3)
			);
			tile.position.set(tileX, 0.1, tileZ);
			tile.rotation.z = Math.random() * Math.PI;
			tile.rotation.x = Math.random() * 0.5;
			debrisGroup.add(tile);
		}

		return debrisGroup;
	}

	function createPalmTrees() {
		var treeGroup = new THREE.Group();
		var trunkMaterial = createMaterial(0x8B4513, 0.95, 0);
		var frondMaterial = createMaterial(0x228B22, 0.7, 0);

		var treePositions = [
			{ x: -50, z: -50 },
			{ x: 50, z: -50 },
			{ x: -50, z: 50 },
			{ x: 50, z: 50 },
			{ x: -55, z: 0 },
			{ x: 55, z: 0 },
			{ x: 0, z: -60 },
			{ x: 0, z: 60 }
		];

		for (var i = 0; i < treePositions.length; i++) {
			var pos = treePositions[i];

			// Trunk
			var trunk = new THREE.Mesh(
				new THREE.CylinderGeometry(1.5, 2, 16, 8),
				trunkMaterial
			);
			trunk.position.set(pos.x, 8, pos.z);
			treeGroup.add(trunk);

			// Frond clusters - sphere for general foliage
			for (var j = 0; j < 3; j++) {
				var frondCluster = new THREE.Mesh(
					new THREE.SphereGeometry(5 - (j * 1.5), 8, 8),
					frondMaterial
				);
				frondCluster.position.set(pos.x + (j * 2), 18 + (j * 3), pos.z);
				frondCluster.scale.set(1, 0.7, 1);
				treeGroup.add(frondCluster);
			}

			// Top cone-shaped frond spray
			var frondSpray = new THREE.Mesh(
				new THREE.ConeGeometry(3.5, 6, 8),
				frondMaterial
			);
			frondSpray.position.set(pos.x, 24, pos.z);
			treeGroup.add(frondSpray);
		}

		return treeGroup;
	}

	function createFlags() {
		var flagGroup = new THREE.Group();
		var flagPolePositions = [
			{ x: -38, z: -43, color: 0xE74C3C },
			{ x: 38, z: -43, color: 0xFFD700 },
			{ x: -38, z: 43, color: 0x2ECC71 },
			{ x: 38, z: 43, color: 0x3498DB }
		];

		for (var i = 0; i < flagPolePositions.length; i++) {
			var flagData = flagPolePositions[i];

			// Flag pole
			var pole = new THREE.Mesh(
				new THREE.CylinderGeometry(0.5, 0.5, 18, 8),
				createMaterial(0x444444, 0.8, 0.3)
			);
			pole.position.set(flagData.x, 25, flagData.z);
			flagGroup.add(pole);

			// Flag cloth represented by geometry that will rotate
			var flagCloth = new THREE.Mesh(
				new THREE.BoxGeometry(6, 3, 0.2),
				createMaterial(flagData.color, 0.6, 0)
			);
			flagCloth.position.set(flagData.x + 3, 29, flagData.z);
			flagCloth.userData.flagIndex = i;
			flagCloth.userData.baseRotation = flagData.color;
			flagGroup.add(flagCloth);
		}

		return flagGroup;
	}

	function createLineSegmentFlags() {
		var lineGroup = new THREE.Group();

		// Rope lines for decorative banner effects
		var positions = new Float32Array([
			-36, 32, -43,
			-30, 28, -43,
			-24, 32, -43
		]);

		var ropeGeometry = new THREE.BufferGeometry();
		ropeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

		var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 2 });
		var rope1 = new THREE.LineSegments(ropeGeometry, ropeMaterial);
		lineGroup.add(rope1);

		// Banner ropes
		var positions2 = new Float32Array([
			36, 32, -43,
			42, 28, -43,
			48, 32, -43
		]);

		var ropeGeometry2 = new THREE.BufferGeometry();
		ropeGeometry2.setAttribute('position', new THREE.BufferAttribute(positions2, 3));
		var rope2 = new THREE.LineSegments(ropeGeometry2, ropeMaterial);
		lineGroup.add(rope2);

		return lineGroup;
	}

	function init(inScene, inCamera) {
		scene = inScene;
		camera = inCamera;

		fortressGroup = new THREE.Group();

		// Build fortress components
		walls = createOuterWalls();
		fortressGroup.add(walls);

		fortressGroup.add(createCornerTowers());
		fortressGroup.add(createInnerPalace());
		marketplace = createMarketplace();
		fortressGroup.add(marketplace);

		fortressGroup.add(createCentralFountain());
		fortressGroup.add(createRoofTerraces());
		fortressGroup.add(createSniperPositions());
		fortressGroup.add(createUndergroundCistern());
		sandDunes = createDesertDunes();
		fortressGroup.add(sandDunes);

		fortressGroup.add(createShatteredTiles());
		palmTrees = createPalmTrees();
		fortressGroup.add(palmTrees);

		flags = createFlags();
		fortressGroup.add(flags);

		fortressGroup.add(createLineSegmentFlags());

		scene.add(fortressGroup);

		// Ground plane
		var groundGeometry = new THREE.BoxGeometry(150, 1, 150);
		var groundMaterial = createMaterial(0xD2B48C, 0.98, 0);
		var ground = new THREE.Mesh(groundGeometry, groundMaterial);
		ground.position.y = -0.5;
		scene.add(ground);

		animationState = {
			time: 0,
			sandDriftAmount: 0,
			palmSway: 0
		};
	}

	function updateAnimations(delta) {
		animationState.time += delta * TIME_SCALE;
		animationState.sandDriftAmount = Math.sin(animationState.time * 0.15) * 0.5;
		animationState.palmSway = Math.sin(animationState.time * 0.3) * 0.08;

		// Animate sand dunes - slow creeping motion
		if (sandDunes) {
			sandDunes.children.forEach(function(dune, index) {
				dune.position.x += Math.sin(animationState.time * 0.1 + index) * 0.001;
				dune.position.z += Math.cos(animationState.time * 0.12 + index) * 0.0008;
			});
		}

		// Animate palm tree fronds - subtle sway
		if (palmTrees) {
			var treeIndex = 0;
			for (var i = 0; i < palmTrees.children.length; i++) {
				var child = palmTrees.children[i];
				if (child.geometry && child.geometry.type === 'SphereGeometry') {
					child.rotation.z = animationState.palmSway * (0.5 + (treeIndex % 3) * 0.2);
					treeIndex++;
				}
			}
		}

		// Animate flags - fluttering motion
		if (flags) {
			flags.children.forEach(function(flagMesh, index) {
				if (flagMesh.userData && flagMesh.userData.flagIndex !== undefined) {
					var flagIndex = flagMesh.userData.flagIndex;
					var flutterAmount = Math.sin(animationState.time * 0.8 + flagIndex * 0.5) * 0.15;
					var waveAmount = Math.cos(animationState.time * 1.2 + flagIndex) * 0.1;
					flagMesh.rotation.z = flutterAmount;
					flagMesh.rotation.y = waveAmount;
				}
			});
		}

		// Slight wobble for marketplace structures
		if (marketplace) {
			marketplace.children.forEach(function(stall, idx) {
				if (stall.geometry && stall.geometry.type === 'BoxGeometry') {
					var wobble = Math.sin(animationState.time * 0.5 + idx * 0.3) * 0.002;
					stall.rotation.z = wobble;
				}
			});
		}
	}

	function update(delta) {
		if (!scene) return;
		updateAnimations(delta);
	}

	function reset() {
		if (fortressGroup && scene) {
			scene.remove(fortressGroup);
		}
		fortressGroup = null;
		animationState = {
			time: 0,
			sandDriftAmount: 0,
			palmSway: 0
		};
	}

	return {
		init: init,
		update: update,
		reset: reset
	};

}());
