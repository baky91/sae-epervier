extends Node2D

@export var player_scene: PackedScene = preload("res://player.tscn")

var socket = WebSocketPeer.new()
var url = "ws://localhost:3000"
var players = {}

func _ready():
	if OS.has_feature("web"):
		var host = JavaScriptBridge.eval("window.location.hostname")
		url = "ws://" + host + ":3000/?clientType=host"
	
	socket.connect_to_url(url)
	print("Tentative de connexion au serveur...")

func _process(_delta):
	socket.poll()
	var state = socket.get_ready_state()
	
	if state == WebSocketPeer.STATE_OPEN:
		while socket.get_available_packet_count():
			var packet = socket.get_packet()
			var data_text = packet.get_string_from_utf8()
			var json = JSON.parse_string(data_text)
			
			if json:
				_handle_server_message(json)

	elif state == WebSocketPeer.STATE_CLOSED:
		print("Connexion perdue.")
		set_process(false)

func _handle_server_message(json):
	match json.type:
		"player_joined":
			_spawn_player(json.data.id, json.data.name)
			
		"move":
			_update_player_movement(json.player_id, json.data)

		"player_left":
			_remove_player(json.player_id)

func _spawn_player(id: int, p_name: String):
	if not players.has(id):
		var new_player = player_scene.instantiate()
		new_player._id = id
		new_player.name = str(id)
		
		add_child(new_player)
		players[id] = new_player
		# new_player.global_position = Vector2(500, 300) # Position par défaut
		new_player.global_position = Vector2(randf_range(100, 500), randf_range(100, 500)) # Position aléatoire

		print("Joueur apparu : ", p_name)

func _update_player_movement(id: int, move_data: Dictionary):
	if players.has(id):
		# On transforme les données x, y du joystick en Vector2
		var dir = Vector2(move_data.x, move_data.y)
		players[id]._direction = dir

func _remove_player(id: int):
	if players.has(id):
		players[id].queue_free()
		players.erase(id)
