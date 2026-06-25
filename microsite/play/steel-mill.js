window.SteelMill = (function() {
	'use strict';

	var scene;
	var camera;
	var structures;
	var dynamicElements;
	var furnaceGlowTime;
	var cameraPositions;

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		furnaceGlowTime = 0;
		structures = [];
		dynamicElements = [];
		cameraPositions = [];

		scene.background = new THREE.Color(0x1a1a1a);
		scene.fog = new THREE.Fog(0x2a2a2a, 150, 200);

		createBlastFurnaces();
		createLadleCrane();
		createRollingMill();
		createSlagDumpArea();
		createControlRoomTower();
		createCoolingBeds();
		createCoilStorageArea();
		createOverheadCraneRails();
		createMillWorkerCatwalks();
		createEmergencyEvacuationRoutes();
		createFloorAndWalls();
		createLights();
	}

	function createBlastFurnaces() {
		var furnace1Pos = new THREE.Vector3(-20, 8, -25);
		var furnace2Pos = new THREE.Vector3(20, 8, -25);
		var furnace3Pos = new THREE.Vector3(0, 8, 20);

		createBlastFurnace(furnace1Pos, 0);
		createBlastFurnace(furnace2Pos, 1);
		createBlastFurnace(furnace3Pos, 2);
	}

	function createBlastFurnace(position, index) {
		var cylinderGeom = new THREE.CylinderGeometry(6, 7, 16, 16);
		var furnaceMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.7,
			roughness: 0.4
		});
		var furnaceBody = new THREE.Mesh(cylinderGeom, furnaceMaterial);
		furnaceBody.position.copy(position);
		furnaceBody.castShadow = true;
		furnaceBody.receiveShadow = true;
		scene.add(furnaceBody);
		structures.push(furnaceBody);

		var glowGeom = new THREE.CylinderGeometry(5.5, 6.5, 3, 16);
		var glowMaterial = new THREE.MeshBasicMaterial({
			color: 0xff6600,
			emissive: 0xff3300
		});
		var furnaceGlow = new THREE.Mesh(glowGeom, glowMaterial);
		furnaceGlow.position.copy(position);
		furnaceGlow.position.y += 7;
		scene.add(furnaceGlow);

		var glowLight = new THREE.PointLight(0xff6600, 1.5, 30);
		glowLight.position.copy(position);
		glowLight.position.y += 8;
		scene.add(glowLight);

		dynamicElements.push({
			type: 'furnaceGlow',
			mesh: furnaceGlow,
			light: glowLight,
			index: index,
			baseColor: 0xff6600,
			baseIntensity: 1.5
		});

		var capGeom = new THREE.ConeGeometry(6.5, 4, 16);
		var capMaterial = new THREE.MeshStandardMaterial({
			color: 0x222222,
			metalness: 0.6,
			roughness: 0.5
		});
		var furnaceCap = new THREE.Mesh(capGeom, capMaterial);
		furnaceCap.position.copy(position);
		furnaceCap.position.y += 9;
		furnaceCap.castShadow = true;
		furnaceCap.receiveShadow = true;
		scene.add(furnaceCap);
		structures.push(furnaceCap);
	}

	function createLadleCrane() {
		var craneBaseGeom = new THREE.BoxGeometry(4, 1, 4);
		var craneBaseMaterial = new THREE.MeshStandardMaterial({
			color: 0x444444,
			metalness: 0.8,
			roughness: 0.3
		});
		var craneBase = new THREE.Mesh(craneBaseGeom, craneBaseMaterial);
		craneBase.position.set(-15, 0.5, 0);
		craneBase.castShadow = true;
		craneBase.receiveShadow = true;
		scene.add(craneBase);
		structures.push(craneBase);

		var pillarGeom = new THREE.CylinderGeometry(0.8, 0.8, 20, 8);
		var pillarMaterial = new THREE.MeshStandardMaterial({
			color: 0x555555,
			metalness: 0.7,
			roughness: 0.4
		});
		var pillar = new THREE.Mesh(pillarGeom, pillarMaterial);
		pillar.position.set(-15, 10, 0);
		pillar.castShadow = true;
		pillar.receiveShadow = true;
		scene.add(pillar);
		structures.push(pillar);

		var beamGeom = new THREE.BoxGeometry(40, 0.6, 0.8);
		var beamMaterial = new THREE.MeshStandardMaterial({
			color: 0x666666,
			metalness: 0.85,
			roughness: 0.25
		});
		var beam = new THREE.Mesh(beamGeom, beamMaterial);
		beam.position.set(0, 20, 0);
		beam.castShadow = true;
		beam.receiveShadow = true;
		scene.add(beam);
		structures.push(beam);

		var ladleGeom = new THREE.SphereGeometry(2, 8, 8);
		var ladleMaterial = new THREE.MeshStandardMaterial({
			color: 0xff9933,
			emissive: 0xff3300,
			metalness: 0.6,
			roughness: 0.5
		});
		var ladle = new THREE.Mesh(ladleGeom, ladleMaterial);
		ladle.position.set(0, 15, 0);
		ladle.castShadow = true;
		ladle.receiveShadow = true;
		scene.add(ladle);

		dynamicElements.push({
			type: 'ladle',
			mesh: ladle,
			startPos: new THREE.Vector3(0, 15, 0),
			baseColor: 0xff9933
		});

		var cablePoints = [];
		cablePoints.push(new THREE.Vector3(0, 20, 0));
		cablePoints.push(new THREE.Vector3(0, 15, 0));
		var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
		var cableMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
		var cable = new THREE.LineSegments(cableGeom, cableMaterial);
		scene.add(cable);
	}

	function createRollingMill() {
		var rollRadius = 1.5;
		var rollLength = 25;

		var roll1Geom = new THREE.CylinderGeometry(rollRadius, rollRadius, rollLength, 12);
		var rollMaterial = new THREE.MeshStandardMaterial({
			color: 0x777777,
			metalness: 0.9,
			roughness: 0.2
		});
		var roll1 = new THREE.Mesh(roll1Geom, rollMaterial);
		roll1.position.set(25, 2, -10);
		roll1.rotation.z = Math.PI / 2;
		roll1.castShadow = true;
		roll1.receiveShadow = true;
		scene.add(roll1);
		structures.push(roll1);
		dynamicElements.push({
			type: 'rollingRoll',
			mesh: roll1
		});

		var roll2Geom = new THREE.CylinderGeometry(rollRadius, rollRadius, rollLength, 12);
		var roll2 = new THREE.Mesh(roll2Geom, rollMaterial);
		roll2.position.set(25, 5, -10);
		roll2.rotation.z = Math.PI / 2;
		roll2.castShadow = true;
		roll2.receiveShadow = true;
		scene.add(roll2);
		structures.push(roll2);
		dynamicElements.push({
			type: 'rollingRoll',
			mesh: roll2
		});

		var slabGeom = new THREE.BoxGeometry(3, 0.3, 20);
		var slabMaterial = new THREE.MeshStandardMaterial({
			color: 0xcc3333,
			emissive: 0x660000,
			metalness: 0.7,
			roughness: 0.4
		});
		var slab = new THREE.Mesh(slabGeom, slabMaterial);
		slab.position.set(25, 3.5, -10);
		slab.castShadow = true;
		slab.receiveShadow = true;
		scene.add(slab);
		dynamicElements.push({
			type: 'steelSlab',
			mesh: slab,
			baseColor: 0xcc3333
		});
	}

	function createSlagDumpArea() {
		var slagHeapGeom = new THREE.SphereGeometry(8, 10, 10);
		var slagMaterial = new THREE.MeshStandardMaterial({
			color: 0x443322,
			emissive: 0x664422,
			metalness: 0.5,
			roughness: 0.6
		});
		var slagHeap = new THREE.Mesh(slagHeapGeom, slagMaterial);
		slagHeap.position.set(35, 5, 25);
		slagHeap.scale.set(1, 0.6, 1);
		slagHeap.castShadow = true;
		slagHeap.receiveShadow = true;
		scene.add(slagHeap);
		structures.push(slagHeap);

		var slagLight = new THREE.PointLight(0xff6633, 2, 40);
		slagLight.position.set(35, 8, 25);
		scene.add(slagLight);

		dynamicElements.push({
			type: 'slagGlow',
			light: slagLight,
			baseIntensity: 2
		});

		var containerGeom = new THREE.BoxGeometry(12, 8, 6);
		var containerMaterial = new THREE.MeshStandardMaterial({
			color: 0x555555,
			metalness: 0.7,
			roughness: 0.4
		});
		var container = new THREE.Mesh(containerGeom, containerMaterial);
		container.position.set(40, 4, 35);
		container.castShadow = true;
		container.receiveShadow = true;
		scene.add(container);
		structures.push(container);
	}

	function createControlRoomTower() {
		var baseGeom = new THREE.BoxGeometry(10, 2, 10);
		var baseMaterial = new THREE.MeshStandardMaterial({
			color: 0x444444,
			metalness: 0.6,
			roughness: 0.5
		});
		var base = new THREE.Mesh(baseGeom, baseMaterial);
		base.position.set(-30, 1, 0);
		base.castShadow = true;
		base.receiveShadow = true;
		scene.add(base);
		structures.push(base);

		var bodyGeom = new THREE.BoxGeometry(8, 15, 8);
		var bodyMaterial = new THREE.MeshStandardMaterial({
			color: 0x555555,
			metalness: 0.5,
			roughness: 0.6
		});
		var body = new THREE.Mesh(bodyGeom, bodyMaterial);
		body.position.set(-30, 9, 0);
		body.castShadow = true;
		body.receiveShadow = true;
		scene.add(body);
		structures.push(body);

		var roofGeom = new THREE.ConeGeometry(5, 4, 8);
		var roofMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.7,
			roughness: 0.4
		});
		var roof = new THREE.Mesh(roofGeom, roofMaterial);
		roof.position.set(-30, 18, 0);
		roof.castShadow = true;
		roof.receiveShadow = true;
		scene.add(roof);
		structures.push(roof);

		var windowGeom = new THREE.BoxGeometry(6, 6, 0.5);
		var windowMaterial = new THREE.MeshStandardMaterial({
			color: 0xaaffff,
			emissive: 0x00ff99,
			metalness: 0.9,
			roughness: 0.1
		});
		var window1 = new THREE.Mesh(windowGeom, windowMaterial);
		window1.position.set(-34.5, 10, 0);
		window1.castShadow = true;
		window1.receiveShadow = true;
		scene.add(window1);
	}

	function createCoolingBeds() {
		var railGeom = new THREE.BoxGeometry(50, 0.4, 0.4);
		var railMaterial = new THREE.MeshStandardMaterial({
			color: 0x666666,
			metalness: 0.8,
			roughness: 0.3
		});
		var rail1 = new THREE.Mesh(railGeom, railMaterial);
		rail1.position.set(10, 1.5, -35);
		rail1.castShadow = true;
		rail1.receiveShadow = true;
		scene.add(rail1);
		structures.push(rail1);

		var rail2 = new THREE.Mesh(railGeom, railMaterial);
		rail2.position.set(10, 1.5, -30);
		rail2.castShadow = true;
		rail2.receiveShadow = true;
		scene.add(rail2);
		structures.push(rail2);

		var supportGeom = new THREE.BoxGeometry(40, 0.6, 1.2);
		var supportMaterial = new THREE.MeshStandardMaterial({
			color: 0x555555,
			metalness: 0.7,
			roughness: 0.4
		});
		var support = new THREE.Mesh(supportGeom, supportMaterial);
		support.position.set(10, 0.3, -32.5);
		support.castShadow = true;
		support.receiveShadow = true;
		scene.add(support);
		structures.push(support);

		var steelCoilGeom = new THREE.CylinderGeometry(2, 2, 0.8, 12);
		var coilMaterial = new THREE.MeshStandardMaterial({
			color: 0xaa4444,
			emissive: 0x442222,
			metalness: 0.8,
			roughness: 0.3
		});
		var coil = new THREE.Mesh(steelCoilGeom, coilMaterial);
		coil.position.set(5, 2.5, -32.5);
		coil.rotation.z = Math.PI / 2;
		coil.castShadow = true;
		coil.receiveShadow = true;
		scene.add(coil);
		structures.push(coil);
	}

	function createCoilStorageArea() {
		var row1y = 0;
		var row2y = 3;
		var row3y = 6;

		var positions = [
			[
				{x: -35, z: -15},
				{x: -35, z: -5},
				{x: -35, z: 5}
			],
			[
				{x: -20, z: -15},
				{x: -20, z: -5},
				{x: -20, z: 5}
			],
			[
				{x: -5, z: -15},
				{x: -5, z: -5},
				{x: -5, z: 5}
			]
		];

		var coilGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.6, 12);
		var coilMaterial = new THREE.MeshStandardMaterial({
			color: 0x884444,
			metalness: 0.75,
			roughness: 0.35
		});

		var rowIndex = 0;
		for (var i = 0; i < positions.length; i++) {
			for (var j = 0; j < positions[i].length; j++) {
				var coil = new THREE.Mesh(coilGeom, coilMaterial);
				coil.position.set(positions[i][j].x, rowIndex + 1.5, positions[i][j].z);
				coil.rotation.z = Math.PI / 2;
				coil.castShadow = true;
				coil.receiveShadow = true;
				scene.add(coil);
				structures.push(coil);
			}
			rowIndex += 3;
		}
	}

	function createOverheadCraneRails() {
		var railGeom = new THREE.BoxGeometry(80, 0.5, 0.5);
		var railMaterial = new THREE.MeshStandardMaterial({
			color: 0x777777,
			metalness: 0.85,
			roughness: 0.25
		});
		var rail1 = new THREE.Mesh(railGeom, railMaterial);
		rail1.position.set(0, 25, -30);
		rail1.castShadow = true;
		rail1.receiveShadow = true;
		scene.add(rail1);
		structures.push(rail1);

		var rail2 = new THREE.Mesh(railGeom, railMaterial);
		rail2.position.set(0, 25, 30);
		rail2.castShadow = true;
		rail2.receiveShadow = true;
		scene.add(rail2);
		structures.push(rail2);

		var supportGeom = new THREE.CylinderGeometry(1, 1, 23, 8);
		var supportMaterial = new THREE.MeshStandardMaterial({
			color: 0x666666,
			metalness: 0.8,
			roughness: 0.3
		});

		var supportPositions = [
			-30, -15, 0, 15, 30
		];
		for (var k = 0; k < supportPositions.length; k++) {
			var support1 = new THREE.Mesh(supportGeom, supportMaterial);
			support1.position.set(supportPositions[k], 12.5, -30);
			support1.castShadow = true;
			support1.receiveShadow = true;
			scene.add(support1);
			structures.push(support1);

			var support2 = new THREE.Mesh(supportGeom, supportMaterial);
			support2.position.set(supportPositions[k], 12.5, 30);
			support2.castShadow = true;
			support2.receiveShadow = true;
			scene.add(support2);
			structures.push(support2);
		}
	}

	function createMillWorkerCatwalks() {
		var platform1Geom = new THREE.BoxGeometry(25, 0.5, 4);
		var platformMaterial = new THREE.MeshStandardMaterial({
			color: 0x555555,
			metalness: 0.7,
			roughness: 0.4
		});
		var platform1 = new THREE.Mesh(platform1Geom, platformMaterial);
		platform1.position.set(-10, 8, 20);
		platform1.castShadow = true;
		platform1.receiveShadow = true;
		scene.add(platform1);
		structures.push(platform1);

		var railGeom = new THREE.BoxGeometry(25, 1, 0.3);
		var railMaterial = new THREE.MeshStandardMaterial({
			color: 0x666666,
			metalness: 0.8,
			roughness: 0.3
		});
		var rail = new THREE.Mesh(railGeom, railMaterial);
		rail.position.set(-10, 9.5, 22);
		rail.castShadow = true;
		rail.receiveShadow = true;
		scene.add(rail);
		structures.push(rail);

		var stairGeom = new THREE.BoxGeometry(2, 8, 2);
		var stairMaterial = new THREE.MeshStandardMaterial({
			color: 0x444444,
			metalness: 0.6,
			roughness: 0.5
		});
		var stair = new THREE.Mesh(stairGeom, stairMaterial);
		stair.position.set(-25, 4, 15);
		stair.castShadow = true;
		stair.receiveShadow = true;
		scene.add(stair);
		structures.push(stair);
	}

	function createEmergencyEvacuationRoutes() {
		var signGeom = new THREE.BoxGeometry(2, 2, 0.2);
		var signMaterial = new THREE.MeshStandardMaterial({
			color: 0x00ff00,
			emissive: 0x00aa00,
			metalness: 0.5,
			roughness: 0.5
		});
		var sign1 = new THREE.Mesh(signGeom, signMaterial);
		sign1.position.set(-35, 5, -35);
		sign1.castShadow = true;
		sign1.receiveShadow = true;
		scene.add(sign1);

		var sign2 = new THREE.Mesh(signGeom, signMaterial);
		sign2.position.set(35, 5, -35);
		sign2.castShadow = true;
		sign2.receiveShadow = true;
		scene.add(sign2);

		var exitDoorGeom = new THREE.BoxGeometry(3, 4, 0.5);
		var doorMaterial = new THREE.MeshStandardMaterial({
			color: 0xff0000,
			emissive: 0x660000,
			metalness: 0.7,
			roughness: 0.4
		});
		var exitDoor = new THREE.Mesh(exitDoorGeom, doorMaterial);
		exitDoor.position.set(38, 2, 38);
		exitDoor.castShadow = true;
		exitDoor.receiveShadow = true;
		scene.add(exitDoor);
		structures.push(exitDoor);
	}

	function createFloorAndWalls() {
		var floorGeom = new THREE.BoxGeometry(80, 0.3, 80);
		var floorMaterial = new THREE.MeshStandardMaterial({
			color: 0x2a2a2a,
			metalness: 0.3,
			roughness: 0.8
		});
		var floor = new THREE.Mesh(floorGeom, floorMaterial);
		floor.position.y = 0;
		floor.receiveShadow = true;
		scene.add(floor);
		structures.push(floor);

		var wallGeom = new THREE.BoxGeometry(80, 20, 0.8);
		var wallMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.4,
			roughness: 0.6
		});

		var wallNorth = new THREE.Mesh(wallGeom, wallMaterial);
		wallNorth.position.set(0, 10, -40);
		wallNorth.castShadow = true;
		wallNorth.receiveShadow = true;
		scene.add(wallNorth);
		structures.push(wallNorth);

		var wallSouth = new THREE.Mesh(wallGeom, wallMaterial);
		wallSouth.position.set(0, 10, 40);
		wallSouth.castShadow = true;
		wallSouth.receiveShadow = true;
		scene.add(wallSouth);
		structures.push(wallSouth);

		var wallEastGeom = new THREE.BoxGeometry(0.8, 20, 80);
		var wallEast = new THREE.Mesh(wallEastGeom, wallMaterial);
		wallEast.position.set(40, 10, 0);
		wallEast.castShadow = true;
		wallEast.receiveShadow = true;
		scene.add(wallEast);
		structures.push(wallEast);

		var wallWest = new THREE.Mesh(wallEastGeom, wallMaterial);
		wallWest.position.set(-40, 10, 0);
		wallWest.castShadow = true;
		wallWest.receiveShadow = true;
		scene.add(wallWest);
		structures.push(wallWest);
	}

	function createLights() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(30, 40, 30);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.far = 150;
		directionalLight.shadow.camera.left = -50;
		directionalLight.shadow.camera.right = 50;
		directionalLight.shadow.camera.top = 50;
		directionalLight.shadow.camera.bottom = -50;
		scene.add(directionalLight);
	}

	function update(delta) {
		furnaceGlowTime += delta;

		for (var i = 0; i < dynamicElements.length; i++) {
			var element = dynamicElements[i];

			if (element.type === 'furnaceGlow') {
				var glowIntensity = element.baseIntensity + Math.sin(furnaceGlowTime * 2 + element.index) * 0.4;
				element.light.intensity = glowIntensity;

				var glowColor = Math.sin(furnaceGlowTime * 1.5 + element.index) * 0.5 + 0.5;
				var colorValue = Math.floor(0xff6600 + (glowColor * 0x330000));
				element.mesh.material.emissive.setHex(colorValue);
			}
			else if (element.type === 'ladle') {
				var ladleX = Math.sin(furnaceGlowTime * 0.3) * 15;
				var ladleY = 15 + Math.sin(furnaceGlowTime * 0.5) * 2;
				var ladleZ = Math.cos(furnaceGlowTime * 0.2) * 20;
				element.mesh.position.set(ladleX, ladleY, ladleZ);

				var shimmerIntensity = Math.sin(furnaceGlowTime * 3) * 0.3 + 0.7;
				var shimmerColor = element.baseColor + Math.floor(shimmerIntensity * 0x220000);
				element.mesh.material.emissive.setHex(shimmerColor);
			}
			else if (element.type === 'rollingRoll') {
				element.mesh.rotation.x += delta * 2;
			}
			else if (element.type === 'steelSlab') {
				var slabShimmer = Math.sin(furnaceGlowTime * 2) * 0.2 + 0.3;
				var slabColor = element.baseColor + Math.floor(slabShimmer * 0x330000);
				element.mesh.material.emissive.setHex(slabColor);
			}
			else if (element.type === 'slagGlow') {
				var slagIntensity = element.baseIntensity + Math.sin(furnaceGlowTime * 1.8) * 0.5;
				element.light.intensity = slagIntensity;
			}
		}
	}

	function reset() {
		furnaceGlowTime = 0;

		for (var i = structures.length - 1; i >= 0; i--) {
			scene.remove(structures[i]);
		}
		structures = [];
		dynamicElements = [];

		var objectsToRemove = [];
		scene.traverse(function(object) {
			if (object !== scene) {
				objectsToRemove.push(object);
			}
		});

		for (var j = 0; j < objectsToRemove.length; j++) {
			scene.remove(objectsToRemove[j]);
		}

		init(scene, camera);
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
