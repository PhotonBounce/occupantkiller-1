window.TempleRaid = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var torchFlames = [];
	var waterPlane = null;
	var waterWaveTime = 0;
	var rubbleChunks = [];
	var crumblingPillars = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		torchFlames = [];
		waterWaveTime = 0;
		rubbleChunks = [];
		crumblingPillars = [];

		// Main temple structure - tiered stone steps getting smaller
		createMainTempleStructure();

		// Massive stone pillars lining entrance hall
		createEntrancePillars();

		// Inner sanctum with golden idol
		createSanctumChamber();

		// Trap holes with door covers
		createTrapHoles();

		// Jungle overgrowth
		createJungleVegetation();

		// Torch holders with animated flames
		createTorches();

		// Sacrificial altar in courtyard
		createAltar();

		// Stone walls with varying colors
		createStoneWalls();

		// Water reflection pool
		createWaterPool();

		// Collapsed ceiling rubble
		createRubble();

		// Ambient lighting
		var ambientLight = new THREE.AmbientLight(0x666666, 1.2);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(30, 50, 30);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.far = 200;
		scene.add(directionalLight);
	}

	function createMainTempleStructure() {
		var stepCount = 6;
		var baseSize = 120;
		var stepHeight = 3;

		for (var i = 0; i < stepCount; i++) {
			var size = baseSize - (i * 15);
			var height = stepHeight;
			var geometry = new THREE.BoxGeometry(size, height, size);

			// Varying stone colors for each tier
			var colorArray = [0x8b7d6b, 0x9b8d7b, 0x7b6d5b, 0xab9d8b, 0x9b8d7b, 0x8b7d6b];
			var material = new THREE.MeshStandardMaterial({
				color: colorArray[i],
				roughness: 0.8,
				metalness: 0.1
			});

			var mesh = new THREE.Mesh(geometry, material);
			mesh.position.y = i * stepHeight + (i * 2);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			scene.add(mesh);

			// Add cracks and variation to stones
			if (i > 2) {
				var crackGeometry = new THREE.BoxGeometry(size * 0.05, height * 0.3, size * 0.8);
				var crackMaterial = new THREE.MeshStandardMaterial({
					color: 0x4a4a4a,
					roughness: 0.9
				});
				var crack = new THREE.Mesh(crackGeometry, crackMaterial);
				crack.position.set(size * 0.35, i * stepHeight + (i * 2) + height * 0.5, 0);
				crack.castShadow = true;
				scene.add(crack);
			}
		}
	}

	function createEntrancePillars() {
		var pillarRadius = 3;
		var pillarHeight = 45;
		var pillarCount = 8;
		var spacing = 25;

		for (var i = 0; i < pillarCount; i++) {
			var xPos = (i - pillarCount / 2) * spacing;

			var geometry = new THREE.CylinderGeometry(pillarRadius, pillarRadius, pillarHeight, 8);
			var material = new THREE.MeshStandardMaterial({
				color: 0x8b7d6b,
				roughness: 0.85,
				metalness: 0.05
			});

			var pillar = new THREE.Mesh(geometry, material);
			pillar.position.set(xPos, pillarHeight / 2, 0);
			pillar.castShadow = true;
			pillar.receiveShadow = true;
			scene.add(pillar);

			// Create capital (top) of pillar
			var capitalGeometry = new THREE.CylinderGeometry(pillarRadius * 1.4, pillarRadius, 2, 8);
			var capitalMaterial = new THREE.MeshStandardMaterial({
				color: 0xd4af37,
				roughness: 0.7,
				metalness: 0.3
			});
			var capital = new THREE.Mesh(capitalGeometry, capitalMaterial);
			capital.position.set(xPos, pillarHeight + 1, 0);
			capital.castShadow = true;
			scene.add(capital);

			// Randomly make some pillars crumbled
			if (Math.random() > 0.6) {
				var rubbleCount = Math.floor(Math.random() * 3) + 1;
				for (var j = 0; j < rubbleCount; j++) {
					var rubbleSize = Math.random() * 1.5 + 0.5;
					var rubbleGeometry = new THREE.BoxGeometry(rubbleSize, rubbleSize, rubbleSize);
					var rubbleMaterial = new THREE.MeshStandardMaterial({
						color: 0x6b5d4b,
						roughness: 0.9
					});
					var rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
					rubble.position.set(
						xPos + (Math.random() - 0.5) * 8,
						pillarHeight - 5 + Math.random() * 10,
						(Math.random() - 0.5) * 6
					);
					rubble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
					rubble.castShadow = true;
					scene.add(rubble);
					rubbleChunks.push(rubble);
				}
			}
		}
	}

	function createSanctumChamber() {
		// Inner chamber walls
		var chamberWidth = 40;
		var chamberHeight = 30;
		var chamberDepth = 40;

		var wallThickness = 2;

		// Back wall
		var backWallGeometry = new THREE.BoxGeometry(chamberWidth + wallThickness * 2, chamberHeight, wallThickness);
		var stoneMaterial = new THREE.MeshStandardMaterial({
			color: 0x7b6d5b,
			roughness: 0.8
		});
		var backWall = new THREE.Mesh(backWallGeometry, stoneMaterial);
		backWall.position.set(0, chamberHeight / 2, chamberDepth / 2);
		backWall.castShadow = true;
		backWall.receiveShadow = true;
		scene.add(backWall);

		// Side walls
		for (var side = -1; side <= 1; side += 2) {
			var sideGeometry = new THREE.BoxGeometry(wallThickness, chamberHeight, chamberDepth);
			var sideWall = new THREE.Mesh(sideGeometry, stoneMaterial);
			sideWall.position.set(side * (chamberWidth / 2), chamberHeight / 2, 0);
			sideWall.castShadow = true;
			scene.add(sideWall);
		}

		// Pedestal for idol
		var pedestalGeometry = new THREE.CylinderGeometry(5, 7, 3, 8);
		var pedestalMaterial = new THREE.MeshStandardMaterial({
			color: 0xd4af37,
			roughness: 0.6,
			metalness: 0.4
		});
		var pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
		pedestal.position.set(0, 20, chamberDepth / 2 - 10);
		pedestal.castShadow = true;
		scene.add(pedestal);

		// Golden idol (sphere on top)
		var idolGeometry = new THREE.SphereGeometry(2, 16, 16);
		var idolMaterial = new THREE.MeshStandardMaterial({
			color: 0xffcc00,
			roughness: 0.3,
			metalness: 0.8,
			emissive: 0xffaa00
		});
		var idol = new THREE.Mesh(idolGeometry, idolMaterial);
		idol.position.set(0, 23, chamberDepth / 2 - 10);
		idol.castShadow = true;
		scene.add(idol);

		// Ornamental sphere beneath idol
		var ornamentGeometry = new THREE.SphereGeometry(3, 12, 12);
		var ornamentMaterial = new THREE.MeshStandardMaterial({
			color: 0xcc8800,
			roughness: 0.5,
			metalness: 0.6
		});
		var ornament = new THREE.Mesh(ornamentGeometry, ornamentMaterial);
		ornament.position.set(0, 19, chamberDepth / 2 - 10);
		ornament.castShadow = true;
		scene.add(ornament);
	}

	function createTrapHoles() {
		var holeCount = 6;
		var holeSize = 4;
		var holeDepth = 8;

		// Arrange in grid pattern
		for (var i = 0; i < holeCount; i++) {
			var xPos = (i % 3) * 20 - 20;
			var zPos = Math.floor(i / 3) * 20 - 10;

			// Hole pit
			var holeGeometry = new THREE.BoxGeometry(holeSize, holeDepth, holeSize);
			var holeMaterial = new THREE.MeshStandardMaterial({
				color: 0x1a1a1a,
				roughness: 0.95
			});
			var hole = new THREE.Mesh(holeGeometry, holeMaterial);
			hole.position.set(xPos, -holeDepth / 2, zPos);
			hole.castShadow = true;
			hole.receiveShadow = true;
			scene.add(hole);

			// Trap door cover (tilted)
			var doorGeometry = new THREE.BoxGeometry(holeSize * 1.2, 0.5, holeSize * 1.2);
			var doorMaterial = new THREE.MeshStandardMaterial({
				color: 0x6b5d4b,
				roughness: 0.8
			});
			var door = new THREE.Mesh(doorGeometry, doorMaterial);
			door.position.set(xPos, 0.5, zPos);
			door.rotation.z = (Math.random() - 0.5) * 0.3;
			door.rotation.x = (Math.random() - 0.5) * 0.2;
			door.castShadow = true;
			scene.add(door);

			// Spikes at bottom of pit
			for (var s = 0; s < 3; s++) {
				var spikeGeometry = new THREE.ConeGeometry(0.4, 2, 4);
				var spikeMaterial = new THREE.MeshStandardMaterial({
					color: 0x8b7355,
					roughness: 0.7
				});
				var spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
				spike.position.set(
					xPos + (Math.random() - 0.5) * holeSize,
					-holeDepth + 1,
					zPos + (Math.random() - 0.5) * holeSize
				);
				spike.castShadow = true;
				scene.add(spike);
			}
		}
	}

	function createJungleVegetation() {
		// Hanging vines
		var vineCount = 20;
		for (var i = 0; i < vineCount; i++) {
			var xPos = (Math.random() - 0.5) * 80;
			var zPos = (Math.random() - 0.5) * 80;

			var vineLength = 15 + Math.random() * 20;
			var vineGeometry = new THREE.BoxGeometry(0.3, vineLength, 0.3);
			var vineMaterial = new THREE.MeshStandardMaterial({
				color: 0x2d5016,
				roughness: 0.9
			});
			var vine = new THREE.Mesh(vineGeometry, vineMaterial);
			vine.position.set(xPos, 30 - vineLength / 2, zPos);
			vine.castShadow = true;
			scene.add(vine);

			// Vine leaves (smaller spheres)
			var leafCount = Math.floor(vineLength / 2);
			for (var leaf = 0; leaf < leafCount; leaf++) {
				var leafGeometry = new THREE.SphereGeometry(0.8, 6, 6);
				var leafMaterial = new THREE.MeshStandardMaterial({
					color: 0x3d6b1f,
					roughness: 0.8
				});
				var leafMesh = new THREE.Mesh(leafGeometry, leafMaterial);
				leafMesh.position.set(
					xPos + (Math.random() - 0.5) * 1.5,
					30 - (leaf * 2),
					zPos + (Math.random() - 0.5) * 1.5
				);
				leafMesh.scale.set(Math.random() * 0.8 + 0.6, Math.random() * 0.8 + 0.6, Math.random() * 0.8 + 0.6);
				leafMesh.castShadow = true;
				scene.add(leafMesh);
			}
		}

		// Tree trunks
		var treeCount = 8;
		for (var t = 0; t < treeCount; t++) {
			var treeX = (Math.random() - 0.5) * 100;
			var treeZ = (Math.random() - 0.5) * 100;
			var treeHeight = 35 + Math.random() * 15;

			var trunkGeometry = new THREE.CylinderGeometry(2, 3, treeHeight, 6);
			var trunkMaterial = new THREE.MeshStandardMaterial({
				color: 0x5c4033,
				roughness: 0.9
			});
			var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
			trunk.position.set(treeX, treeHeight / 2, treeZ);
			trunk.castShadow = true;
			scene.add(trunk);

			// Tree canopy (sphere)
			var canopyGeometry = new THREE.SphereGeometry(8, 12, 12);
			var canopyMaterial = new THREE.MeshStandardMaterial({
				color: 0x1a3a1a,
				roughness: 0.85
			});
			var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
			canopy.position.set(treeX, treeHeight + 5, treeZ);
			canopy.castShadow = true;
			scene.add(canopy);
		}
	}

	function createTorches() {
		// Wall torch positions
		var torchPositions = [
			{ x: -30, z: 30 },
			{ x: 30, z: 30 },
			{ x: -30, z: -30 },
			{ x: 30, z: -30 },
			{ x: -50, z: 0 },
			{ x: 50, z: 0 }
		];

		for (var i = 0; i < torchPositions.length; i++) {
			var pos = torchPositions[i];

			// Torch bracket (cylinder)
			var bracketGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 6);
			var bracketMaterial = new THREE.MeshStandardMaterial({
				color: 0x3a3a3a,
				roughness: 0.8,
				metalness: 0.4
			});
			var bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
			bracket.position.set(pos.x, 20, pos.z);
			bracket.castShadow = true;
			scene.add(bracket);

			// Torch flame (glowing sphere)
			var flameGeometry = new THREE.SphereGeometry(1, 8, 8);
			var flameMaterial = new THREE.MeshStandardMaterial({
				color: 0xff6600,
				roughness: 0.4,
				metalness: 0,
				emissive: 0xff4400,
				emissiveIntensity: 0.8
			});
			var flame = new THREE.Mesh(flameGeometry, flameMaterial);
			flame.position.set(pos.x, 22, pos.z);
			flame.castShadow = true;
			scene.add(flame);

			// Add point light for flame
			var pointLight = new THREE.PointLight(0xff6600, 2, 30);
			pointLight.position.set(pos.x, 22, pos.z);
			scene.add(pointLight);

			torchFlames.push({
				mesh: flame,
				light: pointLight,
				baseScale: 1,
				baseY: 22,
				phase: Math.random() * Math.PI * 2
			});
		}
	}

	function createAltar() {
		// Altar base (stepped)
		var altarBaseGeometry = new THREE.CylinderGeometry(8, 10, 2, 8);
		var altarBaseMaterial = new THREE.MeshStandardMaterial({
			color: 0x8b4513,
			roughness: 0.75
		});
		var altarBase = new THREE.Mesh(altarBaseGeometry, altarBaseMaterial);
		altarBase.position.set(0, 2, 0);
		altarBase.castShadow = true;
		scene.add(altarBase);

		// Altar top
		var topGeometry = new THREE.CylinderGeometry(6, 8, 1.5, 8);
		var topMaterial = new THREE.MeshStandardMaterial({
			color: 0xd4af37,
			roughness: 0.6,
			metalness: 0.5
		});
		var top = new THREE.Mesh(topGeometry, topMaterial);
		top.position.set(0, 4, 0);
		top.castShadow = true;
		scene.add(top);

		// Ritual bowl (sphere with hole effect)
		var bowlGeometry = new THREE.SphereGeometry(2, 12, 12);
		var bowlMaterial = new THREE.MeshStandardMaterial({
			color: 0xcc8800,
			roughness: 0.4,
			metalness: 0.7
		});
		var bowl = new THREE.Mesh(bowlGeometry, bowlMaterial);
		bowl.position.set(0, 5.5, 0);
		bowl.castShadow = true;
		scene.add(bowl);

		// Ornamental posts at corners
		for (var i = 0; i < 4; i++) {
			var angle = (i / 4) * Math.PI * 2;
			var postX = Math.cos(angle) * 8;
			var postZ = Math.sin(angle) * 8;

			var postGeometry = new THREE.CylinderGeometry(0.5, 0.6, 3, 6);
			var postMaterial = new THREE.MeshStandardMaterial({
				color: 0xd4af37,
				roughness: 0.5,
				metalness: 0.6
			});
			var post = new THREE.Mesh(postGeometry, postMaterial);
			post.position.set(postX, 3.5, postZ);
			post.castShadow = true;
			scene.add(post);

			// Top ornament on post
			var ornamentGeometry = new THREE.SphereGeometry(0.8, 8, 8);
			var ornamentMaterial = new THREE.MeshStandardMaterial({
				color: 0xffee00,
				roughness: 0.3,
				metalness: 0.8
			});
			var ornament = new THREE.Mesh(ornamentGeometry, ornamentMaterial);
			ornament.position.set(postX, 5.5, postZ);
			ornament.castShadow = true;
			scene.add(ornament);
		}
	}

	function createStoneWalls() {
		var wallColors = [0x8b7d6b, 0x9b8d7b, 0x7a6d59, 0xab9d8b, 0x6b5d4b];

		// Build perimeter walls with varying colored stones
		var wallHeight = 25;
		var wallThickness = 1.5;
		var stoneSize = 4;
		var blocksPerSide = 12;

		// North wall
		for (var i = 0; i < blocksPerSide; i++) {
			var stoneGeometry = new THREE.BoxGeometry(stoneSize, stoneSize, wallThickness);
			var color = wallColors[Math.floor(Math.random() * wallColors.length)];
			var stoneMaterial = new THREE.MeshStandardMaterial({
				color: color,
				roughness: 0.85
			});
			var stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
			stone.position.set((i - blocksPerSide / 2) * stoneSize, stoneSize / 2, -50);
			stone.castShadow = true;
			scene.add(stone);
		}

		// South wall
		for (var i = 0; i < blocksPerSide; i++) {
			var stoneGeometry = new THREE.BoxGeometry(stoneSize, stoneSize, wallThickness);
			var color = wallColors[Math.floor(Math.random() * wallColors.length)];
			var stoneMaterial = new THREE.MeshStandardMaterial({
				color: color,
				roughness: 0.85
			});
			var stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
			stone.position.set((i - blocksPerSide / 2) * stoneSize, stoneSize / 2, 50);
			stone.castShadow = true;
			scene.add(stone);
		}

		// East wall
		for (var i = 0; i < blocksPerSide; i++) {
			var stoneGeometry = new THREE.BoxGeometry(wallThickness, stoneSize, stoneSize);
			var color = wallColors[Math.floor(Math.random() * wallColors.length)];
			var stoneMaterial = new THREE.MeshStandardMaterial({
				color: color,
				roughness: 0.85
			});
			var stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
			stone.position.set(50, stoneSize / 2, (i - blocksPerSide / 2) * stoneSize);
			stone.castShadow = true;
			scene.add(stone);
		}

		// West wall
		for (var i = 0; i < blocksPerSide; i++) {
			var stoneGeometry = new THREE.BoxGeometry(wallThickness, stoneSize, stoneSize);
			var color = wallColors[Math.floor(Math.random() * wallColors.length)];
			var stoneMaterial = new THREE.MeshStandardMaterial({
				color: color,
				roughness: 0.85
			});
			var stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
			stone.position.set(-50, stoneSize / 2, (i - blocksPerSide / 2) * stoneSize);
			stone.castShadow = true;
			scene.add(stone);
		}
	}

	function createWaterPool() {
		// Water surface
		var waterGeometry = new THREE.BoxGeometry(30, 0.5, 30);
		var waterMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a4d7a,
			roughness: 0.3,
			metalness: 0.2,
			transparent: true,
			opacity: 0.7
		});
		waterPlane = new THREE.Mesh(waterGeometry, waterMaterial);
		waterPlane.position.set(0, 0.25, 0);
		waterPlane.receiveShadow = true;
		scene.add(waterPlane);

		// Pool basin
		var basinGeometry = new THREE.BoxGeometry(32, 3, 32);
		var basinMaterial = new THREE.MeshStandardMaterial({
			color: 0x0a2a4a,
			roughness: 0.9
		});
		var basin = new THREE.Mesh(basinGeometry, basinMaterial);
		basin.position.set(0, -1.5, 0);
		basin.castShadow = true;
		scene.add(basin);

		// Pool edge (stone ring)
		var edgeGeometry = new THREE.CylinderGeometry(16, 16.5, 0.5, 16);
		var edgeMaterial = new THREE.MeshStandardMaterial({
			color: 0x8b7d6b,
			roughness: 0.8
		});
		var edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
		edge.position.set(0, 0.75, 0);
		edge.castShadow = true;
		scene.add(edge);
	}

	function createRubble() {
		// Collapsed ceiling sections with rubble piles
		var rubblePiles = 5;

		for (var p = 0; p < rubblePiles; p++) {
			var pileX = (Math.random() - 0.5) * 80;
			var pileZ = (Math.random() - 0.5) * 80;
			var chunkCount = Math.floor(Math.random() * 5) + 3;

			for (var c = 0; c < chunkCount; c++) {
				var chunkSize = Math.random() * 3 + 1;
				var chunkGeometry = new THREE.BoxGeometry(chunkSize, chunkSize, chunkSize);
				var chunkMaterial = new THREE.MeshStandardMaterial({
					color: 0x6b5d4b,
					roughness: 0.9
				});
				var chunk = new THREE.Mesh(chunkGeometry, chunkMaterial);
				chunk.position.set(
					pileX + (Math.random() - 0.5) * 10,
					8 + c * 1.5 + Math.random() * 2,
					pileZ + (Math.random() - 0.5) * 10
				);
				chunk.rotation.set(
					Math.random() * Math.PI,
					Math.random() * Math.PI,
					Math.random() * Math.PI
				);
				chunk.castShadow = true;
				scene.add(chunk);
				rubbleChunks.push(chunk);
			}
		}

		// Large ceiling beam wreckage
		var beamGeometry = new THREE.BoxGeometry(2, 2, 30);
		var beamMaterial = new THREE.MeshStandardMaterial({
			color: 0x5c4e3d,
			roughness: 0.85
		});
		var beam = new THREE.Mesh(beamGeometry, beamMaterial);
		beam.position.set(-35, 10, 0);
		beam.rotation.z = 0.3;
		beam.castShadow = true;
		scene.add(beam);
	}

	function update(delta) {
		// Animate torch flames
		for (var i = 0; i < torchFlames.length; i++) {
			var torch = torchFlames[i];
			torch.phase += delta * 2;

			// Oscillate scale for flame flicker
			var flameScale = torch.baseScale + Math.sin(torch.phase) * 0.15 + Math.cos(torch.phase * 0.7) * 0.1;
			torch.mesh.scale.set(flameScale, flameScale, flameScale);

			// Slight vertical movement
			var flameY = torch.baseY + Math.sin(torch.phase * 1.5) * 0.3;
			torch.mesh.position.y = flameY;
			torch.light.position.y = flameY;

			// Flicker light intensity
			torch.light.intensity = 1.5 + Math.sin(torch.phase * 2) * 0.5;
		}

		// Animate water surface with ripple effect
		if (waterPlane) {
			waterWaveTime += delta;

			// Wave position animation
			waterPlane.position.y = 0.25 + Math.sin(waterWaveTime) * 0.1;

			// Slight scale oscillation for ripple effect
			var waveScale = 1 + Math.sin(waterWaveTime * 0.5) * 0.02;
			waterPlane.scale.set(waveScale, 1, waveScale);

			// Opacity variation for water effect
			waterPlane.material.opacity = 0.65 + Math.sin(waterWaveTime * 1.5) * 0.1;
		}

		// Subtle wobble on rubble chunks
		for (var r = 0; r < Math.min(rubbleChunks.length, 10); r++) {
			var chunk = rubbleChunks[r];
			chunk.rotation.x += Math.sin(waterWaveTime + r) * 0.001;
			chunk.rotation.z += Math.cos(waterWaveTime + r) * 0.001;
		}
	}

	function reset() {
		torchFlames = [];
		waterWaveTime = 0;
		rubbleChunks = [];
		crumblingPillars = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};

}());
