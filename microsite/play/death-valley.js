window.DeathValley = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var time = 0;
	var dustDevils = [];

	function buildTerrain() {
		var geometry = new THREE.BoxGeometry(400, 1, 400);
		var material = new THREE.MeshPhongMaterial({ color: 0xD4A574 });
		var terrain = new THREE.Mesh(geometry, material);
		terrain.position.y = -50;
		terrain.receiveShadow = true;
		scene.add(terrain);
		objects.push(terrain);
	}

	function buildDunes() {
		var positions = [
			{ x: -100, y: 0, z: -150, scale: 1.2 },
			{ x: 120, y: 0, z: -100, scale: 0.9 },
			{ x: -80, y: 0, z: 100, scale: 1.1 }
		];
		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var geometry = new THREE.ConeGeometry(50, 60, 32);
			var material = new THREE.MeshPhongMaterial({ color: 0xC9A961 });
			var dune = new THREE.Mesh(geometry, material);
			dune.position.set(pos.x, pos.y, pos.z);
			dune.scale.set(pos.scale, 1, pos.scale);
			dune.receiveShadow = true;
			scene.add(dune);
			objects.push(dune);
		}
	}

	function buildSkulls() {
		var positions = [
			{ x: -60, z: 40 },
			{ x: 80, z: -120 },
			{ x: 0, z: 60 }
		];
		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var geometry = new THREE.SphereGeometry(8, 16, 16);
			var material = new THREE.MeshPhongMaterial({ color: 0xF5F5DC });
			var skull = new THREE.Mesh(geometry, material);
			skull.position.set(pos.x, 5, pos.z);
			skull.scale.set(1.2, 1.4, 1);
			skull.receiveShadow = true;
			skull.castShadow = true;
			scene.add(skull);
			objects.push(skull);
		}
	}

	function buildBones() {
		var positions = [
			{ x: -50, z: 80 },
			{ x: 90, z: 10 },
			{ x: 20, z: -90 }
		];
		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var geometry = new THREE.CylinderGeometry(2, 2, 25, 8);
			var material = new THREE.MeshPhongMaterial({ color: 0xFFFACD });
			var bone = new THREE.Mesh(geometry, material);
			bone.position.set(pos.x, 3, pos.z);
			bone.rotation.z = Math.random() * Math.PI;
			bone.receiveShadow = true;
			scene.add(bone);
			objects.push(bone);
		}
	}

	function buildRustedVehicles() {
		var vehiclePos = [
			{ x: -150, z: -80 },
			{ x: 140, z: 120 }
		];
		for (var i = 0; i < vehiclePos.length; i++) {
			var vpos = vehiclePos[i];
			var bodyGeo = new THREE.BoxGeometry(30, 15, 50);
			var rustMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
			var body = new THREE.Mesh(bodyGeo, rustMat);
			body.position.set(vpos.x, 8, vpos.z);
			body.receiveShadow = true;
			body.castShadow = true;
			scene.add(body);
			objects.push(body);

			var wheelGeo = new THREE.CylinderGeometry(6, 6, 4, 16);
			var wheelMat = new THREE.MeshPhongMaterial({ color: 0x1C1C1C });
			var wheelPos = [
				{ x: -10, y: 2, z: -15 },
				{ x: 10, y: 2, z: -15 },
				{ x: -10, y: 2, z: 15 },
				{ x: 10, y: 2, z: 15 }
			];
			for (var w = 0; w < wheelPos.length; w++) {
				var wpos = wheelPos[w];
				var wheel = new THREE.Mesh(wheelGeo, wheelMat);
				wheel.position.set(vpos.x + wpos.x, vpos.y + wpos.y, vpos.z + wpos.z);
				wheel.rotation.z = Math.PI / 2;
				wheel.receiveShadow = true;
				scene.add(wheel);
				objects.push(wheel);
			}
		}
	}

	function buildRocks() {
		var rockData = [
			{ x: -180, y: 10, z: 80, scale: 1.5 },
			{ x: 160, y: 8, z: -140, scale: 1.3 },
			{ x: 30, y: 12, z: 150, scale: 1.8 },
			{ x: -120, y: 9, z: -60, scale: 1.2 }
		];
		for (var i = 0; i < rockData.length; i++) {
			var rdata = rockData[i];
			var geometry = new THREE.BoxGeometry(40, 35, 50);
			var material = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
			var rock = new THREE.Mesh(geometry, material);
			rock.position.set(rdata.x, rdata.y, rdata.z);
			rock.scale.set(rdata.scale, rdata.scale * 0.8, rdata.scale);
			rock.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.3);
			rock.receiveShadow = true;
			rock.castShadow = true;
			scene.add(rock);
			objects.push(rock);
		}
	}

	function buildTrenches() {
		var trenches = [
			{ x: -100, z: 0, length: 200 },
			{ x: 50, z: -80, length: 150 }
		];
		for (var i = 0; i < trenches.length; i++) {
			var t = trenches[i];
			var geometry = new THREE.BoxGeometry(15, 20, t.length);
			var material = new THREE.MeshPhongMaterial({ color: 0x6B5D4F });
			var trench = new THREE.Mesh(geometry, material);
			trench.position.set(t.x, -5, t.z);
			trench.receiveShadow = true;
			scene.add(trench);
			objects.push(trench);
		}
	}

	function buildTankParts() {
		var tankGeo = new THREE.CylinderGeometry(15, 18, 8, 8);
		var tankMat = new THREE.MeshPhongMaterial({ color: 0x556B2F });
		var positions = [
			{ x: -50, z: -150 },
			{ x: 100, z: 80 }
		];
		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var tank = new THREE.Mesh(tankGeo, tankMat);
			tank.position.set(pos.x, -20, pos.z);
			tank.receiveShadow = true;
			scene.add(tank);
			objects.push(tank);
		}
	}

	function createDustDevil() {
		var x = (Math.random() - 0.5) * 300;
		var z = (Math.random() - 0.5) * 300;
		var size = Math.random() * 20 + 15;
		var speed = Math.random() * 0.3 + 0.1;
		return {
			x: x,
			z: z,
			size: size,
			speed: speed,
			age: 0,
			lifetime: 8 + Math.random() * 4
		};
	}

	function updateDustDevil(devil, delta) {
		devil.age += delta;
		devil.x += Math.sin(devil.age * devil.speed) * 0.5;
		devil.z += Math.cos(devil.age * devil.speed) * 0.5;
		return devil.age < devil.lifetime;
	}

	function buildHeatHaze() {
		var geometry = new THREE.BoxGeometry(400, 80, 400);
		var material = new THREE.MeshPhongMaterial({
			color: 0xFFD700,
			transparent: true,
			opacity: 0.08,
			emissive: 0xFFA500
		});
		var haze = new THREE.Mesh(geometry, material);
		haze.position.y = 20;
		scene.add(haze);
		objects.push(haze);
		return haze;
	}

	var haze = null;

	function init(sceneParam, cameraParam) {
		scene = sceneParam;
		camera = cameraParam;
		time = 0;
		objects = [];
		dustDevils = [];

		buildTerrain();
		buildDunes();
		buildSkulls();
		buildBones();
		buildRustedVehicles();
		buildRocks();
		buildTrenches();
		buildTankParts();
		haze = buildHeatHaze();

		for (var i = 0; i < 3; i++) {
			dustDevils.push(createDustDevil());
		}
	}

	function update(delta) {
		time += delta;

		if (haze) {
			haze.position.y = 20 + Math.sin(time * 0.5) * 5;
			haze.scale.y = 1 + Math.sin(time * 0.3) * 0.1;
		}

		for (var i = 0; i < objects.length; i++) {
			var obj = objects[i];
			if (obj.userData && obj.userData.isHaze) continue;
			obj.position.y += Math.sin(time * 2 + i) * 0.001;
		}

		for (var d = dustDevils.length - 1; d >= 0; d--) {
			if (!updateDustDevil(dustDevils[d], delta)) {
				dustDevils.splice(d, 1);
			}
		}

		if (Math.random() < 0.02 && dustDevils.length < 4) {
			dustDevils.push(createDustDevil());
		}
	}

	function reset() {
		for (var i = objects.length - 1; i >= 0; i--) {
			scene.remove(objects[i]);
		}
		objects = [];
		dustDevils = [];
		haze = null;
		time = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
