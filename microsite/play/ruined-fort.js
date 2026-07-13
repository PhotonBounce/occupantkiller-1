window.RuinedFort = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var meshes = [];
	var particles = [];
	var crows = [];
	var fires = [];
	var time = 0;

	var init = function(inputScene, inputCamera) {
		scene = inputScene;
		camera = inputCamera;
		meshes = [];
		particles = [];
		crows = [];
		fires = [];
		time = 0;

		buildTowerRemnants();
		buildShatteredWall();
		buildRubbleField();
		buildMilitaryPositions();
		buildSmolderingFires();
		buildAncientWell();
		buildCollapsedDrawbridge();
		buildModernMilitary();
		buildCourtyardPaving();
		buildBattlements();
		buildCrows();
		buildLighting();
	};

	var buildTowerRemnants = function() {
		var towerPositions = [
			{ x: -40, z: -50, height: 45, tilt: 0.3 },
			{ x: 45, z: -55, height: 38, tilt: 0.25 },
			{ x: -50, z: 40, height: 50, tilt: 0.35 }
		];

		var i;
		for (i = 0; i < towerPositions.length; i++) {
			var pos = towerPositions[i];
			var geometry = new THREE.BoxGeometry(12, pos.height, 12);
			var material = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
			var tower = new THREE.Mesh(geometry, material);
			tower.position.set(pos.x, pos.height / 2, pos.z);
			tower.rotation.z = pos.tilt;
			scene.add(tower);
			meshes.push(tower);

			var j;
			for (j = 0; j < 5; j++) {
				var debrisGeom = new THREE.BoxGeometry(8, 6, 8);
				var debrisMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
				var debris = new THREE.Mesh(debrisGeom, debrisMat);
				debris.position.set(
					pos.x + (Math.random() - 0.5) * 25,
					2 + Math.random() * 5,
					pos.z + (Math.random() - 0.5) * 25
				);
				debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
				scene.add(debris);
				meshes.push(debris);
			}
		}
	};

	var buildShatteredWall = function() {
		var wallSegments = [
			{ x: 0, z: -60, width: 30, height: 25, rotation: 0 },
			{ x: 35, z: -45, width: 28, height: 20, rotation: 0.15 },
			{ x: -35, z: -48, width: 25, height: 18, rotation: -0.1 }
		];

		var i;
		for (i = 0; i < wallSegments.length; i++) {
			var seg = wallSegments[i];
			var geometry = new THREE.BoxGeometry(seg.width, seg.height, 4);
			var material = new THREE.MeshLambertMaterial({ color: 0x6b5a4a });
			var wall = new THREE.Mesh(geometry, material);
			wall.position.set(seg.x, seg.height / 2, seg.z);
			wall.rotation.z = seg.rotation;
			scene.add(wall);
			meshes.push(wall);
		}

		var breachGeom = new THREE.BoxGeometry(15, 12, 4);
		var breachMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
		var breach = new THREE.Mesh(breachGeom, breachMat);
		breach.position.set(10, 6, -60);
		breach.rotation.z = 0.2;
		scene.add(breach);
		meshes.push(breach);
	};

	var buildRubbleField = function() {
		var i;
		for (i = 0; i < 40; i++) {
			var size = 3 + Math.random() * 8;
			var geometry = new THREE.BoxGeometry(size, size * 0.7, size);
			var color = 0x4a3a2a + Math.floor(Math.random() * 0x1a1a1a);
			var material = new THREE.MeshLambertMaterial({ color: color });
			var chunk = new THREE.Mesh(geometry, material);
			chunk.position.set(
				(Math.random() - 0.5) * 80,
				size * 0.35,
				(Math.random() - 0.5) * 80
			);
			chunk.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
			scene.add(chunk);
			meshes.push(chunk);
		}
	};

	var buildMilitaryPositions = function() {
		var positions = [
			{ x: -25, z: 20 },
			{ x: 20, z: 15 },
			{ x: -15, z: -25 }
		];

		var i;
		for (i = 0; i < positions.length; i++) {
			var pos = positions[i];

			var sandbagGeom = new THREE.BoxGeometry(12, 2.5, 4);
			var sandbagMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
			var sandbag = new THREE.Mesh(sandbagGeom, sandbagMat);
			sandbag.position.set(pos.x, 1.25, pos.z);
			scene.add(sandbag);
			meshes.push(sandbag);

			var tarpGeom = new THREE.BoxGeometry(10, 6, 10);
			var tarpMat = new THREE.MeshLambertMaterial({ color: 0x2a5a3a });
			var tarp = new THREE.Mesh(tarpGeom, tarpMat);
			tarp.position.set(pos.x + 8, 3, pos.z);
			tarp.rotation.x = 0.1;
			scene.add(tarp);
			meshes.push(tarp);
		}
	};

	var buildSmolderingFires = function() {
		var firePositions = [
			{ x: -20, z: 10 },
			{ x: 15, z: -10 },
			{ x: 5, z: 30 }
		];

		var i;
		for (i = 0; i < firePositions.length; i++) {
			var pos = firePositions[i];
			var fireObj = {
				position: { x: pos.x, y: 0.5, z: pos.z },
				intensity: Math.random() * 0.5 + 0.3,
				phase: Math.random() * Math.PI * 2,
				mesh: null
			};

			var emberGeom = new THREE.SphereGeometry(0.3, 4, 4);
			var emberMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
			var ember = new THREE.Mesh(emberGeom, emberMat);
			ember.position.set(pos.x, 0.5, pos.z);
			scene.add(ember);
			fireObj.mesh = ember;
			fires.push(fireObj);
			meshes.push(ember);

			var j;
			for (j = 0; j < 8; j++) {
				var pObj = {
					x: pos.x + (Math.random() - 0.5) * 2,
					y: 0.5 + Math.random() * 0.5,
					z: pos.z + (Math.random() - 0.5) * 2,
					vx: (Math.random() - 0.5) * 0.5,
					vy: 2 + Math.random() * 2,
					vz: (Math.random() - 0.5) * 0.5,
					life: 1,
					maxLife: 2,
					geometry: new THREE.SphereGeometry(0.2, 3, 3),
					material: new THREE.MeshBasicMaterial({ color: 0xaa4400 }),
					mesh: null
				};
				pObj.mesh = new THREE.Mesh(pObj.geometry, pObj.material);
				pObj.mesh.position.set(pObj.x, pObj.y, pObj.z);
				scene.add(pObj.mesh);
				particles.push(pObj);
			}
		}
	};

	var buildAncientWell = function() {
		var wellGeom = new THREE.CylinderGeometry(6, 7, 8, 12);
		var wellMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
		var well = new THREE.Mesh(wellGeom, wellMat);
		well.position.set(0, 4, 0);
		scene.add(well);
		meshes.push(well);

		var beamGeom = new THREE.BoxGeometry(14, 1.5, 1.5);
		var beamMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
		var beam = new THREE.Mesh(beamGeom, beamMat);
		beam.position.set(0, 8.5, 0);
		scene.add(beam);
		meshes.push(beam);

		var rope1Geom = new THREE.CylinderGeometry(0.15, 0.15, 6, 6);
		var ropeMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
		var rope1 = new THREE.Mesh(rope1Geom, ropeMat);
		rope1.position.set(-5, 5, 0);
		scene.add(rope1);
		meshes.push(rope1);

		var rope2 = new THREE.Mesh(rope1Geom, ropeMat);
		rope2.position.set(5, 5, 0);
		scene.add(rope2);
		meshes.push(rope2);
	};

	var buildCollapsedDrawbridge = function() {
		var plankPositions = [
			{ x: -10, y: 2, z: -8, rot: 0.3 },
			{ x: 0, y: 1, z: -10, rot: 0.25 },
			{ x: 8, y: 0.5, z: -8, rot: 0.4 },
			{ x: -5, y: 1.5, z: -5, rot: 0.15 }
		];

		var i;
		for (i = 0; i < plankPositions.length; i++) {
			var p = plankPositions[i];
			var plankGeom = new THREE.BoxGeometry(20, 1, 2);
			var plankMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
			var plank = new THREE.Mesh(plankGeom, plankMat);
			plank.position.set(p.x, p.y, p.z);
			plank.rotation.x = p.rot;
			scene.add(plank);
			meshes.push(plank);
		}

		var moatGeom = new THREE.BoxGeometry(30, 2, 20);
		var moatMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
		var moat = new THREE.Mesh(moatGeom, moatMat);
		moat.position.set(0, -1, -15);
		scene.add(moat);
		meshes.push(moat);
	};

	var buildModernMilitary = function() {
		var commGeom = new THREE.BoxGeometry(3, 5, 3);
		var commMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var comm = new THREE.Mesh(commGeom, commMat);
		comm.position.set(-30, 2.5, -35);
		scene.add(comm);
		meshes.push(comm);

		var antennaGeom = new THREE.CylinderGeometry(0.2, 0.2, 6, 4);
		var antennaMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var antenna = new THREE.Mesh(antennaGeom, antennaMat);
		antenna.position.set(-30, 8, -35);
		scene.add(antenna);
		meshes.push(antenna);

		var i;
		for (i = 0; i < 4; i++) {
			var crateGeom = new THREE.BoxGeometry(4, 3, 4);
			var crateMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
			var crate = new THREE.Mesh(crateGeom, crateMat);
			crate.position.set(25 + i * 6, 1.5, -30);
			scene.add(crate);
			meshes.push(crate);
		}
	};

	var buildCourtyardPaving = function() {
		var pavingGeom = new THREE.BoxGeometry(60, 0.5, 60);
		var pavingMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
		var paving = new THREE.Mesh(pavingGeom, pavingMat);
		paving.position.set(0, -0.25, 0);
		scene.add(paving);
		meshes.push(paving);

		var i;
		for (i = 0; i < 15; i++) {
			var tuftGeom = new THREE.BoxGeometry(2, 1.5, 2);
			var tuftMat = new THREE.MeshLambertMaterial({ color: 0x3a5a2a });
			var tuft = new THREE.Mesh(tuftGeom, tuftMat);
			tuft.position.set(
				(Math.random() - 0.5) * 60,
				0.75,
				(Math.random() - 0.5) * 60
			);
			scene.add(tuft);
			meshes.push(tuft);
		}
	};

	var buildBattlements = function() {
		var i;
		for (i = 0; i < 8; i++) {
			var angle = (i / 8) * Math.PI * 2;
			var x = Math.cos(angle) * 50;
			var z = Math.sin(angle) * 50;

			if (Math.random() > 0.4) {
				var merlon1Geom = new THREE.BoxGeometry(4, 6, 3);
				var merlonMat = new THREE.MeshLambertMaterial({ color: 0x6b5a4a });
				var merlon1 = new THREE.Mesh(merlon1Geom, merlonMat);
				merlon1.position.set(x, 3, z);
				merlon1.rotation.y = angle;
				scene.add(merlon1);
				meshes.push(merlon1);
			}

			if (Math.random() > 0.5) {
				var merlon2Geom = new THREE.BoxGeometry(3, 4, 3);
				var merlon2 = new THREE.Mesh(merlon2Geom, merlonMat);
				merlon2.position.set(x * 0.9, 2, z * 0.9);
				merlon2.rotation.y = angle;
				scene.add(merlon2);
				meshes.push(merlon2);
			}
		}
	};

	var buildCrows = function() {
		var roostPositions = [
			{ x: -45, y: 50, z: -55 },
			{ x: 45, y: 40, z: -50 },
			{ x: -50, y: 45, z: 35 },
			{ x: 30, y: 38, z: 25 }
		];

		var i;
		for (i = 0; i < roostPositions.length; i++) {
			var pos = roostPositions[i];
			var crowObj = {
				x: pos.x,
				y: pos.y,
				z: pos.z,
				wingPhase: Math.random() * Math.PI * 2,
				hopCounter: 0,
				hopInterval: 3 + Math.random() * 4,
				meshes: []
			};

			var bodyGeom = new THREE.BoxGeometry(0.8, 0.6, 0.4);
			var blackMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var body = new THREE.Mesh(bodyGeom, blackMat);
			body.position.set(pos.x, pos.y, pos.z);
			scene.add(body);
			crowObj.meshes.push(body);
			meshes.push(body);

			var headGeom = new THREE.SphereGeometry(0.25, 4, 4);
			var head = new THREE.Mesh(headGeom, blackMat);
			head.position.set(pos.x + 0.4, pos.y + 0.3, pos.z);
			scene.add(head);
			crowObj.meshes.push(head);
			meshes.push(head);

			var wingGeom = new THREE.BoxGeometry(0.3, 0.5, 1.2);
			var wing1 = new THREE.Mesh(wingGeom, blackMat);
			wing1.position.set(pos.x - 0.2, pos.y, pos.z);
			scene.add(wing1);
			crowObj.meshes.push(wing1);
			meshes.push(wing1);

			var wing2 = new THREE.Mesh(wingGeom, blackMat);
			wing2.position.set(pos.x + 0.2, pos.y, pos.z);
			scene.add(wing2);
			crowObj.meshes.push(wing2);
			meshes.push(wing2);

			crows.push(crowObj);
		}
	};

	var buildLighting = function() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(40, 50, 30);
		scene.add(directionalLight);

		var i;
		for (i = 0; i < fires.length; i++) {
			var pointLight = new THREE.PointLight(0xff6600, 1.5, 40);
			pointLight.position.set(fires[i].position.x, fires[i].position.y + 1, fires[i].position.z);
			scene.add(pointLight);
		}
	};

	var update = function(delta) {
		time += delta;

		var i;
		for (i = 0; i < fires.length; i++) {
			var fire = fires[i];
			fire.phase += delta * 3;
			fire.intensity = 0.3 + Math.sin(fire.phase) * 0.3;
			if (fire.mesh) {
				fire.mesh.material.emissive.setHex(Math.floor(0xff6600 * fire.intensity));
			}
		}

		for (i = particles.length - 1; i >= 0; i--) {
			var p = particles[i];
			p.life -= delta;
			if (p.life <= 0) {
				scene.remove(p.mesh);
				particles.splice(i, 1);
			} else {
				p.x += p.vx * delta;
				p.y += p.vy * delta;
				p.z += p.vz * delta;
				p.mesh.position.set(p.x, p.y, p.z);
				var alpha = p.life / p.maxLife;
				p.material.opacity = alpha;
			}
		}

		if (Math.random() < 0.3 * delta) {
			for (i = 0; i < fires.length; i++) {
				var firePos = fires[i].position;
				var newPObj = {
					x: firePos.x + (Math.random() - 0.5) * 1.5,
					y: firePos.y,
					z: firePos.z + (Math.random() - 0.5) * 1.5,
					vx: (Math.random() - 0.5) * 0.3,
					vy: 1 + Math.random() * 2,
					vz: (Math.random() - 0.5) * 0.3,
					life: 2,
					maxLife: 2,
					geometry: new THREE.SphereGeometry(0.15, 3, 3),
					material: new THREE.MeshBasicMaterial({ color: 0xaa6600 }),
					mesh: null
				};
				newPObj.mesh = new THREE.Mesh(newPObj.geometry, newPObj.material);
				newPObj.mesh.position.set(newPObj.x, newPObj.y, newPObj.z);
				scene.add(newPObj.mesh);
				particles.push(newPObj);
			}
		}

		for (i = 0; i < crows.length; i++) {
			var crow = crows[i];
			crow.wingPhase += delta * 5;
			crow.hopCounter += delta;

			if (crow.hopCounter > crow.hopInterval) {
				crow.hopCounter = 0;
				crow.hopInterval = 3 + Math.random() * 4;
			}

			var hopAmount = Math.max(0, Math.sin(crow.hopCounter / crow.hopInterval * Math.PI) * 0.3);
			var j;
			for (j = 0; j < crow.meshes.length; j++) {
				crow.meshes[j].position.y = crow.y + hopAmount + (j === 2 || j === 3 ? Math.sin(crow.wingPhase) * 0.2 : 0);
			}
		}
	};

	var reset = function() {
		var i;
		for (i = meshes.length - 1; i >= 0; i--) {
			scene.remove(meshes[i]);
		}
		for (i = particles.length - 1; i >= 0; i--) {
			scene.remove(particles[i].mesh);
		}
		meshes = [];
		particles = [];
		crows = [];
		fires = [];
		time = 0;
		init(scene, camera);
	};

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
