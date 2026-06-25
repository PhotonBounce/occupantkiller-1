window.RooftopSiege = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var meshes = [];
	var cables = [];

	function buildRooftopPlatforms() {
		var platformGeom = new THREE.BoxGeometry(80, 4, 60);
		var platformMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8, metalness: 0.2 });

		var platform1 = new THREE.Mesh(platformGeom, platformMat);
		platform1.position.set(0, 20, 0);
		platform1.castShadow = true;
		platform1.receiveShadow = true;
		scene.add(platform1);
		meshes.push(platform1);

		var platform2 = new THREE.Mesh(platformGeom.clone(), platformMat.clone());
		platform2.position.set(100, 28, 0);
		platform2.castShadow = true;
		platform2.receiveShadow = true;
		scene.add(platform2);
		meshes.push(platform2);

		var platform3 = new THREE.Mesh(platformGeom.clone(), platformMat.clone());
		platform3.position.set(-100, 22, 0);
		platform3.castShadow = true;
		platform3.receiveShadow = true;
		scene.add(platform3);
		meshes.push(platform3);
	}

	function buildWaterTowers() {
		var tankGeom = new THREE.CylinderGeometry(8, 8, 12, 16);
		var tankMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.7, metalness: 0.3 });

		var legGeom = new THREE.CylinderGeometry(1.5, 1.5, 18, 8);
		var legMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9, metalness: 0.1 });

		function buildTower(x, z) {
			var leg1 = new THREE.Mesh(legGeom, legMat);
			leg1.position.set(x - 4, 9, z - 4);
			scene.add(leg1);
			meshes.push(leg1);

			var leg2 = new THREE.Mesh(legGeom.clone(), legMat.clone());
			leg2.position.set(x + 4, 9, z - 4);
			scene.add(leg2);
			meshes.push(leg2);

			var leg3 = new THREE.Mesh(legGeom.clone(), legMat.clone());
			leg3.position.set(x - 4, 9, z + 4);
			scene.add(leg3);
			meshes.push(leg3);

			var leg4 = new THREE.Mesh(legGeom.clone(), legMat.clone());
			leg4.position.set(x + 4, 9, z + 4);
			scene.add(leg4);
			meshes.push(leg4);

			var tank = new THREE.Mesh(tankGeom, tankMat);
			tank.position.set(x, 27, z);
			tank.castShadow = true;
			tank.receiveShadow = true;
			scene.add(tank);
			meshes.push(tank);
		}

		buildTower(40, 30);
		buildTower(-60, 25);
	}

	function buildHVACUnits() {
		var hvacGeom = new THREE.BoxGeometry(12, 8, 14);
		var hvacMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8, metalness: 0.4 });

		var hvac1 = new THREE.Mesh(hvacGeom, hvacMat);
		hvac1.position.set(20, 24, -25);
		hvac1.castShadow = true;
		hvac1.receiveShadow = true;
		scene.add(hvac1);
		meshes.push(hvac1);

		var hvac2 = new THREE.Mesh(hvacGeom.clone(), hvacMat.clone());
		hvac2.position.set(-30, 24, 30);
		hvac2.castShadow = true;
		hvac2.receiveShadow = true;
		scene.add(hvac2);
		meshes.push(hvac2);
	}

	function buildElevatorShafts() {
		var shaftGeom = new THREE.BoxGeometry(8, 35, 8);
		var shaftMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9, metalness: 0.2 });

		var shaft1 = new THREE.Mesh(shaftGeom, shaftMat);
		shaft1.position.set(35, 27, 0);
		shaft1.castShadow = true;
		scene.add(shaft1);
		meshes.push(shaft1);

		var shaft2 = new THREE.Mesh(shaftGeom.clone(), shaftMat.clone());
		shaft2.position.set(-35, 27, -15);
		shaft2.castShadow = true;
		scene.add(shaft2);
		meshes.push(shaft2);
	}

	function buildGreenhouse() {
		var boxGeom = new THREE.BoxGeometry(25, 10, 20);
		var glassMat = new THREE.MeshStandardMaterial({
			color: 0x90EE90,
			emissive: 0x2d5016,
			emissiveIntensity: 0.4,
			roughness: 0.3,
			metalness: 0.1,
			transparent: true,
			opacity: 0.8
		});

		var greenhouse = new THREE.Mesh(boxGeom, glassMat);
		greenhouse.position.set(60, 24, -35);
		greenhouse.castShadow = true;
		greenhouse.receiveShadow = true;
		scene.add(greenhouse);
		meshes.push(greenhouse);
	}

	function buildBridges() {
		var bridgeGeom = new THREE.BoxGeometry(6, 2, 35);
		var bridgeMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8, metalness: 0.3 });

		var bridge1 = new THREE.Mesh(bridgeGeom, bridgeMat);
		bridge1.position.set(50, 24, 0);
		bridge1.rotation.z = Math.PI / 6;
		bridge1.castShadow = true;
		bridge1.receiveShadow = true;
		scene.add(bridge1);
		meshes.push(bridge1);

		addCables(30, 27, 15, 70, 27, 15);
	}

	function addCables(x1, y1, z1, x2, y2, z2) {
		var geometry = new THREE.BufferGeometry();
		var positions = new Float32Array([x1, y1, z1, x2, y2, z2]);
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

		var material = new THREE.LineBasicMaterial({ color: 0xCCCCCC, linewidth: 2 });
		var line = new THREE.LineSegments(geometry, material);
		scene.add(line);
		cables.push(line);
	}

	function buildSandbagWalls() {
		var sandbagGeom = new THREE.BoxGeometry(10, 3, 3);
		var sandbagMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9, metalness: 0.0 });

		var y = 23;
		for (var i = 0; i < 4; i++) {
			var sandbag = new THREE.Mesh(sandbagGeom, sandbagMat);
			sandbag.position.set(-70, y, 15 + i * 4);
			sandbag.castShadow = true;
			sandbag.receiveShadow = true;
			scene.add(sandbag);
			meshes.push(sandbag);
		}
	}

	function buildSatelliteDishes() {
		var dishBaseGeom = new THREE.CylinderGeometry(0.8, 0.8, 10, 8);
		var baseMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.4 });

		var dishGeom = new THREE.SphereGeometry(6, 16, 12);
		var dishMat = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.5, metalness: 0.8 });

		function buildDish(x, z) {
			var base = new THREE.Mesh(dishBaseGeom, baseMat);
			base.position.set(x, 28, z);
			scene.add(base);
			meshes.push(base);

			var dish = new THREE.Mesh(dishGeom, dishMat);
			dish.position.set(x, 38, z);
			dish.castShadow = true;
			dish.receiveShadow = true;
			scene.add(dish);
			meshes.push(dish);
		}

		buildDish(-40, -35);
		buildDish(45, -40);
	}

	function buildCityGlow() {
		var glowGeom = new THREE.SphereGeometry(200, 32, 32);
		var glowMat = new THREE.MeshStandardMaterial({
			color: 0xFFDD88,
			emissive: 0xFFAA44,
			emissiveIntensity: 0.6,
			roughness: 1.0,
			side: THREE.BackSide
		});

		var glow = new THREE.Mesh(glowGeom, glowMat);
		glow.position.set(0, -50, 0);
		scene.add(glow);
		meshes.push(glow);
	}

	function buildHelipads() {
		var helipadGeom = new THREE.CylinderGeometry(15, 15, 1, 16);
		var helipadMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7, metalness: 0.3 });

		var helipad1 = new THREE.Mesh(helipadGeom, helipadMat);
		helipad1.position.set(-80, 24, -20);
		helipad1.castShadow = true;
		helipad1.receiveShadow = true;
		scene.add(helipad1);
		meshes.push(helipad1);

		var helipad2 = new THREE.Mesh(helipadGeom.clone(), helipadMat.clone());
		helipad2.position.set(80, 32, 40);
		helipad2.castShadow = true;
		helipad2.receiveShadow = true;
		scene.add(helipad2);
		meshes.push(helipad2);
	}

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;

		buildRooftopPlatforms();
		buildWaterTowers();
		buildHVACUnits();
		buildElevatorShafts();
		buildGreenhouse();
		buildBridges();
		buildSandbagWalls();
		buildSatelliteDishes();
		buildCityGlow();
		buildHelipads();

		var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
		scene.add(ambientLight);

		var sunLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
		sunLight.position.set(100, 100, 50);
		sunLight.castShadow = true;
		sunLight.shadow.mapSize.width = 2048;
		sunLight.shadow.mapSize.height = 2048;
		sunLight.shadow.camera.left = -200;
		sunLight.shadow.camera.right = 200;
		sunLight.shadow.camera.top = 200;
		sunLight.shadow.camera.bottom = -200;
		scene.add(sunLight);
	}

	function update(delta) {
		var i = 0;
		while (i < meshes.length) {
			if (meshes[i].rotation) {
				meshes[i].rotation.y += delta * 0.1;
			}
			i++;
		}
	}

	function reset() {
		var i = 0;
		while (i < meshes.length) {
			scene.remove(meshes[i]);
			i++;
		}
		meshes = [];

		var j = 0;
		while (j < cables.length) {
			scene.remove(cables[j]);
			j++;
		}
		cables = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
