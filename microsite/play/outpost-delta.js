window.OutpostDelta = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var meshes = [];
	var particles = [];
	var time = 0;

	var SAND_COLOR = 0xC4A77D;
	var SANDSTONE_COLOR = 0xD4A574;
	var DARK_SAND_COLOR = 0xA0826D;
	var RED_FLAG_COLOR = 0xFF3333;
	var METAL_COLOR = 0x666666;
	var RUST_COLOR = 0x8B4513;

	function createSandstoneWall() {
		var group = new THREE.Group();
		var blockWidth = 2;
		var blockHeight = 1.5;
		var blockDepth = 0.8;
		var perimeter = 40;
		var wallHeight = 5;

		var material = new THREE.MeshPhongMaterial({ color: SANDSTONE_COLOR });

		for (var i = 0; i < perimeter; i++) {
			for (var h = 0; h < 3; h++) {
				var block = new THREE.Mesh(
					new THREE.BoxGeometry(blockWidth, blockHeight, blockDepth),
					material.clone()
				);
				var angle = (i / perimeter) * Math.PI * 2;
				var radius = 20;
				block.position.x = Math.cos(angle) * radius;
				block.position.y = h * blockHeight + 0.75;
				block.position.z = Math.sin(angle) * radius;
				block.rotation.y = angle + Math.PI / 2;
				group.add(block);
			}

			if (i % 4 === 0) {
				var merlon = new THREE.Mesh(
					new THREE.BoxGeometry(blockWidth, 0.8, blockDepth),
					material.clone()
				);
				var merlonAngle = (i / perimeter) * Math.PI * 2;
				merlon.position.x = Math.cos(merlonAngle) * radius;
				merlon.position.y = 4.8;
				merlon.position.z = Math.sin(merlonAngle) * radius;
				merlon.rotation.y = merlonAngle + Math.PI / 2;
				group.add(merlon);
			}
		}

		return group;
	}

	function createMainBuilding() {
		var group = new THREE.Group();
		var roofMaterial = new THREE.MeshPhongMaterial({ color: DARK_SAND_COLOR });
		var wallMaterial = new THREE.MeshPhongMaterial({ color: SANDSTONE_COLOR });
		var windowMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

		var mainWall = new THREE.Mesh(
			new THREE.BoxGeometry(15, 6, 10),
			wallMaterial
		);
		mainWall.position.set(0, 3, -15);
		group.add(mainWall);

		var roof = new THREE.Mesh(
			new THREE.BoxGeometry(15.5, 0.5, 10.5),
			roofMaterial
		);
		roof.position.set(0, 6.3, -15);
		group.add(roof);

		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 2; j++) {
				var window = new THREE.Mesh(
					new THREE.BoxGeometry(1, 1, 0.3),
					windowMaterial
				);
				window.position.set(-5 + i * 4, 3 + j * 2, -10);
				group.add(window);
			}
		}

		return group;
	}

	function createAntennaArray() {
		var group = new THREE.Group();
		var mastMaterial = new THREE.MeshPhongMaterial({ color: METAL_COLOR });
		var antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });

		var mast = new THREE.Mesh(
			new THREE.CylinderGeometry(0.4, 0.4, 25, 8),
			mastMaterial
		);
		mast.position.set(25, 12.5, 5);
		group.add(mast);

		var antennaPositions = [
			{ x: 0, z: -3 },
			{ x: 3, z: 0 },
			{ x: 0, z: 3 },
			{ x: -3, z: 0 }
		];

		for (var i = 0; i < antennaPositions.length; i++) {
			var antenna = new THREE.Mesh(
				new THREE.BoxGeometry(0.6, 4, 0.4),
				antennaMaterial
			);
			antenna.position.set(
				25 + antennaPositions[i].x,
				18,
				5 + antennaPositions[i].z
			);
			antenna.rotation.z = (i * Math.PI / 2) + (Math.PI / 4);
			group.add(antenna);
		}

		return group;
	}

	function createGuardPost() {
		var group = new THREE.Group();
		var boothMaterial = new THREE.MeshPhongMaterial({ color: SANDSTONE_COLOR });
		var sandbagMaterial = new THREE.MeshPhongMaterial({ color: 0x9A8B6D });

		var booth = new THREE.Mesh(
			new THREE.BoxGeometry(3, 3, 3),
			boothMaterial
		);
		booth.position.set(-18, 1.5, 12);
		group.add(booth);

		for (var i = 0; i < 3; i++) {
			var sandbag = new THREE.Mesh(
				new THREE.BoxGeometry(3.5, 0.6, 0.8),
				sandbagMaterial
			);
			sandbag.position.set(-18, 1.2 + i * 0.8, 15.5);
			group.add(sandbag);
		}

		return group;
	}

	function createWaterTower() {
		var group = new THREE.Group();
		var tankMaterial = new THREE.MeshPhongMaterial({ color: RUST_COLOR });
		var legMaterial = new THREE.MeshPhongMaterial({ color: METAL_COLOR });

		var tank = new THREE.Mesh(
			new THREE.BoxGeometry(4, 3, 4),
			tankMaterial
		);
		tank.position.set(-20, 6, -12);
		group.add(tank);

		for (var i = 0; i < 4; i++) {
			var leg = new THREE.Mesh(
				new THREE.CylinderGeometry(0.3, 0.4, 6, 6),
				legMaterial
			);
			var offset = 1.8;
			leg.position.set(
				-20 + (i < 2 ? offset : -offset),
				3,
				-12 + (i % 2 === 0 ? offset : -offset)
			);
			group.add(leg);
		}

		return group;
	}

	function createIEDMarker() {
		var group = new THREE.Group();
		var poleMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
		var flagMaterial = new THREE.MeshPhongMaterial({ color: RED_FLAG_COLOR });

		var pole = new THREE.Mesh(
			new THREE.CylinderGeometry(0.1, 0.12, 2, 4),
			poleMaterial
		);
		pole.position.y = 1;
		group.add(pole);

		var flag = new THREE.Mesh(
			new THREE.BoxGeometry(1.2, 0.8, 0.1),
			flagMaterial
		);
		flag.position.set(0.7, 1.8, 0);
		group.add(flag);

		return group;
	}

	function createDesertTerrain() {
		var group = new THREE.Group();
		var terrainMaterial = new THREE.MeshPhongMaterial({ color: SAND_COLOR });
		var darkTerrainMaterial = new THREE.MeshPhongMaterial({ color: DARK_SAND_COLOR });

		var gridSize = 12;
		var blockSize = 5;
		var heightVariation = 2;

		for (var x = -gridSize; x <= gridSize; x++) {
			for (var z = -gridSize; z <= gridSize; z++) {
				var height = Math.sin(x * 0.3) * Math.cos(z * 0.3) * heightVariation;
				var block = new THREE.Mesh(
					new THREE.BoxGeometry(blockSize, 0.8, blockSize),
					(x + z) % 2 === 0 ? terrainMaterial : darkTerrainMaterial
				);
				block.position.set(x * blockSize, height - 0.4, z * blockSize);
				group.add(block);
			}
		}

		return group;
	}

	function createHeatShimmer() {
		var group = new THREE.Group();
		var shimmerMaterial = new THREE.MeshPhongMaterial({
			color: 0xFFFFFF,
			transparent: true,
			opacity: 0.15
		});

		for (var i = 0; i < 8; i++) {
			var shimmer = new THREE.Mesh(
				new THREE.BoxGeometry(60, 0.3, 60),
				shimmerMaterial.clone()
			);
			shimmer.position.y = 0.5 + i * 0.4;
			shimmer.name = 'shimmer_' + i;
			group.add(shimmer);
		}

		return group;
	}

	function createSandStormParticles() {
		var particleGroup = new THREE.Group();
		var particleCount = 500;
		var particleMaterial = new THREE.MeshPhongMaterial({
			color: 0xE0D4C4,
			transparent: true,
			opacity: 0.6
		});

		for (var i = 0; i < particleCount; i++) {
			var particle = new THREE.Mesh(
				new THREE.BoxGeometry(0.1, 0.1, 0.1),
				particleMaterial.clone()
			);
			particle.position.set(
				Math.random() * 100 - 50,
				Math.random() * 30,
				Math.random() * 100 - 50
			);
			particle.velocity = new THREE.Vector3(
				(Math.random() - 0.5) * 0.5,
				(Math.random() - 0.5) * 0.3,
				(Math.random() - 0.5) * 0.5
			);
			particleGroup.add(particle);
			particles.push(particle);
		}

		return particleGroup;
	}

	function createWreckedVehicle() {
		var group = new THREE.Group();
		var hullMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
		var burnMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });

		var hull = new THREE.Mesh(
			new THREE.BoxGeometry(6, 2.5, 3),
			hullMaterial
		);
		hull.position.set(22, 1.2, 25);
		hull.rotation.z = 0.3;
		group.add(hull);

		var cabin = new THREE.Mesh(
			new THREE.BoxGeometry(2, 1.5, 2),
			burnMaterial
		);
		cabin.position.set(20, 2, 25);
		group.add(cabin);

		for (var i = 0; i < 4; i++) {
			var wheel = new THREE.Mesh(
				new THREE.CylinderGeometry(0.6, 0.6, 0.4, 8),
				new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
			);
			var offset = i < 2 ? -2 : 2;
			wheel.position.set(
				22 + offset,
				0.6,
				25 + (i % 2 === 0 ? -1 : 1)
			);
			wheel.rotation.z = Math.PI / 2;
			group.add(wheel);
		}

		return group;
	}

	function createOilDrumCluster() {
		var group = new THREE.Group();
		var drumMaterial = new THREE.MeshPhongMaterial({ color: RUST_COLOR });

		var positions = [
			{ x: 0, z: 0 },
			{ x: 1.2, z: 0 },
			{ x: -1.2, z: 0 },
			{ x: 0.6, z: 1 },
			{ x: -0.6, z: 1 }
		];

		for (var i = 0; i < positions.length; i++) {
			var drum = new THREE.Mesh(
				new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8),
				drumMaterial.clone()
			);
			drum.position.set(
				-25 + positions[i].x,
				0.6,
				-8 + positions[i].z
			);
			group.add(drum);
		}

		return group;
	}

	function init(sceneParam, cameraParam) {
		scene = sceneParam;
		camera = cameraParam;
		time = 0;

		var lighting = new THREE.AmbientLight(0xFFB366, 0.7);
		scene.add(lighting);

		var sunLight = new THREE.DirectionalLight(0xFFD699, 1);
		sunLight.position.set(50, 40, 40);
		sunLight.castShadow = true;
		scene.add(sunLight);

		var terrain = createDesertTerrain();
		scene.add(terrain);

		var wall = createSandstoneWall();
		scene.add(wall);

		var mainBuilding = createMainBuilding();
		scene.add(mainBuilding);

		var antennaArray = createAntennaArray();
		scene.add(antennaArray);

		var guardPost = createGuardPost();
		scene.add(guardPost);

		var waterTower = createWaterTower();
		scene.add(waterTower);

		var vehicleWreck = createWreckedVehicle();
		scene.add(vehicleWreck);

		var oilDrums = createOilDrumCluster();
		scene.add(oilDrums);

		var shimmer = createHeatShimmer();
		scene.add(shimmer);

		var stormParticles = createSandStormParticles();
		scene.add(stormParticles);

		var iedCount = 8;
		for (var i = 0; i < iedCount; i++) {
			var iedMarker = createIEDMarker();
			var angle = (i / iedCount) * Math.PI * 2;
			var distance = 28;
			iedMarker.position.set(
				Math.cos(angle) * distance,
				0,
				Math.sin(angle) * distance
			);
			scene.add(iedMarker);
		}

		scene.background = new THREE.Color(0x87CEEB);
		scene.fog = new THREE.Fog(0x87CEEB, 150, 300);
	}

	function update(delta) {
		time += delta;

		for (var i = 0; i < particles.length; i++) {
			var particle = particles[i];
			particle.position.add(particle.velocity);

			if (particle.position.y < -5) {
				particle.position.y = 30;
			}
			if (particle.position.x < -50) {
				particle.position.x = 50;
			}
			if (particle.position.x > 50) {
				particle.position.x = -50;
			}
			if (particle.position.z < -50) {
				particle.position.z = 50;
			}
			if (particle.position.z > 50) {
				particle.position.z = -50;
			}
		}

		if (scene) {
			var shimmerObjects = scene.getObjectsByProperty('name', 'shimmer_0', true);
			var shimmerLayer = null;
			for (var s = 0; s < scene.children.length; s++) {
				if (scene.children[s].children) {
					for (var c = 0; c < scene.children[s].children.length; c++) {
						var child = scene.children[s].children[c];
						if (child.name && child.name.indexOf('shimmer_') === 0) {
							var shimmerIndex = parseInt(child.name.split('_')[1]);
							child.position.y = 0.5 + shimmerIndex * 0.4 + Math.sin(time * 2 + shimmerIndex) * 0.2;
							child.material.opacity = 0.15 + Math.sin(time * 1.5 + shimmerIndex * 0.5) * 0.1;
						}
					}
				}
			}
		}

		var iedMarkers = [];
		if (scene) {
			for (var j = 0; j < scene.children.length; j++) {
				var child = scene.children[j];
				if (child instanceof THREE.Group && child.children.length === 2) {
					if (child.children[0].geometry instanceof THREE.CylinderGeometry &&
						child.children[1].geometry instanceof THREE.BoxGeometry) {
						iedMarkers.push(child);
					}
				}
			}
		}

		for (var k = 0; k < iedMarkers.length; k++) {
			var marker = iedMarkers[k];
			var flag = marker.children[1];
			flag.rotation.z = Math.sin(time * 3 + k) * 0.2;
		}
	}

	function reset() {
		time = 0;
		particles = [];
		if (scene) {
			while (scene.children.length > 0) {
				scene.remove(scene.children[0]);
			}
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
