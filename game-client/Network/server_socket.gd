extends Node2D

signal room_created(code: String, url_to_join: String)
signal player_connected(id: int, name: String)
signal player_use_bonus(id: int, bonus_name: String)
signal player_left(id: int)

var socket = WebSocketPeer.new()
var origin_url = "http://localhost:3000"
var url_to_join: String

var players_ids = []
var players_inputs_buffer = {}

func _ready():
	if OS.has_feature("web"):
		origin_url = JavaScriptBridge.eval("window.location.origin")
	
	var url = origin_url.replace("http", "ws")
	url_to_join = origin_url
	
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
		"ROOM_CREATED":
			#print("Code de la partie : ", json.data.code)
			url_to_join += "/" + json.data.code
			#print("URL: ", url_to_join)
			room_created.emit(json.data.code, url_to_join)
		"PLAYER_JOIN":
			players_ids.append(int(json.data.id))
			player_connected.emit(int(json.data.id), json.data.name)
			
		"MOVE":
			players_inputs_buffer[int(json.player_id)] = Vector2(json.data.x, json.data.y)

		"USE_BONUS":
			player_use_bonus.emit(int(json.player_id), json.data.bonus)
			
		"PLAYER_LEFT":
			player_left.emit(int(json.player_id))

func send_message_to_server(data: Dictionary):
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		# On transforme le Dictionnaire en texte JSON, puis en binaire (UTF-8)
		var json_text = JSON.stringify(data)
		socket.put_packet(json_text.to_utf8_buffer())
	else:
		print("Erreur : Le socket n'est pas connecté.")
	
	
