extends Node2D

signal player_connected(id: int, name: String)
signal player_use_bonus(id: int, bonus_name: String)
signal player_left(id: int)

var socket = WebSocketPeer.new()
var url = "ws://localhost:3000"

var players_inputs_buffer = {}

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
			player_connected.emit(int(json.data.id), json.data.name)
			
		"move":
			players_inputs_buffer[int(json.player_id)] = Vector2(json.data.x, json.data.y)
			#player_move.emit(json.player_id, json.data.x, json.data.y)

		"use_bonus":
			player_use_bonus.emit(int(json.player_id), json.data.bonus)
			
		"player_left":
			player_left.emit(int(json.player_id))
