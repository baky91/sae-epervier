extends Node

var host_code: String = ""
var join_url: String = ""
var time_rounds = 0
var count_rounds = 0
var auto_nb_rounds: bool = true

const SAFE_SURVIVORS = "safe_survivor"

#player_id: {
	#name: <player_name>,
	#infections: <nb_infection_player>,
	#last_round_infections: <nb_infection_player>
#}
var players = {}

var players_counter = {
	"total": 0,
	SAFE_SURVIVORS: 0,
	Player.ROLE_SURVIVOR: 0,
	Player.ROLE_INFECTED: 0,
	Player.ROLE_SPARROWHAWK: 0,
}

var inputs_blocked = true

var last_round_number: int

func _ready() -> void:
	# Création de joueurs fictifs pour tester différents affichages
	#players[990] = {"name": "Player 990", "infections": 2, "last_round_infections": 0}
	#players[991] = {"name": "Player 991", "infections": 1, "last_round_infections": 0}
	#players[992] = {"name": "Player 992", "infections": 10, "last_round_infections": 4}
	#players[993] = {"name": "Player 993", "infections": 1, "last_round_infections": 2}
	#players[994] = {"name": "Player 994", "infections": 11, "last_round_infections": 7}
	#players[995] = {"name": "Player 995", "infections": 12, "last_round_infections": 2}
	#players[996] = {"name": "Player 996", "infections": 15, "last_round_infections": 3}
	#players[997] = {"name": "Player 997", "infections": 18, "last_round_infections": 2}
	#players[998] = {"name": "Player 998", "infections": 1, "last_round_infections": 5}
	#players[999] = {"name": "Player 999", "infections": 19, "last_round_infections": 0}
	
	if !OS.has_feature("web"):
		# Redimensionner la taille de la fenêtre
		DisplayServer.window_set_size(Vector2i(1280, 720))

		# Placer la fenêtre au centre de l'écran
		var screen_size = DisplayServer.screen_get_size()
		var window_size = DisplayServer.window_get_size()
		
		@warning_ignore("integer_division")
		DisplayServer.window_set_position(screen_size / 2 - window_size / 2)

func get_sorted_infections_leaderboard(col_name: String = "infections", nb_rows: int = 10):
	var players_array = []
	
	# Construction d'une liste de dictionnaire (clés: id, name, {col_name})
	for player_id in players:
		var player_data = players[player_id]
		players_array.append({
			"id": player_id,
			"name": player_data["name"],
			col_name: player_data[col_name]
		})
	
	# Trie personnalisé de la liste
	players_array.sort_custom(func(a, b): return a[col_name] > b[col_name])
	players_array.resize(nb_rows)
	
	return players_array
	
