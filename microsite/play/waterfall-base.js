window.WaterfallBase = (function() {
	'use strict';

	var scene = null;
	var camera = null;

	var waterfallGroup = null;
	var waterfallBlocks = [];
	var mistClouds = [];
	var turbines = [];
	var powerCables = [];
	var ripplePool = null;
	var caveGroup = null;

	var waterfallSpeed = 8;
	var mistExpansionRate = 0.15;
	var turbineRotationSpeed = 3;

	function init(inScene, inCamera) {
		scene = inScene;
		camera = inCamera;

		waterfallGroup = new THREE.Group();
		scene.add(waterfallGroup);

		caveGroup = new THREE.Group();
		scene.add(caveGroup);

		buildCliffFace();
		buildWaterfallCurtain();
		buildMistClouds();
		buildHydroelectricHall();
		buildCaveTunnels();
		buildCommandCenter();
		buildPowerCables();
		buildPoolAtBase();
		buildRockFormations();
		buildSupplyDock();
		buildStalactites();
		buildBioluminescentMoss();
	}

	function buildCliffFace() {
		var cliffGeom = new THREE.BoxGeometry(120, 200, 40);
		var cliffMat = new THREE.MeshStandardMaterial({
			color: 0x4a3728,
			roughness: 0.9,
			metalness: 0.1
		});
		var cliff = new THREE.Mesh(cliffGeom, cliffMat);
		cliff.position.set(-200, 50, 0);
		cliff.castShadow = true;
		cliff.receiveShadow = true;
		waterfallGroup.add(cliff);

		// Cave entrance hole
		var entranceGeom = new THREE.BoxGeometry(35, 45, 35);
		var entranceMat = new THREE.MeshStandardMaterial({
			color: 0x1a0f0a,
			roughness: 1,
			metalness: 0
		});
		var entrance = new THREE.Mesh(entranceGeom, entranceMat);
		entrance.position.set(-200, 40, 0);
		entrance.castShadow = true;
		waterfallGroup.add(entrance);
	}

	function buildWaterfallCurtain() {
		var blockWidth = 6;
		var blockHeight = 8;
		var columns = 12;
		var rowsPerColumn = 35;
		var startX = -150;
		var startY = 160;
		var startZ = -15;

		for (var col = 0; col < columns; col++) {
			var colBlocks = [];
			for (var row = 0; row < rowsPerColumn; row++) {
				var blockGeom = new THREE.BoxGeometry(blockWidth, blockHeight, 2);
				var blockMat = new THREE.MeshStandardMaterial({
					color: 0x4a90e2,
					transparent: true,
					opacity: 0.4,
					roughness: 0.2,
					metalness: 0.3
				});
				var block = new THREE.Mesh(blockGeom, blockMat);
				block.position.set(
					startX + col * blockWidth,
					startY - row * blockHeight,
					startZ
				);
				block.castShadow = true;
				block.receiveShadow = true;
				waterfallGroup.add(block);
				colBlocks.push({
					mesh: block,
					initialY: startY - row * blockHeight,
					rowIndex: row,
					colIndex: col
				});
			}
			waterfallBlocks.push(colBlocks);
		}
	}

	function buildMistClouds() {
		var mistCount = 8;
		var baseY = -5;
		var radius = 15;

		for (var i = 0; i < mistCount; i++) {
			var angle = (i / mistCount) * Math.PI * 2;
			var x = Math.cos(angle) * radius - 150;
			var z = Math.sin(angle) * radius;

			var mistGeom = new THREE.SphereGeometry(8, 8, 8);
			var mistMat = new THREE.MeshStandardMaterial({
				color: 0xb0d4f1,
				transparent: true,
				opacity: 0.2,
				roughness: 0.8,
				emissive: 0x4a90e2,
				emissiveIntensity: 0.1
			});
			var mist = new THREE.Mesh(mistGeom, mistMat);
			mist.position.set(x, baseY, z);
			mist.scale.set(1, 1, 1);
			waterfallGroup.add(mist);

			mistClouds.push({
				mesh: mist,
				baseRadius: 8,
				maxRadius: 20,
				driftSpeed: 0.5 + Math.random() * 0.3,
				driftAngle: Math.random() * Math.PI * 2
			});
		}
	}

	function buildHydroelectricHall() {
		var hallGeom = new THREE.BoxGeometry(80, 60, 100);
		var hallMat = new THREE.MeshStandardMaterial({
			color: 0x3d3d3d,
			roughness: 0.6,
			metalness: 0.4
		});
		var hall = new THREE.Mesh(hallGeom, hallMat);
		hall.position.set(-180, -100, 0);
		hall.castShadow = true;
		hall.receiveShadow = true;
		caveGroup.add(hall);

		// Turbines
		var turbineCount = 4;
		var spacing = 20;
		for (var i = 0; i < turbineCount; i++) {
			var turbineGeom = new THREE.CylinderGeometry(12, 12, 8, 16);
			var turbineMat = new THREE.MeshStandardMaterial({
				color: 0x1a1a1a,
				roughness: 0.4,
				metalness: 0.8
			});
			var turbine = new THREE.Mesh(turbineGeom, turbineMat);
			turbine.position.set(
				-180 - spacing + i * spacing / 2,
				-100,
				-30 + i * spacing
			);
			turbine.castShadow = true;
			turbine.receiveShadow = true;
			caveGroup.add(turbine);
			turbines.push({ mesh: turbine, rotation: 0 });
		}
	}

	function buildCaveTunnels() {
		var tunnelSegments = 5;
		var segmentLength = 40;

		for (var seg = 0; seg < tunnelSegments; seg++) {
			var tunnelGeom = new THREE.BoxGeometry(30, 35, segmentLength);
			var tunnelMat = new THREE.MeshStandardMaterial({
				color: 0x2a2a2a,
				roughness: 0.85,
				metalness: 0.1
			});
			var tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
			tunnel.position.set(
				-120,
				-80 - seg * 5,
				seg * segmentLength
			);
			tunnel.castShadow = true;
			tunnel.receiveShadow = true;
			caveGroup.add(tunnel);

			// Wooden beam supports
			for (var beam = 0; beam < 4; beam++) {
				var beamGeom = new THREE.BoxGeometry(3, 25, 3);
				var beamMat = new THREE.MeshStandardMaterial({
					color: 0x5c4033,
					roughness: 0.7,
					metalness: 0
				});
				var beamMesh = new THREE.Mesh(beamGeom, beamMat);
				beamMesh.position.set(
					-120 - 12 + beam * 8,
					-67,
					seg * segmentLength
				);
				beamMesh.castShadow = true;
				caveGroup.add(beamMesh);
			}
		}
	}

	function buildCommandCenter() {
		var bunkerGeom = new THREE.BoxGeometry(50, 30, 40);
		var bunkerMat = new THREE.MeshStandardMaterial({
			color: 0x4a4a4a,
			roughness: 0.5,
			metalness: 0.6
		});
		var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
		bunker.position.set(-120, -60, -80);
		bunker.castShadow = true;
		bunker.receiveShadow = true;
		caveGroup.add(bunker);

		// Monitor screens
		var screenCount = 6;
		for (var scr = 0; scr < screenCount; scr++) {
			var screenGeom = new THREE.BoxGeometry(8, 12, 0.5);
			var screenMat = new THREE.MeshStandardMaterial({
				color: 0x00ff00,
				emissive: 0x00ff00,
				emissiveIntensity: 0.3,
				roughness: 0.1,
				metalness: 0.9
			});
			var screen = new THREE.Mesh(screenGeom, screenMat);
			screen.position.set(
				-120 - 15 + scr * 6,
				-40,
				-60
			);
			screen.castShadow = true;
			caveGroup.add(screen);
		}
	}

	function buildPowerCables() {
		var cableCount = 8;
		var cableLength = 150;

		for (var cab = 0; cab < cableCount; cab++) {
			var points = [];
			points.push(new THREE.Vector3(-150, 20 + cab * 3, 20));
			points.push(new THREE.Vector3(-120, -50 + cab * 2, 0));
			points.push(new THREE.Vector3(-100, -100, -40));

			var cableGeom = new THREE.BufferGeometry().setFromPoints(points);
			var cableMat = new THREE.LineBasicMaterial({
				color: 0xffaa00,
				linewidth: 2
			});
			var cable = new THREE.LineSegments(cableGeom, cableMat);
			caveGroup.add(cable);
			powerCables.push(cable);
		}
	}

	function buildPoolAtBase() {
		var poolGeom = new THREE.BoxGeometry(60, 3, 80);
		var poolMat = new THREE.MeshStandardMaterial({
			color: 0x1a4d6d,
			transparent: true,
			opacity: 0.6,
			roughness: 0.3,
			metalness: 0.2
		});
		ripplePool = new THREE.Mesh(poolGeom, poolMat);
		ripplePool.position.set(-150, -5, 0);
		ripplePool.castShadow = true;
		ripplePool.receiveShadow = true;
		caveGroup.add(ripplePool);
	}

	function buildRockFormations() {
		var formationCount = 12;

		for (var form = 0; form < formationCount; form++) {
			var x = -200 + Math.random() * 150;
			var y = -120 + Math.random() * 80;
			var z = -50 + Math.random() * 100;

			var width = 4 + Math.random() * 8;
			var height = 15 + Math.random() * 25;

			var rockGeom = new THREE.CylinderGeometry(
				width / 2,
				width / 2,
				height,
				6
			);
			var rockMat = new THREE.MeshStandardMaterial({
				color: 0x3a2a1a,
				roughness: 0.95,
				metalness: 0
			});
			var rock = new THREE.Mesh(rockGeom, rockMat);
			rock.position.set(x, y, z);
			rock.castShadow = true;
			rock.receiveShadow = true;
			caveGroup.add(rock);
		}
	}

	function buildSupplyDock() {
		var dockGeom = new THREE.BoxGeometry(40, 2, 30);
		var dockMat = new THREE.MeshStandardMaterial({
			color: 0x6b4423,
			roughness: 0.7,
			metalness: 0.3
		});
		var dock = new THREE.Mesh(dockGeom, dockMat);
		dock.position.set(-120, -8, 60);
		dock.castShadow = true;
		dock.receiveShadow = true;
		caveGroup.add(dock);

		// Dock pylons
		for (var pyl = 0; pyl < 4; pyl++) {
			var pylonGeom = new THREE.CylinderGeometry(2, 3, 8, 8);
			var pylonMat = new THREE.MeshStandardMaterial({
				color: 0x8b5a00,
				roughness: 0.6,
				metalness: 0.4
			});
			var pylon = new THREE.Mesh(pylonGeom, pylonMat);
			pylon.position.set(
				-120 - 15 + pyl * 10,
				-12,
				60 - 12 + pyl % 2 * 24
			);
			pylon.castShadow = true;
			caveGroup.add(pylon);
		}
	}

	function buildStalactites() {
		var stalactiteCount = 15;

		for (var stl = 0; stl < stalactiteCount; stl++) {
			var x = -200 + Math.random() * 150;
			var z = -50 + Math.random() * 100;

			var stalGeom = new THREE.ConeGeometry(
				2 + Math.random() * 2,
				12 + Math.random() * 15,
				8
			);
			var stalMat = new THREE.MeshStandardMaterial({
				color: 0x4a3728,
				roughness: 0.8,
				metalness: 0.1
			});
			var stalactite = new THREE.Mesh(stalGeom, stalMat);
			stalactite.position.set(x, 140 - Math.random() * 30, z);
			stalactite.castShadow = true;
			caveGroup.add(stalactite);
		}
	}

	function buildBioluminescentMoss() {
		var mossCount = 40;

		for (var moss = 0; moss < mossCount; moss++) {
			var x = -200 + Math.random() * 150;
			var y = -120 + Math.random() * 100;
			var z = -50 + Math.random() * 100;

			var mossGeom = new THREE.SphereGeometry(0.8, 4, 4);
			var mossMat = new THREE.MeshStandardMaterial({
				color: 0x00cc00,
				emissive: 0x00aa00,
				emissiveIntensity: 0.6,
				roughness: 0.4,
				metalness: 0.1
			});
			var mossMesh = new THREE.Mesh(mossGeom, mossMat);
			mossMesh.position.set(x, y, z);
			caveGroup.add(mossMesh);
		}
	}

	function update(delta) {
		// Animate waterfall blocks
		for (var col = 0; col < waterfallBlocks.length; col++) {
			var blocks = waterfallBlocks[col];
			for (var row = 0; row < blocks.length; row++) {
				var block = blocks[row];
				var offset = (block.initialY + waterfallSpeed * Date.now() / 1000) % 300;
				block.mesh.position.y = block.initialY - offset;

				// Fade opacity based on Y position
				var fadeStart = 20;
				if (block.mesh.position.y < fadeStart) {
					var fadeAmount = Math.max(0, fadeStart - block.mesh.position.y) / 30;
					block.mesh.material.opacity = Math.max(0.1, 0.4 - fadeAmount);
				} else {
					block.mesh.material.opacity = 0.4;
				}
			}
		}

		// Expand and drift mist clouds
		for (var mst = 0; mst < mistClouds.length; mst++) {
			var mistData = mistClouds[mst];
			var scale = mistData.baseRadius + (mistData.maxRadius - mistData.baseRadius) *
				(0.5 + 0.5 * Math.sin(Date.now() / 2000 + mst));
			mistData.mesh.scale.set(scale / 8, scale / 8, scale / 8);

			mistData.driftAngle += mistData.driftSpeed * delta * 0.1;
			mistData.mesh.position.x += Math.cos(mistData.driftAngle) * mistData.driftSpeed * delta * 0.1;
			mistData.mesh.position.z += Math.sin(mistData.driftAngle) * mistData.driftSpeed * delta * 0.1;
		}

		// Spin turbines
		for (var trb = 0; trb < turbines.length; trb++) {
			turbines[trb].rotation += turbineRotationSpeed * delta;
			turbines[trb].mesh.rotation.z = turbines[trb].rotation;
		}

		// Animate pool ripples
		if (ripplePool) {
			var rippleScale = 1 + 0.1 * Math.sin(Date.now() / 500);
			ripplePool.scale.set(1, rippleScale, 1);
		}
	}

	function reset() {
		if (waterfallGroup) {
			waterfallGroup.clear();
		}
		if (caveGroup) {
			caveGroup.clear();
		}
		waterfallBlocks = [];
		mistClouds = [];
		turbines = [];
		powerCables = [];
		ripplePool = null;

		waterfallGroup = new THREE.Group();
		scene.add(waterfallGroup);
		caveGroup = new THREE.Group();
		scene.add(caveGroup);

		buildCliffFace();
		buildWaterfallCurtain();
		buildMistClouds();
		buildHydroelectricHall();
		buildCaveTunnels();
		buildCommandCenter();
		buildPowerCables();
		buildPoolAtBase();
		buildRockFormations();
		buildSupplyDock();
		buildStalactites();
		buildBioluminescentMoss();
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
