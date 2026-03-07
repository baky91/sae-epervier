extends Node2D

var player_scene = preload("res://Player/player.tscn")
var bonus_scene = preload("res://World/bonus.tscn")

@export var qr_code: QRCodeRect

@onready var timer_round = $TimerRound

var players_nodes = {}

var game_started = false
var current_round = 0
var max_round = 5

func _ready() -> void:
	ServerSocket.room_created.connect(_on_room_created)
	ServerSocket.player_connected.connect(_on_player_connected)
	ServerSocket.player_use_bonus.connect(_on_player_use_bonus)
	ServerSocket.player_left.connect(_on_player_left)

	if len(ServerSocket.players_ids) > 0:
		_start_game()

# Position update of all players
func _physics_process(_delta):
	if Input.is_action_just_pressed("start_game"):
		_first_version_start()
	if Input.is_action_just_pressed("start_round"):
		_start_round()
	
	for id in ServerSocket.players_inputs_buffer:
		if players_nodes.has(id):
			var player_node = players_nodes[id]
			var vector_move = ServerSocket.players_inputs_buffer[id]
			player_node.direction = vector_move
			
			#player_node.direction = player_node.direction.lerp(vector_move, 0.2)
			
func _start_game():
	# Génération des joueurs après avoir cliqué sur le bouton pour lancer (UI scène par défaut)
	if !game_started:
		var players_ids = ServerSocket.players_ids
		
		var random_sparrowhawk_id = players_ids.pick_random()
		print("Id de l'épervier: ", str(random_sparrowhawk_id))
		
		var safe_zone_height = 80
		var player_radius = 16
		var viewport_size = get_viewport().get_visible_rect().size
		var width = viewport_size[0]
		var height = viewport_size[1]
		
		var min_x = player_radius
		var max_x = width - player_radius
		
		var min_y = height - safe_zone_height + player_radius
		var max_y = height - player_radius
		
		for id in players_ids:
			print("Création du joueur ", id)
			var player = player_scene.instantiate()
			player.name = str(id)
			player.id = id
			players_nodes[id] = player

			# Connexion des signaux
			player.get_bonus.connect(_on_player_signal_bonus)
			player.role_changed.connect(_on_role_changed)
			
			# Ajout du numéro sur le pion du joueur
			player.set_label(str(id))

			# Positionnement du joueur
			if id == random_sparrowhawk_id: # si épervier, on le place au milieu
				player.role_changed.emit(id, Player.ROLE_SPARROWHAWK)
				player.global_position = Vector2(width / 2, height / 2)
			else: # sinon, on le place dans la zone de sécurité inférieure
				player.role_changed.emit(id, Player.ROLE_SURVIVOR)
				player.global_position = Vector2(randf_range(min_x, max_x), randf_range(min_y, max_y))
			
			# Ajout dans la scène
			$Players.add_child(player)

func _first_version_start():
	# Création des joueurs directement lors de la connexion (si scène par défaut)
	# Identifiant du joueur tiré épervier
	var random_player_id = players_nodes.keys().pick_random()
	
	# Tous les joueurs seront survivants, sauf celui tiré
	for key in players_nodes:
		var player = players_nodes[key]
		
		if key == random_player_id:
			player.role_changed.emit(key, Player.ROLE_SPARROWHAWK)
		else:
			player.role_changed.emit(key, Player.ROLE_SURVIVOR)
	
	game_started = true

func _start_round():
	if current_round < max_round:
		current_round += 1
		print("Commencement de la manche ", str(current_round))
		
		# Liste contenant les éperviers de la prochaine manche
		var next_sparrowhawk = []
		
		# On parcourt la liste des joueurs, tous les infectés de viennent éperviers
		for key in players_nodes:
			var player = players_nodes[key]
			
			if player.role == Player.ROLE_INFECTED:
				player.role_changed.emit(key, Player.ROLE_SPARROWHAWK)
				next_sparrowhawk.append(player)
			elif player.role == Player.ROLE_SPARROWHAWK:
				next_sparrowhawk.append(player)
		
		# On met tous les éperviers au centre
		var counter_sparrowhawk = next_sparrowhawk.size()
		
		var viewport_size = get_viewport().get_visible_rect().size
		var width = viewport_size[0]
		var height = viewport_size[1]
		
		var y = height / 2 # Les éperviers seront téléportés à mi-hauteur
		
		var x_gap = int(width / (counter_sparrowhawk + 1))
		var counter = 0
		for player in next_sparrowhawk:
			counter += 1
			var x = int(x_gap * counter)
		
			player.position = Vector2(x, y)
		
		timer_round.start()
		
func _on_room_created(_code: String, url_to_join: String):
	qr_code.data = url_to_join.to_upper() # In the QRCode addon, only uppercases characters are used

func _on_player_connected(id: int, p_name: String) -> void:
	print("New player joined : " + p_name + " (ID: " + str(id) + ")")
	var player = player_scene.instantiate()
	player.name = str(id)
	player.id = id
	var viewport_size = get_viewport().get_visible_rect().size
	var width = viewport_size[0]
	var height = viewport_size[1]
	player.global_position = Vector2(randf_range(0, width), randf_range(80, height - 80)) # 80: Height of a safe zone
	player.set_label(str(id))
	player.get_bonus.connect(_on_player_signal_bonus)
	player.role_changed.connect(_on_role_changed)
	
	players_nodes[id] = player
	
	$Players.add_child(player)

func _on_player_use_bonus(id: int, bonus: String):
	print("Le joueur " + str(id) + " a utilisé le bonus " + bonus)

	var player = players_nodes[id]

	if bonus == "speed":
		player.speed_boosting = true
		player.timer_speed_boost.start()
	else: # Bonus Dash
		player.dashing = true
		player.timer_dash.start()

func _on_player_left(id: int):
	if players_nodes.has(id):
		players_nodes[id].queue_free()
		players_nodes.erase(id)
		print("Player n°" + str(id) + " left.")


func _on_timer_bonus_timeout() -> void:
	var bonus = bonus_scene.instantiate()
	add_child(bonus)

func _on_player_signal_bonus(player_id: int, bonus_name: String):
	var data_to_send = {
		"type": "bonus_obtained",
		"player_id": player_id,
		"data": {
			"bonus": bonus_name
		}
	}
	
	ServerSocket.send_message_to_server(data_to_send)

func _on_role_changed(player_id: int, role: String) -> void:
	var player = players_nodes[player_id]
	player.set_role(role)
	var data_to_send = {
		"type": "new_role",
		"player_id": player_id,
		"data": {
			"role": role
		}
	}
	
	ServerSocket.send_message_to_server(data_to_send)


func _on_timer_round_timeout() -> void:
	print("Fin de la manche ", str(current_round))
