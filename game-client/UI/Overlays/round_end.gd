extends Control

@onready var v_box_infected_list: VBoxContainer = $MarginContainer/VBoxMain/HBoxLists/LeftContainer/MarginLeft/VBoxLeft/ScrollInfected/VBoxInfectedList
@onready var v_box_leaderboard: VBoxContainer = $MarginContainer/VBoxMain/HBoxLists/RightContainer/MarginRight/VBoxRight/VBoxMain/ScrollContainer/VBoxLeaderboard
@onready var survivors_count: Label = $MarginContainer/VBoxMain/HBoxStatsTop/VBoxSurvivors/SurvivorsCount
@onready var infected_count: Label = $MarginContainer/VBoxMain/HBoxStatsTop/VBoxInfected/InfectedCount
@onready var sparrowhawks_count: Label = $MarginContainer/VBoxMain/HBoxStatsTop/VBoxSparrowhawks/SparrowhawksCount
const TOP_INFECTIONS_ITEM = preload("res://UI/top_infections_item.tscn")
const INFECTED_LABEL = preload("res://UI/label_infected.tscn")
const MAX_LINE_LEADERBOARD = 5

func _ready() -> void:
	#print("Overlay de fin de manche")
	# Afficher le nombre de survivants restants
	survivors_count.text = str(Globals.players_counter[Player.ROLE_SURVIVOR])
	
	# Afficher le nombre d'infectés
	infected_count.text = str(Globals.players_counter[Player.ROLE_INFECTED])
	
	# Afficher le nombre d'éperviers
	sparrowhawks_count.text = str(Globals.players_counter[Player.ROLE_SPARROWHAWK])
	
	# Afficher la liste des joueurs infectés
	for player_id in Globals.players:
		var player = Globals.players[player_id]
		
		if player["is_infected"]:
			var inf_label = INFECTED_LABEL.instantiate()
			inf_label.text = player["name"] + " (" + str(player_id) + ")"
			v_box_infected_list.add_child(inf_label)
			
	# Afficher les 10 premiers éperviers en nombre d'infection
	var leaderboard_data = Globals.get_sorted_infections_leaderboard("last_round_infections", MAX_LINE_LEADERBOARD)
	#print(leaderboard_data)
	var rank = 1
	
	for player_data in leaderboard_data:
		if not player_data:
			break
		
		var p_id = player_data["id"]
		var p_name = player_data["name"]
		var p_infections = player_data["last_round_infections"]
		
		if p_infections > 0:
			var lb_item = TOP_INFECTIONS_ITEM.instantiate()
			v_box_leaderboard.add_child(lb_item)
			lb_item.set_values(
				rank,
				p_name + " (" + str(p_id) + ")",
				p_infections
			)
			
			rank += 1
