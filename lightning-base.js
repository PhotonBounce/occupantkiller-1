window.LightningBase = (function() {
	'use strict';

	var scene, camera;
	var lightningBolts = [];
	var fires = [];
	var raindrops = [];
	var stormClouds = [];
	var lights = [];
	var generator;
	var radarDome;
	var flickerTimer = 0;
	var lightningTimer = 0;
	var lightningInterval = 2.0;
	var stormIntensity = 0.5;

	var init = function(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;

		scene.background = new THREE.Color(0x0a0a15);
		scene.fog = new THREE.Fog(0x0a0a15, 200, 500);

		// Ambient light
		var ambientLight = new THREE.AmbientLight(0x333366, 0.4);
		scene.add(ambientLight);

		// Main directional light for base illumination
		var dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
		dirLight.position.set(100, 150, 100);
		scene.add(dirLight);

		lights.push(ambientLight);
		lights.push(dirLight);

		// Ground
		var groundGeo = new THREE.BoxGeometry(300, 0.5, 300);
		var groundMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.1, roughness: 0.8 });
		var ground = new THREE.Mesh(groundGeo, groundMat);
		ground.position.y = -0.25;
		ground.receiveShadow = true;
		scene.add(ground);

		// Military Base Buildings
		buildBarracks(-50, 5, -50);
		buildCommandCenter(50, 8, -50);
		buildHangar(-60, 6, 60);
		buildRadarDome(60, 8, 60);

		// Lightning rods
		addLightningRods(-50, -50);
		addLightningRods(50, -50);
		addLightningRods(-60, 60);
		addLightningRods(60, 60);

		// Perimeter fence with breach
		buildFence();

		// Storm clouds overhead
		buildStormClouds();

		// Emergency generator
		buildGenerator(-40, 3, 40);

		// Water puddles
		createWaterPuddles();

		// Initial rain
		createRain();

		// Initialize lightning bolts array
		for (var i = 0; i < 3; i++) {
			lightningBolts.push(null);
		}
	};

	var buildBarracks = function(x, y, z) {
		var geo = new THREE.BoxGeometry(40, 12, 25);
		var mat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, metalness: 0.05, roughness: 0.9 });
		var mesh = new THREE.Mesh(geo, mat);
		mesh.position.set(x, y, z);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		scene.add(mesh);

		// Roof
		var roofGeo = new THREE.BoxGeometry(42, 1, 27);
		var roofMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.3, roughness: 0.7 });
		var roof = new THREE.Mesh(roofGeo, roofMat);
		roof.position.set(x, y + 6.5, z);
		roof.castShadow = true;
		scene.add(roof);
	};

	var buildCommandCenter = function(x, y, z) {
		var geo = new THREE.BoxGeometry(35, 15, 35);
		var mat = new THREE.MeshStandardMaterial({ color: 0x4a4a5a, metalness: 0.08, roughness: 0.85 });
		var mesh = new THREE.Mesh(geo, mat);
		mesh.position.set(x, y, z);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		scene.add(mesh);

		// Antenna mast
		var antennaMat = new THREE.MeshStandardMaterial({ color: 0x666677, metalness: 0.9, roughness: 0.2 });
		var antennaGeo = new THREE.CylinderGeometry(1, 1, 30, 8);
		var antenna = new THREE.Mesh(antennaGeo, antennaMat);
		antenna.position.set(x, y + 15, z);
		antenna.castShadow = true;
		scene.add(antenna);
	};

	var buildHangar = function(x, y, z) {
		var geo = new THREE.BoxGeometry(80, 14, 50);
		var mat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, metalness: 0.1, roughness: 0.8 });
		var mesh = new THREE.Mesh(geo, mat);
		mesh.position.set(x, y, z);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		scene.add(mesh);

		// Large hangar doors
		var doorGeo = new THREE.BoxGeometry(25, 12, 2);
		var doorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.3, roughness: 0.7 });
		var door = new THREE.Mesh(doorGeo, doorMat);
		door.position.set(x - 15, y, z + 25.5);
		scene.add(door);
	};

	var buildRadarDome = function(x, y, z) {
		radarDome = new THREE.Group();

		// Dome base
		var baseGeo = new THREE.CylinderGeometry(12, 12, 2, 16);
		var baseMat = new THREE.MeshStandardMaterial({ color: 0x4a4a5a, metalness: 0.2, roughness: 0.8 });
		var base = new THREE.Mesh(baseGeo, baseMat);
		radarDome.add(base);

		// Dome sphere
		var domeGeo = new THREE.SphereGeometry(11, 16, 12);
		var domeMat = new THREE.MeshStandardMaterial({ color: 0x5a5a6a, metalness: 0.6, roughness: 0.4 });
		var dome = new THREE.Mesh(domeGeo, domeMat);
		dome.position.y = 11;
		dome.castShadow = true;
		radarDome.add(dome);

		radarDome.position.set(x, y, z);
		scene.add(radarDome);
	};

	var addLightningRods = function(x, z) {
		var positions = [
			{x: x - 20, z: z - 12},
			{x: x + 20, z: z - 12},
			{x: x - 20, z: z + 12},
			{x: x + 20, z: z + 12}
		];

		positions.forEach(function(pos) {
			var rodGeo = new THREE.CylinderGeometry(0.8, 0.8, 25, 6);
			var rodMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.95, roughness: 0.1 });
			var rod = new THREE.Mesh(rodGeo, rodMat);
			rod.position.set(pos.x, 12.5, pos.z);
			rod.castShadow = true;
			scene.add(rod);
		});
	};

	var buildGenerator = function(x, y, z) {
		generator = new THREE.Group();

		// Main cylinder
		var mainGeo = new THREE.CylinderGeometry(5, 5, 10, 8);
		var mainMat = new THREE.MeshStandardMaterial({ color: 0x4a4a5a, metalness: 0.4, roughness: 0.6 });
		var main = new THREE.Mesh(mainGeo, mainMat);
		generator.add(main);

		// Top vent cylinder
		var ventGeo = new THREE.CylinderGeometry(3, 3, 8, 8);
		var ventMat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, metalness: 0.3, roughness: 0.7 });
		var vent = new THREE.Mesh(ventGeo, ventMat);
		vent.position.y = 9;
		generator.add(vent);

		// Emergency light on top
		var lightGeo = new THREE.SphereGeometry(1.5, 8, 8);
		var lightMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.8 });
		var emergencyLight = new THREE.Mesh(lightGeo, lightMat);
		emergencyLight.position.y = 14;
		generator.add(emergencyLight);

		generator.position.set(x, y, z);
		scene.add(generator);
	};

	var buildFence = function() {
		var fenceGroup = new THREE.Group();

		// Perimeter fence posts
		for (var i = 0; i < 12; i++) {
			var angle = (i / 12) * Math.PI * 2;
			var x = Math.cos(angle) * 150;
			var z = Math.sin(angle) * 150;

			var postGeo = new THREE.CylinderGeometry(1, 1, 8, 6);
			var postMat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, metalness: 0.3, roughness: 0.7 });
			var post = new THREE.Mesh(postGeo, postMat);
			post.position.set(x, 4, z);
			fenceGroup.add(post);
		}

		// Fence rails as line segments
		for (var j = 0; j < 12; j++) {
			var angle1 = (j / 12) * Math.PI * 2;
			var angle2 = ((j + 1) / 12) * Math.PI * 2;

			var x1 = Math.cos(angle1) * 150;
			var z1 = Math.sin(angle1) * 150;
			var x2 = Math.cos(angle2) * 150;
			var z2 = Math.sin(angle2) * 150;

			var lineGeo = new THREE.BufferGeometry();
			var lineVerts = new Float32Array([x1, 4, z1, x2, 4, z2]);
			lineGeo.setAttribute('position', new THREE.BufferAttribute(lineVerts, 3));
			var lineMat = new THREE.LineBasicMaterial({ color: 0x666677, linewidth: 2 });
			var line = new THREE.LineSegments(lineGeo, lineMat);
			fenceGroup.add(line);
		}

		// Breach in fence
		var breachGeo = new THREE.BoxGeometry(15, 8, 1);
		var breachMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a });
		var breach = new THREE.Mesh(breachGeo, breachMat);
		breach.position.set(150, 4, 0);
		fenceGroup.add(breach);

		scene.add(fenceGroup);
	};

	var buildStormClouds = function() {
		for (var i = 0; i < 5; i++) {
			var cloudGeo = new THREE.SphereGeometry(40 + i * 10, 8, 6);
			var cloudMat = new THREE.MeshStandardMaterial({
				color: 0x1a1a2a,
				emissive: 0x0a0a15,
				emissiveIntensity: 0.2,
				transparent: true,
				opacity: 0.7
			});
			var cloud = new THREE.Mesh(cloudGeo, cloudMat);
			cloud.position.set(-80 + i * 40, 200 + Math.random() * 30, -100 + i * 30);

			var cloudData = {
				mesh: cloud,
				vx: 15 + Math.random() * 10,
				vy: (Math.random() - 0.5) * 5
			};
			stormClouds.push(cloudData);
			scene.add(cloud);
		}
	};

	var createWaterPuddles = function() {
		for (var i = 0; i < 8; i++) {
			var x = (Math.random() - 0.5) * 200;
			var z = (Math.random() - 0.5) * 200;

			var puddleGeo = new THREE.BoxGeometry(20 + Math.random() * 15, 0.3, 20 + Math.random() * 15);
			var puddleMat = new THREE.MeshStandardMaterial({
				color: 0x0a1a3a,
				metalness: 0.6,
				roughness: 0.3,
				emissive: 0x0a0a1a,
				emissiveIntensity: 0.1
			});
			var puddle = new THREE.Mesh(puddleGeo, puddleMat);
			puddle.position.set(x, 0.15, z);
			puddle.receiveShadow = true;
			scene.add(puddle);
		}
	};

	var createRain = function() {
		raindrops = [];
		for (var i = 0; i < 300; i++) {
			var x = (Math.random() - 0.5) * 400;
			var y = Math.random() * 400 + 50;
			var z = (Math.random() - 0.5) * 400;

			var dropGeo = new THREE.BoxGeometry(0.1, 1.5, 0.1);
			var dropMat = new THREE.MeshStandardMaterial({ color: 0x4a6a8a, transparent: true, opacity: 0.6 });
			var drop = new THREE.Mesh(dropGeo, dropMat);
			drop.position.set(x, y, z);

			var dropData = {
				mesh: drop,
				startY: y,
				speed: 80 + Math.random() * 40
			};
			raindrops.push(dropData);
			scene.add(drop);
		}
	};

	var createLightningBolt = function(fromX, fromY, fromZ, toX, toY, toZ) {
		var points = [];
		var segments = 8;

		points.push(new THREE.Vector3(fromX, fromY, fromZ));

		for (var i = 1; i < segments; i++) {
			var t = i / segments;
			var x = fromX + (toX - fromX) * t + (Math.random() - 0.5) * 30;
			var y = fromY + (toY - fromY) * t;
			var z = fromZ + (toZ - fromZ) * t + (Math.random() - 0.5) * 30;
			points.push(new THREE.Vector3(x, y, z));
		}

		points.push(new THREE.Vector3(toX, toY, toZ));

		var geo = new THREE.BufferGeometry();
		geo.setFromPoints(points);
		var mat = new THREE.LineBasicMaterial({ color: 0xffff99, linewidth: 3 });
		var bolt = new THREE.LineSegments(geo, mat);

		var boltData = {
			mesh: bolt,
			intensity: 1.0,
			age: 0,
			duration: 0.15,
			strikeX: toX,
			strikeY: toY,
			strikeZ: toZ
		};

		scene.add(bolt);
		return boltData;
	};

	var createFire = function(x, y, z) {
		for (var i = 0; i < 3; i++) {
			var fireGeo = new THREE.SphereGeometry(3 + i * 1.5, 8, 8);
			var fireMat = new THREE.MeshStandardMaterial({
				color: i === 0 ? 0xff3300 : 0xffaa00,
				emissive: i === 0 ? 0xff6600 : 0xff8800,
				emissiveIntensity: 0.8 + i * 0.3,
				transparent: true,
				opacity: 0.8
			});
			var fire = new THREE.Mesh(fireGeo, fireMat);
			fire.position.set(
				x + (Math.random() - 0.5) * 10,
				y + 8 + i * 3,
				z + (Math.random() - 0.5) * 10
			);

			var fireData = {
				mesh: fire,
				age: 0,
				lifetime: 8 + Math.random() * 4,
				vx: (Math.random() - 0.5) * 3,
				vy: 5 + Math.random() * 3,
				vz: (Math.random() - 0.5) * 3
			};
			fires.push(fireData);
			scene.add(fire);
		}
	};

	var strikeRadarDome = function() {
		if (!radarDome) return;

		// Create sparking effect with line segments
		for (var i = 0; i < 5; i++) {
			var angle = (Math.random() * Math.PI * 2);
			var distance = 8 + Math.random() * 6;
			var toX = radarDome.position.x + Math.cos(angle) * distance;
			var toY = radarDome.position.y + Math.random() * 10;
			var toZ = radarDome.position.z + Math.sin(angle) * distance;

			var sparkGeo = new THREE.BufferGeometry();
			var sparkVerts = new Float32Array([
				radarDome.position.x, radarDome.position.y + 15, radarDome.position.z,
				toX, toY, toZ
			]);
			sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkVerts, 3));
			var sparkMat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
			var spark = new THREE.LineSegments(sparkGeo, sparkMat);

			var sparkData = {
				mesh: spark,
				age: 0,
				duration: 0.2
			};
			lightningBolts.push(sparkData);
			scene.add(spark);
		}
	};

	var update = function(delta) {
		flickerTimer += delta;
		lightningTimer += delta;

		// Update storm clouds
		stormClouds.forEach(function(cloud) {
			cloud.mesh.position.x += cloud.vx * delta;
			if (cloud.mesh.position.x > 200) {
				cloud.mesh.position.x = -200;
			}
			cloud.mesh.position.y += cloud.vy * delta;
		});

		// Update rain
		raindrops.forEach(function(drop) {
			drop.mesh.position.y -= drop.speed * delta;
			if (drop.mesh.position.y < 0) {
				drop.mesh.position.y = drop.startY;
			}
		});

		// Update lightning bolts
		for (var i = lightningBolts.length - 1; i >= 0; i--) {
			var bolt = lightningBolts[i];
			if (bolt) {
				bolt.age += delta;
				bolt.intensity = Math.max(0, 1 - bolt.age / bolt.duration);

				if (bolt.mesh.material.color) {
					bolt.mesh.material.opacity = bolt.intensity;
				}

				if (bolt.age >= bolt.duration) {
					scene.remove(bolt.mesh);
					lightningBolts.splice(i, 1);
				}
			}
		}

		// Update fires
		for (var j = fires.length - 1; j >= 0; j--) {
			var fire = fires[j];
			fire.age += delta;

			fire.mesh.position.x += fire.vx * delta;
			fire.mesh.position.y += fire.vy * delta;
			fire.mesh.position.z += fire.vz * delta;
			fire.mesh.scale.multiplyScalar(0.98);

			var progress = fire.age / fire.lifetime;
			fire.mesh.material.opacity = Math.max(0, 1 - progress);

			if (fire.age >= fire.lifetime) {
				scene.remove(fire.mesh);
				fires.splice(j, 1);
			}
		}

		// Power flicker effect
		if (flickerTimer > 0.1) {
			flickerTimer = 0;

			if (Math.random() < 0.3) {
				var flickerAmount = 0.3 + Math.random() * 0.5;
				lights.forEach(function(light) {
					if (light.intensity !== undefined) {
						light.intensity *= flickerAmount;
					}
				});

				// Random flicker to lights in emergency generator
				if (generator && generator.children.length > 2) {
					var emergencyLight = generator.children[2];
					if (emergencyLight.material && emergencyLight.material.emissiveIntensity !== undefined) {
						emergencyLight.material.emissiveIntensity = Math.random() * 1.5;
					}
				}
			} else {
				lights.forEach(function(light) {
					if (light instanceof THREE.DirectionalLight) {
						light.intensity = 0.3;
					} else if (light instanceof THREE.AmbientLight) {
						light.intensity = 0.4;
					}
				});
			}
		}

		// Generate lightning strikes
		if (lightningTimer > lightningInterval) {
			lightningTimer = 0;
			lightningInterval = 1.5 + Math.random() * 2.5;

			var strikeLocations = [
				{x: -50, y: 20, z: -50, isFire: true},
				{x: 50, y: 22, z: -50, isFire: true},
				{x: -60, y: 20, z: 60, isRadar: true},
				{x: 60, y: 25, z: 60, isFire: false}
			];

			var target = strikeLocations[Math.floor(Math.random() * strikeLocations.length)];
			var cloudY = 200 + Math.random() * 50;
			var cloudX = target.x + (Math.random() - 0.5) * 60;
			var cloudZ = target.z + (Math.random() - 0.5) * 60;

			var bolt = createLightningBolt(cloudX, cloudY, cloudZ, target.x, target.y, target.z);
			lightningBolts.push(bolt);

			if (target.isFire) {
				createFire(target.x, target.y, target.z);
			}

			if (target.isRadar) {
				strikeRadarDome();
			}

			// Flash effect on water puddles
			var flashIntensity = 0.8;
			lights[0].intensity = Math.max(0.8, lights[0].intensity + flashIntensity);
		}

		// Ensure lights don't stay too dim
		if (lights[0] && lights[0].intensity < 0.3) {
			lights[0].intensity = 0.3;
		}
	};

	var reset = function() {
		// Clear all dynamic objects
		lightningBolts.forEach(function(bolt) {
			if (bolt && bolt.mesh && bolt.mesh.parent) {
				scene.remove(bolt.mesh);
			}
		});
		lightningBolts = [];

		fires.forEach(function(fire) {
			scene.remove(fire.mesh);
		});
		fires = [];

		flickerTimer = 0;
		lightningTimer = 0;
		lightningInterval = 2.0;

		// Reset lights
		lights.forEach(function(light) {
			if (light instanceof THREE.DirectionalLight) {
				light.intensity = 0.3;
			} else if (light instanceof THREE.AmbientLight) {
				light.intensity = 0.4;
			}
		});

		// Reset emergency light
		if (generator && generator.children.length > 2) {
			var emergencyLight = generator.children[2];
			if (emergencyLight.material && emergencyLight.material.emissiveIntensity !== undefined) {
				emergencyLight.material.emissiveIntensity = 0.8;
			}
		}
	};

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
