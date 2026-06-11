extends Node2D

const TOP_ZONE = "top_zone"
const BOTTOM_ZONE = "bottom_zone"

# Scènes d'overlay
const OVERLAY_SCENE_START_ROUND = preload("res://ui/overlays/round_start.tscn")
const OVERLAY_SCENE_END_ROUND = preload("res://ui/overlays/round_end.tscn")

var round_start_overlay: Control

var player_scene = preload("res://player/player.tscn")
var bonus_scene = preload("res://world/bonus.tscn")

@export var qr_code: QRCodeRect

@onready var timer_round = $TimerRound

@onready var label_nb_manche: Label = $CanvasLayer/VBoxContainer2/LabelNbManche
@onready var label_duree_manche: Label = $CanvasLayer/VBoxContainer2/LabelDureeManche
@onready var label_nb_sparrowhawks: Label = $CanvasLayer/VBoxContainer/MarginContainer/VBoxContainer/LabelNbSparrowhawks
@onready var label_nb_infected: Label = $CanvasLayer/VBoxContainer/MarginContainer/VBoxContainer/LabelNbInfected
@onready var label_nb_survivors: Label = $CanvasLayer/VBoxContainer/MarginContainer/VBoxContainer/LabelNbSurvivors

var players_nodes = {}

var inputs_blocked = true
var game_started = false
var current_round = 0

var max_round: int:
	get:
		return Globals.count_rounds if Globals.count_rounds > 0 else 5
	set(value):
		Globals.count_rounds = value

var dest_safe_zone: String = TOP_ZONE

func _ready() -> void:
	
	if Globals.time_rounds > 0:
		timer_round.wait_time = Globals.time_rounds
	
	ServerSocket.room_created.connect(_on_room_created)
	#ServerSocket.player_connected.connect(_on_player_connected)
	ServerSocket.player_use_bonus.connect(_on_player_use_bonus)
	ServerSocket.player_left.connect(_on_player_left)
	
	ServerSocket.start_countdown.connect(_on_start_countdown)
	ServerSocket.countdown_tick.connect(_on_countdown_tick)
	ServerSocket.round_start.connect(_on_round_start)

	_start_game()

# Position update of all players
func _physics_process(_delta):
	if Input.is_action_just_pressed("start_round"):
		_start_round()
		
	if !timer_round.is_stopped():
		var time_left = int(ceil(timer_round.time_left))
		label_duree_manche.text = str(time_left) + " s"
	
	for id in ServerSocket.players_inputs_buffer:
		if players_nodes.has(id):
			var player_node = players_nodes[id]
			var vector_move = null
			if inputs_blocked:
				vector_move = Vector2(0, 0)
			else:
				vector_move = ServerSocket.players_inputs_buffer[id]
			player_node.direction = vector_move
			
			#player_node.direction = player_node.direction.lerp(vector_move, 0.2)

func _start_game():
	# Génération des joueurs après avoir cliqué sur le bouton pour lancer (UI scène par défaut)
	if !game_started:		
		var players_ids = Globals.players.keys()
		
		if players_ids:
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
				player.player_infected.connect(_on_player_infected)
				
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
			
		game_started = true
		ServerSocket.send_message_to_server({
			"type": "GAME_START",
			"id": 0
		})
		
		# Lancement de la première manche
		_start_round()

