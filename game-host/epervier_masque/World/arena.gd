extends Node2D

var player_scene = preload("res://Player/player.tscn")

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
	
	players_nodes[id] = player
	
	$Players.add_child(player)

func _on_player_use_bonus(id: int, bonus: String):
	print("Le joueur " + str(id) + " a utilisé le bonus " + bonus)

	var player = $Players.get_node(str(id))

	if bonus == "speed":
		# Appliquer un boost de vitesse de 50% durant 5 secondes
		var initialSpeed = player.speed
		player.speed *= 1.5
		#player.set_color(Player.COLOR_RED)
		# Créer un timer de 5 secondes
		await get_tree().create_timer(5.0).timeout
		player.speed = initialSpeed # On remet la vitesse initiale
	else: # Bonus Dash
		var initialSpeed = player.speed
		player.speed *= 2
		
		# Créer un timer de 1 secondes
		await get_tree().create_timer(1.0).timeout
		player.speed = initialSpeed # On remet la vitesse de base

func _on_player_left(id: int):
	if players_nodes.has(id):
		players_nodes[id].queue_free()
		players_nodes.erase(id)
		print("Player n°" + str(id) + " left.")
