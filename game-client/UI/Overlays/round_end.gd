extends Control

@onready var survivors_count: Label = $MarginContainer/VBoxMain/HBoxStatsTop/VBoxSurvivors/SurvivorsCount
@onready var infected_count: Label = $MarginContainer/VBoxMain/HBoxStatsTop/VBoxInfected/InfectedCount
@onready var sparrowhawks_count: Label = $MarginContainer/VBoxMain/HBoxStatsTop/VBoxSparrowhawks/SparrowhawksCount


func _ready() -> void:
	# Afficher le nombre de survivants restants
	survivors_count.text = str(Globals.players_counter[Player.ROLE_SURVIVOR])
	
	# Afficher le nombre d'infectés
	infected_count.text = str(Globals.players_counter[Player.ROLE_INFECTED])
	
	# Afficher le nombre d'éperviers
	sparrowhawks_count.text = str(Globals.players_counter[Player.ROLE_SPARROWHAWK])
	
	# Afficher la liste des joueurs infectés
	
	# Afficher les 10 premiers éperviers en nombre d'infection
	
	pass # Replace with function body.
