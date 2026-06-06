extends Control

@onready var v_box_list: VBoxContainer = $MarginContainer/VBoxMain/HBoxLists/RightContainer/MarginRight/VBoxRight/VBoxMain/ScrollContainer/VBoxList
@onready var survivors_count: Label = $MarginContainer/VBoxMain/HBoxStatsTop/VBoxSurvivors/SurvivorsCount
@onready var infected_count: Label = $MarginContainer/VBoxMain/HBoxStatsTop/VBoxInfected/InfectedCount
@onready var sparrowhawks_count: Label = $MarginContainer/VBoxMain/HBoxStatsTop/VBoxSparrowhawks/SparrowhawksCount
const TOP_INFECTIONS_ITEM = preload("res://UI/top_infections_item.tscn")
const MAX_LINE_LEADERBOARD = 5

func _ready() -> void:
	# Afficher le nombre de survivants restants
	survivors_count.text = str(Globals.players_counter[Player.ROLE_SURVIVOR])
	
	# Afficher le nombre d'infectés
	infected_count.text = str(Globals.players_counter[Player.ROLE_INFECTED])
	
	# Afficher le nombre d'éperviers
	sparrowhawks_count.text = str(Globals.players_counter[Player.ROLE_SPARROWHAWK])
	
	# Afficher la liste des joueurs infectés
	
	# Afficher les 10 premiers éperviers en nombre d'infection
	var rank = 1
	for player_id in Globals.players:
		if rank <= MAX_LINE_LEADERBOARD:
			if Globals.players[player_id]["last_round_infections"] > 0:
				var lb_item = TOP_INFECTIONS_ITEM.instantiate()
				v_box_list.add_child(lb_item)
				
				var p_name = Globals.players[player_id]["name"] + " (" + str(player_id) + ")"
				lb_item.set_values(rank, p_name, Globals.players[player_id]["last_round_infections"])
				print(v_box_list)
				print(lb_item.label_name.text)
				rank += 1
