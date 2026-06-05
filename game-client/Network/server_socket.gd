extends Node2D

signal room_created(code: String, url_to_join: String)
signal player_connected(id: int, name: String)
signal player_use_bonus(id: int, bonus_name: String)
signal player_left(id: int)

signal start_countdown
signal countdown_tick(value: int)
signal round_start

var socket = WebSocketPeer.new()
var origin_url = "http://localhost:3000"
var url_to_join: String

var players_ids = []
var players_inputs_buffer = {}

var socket_closed = false

func _ready():
	if OS.has_feature("web"):
		origin_url = JavaScriptBridge.eval("window.location.origin")
	
	url_to_join = origin_url
	
	_connect_to_server()

func _connect_to_server():
	if socket.get_ready_state() != WebSocketPeer.STATE_CLOSED:
		socket.close()
	var url = origin_url.replace("http", "ws")
	socket.connect_to_url(url)
	print("Tentative de connexion au serveur...")

func _process(_delta):
	if OS.has_feature("debug") && Input.is_action_just_pressed("connect_to_server"):
		print("Touche pressée : Reconnexion manuelle...")
		
		players_ids.clear() 
		players_inputs_buffer.clear()
		_connect_to_server()
	
	socket.poll()
	var state = socket.get_ready_state()
	
	if state == WebSocketPeer.STATE_OPEN:
		while socket.get_available_packet_count():
			var packet = socket.get_packet()
			var data_text = packet.get_string_from_utf8()
			var json = JSON.parse_string(data_text)
			
			if json:
				_handle_server_message(json)

	elif state == WebSocketPeer.STATE_CLOSED && !socket_closed:
		socket_closed = true
		print("Connexion perdue.")
		#set_process(false)

func _handle_server_message(json):
	match json.type:
		"ROOM_CREATED":
			room_created.emit(json.data.code, url_to_join + "/" + json.data.code)
		"PLAYER_JOIN":
			players_ids.append(int(json.data.id))
			player_connected.emit(int(json.data.id), json.data.name)
			
		"MOVE":
			# Diviser par 100 car le serveur a envoyé des valeurs multipliées par 100
			players_inputs_buffer[int(json.id)] = Vector2(json.data[0] / 100, json.data[1] / 100)

		"USE_BONUS":
			player_use_bonus.emit(int(json.id), json.data.bonus)
			
		"PLAYER_LEFT":
			player_left.emit(int(json.id))
			
		# Signaux pour les décomptes avant le lancement de chaque manche
		"START_COUNTDOWN":
			start_countdown.emit()
			
		"COUNTDOWN_TICK":
			countdown_tick.emit(json.value)
		
		"ROUND_START":
			round_start.emit()

func send_message_to_server(data: Dictionary):
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		# On transforme le Dictionnaire en texte JSON, puis en binaire (UTF-8)
		var json_text = JSON.stringify(data)
		socket.put_packet(json_text.to_utf8_buffer())
	else:
		print("Erreur : Le socket n'est pas connecté.")
	
	
