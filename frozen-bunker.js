window.FrozenBunker = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var steamVents = [];
  var emergencyLights = [];
  var mercenaries = [];
  var cryo_pods = [];
  var particles = [];
  var time = 0;

  var COLORS = {
    ice_blue: 0x88CCFF,
    snow_white: 0xEEF4FF,
    soviet_red: 0xCC2222,
    steel_gray: 0x666677,
    rust_orange: 0x885533,
    emergency_red: 0xFF0000
  };

  function createCorridor() {
    var corridor_length = 100;
    var corridor_width = 15;
    var corridor_height = 12;

    // Floor - ice covered concrete
    var floor_geom = new THREE.BoxGeometry(corridor_width, 0.5, corridor_length);
    var floor_mat = new THREE.MeshLambertMaterial({ color: COLORS.ice_blue });
    var floor = new THREE.Mesh(floor_geom, floor_mat);
    floor.position.y = 0;
    floor.castShadow = true;
    floor.receiveShadow = true;
    scene.add(floor);
    meshes.push(floor);

    // Left wall
    var left_wall_geom = new THREE.BoxGeometry(0.8, corridor_height, corridor_length);
    var wall_mat = new THREE.MeshLambertMaterial({ color: COLORS.snow_white });
    var left_wall = new THREE.Mesh(left_wall_geom, wall_mat);
    left_wall.position.x = -corridor_width / 2;
    left_wall.position.y = corridor_height / 2;
    left_wall.castShadow = true;
    left_wall.receiveShadow = true;
    scene.add(left_wall);
    meshes.push(left_wall);

    // Right wall
    var right_wall = new THREE.Mesh(left_wall_geom, wall_mat);
    right_wall.position.x = corridor_width / 2;
    right_wall.position.y = corridor_height / 2;
    right_wall.castShadow = true;
    right_wall.receiveShadow = true;
    scene.add(right_wall);
    meshes.push(right_wall);

    // Ceiling
    var ceiling_geom = new THREE.BoxGeometry(corridor_width, 0.6, corridor_length);
    var ceiling_mat = new THREE.MeshLambertMaterial({ color: COLORS.steel_gray });
    var ceiling = new THREE.Mesh(ceiling_geom, ceiling_mat);
    ceiling.position.y = corridor_height;
    ceiling.castShadow = true;
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    meshes.push(ceiling);

    // Icicles hanging from ceiling
    for (var i = 0; i < 12; i++) {
      var icicle_x = -corridor_width / 2 + Math.random() * corridor_width;
      var icicle_z = -corridor_length / 2 + Math.random() * corridor_length;
      var icicle_geom = new THREE.ConeGeometry(0.15, 2.5, 8);
      var icicle_mat = new THREE.MeshLambertMaterial({ color: COLORS.ice_blue });
      var icicle = new THREE.Mesh(icicle_geom, icicle_mat);
      icicle.position.set(icicle_x, corridor_height - 1.2, icicle_z);
      icicle.castShadow = true;
      icicle.receiveShadow = true;
      scene.add(icicle);
      meshes.push(icicle);
    }

    return {
      length: corridor_length,
      width: corridor_width,
      height: corridor_height
    };
  }

  function createCryoPods() {
    var pod_count = 8;
    var pod_spacing = 5;
    var pod_start_z = -15;

    for (var i = 0; i < pod_count; i++) {
      var pod_z = pod_start_z + i * pod_spacing;

      // Main pod cylinder
      var pod_geom = new THREE.CylinderGeometry(1.2, 1.2, 3, 16);
      var pod_mat = new THREE.MeshLambertMaterial({ color: COLORS.soviet_red });
      var pod = new THREE.Mesh(pod_geom, pod_mat);
      pod.position.set(-5, 2, pod_z);
      pod.castShadow = true;
      pod.receiveShadow = true;
      scene.add(pod);
      meshes.push(pod);
      cryo_pods.push({
        mesh: pod,
        open: false,
        time: 0
      });

      // Pod window
      var window_geom = new THREE.CylinderGeometry(1.0, 1.0, 0.2, 16);
      var window_mat = new THREE.MeshLambertMaterial({ color: COLORS.ice_blue });
      var window_mesh = new THREE.Mesh(window_geom, window_mat);
      window_mesh.position.set(-5, 2.5, pod_z);
      window_mesh.castShadow = true;
      window_mesh.receiveShadow = true;
      scene.add(window_mesh);
      meshes.push(window_mesh);

      // Cooling lines
      var line_geom = new THREE.BoxGeometry(0.15, 0.15, 1.5);
      var line_mat = new THREE.MeshLambertMaterial({ color: COLORS.steel_gray });
      var cooling_line = new THREE.Mesh(line_geom, line_mat);
      cooling_line.position.set(-6.5, 2, pod_z);
      cooling_line.castShadow = true;
      cooling_line.receiveShadow = true;
      scene.add(cooling_line);
      meshes.push(cooling_line);
    }
  }

  function createHeatingSystem() {
    // Main pipe running along ceiling
    var pipe_geom = new THREE.CylinderGeometry(0.3, 0.3, 60, 12);
    var pipe_mat = new THREE.MeshLambertMaterial({ color: COLORS.rust_orange });
    var main_pipe = new THREE.Mesh(pipe_geom, pipe_mat);
    main_pipe.rotation.z = Math.PI / 2;
    main_pipe.position.set(0, 11, 0);
    main_pipe.castShadow = true;
    main_pipe.receiveShadow = true;
    scene.add(main_pipe);
    meshes.push(main_pipe);

    // Broken pipe sections
    for (var i = 0; i < 4; i++) {
      var steam_vent_x = -8 + i * 6;
      var steam_vent_z = -20 + i * 15;

      var vent_geom = new THREE.CylinderGeometry(0.25, 0.25, 2, 12);
      var vent_mat = new THREE.MeshLambertMaterial({ color: COLORS.rust_orange });
      var vent = new THREE.Mesh(vent_geom, vent_mat);
      vent.position.set(steam_vent_x, 8, steam_vent_z);
      vent.castShadow = true;
      vent.receiveShadow = true;
      scene.add(vent);
      meshes.push(vent);

      steamVents.push({
        position: new THREE.Vector3(steam_vent_x, 8.5, steam_vent_z),
        intensity: Math.random() * 0.5 + 0.5,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function createRadarConsoles() {
    // Console 1 - left side
    var console_geom = new THREE.BoxGeometry(2, 2, 1.5);
    var console_mat = new THREE.MeshLambertMaterial({ color: COLORS.steel_gray });
    var console1 = new THREE.Mesh(console_geom, console_mat);
    console1.position.set(-6, 1, -30);
    console1.castShadow = true;
    console1.receiveShadow = true;
    scene.add(console1);
    meshes.push(console1);

    // Console screen
    var screen_geom = new THREE.BoxGeometry(1.8, 1.8, 0.1);
    var screen_mat = new THREE.MeshLambertMaterial({ color: COLORS.soviet_red });
    var screen1 = new THREE.Mesh(screen_geom, screen_mat);
    screen1.position.set(-6, 1.5, -30.8);
    screen1.castShadow = true;
    screen1.receiveShadow = true;
    scene.add(screen1);
    meshes.push(screen1);

    // Console 2 - right side
    var console2 = console1.clone();
    console2.position.set(6, 1, -30);
    scene.add(console2);
    meshes.push(console2);

    var screen2 = screen1.clone();
    screen2.position.set(6, 1.5, -30.8);
    scene.add(screen2);
    meshes.push(screen2);
  }

  function createBlastDoor() {
    // Main door
    var door_geom = new THREE.BoxGeometry(10, 8, 1);
    var door_mat = new THREE.MeshLambertMaterial({ color: COLORS.steel_gray });
    var blast_door = new THREE.Mesh(door_geom, door_mat);
    blast_door.position.set(0, 4, -48);
    blast_door.castShadow = true;
    blast_door.receiveShadow = true;
    scene.add(blast_door);
    meshes.push(blast_door);

    // Door bolts
    for (var i = 0; i < 6; i++) {
      var bolt_x = -4 + i * 1.6;
      var bolt_y = 0.5 + (i % 2) * 3;
      var bolt_geom = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12);
      var bolt_mat = new THREE.MeshLambertMaterial({ color: COLORS.rust_orange });
      var bolt = new THREE.Mesh(bolt_geom, bolt_mat);
      bolt.position.set(bolt_x, bolt_y, -47.5);
      bolt.castShadow = true;
      bolt.receiveShadow = true;
      scene.add(bolt);
      meshes.push(bolt);
    }

    // Blast door frame
    var frame_geom = new THREE.BoxGeometry(11, 9, 0.5);
    var frame_mat = new THREE.MeshLambertMaterial({ color: COLORS.soviet_red });
    var frame = new THREE.Mesh(frame_geom, frame_mat);
    frame.position.set(0, 4, -48.5);
    frame.castShadow = true;
    frame.receiveShadow = true;
    scene.add(frame);
    meshes.push(frame);
  }

  function createGeneratorRoom() {
    // Generator main unit
    var gen_geom = new THREE.BoxGeometry(3, 2.5, 2);
    var gen_mat = new THREE.MeshLambertMaterial({ color: COLORS.rust_orange });
    var generator = new THREE.Mesh(gen_geom, gen_mat);
    generator.position.set(8, 1.25, -15);
    generator.castShadow = true;
    generator.receiveShadow = true;
    scene.add(generator);
    meshes.push(generator);

    // Exhaust pipe
    var exhaust_geom = new THREE.CylinderGeometry(0.4, 0.4, 3, 12);
    var exhaust_mat = new THREE.MeshLambertMaterial({ color: COLORS.steel_gray });
    var exhaust = new THREE.Mesh(exhaust_geom, exhaust_mat);
    exhaust.position.set(8.5, 3, -15);
    exhaust.castShadow = true;
    exhaust.receiveShadow = true;
    scene.add(exhaust);
    meshes.push(exhaust);

    // Fuel tank
    var tank_geom = new THREE.CylinderGeometry(0.8, 0.8, 2, 16);
    var tank_mat = new THREE.MeshLambertMaterial({ color: COLORS.soviet_red });
    var tank = new THREE.Mesh(tank_geom, tank_mat);
    tank.position.set(7, 1.5, -12);
    tank.castShadow = true;
    tank.receiveShadow = true;
    scene.add(tank);
    meshes.push(tank);
  }

  function createEmergencyLighting() {
    var light_positions = [
      { x: -5, z: -10 },
      { x: 5, z: -10 },
      { x: -5, z: 0 },
      { x: 5, z: 0 },
      { x: -5, z: 10 },
      { x: 5, z: 10 },
      { x: 0, z: -30 },
      { x: 0, z: -45 }
    ];

    for (var i = 0; i < light_positions.length; i++) {
      var pos = light_positions[i];

      // Light fixture
      var fixture_geom = new THREE.BoxGeometry(0.6, 0.4, 0.6);
      var fixture_mat = new THREE.MeshLambertMaterial({ color: COLORS.steel_gray });
      var fixture = new THREE.Mesh(fixture_geom, fixture_mat);
      fixture.position.set(pos.x, 11.5, pos.z);
      fixture.castShadow = true;
      fixture.receiveShadow = true;
      scene.add(fixture);
      meshes.push(fixture);

      // Light bulb
      var bulb_geom = new THREE.SphereGeometry(0.2, 8, 8);
      var bulb_mat = new THREE.MeshLambertMaterial({ color: COLORS.emergency_red });
      var bulb = new THREE.Mesh(bulb_geom, bulb_mat);
      bulb.position.set(pos.x, 11.3, pos.z);
      bulb.castShadow = true;
      bulb.receiveShadow = true;
      scene.add(bulb);
      meshes.push(bulb);

      // Light source
      var light = new THREE.PointLight(COLORS.emergency_red, 1, 20);
      light.position.set(pos.x, 11.3, pos.z);
      light.castShadow = true;
      scene.add(light);
      emergencyLights.push({
        light: light,
        flicker_phase: Math.random() * Math.PI * 2
      });
    }
  }

  function createFrozenSoldier() {
    var ice_block_geom = new THREE.BoxGeometry(2, 3, 1.5);
    var ice_mat = new THREE.MeshLambertMaterial({
      color: COLORS.ice_blue,
      transparent: true,
      opacity: 0.7
    });
    var ice_block = new THREE.Mesh(ice_block_geom, ice_mat);
    ice_block.position.set(0, 2, 25);
    ice_block.castShadow = true;
    ice_block.receiveShadow = true;
    scene.add(ice_block);
    meshes.push(ice_block);

    // Soldier head
    var head_geom = new THREE.SphereGeometry(0.5, 12, 12);
    var body_mat = new THREE.MeshLambertMaterial({ color: COLORS.steel_gray });
    var head = new THREE.Mesh(head_geom, body_mat);
    head.position.set(0, 3, 25);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    meshes.push(head);

    // Soldier torso
    var torso_geom = new THREE.BoxGeometry(1, 1.5, 0.8);
    var torso = new THREE.Mesh(torso_geom, body_mat);
    torso.position.set(0, 2, 25);
    torso.castShadow = true;
    torso.receiveShadow = true;
    scene.add(torso);
    meshes.push(torso);
  }

  function createDebris() {
    // Rubble section - collapsed wall
    var rubble_positions = [
      { x: -4, y: 2, z: 35 },
      { x: -2, y: 1.5, z: 36 },
      { x: 0, y: 2.5, z: 34 },
      { x: 2, y: 1.8, z: 37 },
      { x: 4, y: 2.2, z: 35 }
    ];

    for (var i = 0; i < rubble_positions.length; i++) {
      var pos = rubble_positions[i];
      var rubble_geom = new THREE.BoxGeometry(
        0.8 + Math.random() * 0.6,
        0.8 + Math.random() * 0.6,
        0.8 + Math.random() * 0.6
      );
      var rubble_mat = new THREE.MeshLambertMaterial({ color: COLORS.steel_gray });
      var rubble = new THREE.Mesh(rubble_geom, rubble_mat);
      rubble.position.set(pos.x, pos.y, pos.z);
      rubble.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rubble.castShadow = true;
      rubble.receiveShadow = true;
      scene.add(rubble);
      meshes.push(rubble);
    }
  }

  function createMercenaries() {
    var patrol_spots = [
      { x: -4, z: -20 },
      { x: 4, z: 10 },
      { x: -6, z: -35 }
    ];

    for (var i = 0; i < patrol_spots.length; i++) {
      var spot = patrol_spots[i];
      var body_geom = new THREE.BoxGeometry(0.8, 1.8, 0.6);
      var body_mat = new THREE.MeshLambertMaterial({ color: COLORS.soviet_red });
      var body = new THREE.Mesh(body_geom, body_mat);
      body.position.set(spot.x, 1.5, spot.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      meshes.push(body);

      var head_geom = new THREE.SphereGeometry(0.35, 10, 10);
      var head_mat = new THREE.MeshLambertMaterial({ color: COLORS.steel_gray });
      var head = new THREE.Mesh(head_geom, head_mat);
      head.position.set(spot.x, 2.8, spot.z);
      head.castShadow = true;
      head.receiveShadow = true;
      scene.add(head);
      meshes.push(head);

      mercenaries.push({
        body: body,
        head: head,
        patrol_x: spot.x,
        patrol_z: spot.z,
        time: Math.random() * Math.PI * 2
      });
    }
  }

  function updateSteamVents(delta) {
    for (var i = 0; i < steamVents.length; i++) {
      var vent = steamVents[i];
      vent.phase += delta * 1.5;

      var particle_count = Math.floor(vent.intensity * 3);
      for (var j = 0; j < particle_count; j++) {
        var particle_geom = new THREE.SphereGeometry(0.2, 4, 4);
        var particle_mat = new THREE.MeshLambertMaterial({
          color: COLORS.snow_white,
          transparent: true,
          opacity: 0.6
        });
        var particle = new THREE.Mesh(particle_geom, particle_mat);
        particle.position.copy(vent.position);
        particle.position.x += (Math.random() - 0.5) * 2;
        particle.position.z += (Math.random() - 0.5) * 2;
        scene.add(particle);
        particles.push({
          mesh: particle,
          life: 1.5,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            2 + Math.random() * 2,
            (Math.random() - 0.5) * 2
          )
        });
      }
    }
  }

  function updateEmergencyLights(delta) {
    for (var i = 0; i < emergencyLights.length; i++) {
      var light_obj = emergencyLights[i];
      light_obj.flicker_phase += delta * 4;
      var flicker = Math.sin(light_obj.flicker_phase) * 0.3 + 0.7;
      light_obj.light.intensity = flicker;
    }
  }

  function updateMercenaries(delta) {
    for (var i = 0; i < mercenaries.length; i++) {
      var merc = mercenaries[i];
      merc.time += delta * 0.5;

      var offset_x = Math.sin(merc.time) * 3;
      merc.body.position.x = merc.patrol_x + offset_x;
      merc.head.position.x = merc.patrol_x + offset_x;

      merc.body.rotation.y = Math.cos(merc.time) * 0.3;
      merc.head.rotation.y = Math.cos(merc.time) * 0.3;
    }
  }

  function updateCryoPods(delta) {
    for (var i = 0; i < cryo_pods.length; i++) {
      var pod = cryo_pods[i];
      if (Math.random() < 0.01) {
        pod.open = !pod.open;
      }
      pod.time += delta;
      if (pod.open && pod.time < 2) {
        var frost_geom = new THREE.SphereGeometry(0.3, 6, 6);
        var frost_mat = new THREE.MeshLambertMaterial({ color: COLORS.ice_blue });
        var frost = new THREE.Mesh(frost_geom, frost_mat);
        frost.position.copy(pod.mesh.position);
        frost.position.y += 2;
        frost.position.x += (Math.random() - 0.5) * 2;
        frost.position.z += (Math.random() - 0.5) * 2;
        scene.add(frost);
        particles.push({
          mesh: frost,
          life: 1.2,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 1,
            1,
            (Math.random() - 0.5) * 1
          )
        });
      }
    }
  }

  function updateParticles(delta) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        particles.splice(i, 1);
      } else {
        p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
        p.mesh.material.opacity = (p.life / 1.5) * 0.6;
      }
    }
  }

  var exports = {
    init: function(init_scene, init_camera) {
      scene = init_scene;
      camera = init_camera;
      meshes = [];
      steamVents = [];
      emergencyLights = [];
      mercenaries = [];
      cryo_pods = [];
      particles = [];
      time = 0;

      // Build bunker
      createCorridor();
      createCryoPods();
      createHeatingSystem();
      createRadarConsoles();
      createBlastDoor();
      createGeneratorRoom();
      createEmergencyLighting();
      createFrozenSoldier();
      createDebris();
      createMercenaries();

      // Ambient lighting
      var ambient = new THREE.AmbientLight(0xFFFFFF, 0.6);
      scene.add(ambient);
    },

    update: function(delta) {
      time += delta;
      updateSteamVents(delta);
      updateEmergencyLights(delta);
      updateMercenaries(delta);
      updateCryoPods(delta);
      updateParticles(delta);
    },

    reset: function() {
      for (var i = 0; i < meshes.length; i++) {
        scene.remove(meshes[i]);
      }
      for (var j = 0; j < particles.length; j++) {
        scene.remove(particles[j].mesh);
      }
      for (var k = 0; k < emergencyLights.length; k++) {
        scene.remove(emergencyLights[k].light);
      }
      meshes = [];
      steamVents = [];
      emergencyLights = [];
      mercenaries = [];
      cryo_pods = [];
      particles = [];
      time = 0;
    }
  };

  return exports;
}());
