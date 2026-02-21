extends Node2D

var player_scene = preload("res://Player/player.tscn")
var bonus_scene = preload("res://World/bonus.tscn")

var players_nodes = {}

func _ready() -> void:
	ServerSocket.player_connected.connect(_on_player_connected)
	ServerSocket.player_use_bonus.connect(_on_player_use_bonus)
	ServerSocket.player_left.connect(_on_player_left)

# Position update of all players
func _physics_process(_delta):
	for id in ServerSocket.players_inputs_buffer:
		if players_nodes.has(id):
			var player_node = players_nodes[id]
			var vector_move = ServerSocket.players_inputs_buffer[id]
			player_node.direction = vector_move
			
			#player_node.direction = player_node.direction.lerp(vector_move, 0.2)


func _on_player_connected(id: int, p_name: String) -> void:
	print("New player joined : " + p_name + " (ID: " + str(id) + ")")
	var player = player_scene.instantiate()
	player.name = str(id)
	player.id = id
	player.global_position = Vector2(randf_range(100, 500), randf_range(100, 500))
	player.set_label(str(id))
	player.get_bonus.connect(_on_player_signal_bonus)
	player.new_role.connect(_on_role_changed)
	
	players_nodes[id] = player
	
	# à supprimer plus tard, définition d'un rôle d'épervier pour tester les collisions
	if id == 2:
		player.role = Player.ROLE_SPARROWHAWK
	else:
		player.role = Player.ROLE_SURVIVOR
	
	player.new_role.emit(player.id, player.role)
	
	$Players.add_child(player)

func _on_player_use_bonus(id: int, bonus: String):
	print("Le joueur " + str(id) + " a utilisé le bonus " + bonus)

	var player = $Players.get_node(str(id))

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
