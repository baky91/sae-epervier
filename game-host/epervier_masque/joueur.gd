extends CharacterBody2D

#Vitesse du joueur
var vitesse = 100

func _physics_process(delta: float) -> void:
	#Flèches : droite, gauche, haut, bas
	var direction = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	
	#Si on appuie sur une touche
	if direction:
		#On définit la vitesse dans la direction
		velocity = direction * vitesse
	else:
		#Sinon, on s'arrete, vitesse à 0
		velocity = Vector2.ZERO
		
	#La fonction qui fait bouger le personnage sur GODOT
	move_and_slide()
