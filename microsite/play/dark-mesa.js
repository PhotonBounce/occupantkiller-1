window.DarkMesa = (function() {
	'use strict';
	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var radarDishes = [];
	var runwayLights = [];
	var radarRotation = 0;
	var strobePhase = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		radarDishes = [];
		runwayLights = [];
		radarRotation = 0;
		strobePhase = 0;
		buildMesaTerrain();
		buildResearchBase();
		buildDefenses();
		buildCanyonEdge();
		buildLaboratories();
		buildAirstrip();
		buildRadarStation();
		setupLighting();
	}

	function buildMesaTerrain() {
		var mesaMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
		var mainMesa = new THREE.Mesh(new THREE.BoxGeometry(800, 60, 800), mesaMaterial);
		mainMesa.position.y = -30;
		mainMesa.castShadow = true;
		mainMesa.receiveShadow = true;
		scene.add(mainMesa);
		objects.push(mainMesa);

		var westCliff = new THREE.Mesh(new THREE.BoxGeometry(40, 200, 800), mesaMaterial);
		westCliff.position.set(-420, -100, 0);
		westCliff.castShadow = true;
		scene.add(westCliff);
		objects.push(westCliff);

		var eastCliff = new THREE.Mesh(new THREE.BoxGeometry(40, 200, 800), mesaMaterial);
		eastCliff.position.set(420, -100, 0);
		eastCliff.castShadow = true;
		scene.add(eastCliff);
		objects.push(eastCliff);

		var northCliff = new THREE.Mesh(new THREE.BoxGeometry(800, 200, 40), mesaMaterial);
		northCliff.position.set(0, -100, -420);
		northCliff.castShadow = true;
		scene.add(northCliff);
		objects.push(northCliff);

		var southCliff = new THREE.Mesh(new THREE.BoxGeometry(800, 200, 40), mesaMaterial);
		southCliff.position.set(0, -100, 420);
		southCliff.castShadow = true;
		scene.add(southCliff);
		objects.push(southCliff);

		var sandPerimeter1 = new THREE.Mesh(new THREE.BoxGeometry(850, 5, 850), new THREE.MeshLambertMaterial({ color: 0xC2B280 }));
		sandPerimeter1.position.set(0, -31, 0);
		scene.add(sandPerimeter1);
		objects.push(sandPerimeter1);

		var sandPerimeter2 = new THREE.Mesh(new THREE.BoxGeometry(900, 3, 900), new THREE.MeshLambertMaterial({ color: 0xD2C2A0 }));
		sandPerimeter2.position.set(0, -32, 0);
		scene.add(sandPerimeter2);
		objects.push(sandPerimeter2);
	}

	function buildResearchBase() {
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var mainBuilding = new THREE.Mesh(new THREE.BoxGeometry(300, 45, 120), baseMaterial);
		mainBuilding.position.set(-80, 5, 0);
		mainBuilding.castShadow = true;
		mainBuilding.receiveShadow = true;
		scene.add(mainBuilding);
		objects.push(mainBuilding);

		var roofStructure = new THREE.Mesh(new THREE.BoxGeometry(310, 8, 130), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
		roofStructure.position.set(-80, 51, 0);
		roofStructure.castShadow = true;
		scene.add(roofStructure);
		objects.push(roofStructure);

		for (var i = 0; i < 6; i++) {
			var column = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 50, 8), baseMaterial);
			column.position.set(-160 + i * 60, 10, -50);
			column.castShadow = true;
			scene.add(column);
			objects.push(column);
		}

		for (var i = 0; i < 6; i++) {
			var column = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 50, 8), baseMaterial);
			column.position.set(-160 + i * 60, 10, 50);
			column.castShadow = true;
			scene.add(column);
			objects.push(column);
		}

		var bunkerRamp = new THREE.Mesh(new THREE.BoxGeometry(120, 40, 80), baseMaterial);
		bunkerRamp.rotation.z = Math.PI / 12;
		bunkerRamp.position.set(150, -10, 0);
		bunkerRamp.castShadow = true;
		scene.add(bunkerRamp);
		objects.push(bunkerRamp);

		var bunkerEntrance = new THREE.Mesh(new THREE.BoxGeometry(100, 60, 70), baseMaterial);
		bunkerEntrance.position.set(220, -30, 0);
		bunkerEntrance.castShadow = true;
		scene.add(bunkerEntrance);
		objects.push(bunkerEntrance);

		var ventStack1 = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 40, 8), baseMaterial);
		ventStack1.position.set(-100, 35, 40);
		ventStack1.castShadow = true;
		scene.add(ventStack1);
		objects.push(ventStack1);

		var ventStack2 = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 40, 8), baseMaterial);
		ventStack2.position.set(-40, 35, 40);
		ventStack2.castShadow = true;
		scene.add(ventStack2);
		objects.push(ventStack2);

		var ventStack3 = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 40, 8), baseMaterial);
		ventStack3.position.set(20, 35, 40);
		ventStack3.castShadow = true;
		scene.add(ventStack3);
		objects.push(ventStack3);

		var ventStack4 = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 40, 8), baseMaterial);
		ventStack4.position.set(80, 35, 40);
		ventStack4.castShadow = true;
		scene.add(ventStack4);
		objects.push(ventStack4);
	}

	function buildDefenses() {
		var fenceMaterial = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
		var postMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });

		for (var i = 0; i < 20; i++) {
			var post = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 50, 6), postMaterial);
			post.position.set(-300 + i * 35, 10, -380);
			post.castShadow = true;
			scene.add(post);
			objects.push(post);
		}

		for (var i = 0; i < 20; i++) {
			var post = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 50, 6), postMaterial);
			post.position.set(-300 + i * 35, 10, 380);
			post.castShadow = true;
			scene.add(post);
			objects.push(post);
		}

		for (var i = 0; i < 14; i++) {
			var post = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 50, 6), postMaterial);
			post.position.set(-380, 10, -350 + i * 50);
			post.castShadow = true;
			scene.add(post);
			objects.push(post);
		}

		for (var i = 0; i < 14; i++) {
			var post = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 50, 6), postMaterial);
			post.position.set(380, 10, -350 + i * 50);
			post.castShadow = true;
			scene.add(post);
			objects.push(post);
		}

		var watchTowerNW = new THREE.Mesh(new THREE.BoxGeometry(40, 60, 40), postMaterial);
		watchTowerNW.position.set(-350, 55, -350);
		watchTowerNW.castShadow = true;
		scene.add(watchTowerNW);
		objects.push(watchTowerNW);

		var stiltNW = new THREE.Mesh(new THREE.BoxGeometry(50, 40, 50), postMaterial);
		stiltNW.position.set(-350, 10, -350);
		scene.add(stiltNW);
		objects.push(stiltNW);

		var watchTowerNE = new THREE.Mesh(new THREE.BoxGeometry(40, 60, 40), postMaterial);
		watchTowerNE.position.set(350, 55, -350);
		watchTowerNE.castShadow = true;
		scene.add(watchTowerNE);
		objects.push(watchTowerNE);

		var stiltNE = new THREE.Mesh(new THREE.BoxGeometry(50, 40, 50), postMaterial);
		stiltNE.position.set(350, 10, -350);
		scene.add(stiltNE);
		objects.push(stiltNE);

		var watchTowerSW = new THREE.Mesh(new THREE.BoxGeometry(40, 60, 40), postMaterial);
		watchTowerSW.position.set(-350, 55, 350);
		watchTowerSW.castShadow = true;
		scene.add(watchTowerSW);
		objects.push(watchTowerSW);

		var stiltSW = new THREE.Mesh(new THREE.BoxGeometry(50, 40, 50), postMaterial);
		stiltSW.position.set(-350, 10, 350);
		scene.add(stiltSW);
		objects.push(stiltSW);

		var watchTowerSE = new THREE.Mesh(new THREE.BoxGeometry(40, 60, 40), postMaterial);
		watchTowerSE.position.set(350, 55, 350);
		watchTowerSE.castShadow = true;
		scene.add(watchTowerSE);
		objects.push(watchTowerSE);

		var stiltSE = new THREE.Mesh(new THREE.BoxGeometry(50, 40, 50), postMaterial);
		stiltSE.position.set(350, 10, 350);
		scene.add(stiltSE);
		objects.push(stiltSE);
	}

	function buildCanyonEdge() {
		var canyonMaterial = new THREE.MeshLambertMaterial({ color: 0x704020 });
		for (var i = 0; i < 8; i++) {
			var rockFormation = new THREE.Mesh(new THREE.BoxGeometry(80, 120 + i * 10, 60), canyonMaterial);
			rockFormation.position.set(-300 - i * 40, -60 - i * 20, -350);
			rockFormation.castShadow = true;
			scene.add(rockFormation);
			objects.push(rockFormation);
		}

		for (var i = 0; i < 8; i++) {
			var rockFormation = new THREE.Mesh(new THREE.BoxGeometry(80, 120 + i * 10, 60), canyonMaterial);
			rockFormation.position.set(300 + i * 40, -60 - i * 20, -350);
			rockFormation.castShadow = true;
			scene.add(rockFormation);
			objects.push(rockFormation);
		}
	}

	function buildLaboratories() {
		var labMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
		var lab1 = new THREE.Mesh(new THREE.BoxGeometry(120, 40, 80), labMaterial);
		lab1.position.set(-180, 5, -150);
		lab1.castShadow = true;
		lab1.receiveShadow = true;
		scene.add(lab1);
		objects.push(lab1);

		var lab1roof = new THREE.Mesh(new THREE.BoxGeometry(130, 6, 90), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
		lab1roof.position.set(-180, 50, -150);
		lab1roof.castShadow = true;
		scene.add(lab1roof);
		objects.push(lab1roof);

		var lab2 = new THREE.Mesh(new THREE.BoxGeometry(120, 40, 80), labMaterial);
		lab2.position.set(-180, 5, 150);
		lab2.castShadow = true;
		lab2.receiveShadow = true;
		scene.add(lab2);
		objects.push(lab2);

		var lab2roof = new THREE.Mesh(new THREE.BoxGeometry(130, 6, 90), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
		lab2roof.position.set(-180, 50, 150);
		lab2roof.castShadow = true;
		scene.add(lab2roof);
		objects.push(lab2roof);

		var lab3 = new THREE.Mesh(new THREE.BoxGeometry(100, 50, 100), labMaterial);
		lab3.position.set(80, 5, -120);
		lab3.castShadow = true;
		lab3.receiveShadow = true;
		scene.add(lab3);
		objects.push(lab3);

		var lab3roof = new THREE.Mesh(new THREE.BoxGeometry(110, 6, 110), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
		lab3roof.position.set(80, 58, -120);
		lab3roof.castShadow = true;
		scene.add(lab3roof);
		objects.push(lab3roof);

		var lab4 = new THREE.Mesh(new THREE.BoxGeometry(100, 50, 100), labMaterial);
		lab4.position.set(80, 5, 120);
		lab4.castShadow = true;
		lab4.receiveShadow = true;
		scene.add(lab4);
		objects.push(lab4);

		var lab4roof = new THREE.Mesh(new THREE.BoxGeometry(110, 6, 110), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
		lab4roof.position.set(80, 58, 120);
		lab4roof.castShadow = true;
		scene.add(lab4roof);
		objects.push(lab4roof);

		for (var i = 0; i < 4; i++) {
			var chimney = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 35, 8), labMaterial);
			chimney.position.set(-180, 35, -150 + i * 40 - 60);
			chimney.castShadow = true;
			scene.add(chimney);
			objects.push(chimney);
		}

		for (var i = 0; i < 4; i++) {
			var chimney = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 35, 8), labMaterial);
			chimney.position.set(-180, 35, 150 + i * 40 - 60);
			chimney.castShadow = true;
			scene.add(chimney);
			objects.push(chimney);
		}
	}

	function buildAirstrip() {
		var tarmacMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
		var runway = new THREE.Mesh(new THREE.BoxGeometry(600, 3, 80), tarmacMaterial);
		runway.position.set(200, -0.5, 200);
		runway.receiveShadow = true;
		scene.add(runway);
		objects.push(runway);

		var stripLight1 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1, 6), new THREE.MeshLambertMaterial({ color: 0xffff00 }));
		stripLight1.position.set(200, 1, 190);
		stripLight1.receiveShadow = true;
		scene.add(stripLight1);
		objects.push(stripLight1);
		runwayLights.push(stripLight1);

		var stripLight2 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1, 6), new THREE.MeshLambertMaterial({ color: 0xffff00 }));
		stripLight2.position.set(200, 1, 210);
		stripLight2.receiveShadow = true;
		scene.add(stripLight2);
		objects.push(stripLight2);
		runwayLights.push(stripLight2);

		for (var i = -280; i <= 280; i += 40) {
			var marker = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 50), new THREE.MeshLambertMaterial({ color: 0xffffff }));
			marker.position.set(200 + i, 2, 200);
			scene.add(marker);
			objects.push(marker);
		}

		var hangar1 = new THREE.Mesh(new THREE.BoxGeometry(200, 80, 150), new THREE.MeshLambertMaterial({ color: 0x404040 }));
		hangar1.position.set(200, 25, 50);
		hangar1.castShadow = true;
		hangar1.receiveShadow = true;
		scene.add(hangar1);
		objects.push(hangar1);

		var hangar1roof = new THREE.Mesh(new THREE.BoxGeometry(210, 12, 160), new THREE.MeshLambertMaterial({ color: 0x202020 }));
		hangar1roof.position.set(200, 87, 50);
		hangar1roof.castShadow = true;
		scene.add(hangar1roof);
		objects.push(hangar1roof);

		for (var i = 0; i < 4; i++) {
			var arch = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 8, 16), new THREE.MeshLambertMaterial({ color: 0x303030 }));
			arch.position.set(200 - 50 + i * 40, 60, 50);
			arch.castShadow = true;
			scene.add(arch);
			objects.push(arch);
		}

		var hangar2 = new THREE.Mesh(new THREE.BoxGeometry(180, 70, 130), new THREE.MeshLambertMaterial({ color: 0x404040 }));
		hangar2.position.set(200, 20, -50);
		hangar2.castShadow = true;
		hangar2.receiveShadow = true;
		scene.add(hangar2);
		objects.push(hangar2);

		var hangar2roof = new THREE.Mesh(new THREE.BoxGeometry(190, 10, 140), new THREE.MeshLambertMaterial({ color: 0x202020 }));
		hangar2roof.position.set(200, 78, -50);
		hangar2roof.castShadow = true;
		scene.add(hangar2roof);
		objects.push(hangar2roof);

		var fuelTank = new THREE.Mesh(new THREE.CylinderGeometry(25, 25, 60, 16), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
		fuelTank.position.set(120, 35, 120);
		fuelTank.castShadow = true;
		scene.add(fuelTank);
		objects.push(fuelTank);

		var fuelSupport = new THREE.Mesh(new THREE.BoxGeometry(50, 20, 50), new THREE.MeshLambertMaterial({ color: 0x303030 }));
		fuelSupport.position.set(120, 5, 120);
		scene.add(fuelSupport);
		objects.push(fuelSupport);
	}

	function buildRadarStation() {
		var radarMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x303030 });

		for (var i = 0; i < 6; i++) {
			var pedestal = new THREE.Mesh(new THREE.CylinderGeometry(8, 12, 40, 8), radarMaterial);
			pedestal.position.set(-200 + i * 50, 15, -220);
			pedestal.castShadow = true;
			scene.add(pedestal);
			objects.push(pedestal);

			var dish = new THREE.Mesh(new THREE.BoxGeometry(45, 3, 45), new THREE.MeshLambertMaterial({ color: 0x555555 }));
			dish.position.set(-200 + i * 50, 50, -220);
			dish.castShadow = true;
			scene.add(dish);
			objects.push(dish);
			radarDishes.push(dish);
		}

		var radarControlRoom = new THREE.Mesh(new THREE.BoxGeometry(100, 40, 60), baseMaterial);
		radarControlRoom.position.set(-200, 5, -260);
		radarControlRoom.castShadow = true;
		radarControlRoom.receiveShadow = true;
		scene.add(radarControlRoom);
		objects.push(radarControlRoom);

		var radarRoof = new THREE.Mesh(new THREE.BoxGeometry(110, 6, 70), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
		radarRoof.position.set(-200, 49, -260);
		radarRoof.castShadow = true;
		scene.add(radarRoof);
		objects.push(radarRoof);

		var satDishPole = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 50, 8), radarMaterial);
		satDishPole.position.set(280, 20, -280);
		satDishPole.castShadow = true;
		scene.add(satDishPole);
		objects.push(satDishPole);

		var satDish = new THREE.Mesh(new THREE.BoxGeometry(70, 4, 70), new THREE.MeshLambertMaterial({ color: 0x666666 }));
		satDish.rotation.x = Math.PI / 6;
		satDish.position.set(280, 55, -280);
		satDish.castShadow = true;
		scene.add(satDish);
		objects.push(satDish);
		radarDishes.push(satDish);

		var powerPlant = new THREE.Mesh(new THREE.BoxGeometry(120, 45, 90), baseMaterial);
		powerPlant.position.set(280, 10, -200);
		powerPlant.castShadow = true;
		powerPlant.receiveShadow = true;
		scene.add(powerPlant);
		objects.push(powerPlant);

		var powerRoof = new THREE.Mesh(new THREE.BoxGeometry(130, 8, 100), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
		powerRoof.position.set(280, 53, -200);
		powerRoof.castShadow = true;
		scene.add(powerRoof);
		objects.push(powerRoof);

		for (var i = 0; i < 4; i++) {
			var coolingTower = new THREE.Mesh(new THREE.CylinderGeometry(12, 16, 50, 8), baseMaterial);
			coolingTower.position.set(320 + i * 30, 20, -150);
			coolingTower.castShadow = true;
			scene.add(coolingTower);
			objects.push(coolingTower);
		}

		var heliPad = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 2, 32), new THREE.MeshLambertMaterial({ color: 0x202020 }));
		heliPad.position.set(100, 1, -280);
		heliPad.receiveShadow = true;
		scene.add(heliPad);
		objects.push(heliPad);

		var heliMarkerH1 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 30), new THREE.MeshLambertMaterial({ color: 0xffffff }));
		heliMarkerH1.position.set(100, 2, -280);
		scene.add(heliMarkerH1);
		objects.push(heliMarkerH1);

		var heliMarkerH2 = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
		heliMarkerH2.position.set(100, 2, -280);
		scene.add(heliMarkerH2);
		objects.push(heliMarkerH2);

		var checkpoint = new THREE.Mesh(new THREE.BoxGeometry(80, 30, 40), baseMaterial);
		checkpoint.position.set(280, 10, 280);
		checkpoint.castShadow = true;
		checkpoint.receiveShadow = true;
		scene.add(checkpoint);
		objects.push(checkpoint);

		var checkpointRoof = new THREE.Mesh(new THREE.BoxGeometry(90, 6, 50), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
		checkpointRoof.position.set(280, 39, 280);
		checkpointRoof.castShadow = true;
		scene.add(checkpointRoof);
		objects.push(checkpointRoof);

		var gateBarrier1 = new THREE.Mesh(new THREE.BoxGeometry(60, 25, 8), baseMaterial);
		gateBarrier1.position.set(240, 8, 320);
		gateBarrier1.castShadow = true;
		scene.add(gateBarrier1);
		objects.push(gateBarrier1);

		var gateBarrier2 = new THREE.Mesh(new THREE.BoxGeometry(60, 25, 8), baseMaterial);
		gateBarrier2.position.set(320, 8, 320);
		gateBarrier2.castShadow = true;
		scene.add(gateBarrier2);
		objects.push(gateBarrier2);

		var uplink1 = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 40, 8), radarMaterial);
		uplink1.position.set(-280, 15, 200);
		uplink1.castShadow = true;
		scene.add(uplink1);
		objects.push(uplink1);

		var uplinkDish1 = new THREE.Mesh(new THREE.BoxGeometry(50, 3, 50), new THREE.MeshLambertMaterial({ color: 0x666666 }));
		uplinkDish1.position.set(-280, 45, 200);
		uplinkDish1.castShadow = true;
		scene.add(uplinkDish1);
		objects.push(uplinkDish1);
		radarDishes.push(uplinkDish1);

		var uplink2 = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 40, 8), radarMaterial);
		uplink2.position.set(-320, 15, 220);
		uplink2.castShadow = true;
		scene.add(uplink2);
		objects.push(uplink2);

		var uplinkDish2 = new THREE.Mesh(new THREE.BoxGeometry(50, 3, 50), new THREE.MeshLambertMaterial({ color: 0x666666 }));
		uplinkDish2.position.set(-320, 45, 220);
		uplinkDish2.castShadow = true;
		scene.add(uplinkDish2);
		objects.push(uplinkDish2);
		radarDishes.push(uplinkDish2);

		var uplink3 = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 40, 8), radarMaterial);
		uplink3.position.set(-240, 15, 220);
		uplink3.castShadow = true;
		scene.add(uplink3);
		objects.push(uplink3);

		var uplinkDish3 = new THREE.Mesh(new THREE.BoxGeometry(50, 3, 50), new THREE.MeshLambertMaterial({ color: 0x666666 }));
		uplinkDish3.position.set(-240, 45, 220);
		uplinkDish3.castShadow = true;
		scene.add(uplinkDish3);
		objects.push(uplinkDish3);
		radarDishes.push(uplinkDish3);
	}

	function setupLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(200, 150, 100);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.far = 500;
		directionalLight.shadow.camera.left = -400;
		directionalLight.shadow.camera.right = 400;
		directionalLight.shadow.camera.top = 400;
		directionalLight.shadow.camera.bottom = -400;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var spotLight1 = new THREE.SpotLight(0xff6600, 1, 300, Math.PI / 4, 0.5, 1);
		spotLight1.position.set(-100, 80, 0);
		spotLight1.target.position.set(-100, 0, 0);
		spotLight1.castShadow = true;
		scene.add(spotLight1);
		scene.add(spotLight1.target);
		lights.push(spotLight1);

		var spotLight2 = new THREE.SpotLight(0xff6600, 1, 300, Math.PI / 4, 0.5, 1);
		spotLight2.position.set(100, 80, 0);
		spotLight2.target.position.set(100, 0, 0);
		spotLight2.castShadow = true;
		scene.add(spotLight2);
		scene.add(spotLight2.target);
		lights.push(spotLight2);

		var pointLight1 = new THREE.PointLight(0x0088ff, 0.4, 200);
		pointLight1.position.set(-200, 30, -200);
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0x00ff88, 0.4, 200);
		pointLight2.position.set(200, 30, 200);
		scene.add(pointLight2);
		lights.push(pointLight2);
	}

	function update(delta) {
		radarRotation += delta * 0.5;
		strobePhase += delta * 3;

		for (var i = 0; i < radarDishes.length; i++) {
			radarDishes[i].rotation.y = radarRotation;
		}

		var strobeIntensity = Math.abs(Math.sin(strobePhase)) * 0.8 + 0.2;
		for (var i = 0; i < runwayLights.length; i++) {
			runwayLights[i].material.color.setRGB(strobeIntensity * 1.0, strobeIntensity * 1.0, 0);
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		for (var i = 0; i < lights.length; i++) {
			scene.remove(lights[i]);
		}
		objects = [];
		lights = [];
		radarDishes = [];
		runwayLights = [];
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
