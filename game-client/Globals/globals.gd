extends Node

var time_rounds = 0
var count_rounds = 0
var auto_button:bool

const SAFE_SURVIVORS = "safe_survivor"

#player_id: {
	#name: <player_name>,
	#infections: <nb_infection_player>
#}
var players = {}

var players_counter = {
	"total": 0,
	SAFE_SURVIVORS: 0,
	Player.ROLE_SURVIVOR: 0,
	Player.ROLE_INFECTED: 0,
	Player.ROLE_SPARROWHAWK: 0,
}

func _ready() -> void:
	if !OS.has_feature("web"):
		# Redimensionner la taille de la fenêtre
		DisplayServer.window_set_size(Vector2i(1280, 720))

		# Placer la fenêtre au centre de l'écran
		var screen_size = DisplayServer.screen_get_size()
		var window_size = DisplayServer.window_get_size()
		
		@warning_ignore("integer_division")
		DisplayServer.window_set_position(screen_size / 2 - window_size / 2)
