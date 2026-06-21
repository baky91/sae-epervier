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
	if survivors_left <= 0 and sparrowhawks_left > 0:
		label_victoire.text = "VICTOIRE DES ÉPERVIERS"
		label_victoire.label_settings.font_color = "#ed382e"
	else:
		label_victoire.text = "VICTOIRE DES SURVIVANTS"
		label_victoire.label_settings.font_color = "#2e8aed"
	
	# Afficher les 10 premiers éperviers en nombre d'infection
	var leaderboard_data = Globals.get_sorted_infections_leaderboard("infections", MAX_LINE_LEADERBOARD)
	var rank = 1
	
	for player_data in leaderboard_data:
		if not player_data:
			break
			
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

func _on_button_nouvelle_partie_pressed() -> void:
	# Envoie du message au serveur pour demander si le joueur souhaite relancer
	ServerSocket.send_message_to_server({
		"type": "RESTART_GAME",
		"id": 0
	})
	
	# Nettoyage : vider la liste des joueurs
	Globals.players.clear()
	
	# Nettoyage : remettre les compteurs à zéro
	Globals.players_counter = {
		"total": 0,
		Globals.SAFE_SURVIVORS: 0,
		Player.ROLE_SURVIVOR: 0,
		Player.ROLE_INFECTED: 0,
		Player.ROLE_SPARROWHAWK: 0
	}
	
	# Basculement vers l'écran principal
	get_tree().change_scene_to_file("res://UI/Menus/mainui.tscn")
