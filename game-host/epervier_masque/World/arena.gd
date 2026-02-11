extends Node2D

@onready var players_container = $PlayersContainer
var player_scene = preload("res://Player/player.tscn")

func _ready():
	Server.player_connected.connect(_on_server_player_connected)

func _on_server_player_connected(id: int, name: String):
	print("Player joined")
	var new_player = player_scene.instantiate()
	new_player.name = str(id)
	new_player._id = id
	
	players_container.add_child(new_player)
	
	# Position aléatoire du joueur
	new_player.global_position = Vector2(randf_range(100, 500), randf_range(100, 500))

func _on_safe_zone_top_body_entered(body):
	if body is Player:
		body.set_safe(true) # On imagine une fonction dans ton script Player
		print("Le joueur ", body._id, " est en sécurité !")

func _on_safe_zone_top_body_exited(body):
	if body is Player:
		body.set_safe(false)
		print("Le joueur ", body._id, " sort de la base.")