func _start_round():
	if !game_started:
		_start_game()
		return

	if current_round < max_round:
		# On initialise les compteurs à 0 si on ne connait pas le nombre final à la fin de la manche (éperviers)
		Globals.players_counter = {
			"total": players_nodes.keys().size(),
			Globals.SAFE_SURVIVORS: 0,
			Player.ROLE_SURVIVOR: 0,
			Player.ROLE_INFECTED: 0,
			Player.ROLE_SPARROWHAWK: 0
		}
		
		current_round += 1
		print("Commencement de la manche ", str(current_round))
		label_nb_manche.text = "Manche " + str(current_round) + "/" + str(max_round)
		label_duree_manche.text = str(int(timer_round.wait_time)) + " s" 
		
		# Affichage de l'overlay de décompte de la manche
		_start_round_overlay()
		
		# Liste contenant les éperviers de la prochaine manche
		var next_sparrowhawk = []
		
		# On parcourt la liste des joueurs, tous les infectés de viennent éperviers
		for key in players_nodes:
			var player = players_nodes[key]
			
			if player.role == Player.ROLE_INFECTED:
				player.role_changed.emit(key, Player.ROLE_SPARROWHAWK)
				next_sparrowhawk.append(player)
				Globals.players_counter[Player.ROLE_SPARROWHAWK] += 1
				# On initialise à 0 le compteur d'infections pour la manche en cours
				Globals.players[key]["last_round_infections"] = 0
			elif player.role == Player.ROLE_SPARROWHAWK:
				next_sparrowhawk.append(player)
				Globals.players_counter[Player.ROLE_SPARROWHAWK] += 1
				Globals.players[key]["last_round_infections"] = 0
			else:
				Globals.players_counter[Player.ROLE_SURVIVOR] += 1
		
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
		
		#timer_round.start()
		_update_players_labels()
		inputs_blocked = false

	else:
		_end_round()

func _end_round():
	print("Fin de la manche ", str(current_round))
	label_duree_manche.text = "0 s" # Ne pas bloquer le compteur à 1 sur l'affichage
	
	# Envoi d'un message au serveur pour bloquer les entrées
	ServerSocket.send_message_to_server({"type": "REQUEST_ROUND_END", "id": 0})
	inputs_blocked = true
	
	var last_round = \
		(current_round == max_round) || \
		(Globals.players_counter["total"] > 0 && Globals.players_counter[Player.ROLE_SURVIVOR] == 0)
	
	# Affichage de l'overlay de statistiques de la manche
	await _end_round_overlay()
	
	if !last_round:
		# Lancement de la prochaine manche
		_start_round()
	else:
		# Basculement vers l'écran de fin
		_end_game()		

func _end_game():
	print("Fin de la partie")
	get_tree().change_scene_to_file("res://ui/end_game.tscn")

func _on_room_created(_code: String, url_to_join: String):
	qr_code.data = url_to_join.to_upper() # In the QRCode addon, only uppercases characters are used

# Ne devrait plus être utilisé : un joueur n'est pas censé pouvoir rejoindre une partie commencée
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
	Globals.players.erase(id)
	if players_nodes.has(id):
		players_nodes[id].queue_free()
		players_nodes.erase(id)
		print("Player n°" + str(id) + " left.")

func _on_timer_bonus_timeout() -> void:
	var bonus = bonus_scene.instantiate()
	add_child(bonus)

func _on_player_signal_bonus(player_id: int, bonus_name: String):
	var data_to_send = {
		"type": "GET_BONUS",
		"id": player_id,
		"data": {
			"bonus": bonus_name
		}
	}
	
	ServerSocket.send_message_to_server(data_to_send)

func _on_role_changed(player_id: int, role: String) -> void:
	var player = players_nodes[player_id]
	player.set_role(role)
	var data_to_send = {
		"type": "SET_ROLE",
		"id": player_id,
		"data": {
			"role": role
		}
	}
	
	ServerSocket.send_message_to_server(data_to_send)

func _on_timer_round_timeout() -> void:
	# Les joueurs qui ne sont pas entrés en zone de sécurité deviennent infectés
	for player in players_nodes.values():
		if player.role == Player.ROLE_SURVIVOR && !player.is_safe:
			player.set_role(Player.ROLE_INFECTED)
	
	_end_round()

func _on_top_zone_area_2d_body_entered(body: Node2D) -> void:
	if dest_safe_zone == TOP_ZONE:
		var player = body as Player
		player.is_safe = true
		
		Globals.players_counter[Globals.SAFE_SURVIVORS] += 1
		_check_end_of_round()

