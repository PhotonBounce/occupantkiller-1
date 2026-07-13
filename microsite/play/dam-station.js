window.DamStation = (function() {
	'use strict';

	var scene = null;
	var meshes = [];
	var materials = {
		concrete: new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 }),
		steel: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.8 }),
		rust: new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 }),
		cable: new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 })
	};

	function buildDamWall() {
		var geom = new THREE.BoxGeometry(200, 80, 20);
		var mesh = new THREE.Mesh(geom, materials.concrete);
		mesh.position.set(0, 40, -50);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		scene.add(mesh);
		meshes.push(mesh);

		var spillGeom = new THREE.BoxGeometry(190, 15, 8);
		for (var i = 0; i < 4; i++) {
			var spill = new THREE.Mesh(spillGeom, materials.rust);
			spill.position.set(-70 + i * 50, 20 + i * 5, -48);
			spill.castShadow = true;
			scene.add(spill);
			meshes.push(spill);
		}
	}

	function buildTurbineHall() {
		var hallGeom = new THREE.BoxGeometry(60, 40, 120);
		var hall = new THREE.Mesh(hallGeom, materials.concrete);
		hall.position.set(80, 20, 0);
		hall.castShadow = true;
		hall.receiveShadow = true;
		scene.add(hall);
		meshes.push(hall);

		for (var i = 0; i < 3; i++) {
			var turbGeom = new THREE.CylinderGeometry(8, 8, 110, 16);
			var turb = new THREE.Mesh(turbGeom, materials.steel);
			turb.rotation.z = Math.PI / 2;
			turb.position.set(70 + i * 12, 15, 0);
			turb.castShadow = true;
			scene.add(turb);
			meshes.push(turb);
		}
	}

	function buildTransmissionTowers() {
		for (var i = 0; i < 4; i++) {
			var towerGeom = new THREE.BoxGeometry(6, 90, 6);
			var tower = new THREE.Mesh(towerGeom, materials.steel);
			tower.position.set(-80 + i * 60, 45, 100);
			tower.castShadow = true;
			scene.add(tower);
			meshes.push(tower);

			if (i < 3) {
				var points = [
					new THREE.Vector3(-80 + i * 60, 80, 100),
					new THREE.Vector3(-80 + (i + 1) * 60, 80, 100)
				];
				var cableGeom = new THREE.BufferGeometry().setFromPoints(points);
				var cable = new THREE.LineSegments(cableGeom, materials.cable);
				scene.add(cable);
				meshes.push(cable);
			}
		}
	}

	function buildControlRoom() {
		var roomGeom = new THREE.BoxGeometry(40, 25, 30);
		var room = new THREE.Mesh(roomGeom, materials.concrete);
		room.position.set(0, 80, -80);
		room.castShadow = true;
		scene.add(room);
		meshes.push(room);

		var antennaGeom = new THREE.CylinderGeometry(2, 2, 40, 8);
		var antenna = new THREE.Mesh(antennaGeom, materials.steel);
		antenna.position.set(15, 125, -80);
		antenna.castShadow = true;
		scene.add(antenna);
		meshes.push(antenna);
	}

	function buildAccessCrane() {
		var beamGeom = new THREE.BoxGeometry(80, 8, 8);
		var beam = new THREE.Mesh(beamGeom, materials.steel);
		beam.position.set(-50, 60, 50);
		beam.castShadow = true;
		scene.add(beam);
		meshes.push(beam);

		for (var i = 0; i < 2; i++) {
			var wheelGeom = new THREE.CylinderGeometry(6, 6, 4, 16);
			var wheel = new THREE.Mesh(wheelGeom, materials.steel);
			wheel.rotation.z = Math.PI / 2;
			wheel.position.set(-70 + i * 80, 45, 50);
			wheel.castShadow = true;
			scene.add(wheel);
			meshes.push(wheel);
		}

		var railGeom = new THREE.BufferGeometry().setFromPoints([
			new THREE.Vector3(-90, 46, 50),
			new THREE.Vector3(90, 46, 50)
		]);
		var rail = new THREE.LineSegments(railGeom, materials.cable);
		scene.add(rail);
		meshes.push(rail);
	}

	function buildSecurityCheckpoint() {
		var hutGeom = new THREE.BoxGeometry(25, 20, 20);
		var hut = new THREE.Mesh(hutGeom, materials.concrete);
		hut.position.set(-120, 10, 0);
		hut.castShadow = true;
		scene.add(hut);
		meshes.push(hut);

		for (var i = 0; i < 5; i++) {
			var bollardGeom = new THREE.CylinderGeometry(2, 2, 8, 16);
			var bollard = new THREE.Mesh(bollardGeom, materials.rust);
			bollard.position.set(-110 + i * 5, 4, -15 + i * 2);
			bollard.castShadow = true;
			scene.add(bollard);
			meshes.push(bollard);
		}
	}

	function buildCatwalks() {
		for (var i = 0; i < 3; i++) {
			var walkGeom = new THREE.BoxGeometry(150, 3, 4);
			var walk = new THREE.Mesh(walkGeom, materials.steel);
			walk.position.set(0, 35 + i * 15, 70 + i * 10);
			walk.castShadow = true;
			scene.add(walk);
			meshes.push(walk);

			var railGeom = new THREE.BufferGeometry().setFromPoints([
				new THREE.Vector3(-75, 38 + i * 15, 70 + i * 10),
				new THREE.Vector3(75, 38 + i * 15, 70 + i * 10)
			]);
			var rail = new THREE.LineSegments(railGeom, materials.cable);
			scene.add(rail);
			meshes.push(rail);
		}
	}

	function buildWaterIntake() {
		for (var i = 0; i < 4; i++) {
			var pipeGeom = new THREE.CylinderGeometry(5, 5, 60, 16);
			var pipe = new THREE.Mesh(pipeGeom, materials.rust);
			pipe.rotation.x = Math.PI / 3;
			pipe.position.set(-60 + i * 40, 10, -120 + i * 15);
			pipe.castShadow = true;
			scene.add(pipe);
			meshes.push(pipe);
		}
	}

	function buildAuxiliaryStructures() {
		var vent1Geom = new THREE.ConeGeometry(3, 10, 12);
		var vent1 = new THREE.Mesh(vent1Geom, materials.steel);
		vent1.position.set(50, 65, -50);
		vent1.castShadow = true;
		scene.add(vent1);
		meshes.push(vent1);

		var vent2Geom = new THREE.ConeGeometry(3, 10, 12);
		var vent2 = new THREE.Mesh(vent2Geom, materials.steel);
		vent2.position.set(-50, 65, -50);
		vent2.castShadow = true;
		scene.add(vent2);
		meshes.push(vent2);

		var supportGeom = new THREE.BoxGeometry(4, 35, 4);
		for (var i = 0; i < 6; i++) {
			var support = new THREE.Mesh(supportGeom, materials.steel);
			support.position.set(-90 + i * 35, 17.5, -30);
			support.castShadow = true;
			scene.add(support);
			meshes.push(support);
		}
	}

	function init(initScene, camera) {
		scene = initScene;
		meshes = [];

		buildDamWall();
		buildTurbineHall();
		buildTransmissionTowers();
		buildControlRoom();
		buildAccessCrane();
		buildSecurityCheckpoint();
		buildCatwalks();
		buildWaterIntake();
		buildAuxiliaryStructures();

		camera.position.set(0, 30, 150);
		camera.lookAt(0, 40, 0);
	}

	function update(delta) {
		for (var i = 0; i < meshes.length; i++) {
			if (meshes[i].rotation) {
				if (i % 7 === 0) {
					meshes[i].rotation.y += delta * 0.2;
				}
			}
		}
	}

	function reset() {
		for (var i = meshes.length - 1; i >= 0; i--) {
			scene.remove(meshes[i]);
		}
		meshes = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
