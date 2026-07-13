window.EasdaleDock = (function() {
	'use strict';

	var objects = [];
	var lights = [];

	function createFlooded() {
		var material = new THREE.MeshLambertMaterial({ color: 0x445566 });
		var walls = [
			[0, 0, -8, 1, 4, 16],
			[0, 0, 8, 1, 4, 16],
			[-8, 0, 0, 16, 4, 1],
			[8, 0, 0, 16, 4, 1]
		];
		var i;
		for (i = 0; i < walls.length; i = i + 1) {
			var w = walls[i];
			var geometry = new THREE.BoxGeometry(w[2], w[3], w[4]);
			var mesh = new THREE.Mesh(geometry, material);
			mesh.position.x = w[0];
			mesh.position.y = w[1];
			mesh.position.z = w[2];
			objects.push(mesh);
		}
	}

	function createFerry() {
		var woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
		var trimMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEDD });

		var geometry = new THREE.BoxGeometry(12, 5, 8);
		var mesh = new THREE.Mesh(geometry, woodMaterial);
		mesh.position.set(0, 2.5, -15);
		objects.push(mesh);

		var trimGeom = new THREE.BoxGeometry(12, 0.4, 8);
		var trimMesh = new THREE.Mesh(trimGeom, trimMaterial);
		trimMesh.position.set(0, 5, -15);
		objects.push(trimMesh);
	}

	function createCottages() {
		var whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
		var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x1A1A33 });

		var positions = [
			[-12, 0, 5],
			[-12, 0, -5],
			[-18, 0, 0],
			[12, 0, 5],
			[12, 0, -5],
			[18, 0, 0]
		];

		var i;
		for (i = 0; i < positions.length; i = i + 1) {
			var pos = positions[i];

			var wallGeom = new THREE.BoxGeometry(4, 3, 4);
			var wallMesh = new THREE.Mesh(wallGeom, whiteMaterial);
			wallMesh.position.set(pos[0], pos[1] + 1.5, pos[2]);
			objects.push(wallMesh);

			var roofGeom = new THREE.ConeGeometry(2.5, 2, 4);
			var roofMesh = new THREE.Mesh(roofGeom, roofMaterial);
			roofMesh.position.set(pos[0], pos[1] + 4, pos[2]);
			objects.push(roofMesh);
		}
	}

	function createQuay() {
		var material = new THREE.MeshLambertMaterial({ color: 0x445566 });
		var geometry = new THREE.BoxGeometry(20, 1, 4);
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(0, 0, 14);
		objects.push(mesh);
	}

	function createPontoon() {
		var boxMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
		var bollardMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

		var positions = [
			[-8, -0.25, 10],
			[-4, -0.25, 10],
			[4, -0.25, 10],
			[8, -0.25, 10]
		];

		var i;
		for (i = 0; i < positions.length; i = i + 1) {
			var pos = positions[i];

			var pontoonGeom = new THREE.BoxGeometry(4, 0.5, 8);
			var pontoonMesh = new THREE.Mesh(pontoonGeom, boxMaterial);
			pontoonMesh.position.set(pos[0], pos[1], pos[2]);
			pontoonMesh.userData.bobOffset = 0;
			pontoonMesh.userData.baseY = pos[1];
			objects.push(pontoonMesh);

			var bollardGeom = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
			var bollardMesh = new THREE.Mesh(bollardGeom, bollardMaterial);
			bollardMesh.position.set(pos[0], pos[1] + 0.75, pos[2]);
			objects.push(bollardMesh);
		}
	}

	function createRescue() {
		var redMaterial = new THREE.MeshLambertMaterial({ color: 0xCC2222 });
		var whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

		var geometry = new THREE.BoxGeometry(6, 5, 6);
		var mesh = new THREE.Mesh(geometry, redMaterial);
		mesh.position.set(-18, 2.5, -12);
		objects.push(mesh);

		var crossHorz = new THREE.BoxGeometry(1.5, 0.3, 0.3);
		var crossH = new THREE.Mesh(crossHorz, whiteMaterial);
		crossH.position.set(-18, 4, -12 + 2.8);
		objects.push(crossH);

		var crossVert = new THREE.BoxGeometry(0.3, 1.5, 0.3);
		var crossV = new THREE.Mesh(crossVert, whiteMaterial);
		crossV.position.set(-18, 4, -12 + 2.8);
		objects.push(crossV);
	}

	function createCurling() {
		var material = new THREE.MeshLambertMaterial({ color: 0x888888 });

		var positions = [
			[15, 0.6, -8],
			[18, 0.6, -8],
			[16.5, 0.6, -6],
			[17.5, 0.6, -10]
		];

		var i;
		for (i = 0; i < positions.length; i = i + 1) {
			var pos = positions[i];
			var geometry = new THREE.SphereGeometry(0.4, 16, 16);
			var mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(pos[0], pos[1], pos[2]);
			objects.push(mesh);
		}
	}

	function createMemorial() {
		var slateMaterial = new THREE.MeshLambertMaterial({ color: 0x445566 });
		var whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

		var wallGeom = new THREE.BoxGeometry(10, 3, 1);
		var wallMesh = new THREE.Mesh(wallGeom, slateMaterial);
		wallMesh.position.set(0, 1.5, -22);
		objects.push(wallMesh);

		var letterPositions = [
			[-3, 2, -21.4],
			[-1.5, 2, -21.4],
			[0, 2, -21.4],
			[1.5, 2, -21.4],
			[3, 2, -21.4]
		];

		var i;
		for (i = 0; i < letterPositions.length; i = i + 1) {
			var pos = letterPositions[i];
			var letterGeom = new THREE.BoxGeometry(0.4, 0.6, 0.1);
			var letterMesh = new THREE.Mesh(letterGeom, whiteMaterial);
			letterMesh.position.set(pos[0], pos[1], pos[2]);
			objects.push(letterMesh);
		}
	}

	function createLight() {
		var pointLight = new THREE.PointLight(0xFFCC44, 1.2);
		pointLight.position.set(15, 8, 16);
		lights.push(pointLight);

		var ambientLight = new THREE.AmbientLight(0x334466, 0.5);
		lights.push(ambientLight);
	}

	function init(scene) {
		createFlooded();
		createFerry();
		createCottages();
		createQuay();
		createPontoon();
		createRescue();
		createCurling();
		createMemorial();
		createLight();

		var i;
		for (i = 0; i < objects.length; i = i + 1) {
			scene.add(objects[i]);
		}

		for (i = 0; i < lights.length; i = i + 1) {
			scene.add(lights[i]);
		}
	}

	function update(delta) {
		var i;
		for (i = 0; i < objects.length; i = i + 1) {
			var obj = objects[i];
			if (obj.userData && obj.userData.baseY !== undefined) {
				obj.userData.bobOffset = obj.userData.bobOffset + delta * 2;
				obj.position.y = obj.userData.baseY + Math.sin(obj.userData.bobOffset) * 0.2;
			}
		}
	}

	function reset(scene) {
		var i;
		for (i = 0; i < objects.length; i = i + 1) {
			scene.remove(objects[i]);
		}

		for (i = 0; i < lights.length; i = i + 1) {
			scene.remove(lights[i]);
		}

		objects = [];
		lights = [];
	}

	return {
		init: init,
		update: update,
		reset: reset,
		objects: objects,
		lights: lights
	};
}());
