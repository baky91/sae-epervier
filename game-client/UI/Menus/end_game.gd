extends Control

@onready var label_manche: Label = $MarginContainer/VBoxMain/ZoneTitre/LabelManche
@onready var label_victoire: Label = $MarginContainer/VBoxMain/ZoneTitre/LabelVictoire
@onready var valeur_survivants: Label = $MarginContainer/VBoxMain/ZoneStats/SurvivantsCol/ValeurSurvivants
@onready var valeur_eperviers: Label = $MarginContainer/VBoxMain/ZoneStats/EperviersCol/ValeurEperviers
@onready var v_box_leaderboard: VBoxContainer = $MarginContainer/VBoxMain/ZoneInfecteurs/MarginContainer/PanelListe/MarginListe/VBoxMain/ScrollContainer/VBoxLeaderboard
const TOP_INFECTIONS_ITEM = preload("res://UI/top_infections_item.tscn")
const MAX_LINE_LEADERBOARD = 10

func _ready() -> void:
	# Afficher le nombre de manches effectuées
	label_manche.text = "Manche Finale : " + str(Globals.last_round_number)
	
	# Afficher le nombre de survivants restants
	var survivors_left = Globals.players_counter[Player.ROLE_SURVIVOR]
	valeur_survivants.text = str(survivors_left)
	
	# Afficher le nombre d'éperviers (ne pas compter les joueurs infectés lors de la dernière manche)
	var sparrowhawks_left = Globals.players_counter[Player.ROLE_SPARROWHAWK]
	valeur_eperviers.text = str(sparrowhawks_left)
	
	# Déterminer le camp vainqueur
	if survivors_left <= 0:
		label_victoire.text = "VICTOIRE DES ÉPERVIERS"
	else:
		label_victoire.text = "VICTOIRE DES SURVIVANTS"
	
	# Afficher les 10 premiers éperviers en nombre d'infection
	var leaderboard_data = Globals.get_sorted_infections_leaderboard("infections", MAX_LINE_LEADERBOARD)
	var rank = 1
	
	for player_data in leaderboard_data:
		var p_id = player_data["id"]
		var p_name = player_data["name"]
		var p_infections = player_data["infections"]
		
		if p_infections > 0:
			var lb_item = TOP_INFECTIONS_ITEM.instantiate()
			v_box_leaderboard.add_child(lb_item)
			lb_item.set_values(
				rank,
				p_name + " (" + str(p_id) + ")",
				p_infections
			)
			
			rank += 1
	
