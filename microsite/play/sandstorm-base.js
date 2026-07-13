window.SandstormBase = (function() {
	'use strict';

	var sceneRef = null;
	var cameraRef = null;
	var allObjects = [];
	var allLights = [];
	var dustParticles = [];
	var commTower = null;
	var sandDune = null;

	function init(sceneRefArg, cameraRefArg) {
		sceneRef = sceneRefArg;
		cameraRef = cameraRefArg;
		allObjects = [];
		allLights = [];
		dustParticles = [];

		buildbaseLighting();
		buildconcretebuildings();
		buildhalfburiedvehicles();
		buildequipmentwreckage();
		buildduneformations();
		buildsupplystations();
		buildsandbags();
		buildcommtower();
		buildperimeterdefense();
		builddustcloud();
	}

	function buildbaseLighting() {
		var ambientLight = new THREE.AmbientLight(0xd4a574, 0.7);
		sceneRef.add(ambientLight);
		allLights.push(ambientLight);

		var dirLight = new THREE.DirectionalLight(0xf5deb3, 0.8);
		dirLight.position.set(50, 40, 50);
		dirLight.castShadow = true;
		sceneRef.add(dirLight);
		allLights.push(dirLight);

		var stormLight = new THREE.DirectionalLight(0xc9a961, 0.4);
		stormLight.position.set(-30, 20, -40);
		sceneRef.add(stormLight);
		allLights.push(stormLight);
	}

	function buildconcretebuildings() {
		var positions = [
			{ x: -40, z: -20, w: 30, h: 8, d: 20 },
			{ x: 20, z: 30, w: 25, h: 6, d: 15 },
			{ x: -10, z: 50, w: 20, h: 7, d: 18 },
			{ x: 35, z: -40, w: 28, h: 9, d: 22 }
		];

		var i = 0;
		while (i < positions.length) {
			var pos = positions[i];
			var geom = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
			var mat = new THREE.MeshLambertMaterial({ color: 0xb89968 });
			var mesh = new THREE.Mesh(geom, mat);
			mesh.position.set(pos.x, pos.h / 2, pos.z);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			sceneRef.add(mesh);
			allObjects.push(mesh);

			var damage = new THREE.BoxGeometry(pos.w * 0.15, pos.h * 0.3, 2);
			var dmgMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
			var dmgMesh = new THREE.Mesh(damage, dmgMat);
			dmgMesh.position.set(pos.x + pos.w * 0.35, pos.h * 0.6, pos.z + pos.d * 0.4);
			dmgMesh.castShadow = true;
			dmgMesh.receiveShadow = true;
			sceneRef.add(dmgMesh);
			allObjects.push(dmgMesh);

			i = i + 1;
		}
	}

	function buildhalfburiedvehicles() {
		var vehicleData = [
			{ x: 15, z: -35, rot: 0.3 },
			{ x: -25, z: 25, rot: -0.2 },
			{ x: 40, z: 10, rot: 0.5 }
		];

		var j = 0;
		while (j < vehicleData.length) {
			var vdata = vehicleData[j];
			var body = new THREE.BoxGeometry(4, 2, 8);
			var bodyMat = new THREE.MeshLambertMaterial({ color: 0xa0826d });
			var bodyMesh = new THREE.Mesh(body, bodyMat);
			bodyMesh.position.set(vdata.x, 0.8, vdata.z);
			bodyMesh.rotation.y = vdata.rot;
			bodyMesh.castShadow = true;
			bodyMesh.receiveShadow = true;
			sceneRef.add(bodyMesh);
			allObjects.push(bodyMesh);

			var wheel1 = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16);
			var wheelMat = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
			var w1 = new THREE.Mesh(wheel1, wheelMat);
			w1.position.set(vdata.x - 1.2, 0.8, vdata.z - 2.5);
			w1.rotation.z = 0.3;
			w1.castShadow = true;
			sceneRef.add(w1);
			allObjects.push(w1);

			var w2 = new THREE.Mesh(wheel1, wheelMat);
			w2.position.set(vdata.x + 1.2, 0.8, vdata.z - 2.5);
			w2.rotation.z = 0.3;
			w2.castShadow = true;
			sceneRef.add(w2);
			allObjects.push(w2);

			var w3 = new THREE.Mesh(wheel1, wheelMat);
			w3.position.set(vdata.x - 1.2, 0.8, vdata.z + 2.5);
			w3.rotation.z = 0.3;
			w3.castShadow = true;
			sceneRef.add(w3);
			allObjects.push(w3);

			var w4 = new THREE.Mesh(wheel1, wheelMat);
			w4.position.set(vdata.x + 1.2, 0.8, vdata.z + 2.5);
			w4.rotation.z = 0.3;
			w4.castShadow = true;
			sceneRef.add(w4);
			allObjects.push(w4);

			j = j + 1;
		}
	}

	function buildequipmentwreckage() {
		var equipData = [
			{ x: -15, z: 10, ty: 0 },
			{ x: 5, z: -30, ty: 1 },
			{ x: 30, z: 45, ty: 2 },
			{ x: -35, z: -15, ty: 0 },
			{ x: 25, z: 25, ty: 1 }
		];

		var k = 0;
		while (k < equipData.length) {
			var edata = equipData[k];
			var equ = null;

			if (edata.ty === 0) {
				equ = new THREE.BoxGeometry(3, 4, 2);
			} else if (edata.ty === 1) {
				equ = new THREE.CylinderGeometry(1.2, 1.2, 3.5, 12);
			} else {
				equ = new THREE.ConeGeometry(1.5, 3, 8);
			}

			var equMat = new THREE.MeshLambertMaterial({ color: 0x9a8b7e });
			var equMesh = new THREE.Mesh(equ, equMat);
			equMesh.position.set(edata.x, 1.5, edata.z);
			equMesh.rotation.y = Math.random() * 6.28;
			equMesh.castShadow = true;
			equMesh.receiveShadow = true;
			sceneRef.add(equMesh);
			allObjects.push(equMesh);

			k = k + 1;
		}
	}

	function buildduneformations() {
		var dunePositions = [
			{ x: -50, z: 0, s: 1.2 },
			{ x: 45, z: -50, s: 1.4 },
			{ x: 10, z: 60, s: 1.1 },
			{ x: -30, z: 40, s: 1.3 }
		];

		var d = 0;
		while (d < dunePositions.length) {
			var dp = dunePositions[d];
			var duneGeom = new THREE.BoxGeometry(35, 8, 25);
			var duneMat = new THREE.MeshLambertMaterial({ color: 0xdaa520 });
			var duneMesh = new THREE.Mesh(duneGeom, duneMat);
			duneMesh.position.set(dp.x, 4, dp.z);
			duneMesh.scale.set(dp.s, 1, 1);
			duneMesh.rotation.z = 0.15;
			duneMesh.castShadow = true;
			duneMesh.receiveShadow = true;
			sceneRef.add(duneMesh);
			allObjects.push(duneMesh);

			d = d + 1;
		}

		sandDune = new THREE.Group();
		var mainDune = new THREE.BoxGeometry(40, 6, 30);
		var mainMat = new THREE.MeshLambertMaterial({ color: 0xd2b48c });
		var mainDuneMesh = new THREE.Mesh(mainDune, mainMat);
		mainDuneMesh.position.set(0, 3, -60);
		mainDuneMesh.castShadow = true;
		mainDuneMesh.receiveShadow = true;
		sandDune.add(mainDuneMesh);
		sceneRef.add(sandDune);
		allObjects.push(sandDune);
	}

	function buildsupplystations() {
		var stationData = [
			{ x: -20, z: 35 },
			{ x: 30, z: -25 },
			{ x: 10, z: 20 }
		];

		var s = 0;
		while (s < stationData.length) {
			var sdata = stationData[s];
			var pole = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
			var poleMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
			var poleMesh = new THREE.Mesh(pole, poleMat);
			poleMesh.position.set(sdata.x, 2, sdata.z);
			poleMesh.castShadow = true;
			sceneRef.add(poleMesh);
			allObjects.push(poleMesh);

			var goggleGeom = new THREE.SphereGeometry(0.4, 8, 8);
			var goggleMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
			var goggle1 = new THREE.Mesh(goggleGeom, goggleMat);
			goggle1.position.set(sdata.x - 0.6, 3.5, sdata.z);
			goggle1.castShadow = true;
			sceneRef.add(goggle1);
			allObjects.push(goggle1);

			var goggle2 = new THREE.Mesh(goggleGeom, goggleMat);
			goggle2.position.set(sdata.x + 0.6, 3.5, sdata.z);
			goggle2.castShadow = true;
			sceneRef.add(goggle2);
			allObjects.push(goggle2);

			var maskGeom = new THREE.BoxGeometry(1.2, 0.6, 0.4);
			var maskMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
			var mask = new THREE.Mesh(maskGeom, maskMat);
			mask.position.set(sdata.x, 2.8, sdata.z);
			mask.castShadow = true;
			sceneRef.add(mask);
			allObjects.push(mask);

			s = s + 1;
		}
	}

	function buildsandbags() {
		var sbagPositions = [
			{ x: -25, z: -10 },
			{ x: 15, z: 40 },
			{ x: -40, z: 15 },
			{ x: 35, z: 20 }
		];

		var sb = 0;
		while (sb < sbagPositions.length) {
			var sbp = sbagPositions[sb];
			var bagRow = 0;
			while (bagRow < 3) {
				var bagCol = 0;
				while (bagCol < 4) {
					var bagGeom = new THREE.BoxGeometry(1.2, 0.5, 0.8);
					var bagMat = new THREE.MeshLambertMaterial({ color: 0xb8956a });
					var bagMesh = new THREE.Mesh(bagGeom, bagMat);
					bagMesh.position.set(
						sbp.x + bagCol * 1.3 - 1.95,
						0.25 + bagRow * 0.55,
						sbp.z
					);
					bagMesh.castShadow = true;
					bagMesh.receiveShadow = true;
					sceneRef.add(bagMesh);
					allObjects.push(bagMesh);
					bagCol = bagCol + 1;
				}
				bagRow = bagRow + 1;
			}
			sb = sb + 1;
		}
	}

	function buildcommtower() {
		commTower = new THREE.Group();
		var baseGeom = new THREE.BoxGeometry(2, 1, 2);
		var baseMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
		var baseMesh = new THREE.Mesh(baseGeom, baseMat);
		baseMesh.position.set(0, 0.5, 0);
		baseMesh.castShadow = true;
		commTower.add(baseMesh);

		var towerPoleGeom = new THREE.CylinderGeometry(0.25, 0.3, 18, 8);
		var poleMat = new THREE.MeshLambertMaterial({ color: 0x6b5d52 });
		var towerPole = new THREE.Mesh(towerPoleGeom, poleMat);
		towerPole.position.set(0, 9, 0);
		towerPole.castShadow = true;
		commTower.add(towerPole);

		var dish1 = new THREE.SphereGeometry(1.2, 12, 12);
		var dishMat = new THREE.MeshLambertMaterial({ color: 0xa0826d });
		var dish = new THREE.Mesh(dish1, dishMat);
		dish.position.set(0, 16, 0);
		dish.scale.set(1, 0.4, 1);
		dish.castShadow = true;
		commTower.add(dish);

		var aerialsData = [
			{ x: -1.5, z: 0 },
			{ x: 1.5, z: 0 },
			{ x: 0, z: -1.5 },
			{ x: 0, z: 1.5 }
		];

		var ae = 0;
		while (ae < aerialsData.length) {
			var aedata = aerialsData[ae];
			var aerialGeom = new THREE.CylinderGeometry(0.1, 0.1, 3.5, 4);
			var aerialMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
			var aerial = new THREE.Mesh(aerialGeom, aerialMat);
			aerial.position.set(aedata.x, 17.5, aedata.z);
			aerial.rotation.z = 0.4;
			aerial.castShadow = true;
			commTower.add(aerial);
			ae = ae + 1;
		}

		commTower.position.set(0, 0, 0);
		sceneRef.add(commTower);
		allObjects.push(commTower);
	}

	function buildperimeterdefense() {
		var wirePoints = [
			new THREE.Vector3(-60, 1.5, -60),
			new THREE.Vector3(60, 1.5, -60),
			new THREE.Vector3(60, 1.5, 60),
			new THREE.Vector3(-60, 1.5, 60),
			new THREE.Vector3(-60, 1.5, -60)
		];

		var wireGeom = new THREE.BufferGeometry();
		wireGeom.setFromPoints(wirePoints);
		var wireMat = new THREE.LineBasicMaterial({ color: 0x5a5a5a, linewidth: 2 });
		var wireMesh = new THREE.LineSegments(wireGeom, wireMat);
		sceneRef.add(wireMesh);
		allObjects.push(wireMesh);

		var postsData = [
			{ x: -60, z: -60 },
			{ x: 0, z: -60 },
			{ x: 60, z: -60 },
			{ x: -60, z: 0 },
			{ x: 60, z: 0 },
			{ x: -60, z: 60 },
			{ x: 0, z: 60 },
			{ x: 60, z: 60 }
		];

		var wp = 0;
		while (wp < postsData.length) {
			var wpdata = postsData[wp];
			var postGeom = new THREE.CylinderGeometry(0.2, 0.25, 2.5, 6);
			var postMat = new THREE.MeshLambertMaterial({ color: 0x6b5d52 });
			var postMesh = new THREE.Mesh(postGeom, postMat);
			postMesh.position.set(wpdata.x, 1.25, wpdata.z);
			postMesh.castShadow = true;
			sceneRef.add(postMesh);
			allObjects.push(postMesh);
			wp = wp + 1;
		}
	}

	function builddustcloud() {
		dustParticles = [];
		var particleCount = 35;
		var pi = 0;
		while (pi < particleCount) {
			var sphereGeom = new THREE.SphereGeometry(0.4, 6, 6);
			var dustMat = new THREE.MeshLambertMaterial({
				color: 0xd4a574,
				transparent: true,
				opacity: 0.4
			});
			var dustMesh = new THREE.Mesh(sphereGeom, dustMat);
			dustMesh.position.set(
				Math.random() * 100 - 50,
				Math.random() * 20 + 10,
				Math.random() * 100 - 50
			);
			dustMesh.scale.set(
				Math.random() * 1.5 + 0.8,
				Math.random() * 1.2 + 0.8,
				Math.random() * 1.5 + 0.8
			);
			sceneRef.add(dustMesh);
			dustParticles.push({
				mesh: dustMesh,
				vx: (Math.random() - 0.5) * 0.8,
				vy: (Math.random() - 0.5) * 0.6,
				vz: (Math.random() - 0.5) * 0.8
			});
			allObjects.push(dustMesh);
			pi = pi + 1;
		}
	}

	function update(delta) {
		var i = 0;
		while (i < dustParticles.length) {
			var particle = dustParticles[i];
			particle.mesh.position.x = particle.mesh.position.x + particle.vx * delta;
			particle.mesh.position.y = particle.mesh.position.y + particle.vy * delta;
			particle.mesh.position.z = particle.mesh.position.z + particle.vz * delta;

			if (particle.mesh.position.x > 60) {
				particle.mesh.position.x = -60;
				particle.vx = (Math.random() - 0.5) * 0.8;
			}
			if (particle.mesh.position.x < -60) {
				particle.mesh.position.x = 60;
				particle.vx = (Math.random() - 0.5) * 0.8;
			}
			if (particle.mesh.position.z > 60) {
				particle.mesh.position.z = -60;
				particle.vz = (Math.random() - 0.5) * 0.8;
			}
			if (particle.mesh.position.z < -60) {
				particle.mesh.position.z = 60;
				particle.vz = (Math.random() - 0.5) * 0.8;
			}

			particle.mesh.rotation.x = particle.mesh.rotation.x + 0.005;
			particle.mesh.rotation.y = particle.mesh.rotation.y + 0.008;

			i = i + 1;
		}

		if (commTower) {
			var swayAmount = Math.sin(Date.now() * 0.001) * 0.08;
			var tiltAmount = Math.cos(Date.now() * 0.0008) * 0.04;
			commTower.rotation.z = swayAmount;
			commTower.rotation.x = tiltAmount;
		}

		if (sandDune) {
			var driftX = Math.sin(Date.now() * 0.0005) * 0.15;
			sandDune.position.x = driftX;
			var driftZ = Math.cos(Date.now() * 0.0004) * 0.1;
			sandDune.position.z = -60 + driftZ;
		}
	}

	function reset() {
		var ro = 0;
		while (ro < allObjects.length) {
			sceneRef.remove(allObjects[ro]);
			ro = ro + 1;
		}
		allObjects = [];

		var rl = 0;
		while (rl < allLights.length) {
			sceneRef.remove(allLights[rl]);
			rl = rl + 1;
		}
		allLights = [];

		dustParticles = [];
		sceneRef = null;
		cameraRef = null;
		commTower = null;
		sandDune = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
