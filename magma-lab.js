window.MagmaLab = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animatedElements = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedElements = [];

		buildFloor();
		buildMagmaChambers();
		buildDrillingMachines();
		buildTestChambers();
		buildPlasmaWeapons();
		buildCoolingTowers();
		buildTunnels();
		buildEvacuationPods();
		buildMagmaBreak();
		buildLighting();
	}

	function buildFloor() {
		var floorGeom = new THREE.BoxGeometry(120, 1, 120);
		var floorMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var floor = new THREE.Mesh(floorGeom, floorMat);
		floor.position.y = -2;
		floor.receiveShadow = true;
		scene.add(floor);
		objects.push(floor);

		var glassSection1 = new THREE.BoxGeometry(20, 0.5, 20);
		var glassMat = new THREE.MeshLambertMaterial({ color: 0x222255, emissive: 0x1111aa });
		var glass1 = new THREE.Mesh(glassSection1, glassMat);
		glass1.position.set(-30, -1.5, -30);
		scene.add(glass1);
		objects.push(glass1);

		var glassSection2 = new THREE.BoxGeometry(20, 0.5, 20);
		var glass2 = new THREE.Mesh(glassSection2, glassMat);
		glass2.position.set(30, -1.5, -30);
		scene.add(glass2);
		objects.push(glass2);

		var glassSection3 = new THREE.BoxGeometry(20, 0.5, 20);
		var glass3 = new THREE.Mesh(glassSection3, glassMat);
		glass3.position.set(30, -1.5, 30);
		scene.add(glass3);
		objects.push(glass3);

		var glassSection4 = new THREE.BoxGeometry(20, 0.5, 20);
		var glass4 = new THREE.Mesh(glassSection4, glassMat);
		glass4.position.set(-30, -1.5, 30);
		scene.add(glass4);
		objects.push(glass4);
	}

	function buildMagmaChambers() {
		var magmaGeom = new THREE.BoxGeometry(18, 8, 18);
		var magmaMat = new THREE.MeshLambertMaterial({ color: 0xff4400, emissive: 0xff3300 });

		var chamber1 = new THREE.Mesh(magmaGeom, magmaMat);
		chamber1.position.set(-30, -15, -30);
		chamber1.userData.originalEmissive = 0xff3300;
		scene.add(chamber1);
		objects.push(chamber1);
		animatedElements.push({ mesh: chamber1, type: 'magmaglow' });

		var chamber2 = new THREE.Mesh(magmaGeom, magmaMat);
		chamber2.position.set(30, -15, -30);
		chamber2.userData.originalEmissive = 0xff3300;
		scene.add(chamber2);
		objects.push(chamber2);
		animatedElements.push({ mesh: chamber2, type: 'magmaglow' });

		var chamber3 = new THREE.Mesh(magmaGeom, magmaMat);
		chamber3.position.set(30, -15, 30);
		chamber3.userData.originalEmissive = 0xff3300;
		scene.add(chamber3);
		objects.push(chamber3);
		animatedElements.push({ mesh: chamber3, type: 'magmaglow' });

		var chamber4 = new THREE.Mesh(magmaGeom, magmaMat);
		chamber4.position.set(-30, -15, 30);
		chamber4.userData.originalEmissive = 0xff3300;
		scene.add(chamber4);
		objects.push(chamber4);
		animatedElements.push({ mesh: chamber4, type: 'magmaglow' });
	}

	function buildDrillingMachines() {
		var drillPositions = [
			[-20, 0, -20],
			[20, 0, -20],
			[-20, 0, 20],
			[20, 0, 20]
		];

		for (var i = 0; i < drillPositions.length; i++) {
			var pos = drillPositions[i];

			var baseGeom = new THREE.BoxGeometry(8, 2, 8);
			var baseMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
			var base = new THREE.Mesh(baseGeom, baseMat);
			base.position.set(pos[0], pos[1], pos[2]);
			scene.add(base);
			objects.push(base);

			var armGeom = new THREE.BoxGeometry(3, 12, 3);
			var armMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
			var arm = new THREE.Mesh(armGeom, armMat);
			arm.position.set(pos[0], pos[1] + 8, pos[2]);
			scene.add(arm);
			objects.push(arm);

			var drillGeom = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
			var drillMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
			var drill = new THREE.Mesh(drillGeom, drillMat);
			drill.position.set(pos[0], pos[1] + 14, pos[2]);
			drill.rotation.x = Math.PI / 2;
			scene.add(drill);
			objects.push(drill);
			animatedElements.push({ mesh: drill, type: 'drill' });

			var bitGeom = new THREE.ConeGeometry(1, 3, 8);
			var bitMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
			var bit = new THREE.Mesh(bitGeom, bitMat);
			bit.position.set(pos[0], pos[1] + 16, pos[2]);
			scene.add(bit);
			objects.push(bit);
		}
	}

	function buildTestChambers() {
		var chamberCount = 6;
		for (var i = 0; i < chamberCount; i++) {
			var angle = (i / chamberCount) * Math.PI * 2;
			var x = Math.cos(angle) * 40;
			var z = Math.sin(angle) * 40;

			var outerGeom = new THREE.BoxGeometry(10, 12, 10);
			var outerMat = new THREE.MeshLambertMaterial({ color: 0xaa5500 });
			var outer = new THREE.Mesh(outerGeom, outerMat);
			outer.position.set(x, 2, z);
			scene.add(outer);
			objects.push(outer);

			var innerGeom = new THREE.BoxGeometry(8, 10, 8);
			var innerMat = new THREE.MeshLambertMaterial({ color: 0xff6600, emissive: 0xff3300 });
			var inner = new THREE.Mesh(innerGeom, innerMat);
			inner.position.set(x, 2, z);
			scene.add(inner);
			objects.push(inner);
		}
	}

	function buildPlasmaWeapons() {
		var weaponCount = 3;
		var posX = [-35, 0, 35];
		var posZ = [35, 35, 35];

		for (var i = 0; i < weaponCount; i++) {
			var base = new THREE.BoxGeometry(6, 2, 6);
			var baseMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var baseMesh = new THREE.Mesh(base, baseMat);
			baseMesh.position.set(posX[i], 1, posZ[i]);
			scene.add(baseMesh);
			objects.push(baseMesh);

			var coreGeom = new THREE.CylinderGeometry(2, 2, 8, 8);
			var coreMat = new THREE.MeshLambertMaterial({ color: 0xffaa00, emissive: 0xff6600 });
			var core = new THREE.Mesh(coreGeom, coreMat);
			core.position.set(posX[i], 6, posZ[i]);
			scene.add(core);
			objects.push(core);
			animatedElements.push({ mesh: core, type: 'plasma', time: Math.random() * Math.PI * 2 });

			var coilGeom = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 8);
			var coilMat = new THREE.MeshLambertMaterial({ color: 0xff3300 });
			var coil1 = new THREE.Mesh(coilGeom, coilMat);
			coil1.position.set(posX[i], 4, posZ[i]);
			scene.add(coil1);
			objects.push(coil1);

			var coil2 = new THREE.Mesh(coilGeom, coilMat);
			coil2.position.set(posX[i], 8, posZ[i]);
			scene.add(coil2);
			objects.push(coil2);

			var coil3 = new THREE.Mesh(coilGeom, coilMat);
			coil3.position.set(posX[i], 12, posZ[i]);
			scene.add(coil3);
			objects.push(coil3);
		}
	}

	function buildCoolingTowers() {
		var towerCount = 4;
		var positions = [
			[-50, 0, -50],
			[50, 0, -50],
			[-50, 0, 50],
			[50, 0, 50]
		];

		for (var i = 0; i < towerCount; i++) {
			var pos = positions[i];

			var shellGeom = new THREE.CylinderGeometry(6, 7, 16, 8);
			var shellMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
			var shell = new THREE.Mesh(shellGeom, shellMat);
			shell.position.set(pos[0], pos[1] + 8, pos[2]);
			scene.add(shell);
			objects.push(shell);

			var fanGeom = new THREE.CylinderGeometry(5.5, 5.5, 0.5, 8);
			var fanMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
			var fan = new THREE.Mesh(fanGeom, fanMat);
			fan.position.set(pos[0], pos[1] + 15, pos[2]);
			scene.add(fan);
			objects.push(fan);

			var supportGeom = new THREE.BoxGeometry(2, 14, 2);
			var supportMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
			var support = new THREE.Mesh(supportGeom, supportMat);
			support.position.set(pos[0], pos[1] + 7, pos[2]);
			scene.add(support);
			objects.push(support);
		}
	}

	function buildTunnels() {
		var tunnelGeom = new THREE.CylinderGeometry(8, 8, 40, 8);
		var tunnelMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

		var tunnel1 = new THREE.Mesh(tunnelGeom, tunnelMat);
		tunnel1.position.set(-50, -5, 0);
		tunnel1.rotation.z = Math.PI / 2;
		scene.add(tunnel1);
		objects.push(tunnel1);

		var tunnel2 = new THREE.Mesh(tunnelGeom, tunnelMat);
		tunnel2.position.set(50, -5, 0);
		tunnel2.rotation.z = Math.PI / 2;
		scene.add(tunnel2);
		objects.push(tunnel2);

		var tunnel3 = new THREE.Mesh(tunnelGeom, tunnelMat);
		tunnel3.position.set(0, -5, -50);
		tunnel3.rotation.x = Math.PI / 2;
		scene.add(tunnel3);
		objects.push(tunnel3);

		var tunnel4 = new THREE.Mesh(tunnelGeom, tunnelMat);
		tunnel4.position.set(0, -5, 50);
		tunnel4.rotation.x = Math.PI / 2;
		scene.add(tunnel4);
		objects.push(tunnel4);

		var rockGeom = new THREE.BoxGeometry(100, 20, 100);
		var rockMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var rock = new THREE.Mesh(rockGeom, rockMat);
		rock.position.set(0, -20, 0);
		scene.add(rock);
		objects.push(rock);
	}

	function buildEvacuationPods() {
		var podCount = 5;
		for (var i = 0; i < podCount; i++) {
			var angle = (i / podCount) * Math.PI * 2;
			var x = Math.cos(angle) * 35;
			var z = Math.sin(angle) * 35;

			var podGeom = new THREE.SphereGeometry(2.5, 8, 8);
			var podMat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
			var pod = new THREE.Mesh(podGeom, podMat);
			pod.position.set(x, 3, z);
			scene.add(pod);
			objects.push(pod);

			var doorGeom = new THREE.BoxGeometry(1.5, 3, 0.3);
			var doorMat = new THREE.MeshLambertMaterial({ color: 0xff9900 });
			var door = new THREE.Mesh(doorGeom, doorMat);
			door.position.set(x, 3, z + 2.8);
			scene.add(door);
			objects.push(door);

			var hatchGeom = new THREE.CylinderGeometry(3, 3, 0.5, 8);
			var hatchMat = new THREE.MeshLambertMaterial({ color: 0xaa6600 });
			var hatch = new THREE.Mesh(hatchGeom, hatchMat);
			hatch.position.set(x, 6.5, z);
			scene.add(hatch);
			objects.push(hatch);
		}
	}

	function buildMagmaBreak() {
		var crackGeom = new THREE.BoxGeometry(25, 1, 25);
		var crackMat = new THREE.MeshLambertMaterial({ color: 0x000000, emissive: 0x000000 });
		var crack = new THREE.Mesh(crackGeom, crackMat);
		crack.position.set(0, -1.8, 0);
		scene.add(crack);
		objects.push(crack);

		var lavaGeom = new THREE.BoxGeometry(23, 0.5, 23);
		var lavaMat = new THREE.MeshLambertMaterial({ color: 0xff5500, emissive: 0xff4400 });
		var lava = new THREE.Mesh(lavaGeom, lavaMat);
		lava.position.set(0, -1.5, 0);
		scene.add(lava);
		objects.push(lava);
		animatedElements.push({ mesh: lava, type: 'magmaglow' });

		var eruptionGeom = new THREE.ConeGeometry(4, 8, 8);
		var eruptionMat = new THREE.MeshLambertMaterial({ color: 0xff6600, emissive: 0xff3300 });
		var eruption = new THREE.Mesh(eruptionGeom, eruptionMat);
		eruption.position.set(0, 2, 0);
		scene.add(eruption);
		objects.push(eruption);

		var rockDebris1 = new THREE.BoxGeometry(3, 3, 3);
		var debrisMat = new THREE.MeshLambertMaterial({ color: 0x552200 });
		var debris1 = new THREE.Mesh(rockDebris1, debrisMat);
		debris1.position.set(-8, 4, -8);
		debris1.rotation.set(0.5, 0.5, 0.5);
		scene.add(debris1);
		objects.push(debris1);

		var debris2 = new THREE.Mesh(rockDebris1, debrisMat);
		debris2.position.set(8, 3, 8);
		debris2.rotation.set(-0.3, -0.3, -0.3);
		scene.add(debris2);
		objects.push(debris2);

		var debris3 = new THREE.Mesh(rockDebris1, debrisMat);
		debris3.position.set(8, 2, -8);
		debris3.rotation.set(0.2, 0.8, 0.3);
		scene.add(debris3);
		objects.push(debris3);

		var debris4 = new THREE.Mesh(rockDebris1, debrisMat);
		debris4.position.set(-8, 1, 8);
		debris4.rotation.set(-0.6, -0.4, -0.5);
		scene.add(debris4);
		objects.push(debris4);
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
		directionalLight.position.set(30, 40, 30);
		scene.add(directionalLight);
		lights.push(directionalLight);

		var pointLight1 = new THREE.PointLight(0xff6600, 1, 80);
		pointLight1.position.set(0, 5, 0);
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0xff4400, 0.8, 60);
		pointLight2.position.set(-30, 10, -30);
		scene.add(pointLight2);
		lights.push(pointLight2);

		var pointLight3 = new THREE.PointLight(0xff4400, 0.8, 60);
		pointLight3.position.set(30, 10, 30);
		scene.add(pointLight3);
		lights.push(pointLight3);

		var pointLight4 = new THREE.PointLight(0xffaa00, 1, 50);
		pointLight4.position.set(-35, 8, 35);
		scene.add(pointLight4);
		lights.push(pointLight4);

		var pointLight5 = new THREE.PointLight(0xffaa00, 1, 50);
		pointLight5.position.set(35, 8, 35);
		scene.add(pointLight5);
		lights.push(pointLight5);
	}

	function update(delta) {
		for (var i = 0; i < animatedElements.length; i++) {
			var elem = animatedElements[i];

			if (elem.type === 'magmaglow') {
				var pulse = Math.sin(Date.now() * 0.002) * 0.3 + 0.7;
				elem.mesh.material.emissive.setHex(elem.mesh.userData.originalEmissive);
				var hue = parseInt((elem.mesh.userData.originalEmissive * pulse).toString(16));
				elem.mesh.material.emissive.setHex(0xff3300);
				elem.mesh.material.color.multiplyScalar(pulse);
				elem.mesh.material.color.setHex(0xff4400);
			}

			if (elem.type === 'drill') {
				elem.mesh.rotation.x += delta * 8;
			}

			if (elem.type === 'plasma') {
				elem.time = (elem.time + delta * 3) % (Math.PI * 2);
				var chargeIntensity = (Math.sin(elem.time) * 0.4 + 0.6);
				elem.mesh.scale.y = chargeIntensity;
				elem.mesh.position.y += (Math.sin(elem.time * 2) * delta * 0.5);
			}
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		for (var j = 0; j < lights.length; j++) {
			scene.remove(lights[j]);
		}
		objects = [];
		lights = [];
		animatedElements = [];
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
