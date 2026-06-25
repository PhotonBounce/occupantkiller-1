window.LaphroaigDock = (function() {
	'use strict';

	var objects = [];
	var lights = [];

	function initialize(scene) {
		var distilleryGeo = new THREE.BoxGeometry(18, 7, 12);
		var distilleryMat = new THREE.MeshLambertMaterial({ color: 0xDDDDCC });
		var distillery = new THREE.Mesh(distilleryGeo, distilleryMat);
		distillery.position.set(0, 3.5, 0);
		distillery.castShadow = true;
		distillery.receiveShadow = true;
		scene.add(distillery);
		objects.push(distillery);

		var maltingGeo = new THREE.BoxGeometry(14, 4, 10);
		var maltingMat = new THREE.MeshLambertMaterial({ color: 0x999988 });
		var malting = new THREE.Mesh(maltingGeo, maltingMat);
		malting.position.set(12, 2, -5);
		malting.castShadow = true;
		malting.receiveShadow = true;
		scene.add(malting);
		objects.push(malting);

		var kiln1Geo = new THREE.ConeGeometry(3, 4, 8);
		var kiln1Mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var kiln1 = new THREE.Mesh(kiln1Geo, kiln1Mat);
		kiln1.position.set(-8, 2, 6);
		kiln1.castShadow = true;
		kiln1.receiveShadow = true;
		scene.add(kiln1);
		objects.push(kiln1);

		var kiln2Geo = new THREE.ConeGeometry(3, 4, 8);
		var kiln2Mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var kiln2 = new THREE.Mesh(kiln2Geo, kiln2Mat);
		kiln2.position.set(-8, 2, -6);
		kiln2.castShadow = true;
		kiln2.receiveShadow = true;
		scene.add(kiln2);
		objects.push(kiln2);

		var dockGeo = new THREE.BoxGeometry(25, 1, 4);
		var dockMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
		var dock = new THREE.Mesh(dockGeo, dockMat);
		dock.position.set(0, 0.5, 15);
		dock.castShadow = true;
		dock.receiveShadow = true;
		scene.add(dock);
		objects.push(dock);

		var boatGeo = new THREE.BoxGeometry(10, 2, 3);
		var boatMat = new THREE.MeshLambertMaterial({ color: 0x778877 });
		var boat = new THREE.Mesh(boatGeo, boatMat);
		boat.position.set(-3, 1.5, 15.5);
		boat.castShadow = true;
		boat.receiveShadow = true;
		scene.add(boat);
		objects.push(boat);

		var peat1Geo = new THREE.BoxGeometry(4, 5, 3);
		var peatMat = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });
		var peat1 = new THREE.Mesh(peat1Geo, peatMat);
		peat1.position.set(15, 2.5, 5);
		peat1.castShadow = true;
		peat1.receiveShadow = true;
		scene.add(peat1);
		objects.push(peat1);

		var peat2Geo = new THREE.BoxGeometry(3, 5, 4);
		var peat2 = new THREE.Mesh(peat2Geo, peatMat);
		peat2.position.set(15, 2.5, -3);
		peat2.castShadow = true;
		peat2.receiveShadow = true;
		scene.add(peat2);
		objects.push(peat2);

		var peat3Geo = new THREE.BoxGeometry(5, 4, 3);
		var peat3 = new THREE.Mesh(peat3Geo, peatMat);
		peat3.position.set(18, 2, 0);
		peat3.castShadow = true;
		peat3.receiveShadow = true;
		scene.add(peat3);
		objects.push(peat3);

		var post1Geo = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
		var postMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var post1 = new THREE.Mesh(post1Geo, postMat);
		post1.position.set(-12, 1, -10);
		post1.castShadow = true;
		post1.receiveShadow = true;
		scene.add(post1);
		objects.push(post1);

		var post2 = new THREE.Mesh(post1Geo, postMat);
		post2.position.set(12, 1, -10);
		post2.castShadow = true;
		post2.receiveShadow = true;
		scene.add(post2);
		objects.push(post2);

		var post3 = new THREE.Mesh(post1Geo, postMat);
		post3.position.set(12, 1, 10);
		post3.castShadow = true;
		post3.receiveShadow = true;
		scene.add(post3);
		objects.push(post3);

		var post4 = new THREE.Mesh(post1Geo, postMat);
		post4.position.set(-12, 1, 10);
		post4.castShadow = true;
		post4.receiveShadow = true;
		scene.add(post4);
		objects.push(post4);

		var wireGeom1 = new THREE.BufferGeometry();
		var wireVerts1 = new Float32Array([
			-12, 2, -10,
			-11, 2, -10,
			12, 2, -10,
			11, 2, -10
		]);
		wireGeom1.setAttribute('position', new THREE.BufferAttribute(wireVerts1, 3));
		var wireMat = new THREE.LineBasicMaterial({ color: 0x222222 });
		var wire1 = new THREE.LineSegments(wireGeom1, wireMat);
		scene.add(wire1);
		objects.push(wire1);

		var wireGeom2 = new THREE.BufferGeometry();
		var wireVerts2 = new Float32Array([
			12, 2, -10,
			12, 2, -9,
			12, 2, 10,
			12, 2, 9
		]);
		wireGeom2.setAttribute('position', new THREE.BufferAttribute(wireVerts2, 3));
		var wire2 = new THREE.LineSegments(wireGeom2, wireMat);
		scene.add(wire2);
		objects.push(wire2);

		var wireGeom3 = new THREE.BufferGeometry();
		var wireVerts3 = new Float32Array([
			12, 2, 10,
			11, 2, 10,
			-12, 2, 10,
			-11, 2, 10
		]);
		wireGeom3.setAttribute('position', new THREE.BufferAttribute(wireVerts3, 3));
		var wire3 = new THREE.LineSegments(wireGeom3, wireMat);
		scene.add(wire3);
		objects.push(wire3);

		var wireGeom4 = new THREE.BufferGeometry();
		var wireVerts4 = new Float32Array([
			-12, 2, 10,
			-12, 2, 9,
			-12, 2, -10,
			-12, 2, -9
		]);
		wireGeom4.setAttribute('position', new THREE.BufferAttribute(wireVerts4, 3));
		var wire4 = new THREE.LineSegments(wireGeom4, wireMat);
		scene.add(wire4);
		objects.push(wire4);

		var perch1Geo = new THREE.CylinderGeometry(0.08, 0.08, 3, 6);
		var perchMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
		var perch1 = new THREE.Mesh(perch1Geo, perchMat);
		perch1.position.set(-6, 1.5, 8);
		perch1.castShadow = true;
		perch1.receiveShadow = true;
		scene.add(perch1);
		objects.push(perch1);

		var bird1Geo = new THREE.SphereGeometry(0.3, 8, 8);
		var birdMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
		var bird1 = new THREE.Mesh(bird1Geo, birdMat);
		bird1.position.set(-6, 3.2, 8);
		bird1.castShadow = true;
		bird1.receiveShadow = true;
		scene.add(bird1);
		objects.push(bird1);

		var perch2 = new THREE.Mesh(perch1Geo, perchMat);
		perch2.position.set(6, 1.5, 8);
		perch2.castShadow = true;
		perch2.receiveShadow = true;
		scene.add(perch2);
		objects.push(perch2);

		var bird2 = new THREE.Mesh(bird1Geo, birdMat);
		bird2.position.set(6, 3.2, 8);
		bird2.castShadow = true;
		bird2.receiveShadow = true;
		scene.add(bird2);
		objects.push(bird2);

		var foghornGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 12);
		var foghornMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
		var foghorn = new THREE.Mesh(foghornGeo, foghornMat);
		foghorn.position.set(18, 4, 8);
		foghorn.castShadow = true;
		foghorn.receiveShadow = true;
		foghorn.userData.isFoghorn = true;
		scene.add(foghorn);
		objects.push(foghorn);

		var capGeo = new THREE.ConeGeometry(1.5, 2, 12);
		var capMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var cap = new THREE.Mesh(capGeo, capMat);
		cap.position.set(18, 9, 8);
		cap.castShadow = true;
		cap.receiveShadow = true;
		scene.add(cap);
		objects.push(cap);

		var dockLight = new THREE.PointLight(0xCCEEFF, 0.9);
		dockLight.position.set(0, 5, 15);
		dockLight.castShadow = true;
		scene.add(dockLight);
		lights.push(dockLight);
	}

	function update(delta) {
		var i = 0;
		var len = objects.length;
		while (i < len) {
			var obj = objects[i];
			if (obj.userData.isFoghorn) {
				obj.rotation.y += delta * 0.3;
			}
			i = i + 1;
		}
	}

	function reset(scene) {
		var i = 0;
		while (i < objects.length) {
			scene.remove(objects[i]);
			i = i + 1;
		}
		objects = [];

		var j = 0;
		while (j < lights.length) {
			scene.remove(lights[j]);
			j = j + 1;
		}
		lights = [];
	}

	return {
		initialize: initialize,
		update: update,
		reset: reset,
		objects: objects,
		lights: lights
	};
}());
