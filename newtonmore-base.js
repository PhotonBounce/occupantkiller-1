window.NewtonmoreBase = (function() {
	'use strict';

	var BASE_X = 680;
	var BASE_Z = 790;
	var BASE_Y = 0;

	function createShintypitch() {
		var group = new THREE.Group();
		var material = new THREE.MeshLambertMaterial({ color: 0x4A7A2A });

		var wallN = new THREE.Mesh(new THREE.BoxGeometry(20, 1, 0.5), material);
		wallN.position.set(BASE_X, BASE_Y + 0.5, BASE_Z + 15);
		group.add(wallN);

		var wallS = new THREE.Mesh(new THREE.BoxGeometry(20, 1, 0.5), material);
		wallS.position.set(BASE_X, BASE_Y + 0.5, BASE_Z - 15);
		group.add(wallS);

		var wallE = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 30), material);
		wallE.position.set(BASE_X + 10, BASE_Y + 0.5, BASE_Z);
		group.add(wallE);

		var wallW = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 30), material);
		wallW.position.set(BASE_X - 10, BASE_Y + 0.5, BASE_Z);
		group.add(wallW);

		return group;
	}

	function createMuseum() {
		var group = new THREE.Group();
		var material = new THREE.MeshLambertMaterial({ color: 0x808080 });

		var building = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 3), material);
		building.position.set(BASE_X + 15, BASE_Y + 2, BASE_Z + 20);
		group.add(building);

		return group;
	}

	function createCheckpoint() {
		var group = new THREE.Group();

		var barrierMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
		var barrier = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 0.3), barrierMat);
		barrier.position.set(BASE_X + 25, BASE_Y + 1, BASE_Z - 10);
		group.add(barrier);

		var hutMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
		var hut = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 3), hutMat);
		hut.position.set(BASE_X + 28, BASE_Y + 1.5, BASE_Z - 18);
		group.add(hut);

		return group;
	}

	function createAssaultcourse() {
		var group = new THREE.Group();
		var obstacleMat = new THREE.MeshLambertMaterial({ color: 0x654321 });

		var obs1 = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 4), obstacleMat);
		obs1.position.set(BASE_X - 20, BASE_Y + 0.75, BASE_Z + 10);
		group.add(obs1);

		var obs2 = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 2), obstacleMat);
		obs2.position.set(BASE_X - 15, BASE_Y + 1, BASE_Z + 10);
		group.add(obs2);

		var obs3 = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 3), obstacleMat);
		obs3.position.set(BASE_X - 10, BASE_Y + 1.25, BASE_Z + 10);
		group.add(obs3);

		var obs4 = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 2), obstacleMat);
		obs4.position.set(BASE_X - 5, BASE_Y + 0.5, BASE_Z + 10);
		group.add(obs4);

		var obs5 = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 2), obstacleMat);
		obs5.position.set(BASE_X, BASE_Y + 1.5, BASE_Z + 10);
		group.add(obs5);

		var obs6 = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 3), obstacleMat);
		obs6.position.set(BASE_X + 5, BASE_Y + 0.75, BASE_Z + 10);
		group.add(obs6);

		return group;
	}

	function createShintystorage() {
		var group = new THREE.Group();
		var material = new THREE.MeshLambertMaterial({ color: 0x696969 });

		var shed = new THREE.Mesh(new THREE.BoxGeometry(12, 2.5, 1.5), material);
		shed.position.set(BASE_X - 30, BASE_Y + 1.25, BASE_Z + 5);
		group.add(shed);

		return group;
	}

	function createStable() {
		var group = new THREE.Group();
		var material = new THREE.MeshLambertMaterial({ color: 0x704020 });

		var garage = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 3), material);
		garage.position.set(BASE_X - 25, BASE_Y + 2, BASE_Z - 25);
		group.add(garage);

		return group;
	}

	function createObservation() {
		var group = new THREE.Group();

		var towerMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
		var tower = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 5, 16), towerMat);
		tower.position.set(BASE_X + 35, BASE_Y + 2.5, BASE_Z + 25);
		group.add(tower);

		var domeMat = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
		var dome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 8), domeMat);
		dome.position.set(BASE_X + 35, BASE_Y + 6, BASE_Z + 25);
		group.add(dome);

		return group;
	}

	function createEarthwork() {
		var group = new THREE.Group();
		var material = new THREE.MeshLambertMaterial({ color: 0x6B4423 });

		var berm = new THREE.Mesh(new THREE.BoxGeometry(50, 2, 1.5), material);
		berm.position.set(BASE_X, BASE_Y + 1, BASE_Z - 40);
		group.add(berm);

		return group;
	}

	function build() {
		var scene = new THREE.Group();

		var pitch = createShintypitch();
		scene.add(pitch);

		var museum = createMuseum();
		scene.add(museum);

		var checkpoint = createCheckpoint();
		scene.add(checkpoint);

		var assault = createAssaultcourse();
		scene.add(assault);

		var storage = createShintystorage();
		scene.add(storage);

		var stable = createStable();
		scene.add(stable);

		var observation = createObservation();
		scene.add(observation);

		var earthwork = createEarthwork();
		scene.add(earthwork);

		return scene;
	}

	return {
		build: build
	};
}());