func _on_top_zone_area_2d_body_exited(body: Node2D) -> void:
	if dest_safe_zone == TOP_ZONE:
		var player = body as Player
		player.is_safe = false
		
		Globals.players_counter[Globals.SAFE_SURVIVORS] -= 1

func _on_bottom_zone_area_2d_body_entered(body: Node2D) -> void:
	if dest_safe_zone == BOTTOM_ZONE:
		var player = body as Player
		player.is_safe = true
		
		Globals.players_counter[Globals.SAFE_SURVIVORS] += 1
		_check_end_of_round()
		
func _on_bottom_zone_area_2d_body_exited(body: Node2D) -> void:
	if dest_safe_zone == BOTTOM_ZONE:
		var player = body as Player
		player.is_safe = false
		
		Globals.players_counter[Globals.SAFE_SURVIVORS] -= 1

func _check_end_of_round():
	print(Globals.players_counter)
	#On vérifie si le nombre de survivant dans la zone est égale au nombre total de joueurs sans les infectés
	var total = Globals.players_counter["total"]
	var survivors = Globals.players_counter[Globals.SAFE_SURVIVORS]
	var infected = Globals.players_counter[Player.ROLE_INFECTED]
	var sparrowhawks = Globals.players_counter[Player.ROLE_SPARROWHAWK]
	
	if survivors == total - infected - sparrowhawks:
		_end_round()
		
func _on_player_infected(sparrowhawk_id: int, infected_id: int):
	#print("Un joueur a été infecté")
	#On décrémente le compteur de survivants et on incrémente le compteur d'infectés
	Globals.players_counter[Player.ROLE_INFECTED] += 1
	Globals.players_counter[Player.ROLE_SURVIVOR] -= 1
	
	# On incrémente le compteur d'infection pour l'épervier
	Globals.players[sparrowhawk_id]["infections"] += 1
	Globals.players[sparrowhawk_id]["last_round_infections"] += 1
	
	if Globals.players_counter[Player.ROLE_SURVIVOR] == 0:
		_end_round()
		print("Tous les joueurs ont été infectés : les éperviers sont vainqueurs.")
	
	_update_players_labels()
	
func _update_players_labels():
	label_nb_sparrowhawks.text = str(Globals.players_counter[Player.ROLE_SPARROWHAWK])
	label_nb_infected.text = str(Globals.players_counter[Player.ROLE_INFECTED])
	label_nb_survivors.text = str(Globals.players_counter[Player.ROLE_SURVIVOR])

func show_overlay(scene) -> Control:
	# On crée un CanvasLayer dynamiquement pour forcer le premier plan
	var canvas_layer = CanvasLayer.new()
	canvas_layer.name = "OverlayCanvas"
	
	canvas_layer.layer = 10 
	
	var overlay_instance = scene.instantiate() as Control
	
	overlay_instance.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	
	# On assemble la structure : Arène -> CanvasLayer -> Scène Control
	canvas_layer.add_child(overlay_instance)
	add_child(canvas_layer)
	
	return overlay_instance

func remove_overlay():
	var canvas = get_node_or_null("OverlayCanvas")
	if canvas:
		canvas.queue_free() # Supprime le CanvasLayer et la scène Control à l'intérieur

func _start_round_overlay():
	round_start_overlay = show_overlay(OVERLAY_SCENE_START_ROUND)
	ServerSocket.send_message_to_server({
		"type": "REQUEST_ROUND_START", "id": 0
	})
	
func _on_start_countdown():
	round_start_overlay.set_time(3)
	
func _on_countdown_tick(value: int):
	round_start_overlay.set_time(value)
	
func _on_round_start():
	round_start_overlay.set_time(0)
	round_start_overlay = null
	# Lancement du timer de la manche
	timer_round.start()

func _end_round_overlay():
	# Affichage de l'écran pendant 5 secondes puis suppression
	var round_end_overlay = show_overlay(OVERLAY_SCENE_END_ROUND)
	await get_tree().create_timer(5.0).timeout
	round_end_overlay.queue_free()
