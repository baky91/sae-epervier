extends Node

@onready var v_box_leaderboard: VBoxContainer = $MarginContainer/VBoxMain/ZoneInfecteurs/MarginContainer/PanelListe/MarginListe/VBoxMain/ScrollContainer/VBoxLeaderboard
const TOP_INFECTIONS_ITEM = preload("res://UI/top_infections_item.tscn")
const MAX_LINE_LEADERBOARD = 10

func _ready() -> void:
	# Afficher le nombre de survivants restants
	
	# Afficher le nombre d'éperviers (ne pas compter les joueurs infectés lors de la dernière manche)
	
	# Afficher les 10 premiers éperviers en nombre d'infection
	var rank = 1
	for player_id in Globals.players:
		if rank <= MAX_LINE_LEADERBOARD:
			if Globals.players[player_id]["infections"] > 0:
				var lb_item = TOP_INFECTIONS_ITEM.instantiate()
				var name = Globals.players[player_id]["name"] + " (" + str(player_id) + ")"
				lb_item.set_values(rank, name, Globals.players[player_id]["infections"])
				v_box_leaderboard.add_child(lb_item)
				rank += 1
